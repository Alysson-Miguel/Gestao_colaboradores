const { buscarDwResumo } = require('../services/dwResumo.service');

const getDwResumo = async (req, res) => {
  try {
    const { data, idTurno, idEstacao, estacaoId } = req.query;

    if (!data || !idTurno) {
      return res.status(400).json({
        success: false,
        message: 'data e idTurno são obrigatórios'
      });
    }

    const resumo = await buscarDwResumo({
      data,
      idTurno: Number(idTurno),
      idEstacao: idEstacao ? Number(idEstacao) : estacaoId ? Number(estacaoId) : null
    });

    res.json({
      success: true,
      data: resumo
    });

  } catch (error) {
    console.error('❌ Erro DW Resumo:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar resumo de DW'
    });
  }
};

module.exports = {
  getDwResumo
};
