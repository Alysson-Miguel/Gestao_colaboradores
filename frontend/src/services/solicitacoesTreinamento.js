import api from "./api";

export const SolicitacoesTreinamentoAPI = {
  listar: async ({
    page = 1,
    limit = 50,
    status,
    dataInicio,
    dataFim,
    idSetor,
    idTurno,
    processo,
    tema,
    solicitante,
  } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (status)      params.set("status",      status);
    if (dataInicio)  params.set("dataInicio",  dataInicio);
    if (dataFim)     params.set("dataFim",     dataFim);
    if (idSetor)     params.set("idSetor",     idSetor);
    if (idTurno)     params.set("idTurno",     idTurno);
    if (processo)    params.set("processo",    processo);
    if (tema)        params.set("tema",        tema);
    if (solicitante) params.set("solicitante", solicitante);
    const res = await api.get(`/solicitacoes-treinamento?${params}`);
    return res.data; // { data, pagination }
  },

  stats: async () => {
    const res = await api.get("/solicitacoes-treinamento/stats");
    return res.data.data; // { pendentes, aprovadas, negadas, agendadosSemana }
  },

  statsGraficos: async () => {
    const res = await api.get("/solicitacoes-treinamento/stats-graficos");
    return res.data.data;
  },

  calendario: async (inicio, fim) => {
    const res = await api.get("/solicitacoes-treinamento/calendario", { params: { inicio, fim } });
    return res.data.data;
  },

  obter: async (id) => {
    const res = await api.get(`/solicitacoes-treinamento/${id}`);
    return res.data.data;
  },

  criar: async (payload) => {
    const res = await api.post("/solicitacoes-treinamento", payload);
    return res.data.data;
  },

  validarConflitos: async (payload) => {
    const res = await api.post("/solicitacoes-treinamento/validar-conflitos", payload);
    return res.data.data; // { avisos: [] }
  },

  aprovar: async (id) => {
    const res = await api.post(`/solicitacoes-treinamento/${id}/aprovar`);
    return res.data.data;
  },

  negar: async (id, motivo) => {
    const res = await api.post(`/solicitacoes-treinamento/${id}/negar`, { motivo });
    return res.data.data;
  },
};
