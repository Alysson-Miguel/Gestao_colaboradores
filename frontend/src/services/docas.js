import api from "./api";

export const DocasAPI = {
  listar: async () => {
    const res = await api.get("/docas");
    return res.data.data;
  },

  obter: async (numero) => {
    const res = await api.get(`/docas/${numero}`);
    return res.data.data;
  },

  alocar: async (numero, payload) => {
    const res = await api.post(`/docas/${numero}/alocar`, payload);
    return res.data.data;
  },

  liberar: async (numero) => {
    const res = await api.delete(`/docas/${numero}/alocar`);
    return res.data;
  },
};
