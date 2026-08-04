import api from "./api";

export const SegundosAprovadoresOperacionaisAPI = {
  listar: async (tipo, ativo) => {
    const params = {};
    if (tipo !== undefined) params.tipo = tipo;
    if (ativo !== undefined) params.ativo = ativo;
    const res = await api.get("/config/segunda-aprovacao-operacional", { params });
    return res.data.data;
  },

  criar: async (payload) => {
    const res = await api.post("/config/segunda-aprovacao-operacional", payload);
    return res.data.data;
  },

  atualizar: async (id, payload) => {
    const res = await api.put(`/config/segunda-aprovacao-operacional/${id}`, payload);
    return res.data.data;
  },

  desativar: async (id) => {
    const res = await api.delete(`/config/segunda-aprovacao-operacional/${id}`);
    return res.data;
  },
};
