import { useState, useEffect, useContext } from "react";
import { X } from "lucide-react";
import { Button } from "./UIComponents";
import { AuthContext } from "../context/AuthContext";
import { EstacoesAPI } from "../services/estacoes";
import { useEstacao } from "../context/EstacaoContext";

// Formata DateTime do banco para "HH:MM"
function toTimeString(val) {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return "";
  return d.toISOString().slice(11, 16);
}

export default function TurnoModal({ turno, onClose, onSave }) {
  const { user } = useContext(AuthContext);
  const { estacaoId: estacaoSelecionada } = useEstacao();

  const isAdmin = user?.role === "ADMIN";
  const precisaEscolherEstacao = isAdmin && !estacaoSelecionada && !turno;

  const [form, setForm] = useState({
    nomeTurno: turno?.nomeTurno || "",
    horarioInicio: toTimeString(turno?.horarioInicio),
    horarioFim: toTimeString(turno?.horarioFim),
    ativo: turno?.ativo ?? true,
    idEstacao: turno?.idEstacao || estacaoSelecionada || "",
  });
  const [saving, setSaving] = useState(false);
  const [estacoes, setEstacoes] = useState([]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  useEffect(() => {
    if (precisaEscolherEstacao) {
      EstacoesAPI.listar().then(setEstacoes).catch(() => {});
    }
  }, [precisaEscolherEstacao]);

  const handle = (field, value) => setForm((p) => ({ ...p, [field]: value }));

  const isValid = form.nomeTurno.trim() && form.horarioInicio && form.horarioFim
    && (!precisaEscolherEstacao || form.idEstacao);

  const handleSave = async () => {
    if (!isValid) return;
    setSaving(true);
    try {
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 sm:px-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-lg max-h-[92vh] bg-surface border border-default rounded-t-2xl sm:rounded-xl shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-default">
          <h2 className="text-base sm:text-lg font-semibold text-page">
            {turno ? "Editar Turno" : "Novo Turno"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-md hover:bg-surface-2 text-muted">
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Nome do Turno</label>
            <input
              value={form.nomeTurno}
              onChange={(e) => handle("nomeTurno", e.target.value)}
              placeholder="Ex: Turno A, Manhã, Noturno"
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-default text-page text-sm focus:outline-none focus:ring-1 focus:ring-[#FA4C00]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-muted mb-1">Horário Início</label>
              <input
                type="time"
                value={form.horarioInicio}
                onChange={(e) => handle("horarioInicio", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-default text-page text-sm focus:outline-none focus:ring-1 focus:ring-[#FA4C00]"
              />
            </div>
            <div>
              <label className="block text-xs text-muted mb-1">Horário Fim</label>
              <input
                type="time"
                value={form.horarioFim}
                onChange={(e) => handle("horarioFim", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-default text-page text-sm focus:outline-none focus:ring-1 focus:ring-[#FA4C00]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">Status</label>
            <select
              value={form.ativo ? "true" : "false"}
              onChange={(e) => handle("ativo", e.target.value === "true")}
              className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-default text-page text-sm"
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>

          {precisaEscolherEstacao && (
            <div>
              <label className="block text-xs text-muted mb-1">
                Estação <span className="text-red-400">*</span>
              </label>
              <select
                value={form.idEstacao}
                onChange={(e) => handle("idEstacao", e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-surface-2 border border-default text-page text-sm"
              >
                <option value="">Selecione uma estação</option>
                {estacoes.map((e) => (
                  <option key={e.idEstacao} value={e.idEstacao}>{e.nomeEstacao}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 px-6 py-4 border-t border-default">
          <Button.Secondary onClick={onClose} className="w-full sm:w-auto">Cancelar</Button.Secondary>
          <Button.Primary onClick={handleSave} disabled={saving || !isValid} className="w-full sm:w-auto">
            {saving ? "Salvando..." : turno ? "Salvar alterações" : "Criar turno"}
          </Button.Primary>
        </div>
      </div>
    </div>
  );
}
