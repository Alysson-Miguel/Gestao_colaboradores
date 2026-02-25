const {
  gerarFolgaDominical,
  listarFolgaDominical,
  deletarFolgaDominical,
} = require("../services/folgaDominical.service");

/* =====================================================
   POST /folga-dominical
===================================================== */
async function gerar(req, res) {
  try {
    const { ano, mes } = req.body;

    if (!ano || !mes) {
      return res.status(400).json({
        success: false,
        error: "Ano e mês são obrigatórios.",
      });
    }

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Usuário não autenticado.",
      });
    }

    const resultado = await gerarFolgaDominical({
      ano: Number(ano),
      mes: Number(mes),
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Folga dominical gerada com sucesso.",
      data: resultado,
    });
  } catch (error) {
    console.error("❌ Erro ao gerar folga dominical:", error);

    return res.status(400).json({
      success: false,
      error: error.message || "Erro interno ao gerar folga dominical.",
    });
  }
}

/* =====================================================
   GET /folga-dominical?ano=2026&mes=4
===================================================== */
async function listar(req, res) {
  try {
    const { ano, mes } = req.query;

    if (!ano || !mes) {
      return res.status(400).json({
        success: false,
        error: "Ano e mês são obrigatórios.",
      });
    }

    const resultado = await listarFolgaDominical({
      ano: Number(ano),
      mes: Number(mes),
    });

    return res.status(200).json({
      success: true,
      data: resultado,
    });
  } catch (error) {
    console.error("❌ Erro ao listar folga dominical:", error);

    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

/* =====================================================
   DELETE /folga-dominical?ano=2026&mes=4
===================================================== */
async function deletar(req, res) {
  try {
    const { ano, mes } = req.query;

    if (!ano || !mes) {
      return res.status(400).json({
        success: false,
        error: "Ano e mês são obrigatórios.",
      });
    }

    const userId = req.user?.id;

    const resultado = await deletarFolgaDominical({
      ano: Number(ano),
      mes: Number(mes),
      userId,
    });

    return res.status(200).json({
      success: true,
      message: "Planejamento removido com sucesso.",
      data: resultado,
    });
  } catch (error) {
    console.error("❌ Erro ao deletar folga dominical:", error);

    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}

module.exports = {
  gerar,
  listar,
  deletar,
};