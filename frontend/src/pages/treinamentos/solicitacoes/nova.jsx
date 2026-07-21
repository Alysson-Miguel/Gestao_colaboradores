import { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Save, Search, Users, Calendar, BookOpen, Clock,
  CheckCircle2, Circle, AlertTriangle, Building2,
} from "lucide-react";
import Sidebar from "../../../components/Sidebar";
import Header from "../../../components/Header";
import MainLayout from "../../../components/MainLayout";
import { SolicitacoesTreinamentoAPI } from "../../../services/solicitacoesTreinamento";
import api from "../../../services/api";
import { AuthContext } from "../../../context/AuthContext";

export default function NovaSolicitacaoTreinamento() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { logout, user } = useContext(AuthContext);

  const [setores, setSetores] = useState([]);
  const [turnos, setTurnos] = useState([]);
  const [colaboradores, setColaboradores] = useState([]);
  const [search, setSearch] = useState("");
  const [turnoFiltroLista, setTurnoFiltroLista] = useState(null);

  const [form, setForm] = useState({
    dataTreinamento: "",
    horarioInicio: "",
    horarioFim: "",
    tempoPrevistoMinutos: "",
    idSetor: "",
    idTurno: "",
    hcPrevisto: "",
    motivo: "",
    tema: "",
    processo: "",
    observacoes: "",
    participantes: [],
  });

  const [avisos, setAvisos] = useState([]);
  const [validando, setValidando] = useState(false);
  const debounceRef = useRef(null);

  useEffect(() => {
    async function loadBase() {
      try {
        const [setoresRes, turnosRes, colaboradoresRes] = await Promise.all([
          api.get("/setores"),
          api.get("/turnos"),
          api.get("/colaboradores", { params: { status: "ATIVO", limit: 9999 }, _skipEstacao: true }),
        ]);
        setSetores(setoresRes.data.data || setoresRes.data || []);
        setTurnos(turnosRes.data.data || turnosRes.data || []);
        setColaboradores(colaboradoresRes.data.data || colaboradoresRes.data || []);
      } catch (e) {
        if (e.response?.status === 401) { logout(); navigate("/login"); }
      }
    }
    loadBase();
  }, [logout, navigate]);

  /* ── VALIDAÇÃO DE CONFLITOS (debounced, não bloqueante) ── */
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (!form.dataTreinamento || !form.horarioInicio || !form.horarioFim || !form.idSetor) {
      setAvisos([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setValidando(true);
      try {
        const res = await SolicitacoesTreinamentoAPI.validarConflitos({
          dataTreinamento: form.dataTreinamento,
          horarioInicio: form.horarioInicio,
          horarioFim: form.horarioFim,
          idSetor: form.idSetor,
          participantes: form.participantes,
        });
        setAvisos(res.avisos || []);
      } catch {
        // não bloqueante — ignora falha de validação
      } finally {
        setValidando(false);
      }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [form.dataTreinamento, form.horarioInicio, form.horarioFim, form.idSetor, form.participantes]);

  const toggleParticipante = (colab) => {
    setForm((f) => {
      const exists = f.participantes.some((p) => p.opsId === colab.opsId);
      if (exists) return { ...f, participantes: f.participantes.filter((p) => p.opsId !== colab.opsId) };
      return { ...f, participantes: [...f.participantes, { opsId: colab.opsId, cpf: colab.cpf || null }] };
    });
  };

  const colaboradoresFiltrados = colaboradores.filter((c) => {
    const termo = (search || "").toLowerCase();
    const matchBusca =
      c.nomeCompleto?.toLowerCase().includes(termo) ||
      c.cpf?.includes(termo) ||
      c.opsId?.toLowerCase().includes(termo);
    const matchTurno = !turnoFiltroLista || Number(c.idTurno) === Number(turnoFiltroLista);
    return matchBusca && matchTurno;
  });

  const selecionarTodos = () => {
    setForm((f) => {
      const novos = colaboradoresFiltrados
        .filter((c) => !f.participantes.some((p) => p.opsId === c.opsId))
        .map((c) => ({ opsId: c.opsId, cpf: c.cpf || null }));
      return { ...f, participantes: [...f.participantes, ...novos] };
    });
  };

  const removerTodos = () => {
    const idsFiltrados = colaboradoresFiltrados.map((c) => c.opsId);
    setForm((f) => ({ ...f, participantes: f.participantes.filter((p) => !idsFiltrados.includes(p.opsId)) }));
  };

  const isFormValid =
    form.dataTreinamento && form.horarioInicio && form.horarioFim && form.idSetor &&
    form.motivo.trim() && form.tema.trim() && form.processo.trim();

  const submit = async () => {
    if (!isFormValid) {
      alert("Preencha todos os campos obrigatórios de Informações Gerais");
      return;
    }
    setLoading(true);
    try {
      const solicitacao = await SolicitacoesTreinamentoAPI.criar(form);
      navigate(`/treinamentos/solicitacoes/${solicitacao.idSolicitacao}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Erro ao criar solicitação";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-page text-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="min-h-screen pb-24 lg:pb-8">
          {/* MOBILE HEADER */}
          <div className="sticky top-0 z-10 bg-page border-b border-default px-4 py-3 lg:hidden">
            <div className="flex items-center gap-3">
              <button onClick={() => navigate("/treinamentos/solicitacoes")} className="p-2 -ml-2 text-muted hover:text-page active:scale-95 transition-all">
                <ArrowLeft size={20} />
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base font-semibold truncate">Nova Solicitação</h1>
                <p className="text-xs text-muted">Solicitação de treinamento</p>
              </div>
            </div>
          </div>

          {/* DESKTOP HEADER */}
          <div className="hidden lg:block px-6 xl:px-8 pt-6 pb-4">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate("/treinamentos/solicitacoes")} className="p-2.5 rounded-xl bg-surface-2 text-muted hover:text-page transition-all">
                <ArrowLeft size={20} />
              </button>
              <div>
                <h1 className="text-2xl font-semibold">Nova Solicitação de Treinamento</h1>
                <p className="text-sm text-muted mt-0.5">Enviada para aprovação dos responsáveis cadastrados</p>
              </div>
            </div>
          </div>

          <div className="px-4 lg:px-6 xl:px-8 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 items-start">
          <div className="lg:col-span-3 space-y-4 lg:space-y-5">
            {/* CARD 1: INFORMAÇÕES GERAIS */}
            <div className="bg-surface rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-default shadow-sm">
              <div className="flex items-center gap-2.5 mb-4 lg:mb-5">
                <div className="p-2 rounded-lg bg-[#FA4C00]/10">
                  <BookOpen size={18} className="text-[#FA4C00]" />
                </div>
                <h2 className="text-sm lg:text-base font-semibold">Informações Gerais</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs lg:text-sm font-medium text-muted">
                    <Calendar size={14} /> Data do Treinamento *
                  </label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all"
                    value={form.dataTreinamento}
                    onChange={(e) => setForm({ ...form, dataTreinamento: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs lg:text-sm font-medium text-muted">
                      <Clock size={14} /> Horário Inicial *
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all"
                      value={form.horarioInicio}
                      onChange={(e) => setForm({ ...form, horarioInicio: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-xs lg:text-sm font-medium text-muted">
                      <Clock size={14} /> Horário Final *
                    </label>
                    <input
                      type="time"
                      className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all"
                      value={form.horarioFim}
                      onChange={(e) => setForm({ ...form, horarioFim: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-muted">Tempo Previsto (minutos)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 60"
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all"
                    value={form.tempoPrevistoMinutos}
                    onChange={(e) => setForm({ ...form, tempoPrevistoMinutos: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-muted">Solicitante</label>
                  <input
                    type="text"
                    disabled
                    value={user?.name || ""}
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-muted text-sm cursor-not-allowed"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs lg:text-sm font-medium text-muted">
                    <Building2 size={14} /> Setor *
                  </label>
                  <select
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all appearance-none"
                    value={form.idSetor}
                    onChange={(e) => setForm({ ...form, idSetor: e.target.value })}
                  >
                    <option value="">Selecione o setor</option>
                    {setores.map((s) => <option key={s.idSetor} value={s.idSetor}>{s.nomeSetor}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-muted">Turno</label>
                  <select
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all appearance-none"
                    value={form.idTurno}
                    onChange={(e) => setForm({ ...form, idTurno: e.target.value })}
                  >
                    <option value="">Selecione o turno</option>
                    {turnos.map((t) => <option key={t.idTurno} value={t.idTurno}>{t.nomeTurno}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-muted">HC Previsto</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Ex: 20"
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all"
                    value={form.hcPrevisto}
                    onChange={(e) => setForm({ ...form, hcPrevisto: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs lg:text-sm font-medium text-muted">Tema do Treinamento *</label>
                  <input
                    type="text"
                    placeholder="Ex: Segurança no Trabalho"
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all placeholder:text-subtle"
                    value={form.tema}
                    onChange={(e) => setForm({ ...form, tema: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs lg:text-sm font-medium text-muted">Processo do Treinamento *</label>
                  <input
                    type="text"
                    placeholder="Ex: Carga e Descarga, Separação..."
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all placeholder:text-subtle"
                    value={form.processo}
                    onChange={(e) => setForm({ ...form, processo: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs lg:text-sm font-medium text-muted">Motivo *</label>
                  <textarea
                    rows={3}
                    placeholder="Justificativa da solicitação..."
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all placeholder:text-subtle resize-none"
                    value={form.motivo}
                    onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs lg:text-sm font-medium text-muted">Observações</label>
                  <textarea
                    rows={3}
                    placeholder="Observações adicionais (opcional)"
                    className="w-full px-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all placeholder:text-subtle resize-none"
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                  />
                </div>
              </div>

              {/* AVISOS DE CONFLITO — não bloqueantes */}
              {(validando || avisos.length > 0) && (
                <div className="mt-4 rounded-xl border border-[#FF9F0A]/30 bg-[#FF9F0A]/5 p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={15} className="text-[#FF9F0A]" />
                    <p className="text-sm font-medium text-[#FF9F0A]">
                      {validando ? "Verificando conflitos..." : "Possíveis conflitos identificados"}
                    </p>
                  </div>
                  {!validando && (
                    <ul className="text-xs text-muted list-disc list-inside space-y-0.5 mt-1">
                      {avisos.map((a, i) => <li key={i}>{a}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* COLUNA DIREITA: PARTICIPANTES (sticky) */}
          <div className="lg:col-span-2 lg:sticky lg:top-6">
            <div className="bg-surface rounded-2xl lg:rounded-3xl p-4 lg:p-6 border border-default shadow-sm">
              <div className="flex items-center justify-between mb-4 lg:mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FA4C00]/10">
                    <Users size={18} className="text-[#FA4C00]" />
                  </div>
                  <div>
                    <h2 className="text-sm lg:text-base font-semibold">Participantes</h2>
                    <p className="text-xs text-muted mt-0.5">{form.participantes.length} colaboradores</p>
                  </div>
                </div>
              </div>

              <div className="relative mb-3">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-subtle" />
                <input
                  type="text"
                  placeholder="Buscar por nome, CPF ou OpsId..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-surface-2 border border-default rounded-xl text-page text-sm focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 transition-all placeholder:text-subtle"
                />
              </div>

              <div className="flex gap-2 mb-3">
                {turnos.map((t) => {
                  const selected = turnoFiltroLista === t.idTurno;
                  return (
                    <button
                      key={t.idTurno}
                      onClick={() => setTurnoFiltroLista(selected ? null : t.idTurno)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${selected ? "bg-[#FA4C00] text-white" : "bg-surface-2 text-muted border border-default hover:text-page"}`}
                    >
                      {t.nomeTurno}
                    </button>
                  );
                })}
              </div>

              {colaboradoresFiltrados.length > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted">{colaboradoresFiltrados.length} colaboradores encontrados</span>
                  <div className="flex gap-2">
                    <button onClick={selecionarTodos} className="px-3 py-1.5 text-xs bg-[#FA4C00]/10 border border-[#FA4C00]/20 text-[#FA4C00] rounded-lg hover:bg-[#FA4C00]/20 transition">
                      Selecionar todos
                    </button>
                    <button onClick={removerTodos} className="px-3 py-1.5 text-xs bg-surface-2 border border-default text-muted rounded-lg hover:text-page transition">
                      Remover todos
                    </button>
                  </div>
                </div>
              )}

              <div className="border border-default rounded-xl overflow-hidden bg-surface-2">
                <div className="max-h-72 overflow-y-auto">
                  {colaboradoresFiltrados.length === 0 ? (
                    <div className="px-4 py-12 text-center">
                      <p className="text-sm text-muted">Nenhum colaborador encontrado</p>
                    </div>
                  ) : (
                    colaboradoresFiltrados.map((c, index) => {
                      const selected = form.participantes.some((p) => p.opsId === c.opsId);
                      return (
                        <div
                          key={c.opsId}
                          onClick={() => toggleParticipante(c)}
                          className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-all ${selected ? "bg-[#FA4C00]/10 border-l-2 border-[#FA4C00]" : "hover:bg-surface-3"} ${index !== 0 ? "border-t border-default" : ""}`}
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${selected ? "bg-[#FA4C00]" : "bg-surface-3"}`}>
                              {selected ? <CheckCircle2 size={16} className="text-white" /> : <Circle size={16} className="text-subtle" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium truncate transition-colors ${selected ? "text-page" : "text-muted"}`}>{c.nomeCompleto}</p>
                              <p className="text-xs text-subtle truncate">{c.cpf || c.opsId || "-"}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* AÇÃO (desktop) — fica junto do card de participantes, sempre visível */}
              <div className="hidden lg:block mt-5">
                <button
                  onClick={submit}
                  disabled={loading || !isFormValid}
                  className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl font-semibold text-sm transition-all ${loading || !isFormValid ? "bg-surface-2 text-muted cursor-not-allowed border border-default" : "bg-[#FA4C00] text-white shadow-xl shadow-[#FA4C00]/30 hover:bg-[#D84300] active:scale-[0.98]"}`}
                >
                  {loading ? (<><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Enviando Solicitação...</>) : (<><Save size={18} />Enviar Solicitação</>)}
                </button>
              </div>
            </div>
          </div>
          </div>
          </div>

          {/* MOBILE BOTTOM BAR */}
          <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-page border-t border-default p-4 z-20">
            <button
              onClick={submit}
              disabled={loading || !isFormValid}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm transition-all ${loading || !isFormValid ? "bg-surface-2 text-muted cursor-not-allowed border border-default" : "bg-[#FA4C00] text-white shadow-lg shadow-[#FA4C00]/30 active:scale-[0.98]"}`}
            >
              {loading ? (<><div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Enviando...</>) : (<><Save size={18} />Enviar Solicitação</>)}
            </button>
          </div>
        </main>
      </MainLayout>
    </div>
  );
}
