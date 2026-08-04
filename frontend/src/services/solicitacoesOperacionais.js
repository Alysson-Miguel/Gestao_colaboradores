import api from "./api";

export const SolicitacoesOperacionaisAPI = {
  listar: async ({
    page = 1,
    limit = 50,
    status,
    tipo,
    dataInicio,
    dataFim,
    solicitante,
  } = {}) => {
    const params = new URLSearchParams({ page, limit });
    if (status)      params.set("status",      status);
    if (tipo)        params.set("tipo",        tipo);
    if (dataInicio)  params.set("dataInicio",  dataInicio);
    if (dataFim)     params.set("dataFim",     dataFim);
    if (solicitante) params.set("solicitante", solicitante);
    const res = await api.get(`/solicitacoes-operacionais?${params}`);
    return res.data; // { data, pagination }
  },

  stats: async () => {
    const res = await api.get("/solicitacoes-operacionais/stats");
    return res.data.data; // { pendentes, aprovadas, reprovadas, doMes }
  },

  calendario: async (inicio, fim) => {
    const res = await api.get("/solicitacoes-operacionais/calendario", { params: { inicio, fim } });
    return res.data.data;
  },

  obter: async (id) => {
    const res = await api.get(`/solicitacoes-operacionais/${id}`);
    return res.data.data;
  },

  buscarColaborador: async (cpf) => {
    const res = await api.get("/solicitacoes-operacionais/colaborador", { params: { cpf } });
    return res.data.data;
  },

  listarEscalasAtivas: async (opsId) => {
    const res = await api.get("/solicitacoes-operacionais/escalas", { params: { opsId } });
    return res.data.data;
  },

  criar: async (payload) => {
    const res = await api.post("/solicitacoes-operacionais", payload);
    return res.data.data;
  },

  importarSinergiaLote: async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await api.post("/solicitacoes-operacionais/sinergia/importar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data; // { criadas, totalLinhas, erros }
  },

  aprovar: async (id) => {
    const res = await api.post(`/solicitacoes-operacionais/${id}/aprovar`);
    return res.data.data;
  },

  reprovar: async (id, motivo) => {
    const res = await api.post(`/solicitacoes-operacionais/${id}/reprovar`, { motivo });
    return res.data.data;
  },
};
