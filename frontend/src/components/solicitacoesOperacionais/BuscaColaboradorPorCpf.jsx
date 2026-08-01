import { useEffect, useRef, useState } from "react";
import { Search, CheckCircle2, XCircle, User, Briefcase, Building2, Clock, UserCog } from "lucide-react";
import { SolicitacoesOperacionaisAPI } from "../../services/solicitacoesOperacionais";

function maskCpf(v) {
  const digits = (v || "").replace(/\D/g, "").slice(0, 11);
  return digits
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

/**
 * Busca inteligente por CPF — usada nos 4 formulários de Solicitação
 * Operacional (inclusive os dois lados da Troca de DSR).
 * Preenche automaticamente um card read-only com os dados do colaborador.
 */
export function BuscaColaboradorPorCpf({ label = "CPF do Colaborador", value, onFound, onClear }) {
  const [cpfInput, setCpfInput] = useState(value || "");
  const [colaborador, setColaborador] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [naoEncontrado, setNaoEncontrado] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    const digits = cpfInput.replace(/\D/g, "");
    clearTimeout(timer.current);
    setNaoEncontrado(false);

    if (digits.length !== 11) {
      setColaborador(null);
      onClear?.();
      return;
    }

    timer.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const data = await SolicitacoesOperacionaisAPI.buscarColaborador(digits);
        setColaborador(data);
        onFound?.(data);
      } catch (e) {
        setColaborador(null);
        setNaoEncontrado(true);
        onClear?.();
      } finally {
        setBuscando(false);
      }
    }, 400);

    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cpfInput]);

  return (
    <div className="space-y-2.5">
      <div className="space-y-1.5">
        <label className="text-xs text-muted">{label}</label>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            type="text"
            value={maskCpf(cpfInput)}
            onChange={(e) => setCpfInput(e.target.value)}
            placeholder="000.000.000-00"
            className="w-full pl-9 pr-9 py-2.5 bg-surface-2 border border-default rounded-xl text-sm text-page placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all"
          />
          {buscando && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-[#FA4C00] border-t-transparent animate-spin" />
          )}
          {!buscando && colaborador && (
            <CheckCircle2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#34C759]" />
          )}
          {!buscando && naoEncontrado && (
            <XCircle size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#FF453A]" />
          )}
        </div>
      </div>

      {naoEncontrado && (
        <p className="text-xs text-[#FF453A] bg-[#FF453A]/5 border border-[#FF453A]/20 rounded-xl px-3 py-2.5">
          Colaborador não encontrado. Confira o CPF informado.
        </p>
      )}

      {colaborador && (
        <div className="bg-surface-2 border border-default rounded-xl p-3.5 space-y-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#FA4C00]/10 text-[#FA4C00] flex items-center justify-center shrink-0">
              <User size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{colaborador.nomeCompleto}</p>
              <p className="text-xs text-muted">Ops ID {colaborador.opsId} • Matrícula {colaborador.matricula || "—"}</p>
            </div>
            <span
              className={`ml-auto shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                colaborador.status === "ATIVO" ? "bg-[#34C759]/10 text-[#34C759]" : "bg-surface-3 text-muted"
              }`}
            >
              {colaborador.status}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-muted"><Briefcase size={12} /> {colaborador.cargo || "—"}</div>
            <div className="flex items-center gap-1.5 text-muted"><Building2 size={12} /> {colaborador.setor || "—"}</div>
            <div className="flex items-center gap-1.5 text-muted"><Clock size={12} /> {colaborador.turno || "—"}</div>
            <div className="flex items-center gap-1.5 text-muted"><UserCog size={12} /> {colaborador.lider || "—"}</div>
            <div className="col-span-2 text-muted">{colaborador.empresa || "—"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
