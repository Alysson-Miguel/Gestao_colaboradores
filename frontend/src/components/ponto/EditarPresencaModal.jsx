import { X, Save } from "lucide-react";
import { useState } from "react";

const STATUS_OPTIONS = [
  { code: "P", label: "Presente" },
  { code: "F", label: "Falta não justificada" },
  { code: "DSR", label: "DSR (Descanso Semanal Remunerado)" },
  { code: "AM", label: "Atestado médico" },
  { code: "AA", label: "Atestado acompanhamento" },
  { code: "FE", label: "Férias" },
  { code: "LM", label: "Licença maternidade" },
  { code: "LP", label: "Licença paternidade" },
  { code: "AFA", label: "Afastamento" },
  { code: "BH", label: "Banco de horas" },
  { code: "FO", label: "Folga" },
  { code: "T", label: "Transferido" },
  { code: "S1", label: "Sinergia enviada" },
];


export default function PresencaModal({
  open,
  onClose,
  onSave,
  colaborador,
  dia,
  registro,
}) {
  const [status, setStatus] = useState(registro?.codigo || "P");
  const [justificativa, setJustificativa] = useState("");

  if (!open) return null;

  function handleSave() {
    if (!justificativa.trim()) {
      alert("Justificativa é obrigatória");
      return;
    }

    onSave({
      opsId: colaborador.opsId,
      dataReferencia: dia.date,
      status,
      justificativa,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md bg-[#1A1A1C] rounded-2xl shadow-xl p-6 space-y-6">

        {/* HEADER */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Ajustar Presença</h2>
          <button onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* INFO */}
        <div className="text-sm text-[#BFBFC3] space-y-1">
          <div><b>Colaborador:</b> {colaborador.nomeCompleto}</div>
          <div><b>Data:</b> {dia.label}</div>
        </div>

        {/* STATUS */}
        <div className="space-y-2">
          <label className="text-xs text-[#BFBFC3]">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="
              w-full
              bg-[#2A2A2C]
              border border-[#3D3D40]
              rounded-xl
              px-4 py-2
              outline-none
              focus:ring-1 focus:ring-[#FA4C00]
            "
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.code} value={s.code}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {/* JUSTIFICATIVA */}
        <div className="space-y-2">
          <label className="text-xs text-[#BFBFC3]">
            Justificativa <span className="text-red-400">*</span>
          </label>
          <textarea
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            rows={3}
            placeholder="Ex: Esquecimento de ponto / Hora extra autorizada"
            className="
              w-full
              bg-[#2A2A2C]
              border border-[#3D3D40]
              rounded-xl
              px-4 py-2
              text-sm
              outline-none
              focus:ring-1 focus:ring-[#FA4C00]
            "
          />
        </div>

        {/* ACTIONS */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#2A2A2C]"
          >
            Cancelar
          </button>

          <button
            onClick={handleSave}
            className="
              flex items-center gap-2
              px-5 py-2
              bg-[#FA4C00]
              hover:bg-[#ff5a1a]
              rounded-xl
              font-medium
            "
          >
            <Save size={16} />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
