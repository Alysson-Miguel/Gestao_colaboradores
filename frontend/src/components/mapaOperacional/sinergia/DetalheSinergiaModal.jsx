import { useEffect, useState } from "react";
import { ArrowRight, Hourglass, Printer, RefreshCw, Send } from "lucide-react";
import { Aviso, Esqueleto, Modal } from "../ui";
import { BTN_PERIGO, BTN_PRIMARIO, BTN_SECUNDARIO } from "../uiTokens";
import { SinergiaInternaAPI } from "../../../services/sinergiaInterna";
import { StatusBadge } from "./StatusBadge";
import { ROTULO_EVENTO, formatarDataHora, formatarDia, formatarDuracao } from "./status";

function Linha({ rotulo, children }) {
  if (children == null || children === false) return null;
  return (
    <div className="flex items-baseline justify-between gap-4 py-2">
      <dt className="text-xs text-muted shrink-0">{rotulo}</dt>
      <dd className="text-sm text-right">{children}</dd>
    </div>
  );
}

const pessoa = (p) => p?.nome || null;

function BotoesDeAcao({ s, onAcao }) {
  const a = s.acoes;
  const botoes = [
    a.enviar && { id: "enviar", rotulo: "Confirmar envio e imprimir QR", icone: Send, classe: BTN_PRIMARIO },
    a.etiquetaIda && { id: "imprimirIda", rotulo: s.idLote ? "Imprimir QR do grupo (ida)" : "Imprimir QR de ida", icone: Printer, classe: BTN_PRIMARIO },
    a.etiquetaIda && s.idLote && { id: "imprimirIdaIndividual", rotulo: "Imprimir QR individual", icone: Printer, classe: BTN_SECUNDARIO },
    a.finalizar && { id: "finalizar", rotulo: "Finalizar sinergia", icone: Hourglass, classe: BTN_PRIMARIO },
    a.etiquetaRetorno && { id: "imprimirRetorno", rotulo: s.idLote ? "Imprimir QR do grupo (retorno)" : "Imprimir QR de retorno", icone: Printer, classe: BTN_PRIMARIO },
    a.etiquetaRetorno && s.idLote && { id: "imprimirRetornoIndividual", rotulo: "Imprimir QR individual", icone: Printer, classe: BTN_SECUNDARIO },
    a.prorrogar && { id: "prorrogar", rotulo: "Prorrogar", icone: RefreshCw, classe: BTN_SECUNDARIO },
    a.reemitirIda && { id: "reemitirIda", rotulo: "Reemitir QR de ida", icone: RefreshCw, classe: BTN_SECUNDARIO },
    a.reemitirRetorno && { id: "reemitirRetorno", rotulo: "Reemitir QR de retorno", icone: RefreshCw, classe: BTN_SECUNDARIO },
    a.retornoManual && { id: "retornoManual", rotulo: "Confirmar retorno sem QR", icone: null, classe: BTN_SECUNDARIO },
    a.cancelar && { id: "cancelar", rotulo: "Cancelar sinergia", icone: null, classe: BTN_PERIGO },
  ].filter(Boolean);

  if (!botoes.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {botoes.map(({ id, rotulo, icone: Icone, classe }) => (
        <button key={id} type="button" onClick={() => onAcao(id, s)} className={`${classe} h-10`}>
          {Icone && <Icone size={15} aria-hidden="true" />}
          {rotulo}
        </button>
      ))}
    </div>
  );
}

export function DetalheSinergiaModal({ idSinergia, versao, onClose, onAcao }) {
  const [dados, setDados] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    let ativo = true;
    SinergiaInternaAPI.detalhe(idSinergia)
      .then((d) => {
        if (ativo) {
          setDados(d);
          setErro(null);
        }
      })
      .catch((e) => ativo && setErro(e.response?.data?.message || "Não foi possível carregar a sinergia."));
    return () => {
      ativo = false;
    };
  }, [idSinergia, versao]);

  return (
    <Modal
      kicker="Sinergia Interna"
      titulo={dados ? dados.colaborador.nomeCompleto : "Carregando…"}
      subtitulo={dados ? `${dados.colaborador.opsId}${dados.colaborador.matricula ? ` · matrícula ${dados.colaborador.matricula}` : ""}` : undefined}
      onClose={onClose}
      largura="max-w-xl"
    >
      {erro ? (
        <Aviso tipo="erro">{erro}</Aviso>
      ) : !dados ? (
        <div aria-busy="true" aria-label="Carregando sinergia" className="space-y-3">
          <Esqueleto className="h-10" />
          <Esqueleto className="h-40" />
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="flex items-center gap-2 text-sm font-medium">
              {dados.origem.nome} <ArrowRight size={14} className="text-muted" aria-hidden="true" /> {dados.destino.nome}
            </p>
            <StatusBadge status={dados.status} />
          </div>

          {dados.status === "AGUARDANDO_RETORNO" && (
            <Aviso tipo="alerta">
              Retorno pendente: o colaborador continua em {dados.destino.nome} até o QR de retorno ser lido em {dados.origem.nome}.
            </Aviso>
          )}

          <BotoesDeAcao s={dados} onAcao={onAcao} />

          <dl className="divide-y divide-default rounded-xl border border-default px-4">
            <Linha rotulo="Motivo">
              {dados.motivoDescricao}
              {dados.motivoComplemento ? ` — ${dados.motivoComplemento}` : ""}
            </Linha>
            <Linha rotulo="Função no destino">{dados.funcaoDescricao}</Linha>
            <Linha rotulo="Turno · dia operacional">
              {dados.turno} · {formatarDia(dados.diaOperacional)}
            </Linha>
            <Linha rotulo="Período previsto">
              {formatarDataHora(dados.inicioPrevisto)} até {formatarDataHora(dados.fimPrevisto)}
              {dados.prorrogacoes > 0 && ` (${dados.prorrogacoes} prorrogação${dados.prorrogacoes > 1 ? "ões" : ""})`}
            </Linha>
            <Linha rotulo="Solicitado por">
              {pessoa(dados.solicitadoPor)} · {formatarDataHora(dados.dataSolicitacao)}
            </Linha>
            <Linha rotulo="Envio confirmado por">{dados.enviadoPor && `${pessoa(dados.enviadoPor)} · ${formatarDataHora(dados.dataEnvio)}`}</Linha>
            <Linha rotulo="Chegada confirmada por">{dados.recebidoPor && `${pessoa(dados.recebidoPor)} · ${formatarDataHora(dados.dataChegada)}`}</Linha>
            <Linha rotulo="Finalizada no destino por">{dados.finalizadoPor && `${pessoa(dados.finalizadoPor)} · ${formatarDataHora(dados.dataFimDestino)}`}</Linha>
            <Linha rotulo="Retorno confirmado por">
              {dados.retornoConfirmadoPor && `${pessoa(dados.retornoConfirmadoPor)} · ${formatarDataHora(dados.dataFinalizacao)}`}
            </Linha>
            {dados.retornoManual && <Linha rotulo="Retorno sem QR">{dados.retornoManualJustificativa}</Linha>}
            {dados.status === "CANCELADA" && (
              <Linha rotulo="Cancelada por">
                {pessoa(dados.canceladoPor)} — {dados.motivoCancelamento}
              </Linha>
            )}
            <Linha rotulo="Tempo em sinergia">{dados.tempoEmSinergiaMin != null && formatarDuracao(dados.tempoEmSinergiaMin)}</Linha>
          </dl>

          <section>
            <h3 className="text-xs text-muted uppercase tracking-wide mb-2">Histórico</h3>
            <ol className="space-y-2.5 border-l border-default pl-4 ml-1">
              {dados.eventos
                .filter((e) => !["ETIQUETA_GERADA"].includes(e.acao))
                .map((e) => (
                  <li key={e.idEvento} className="relative">
                    <span aria-hidden="true" className="absolute -left-[21px] top-1.5 h-2 w-2 rounded-full bg-[#FA4C00]" />
                    <p className="text-sm">{ROTULO_EVENTO[e.acao] || e.acao}</p>
                    <p className="text-xs text-muted">
                      {formatarDataHora(e.criadoEm)} · {e.usuario}
                      {e.detalhe?.resultado && e.detalhe.resultado !== "ok" ? ` · recusado: ${e.detalhe.resultado}` : ""}
                    </p>
                  </li>
                ))}
            </ol>
          </section>
        </>
      )}
    </Modal>
  );
}
