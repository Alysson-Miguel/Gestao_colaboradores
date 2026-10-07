const { google } = require("googleapis");

/* =====================================================
   Leitura ao vivo do check-in/check-out de packing (scanner —
   sistema externo). Usa a aba "Assignment History" em vez de
   "Workstation": a Workstation só guarda a sessão mais recente por
   pessoa/estação e fica rapidamente desatualizada (confirmado: num
   mesmo instante, Workstation mostrava 16 sessões ativas contra 37
   da Assignment History, perdendo quase todo mundo logado na
   Esteira U). Assignment History é um log append-only (1 linha por
   check-in, check_out_time preenchido na mesma linha ao encerrar) —
   mesma regra de "ativo" (check_out_time vazio), só que completa.
   Mesmo padrão de auth de googleSheetsMetaProducao.service.js.
===================================================== */

const WORKSTATION_SPREADSHEET_ID = "1T3zq6DtiF--pZjeYFzSo9i-EDEBXIN0yx8VcxsMcXZY";
const SHEET_ASSIGNMENT_HISTORY = "Assignment History";
const CACHE_TTL = 20 * 1000; // 20s — tela faz polling a cada 20s

let cache = null;
let cacheTs = null;

function isCacheValid() {
  return cache && cacheTs && Date.now() - cacheTs < CACHE_TTL;
}

function limparCache() {
  cache = null;
  cacheTs = null;
}

function getClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_CLIENT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  return google.sheets({ version: "v4", auth, retry: false });
}

function pad2(n) {
  return n < 10 ? "0" + n : String(n);
}

function normalizeOpsId(value) {
  return String(value || "").trim().toLowerCase();
}

/**
 * Mapeamento braço/lado -> código de estação física, por esteira.
 * Confirmado contra dados reais da planilha ao vivo e com o usuário:
 * P2_AU = Esteira U lado A, P1_AU = Esteira U lado B, P1_TE = Esteira
 * Termoplástica, P4_AU = Esteira Linear, P3_AU (01-20) = Esteira FULL.
 */
const WORKSTATION_MAPPINGS = {
  "Esteira U": {
    armCount: 15,
    ladoA: (arm) => "P2_AU" + pad2(arm),
    ladoB: (arm) => (arm === 1 ? null : "P1_AU" + pad2(16 - arm)),
  },
  "Esteira Linear": {
    armCount: 10,
    ladoA: (arm) => "P4_AU" + pad2(arm),
    ladoB: (arm) => "P4_AU" + pad2(10 + arm),
  },
  "Esteira Termoplástica": {
    armCount: 7,
    ladoA: (arm) => "P1_TE" + pad2(arm),
    ladoB: (arm) => "P1_TE" + pad2(7 + arm),
  },
  "Esteira FULL": {
    armCount: 10,
    ladoA: (arm) => "P3_AU" + pad2(arm),
    ladoB: (arm) => "P3_AU" + pad2(10 + arm),
  },
};

// "FULL D+1" não é um grid de braços — é um código único (PacEst-AZU01)
// compartilhado por dezenas de pessoas ao longo do dia (confirmado nos dados
// reais: múltiplas sessões concorrentes no mesmo código). Tratado como pool
// de headcount, não como posições individuais.
const CODIGO_FULL_D1 = "PacEst-AZU01";

async function lerSessoesAtivas_() {
  if (isCacheValid()) return cache;

  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: WORKSTATION_SPREADSHEET_ID,
    // id, workstation_id, workstation_name, biz_workstation_id, workstation,
    // ops_id, ops_name, date, check_in_time, check_out_time
    range: `${SHEET_ASSIGNMENT_HISTORY}!A:J`,
    valueRenderOption: "FORMATTED_VALUE",
  });

  const rows = res.data.values || [];
  const sessoes = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const checkOut = row[9];
    if (checkOut) continue; // sessão já encerrada

    const opsId = row[5];
    const codigoEstacao = row[2];
    if (!opsId || !codigoEstacao) continue;

    sessoes.push({
      opsId,
      nome: row[6] || null,
      codigoEstacao,
      checkIn: row[8] || null,
    });
  }

  cache = sessoes;
  cacheTs = Date.now();
  return sessoes;
}

/**
 * Retorna quem está logado agora em cada braço/lado da esteira, segundo a
 * Assignment History. Mais de uma pessoa pode estar logada no mesmo
 * código ao mesmo tempo (confirmado nos dados reais) — por isso cada
 * braço/lado traz a LISTA inteira de pessoas, não só uma. Esteiras fora de
 * WORKSTATION_MAPPINGS (sem auto-alocação) retornam [].
 */
async function getAutoAlocacoesEsteira(nomeEsteira) {
  const mapping = WORKSTATION_MAPPINGS[nomeEsteira];
  if (!mapping) return [];

  const sessoes = await lerSessoesAtivas_();
  const porCodigo = new Map();
  sessoes.forEach((s) => {
    if (!porCodigo.has(s.codigoEstacao)) porCodigo.set(s.codigoEstacao, []);
    porCodigo.get(s.codigoEstacao).push(s);
  });

  const resultado = [];
  for (let arm = 1; arm <= mapping.armCount; arm++) {
    [
      { lado: "A", codigo: mapping.ladoA(arm) },
      { lado: "B", codigo: mapping.ladoB(arm) },
    ].forEach(({ lado, codigo }) => {
      if (!codigo) return;
      const pessoas = porCodigo.get(codigo);
      if (!pessoas || pessoas.length === 0) return;
      resultado.push({ braco: arm, lado, codigoEstacao: codigo, pessoas });
    });
  }

  return resultado;
}

async function getPessoasAtivasFullD1() {
  const sessoes = await lerSessoesAtivas_();
  return sessoes
    .filter((s) => s.codigoEstacao === CODIGO_FULL_D1)
    .map((s) => ({ opsId: s.opsId, nome: s.nome, checkIn: s.checkIn }));
}

/**
 * Onde cada pessoa está logada AGORA na Workstation (packing automático).
 * Map opsId (minúsculo) -> { esteira, braco, lado, local }. FULL D+1 conta como a Esteira FULL
 * (mesma esteira C); códigos fora do mapeamento (outros setores) não entram.
 */
async function getLocaisAutomaticosPorOps(opsIds) {
  const alvo = new Set(opsIds.map(normalizeOpsId));
  const sessoes = (await lerSessoesAtivas_()).filter((s) => alvo.has(normalizeOpsId(s.opsId)));
  if (!sessoes.length) return new Map();

  const porCodigo = new Map();
  Object.entries(WORKSTATION_MAPPINGS).forEach(([esteira, m]) => {
    for (let arm = 1; arm <= m.armCount; arm++) {
      [["A", m.ladoA(arm)], ["B", m.ladoB(arm)]].forEach(([lado, codigo]) => {
        if (codigo) porCodigo.set(codigo, { esteira, braco: arm, lado, local: `${esteira} · Braço ${arm}${lado}` });
      });
    }
  });

  const resultado = new Map();
  sessoes.forEach((sessao) => {
    const local =
      sessao.codigoEstacao === CODIGO_FULL_D1
        ? { esteira: "Esteira FULL", braco: null, lado: null, local: "FULL D+1" }
        : porCodigo.get(sessao.codigoEstacao);
    if (local) resultado.set(normalizeOpsId(sessao.opsId), local);
  });
  return resultado;
}

/** Todos os códigos de workstation (ambos os lados, todos os braços) de uma esteira mapeada. */
function codigosDaEsteira(nomeEsteira) {
  const mapping = WORKSTATION_MAPPINGS[nomeEsteira];
  if (!mapping) return [];
  const codigos = [];
  for (let arm = 1; arm <= mapping.armCount; arm++) {
    const a = mapping.ladoA(arm);
    const b = mapping.ladoB(arm);
    if (a) codigos.push(a);
    if (b) codigos.push(b);
  }
  return codigos;
}

module.exports = {
  getAutoAlocacoesEsteira,
  getLocaisAutomaticosPorOps,
  getPessoasAtivasFullD1,
  codigosDaEsteira,
  limparCache,
  normalizeOpsId,
  WORKSTATION_MAPPINGS,
};
