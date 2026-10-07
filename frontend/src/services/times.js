import api from "./api";

export const TimesAPI = {
  listar: async ({ operacao, turno } = {}) => {
    const params = {};
    if (operacao) params.operacao = operacao;
    if (turno) params.turno = turno;
    const res = await api.get("/times", { params });
    return res.data.data;
  },

  criar: async ({ nome, operacao, tipo, turno }) => {
    const res = await api.post("/times", { nome, operacao, tipo, turno });
    return res.data.data;
  },

  atualizar: async (idTime, dados) => {
    const res = await api.patch(`/times/${idTime}`, dados);
    return res.data.data;
  },

  excluir: async (idTime) => {
    const res = await api.delete(`/times/${idTime}`);
    return res.data;
  },

  atualizarIntegrante: async (idTime, opsId, { funcao }) => {
    const res = await api.patch(`/times/${idTime}/integrantes/${opsId}`, { funcao });
    return res.data;
  },

  adicionarIntegrante: async (idTime, { opsId, funcao }) => {
    const res = await api.post(`/times/${idTime}/integrantes`, { opsId, funcao });
    return res.data.data;
  },

  removerIntegrante: async (idTime, opsId) => {
    const res = await api.delete(`/times/${idTime}/integrantes/${opsId}`);
    return res.data;
  },
};
