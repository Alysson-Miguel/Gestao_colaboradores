const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const { buscarMetasProducao } = require("../services/googleSheetsMetaProducao.service");

function agoraBrasil() {
  const now = new Date();
  const spString = now.toLocaleString("en-US", {
    timeZone: "America/Sao_Paulo",
  });
  return new Date(spString);
}

const carregarGestaoOperacional = async (req, res) => {
  try {
    const { data, turno } = req.query;
    
    console.log("📊 Requisição recebida:", { data, turno });
    console.log("👤 Usuário:", req.user?.name, "| Role:", req.user?.role);
    
    if (!turno) {
      return res.status(400).json({
        success: false,
        message: "Turno é obrigatório (T1, T2 ou T3)"
      });
    }

    const agora = agoraBrasil();
    const dataReferencia = data ? new Date(`${data}T00:00:00.000Z`) : agora;
    const dataStr = dataReferencia.toISOString().slice(0, 10);

    console.log("📅 Data processada:", dataStr);

    // Buscar metas da planilha
    console.log("🔍 Buscando metas da planilha...");
    const metasResult = await buscarMetasProducao(turno, dataStr);
    
    if (!metasResult.success) {
      throw new Error("Erro ao buscar metas da planilha");
    }

    const { metaDia, metasPorHora } = metasResult.data;
    console.log("✅ Metas carregadas:", { metaDia, horasComMeta: Object.keys(metasPorHora).length });

    // Buscar dados de produção por hora do banco
    console.log("🔍 Buscando produção do banco...");
    const turnoId = turno === "T1" ? 1 : turno === "T2" ? 2 : 3;
    
    const producaoPorHora = await prisma.$queryRaw`
      SELECT 
        EXTRACT(HOUR FROM data::timestamp) as hora,
        SUM(CAST(quantidade AS INTEGER)) as realizado
      FROM dw_real
      WHERE data::date = CAST(${dataStr} AS date)
        AND id_turno = ${turnoId}
      GROUP BY EXTRACT(HOUR FROM data::timestamp)
      ORDER BY hora
    `;

    console.log("✅ Produção carregada:", producaoPorHora.length, "registros");

    // Calcular totais
    const horaAtual = agora.getHours();
    let metaHoraProjetada = 0;
    let realizado = 0;
    const producaoComMeta = [];

    // Processar todas as horas que têm meta
    for (const [horaStr, meta] of Object.entries(metasPorHora)) {
      const h = parseInt(horaStr);
      
      // Somar meta projetada até a hora atual
      if (h <= horaAtual) {
        metaHoraProjetada += meta;
      }

      const prod = producaoPorHora.find(p => Number(p.hora) === h);
      const realizadoHora = prod ? Number(prod.realizado) : 0;
      
      if (h <= horaAtual) {
        realizado += realizadoHora;
      }

      const percentual = meta > 0 ? ((realizadoHora / meta) * 100).toFixed(1) : 0;

      producaoComMeta.push({
        hora: h.toString().padStart(2, '0'),
        meta: Math.round(meta),
        realizado: realizadoHora,
        percentual: Number(percentual)
      });
    }

    // Ordenar por hora
    producaoComMeta.sort((a, b) => parseInt(a.hora) - parseInt(b.hora));

    // Calcular médias e produtividade
    const horasComMeta = Object.keys(metasPorHora).filter(h => parseInt(h) <= horaAtual).length;
    const mediaHoraRealizado = horasComMeta > 0 ? Math.round(realizado / horasComMeta) : 0;
    
    // Produtividade = (realizado / meta projetada) * 770
    const produtividade = metaHoraProjetada > 0 ? Math.round((realizado / metaHoraProjetada) * 770) : 0;

    const performance = metaHoraProjetada > 0 
      ? ((realizado / metaHoraProjetada) * 100).toFixed(2)
      : 0;

    // Capacidade por hora (mesma estrutura das metas)
    const capacidadePorHora = Object.entries(metasPorHora).map(([hora, capacidade]) => ({
      hora,
      capacidade: Math.round(capacidade),
      totalProducao: Math.round(metaDia)
    }));

    console.log("✅ Resposta preparada com sucesso");

    return res.json({
      success: true,
      data: {
        dataReferencia: dataStr,
        turno,
        kpis: {
          metaDia: Math.round(metaDia),
          metaHoraProjetada: Math.round(metaHoraProjetada),
          realizado,
          mediaHoraRealizado,
          produtividade,
          performance: Number(performance)
        },
        producaoPorHora: producaoComMeta,
        capacidadePorHora
      }
    });
  } catch (error) {
    console.error("❌ Erro gestão operacional:", error);
    console.error("Stack:", error.stack);
    res.status(500).json({ 
      success: false, 
      message: "Erro ao carregar dados operacionais",
      error: error.message
    });
  }
};

module.exports = { carregarGestaoOperacional };
