import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MainLayout from "../../../components/MainLayout";
import {
  ArrowLeft, CheckCircle, XCircle, X, ExternalLink, History,
} from "lucide-react";

import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import { SolicitacoesTreinamentoAPI } from "../../../services/solicitacoesTreinamento";
import { AuthContext } from "../../../context/AuthContext";
import { StatusSolicitacaoBadge } from "./index";

export default function DetalhesSolicitacaoTreinamento() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [solicitacao, setSolicitacao] = useState(null);
  const [processando, setProcessando] = useState(false);

  const [negarModalOpen, setNegarModalOpen] = useState(false);
  const [motivoNegativa, setMotivoNegativa] = useState("");

  async function load() {
    try {
      const data = await SolicitacoesTreinamentoAPI.obter(id);
      setSolicitacao(data);
    } catch (e) {
      if (e.response?.status === 401) { logout(); navigate("/login"); }
      else if (e.response?.status === 404) { navigate("/treinamentos/solicitacoes"); }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  const aprovar = async () => {
    setProcessando(true);
    try {
      await SolicitacoesTreinamentoAPI.aprovar(id);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Erro ao aprovar solicitação");
      await load();
    } finally {
      setProcessando(false);
    }
  };

  const negar = async () => {
    if (!motivoNegativa.trim()) return;
    setProcessando(true);
    try {
      await SolicitacoesTreinamentoAPI.negar(id, motivoNegativa);
      setNegarModalOpen(false);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Erro ao negar solicitação");
      await load();
    } finally {
      setProcessando(false);
    }
  };

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-muted">Carregando…</div>;
  }
  if (!solicitacao) return null;

  const podeDecidir = solicitacao.status === "PENDENTE" && solicitacao.podeDecidir;
  const jaDecidido = solicitacao.status !== "PENDENTE";

  return (
    <>
      <div className="flex min-h-screen bg-page text-page">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

        <MainLayout>
          <Header onMenuClick={() => setSidebarOpen(true)} />

          <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-8 w-full max-w-5xl mx-auto">
            {/* HEADER */}
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/treinamentos/solicitacoes")} className="text-muted hover:text-page">
                <ArrowLeft />
              </button>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold">Solicitação de Treinamento</h1>
                <div className="mt-1"><StatusSolicitacaoBadge status={solicitacao.status} /></div>
              </div>
            </div>

            {/* CARD PRINCIPAL */}
            <div className="bg-surface rounded-2xl p-6 space-y-6 border border-default">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted">Tema</span><p className="font-medium">{solicitacao.tema}</p></div>
                <div><span className="text-muted">Processo</span><p>{solicitacao.processo}</p></div>
                <div><span className="text-muted">Data</span><p>{solicitacao.dataTreinamento?.slice(0, 10).split("-").reverse().join("/")}</p></div>
                <div><span className="text-muted">Horário</span><p>{solicitacao.horarioInicio} - {solicitacao.horarioFim}</p></div>
                <div><span className="text-muted">Tempo Previsto</span><p>{solicitacao.tempoPrevistoMinutos ? `${solicitacao.tempoPrevistoMinutos} min` : "—"}</p></div>
                <div><span className="text-muted">Solicitante</span><p>{solicitacao.solicitante?.name}</p></div>
                <div><span className="text-muted">Setor</span><p>{solicitacao.setor?.nomeSetor}</p></div>
                <div><span className="text-muted">Turno</span><p>{solicitacao.turno?.nomeTurno || "—"}</p></div>
                <div><span className="text-muted">HC Previsto</span><p>{solicitacao.hcPrevisto ?? "—"}</p></div>
                <div className="md:col-span-2"><span className="text-muted">Motivo</span><p>{solicitacao.motivo}</p></div>
                {solicitacao.observacoes && (
                  <div className="md:col-span-2"><span className="text-muted">Observações</span><p>{solicitacao.observacoes}</p></div>
                )}
                {solicitacao.status === "NEGADA" && (
                  <div className="md:col-span-2">
                    <span className="text-[#FF453A]">Motivo da negativa</span>
                    <p>{solicitacao.motivoNegativa}</p>
                  </div>
                )}
              </div>

              {/* PARTICIPANTES */}
              <div>
                <h3 className="text-sm text-muted mb-2">Participantes ({solicitacao.participantes.length})</h3>
                <div className="border border-default rounded-xl overflow-hidden">
                  <div className="px-4 py-2 grid grid-cols-[1fr_auto_auto] gap-4 text-xs font-medium text-muted border-b border-default bg-surface-2">
                    <span>Nome</span>
                    <span className="w-32 text-center">Cargo</span>
                    <span className="w-32 text-right">Matrícula</span>
                  </div>
                  {solicitacao.participantes.map((p) => (
                    <div key={p.idSolicitacaoParticipante} className="px-4 py-2 grid grid-cols-[1fr_auto_auto] gap-4 text-sm border-b border-default last:border-b-0">
                      <span>{p.colaborador?.nomeCompleto || p.opsId}</span>
                      <span className="w-32 text-center text-muted">{p.colaborador?.cargo?.nomeCargo || "-"}</span>
                      <span className="w-32 text-right text-muted">{p.colaborador?.matricula || "-"}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* TREINAMENTO CRIADO */}
              {solicitacao.treinamentoCriado && (
                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center justify-between">
                  <p className="text-sm text-emerald-400 font-medium">Treinamento criado a partir desta solicitação</p>
                  <button
                    onClick={() => navigate(`/treinamentos/${solicitacao.treinamentoCriado.idTreinamento}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-sm font-medium transition-colors"
                  >
                    <ExternalLink size={15} /> Visualizar Treinamento
                  </button>
                </div>
              )}

              {/* AÇÕES DE APROVAÇÃO */}
              {solicitacao.status === "PENDENTE" && (
                <div className="space-y-2">
                  {!podeDecidir && (
                    <p className="text-xs text-muted bg-surface-2 rounded-xl px-4 py-3">
                      Você não está cadastrado como aprovador ativo. Apenas os responsáveis cadastrados podem aprovar ou negar esta solicitação.
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={aprovar}
                      disabled={!podeDecidir || processando}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${!podeDecidir || processando ? "bg-surface-2 text-muted cursor-not-allowed" : "bg-[#34C759] hover:bg-[#2AA34C] text-white"}`}
                    >
                      <CheckCircle size={16} /> Aprovar
                    </button>
                    <button
                      onClick={() => { setMotivoNegativa(""); setNegarModalOpen(true); }}
                      disabled={!podeDecidir || processando}
                      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors ${!podeDecidir || processando ? "bg-surface-2 text-muted cursor-not-allowed" : "bg-[#FF453A] hover:bg-[#D93025] text-white"}`}
                    >
                      <XCircle size={16} /> Negar
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

      {/* MODAL NEGAR */}
      {negarModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-2xl w-full max-w-md border border-default shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-default">
              <div className="flex items-center gap-2">
                <XCircle size={18} className="text-[#FF453A]" />
                <h2 className="font-semibold text-base">Negar Solicitação</h2>
              </div>
              <button onClick={() => setNegarModalOpen(false)} className="text-muted hover:text-page transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <p className="text-sm text-muted">Informe o motivo da negativa. Esta ação não pode ser desfeita.</p>
              <textarea
                value={motivoNegativa}
                onChange={(e) => setMotivoNegativa(e.target.value)}
                placeholder="Descreva o motivo da negativa..."
                rows={4}
                className="w-full px-3 py-2.5 bg-surface-2 border border-default rounded-xl text-sm text-page placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-[#FF453A]/50 resize-none"
              />
            </div>

            <div className="px-5 py-4 border-t border-default flex justify-end gap-3">
              <button onClick={() => setNegarModalOpen(false)} className="px-5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-sm transition-colors">
                Voltar
              </button>
              <button
                onClick={negar}
                disabled={processando || !motivoNegativa.trim()}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors ${processando || !motivoNegativa.trim() ? "bg-[#FF453A]/30 text-white/30 cursor-not-allowed" : "bg-[#FF453A] hover:bg-[#D93025] text-white"}`}
              >
                <XCircle size={15} />
                {processando ? "Enviando..." : "Confirmar negativa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
