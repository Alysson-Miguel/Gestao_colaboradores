import toast from "react-hot-toast";
import { confirmDialog } from "../components/ConfirmDialog";

// Respostas do backend que pedem a confirmação do usuário. A segunda tentativa leva o campo `extra`.
const CONFIRMACOES = {
  CONFIRMAR_SUBSTITUICAO: { extra: { confirmarSubstituicao: true }, texto: "Mover" },
  ALTERADO_RECENTEMENTE: { extra: { confirmarAlteracaoRecente: true }, texto: "Alterar mesmo assim" },
};

/**
 * O backend barra quem está no packing automático ou em outra esteira/doca (orienta a pedir Sinergia
 * Interna), pede confirmação do líder quando a pessoa já está em outra função da mesma área e, nos
 * fanouts, quando a posição foi alterada há menos de 1 hora.
 *
 * `enviar(extra)` faz a chamada; `extra` leva o campo de confirmação na segunda tentativa.
 * Erro já mostrado ao usuário volta com `tratado = true`: quem chamou não precisa avisar de novo.
 */
export async function comTratamentoDeConflito(enviar) {
  try {
    return await enviar({});
  } catch (e) {
    const info = e.response?.data;
    const codigo = info?.errors?.codigo;
    const confirmacao = CONFIRMACOES[codigo];
    if (confirmacao) {
      if (!(await confirmDialog(info.message, { confirmText: confirmacao.texto }))) {
        e.tratado = true;
        throw e;
      }
      return enviar(confirmacao.extra);
    }
    if (codigo) {
      toast.error(info.message, { duration: 8000 });
      e.tratado = true;
    }
    throw e;
  }
}
