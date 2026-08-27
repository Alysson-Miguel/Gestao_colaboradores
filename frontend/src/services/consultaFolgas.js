import api from "./api";

export const ConsultaFolgasAPI = {
  consultar: async (cpf, opsId) => {
    const res = await api.get("/consulta-folgas", {
      params: { cpf, opsId },
      _skipEstacao: true,
    });
    return res.data.data;
  },
};
