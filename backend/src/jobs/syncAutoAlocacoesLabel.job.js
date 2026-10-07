const cron = require("node-cron");
const { prisma } = require("../config/database");
const {
  getAutoAlocacoesEsteira,
  getPessoasAtivasFullD1,
  codigosDaEsteira,
  WORKSTATION_MAPPINGS,
} = require("../services/mapaOperacional/workstationSheets.service");
const { getThroughputPorEstacao } = require("../services/mapaOperacional/productivityWorkstationSheets.service");
const { parseDataHoraPlanilha, getTurnoOperacionalAtual } = require("../utils/turnoMapaOperacional");
const { encerrarAlocacoesManuaisDeDiasAnteriores } = require("../services/mapaOperacional/viradaDiaOperacional.service");

// Módulo Mapa Operacional (Label) é exclusivo da estação 1 (Jaboatão).
const ID_ESTACAO = 1;

function chavePosicao(pos) {
  return pos.labor === "FULL_D1"
    ? `FULL_D1:${pos.opsId}`
    : `${pos.idEsteira}:${pos.braco}:${pos.lado}:${pos.opsId}`;
}

function chaveAlocacao(a) {
  return a.labor === "FULL_D1"
    ? `FULL_D1:${a.opsId}`
    : `${a.idEsteira}:${a.braco}:${a.lado}:${a.opsId}`;
}

/**
 * Lê as posições ativas agora (Workstation/Assignment History) pra todas as
 * esteiras mapeadas + o pool FULL D+1, pra persistir em MapaAlocacao
 * (origem AUTO). É isso que viabiliza consultar a Label de dias anteriores —
 * a planilha só dá a foto de agora, então sem gravar continuamente não tem
 * como reconstruir o passado depois.
 */
async function lerPosicoesAtivas() {
  const esteiras = await prisma.mapaEsteira.findMany({
    where: { idEstacao: ID_ESTACAO, nome: { in: Object.keys(WORKSTATION_MAPPINGS) } },
    select: { idEsteira: true, nome: true, qtdBracos: true },
  });

  const posicoes = [];

  for (const esteira of esteiras) {
    const grupos = await getAutoAlocacoesEsteira(esteira.nome);
    grupos.forEach((g) => {
      g.pessoas.forEach((p) => {
        posicoes.push({
          opsId: p.opsId,
          labor: "PACKING",
          idEsteira: esteira.idEsteira,
          braco: g.braco,
          lado: g.lado,
          checkIn: p.checkIn,
        });
      });
    });
  }

  const poolFullD1 = await getPessoasAtivasFullD1();
  poolFullD1.forEach((p) => {
    posicoes.push({ opsId: p.opsId, labor: "FULL_D1", idEsteira: null, braco: null, lado: null, checkIn: p.checkIn });
  });

  return { posicoes, esteiras };
}

/**
 * Captura e mantém, por código de workstation, o baseline de "Total
 * Throughput" (aba Productivity Workstation) no início do turno e o valor
 * mais recente a cada tick. Produção do turno de uma esteira = soma de
 * (throughputAtual - throughputBase) dos códigos dela. Isso é por ESTAÇÃO,
 * não por operador — não importa quem passou por ali, nem se alguém saiu
 * antes do próximo sync, o contador pertence ao código físico.
 */
async function atualizarProducaoTurnoPorWorkstation(esteiras) {
  const { turno, diaOperacional } = getTurnoOperacionalAtual();
  const throughputMap = await getThroughputPorEstacao();

  // "Total Throughput" é acumulado do dia operacional e ZERA às 06:00 (início
  // do T1) — confirmado contra as horas-homem do Assignment History. Logo o
  // baseline do T1 é sempre 0, mesmo que o job só suba depois das 06:00, e
  // enquanto a planilha ainda traz o dado do dia anterior o valor vale 0.
  // T2 e T3 dependem do baseline capturado na virada de turno (14:00/22:00).
  const inicioDiaOperacional = new Date(diaOperacional);
  inicioDiaOperacional.setHours(6, 0, 0, 0);
  const dadoDoDiaAtual = !throughputMap.atualizadoEm || throughputMap.atualizadoEm >= inicioDiaOperacional;
  const lerThroughput = (codigo) => {
    if (turno === "T1" && !dadoDoDiaAtual) return 0;
    return throughputMap.get(codigo) ?? 0;
  };

  const todosCodigos = [];
  for (const esteira of esteiras) {
    todosCodigos.push(...codigosDaEsteira(esteira.nome));
  }
  if (todosCodigos.length === 0) return;

  const existentes = await prisma.mapaWorkstationProducaoTurno.findMany({
    where: { codigoEstacao: { in: todosCodigos }, dataOperacional: diaOperacional, turno },
    select: { codigoEstacao: true },
  });
  const jaTemBaseline = new Set(existentes.map((e) => e.codigoEstacao));

  const novos = todosCodigos
    .filter((codigo) => !jaTemBaseline.has(codigo))
    .map((codigo) => ({ codigoEstacao: codigo, atual: lerThroughput(codigo) }));

  if (novos.length > 0) {
    await prisma.mapaWorkstationProducaoTurno.createMany({
      data: novos.map((n) => ({
        codigoEstacao: n.codigoEstacao,
        dataOperacional: diaOperacional,
        turno,
        throughputBase: turno === "T1" ? 0 : n.atual,
        throughputAtual: n.atual,
      })),
    });
  }

  for (const codigo of todosCodigos) {
    if (!jaTemBaseline.has(codigo)) continue; // já criado acima com o valor atual
    await prisma.mapaWorkstationProducaoTurno.update({
      where: { codigoEstacao_dataOperacional_turno: { codigoEstacao: codigo, dataOperacional: diaOperacional, turno } },
      data: { throughputAtual: lerThroughput(codigo) },
    });
  }
}

async function sincronizar() {
  // Virada do dia operacional (06:00): zera as alocações manuais do dia anterior.
  await encerrarAlocacoesManuaisDeDiasAnteriores(ID_ESTACAO, { forcar: true });

  const { posicoes: posicoesAtivas, esteiras } = await lerPosicoesAtivas();

  await atualizarProducaoTurnoPorWorkstation(esteiras);

  const abertas = await prisma.mapaAlocacao.findMany({
    where: { idEstacao: ID_ESTACAO, origem: "AUTO", fim: null },
  });
  const abertasPorChave = new Map(abertas.map((a) => [chaveAlocacao(a), a]));
  const chavesAtivasAgora = new Set(posicoesAtivas.map(chavePosicao));

  // Só grava quem já existe no cadastro — opsId desconhecido (planilha com
  // gente ainda não sincronizada no COPEOPLE) é ignorado aqui sem derrubar
  // o resto do lote, já que criarAlocacao exige a FK de Colaborador.
  const candidatosNovos = posicoesAtivas.filter((pos) => !abertasPorChave.has(chavePosicao(pos)));
  const opsIdsCandidatos = [...new Set(candidatosNovos.map((p) => p.opsId))];
  const colaboradoresValidos = await prisma.colaborador.findMany({
    where: { opsId: { in: opsIdsCandidatos } },
    select: { opsId: true },
  });
  const opsIdsValidos = new Set(colaboradoresValidos.map((c) => c.opsId));
  const novas = candidatosNovos.filter((pos) => opsIdsValidos.has(pos.opsId));

  if (novas.length > 0) {
    await prisma.mapaAlocacao.createMany({
      data: novas.map((pos) => ({
        idEstacao: ID_ESTACAO,
        labor: pos.labor,
        origem: "AUTO",
        idEsteira: pos.idEsteira,
        braco: pos.braco,
        lado: pos.lado,
        opsId: pos.opsId,
        inicio: parseDataHoraPlanilha(pos.checkIn) || new Date(),
      })),
    });
  }

  const idsParaFechar = abertas
    .filter((a) => !chavesAtivasAgora.has(chaveAlocacao(a)))
    .map((a) => a.idAlocacao);

  if (idsParaFechar.length > 0) {
    await prisma.mapaAlocacao.updateMany({
      where: { idAlocacao: { in: idsParaFechar } },
      data: { fim: new Date() },
    });
  }

  return { abertas: novas.length, fechadas: idsParaFechar.length };
}

function iniciarJobSyncAutoAlocacoesLabel() {
  console.log("\n🤖 [SYNC-LABEL] Iniciando sync de auto-alocações da Label (Operação)");

  async function executar() {
    try {
      const resultado = await sincronizar();
      if (resultado.abertas > 0 || resultado.fechadas > 0) {
        console.log(`📍 [SYNC-LABEL] +${resultado.abertas} abertas, -${resultado.fechadas} fechadas`);
      }
    } catch (err) {
      console.error("❌ [SYNC-LABEL] Erro na sincronização:", err.message);
    }
  }

  executar();
  cron.schedule("*/1 * * * *", executar);

  console.log("✅ [SYNC-LABEL] Job agendado (a cada 1 minuto)\n");
}

module.exports = { iniciarJobSyncAutoAlocacoesLabel, sincronizar };
