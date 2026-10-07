import api from "./api";

const BASE = "/sinergias-internas";

export const SinergiaInternaAPI = {
  metadados: async () => (await api.get(`${BASE}/meta`)).data.data,

  buscarColaboradores: async (search) => (await api.get(`${BASE}/colaboradores`, { params: { search } })).data.data,

  listar: async (params) => (await api.get(BASE, { params })).data.data,

  detalhe: async (id) => (await api.get(`${BASE}/${id}`)).data.data,

  criar: async (corpo) => (await api.post(BASE, corpo)).data.data,

  enviar: async (id) => (await api.post(`${BASE}/${id}/enviar`)).data.data,

  cancelar: async (id, motivo) => (await api.post(`${BASE}/${id}/cancelar`, { motivo })).data.data,

  finalizar: async (id) => (await api.post(`${BASE}/${id}/finalizar`)).data.data,

  prorrogar: async (id, corpo) => (await api.post(`${BASE}/${id}/prorrogar`, corpo)).data.data,

  retornoManual: async (id, justificativa) => (await api.post(`${BASE}/${id}/retorno-manual`, { justificativa })).data.data,

  reemitirQr: async (id, tipo) => (await api.post(`${BASE}/${id}/reemitir-qr`, { tipo })).data.data,

  etiqueta: async (id, tipo) => (await api.get(`${BASE}/${id}/etiqueta`, { params: { tipo } })).data.data,

  // Etiqueta única de um lote (QR de grupo): um bip confirma todos os colaboradores do lote.
  etiquetaGrupo: async (idLote, tipo) => (await api.get(`${BASE}/lotes/${idLote}/etiqueta`, { params: { tipo } })).data.data,

  consultarQr: async ({ token, modo }) => (await api.post(`${BASE}/qr/consultar`, { token, modo })).data.data,

  confirmarQr: async ({ token, modo }) => (await api.post(`${BASE}/qr/confirmar`, { token, modo })).data.data,
};
