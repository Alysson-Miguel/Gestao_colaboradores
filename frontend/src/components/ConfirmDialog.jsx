import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

let listener = null;

/**
 * Substituto assíncrono do window.confirm() nativo, com o mesmo contrato
 * (resolve true/false), mas usando o modal estilizado do app.
 * Uso: const ok = await confirmDialog("Excluir X?", { danger: true });
 */
export function confirmDialog(message, opts = {}) {
  return new Promise((resolve) => {
    if (listener) {
      listener({ message, ...opts, resolve });
    } else {
      // fallback caso o host não esteja montado (não deveria acontecer em produção)
      resolve(window.confirm(message));
    }
  });
}

export function ConfirmDialogHost() {
  const [state, setState] = useState(null);

  useEffect(() => {
    listener = (payload) => setState(payload);
    return () => {
      listener = null;
    };
  }, []);

  if (!state) return null;

  const {
    message,
    danger = false,
    confirmText = danger ? "Excluir" : "Confirmar",
    cancelText = "Cancelar",
    resolve,
  } = state;

  function close(result) {
    setState(null);
    resolve(result);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={() => close(false)}
    >
      <div
        className="bg-surface rounded-2xl w-full max-w-sm border border-default shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-6">
          <div className={`p-2.5 rounded-xl shrink-0 ${danger ? "bg-[#FF453A]/10" : "bg-[#FA4C00]/10"}`}>
            <AlertTriangle size={20} className={danger ? "text-[#FF453A]" : "text-[#FA4C00]"} />
          </div>
          <p className="text-sm text-page leading-relaxed pt-1 whitespace-pre-line">{message}</p>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={() => close(false)}
            className="px-4 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-sm transition-colors cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={() => close(true)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-colors cursor-pointer ${
              danger ? "bg-[#FF453A] hover:bg-[#D93B30]" : "bg-[#FA4C00] hover:bg-[#D84300]"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
