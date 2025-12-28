const escalaService = require("../services/escala.service");

async function getEscalas(req, res) {
  try {
    const escalas = await escalaService.listarEscalas();
    return res.status(200).json(escalas);
  } catch (error) {
    console.error("Erro ao buscar escalas:", error);
    return res.status(500).json({
      success: false,
      message: "Erro ao buscar escalas",
    });
  }
}

module.exports = {
  getEscalas,
};
