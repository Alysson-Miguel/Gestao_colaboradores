import { useState, useEffect, useContext } from "react";
import { Button } from "../components/UIComponents";
import { X } from "lucide-react";
import { AuthContext } from "../context/AuthContext";
import { EstacoesAPI } from "../services/estacoes";
import { useEstacao } from "../context/EstacaoContext";

export default function CargoModal({ cargo, onClose, onSave }) {
  const { user } = useContext(AuthContext);
  const { estacaoId: estacaoSelecionada } = useEstacao();

  const isAdmin = user?.role === "ADMIN";
  const precisaEscolherEstacao = isAdmin && !estacaoSelecionada && !cargo;

  const [form, setForm] = useState(() => ({
    nomeCargo: cargo?.nomeCargo || "",
    nivel: cargo?.nivel || "",
    descricao: cargo?.descricao || "",
    ativo: cargo?.ativo ?? true,
    idEstacao: cargo?.idEstacao || estacaoSelecionada || "",
  }));
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

  const handle = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const isValid = form.nomeCargo.trim() && (!precisaEscolherEstacao || form.idEstacao);

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
      
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="
          relative z-10
          w-full
          max-w-lg
          max-h-[90vh]
          bg-surface
          rounded-t-2xl sm:rounded-xl
          border border-default
          shadow-2xl
          flex flex-col
        "
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-default">
          <h2 className="text-base sm:text-lg font-semibold text-page">
            {cargo ? "Editar Cargo" : "Novo Cargo"}
          </h2>

          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-surface-2 text-muted"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT (SCROLLÁVEL) */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          
          <div>
            <label className="block text-xs text-muted mb-1">
              Nome do Cargo
            </label>
            <input
              value={form.nomeCargo}
              onChange={(e) => handle("nomeCargo", e.target.value)}
              className="
                w-full px-4 py-3 rounded-lg
                bg-surface-2 border border-default
                text-page text-sm
                focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
              "
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">
              Nível
            </label>
            <input
              value={form.nivel}
              onChange={(e) => handle("nivel", e.target.value)}
              placeholder="Ex: Júnior, Pleno, Sênior"
              className="
                w-full px-4 py-3 rounded-lg
                bg-surface-2 border border-default
                text-page text-sm
                focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
              "
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">
              Descrição
            </label>
            <textarea
              rows={3}
              value={form.descricao}
              onChange={(e) => handle("descricao", e.target.value)}
              className="
                w-full px-4 py-3 rounded-lg
                bg-surface-2 border border-default
                text-page text-sm
                focus:outline-none focus:ring-1 focus:ring-[#FA4C00]
              "
            />
          </div>

          <div>
            <label className="block text-xs text-muted mb-1">
              Status
            </label>
            <select
              value={form.ativo ? "true" : "false"}
              onChange={(e) => handle("ativo", e.target.value === "true")}
              className="
                w-full px-4 py-3 rounded-lg
                bg-surface-2 border border-default
                text-page text-sm
              "
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
                className="w-full px-4 py-3 rounded-lg bg-surface-2 border border-default text-page text-sm"
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
        <div className="flex flex-col sm:flex-row justify-end gap-3 px-4 sm:px-6 py-4 border-t border-default">
          <Button.Secondary onClick={onClose} className="w-full sm:w-auto">
            Cancelar
          </Button.Secondary>

          <Button.Primary
            onClick={handleSave}
            disabled={saving || !isValid}
            className="w-full sm:w-auto"
          >
            {saving ? "Salvando..." : cargo ? "Salvar alterações" : "Criar cargo"}
          </Button.Primary>
        </div>
      </div>
    </div>
  );
}