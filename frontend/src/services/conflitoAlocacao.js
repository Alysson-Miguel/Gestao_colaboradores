import toast from "react-hot-toast";
import { confirmDialog } from "../components/ConfirmDialog";

/**
 * O backend barra quem está no packing automático ou em outra esteira/doca (orienta a pedir Sinergia
 * Interna) e, se a pessoa já está em outra função da mesma área, pede a confirmação do líder.
 *
 * `enviar(extra)` faz a chamada; `extra` leva `{ confirmarSubstituicao: true }` na segunda tentativa.
 * Erro já mostrado ao usuário volta com `tratado = true`: quem chamou não precisa avisar de novo.
 */
export async function comTratamentoDeConflito(enviar) {
  try {
    return await enviar({});
  } catch (e) {
    const info = e.response?.data;
    const codigo = info?.errors?.codigo;
    if (codigo === "CONFIRMAR_SUBSTITUICAO") {
      if (!(await confirmDialog(info.message, { confirmText: "Mover" }))) {
        e.tratado = true;
        throw e;
      }
      return enviar({ confirmarSubstituicao: true });
    }
    if (codigo) {
      toast.error(info.message, { duration: 8000 });
      e.tratado = true;
    }
    throw e;
  }
}
