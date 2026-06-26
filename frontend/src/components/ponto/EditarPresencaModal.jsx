import { X, Save, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { ajustarPresencaManual, deletarFrequencia } from "../../services/presenca";

/* =============================
   STATUS PERMITIDOS
============================= */
const STATUS_OPTIONS = [
  { code: "AFA", label: "Afastamento" },
  { code: "BH", label: "Banco de horas" },
  { code: "DSR", label: "DSR" },
  { code: "DF", label: "Desligamento Forçado"},
  { code: "DV", label: "Desligamento Voluntario"},
  { code: "FE", label: "Férias" },
  { code: "FO", label: "Folga" },
  { code: "F", label: "Falta não justificada" },
  { code: "LM", label: "Licença maternidade" },
  { code: "LP", label: "Licença paternidade" },
  { code: "NC", label: "Não contratado"},
  { code: "P", label: "Presente", adminOnly: true },
  { code: "S1", label: "Sinergia enviada" },
  { code: "TR", label: "Transferido" },
  { code: "ON", label: "Onboarding" },
];

/* =============================
   JUSTIFICATIVAS PADRÃO
============================= */
const JUSTIFICATIVAS = [
  { code: "BANCO_DE_HORAS", label: "Banco de Horas" },
  { code: "ESQUECIMENTO_MARCACAO", label: "Esquecimento da marcação" },
  { code: "ALTERACAO_PONTO", label: "Alteração de ponto" },
  { code: "MARCACAO_INDEVIDA", label: "Marcação indevida" },
  { code: "ATESTADO_MEDICO", label: "Atestado médico" },
  { code: "SINERGIA_ENVIADA", label: "Sinergia enviada" },
  { code: "LICENCA", label: "Licença" },
  { code: "HORA_EXTRA", label: "Hora Extra"},
  { code: "FALTA_INJUSTIFICADA", label: "Falta injustificada" },
];

function autoJustificativa(status) {
  if (status === "ON") return "ON";
  if (status === "F") return "FALTA_INJUSTIFICADA";
  if (status === "S1") return "SINERGIA_ENVIADA";
  return "BANCO_DE_HORAS";
}

export default function EditarPresencaModal({
  open,
  onClose,
  colaborador,
  dia,
  registro,
  isAdmin = false,
  onSuccess,
  onDelete,
}) {
  const [status, setStatus] = useState("");
  const [justificativa, setJustificativa] = useState("BANCO_DE_HORAS");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const statusInicial = registro?.status && registro.status !== "-"
      ? registro.status
      : (registro?.entrada ? "P" : "");
    setStatus(statusInicial);
    setJustificativa(autoJustificativa(statusInicial));
  }, [open, registro]);

  useEffect(() => {
    setJustificativa(autoJustificativa(status));
  }, [status]);

  if (!open) return null;

  async function handleDelete() {
    if (!registro?.idFrequencia) return;
    if (!window.confirm("Apagar este registro de frequência? Esta ação não pode ser desfeita.")) return;

    try {
      setLoading(true);
      await deletarFrequencia(registro.idFrequencia);
      alert("Registro apagado com sucesso");
      onDelete?.({ opsId: colaborador.opsId, dataReferencia: dia.date });
      onClose();
    } catch (err) {
      console.error(err);
      alert(err?.response?.data?.message || "Erro ao apagar registro");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!status) {
      alert("Status é obrigatório");
      return;
    }

    if (!justificativa) {
      alert("Justificativa é obrigatória");
      return;
    }

    try {
      setLoading(true);

      await ajustarPresencaManual({
        opsId: colaborador.opsId,
        dataReferencia: dia.date,
        status,
        justificativa,
        horaEntrada: null,
        horaSaida: null,
      });

      alert("Presença ajustada com sucesso");

      onSuccess?.({
        opsId: colaborador.opsId,
        dataReferencia: dia.date,
        status,
        horaEntrada: null,
        horaSaida: null,
      });

      onClose();

    } catch (err) {
      console.error(err);
      alert(
        err?.response?.data?.message ||
          "Erro ao ajustar presença"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center pt-10 sm:pt-0 p-4">
      <div
        className="
          w-full
          max-w-md
          max-h-[90vh]
          overflow-y-auto
          bg-surface
          rounded-2xl
          shadow-xl
          p-6
          space-y-6
        "
      >

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ajustar Presença</h2>
          <button onClick={onClose} disabled={loading}>
            <X size={20} />
          </button>
        </div>

        {/* INFO */}
        <div className="text-sm text-muted space-y-1">
          <div><b>Colaborador:</b> {colaborador?.nome || "-"}</div>
          <div><b>Data:</b> {dia.label}</div>
        </div>

        {/* STATUS */}
        <div>
          <label className="text-xs text-muted">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-surface-2 border border-default rounded-xl px-4 py-2"
          >
            <option value="">Selecione um status</option>

            {STATUS_OPTIONS.filter((s) => !s.adminOnly || isAdmin).map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* JUSTIFICATIVA */}
        <div>
          <label className="text-xs text-muted">
            Justificativa <span className="text-red-400">*</span>
          </label>
          <select
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            className="w-full bg-surface-2 border border-default rounded-xl px-4 py-2"
          >
            <option value="">Selecione uma justificativa</option>
            {JUSTIFICATIVAS.map((j) => (
              <option key={j.code} value={j.code}>
                {j.label}
              </option>
            ))}
          </select>
        </div>

        {/* ACTIONS */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl bg-surface-2"
          >
            Cancelar
          </button>

          {isAdmin && registro?.idFrequencia && (
            <button
              onClick={handleDelete}
              disabled={loading}
              title="Apagar registro"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-700 hover:bg-red-600 rounded-lg font-medium disabled:opacity-60"
            >
              <Trash2 size={13} />
              {loading ? "Apagando..." : "Apagar"}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2 bg-[#FA4C00] rounded-xl font-medium disabled:opacity-60"
          >
            <Save size={16} />
            {loading ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>
    </div>
  );
}
