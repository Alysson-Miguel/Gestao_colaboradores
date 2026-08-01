import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "../../components/MainLayout";
import {
  ArrowLeft, CalendarOff, Clock3, Share2, ArrowLeftRight, Send, AlertTriangle,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import { AuthContext } from "../../context/AuthContext";
import { SolicitacoesOperacionaisAPI } from "../../services/solicitacoesOperacionais";
import { BuscaColaboradorPorCpf } from "../../components/solicitacoesOperacionais/BuscaColaboradorPorCpf";

const TIPOS = [
  { key: "FOLGA", label: "Folga", desc: "Solicitar folga para um colaborador em uma data específica", icon: CalendarOff },
  { key: "BANCO_HORAS", label: "Banco de Horas", desc: "Dia completo ou horas parciais, com hora de entrada", icon: Clock3 },
  { key: "SINERGIA", label: "Sinergia", desc: "Envio para FULL, tratativas ou outra operação", icon: Share2 },
  { key: "TROCA_DSR", label: "Troca de DSR", desc: "Inversão do DSR entre dois colaboradores", icon: ArrowLeftRight },
];

function fieldCls() {
  return "w-full px-3 py-2.5 bg-surface-2 border border-default rounded-xl text-sm text-page focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/40 transition-all";
}

function Field({ label, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs text-muted">{label}</label>
      {children}
    </div>
  );
}

export default function NovaSolicitacaoOperacional() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tipo, setTipo] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState(null);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  /* colaborador principal */
  const [colaborador, setColaborador] = useState(null);
  const [data, setData] = useState("");
  const [motivo, setMotivo] = useState("");

  /* banco de horas */
  const [bhDiaCompleto, setBhDiaCompleto] = useState(true);
  const [bhQuantidadeHoras, setBhQuantidadeHoras] = useState("");
  const [bhHoraEntrada, setBhHoraEntrada] = useState("");

  /* sinergia */
  const [sinergiaDestino, setSinergiaDestino] = useState("");

  /* troca de dsr */
  const [colaborador2, setColaborador2] = useState(null);
  const [dsrDataAtual1, setDsrDataAtual1] = useState("");
  const [dsrDataNova1, setDsrDataNova1] = useState("");
  const [dsrDataAtual2, setDsrDataAtual2] = useState("");
  const [dsrDataNova2, setDsrDataNova2] = useState("");

  const resetForm = () => {
    setColaborador(null); setData(""); setMotivo("");
    setBhDiaCompleto(true); setBhQuantidadeHoras(""); setBhHoraEntrada("");
    setSinergiaDestino("");
    setColaborador2(null); setDsrDataAtual1(""); setDsrDataNova1(""); setDsrDataAtual2(""); setDsrDataNova2("");
    setErro(null);
  };

  const escolherTipo = (t) => {
    resetForm();
    setTipo(t);
  };

  const inversaoValida = dsrDataAtual1 && dsrDataNova1 && dsrDataAtual2 && dsrDataNova2
    ? dsrDataAtual1 === dsrDataNova2 && dsrDataAtual2 === dsrDataNova1
    : true;

  const podeEnviar = (() => {
    if (!motivo.trim()) return false;
    if (tipo === "TROCA_DSR") {
      if (!colaborador || !colaborador2) return false;
      if (colaborador.opsId === colaborador2.opsId) return false;
      if (!dsrDataAtual1 || !dsrDataNova1 || !dsrDataAtual2 || !dsrDataNova2) return false;
      return inversaoValida;
    }
    if (!colaborador || !data) return false;
    if (tipo === "BANCO_HORAS" && !bhDiaCompleto && (!bhQuantidadeHoras || !bhHoraEntrada)) return false;
    if (tipo === "SINERGIA" && !sinergiaDestino) return false;
    return true;
  })();

  const enviar = async () => {
    if (!podeEnviar) return;
    setEnviando(true);
    setErro(null);
    try {
      const payload = { tipo, motivo: motivo.trim() };

      if (tipo === "TROCA_DSR") {
        payload.opsId = colaborador.opsId;
        payload.opsId2 = colaborador2.opsId;
        payload.dsrDataAtual1 = dsrDataAtual1;
        payload.dsrDataNova1 = dsrDataNova1;
        payload.dsrDataAtual2 = dsrDataAtual2;
        payload.dsrDataNova2 = dsrDataNova2;
      } else {
        payload.opsId = colaborador.opsId;
        payload.data = data;
        if (tipo === "BANCO_HORAS") {
          payload.bhDiaCompleto = bhDiaCompleto;
          if (!bhDiaCompleto) {
            payload.bhQuantidadeHoras = Number(bhQuantidadeHoras);
            payload.bhHoraEntrada = bhHoraEntrada;
          }
        }
        if (tipo === "SINERGIA") {
          payload.sinergiaDestino = sinergiaDestino;
        }
      }

      const criada = await SolicitacoesOperacionaisAPI.criar(payload);
      navigate(`/solicitacoes-operacionais/${criada.idSolicitacao}`);
    } catch (e) {
      if (e.response?.status === 401) { logout(); navigate("/login"); return; }
      setErro(e.response?.data?.message || "Erro ao criar solicitação");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-page text-page">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} navigate={navigate} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-4 sm:px-6 lg:px-8 py-8 space-y-6 w-full max-w-3xl mx-auto">
          <div className="flex items-center gap-4">
            <button
              onClick={() => (tipo ? escolherTipo(null) : navigate("/solicitacoes-operacionais"))}
              className="p-2.5 rounded-xl bg-surface-2 text-muted hover:text-page transition-all cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-semibold">Nova Solicitação</h1>
              <p className="text-sm text-muted mt-0.5">
                {tipo ? `Tipo selecionado: ${TIPOS.find((t) => t.key === tipo)?.label}` : "Escolha o tipo de solicitação operacional"}
              </p>
            </div>
          </div>

          {!tipo && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TIPOS.map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.key}
                    onClick={() => escolherTipo(t.key)}
                    className="text-left bg-surface rounded-2xl border border-default p-5 hover:border-[#FA4C00]/50 hover:bg-surface-2/50 transition-all cursor-pointer"
                  >
                    <div className="p-2.5 bg-[#FA4C00]/10 rounded-xl w-fit mb-3">
                      <Icon size={22} className="text-[#FA4C00]" />
                    </div>
                    <p className="font-semibold text-sm">{t.label}</p>
                    <p className="text-xs text-muted mt-1">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          )}

          {tipo && (
            <div className="bg-surface rounded-2xl border border-default p-6 space-y-5">
              {tipo === "TROCA_DSR" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide">Colaborador 1</p>
                      <BuscaColaboradorPorCpf onFound={setColaborador} onClear={() => setColaborador(null)} />
                      <Field label="Data atual do DSR">
                        <input type="date" value={dsrDataAtual1} onChange={(e) => setDsrDataAtual1(e.target.value)} className={fieldCls()} />
                      </Field>
                      <Field label="Nova data do DSR">
                        <input type="date" value={dsrDataNova1} onChange={(e) => setDsrDataNova1(e.target.value)} className={fieldCls()} />
                      </Field>
                    </div>
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-muted uppercase tracking-wide">Colaborador 2</p>
                      <BuscaColaboradorPorCpf onFound={setColaborador2} onClear={() => setColaborador2(null)} />
                      <Field label="Data atual do DSR">
                        <input type="date" value={dsrDataAtual2} onChange={(e) => setDsrDataAtual2(e.target.value)} className={fieldCls()} />
                      </Field>
                      <Field label="Nova data do DSR">
                        <input type="date" value={dsrDataNova2} onChange={(e) => setDsrDataNova2(e.target.value)} className={fieldCls()} />
                      </Field>
                    </div>
                  </div>

                  <p className="text-xs text-muted bg-surface-2 rounded-xl px-3 py-2.5">
                    A troca precisa ser uma inversão exata: a nova data do DSR do Colaborador 1 deve ser igual à data atual do DSR do Colaborador 2, e vice-versa.
                  </p>

                  {!inversaoValida && (
                    <div className="flex gap-2.5 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/5 p-3">
                      <AlertTriangle size={15} className="text-[#FF453A] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#FF453A]">
                        As datas informadas não formam uma inversão válida. A nova data do DSR de um colaborador deve ser a data atual do DSR do outro.
                      </p>
                    </div>
                  )}

                  {colaborador && colaborador2 && colaborador.opsId === colaborador2.opsId && (
                    <div className="flex gap-2.5 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/5 p-3">
                      <AlertTriangle size={15} className="text-[#FF453A] shrink-0 mt-0.5" />
                      <p className="text-xs text-[#FF453A]">Os dois colaboradores devem ser diferentes.</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <BuscaColaboradorPorCpf onFound={setColaborador} onClear={() => setColaborador(null)} />

                  <Field label="Data">
                    <input type="date" value={data} onChange={(e) => setData(e.target.value)} className={fieldCls()} />
                  </Field>

                  {tipo === "BANCO_HORAS" && (
                    <>
                      <label className="flex items-center gap-2 text-sm cursor-pointer">
                        <input type="checkbox" checked={bhDiaCompleto} onChange={(e) => setBhDiaCompleto(e.target.checked)} className="accent-[#FA4C00]" />
                        Dia completo
                      </label>
                      {!bhDiaCompleto && (
                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Quantidade de horas">
                            <input type="number" step="0.5" min="0" max="24" value={bhQuantidadeHoras} onChange={(e) => setBhQuantidadeHoras(e.target.value)} className={fieldCls()} />
                          </Field>
                          <Field label="Hora de entrada">
                            <input type="time" value={bhHoraEntrada} onChange={(e) => setBhHoraEntrada(e.target.value)} className={fieldCls()} />
                          </Field>
                        </div>
                      )}
                      {!bhDiaCompleto && (
                        <p className="text-xs text-muted bg-surface-2 rounded-xl px-3 py-2.5">
                          Com horas parciais, o colaborador continuará marcado como "Presente" no Controle de Presença, com a hora de entrada informada.
                        </p>
                      )}
                    </>
                  )}

                  {tipo === "SINERGIA" && (
                    <Field label="Destino">
                      <select value={sinergiaDestino} onChange={(e) => setSinergiaDestino(e.target.value)} className={`${fieldCls()} appearance-none cursor-pointer`}>
                        <option value="" disabled>Selecione o destino</option>
                        <option value="FULL">FULL</option>
                        <option value="TRATATIVAS">Tratativas</option>
                        <option value="OUTRA_OPERACAO">Outra Operação</option>
                      </select>
                    </Field>
                  )}
                </>
              )}

              <Field label="Motivo">
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Descreva o motivo da solicitação..."
                  rows={3}
                  className={`${fieldCls()} resize-none`}
                />
              </Field>

              {erro && (
                <div className="flex gap-2.5 rounded-xl border border-[#FF453A]/30 bg-[#FF453A]/5 p-3">
                  <AlertTriangle size={15} className="text-[#FF453A] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#FF453A]">{erro}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => escolherTipo(null)} className="px-5 py-2.5 rounded-xl bg-surface-2 hover:bg-surface-3 text-sm transition-colors cursor-pointer">
                  Voltar
                </button>
                <button
                  onClick={enviar}
                  disabled={!podeEnviar || enviando}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                    !podeEnviar || enviando ? "bg-[#FA4C00]/40 text-white/60 cursor-not-allowed" : "bg-[#FA4C00] hover:bg-[#D84300] text-white"
                  }`}
                >
                  <Send size={15} /> {enviando ? "Enviando..." : "Enviar Solicitação"}
                </button>
              </div>
            </div>
          )}
        </main>
      </MainLayout>
    </div>
  );
}
