import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowLeft, CircleAlert, CircleCheck, Keyboard, Loader2, ScanBarcode, ScanLine } from "lucide-react";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import MainLayout from "../../components/MainLayout";
import { LeitorCamera } from "../../components/mapaOperacional/LeitorCamera";
import { useLeitorDeMao } from "../../components/mapaOperacional/useLeitorDeMao";
import { AbasSegmentadas, PageHeader } from "../../components/mapaOperacional/ui";
import { BTN_PRIMARIO, BTN_SECUNDARIO, FOCO, INPUT } from "../../components/mapaOperacional/uiTokens";
import { StatusBadge } from "../../components/mapaOperacional/sinergia/StatusBadge";
import { formatarDataHora } from "../../components/mapaOperacional/sinergia/status";
import { SinergiaInternaAPI } from "../../services/sinergiaInterna";

const TEXTOS = {
  chegada: {
    titulo: "Confirmar chegada",
    subtitulo: "Escaneie o QR de ida da etiqueta do colaborador que chegou ao seu setor",
    botao: "Confirmar chegada",
    origemRotulo: "Origem",
    destinoRotulo: "Destino",
    sucesso: (destino) => `Chegada confirmada. A localização agora é ${destino}.`,
  },
  retorno: {
    titulo: "Confirmar retorno",
    subtitulo: "Escaneie o QR de retorno da etiqueta do colaborador que voltou ao seu setor",
    botao: "Confirmar retorno",
    origemRotulo: "Setor original",
    destinoRotulo: "Setor da sinergia",
    sucesso: (_destino, origem) => `Retorno confirmado. A localização voltou para ${origem}.`,
  },
};

// Só letras e números contam: leitor de mão pode trocar o hífen por outro símbolo conforme o layout do teclado.
const normalizar = (texto) => String(texto || "").toUpperCase().replace(/[^A-Z0-9]/g, "");

// Em celular/tablet o foco automático abriria o teclado na cara do operador.
const temMouse = () => typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches;

function Dado({ rotulo, children }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-muted">{rotulo}</dt>
      <dd className="text-base font-semibold mt-0.5">{children}</dd>
    </div>
  );
}

export default function LeitorSinergia() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [params, setParams] = useSearchParams();
  const modo = params.get("modo") === "retorno" ? "retorno" : "chegada";
  const textos = TEXTOS[modo];

  const [fase, setFase] = useState("ler"); // ler | conferir | feito | erro
  const [preview, setPreview] = useState(null);
  const [tokenLido, setTokenLido] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [processando, setProcessando] = useState(false);
  const [confirmadas, setConfirmadas] = useState(0);
  const [resultadoGrupo, setResultadoGrupo] = useState(null);
  const [codigoDigitado, setCodigoDigitado] = useState("");
  const ocupadoRef = useRef(false);
  const campoRef = useRef(null);

  const reiniciar = useCallback(() => {
    setFase("ler");
    setPreview(null);
    setTokenLido("");
    setMensagem("");
    setResultadoGrupo(null);
    setCodigoDigitado("");
  }, []);

  // Voltou a ficar pronto pra ler: devolve o foco ao campo do leitor (só onde há mouse/teclado físico).
  useEffect(() => {
    if (fase === "ler" && temMouse()) campoRef.current?.focus();
  }, [fase]);

  const trocarModo = (novo) => {
    setParams({ modo: novo }, { replace: true });
    reiniciar();
  };

  const consultar = useCallback(
    async (texto) => {
      if (ocupadoRef.current) return;
      ocupadoRef.current = true;
      setProcessando(true);
      try {
        const dados = await SinergiaInternaAPI.consultarQr({ token: texto, modo });
        setTokenLido(texto);
        setPreview(dados);
        setFase("conferir");
      } catch (e) {
        setMensagem(e.response?.data?.message || "Não foi possível ler o QR Code.");
        setFase("erro");
      } finally {
        ocupadoRef.current = false;
        setProcessando(false);
      }
    },
    [modo]
  );

  const confirmar = useCallback(async () => {
    if (ocupadoRef.current) return;
    ocupadoRef.current = true;
    setProcessando(true);
    try {
      const dados = await SinergiaInternaAPI.confirmarQr({ token: tokenLido, modo });
      if (dados.grupo) {
        setResultadoGrupo(dados);
        setMensagem(dados.mensagem);
        setConfirmadas((n) => n + dados.confirmadas);
      } else {
        setMensagem(
          `${textos.sucesso(dados.destino.nome, dados.origem.nome)}${dados.alocadoEm ? ` Já está alocado em ${dados.alocadoEm}.` : ""}`
        );
        setConfirmadas((n) => n + 1);
      }
      setFase("feito");
    } catch (e) {
      setMensagem(e.response?.data?.message || "Não foi possível confirmar.");
      setFase("erro");
    } finally {
      ocupadoRef.current = false;
      setProcessando(false);
    }
  }, [modo, textos, tokenLido]);

  /**
   * Entrada única de código (câmera, leitor de mão ou digitação):
   * - conferindo e o MESMO código de novo (segundo bip) -> confirma;
   * - qualquer outro código, em qualquer fase -> começa uma nova leitura.
   */
  const aoLerCodigo = useCallback(
    (texto) => {
      if (!normalizar(texto)) return;
      if (fase === "conferir" && normalizar(texto) === normalizar(tokenLido)) {
        confirmar();
        return;
      }
      consultar(texto);
    },
    [fase, tokenLido, confirmar, consultar]
  );

  useLeitorDeMao({ ativo: !processando, onCodigo: aoLerCodigo });

  const enviarDigitado = (ev) => {
    ev.preventDefault();
    const texto = codigoDigitado;
    setCodigoDigitado("");
    aoLerCodigo(texto);
  };

  return (
    <div className="flex min-h-screen bg-page text-page overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-4 sm:p-6 space-y-5 max-w-xl mx-auto">
          <Link to="/operacao/label/sinergias" className={`inline-flex items-center gap-1.5 text-sm text-muted hover:text-page ${FOCO}`}>
            <ArrowLeft size={15} aria-hidden="true" /> Sinergias
          </Link>

          <PageHeader titulo={textos.titulo} subtitulo={textos.subtitulo} />

          <AbasSegmentadas
            rotulo="O que confirmar"
            valor={modo}
            onChange={trocarModo}
            opcoes={[
              { valor: "chegada", rotulo: "Chegada" },
              { valor: "retorno", rotulo: "Retorno" },
            ]}
          />

          {fase === "ler" && (
            <>
              <LeitorCamera ativo={fase === "ler"} onLeitura={aoLerCodigo} />
              {processando && (
                <p className="flex items-center justify-center gap-2 text-sm text-muted" role="status">
                  <Loader2 size={15} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> Verificando QR Code…
                </p>
              )}
            </>
          )}

          <form onSubmit={enviarDigitado} className="space-y-1.5">
            <label htmlFor="campo-leitor" className="flex items-center gap-2 text-xs text-muted">
              <ScanBarcode size={14} aria-hidden="true" /> Leitor de mão (bip) ou digitação
            </label>
            <div className="flex gap-2">
              <input
                id="campo-leitor"
                ref={campoRef}
                value={codigoDigitado}
                onChange={(e) => setCodigoDigitado(e.target.value.toUpperCase())}
                placeholder={modo === "chegada" ? "SYG-XXXX-XXXX-XXXX" : "RET-XXXX-XXXX-XXXX"}
                autoComplete="off"
                autoCapitalize="characters"
                spellCheck={false}
                className={`${INPUT} font-mono tracking-wide`}
              />
              <button type="submit" disabled={processando || !codigoDigitado.trim()} className={BTN_SECUNDARIO}>
                <Keyboard size={15} aria-hidden="true" /> Ler
              </button>
            </div>
            <p className="text-xs text-muted">
              Aponte o leitor para a etiqueta e aperte o gatilho; não precisa clicar no campo. Conferiu os dados? Um segundo bip no mesmo código confirma.
            </p>
          </form>

          {fase === "conferir" && preview?.grupo && (
            <section aria-label="Conferir grupo" className="rounded-2xl border border-default bg-surface p-5 space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-muted">Grupo</p>
                <p className="text-lg font-semibold">
                  {preview.prontos} de {preview.total} colaboradores {modo === "chegada" ? "chegando" : "retornando"}
                </p>
                <p className="text-sm text-muted mt-0.5">
                  {preview.origem} → {preview.destino} · {preview.turno}
                  {preview.funcao ? ` · ${preview.funcao}` : ""}
                </p>
              </div>
              <ul className="rounded-xl border border-default divide-y divide-default max-h-72 overflow-y-auto">
                {preview.membros.map((m) => (
                  <li key={m.idSinergia} className="px-3.5 py-2.5 flex items-start gap-3">
                    {m.pronto ? (
                      <CircleCheck size={18} className="text-[#22C55E] shrink-0 mt-0.5" aria-label="Pronto" />
                    ) : (
                      <CircleAlert size={18} className="text-[#F59E0B] shrink-0 mt-0.5" aria-label="Não será confirmado" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{m.colaborador.nomeCompleto}</p>
                      {!m.pronto && <p className="text-xs text-muted">{m.motivo}</p>}
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={confirmar} disabled={processando} autoFocus className={`${BTN_PRIMARIO} h-14 text-base`}>
                  {processando ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />}
                  {processando ? "Confirmando…" : `${textos.botao} (${preview.prontos})`}
                </button>
                <button type="button" onClick={reiniciar} disabled={processando} className={BTN_SECUNDARIO}>
                  Cancelar
                </button>
              </div>
            </section>
          )}

          {fase === "conferir" && preview && !preview.grupo && (
            <section aria-label="Conferir dados" className="rounded-2xl border border-default bg-surface p-5 space-y-5">
              <dl className="space-y-4">
                <Dado rotulo="Colaborador">
                  {preview.colaborador.nomeCompleto}
                  <span className="block text-xs font-normal text-muted tabular-nums">
                    {preview.colaborador.opsId}
                    {preview.colaborador.matricula ? ` · matrícula ${preview.colaborador.matricula}` : ""}
                  </span>
                </Dado>
                <div className="grid grid-cols-2 gap-4">
                  <Dado rotulo={textos.origemRotulo}>{preview.origem}</Dado>
                  <Dado rotulo={textos.destinoRotulo}>{preview.destino}</Dado>
                </div>
                {preview.funcao && <Dado rotulo="Função no destino">{preview.funcao}</Dado>}
                <div className="grid grid-cols-2 gap-4">
                  <Dado rotulo="Turno">{preview.turno}</Dado>
                  <Dado rotulo="Status">
                    <StatusBadge status={preview.status} />
                  </Dado>
                </div>
                <Dado rotulo={modo === "chegada" ? "Envio confirmado" : "Finalizada no destino"}>
                  <span className="text-sm font-normal">
                    {formatarDataHora(modo === "chegada" ? preview.dataEnvio : preview.dataFimDestino)}
                    {modo === "chegada" && preview.enviadoPor ? ` · ${preview.enviadoPor}` : ""}
                  </span>
                </Dado>
              </dl>
              <div className="flex flex-col gap-2">
                <button type="button" onClick={confirmar} disabled={processando} autoFocus className={`${BTN_PRIMARIO} h-14 text-base`}>
                  {processando ? <Loader2 size={18} className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <CircleCheck size={18} aria-hidden="true" />}
                  {processando ? "Confirmando…" : textos.botao}
                </button>
                <button type="button" onClick={reiniciar} disabled={processando} className={BTN_SECUNDARIO}>
                  Não é este colaborador
                </button>
              </div>
            </section>
          )}

          {fase === "feito" && (
            <section role="status" className="rounded-2xl border border-[#22C55E]/40 bg-[#22C55E]/10 p-6 text-center space-y-4">
              <CircleCheck size={40} className="mx-auto text-[#22C55E]" aria-hidden="true" />
              <p className="text-base font-semibold">{mensagem}</p>
              {resultadoGrupo && (
                <ul className="rounded-xl border border-default bg-surface divide-y divide-default text-left max-h-60 overflow-y-auto">
                  {resultadoGrupo.itens.map((i) => (
                    <li key={i.idSinergia} className="px-3.5 py-2 flex items-start gap-2.5">
                      {i.ok ? (
                        <CircleCheck size={16} className="text-[#22C55E] shrink-0 mt-0.5" aria-label="Confirmado" />
                      ) : (
                        <CircleAlert size={16} className="text-[#F59E0B] shrink-0 mt-0.5" aria-label="Não confirmado" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm truncate">{i.nome}</p>
                        {!i.ok && <p className="text-xs text-muted">{i.mensagem}</p>}
                        {i.ok && i.alocadoEm && <p className="text-xs text-muted">Alocado em {i.alocadoEm}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <button type="button" onClick={reiniciar} className={`${BTN_PRIMARIO} w-full h-14 text-base`}>
                <ScanLine size={18} aria-hidden="true" /> Ler próximo
              </button>
              <p className="text-xs text-muted">Ou já aponte o leitor para a próxima etiqueta.</p>
            </section>
          )}

          {fase === "erro" && (
            <section role="alert" className="rounded-2xl border border-[#FF453A]/40 bg-[#FF453A]/10 p-6 text-center space-y-4">
              <CircleAlert size={40} className="mx-auto text-[#FF453A]" aria-hidden="true" />
              <p className="text-base font-semibold">{mensagem}</p>
              <button type="button" onClick={reiniciar} className={`${BTN_SECUNDARIO} w-full h-14 text-base`}>
                <ScanLine size={18} aria-hidden="true" /> Ler outro QR Code
              </button>
            </section>
          )}

          {confirmadas > 0 && (
            <p className="text-center text-xs text-muted tabular-nums">
              {confirmadas} {modo === "chegada" ? (confirmadas === 1 ? "chegada confirmada" : "chegadas confirmadas") : confirmadas === 1 ? "retorno confirmado" : "retornos confirmados"} nesta sessão
              {" · "}
              <Link to="/operacao/label/sinergias" className="underline">
                voltar à lista
              </Link>
            </p>
          )}
        </main>
      </MainLayout>
    </div>
  );
}
