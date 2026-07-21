import api from "./api";

export const AprovadoresTreinamentoAPI = {
  listar: async (ativo) => {
    const params = {};
    if (ativo !== undefined) params.ativo = ativo;
    const res = await api.get("/config/aprovadores-treinamento", { params });
    return res.data.data;
  },

  criar: async (payload) => {
    const res = await api.post("/config/aprovadores-treinamento", payload);
    return res.data.data;
  },

  atualizar: async (id, payload) => {
    const res = await api.put(`/config/aprovadores-treinamento/${id}`, payload);
    return res.data.data;
  },

  desativar: async (id) => {
    const res = await api.delete(`/config/aprovadores-treinamento/${id}`);
    return res.data;
  },
};
