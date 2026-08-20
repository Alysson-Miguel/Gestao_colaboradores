import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import {
  ArrowLeft, CheckCircle, XCircle, X, History, ArrowLeftRight, AlertTriangle,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { SolicitacoesOperacionaisAPI } from "../../services/solicitacoesOperacionais";
import { AuthContext } from "../../context/AuthContext";
import { StatusOperacionalBadge, TipoBadge, DESTINO_SINERGIA_LABEL, TIPO_DESLIGAMENTO_LABEL, MOTIVO_DESLIGAMENTO_LABEL, formatDateOnly } from "./shared";

function ColaboradorCard({ titulo, colaborador }) {
  if (!colaborador) return null;
  return (
    <div className="bg-surface-2 rounded-xl p-4 space-y-1.5">
      <p className="text-[10px] font-semibold text-muted uppercase tracking-wide">{titulo}</p>
      <p className="text-sm font-semibold">{colaborador.nomeCompleto}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
        <span>CPF: {colaborador.cpf || "—"}</span>
        <span>Matrícula: {colaborador.matricula || "—"}</span>
        <span>Cargo: {colaborador.cargo?.nomeCargo || "—"}</span>
        <span>Setor: {colaborador.setor?.nomeSetor || "—"}</span>
        <span>Turno: {colaborador.turno?.nomeTurno || "—"}</span>
        <span>Líder: {colaborador.lider?.nomeCompleto || "—"}</span>
      </div>
    </div>
  );
}

export default function DetalhesSolicitacaoOperacional() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [solicitacao, setSolicitacao] = useState(null);
  const [processando, setProcessando] = useState(false);

  const [reprovarModalOpen, setReprovarModalOpen] = useState(false);
  const [motivoReprovacao, setMotivoReprovacao] = useState("");

  async function load() {
    try {
      const data = await SolicitacoesOperacionaisAPI.obter(id);
      setSolicitacao(data);
    } catch (e) {
      if (e.response?.status === 401) { logout(); navigate("/login"); }
      else if (e.response?.status === 404) { navigate("/solicitacoes-operacionais"); }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const aprovar = async () => {
    setProcessando(true);
    try {
      await SolicitacoesOperacionaisAPI.aprovar(id);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Erro ao aprovar solicitação");
      await load();
    } finally {
      setProcessando(false);
    }
  };

  const reprovar = async () => {
    if (!motivoReprovacao.trim()) return;
    setProcessando(true);
    try {
      await SolicitacoesOperacionaisAPI.reprovar(id, motivoReprovacao);
      setReprovarModalOpen(false);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Erro ao reprovar solicitação");
      await load();
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-muted">Carregando…</div>;
  }
  if (!solicitacao) return null;

  const emAndamento = ["PENDENTE", "AGUARDANDO_SEGUNDA_APROVACAO"].includes(solicitacao.status);
  const podeDecidir = emAndamento && solicitacao.podeDecidir;
  const jaDecidido = !emAndamento;
  const naSegundaEtapa = solicitacao.status === "AGUARDANDO_SEGUNDA_APROVACAO";

  return (
    <>
      <div className="flex min-h-screen bg-page text-page">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

        <MainLayout>
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full max-w-5xl mx-auto">
            {/* HEADER */}
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/solicitacoes-operacionais")} className="text-muted hover:text-page">
                <ArrowLeft />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">Solicitação #{solicitacao.idSolicitacao}</h1>
                <div className="mt-1 flex items-center gap-2">
                  <TipoBadge tipo={solicitacao.tipo} />
                  <StatusOperacionalBadge status={solicitacao.status} />
                </div>
              </div>
            </div>

            {/* CARD PRINCIPAL */}
            <div className="bg-surface rounded-2xl p-6 space-y-6 border border-default">
              {solicitacao.tipo === "TROCA_DSR" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ColaboradorCard titulo="Colaborador 1" colaborador={solicitacao.colaborador} />
                    <ColaboradorCard titulo="Colaborador 2" colaborador={solicitacao.colaborador2} />
                  </div>
                  <div className="flex items-center justify-center gap-6 bg-surface-2 rounded-xl p-4 text-sm">
                    <div className="text-center">
                      <p className="text-xs text-muted mb-1">{solicitacao.colaborador?.nomeCompleto}</p>
                      <p>{formatDateOnly(solicitacao.dsrDataAtual1)} <span className="text-muted">→</span> {formatDateOnly(solicitacao.dsrDataNova1)}</p>
                    </div>
                    <ArrowLeftRight size={18} className="text-[#FA4C00]" />
                    <div className="text-center">
                      <p className="text-xs text-muted mb-1">{solicitacao.colaborador2?.nomeCompleto}</p>
                      <p>{formatDateOnly(solicitacao.dsrDataAtual2)} <span className="text-muted">→</span> {formatDateOnly(solicitacao.dsrDataNova2)}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <ColaboradorCard titulo="Colaborador" colaborador={solicitacao.colaborador} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {!["TROCA_DSR", "TROCA_GESTAO", "TROCA_ESCALA", "DESLIGAMENTO", "TROCA_TURNO", "FERIAS", "AFASTAMENTO", "INTERNALIZACAO"].includes(solicitacao.tipo) && (
                  <div><span className="text-muted">Data</span><p className="font-medium">{formatDateOnly(solicitacao.data)}</p></div>
                )}

                {solicitacao.tipo === "BANCO_HORAS" && (
                  <>
                    <div><span className="text-muted">Modalidade</span><p>{solicitacao.bhDiaCompleto ? "Dia completo" : "Horas parciais"}</p></div>
                    {!solicitacao.bhDiaCompleto && (
                      <>
                        <div><span className="text-muted">Quantidade de Horas</span><p>{solicitacao.bhQuantidadeHoras}h</p></div>
                        <div><span className="text-muted">Hora de Entrada</span><p>{solicitacao.bhHoraEntrada}</p></div>
                      </>
                    )}
                  </>
                )}

                {solicitacao.tipo === "SINERGIA" && (
                  <div><span className="text-muted">Destino</span><p>{DESTINO_SINERGIA_LABEL[solicitacao.sinergiaDestino] || solicitacao.sinergiaDestino}</p></div>
                )}

                {solicitacao.tipo === "HORA_EXTRA" && (
                  <>
                    <div><span className="text-muted">Hora de Entrada</span><p>{solicitacao.heHoraEntrada}</p></div>
                    <div><span className="text-muted">Hora de Saída</span><p>{solicitacao.heHoraSaida}</p></div>
                  </>
                )}

                {solicitacao.tipo === "TROCA_GESTAO" && (
                  <div className="md:col-span-2">
                    <span className="text-muted">Novo Líder</span>
                    <p className="font-medium">
                      {solicitacao.novoLider?.nomeCompleto || "—"}
                      {solicitacao.novoLider?.cargo?.nomeCargo ? ` — ${solicitacao.novoLider.cargo.nomeCargo}` : ""}
                    </p>
                  </div>
                )}

                {solicitacao.tipo === "TROCA_ESCALA" && (
                  <div className="md:col-span-2">
                    <span className="text-muted">Nova Escala</span>
                    <p className="font-medium">
                      {solicitacao.novaEscala?.nomeEscala || "—"}
                      {solicitacao.novaEscala?.descricao ? ` — ${solicitacao.novaEscala.descricao}` : ""}
                    </p>
                  </div>
                )}

                {solicitacao.tipo === "DESLIGAMENTO" && (
                  <>
                    <div><span className="text-muted">Data de Desligamento</span><p className="font-medium">{formatDateOnly(solicitacao.dataDesligamentoSolicitada)}</p></div>
                    <div><span className="text-muted">Tipo de Desligamento</span><p>{TIPO_DESLIGAMENTO_LABEL[solicitacao.tipoDesligamentoSolicitado] || solicitacao.tipoDesligamentoSolicitado}</p></div>
                    <div className="md:col-span-2"><span className="text-muted">Motivo do Desligamento</span><p>{MOTIVO_DESLIGAMENTO_LABEL[solicitacao.motivoDesligamentoSolicitado] || solicitacao.motivoDesligamentoSolicitado}</p></div>
                  </>
                )}

                {solicitacao.tipo === "TROCA_TURNO" && (
                  <div className="md:col-span-2">
                    <span className="text-muted">Novo Turno</span>
                    <p className="font-medium">{solicitacao.novoTurno?.nomeTurno || "—"}</p>
                  </div>
                )}

                {(solicitacao.tipo === "FERIAS" || solicitacao.tipo === "AFASTAMENTO") && (
                  <>
                    <div><span className="text-muted">Data de Início</span><p className="font-medium">{formatDateOnly(solicitacao.tipo === "FERIAS" ? solicitacao.feriasDataInicio : solicitacao.afastamentoDataInicio)}</p></div>
                    <div><span className="text-muted">Data de Fim</span><p className="font-medium">{formatDateOnly(solicitacao.tipo === "FERIAS" ? solicitacao.feriasDataFim : solicitacao.afastamentoDataFim)}</p></div>
                  </>
                )}

                {solicitacao.tipo === "INTERNALIZACAO" && (
                  <>
                    <div><span className="text-muted">Nova Empresa</span><p className="font-medium">{solicitacao.internalizacaoNovaEmpresa?.razaoSocial || "—"}</p></div>
                    <div><span className="text-muted">Nova Matrícula</span><p className="font-medium">{solicitacao.internalizacaoNovaMatricula || "—"}</p></div>
                    {solicitacao.internalizacaoForcada && (
                      <div className="md:col-span-2 flex gap-2.5 rounded-xl border border-[#FF9F0A]/30 bg-[#FF9F0A]/5 p-3">
                        <AlertTriangle size={15} className="text-[#FF9F0A] shrink-0 mt-0.5" />
                        <p className="text-xs text-[#FF9F0A]">
                          O colaborador não atendia aos critérios de elegibilidade no momento da solicitação — o solicitante confirmou explicitamente mesmo assim.
                        </p>
                      </div>
                    )}
                  </>
                )}

                <div><span className="text-muted">Solicitante</span><p>{solicitacao.solicitante?.name}</p></div>
                <div><span className="text-muted">Data da Solicitação</span><p>{formatDateOnly(solicitacao.dataCriacao)}</p></div>
                {solicitacao.primeiraAprovacaoPor && (
                  <>
                    <div><span className="text-muted">Primeira Aprovação</span><p>{solicitacao.primeiraAprovacaoPor?.name}</p></div>
                    <div><span className="text-muted">Data da Primeira Aprovação</span><p>{formatDateOnly(solicitacao.primeiraAprovacaoEm)}</p></div>
                  </>
                )}
                {solicitacao.decididoPor && (
                  <>
                    <div><span className="text-muted">Responsável pela Decisão</span><p>{solicitacao.decididoPor?.name}</p></div>
                    <div><span className="text-muted">Data da Decisão</span><p>{formatDateOnly(solicitacao.decididoEm)}</p></div>
                  </>
                )}
                <div className="md:col-span-2"><span className="text-muted">Motivo</span><p>{solicitacao.motivo}</p></div>
                {solicitacao.status === "REPROVADA" && (
                  <div className="md:col-span-2">
                    <span className="text-[#FF453A]">Motivo da reprovação</span>
                    <p>{solicitacao.motivoReprovacao}</p>
                  </div>
                )}
              </div>

              {solicitacao.status === "APROVADA" && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                  <p className="text-sm text-emerald-400 font-medium">
                    {["TROCA_GESTAO", "TROCA_ESCALA", "DESLIGAMENTO", "TROCA_TURNO", "FERIAS", "AFASTAMENTO", "INTERNALIZACAO"].includes(solicitacao.tipo)
                      ? "Sua solicitação foi aprovada e o cadastro do colaborador já foi atualizado automaticamente."
                      : "Sua solicitação foi aprovada e o Controle de Presença já foi atualizado automaticamente."}
                  </p>
                </div>
              )}

              {naSegundaEtapa && (
                <div className="rounded-xl border border-[#0A84FF]/20 bg-[#0A84FF]/5 p-4">
                  <p className="text-sm text-[#0A84FF] font-medium">
                    Primeira aprovação feita{solicitacao.primeiraAprovacaoPor?.name ? ` por ${solicitacao.primeiraAprovacaoPor.name}` : ""} —
                    {" "}aguardando confirmação do {solicitacao.segundaAprovacaoLabel}.
                  </p>
                </div>
              )}

              {/* AÇÕES DE APROVAÇÃO */}
              {emAndamento && (
                <div className="space-y-2">
                  {!podeDecidir && (
                    <p className="text-xs text-muted bg-surface-2 rounded-xl px-4 py-3">
                      {naSegundaEtapa
                        ? `Você não está cadastrado como aprovador ativo (${solicitacao.segundaAprovacaoLabel}) desta etapa. Apenas os responsáveis cadastrados podem confirmar ou reprovar esta solicitação.`
                        : "Você não está cadastrado como aprovador ativo. Apenas os responsáveis cadastrados podem aprovar ou reprovar esta solicitação."}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={aprovar}
                      disabled={!podeDecidir || processando}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${!podeDecidir || processando ? "bg-surface-2 text-muted cursor-not-allowed" : "bg-[#34C759] hover:bg-[#2AA34C] text-white"}`}
                    >
                      <CheckCircle size={16} /> {naSegundaEtapa ? `Confirmar (${solicitacao.segundaAprovacaoLabel})` : "Aprovar"}
                    </button>
                    <button
                      onClick={() => { setMotivoReprovacao(""); setReprovarModalOpen(true); }}
                      disabled={!podeDecidir || processando}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${!podeDecidir || processando ? "bg-surface-2 text-muted cursor-not-allowed" : "bg-[#FF453A] hover:bg-[#D93025] text-white"}`}
                    >
                      <XCircle size={16} /> Reprovar
                    </button>
                  </div>
                </div>
              )}

              {jaDecidido && (
                <p className="text-xs text-muted bg-surface-2 rounded-xl px-4 py-3">
                  Esta solicitação já foi analisada por outro responsável.
                </p>
              )}
            </div>

            {/* HISTÓRICO */}
            <div className="bg-surface rounded-2xl p-6 border border-default">
              <div className="flex items-center gap-2 mb-4">
                <History size={16} className="text-muted" />
                <h3 className="text-sm font-semibold">Histórico</h3>
              </div>
              <div className="space-y-4">
                {solicitacao.historico.map((h, i) => (
                  <div key={h.idHistorico} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-[#FA4C00] mt-1.5" />
                      {i !== solicitacao.historico.length - 1 && <div className="w-px flex-1 bg-default mt-1" />}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm">{h.evento}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(h.criadoEm).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </main>
        </MainLayout>
      </div>

      {/* MODAL REPROVAR */}
      {reprovarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-default shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-default">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-[#FF453A]" />
                <h2 className="font-semibold text-base">Reprovar Solicitação</h2>
              </div>
              <button onClick={() => setReprovarModalOpen(false)} className="text-muted hover:text-page transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-muted">Informe o motivo da reprovação. Esta ação não pode ser desfeita.</p>
              <textarea
                value={motivoReprovacao}
                onChange={(e) => setMotivoReprovacao(e.target.value)}
                placeholder="Descreva o motivo da reprovação..."
                rows={4}
                className="w-full px-3 py-2.5 bg-surface-2 border border-default rounded-xl text-sm text-page placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-[#FF453A]/50 resize-none"
              />
            </div>

            <div className="px-5 py-4 border-t border-default flex justify-end gap-3">
              <button onClick={() => setReprovarModalOpen(false)} className="px-5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-sm transition-colors">
                Voltar
              </button>
              <button
                onClick={reprovar}
                disabled={processando || !motivoReprovacao.trim()}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors ${processando || !motivoReprovacao.trim() ? "bg-[#FF453A]/30 text-white/30 cursor-not-allowed" : "bg-[#FF453A] hover:bg-[#D93025] text-white"}`}
              >
                <XCircle size={15} />
                {processando ? "Enviando..." : "Confirmar reprovação"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
