import toast from "react-hot-toast";
import api from "./api";
import { confirmDialog } from "../components/ConfirmDialog";

function turnoParams({ turno, data } = {}) {
  const params = {};
  if (turno) params.turno = turno;
  if (data) params.data = data;
  return params;
}

export const MapaOperacionalAPI = {
  obterTurnoAtual: async () => {
    const res = await api.get("/mapa-operacional/turno-atual");
    return res.data.data;
  },

  listarEsteiras: async () => {
    const res = await api.get("/mapa-operacional/esteiras");
    return res.data.data;
  },

  listarAlocacoes: async (idEsteira, turnoSelecionado) => {
    const res = await api.get(`/mapa-operacional/esteiras/${idEsteira}/alocacoes`, {
      params: turnoParams(turnoSelecionado),
    });
    return res.data.data;
  },

  listarAutoAlocacoes: async (idEsteira, turnoSelecionado) => {
    const res = await api.get(`/mapa-operacional/esteiras/${idEsteira}/auto-alocacoes`, {
      params: turnoParams(turnoSelecionado),
    });
    return res.data.data;
  },

  obterProducaoTurno: async (idEsteira, turnoSelecionado) => {
    const res = await api.get(`/mapa-operacional/esteiras/${idEsteira}/producao-turno`, {
      params: turnoParams(turnoSelecionado),
    });
    return res.data.data;
  },

  // O backend barra quem está no packing automático ou em outra esteira/doca (orienta a pedir sinergia)
  // e, se a pessoa já está em outra função da mesma esteira, pede a confirmação do líder.
  // Erro já mostrado ao usuário volta com `tratado = true`: quem chamou não precisa avisar de novo.
  alocar: async (idEsteira, { braco, lado, opsId, diarista, labor }) => {
    const enviar = (extra = {}) =>
      api.post(`/mapa-operacional/esteiras/${idEsteira}/alocacoes`, { braco, lado, opsId, diarista, labor, ...extra });
    try {
      return (await enviar()).data.data;
    } catch (e) {
      const info = e.response?.data;
      const codigo = info?.errors?.codigo;
      if (codigo === "CONFIRMAR_SUBSTITUICAO") {
        if (!(await confirmDialog(info.message, { confirmText: "Mover" }))) {
          e.tratado = true;
          throw e;
        }
        return (await enviar({ confirmarSubstituicao: true })).data.data;
      }
      if (codigo) {
        toast.error(info.message, { duration: 8000 });
        e.tratado = true;
      }
      throw e;
    }
  },

  encerrarAlocacao: async (idEsteira, idAlocacao) => {
    const res = await api.delete(`/mapa-operacional/esteiras/${idEsteira}/alocacoes/${idAlocacao}`);
    return res.data;
  },

  // Pesca: braco/lado nulos = tirar do braço ("sem braço").
  moverAlocacao: async (idEsteira, idAlocacao, { braco = null, lado = null } = {}) => {
    const res = await api.post(`/mapa-operacional/esteiras/${idEsteira}/alocacoes/${idAlocacao}/mover`, { braco, lado });
    return res.data.data;
  },

  listarMovimentacoesPesca: async (idEsteira, { data } = {}) => {
    const res = await api.get(`/mapa-operacional/esteiras/${idEsteira}/pesca/movimentacoes`, {
      params: data ? { data } : {},
    });
    return res.data.data;
  },

  buscarColaboradoresElegiveis: async ({ contexto, turno, search }) => {
    const params = { contexto, search };
    if (turno) params.turno = turno;
    const res = await api.get("/mapa-operacional/colaboradores-elegiveis", { params });
    return res.data.data;
  },

  listarEfetivo: async (turno) => {
    const res = await api.get("/mapa-operacional/efetivo", { params: turno ? { turno } : {} });
    return res.data.data;
  },

  alocarFullD1: async ({ opsId, diarista }) => {
    const res = await api.post("/mapa-operacional/full-d1/alocacoes", { opsId, diarista });
    return res.data;
  },

  encerrarAlocacaoFullD1: async (idAlocacao) => {
    const res = await api.delete(`/mapa-operacional/full-d1/alocacoes/${idAlocacao}`);
    return res.data;
  },

  obterPainelExecutivo: async (data) => {
    const res = await api.get("/mapa-operacional/painel-executivo", { params: data ? { data } : {} });
    return res.data.data;
  },

  diaristasDisponiveis: async () => {
    const res = await api.get("/mapa-operacional/diaristas-disponiveis");
    return res.data.data;
  },

  listarFullD1: async (turnoSelecionado) => {
    const res = await api.get("/mapa-operacional/full-d1", {
      params: turnoParams(turnoSelecionado),
    });
    return res.data.data;
  },
};
