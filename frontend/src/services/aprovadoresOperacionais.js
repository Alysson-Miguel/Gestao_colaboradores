import api from "./api";

export const AprovadoresOperacionaisAPI = {
  listar: async (ativo) => {
    const params = {};
    if (ativo !== undefined) params.ativo = ativo;
    const res = await api.get("/config/aprovadores-operacionais", { params });
    return res.data.data;
  },

  criar: async (payload) => {
    const res = await api.post("/config/aprovadores-operacionais", payload);
    return res.data.data;
  },

  atualizar: async (id, payload) => {
    const res = await api.put(`/config/aprovadores-operacionais/${id}`, payload);
    return res.data.data;
  },

  desativar: async (id) => {
    const res = await api.delete(`/config/aprovadores-operacionais/${id}`);
    return res.data;
  },
};
