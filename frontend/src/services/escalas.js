import api from "./api";

export const EscalasAPI = {
  listar: async () => {
    const res = await api.get("/escalas");
    return res.data;
  },
};
