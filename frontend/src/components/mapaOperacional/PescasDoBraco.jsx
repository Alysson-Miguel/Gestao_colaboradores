import { useEffect, useState } from "react";
import { ListChecks, Plus, User, UserPlus2 } from "lucide-react";
import toast from "react-hot-toast";
import { AbasSegmentadas, BuscaColaborador, PainelDiarista } from "./ui";
import { BTN_SECUNDARIO, COR_PESCA, FOCO, rotuloPosicao } from "./uiTokens";
import { MapaOperacionalAPI } from "../../services/mapaOperacional";

const nomeDe = (p) => (p.diarista ? "Diarista" : p.colaborador?.nomeCompleto || p.opsId || "—");

function AdicionarPesca({ esteira, braco, outras, onFeito }) {
  const [aba, setAba] = useState(outras.length ? "esteira" : "colaborador");
  const [ocupado, setOcupado] = useState(false);
  const [saldoDiarista, setSaldoDiarista] = useState(null);

  useEffect(() => {
    MapaOperacionalAPI.diaristasDisponiveis()
      .then(setSaldoDiarista)
      .catch(() => setSaldoDiarista(null));
  }, []);

  async function executar(acao, sucesso) {
    setOcupado(true);
    try {
      await acao();
      toast.success(sucesso);
      await onFeito();
    } catch (e) {
      if (!e.tratado) toast.error(e.response?.data?.message || "Não foi possível adicionar a pesca");
      await onFeito();
    } finally {
      setOcupado(false);
    }
  }

  const destino = `Braço ${braco.numero}${braco.lado}`;
  const alocarNovo = (opsId, diarista) =>
    executar(
      () => MapaOperacionalAPI.alocar(esteira.idEsteira, { opsId, diarista, labor: "PESCA", braco: braco.numero, lado: braco.lado }),
      diarista ? `Diarista alocado em pesca no ${destino}` : `Pesca alocada no ${destino}`
    );
  const trazer = (p) =>
    executar(
      () => MapaOperacionalAPI.moverAlocacao(esteira.idEsteira, p.idAlocacao, { braco: braco.numero, lado: braco.lado }),
      `${nomeDe(p)} → ${destino}`
    );

  return (
    <div className="space-y-3 rounded-xl border border-default p-3">
      <AbasSegmentadas
        rotulo="Origem da pesca"
        valor={aba}
        onChange={setAba}
        opcoes={[
          { valor: "esteira", rotulo: `Já na esteira · ${outras.length}`, icone: <ListChecks size={14} aria-hidden="true" /> },
          { valor: "colaborador", rotulo: "Colaborador", icone: <User size={14} aria-hidden="true" /> },
          { valor: "diarista", rotulo: "Diarista", icone: <UserPlus2 size={14} aria-hidden="true" /> },
        ]}
      />

      {aba === "esteira" &&
        (outras.length === 0 ? (
          <p className="text-sm text-muted text-center py-3">Não há outras pescas nesta esteira. Use “Colaborador” para alocar uma nova.</p>
        ) : (
          <ul aria-label="Pescas da esteira" className="rounded-xl border border-default divide-y divide-default max-h-56 overflow-y-auto">
            {outras.map((p) => (
              <li key={p.idAlocacao}>
                <button
                  type="button"
                  onClick={() => trazer(p)}
                  disabled={ocupado}
                  className={`w-full text-left px-3.5 py-2.5 min-h-[44px] hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-wait ${FOCO}`}
                >
                  <span className="block text-sm">{nomeDe(p)}</span>
                  <span className="block text-xs text-muted mt-0.5">Agora: {rotuloPosicao(p.braco, p.lado)}. Toque para trazer para o {destino}</span>
                </button>
              </li>
            ))}
          </ul>
        ))}
      {aba === "colaborador" && <BuscaColaborador contexto="ESTEIRA" onSelecionar={(c) => alocarNovo(c.opsId, false)} desabilitado={ocupado} />}
      {aba === "diarista" && (
        <PainelDiarista saldo={saldoDiarista} rotuloAcao={`Alocar diarista em pesca no ${destino}`} onAlocar={() => alocarNovo(null, true)} ocupado={ocupado} />
      )}
    </div>
  );
}

/**
 * Pescas deste braço dentro do modal do braço: ver, tirar do braço e adicionar
 * (trazendo uma pesca já alocada na esteira ou alocando uma nova direto aqui).
 */
export function PescasDoBraco({ esteira, braco, pescas = [], todasPescas = [], editavel = false, onChanged }) {
  const [adicionando, setAdicionando] = useState(false);
  const [tirando, setTirando] = useState(null);

  if (!editavel && pescas.length === 0) return null;

  const idsAqui = new Set(pescas.map((p) => p.idAlocacao));
  const outras = todasPescas.filter((p) => !idsAqui.has(p.idAlocacao));

  async function tirar(p) {
    setTirando(p.idAlocacao);
    try {
      await MapaOperacionalAPI.moverAlocacao(esteira.idEsteira, p.idAlocacao, { braco: null, lado: null });
      toast.success(`${nomeDe(p)} saiu do braço`);
    } catch (e) {
      toast.error(e.response?.data?.message || "Não foi possível tirar do braço");
    } finally {
      await onChanged?.();
      setTirando(null);
    }
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-xs text-muted uppercase tracking-wide">
          <span aria-hidden="true" className="w-2 h-2 rounded-full" style={{ background: COR_PESCA }} />
          Pesca neste braço <span className="tabular-nums normal-case">{pescas.length}</span>
        </h3>
        {editavel && !adicionando && (
          <button type="button" onClick={() => setAdicionando(true)} className={`${BTN_SECUNDARIO} h-9`}>
            <Plus size={14} aria-hidden="true" /> Adicionar pesca
          </button>
        )}
      </div>

      {pescas.length === 0 ? (
        <p className="text-sm text-muted">Nenhuma pesca neste braço.</p>
      ) : (
        <ul className="rounded-xl border border-default divide-y divide-default">
          {pescas.map((p) => (
            <li key={p.idAlocacao} className="px-3.5 py-2.5 flex items-center gap-3 min-h-[44px]">
              <span className="text-sm truncate flex-1 min-w-0" title={nomeDe(p)}>{nomeDe(p)}</span>
              <span className="shrink-0 h-6 px-2 inline-flex items-center rounded-full text-[11px] font-semibold text-white" style={{ background: COR_PESCA }}>
                Pesca
              </span>
              {editavel && (
                <button
                  type="button"
                  onClick={() => tirar(p)}
                  disabled={tirando === p.idAlocacao}
                  aria-label={`Tirar ${nomeDe(p)} do braço ${braco.numero}${braco.lado}`}
                  className={`shrink-0 h-9 px-2.5 rounded-lg text-xs text-muted hover:text-page hover:bg-surface-2 cursor-pointer disabled:opacity-50 ${FOCO}`}
                >
                  Tirar do braço
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {editavel && adicionando && (
        <>
          <AdicionarPesca esteira={esteira} braco={braco} outras={outras} onFeito={async () => onChanged?.()} />
          <button type="button" onClick={() => setAdicionando(false)} className={`text-xs text-muted hover:text-page underline-offset-2 hover:underline cursor-pointer ${FOCO}`}>
            Fechar
          </button>
        </>
      )}
    </div>
  );
}
