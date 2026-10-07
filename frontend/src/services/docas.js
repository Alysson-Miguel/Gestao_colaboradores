import api from "./api";
import { comTratamentoDeConflito } from "./conflitoAlocacao";

export const DocasAPI = {
  listar: async () => {
    const res = await api.get("/docas");
    return res.data.data;
  },

  obter: async (numero) => {
    const res = await api.get(`/docas/${numero}`);
    return res.data.data;
  },

  // Conflitos (packing automático, outra esteira, outra doca) tratados em conflitoAlocacao.js
  alocar: (numero, payload) =>
    comTratamentoDeConflito(async (extra) => (await api.post(`/docas/${numero}/alocar`, { ...payload, ...extra })).data.data),

  liberar: async (numero) => {
    const res = await api.delete(`/docas/${numero}/alocar`);
    return res.data;
  },
};
