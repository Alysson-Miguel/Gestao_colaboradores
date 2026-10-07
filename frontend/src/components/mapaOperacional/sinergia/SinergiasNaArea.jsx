import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeftRight } from "lucide-react";
import { SinergiaInternaAPI } from "../../../services/sinergiaInterna";
import { FOCO } from "../uiTokens";

const POLL_INTERVAL_MS = 20000;
let areasEmCache = null;

async function idDaArea(codigo) {
  areasEmCache = areasEmCache || SinergiaInternaAPI.metadados().then((m) => m.areas);
  const areas = await areasEmCache;
  return areas.find((a) => a.codigo === codigo)?.idArea ?? null;
}

/**
 * Quem está nesta área por Sinergia Interna (já chegou; retorno ainda não confirmado).
 * A localização operacional é o destino — a Label precisa mostrar isso, mesmo antes de
 * a pessoa ser alocada em braço/função.
 */
export function SinergiasNaArea({ codigo, titulo }) {
  const [pessoas, setPessoas] = useState([]);

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        const idAreaDestino = await idDaArea(codigo);
        if (!idAreaDestino) return;
        const resultado = await SinergiaInternaAPI.listar({ status: "SINERGIA_ATIVA,AGUARDANDO_RETORNO", idAreaDestino, limit: 100 });
        if (ativo) setPessoas(resultado.sinergias);
      } catch {
        if (ativo) setPessoas([]);
      }
    }
    carregar();
    const intervalo = setInterval(() => {
      if (!document.hidden) carregar();
    }, POLL_INTERVAL_MS);
    return () => {
      ativo = false;
      clearInterval(intervalo);
    };
  }, [codigo]);

  if (!pessoas.length) return null;

  return (
    <section aria-label={titulo} className="bg-surface rounded-2xl border border-default px-5 sm:px-6 py-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <ArrowLeftRight size={16} className="text-[#FA4C00]" aria-hidden="true" /> {titulo}
          <span className="text-xs font-medium text-muted tabular-nums">{pessoas.length}</span>
        </h2>
        <Link to="/operacao/label/sinergias" className={`text-sm text-muted hover:text-page underline-offset-2 hover:underline ${FOCO}`}>
          Ver sinergias
        </Link>
      </div>
      <ul className="flex flex-wrap gap-2">
        {pessoas.map((s) => (
          <li key={s.idSinergia} className="inline-flex items-center gap-2 h-8 px-3 rounded-lg bg-surface-2 text-sm">
            <span className="truncate max-w-[220px]">{s.colaborador.nomeCompleto}</span>
            <span className="text-xs text-muted">
              de {s.origem.nome}
              {s.funcaoDescricao ? ` · ${s.funcaoDescricao}` : ""}
            </span>
            {s.status === "AGUARDANDO_RETORNO" && <span className="text-[11px] font-medium text-[#F59E0B]">retorno pendente</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}
