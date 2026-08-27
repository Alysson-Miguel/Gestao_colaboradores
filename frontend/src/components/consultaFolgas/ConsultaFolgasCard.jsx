import { useState } from "react";
import { Search, AlertTriangle, CalendarDays, ArrowLeft, Loader2 } from "lucide-react";
import { ConsultaFolgasAPI } from "../../services/consultaFolgas";

function formatCpf(digits) {
  const d = digits.slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
const DIAS_SEMANA = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"];

function formatDiaCompleto(isoDate) {
  const [y, m, d] = isoDate.split("-").map(Number);
  const data = new Date(Date.UTC(y, m - 1, d));
  return { dia: String(d).padStart(2, "0"), diaSemana: DIAS_SEMANA[data.getUTCDay()].toUpperCase() };
}

function fieldCls() {
  return "w-full pl-11 pr-4 py-3 bg-surface-2 border border-default rounded-xl text-sm text-page placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-[#FA4C00] transition-shadow";
}

const TIPO_COLOR = {
  "Folga Dominical": { bg: "bg-[#FA4C00]/10", text: "text-[#FA4C00]", border: "border-[#FA4C00]/20" },
  "DSR Semanal": { bg: "bg-surface-2", text: "text-muted", border: "border-default" },
  "Troca de DSR": { bg: "bg-[#0A84FF]/10", text: "text-[#0A84FF]", border: "border-[#0A84FF]/20" },
  Folga: { bg: "bg-[#34C759]/10", text: "text-[#34C759]", border: "border-[#34C759]/20" },
};

export default function ConsultaFolgasCard() {
  const [cpf, setCpf] = useState("");
  const [opsId, setOpsId] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultado, setResultado] = useState(null);

  const handleCpfChange = (e) => {
    setCpf(formatCpf(e.target.value.replace(/\D/g, "")));
  };

  const consultar = async (e) => {
    e.preventDefault();
    setErro(null);

    const cpfDigits = cpf.replace(/\D/g, "");
    if (cpfDigits.length !== 11 || !opsId.trim()) {
      setErro("Preencha o CPF completo e o Ops ID.");
      return;
    }

    try {
      setLoading(true);
      const data = await ConsultaFolgasAPI.consultar(cpfDigits, opsId.trim());
      setResultado(data);
    } catch (err) {
      setErro(err.response?.data?.message || "Não foi possível consultar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const novaConsulta = () => {
    setResultado(null);
    setErro(null);
    setCpf("");
    setOpsId("");
  };

  if (resultado) {
    const [ano, mes] = resultado.mesReferencia.split("-").map(Number);
    const nomeMes = MESES[mes - 1];
    const hojeIso = new Date().toISOString().slice(0, 10);
    const proxima = resultado.folgas.find((f) => f.data >= hojeIso) || null;

    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center text-sm font-semibold text-[#FA4C00] shrink-0">
            {resultado.nomeCompleto?.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-page truncate">{resultado.nomeCompleto}</p>
            <p className="text-xs text-muted">
              {[resultado.turno, resultado.setor].filter(Boolean).join(" · ") || "—"}
            </p>
          </div>
        </div>

        <p className="text-xs text-muted uppercase tracking-wide">
          Folgas de {nomeMes} de {ano}
        </p>

        {proxima && (
          <div className="rounded-xl border border-[#FA4C00]/25 bg-[#FA4C00]/5 p-4">
            <p className="text-[10px] font-semibold text-[#FA4C00] uppercase tracking-wide mb-1">Próxima folga</p>
            {(() => {
              const { dia, diaSemana } = formatDiaCompleto(proxima.data);
              return (
                <p className="text-sm text-page">
                  <span className="font-semibold">{diaSemana}, dia {dia}</span> — {proxima.tipo}
                </p>
              );
            })()}
          </div>
        )}

        {resultado.folgas.length === 0 ? (
          <p className="text-sm text-muted bg-surface-2 rounded-xl px-4 py-6 text-center">
            Nenhuma folga registrada para este mês ainda.
          </p>
        ) : (
          <div className="space-y-2">
            {resultado.folgas.map((f, i) => {
              const { dia, diaSemana } = formatDiaCompleto(f.data);
              const cor = TIPO_COLOR[f.tipo] || TIPO_COLOR["DSR Semanal"];
              return (
                <div key={i} className="flex items-center gap-3 bg-surface-2 rounded-xl px-4 py-2.5">
                  <div className="text-center w-9 shrink-0">
                    <p className="text-sm font-semibold text-page leading-none">{dia}</p>
                    <p className="text-[9px] text-muted mt-1">{diaSemana}</p>
                  </div>
                  <div className="flex-1" />
                  <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${cor.bg} ${cor.text} ${cor.border}`}>
                    {f.tipo}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={novaConsulta}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-default bg-surface hover:bg-surface-2 text-sm text-muted hover:text-page transition-colors cursor-pointer"
        >
          <ArrowLeft size={15} /> Nova consulta
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={consultar} className="space-y-5">
      <div className="space-y-1.5">
        <label htmlFor="consulta-cpf" className="text-xs font-medium text-muted">CPF</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            id="consulta-cpf"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={handleCpfChange}
            className={fieldCls()}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="consulta-opsid" className="text-xs font-medium text-muted">Ops ID</label>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
          <input
            id="consulta-opsid"
            type="text"
            autoComplete="off"
            placeholder="Ops123456"
            value={opsId}
            onChange={(e) => setOpsId(e.target.value)}
            className={fieldCls()}
          />
        </div>
      </div>

      {erro && (
        <div className="flex gap-2.5 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/5 p-3">
          <AlertTriangle size={15} className="text-[#FF453A] shrink-0 mt-0.5" />
          <p className="text-xs text-[#FF453A]">{erro}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#FA4C00] hover:bg-[#ff5e1a] text-white font-medium transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? <Loader2 size={16} className="animate-spin" /> : <CalendarDays size={16} />}
        {loading ? "Consultando..." : "Consultar folgas"}
      </button>
    </form>
  );
}
