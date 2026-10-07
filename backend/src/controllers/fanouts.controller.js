const { prisma } = require("../config/database");
const { successResponse, errorResponse, notFoundResponse } = require("../utils/response");

/* =====================================================
   FANOUTS por braço/lado (esteiras) e por posição (Setup D+1).
   - Esteiras: coluna mapa_esteira_braco.fanouts.
   - Setup D+1 (pool sem braços): tabela mapa_setup_fanout, posições numeradas, só lado A.
   Toda alteração grava histórico (quem, antes, depois). Leitura: liderança também;
   escrita: só Admin e Alta Gestão (decidido nas rotas).
===================================================== */

const ESCOPO_ESTEIRA = "ESTEIRA";
const ESCOPO_SETUP = "SETUP_D1";
const POSICOES_SETUP_MINIMAS = 5;
const MAX_POSICAO_SETUP = 20;
const MAX_POR_POSICAO = 30;
const FORMATO_CODIGO = /^[A-Z0-9][A-Z0-9&_./-]{1,23}$/;
// Posição alterada há menos disso pede confirmação antes de mexer de novo (evita sobrescrever o colega).
const JANELA_ALTERACAO_RECENTE_MS = 60 * 60 * 1000;

/** Maiúsculas, sem repetidos, "-" (sem fanout) ignorado. Devolve { codigos } ou { erro }. */
function normalizarCodigos(entrada) {
  if (!Array.isArray(entrada)) return { erro: "Informe a lista de fanouts." };
  const vistos = new Set();
  const codigos = [];
  for (const bruto of entrada) {
    const codigo = String(bruto ?? "").trim().toUpperCase().replace(/\s+/g, "");
    if (!codigo || codigo === "-") continue;
    if (!FORMATO_CODIGO.test(codigo)) {
      return { erro: `Fanout inválido: "${String(bruto).trim().slice(0, 30)}". Use letras, números e - (ex.: LPE-11, J&T).` };
    }
    if (!vistos.has(codigo)) {
      vistos.add(codigo);
      codigos.push(codigo);
    }
  }
  if (codigos.length > MAX_POR_POSICAO) return { erro: `No máximo ${MAX_POR_POSICAO} fanouts por posição.` };
  return { codigos };
}

const rotuloPosicao = (escopo, braco, lado) => (escopo === ESCOPO_SETUP ? `Posição ${braco}` : `Braço ${braco}${lado}`);
const mesmaLista = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

async function resolverEscopo(idEstacao, origem) {
  const escopo = origem.escopo === ESCOPO_SETUP ? ESCOPO_SETUP : ESCOPO_ESTEIRA;
  if (escopo === ESCOPO_SETUP) return { escopo, esteira: null };
  const esteira = await prisma.mapaEsteira.findFirst({ where: { idEsteira: Number(origem.idEsteira), idEstacao } });
  return { escopo, esteira };
}

function validarPosicao(escopo, braco, lado) {
  const b = Number(braco);
  const l = String(lado || "").toUpperCase();
  if (!Number.isInteger(b) || b < 1) return { erro: "Braço inválido." };
  if (!["A", "B"].includes(l)) return { erro: "Lado inválido." };
  if (escopo === ESCOPO_SETUP && (l !== "A" || b > MAX_POSICAO_SETUP)) return { erro: "O Setup D+1 só tem o lado A." };
  return { braco: b, lado: l };
}

/** Lê os fanouts de uma posição (dentro ou fora de transação). */
async function lerPosicao(tx, { idEstacao, escopo, esteira, braco, lado }) {
  if (escopo === ESCOPO_SETUP) {
    const r = await tx.mapaSetupFanout.findUnique({ where: { idEstacao_posicao: { idEstacao, posicao: braco } } });
    return { existe: true, fanouts: r?.fanouts ?? [] };
  }
  const r = await tx.mapaEsteiraBraco.findFirst({ where: { idEsteira: esteira.idEsteira, numero: braco, lado } });
  return { existe: !!r, habilitado: r?.habilitado, fanouts: r?.fanouts ?? [] };
}

async function gravarPosicao(tx, { idEstacao, escopo, esteira, braco, lado }, fanouts) {
  if (escopo === ESCOPO_SETUP) {
    await tx.mapaSetupFanout.upsert({
      where: { idEstacao_posicao: { idEstacao, posicao: braco } },
      create: { idEstacao, posicao: braco, fanouts },
      update: { fanouts },
    });
    return;
  }
  await tx.mapaEsteiraBraco.updateMany({ where: { idEsteira: esteira.idEsteira, numero: braco, lado }, data: { fanouts } });
}

/**
 * Última alteração dentro da janela de 1 hora (a carga inicial não conta: não é trabalho de ninguém).
 * Devolve { em, por, minutos } ou null.
 */
async function alteracaoRecente(tx, { idEstacao, escopo, esteira, braco, lado }) {
  const limite = new Date(Date.now() - JANELA_ALTERACAO_RECENTE_MS);
  const h = await tx.mapaFanoutHistorico.findFirst({
    where: { idEstacao, escopo, idEsteira: esteira?.idEsteira ?? null, braco, lado, acao: { not: "CARGA_INICIAL" }, criadoEm: { gte: limite } },
    orderBy: { criadoEm: "desc" },
  });
  return h ? { em: h.criadoEm, por: h.usuarioNome || "outro usuário", minutos: Math.max(Math.round((Date.now() - h.criadoEm.getTime()) / 60000), 0) } : null;
}

const haQuanto = (min) => (min < 1 ? "agora há pouco" : min === 1 ? "há 1 minuto" : `há ${min} minutos`);

function mensagemRecente(itens) {
  const linhas = itens.map(({ rotulo, r }) => `${rotulo}: alterado ${haQuanto(r.minutos)} por ${r.por}`);
  return `${linhas.join("\n")}\n\nConfirma alterar de novo?`;
}

const registrar = (tx, ctx, req, acao, antes, depois) =>
  tx.mapaFanoutHistorico.create({
    data: {
      idEstacao: ctx.idEstacao,
      escopo: ctx.escopo,
      idEsteira: ctx.esteira?.idEsteira ?? null,
      braco: ctx.braco,
      lado: ctx.lado,
      acao,
      antes,
      depois,
      usuarioId: req.user?.id ?? null,
      usuarioNome: req.user?.name ?? null,
    },
  });

/* ---------- leitura ---------- */

const listarFanouts = async (req, res) => {
  try {
    const idEstacao = req.dbContext?.estacaoId ?? 1;
    const { escopo, esteira } = await resolverEscopo(idEstacao, req.query);

    const recentes = await mapaDeAlteracoesRecentes(idEstacao, escopo, esteira);
    const recente = (braco, lado) => recentes.get(`${braco}-${lado}`) ?? null;

    if (escopo === ESCOPO_SETUP) {
      const linhas = await prisma.mapaSetupFanout.findMany({ where: { idEstacao }, orderBy: { posicao: "asc" } });
      const porPosicao = new Map(linhas.map((l) => [l.posicao, l.fanouts]));
      const total = Math.max(POSICOES_SETUP_MINIMAS, ...linhas.map((l) => l.posicao));
      const posicoes = Array.from({ length: total }, (_, i) => ({ braco: i + 1, lado: "A", habilitado: true, fanouts: porPosicao.get(i + 1) ?? [], ultimaAlteracao: recente(i + 1, "A") }));
      return successResponse(res, { escopo, idEsteira: null, nome: "Setup D+1", posicoes, totais: totais(posicoes) });
    }

    if (!esteira) return notFoundResponse(res, "Esteira não encontrada");
    const bracos = await prisma.mapaEsteiraBraco.findMany({ where: { idEsteira: esteira.idEsteira }, orderBy: [{ numero: "asc" }, { lado: "asc" }] });
    const posicoes = bracos.map((b) => ({ braco: b.numero, lado: b.lado, habilitado: b.habilitado, fanouts: b.fanouts, ultimaAlteracao: recente(b.numero, b.lado) }));
    return successResponse(res, { escopo, idEsteira: esteira.idEsteira, nome: esteira.nome, posicoes, totais: totais(posicoes) });
  } catch (err) {
    console.error("❌ Erro ao listar fanouts:", err);
    return errorResponse(res, "Erro ao listar fanouts", 500);
  }
};

/** Mapa "braço-lado" -> última alteração dentro da última hora (para sinalizar na tela). */
async function mapaDeAlteracoesRecentes(idEstacao, escopo, esteira) {
  const limite = new Date(Date.now() - JANELA_ALTERACAO_RECENTE_MS);
  const linhas = await prisma.mapaFanoutHistorico.findMany({
    where: { idEstacao, escopo, idEsteira: esteira?.idEsteira ?? null, acao: { not: "CARGA_INICIAL" }, criadoEm: { gte: limite } },
    orderBy: { criadoEm: "desc" },
  });
  const mapa = new Map();
  for (const h of linhas) {
    const chave = `${h.braco}-${h.lado}`;
    if (!mapa.has(chave)) mapa.set(chave, { em: h.criadoEm, por: h.usuarioNome || "outro usuário", minutos: Math.max(Math.round((Date.now() - h.criadoEm.getTime()) / 60000), 0) });
  }
  return mapa;
}

function totais(posicoes) {
  const distintos = new Set();
  posicoes.forEach((p) => p.fanouts.forEach((f) => distintos.add(f)));
  return {
    posicoes: posicoes.length,
    comFanout: posicoes.filter((p) => p.fanouts.length > 0).length,
    semFanout: posicoes.filter((p) => p.fanouts.length === 0).length,
    fanoutsDistintos: distintos.size,
  };
}

const listarHistorico = async (req, res) => {
  try {
    const idEstacao = req.dbContext?.estacaoId ?? 1;
    const { escopo, esteira } = await resolverEscopo(idEstacao, req.query);
    if (escopo === ESCOPO_ESTEIRA && !esteira) return notFoundResponse(res, "Esteira não encontrada");
    const limite = Math.min(Math.max(Number(req.query.limit) || 40, 1), 200);

    const linhas = await prisma.mapaFanoutHistorico.findMany({
      where: { idEstacao, escopo, ...(esteira ? { idEsteira: esteira.idEsteira } : {}) },
      orderBy: { criadoEm: "desc" },
      take: limite,
    });
    return successResponse(res, linhas);
  } catch (err) {
    console.error("❌ Erro ao listar histórico de fanouts:", err);
    return errorResponse(res, "Erro ao listar histórico", 500);
  }
};

/* ---------- escrita (Admin e Alta Gestão) ---------- */

const salvarPosicao = async (req, res) => {
  try {
    const idEstacao = req.dbContext?.estacaoId ?? 1;
    const { escopo, esteira } = await resolverEscopo(idEstacao, req.body);
    if (escopo === ESCOPO_ESTEIRA && !esteira) return notFoundResponse(res, "Esteira não encontrada");

    const pos = validarPosicao(escopo, req.body.braco, req.body.lado);
    if (pos.erro) return errorResponse(res, pos.erro, 400);
    const { codigos, erro } = normalizarCodigos(req.body.fanouts);
    if (erro) return errorResponse(res, erro, 400);

    const ctx = { idEstacao, escopo, esteira, braco: pos.braco, lado: pos.lado };
    const resultado = await prisma.$transaction(async (tx) => {
      const atual = await lerPosicao(tx, ctx);
      if (!atual.existe) return { naoEncontrado: true };
      if (mesmaLista(atual.fanouts, codigos)) return { fanouts: codigos, semMudanca: true };
      const recente = await alteracaoRecente(tx, ctx);
      if (recente && !req.body.confirmarAlteracaoRecente) {
        return { recente: mensagemRecente([{ rotulo: rotuloPosicao(escopo, pos.braco, pos.lado), r: recente }]) };
      }
      await gravarPosicao(tx, ctx, codigos);
      await registrar(tx, ctx, req, "EDICAO", atual.fanouts, codigos);
      return { fanouts: codigos };
    });
    if (resultado.naoEncontrado) return notFoundResponse(res, "Braço não encontrado nesta esteira");
    if (resultado.recente) return errorResponse(res, resultado.recente, 409, { codigo: "ALTERADO_RECENTEMENTE" });

    return successResponse(
      res,
      { braco: pos.braco, lado: pos.lado, fanouts: resultado.fanouts },
      resultado.semMudanca ? "Nada mudou" : "Fanouts atualizados"
    );
  } catch (err) {
    console.error("❌ Erro ao salvar fanouts:", err);
    return errorResponse(res, "Erro ao salvar fanouts", 500);
  }
};

/** Balanceamento: leva fanouts de uma posição para outra do mesmo conjunto, de forma atômica. */
const moverFanouts = async (req, res) => {
  try {
    const idEstacao = req.dbContext?.estacaoId ?? 1;
    const { escopo, esteira } = await resolverEscopo(idEstacao, req.body);
    if (escopo === ESCOPO_ESTEIRA && !esteira) return notFoundResponse(res, "Esteira não encontrada");

    const de = validarPosicao(escopo, req.body.de?.braco, req.body.de?.lado);
    const para = validarPosicao(escopo, req.body.para?.braco, req.body.para?.lado);
    if (de.erro || para.erro) return errorResponse(res, de.erro || para.erro, 400);
    if (de.braco === para.braco && de.lado === para.lado) return errorResponse(res, "Escolha uma posição de destino diferente.", 400);
    const { codigos, erro } = normalizarCodigos(req.body.fanouts);
    if (erro) return errorResponse(res, erro, 400);
    if (!codigos.length) return errorResponse(res, "Selecione ao menos um fanout para mover.", 400);

    const ctxDe = { idEstacao, escopo, esteira, braco: de.braco, lado: de.lado };
    const ctxPara = { idEstacao, escopo, esteira, braco: para.braco, lado: para.lado };

    const r = await prisma.$transaction(async (tx) => {
      const origem = await lerPosicao(tx, ctxDe);
      const destino = await lerPosicao(tx, ctxPara);
      if (!origem.existe || !destino.existe) return { erro: "Braço não encontrado nesta esteira", status: 404 };
      const ausentes = codigos.filter((c) => !origem.fanouts.includes(c));
      if (ausentes.length) return { erro: `${ausentes.join(", ")} não está mais na origem. Atualize a tela.`, status: 409 };

      if (!req.body.confirmarAlteracaoRecente) {
        const itens = [];
        const rDe = await alteracaoRecente(tx, ctxDe);
        const rPara = await alteracaoRecente(tx, ctxPara);
        if (rDe) itens.push({ rotulo: rotuloPosicao(escopo, de.braco, de.lado), r: rDe });
        if (rPara) itens.push({ rotulo: rotuloPosicao(escopo, para.braco, para.lado), r: rPara });
        if (itens.length) return { erro: mensagemRecente(itens), status: 409, codigo: "ALTERADO_RECENTEMENTE" };
      }

      const novaOrigem = origem.fanouts.filter((f) => !codigos.includes(f));
      const novoDestino = [...destino.fanouts, ...codigos.filter((c) => !destino.fanouts.includes(c))];
      if (novoDestino.length > MAX_POR_POSICAO) return { erro: `No máximo ${MAX_POR_POSICAO} fanouts por posição.`, status: 400 };

      await gravarPosicao(tx, ctxDe, novaOrigem);
      await gravarPosicao(tx, ctxPara, novoDestino);
      await registrar(tx, ctxDe, req, "MOVER_SAIDA", origem.fanouts, novaOrigem);
      await registrar(tx, ctxPara, req, "MOVER_ENTRADA", destino.fanouts, novoDestino);
      return { origem: novaOrigem, destino: novoDestino };
    });
    if (r.erro) return errorResponse(res, r.erro, r.status, r.codigo ? { codigo: r.codigo } : null);

    return successResponse(
      res,
      { de: { ...de, fanouts: r.origem }, para: { ...para, fanouts: r.destino } },
      codigos.length === 1 ? "Fanout movido" : `${codigos.length} fanouts movidos`
    );
  } catch (err) {
    console.error("❌ Erro ao mover fanouts:", err);
    return errorResponse(res, "Erro ao mover fanouts", 500);
  }
};

module.exports = { listarFanouts, listarHistorico, salvarPosicao, moverFanouts, normalizarCodigos };
