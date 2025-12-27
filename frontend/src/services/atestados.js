import api from "./api";

export const AtestadosAPI = {
  listar: async (params = {}) => {
    const res = await api.get("/atestados-medicos", { params });
    return res.data.data;
  },

  buscarPorId: async (id) => {
    const res = await api.get(`/atestados-medicos/${id}`);
    return res.data.data;
  },

  criar: async (payload) => {
    const res = await api.post("/atestados-medicos", payload);
    return res.data.data;
  },

  atualizar: async (id, payload) => {
    const res = await api.put(`/atestados-medicos/${id}`, payload);
    return res.data.data;
  },

  finalizar: async (id) => {
    const res = await api.patch(`/atestados-medicos/${id}/finalizar`);
    return res.data.data;
  },

  cancelar: async (id) => {
    const res = await api.patch(`/atestados-medicos/${id}/cancelar`);
    return res.data.data;
  },
};
