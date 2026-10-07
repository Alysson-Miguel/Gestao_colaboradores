const { prisma } = require("../../config/database");
const { getTurnoOperacionalAtual, inicioDoDiaOperacional, fimDoDiaOperacional } = require("../../utils/turnoMapaOperacional");

// O dia operacional vira às 06:00 (T1 começa). Alocação manual de esteira
// (labor, braço, diarista) só vale dentro do dia operacional em que foi feita:
// na virada, a Label precisa começar zerada. Docas ficam de fora — são recurso
// físico que pode continuar ocupado de um dia pro outro até alguém liberar.
const THROTTLE_MS = 30 * 1000;

let ultimaExecucao = 0;

/** Fim (06:00 de Brasília do dia seguinte) do dia operacional a que um instante pertence. */
function fimDoDiaOperacionalDe(instante) {
  const { diaOperacional } = getTurnoOperacionalAtual(new Date(instante));
  return fimDoDiaOperacional(diaOperacional);
}

/**
 * Encerra alocações MANUAIS de esteira abertas antes do início do dia
 * operacional atual. O `fim` gravado é a virada do dia em que foram feitas,
 * pra o histórico daquele dia continuar correto.
 */
async function encerrarAlocacoesManuaisDeDiasAnteriores(idEstacao, { forcar = false } = {}) {
  const agora = Date.now();
  if (!forcar && agora - ultimaExecucao < THROTTLE_MS) return 0;
  ultimaExecucao = agora;

  const { diaOperacional } = getTurnoOperacionalAtual();
  const inicioDia = inicioDoDiaOperacional(diaOperacional);

  const antigas = await prisma.mapaAlocacao.findMany({
    where: { idEstacao, origem: "MANUAL", fim: null, numeroDoca: null, inicio: { lt: inicioDia } },
    select: { idAlocacao: true, inicio: true },
  });
  if (antigas.length === 0) return 0;

  const idsPorFim = new Map();
  antigas.forEach((a) => {
    const fim = fimDoDiaOperacionalDe(a.inicio);
    const chave = fim.getTime();
    if (!idsPorFim.has(chave)) idsPorFim.set(chave, { fim, ids: [] });
    idsPorFim.get(chave).ids.push(a.idAlocacao);
  });

  for (const { fim, ids } of idsPorFim.values()) {
    await prisma.mapaAlocacao.updateMany({
      where: { idAlocacao: { in: ids } },
      data: { fim: fim < inicioDia ? fim : inicioDia },
    });
  }

  return antigas.length;
}

module.exports = { encerrarAlocacoesManuaisDeDiasAnteriores };
