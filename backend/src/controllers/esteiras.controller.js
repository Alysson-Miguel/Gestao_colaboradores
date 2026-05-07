const { buscarEsteirasPlanejadas } = require("../services/googleSheetsCalculadora.service");
const { successResponse, errorResponse } = require("../utils/response");

const getEsteirasPlanejadas = async (req, res) => {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const data = await buscarEsteirasPlanejadas(date);
    return successResponse(res, data);
  } catch (err) {
    console.error("❌ Erro ao buscar esteiras planejadas:", err);
    return errorResponse(res, "Erro ao buscar dados das esteiras", 500, err);
  }
};

module.exports = { getEsteirasPlanejadas };
