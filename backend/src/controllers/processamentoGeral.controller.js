const { prisma } = require("../config/database");
const {
  buscarMetasProducao,
  buscarQuantidadeRealizada,
  DEFAULT_SPREADSHEET_ID,
  DEFAULT_PRODUCAO_ONTIME_SPREADSHEET_ID,
} = require("../services/googleSheetsMetaProducao.service");

function agoraBrasil() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
}

// Posição de uma hora dentro do T3 (22→0, 23→1, 0→2, ..., 5→7)
function posicaoT3(h) {
  return h >= 22 ? h - 22 : h + 2;
}

// 8 horas por turno — sem sobreposição nas bordas (6h, 14h, 22h pertencem ao turno que começa)
// T1 06:00-14:00 → slots 6..13  (14h pertence ao T2)
// T2 14:00-22:00 → slots 14..21 (22h pertence ao T3)
// T3 22:00-06:00 → slots 22..5  ( 6h pertence ao T1)
function horasTurno(turno) {
  if (turno === "T1") return [6, 7, 8, 9, 10, 11, 12, 13];
  if (turno === "T2") return [14, 15, 16, 17, 18, 19, 20, 21];
  return [22, 23, 0, 1, 2, 3, 4, 5]; // T3
}

function calcularTurnoFinalizado(turno, dataStr, dataHoje, horaAtual) {
  if (dataStr < dataHoje) {
    if (turno === "T3") {
      const d = new Date(dataStr);
      d.setDate(d.getDate() + 1);
      const dataFimT3 = d.toISOString().slice(0, 10);
      return dataFimT3 < dataHoje || (dataFimT3 === dataHoje && horaAtual >= 6);
    }
    return true;
  }
  if (turno === "T1") return horaAtual >= 14;
  if (turno === "T2") return horaAtual >= 22;
  if (turno === "T3") return horaAtual >= 6 && horaAtual < 22;
  return false;
}

function calcularHoraFechada(h, horaAtual, turno, turnoFinalizado) {
  if (turnoFinalizado) return true;
  if (turno === "T3") return posicaoT3(h) < posicaoT3(horaAtual);
  return h < horaAtual;
}

function calcularEmAndamento(h, horaAtual, turno, turnoFinalizado) {
  if (turnoFinalizado) return false;
  if (turno === "T3") return posicaoT3(h) === posicaoT3(horaAtual);
  return h === horaAtual;
}

/*
  Algoritmo de redistribuição hora a hora:
  - Percorre as horas do turno em ordem cronológica.
  - Mantém uma cópia mutável das metas ajustadas.
  - Para cada hora FECHADA:
      delta = realizado - meta_ajustada_hora
      ajuste_por_hora_restante = delta / qtd_horas_restantes
      nova_meta_horas_restantes -= ajuste_por_hora_restante
      (delta positivo → reduz metas futuras; negativo → aumenta)
  - A hora EM ANDAMENTO mostra o realizado parcial mas não redistribui.
  - Horas FUTURAS mostram apenas a meta ajustada.
*/
function calcularRedistribuicao(metasPorHora, quantidadePorHora, turno, horaAtual, turnoFinalizado) {
  const horas = horasTurno(turno);
  const metasAjustadas = {};
  horas.forEach((h) => { metasAjustadas[h] = metasPorHora[h] || 0; });

  const resultado = [];

  for (let i = 0; i < horas.length; i++) {
    const h = horas[i];
    const metaOriginal = metasPorHora[h] || 0;
    const metaAjustadaHora = metasAjustadas[h]; // snapshot antes de redistribuir

    const horaFechada = calcularHoraFechada(h, horaAtual, turno, turnoFinalizado);
    const emAndamento = !horaFechada && calcularEmAndamento(h, horaAtual, turno, turnoFinalizado);
    const futura = !horaFechada && !emAndamento;

    const realizado = (horaFechada || emAndamento) ? Math.round(quantidadePorHora[h] || 0) : 0;

    let delta = null;
    if (horaFechada) {
      delta = realizado - metaAjustadaHora;

      // Redistribuir o delta pelas horas restantes
      const horasRestantes = horas.slice(i + 1);
      if (horasRestantes.length > 0 && delta !== 0) {
        const ajustePorHora = delta / horasRestantes.length;
        horasRestantes.forEach((hr) => {
          metasAjustadas[hr] -= ajustePorHora;
        });
      }
    }

    const percentual =
      horaFechada && metaAjustadaHora > 0
        ? Number(((realizado / metaAjustadaHora) * 100).toFixed(1))
        : null;

    resultado.push({
      hora: h.toString().padStart(2, "00"),
      metaOriginal: Math.round(metaOriginal),
      metaAjustada: Math.round(metaAjustadaHora),
      realizado,
      delta: delta !== null ? Math.round(delta) : null,
      status: horaFechada ? "fechada" : emAndamento ? "em_andamento" : "futura",
      percentual,
      futura,
    });
  }

  return { horas: resultado, metasAjustadas };
}

const carregarProcessamentoGeral = async (req, res) => {
  try {
    const { data, turno } = req.query;

    if (!turno || !["T1", "T2", "T3"].includes(turno)) {
      return res.status(400).json({
        success: false,
        message: "Turno é obrigatório (T1, T2 ou T3)",
      });
    }

    const agora = agoraBrasil();
    const horaAtual = agora.getHours();

    // Resolver spreadsheetIds da estação
    const estacaoIdCtx = req.dbContext?.estacaoId ?? null;
    let spreadsheetId = DEFAULT_SPREADSHEET_ID;
    let producaoSpreadsheetId = DEFAULT_PRODUCAO_ONTIME_SPREADSHEET_ID;

    if (estacaoIdCtx) {
      const estacao = await prisma.estacao.findUnique({
        where: { idEstacao: estacaoIdCtx },
        select: { sheetsMetaProducaoId: true },
      });
      if (estacao?.sheetsMetaProducaoId) spreadsheetId = estacao.sheetsMetaProducaoId;
      // sheetsProducaoOnTimeId disponível após rodar: npx prisma migrate dev && npx prisma generate
    }

    // Resolver data de referência
    let dataReferencia = data ? new Date(`${data}T00:00:00.000Z`) : agora;
    if (turno === "T3" && !data) {
      if (horaAtual < 22) {
        dataReferencia = new Date(agora);
        dataReferencia.setDate(dataReferencia.getDate() - 1);
      }
    }
    const dataStr = dataReferencia.toISOString().slice(0, 10);
    const dataHoje = agora.toISOString().slice(0, 10);

    // Data do dia seguinte (necessária para T3 horas 0–5)
    const dataStrSeguinte = (() => {
      const d = new Date(dataStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })();

    // Buscar metas da planilha
    const metasResult = await buscarMetasProducao(turno, dataStr, spreadsheetId);
    if (!metasResult.success) throw new Error("Erro ao buscar metas da planilha");
    const { metaDia, metasPorHora } = metasResult.data;

    // Buscar quantidade realizada (T3 requer duas datas)
    let quantidadePorHora = {};
    if (turno === "T3") {
      const [qtdOntem, qtdHoje] = await Promise.all([
        buscarQuantidadeRealizada(dataStr, producaoSpreadsheetId),
        buscarQuantidadeRealizada(dataStrSeguinte, producaoSpreadsheetId),
      ]);
      if (qtdOntem.success) {
        if (qtdOntem.data[22]) quantidadePorHora[22] = qtdOntem.data[22];
        if (qtdOntem.data[23]) quantidadePorHora[23] = qtdOntem.data[23];
      }
      if (qtdHoje.success) {
        for (let h = 0; h <= 6; h++) {
          if (qtdHoje.data[h]) quantidadePorHora[h] = qtdHoje.data[h];
        }
      }
    } else {
      const qtdResult = await buscarQuantidadeRealizada(dataStr, producaoSpreadsheetId);
      quantidadePorHora = qtdResult.success ? qtdResult.data : {};
    }

    const turnoFinalizado = calcularTurnoFinalizado(turno, dataStr, dataHoje, horaAtual);

    // Calcular redistribuição hora a hora
    const { horas, metasAjustadas } = calcularRedistribuicao(
      metasPorHora,
      quantidadePorHora,
      turno,
      horaAtual,
      turnoFinalizado
    );

    // Calcular KPIs
    const horasFechadas = horas.filter((h) => h.status === "fechada");
    const realizadoTotal = horasFechadas.reduce((sum, h) => sum + h.realizado, 0);

    const horaAtiva = horas.find((h) => h.status === "em_andamento");
    const realizadoParcial = horaAtiva ? horaAtiva.realizado : 0;

    const horasFuturas = horas.filter((h) => h.futura);
    const metaRestanteAjustada = Math.round(
      (horaAtiva ? metasAjustadas[parseInt(horaAtiva.hora, 10)] : 0) +
        horasFuturas.reduce((sum, h) => sum + (metasAjustadas[parseInt(h.hora, 10)] || 0), 0)
    );

    const performancePct =
      metaDia > 0
        ? Number(((realizadoTotal / metaDia) * 100).toFixed(2))
        : 0;

    const kpis = {
      metaDia: Math.round(metaDia),
      realizadoTotal,
      realizadoParcial,
      metaRestanteAjustada,
      performancePct,
      horaAtual,
      turnoFinalizado,
    };

    return res.json({
      success: true,
      data: {
        turno,
        dataReferencia: dataStr,
        ultimaAtualizacao: new Date().toISOString(),
        kpis,
        horas,
      },
    });
  } catch (error) {
    console.error("❌ Erro processamento geral:", error);

    if (error.code === "SHEETS_NOT_CONFIGURED") {
      return res.status(503).json({
        success: false,
        code: "SHEETS_NOT_CONFIGURED",
        message: "Planilha de produtividade ainda não configurada para esta estação.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Erro ao carregar dados de processamento",
      error: error.message,
    });
  }
};

/* ─────────────────────────────────────────────────────────────
   Processamento Dia Completo — redistribuição CRUZADA entre turnos
   Delta de uma hora dilui em TODAS as horas restantes do dia,
   independente de turno.
───────────────────────────────────────────────────────────── */
const HORAS_DIA = {
  T1: [6, 7, 8, 9, 10, 11, 12, 13],
  T2: [14, 15, 16, 17, 18, 19, 20, 21],
  T3: [22, 23, 0, 1, 2, 3, 4, 5],
};

const carregarProcessamentoDiaCompleto = async (req, res) => {
  try {
    const { data } = req.query;

    const agora = agoraBrasil();
    const horaAtual = agora.getHours();
    const dataHoje = agora.toISOString().slice(0, 10);

    // Resolver spreadsheetIds da estação
    const estacaoIdCtx = req.dbContext?.estacaoId ?? null;
    let spreadsheetId = DEFAULT_SPREADSHEET_ID;
    let producaoSpreadsheetId = DEFAULT_PRODUCAO_ONTIME_SPREADSHEET_ID;
    if (estacaoIdCtx) {
      const estacao = await prisma.estacao.findUnique({
        where: { idEstacao: estacaoIdCtx },
        select: { sheetsMetaProducaoId: true },
      });
      if (estacao?.sheetsMetaProducaoId) spreadsheetId = estacao.sheetsMetaProducaoId;
      // sheetsProducaoOnTimeId disponível após rodar: npx prisma migrate dev && npx prisma generate
    }

    // Data de referência — T3 antes das 22h usa ontem
    let dataReferencia = data ? new Date(`${data}T00:00:00.000Z`) : agora;
    if (!data && horaAtual < 22) {
      // Se ainda não é 22h, o T3 do dia ainda não começou → usa data de ontem
      // mas T1 e T2 usam hoje — mantemos dataStr = hoje
    }
    const dataStr = data
      ? new Date(`${data}T00:00:00.000Z`).toISOString().slice(0, 10)
      : dataHoje;

    const dataStrSeguinte = (() => {
      const d = new Date(dataStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })();

    // Buscar metas dos 3 turnos + realizados em paralelo
    const [metasT1, metasT2, metasT3, qtdDia, qtdSeguinte] = await Promise.all([
      buscarMetasProducao("T1", dataStr, spreadsheetId),
      buscarMetasProducao("T2", dataStr, spreadsheetId),
      buscarMetasProducao("T3", dataStr, spreadsheetId),
      buscarQuantidadeRealizada(dataStr, producaoSpreadsheetId),
      buscarQuantidadeRealizada(dataStrSeguinte, producaoSpreadsheetId),
    ]);

    const metasPorTurno = {
      T1: metasT1.success ? metasT1.data.metasPorHora : {},
      T2: metasT2.success ? metasT2.data.metasPorHora : {},
      T3: metasT3.success ? metasT3.data.metasPorHora : {},
    };

    // Quantidade realizada mapeada por turno+hora
    const qtdT1T2 = qtdDia.success ? qtdDia.data : {};
    const qtdT3 = (() => {
      const m = {};
      if (qtdDia.success) { m[22] = qtdDia.data[22] || 0; m[23] = qtdDia.data[23] || 0; }
      if (qtdSeguinte.success) {
        for (let h = 0; h <= 6; h++) m[h] = qtdSeguinte.data[h] || 0;
      }
      return m;
    })();

    const qtdPorTurno = { T1: qtdT1T2, T2: qtdT1T2, T3: qtdT3 };

    // Status de finalização por turno
    const finalizadoPorTurno = {
      T1: calcularTurnoFinalizado("T1", dataStr, dataHoje, horaAtual),
      T2: calcularTurnoFinalizado("T2", dataStr, dataHoje, horaAtual),
      T3: calcularTurnoFinalizado("T3", dataStr, dataHoje, horaAtual),
    };

    // Construir lista completa de horas do dia em ordem cronológica
    // cada item: { turno, hora, metaOriginal, qtd }
    const horasDia = [
      ...HORAS_DIA.T1.map((h) => ({ turno: "T1", hora: h })),
      ...HORAS_DIA.T2.map((h) => ({ turno: "T2", hora: h })),
      ...HORAS_DIA.T3.map((h) => ({ turno: "T3", hora: h })),
    ];

    // Metas ajustadas mutáveis (índice = posição no array de 27 horas)
    const metasAjustadasArr = horasDia.map(({ turno, hora }) =>
      metasPorTurno[turno][hora] || 0
    );

    // ── Redistribuição cruzada ──
    const resultado = [];

    for (let i = 0; i < horasDia.length; i++) {
      const { turno, hora } = horasDia[i];
      const metaAjustadaHora = metasAjustadasArr[i];
      const metaOriginal = metasPorTurno[turno][hora] || 0;

      const horaFechada = calcularHoraFechada(hora, horaAtual, turno, finalizadoPorTurno[turno]);
      const emAndamento = !horaFechada && calcularEmAndamento(hora, horaAtual, turno, finalizadoPorTurno[turno]);
      const futura = !horaFechada && !emAndamento;

      const realizado = horaFechada || emAndamento
        ? Math.round(qtdPorTurno[turno][hora] || 0)
        : 0;

      let delta = null;
      if (horaFechada) {
        delta = realizado - metaAjustadaHora;

        // Dilui o delta em TODAS as horas restantes do dia (cross-shift)
        const horasRestantes = horasDia.length - i - 1;
        if (horasRestantes > 0 && delta !== 0) {
          const ajuste = delta / horasRestantes;
          for (let j = i + 1; j < horasDia.length; j++) {
            metasAjustadasArr[j] -= ajuste;
          }
        }
      }

      const percentual =
        horaFechada && metaAjustadaHora > 0
          ? Number(((realizado / metaAjustadaHora) * 100).toFixed(1))
          : null;

      resultado.push({
        turno,
        hora: hora.toString().padStart(2, "0"),
        metaOriginal: Math.round(metaOriginal),
        metaAjustada: Math.round(metaAjustadaHora),
        realizado,
        delta: delta !== null ? Math.round(delta) : null,
        status: horaFechada ? "fechada" : emAndamento ? "em_andamento" : "futura",
        percentual,
        futura,
      });
    }

    // ── KPIs do dia ──
    const metaDiaTotal = resultado.reduce((s, h) => s + h.metaOriginal, 0);
    const realizadoTotal = resultado.filter((h) => h.status === "fechada").reduce((s, h) => s + h.realizado, 0);
    const horaAtiva = resultado.find((h) => h.status === "em_andamento");
    const metaRestanteAjustada = resultado
      .filter((h) => h.futura)
      .reduce((s, h) => s + h.metaAjustada, 0);

    // ── Breakdown por turno (para as tabelas individuais) ──
    const porTurno = {};
    for (const t of ["T1", "T2", "T3"]) {
      const horasTurnoRes = resultado.filter((h) => h.turno === t);
      const fechadas = horasTurnoRes.filter((h) => h.status === "fechada");
      const realT = fechadas.reduce((s, h) => s + h.realizado, 0);
      const metaT = horasTurnoRes.reduce((s, h) => s + h.metaOriginal, 0);
      const ativaT = horasTurnoRes.find((h) => h.status === "em_andamento");
      porTurno[t] = {
        turno: t,
        horas: horasTurnoRes,
        kpis: {
          metaDia: metaT,
          realizadoTotal: realT,
          realizadoParcial: ativaT?.realizado || 0,
          metaRestanteAjustada: horasTurnoRes.filter((h) => h.futura).reduce((s, h) => s + h.metaAjustada, 0),
          performancePct: metaT > 0 ? Number(((realT / metaT) * 100).toFixed(2)) : 0,
          turnoFinalizado: finalizadoPorTurno[t],
        },
      };
    }

    return res.json({
      success: true,
      data: {
        dataReferencia: dataStr,
        ultimaAtualizacao: new Date().toISOString(),
        horas: resultado,
        kpis: {
          metaDia: metaDiaTotal,
          realizadoTotal,
          realizadoParcial: horaAtiva?.realizado || 0,
          metaRestanteAjustada: Math.round(metaRestanteAjustada),
          performancePct: metaDiaTotal > 0 ? Number(((realizadoTotal / metaDiaTotal) * 100).toFixed(2)) : 0,
          horaAtual,
        },
        porTurno,
      },
    });
  } catch (error) {
    console.error("❌ Erro processamento dia completo:", error);
    if (error.code === "SHEETS_NOT_CONFIGURED") {
      return res.status(503).json({
        success: false,
        code: "SHEETS_NOT_CONFIGURED",
        message: "Planilha de produtividade ainda não configurada para esta estação.",
      });
    }
    return res.status(500).json({ success: false, message: "Erro ao carregar dados do dia", error: error.message });
  }
};

module.exports = { carregarProcessamentoGeral, carregarProcessamentoDiaCompleto };
