const { buscarDadosOPA } = require('../services/googleSheetsOPA.service');

/**
 * 📊 GET /api/opa
 * Buscar dados do OPA (Observação Preventiva de Atos)
 */
const getOPA = async (req, res) => {
  try {
    console.log('\n🔍 ===== GET /api/opa =====');
    console.log('Query params:', req.query);
    console.log('User:', req.user?.nome || 'Desconhecido');

    const { periodo, semana, turno } = req.query;

    const filtros = {
      periodo: periodo || 'semana_atual',
      semana: semana || undefined,
      turno: turno || undefined,
    };

    console.log('Filtros aplicados:', filtros);

    const resultado = await buscarDadosOPA(filtros);

    console.log('✅ Dados do OPA retornados com sucesso');
    console.log(`   Total: ${resultado.data.totalInspecoes}`);
    console.log(`   Realizadas: ${resultado.data.realizadas}`);
    console.log(`   Pendentes: ${resultado.data.pendentes}`);
    console.log(`   Taxa: ${resultado.data.taxaConclusao}%`);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error('❌ Erro no controller getOPA:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao buscar dados do OPA',
      error: error.message,
    });
  }
};

module.exports = {
  getOPA,
};
