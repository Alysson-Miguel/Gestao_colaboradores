import { useEffect, useState, useContext } from "react";
import { X, Plus, Pencil, UserCheck, UserX, Users, Building2 } from "lucide-react";
import { AprovadoresOperacionaisAPI } from "../../services/aprovadoresOperacionais";
import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

const TODAS_AS_ESTACOES = "TODAS";

function iniciais(nome) {
  const partes = (nome || "").trim().split(/\s+/);
  return ((partes[0]?.[0] || "") + (partes[1]?.[0] || "")).toUpperCase();
}

export function AprovadoresOperacionaisModal({ open, onClose }) {
  const [aprovadores, setAprovadores] = useState([]);
  const [estacoes, setEstacoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { permissions } = useContext(AuthContext);
  const isAdmin = !!permissions?.isAdmin;

  const [formOpen, setFormOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nome: "", email: "", ativo: true, idEstacao: "" });
  const [salvando, setSalvando] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const data = await AprovadoresOperacionaisAPI.listar();
      setAprovadores(data || []);
    } catch {
      // silencioso — modal secundário
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    if (!open || !isAdmin) return;
    api.get("/estacoes", { params: { limit: 999 } })
      .then((res) => setEstacoes(res.data?.data || res.data || []))
      .catch(() => setEstacoes([]));
  }, [open, isAdmin]);

  if (!open) return null;

  const abrirNovo = () => {
    setEditando(null);
    setForm({ nome: "", email: "", ativo: true, idEstacao: "" });
    setFormOpen(true);
  };

  const abrirEditar = (a) => {
    setEditando(a);
    setForm({
      nome: a.nome,
      email: a.email,
      ativo: a.ativo,
      idEstacao: a.idEstacao == null ? TODAS_AS_ESTACOES : String(a.idEstacao),
    });
    setFormOpen(true);
  };

  const salvar = async () => {
    if (!form.nome.trim() || !form.email.trim()) {
      alert("Nome e email são obrigatórios");
      return;
    }
    if (isAdmin && !form.idEstacao) {
      alert("Selecione a estação do aprovador (ou \"Todas as estações\")");
      return;
    }

    const payload = { nome: form.nome, email: form.email, ativo: form.ativo };
    if (isAdmin) {
      payload.idEstacao = form.idEstacao === TODAS_AS_ESTACOES ? null : Number(form.idEstacao);
    }

    setSalvando(true);
    try {
      if (editando) {
        await AprovadoresOperacionaisAPI.atualizar(editando.idAprovador, payload);
      } else {
        await AprovadoresOperacionaisAPI.criar(payload);
      }
      setFormOpen(false);
      await load();
    } catch (e) {
      alert(e.response?.data?.message || "Erro ao salvar aprovador");
    } finally {
      setSalvando(false);
    }
  };

  const alternarAtivo = async (a) => {
    try {
      await AprovadoresOperacionaisAPI.atualizar(a.idAprovador, { ativo: !a.ativo });
      await load();
    } catch {
      alert("Erro ao atualizar aprovador");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl w-full max-w-2xl border border-default shadow-2xl max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-default shrink-0">
          <div>
            <h2 className="font-semibold text-base">Aprovadores</h2>
            <p className="text-xs text-muted mt-0.5">Responsáveis por aprovar ou reprovar Folga, Banco de Horas, Sinergia e Troca de DSR</p>
          </div>
          <button onClick={onClose} className="text-muted hover:text-page transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto flex-1">
          <div className="flex items-center justify-between mb-3">
            {!isAdmin ? (
              <p className="text-xs text-muted">Mostrando aprovadores da sua estação (e aprovadores globais).</p>
            ) : <span />}
            <button
              onClick={abrirNovo}
              className="flex items-center gap-2 bg-[#FA4C00] hover:bg-[#D84300] text-white px-3.5 py-2 rounded-xl text-xs font-medium transition-colors cursor-pointer"
            >
              <Plus size={14} /> Novo Aprovador
            </button>
          </div>

          <div className="border border-default rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-2 border-b border-default">
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Nome</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Email</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Estação</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted uppercase tracking-wide">Status</th>
                  <th className="px-3 py-2.5 text-right text-xs font-semibold text-muted uppercase tracking-wide">Ações</th>
                </tr>
              </thead>
              <tbody>
                {!loading && aprovadores.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Users size={20} className="text-subtle" />
                        <p className="text-muted text-sm">Nenhum aprovador cadastrado</p>
                      </div>
                    </td>
                  </tr>
                )}
                {aprovadores.map((a) => {
                  const podeGerenciar = isAdmin || a.idEstacao != null;
                  return (
                    <tr key={a.idAprovador} className="border-t border-default hover:bg-surface-2/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-full bg-[#FA4C00]/10 text-[#FA4C00] flex items-center justify-center text-[11px] font-semibold shrink-0">
                            {iniciais(a.nome) || "?"}
                          </div>
                          <span className="font-medium">{a.nome}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-muted">{a.email}</td>
                      <td className="px-3 py-2.5">
                        {a.estacao?.nomeEstacao ? (
                          <span className="text-muted text-xs">{a.estacao.nomeEstacao}</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#0A84FF]/10 text-[#0A84FF]">
                            <Building2 size={10} /> Todas
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium ${a.ativo ? "bg-[#34C759]/10 text-[#34C759]" : "bg-surface-2 text-muted"}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: a.ativo ? "#34C759" : "#71717A" }} />
                          {a.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => podeGerenciar && abrirEditar(a)}
                            disabled={!podeGerenciar}
                            className="p-1.5 rounded-lg text-muted hover:text-page hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={podeGerenciar ? "Editar" : "Somente Admin pode editar um aprovador de todas as estações"}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => podeGerenciar && alternarAtivo(a)}
                            disabled={!podeGerenciar}
                            className="p-1.5 rounded-lg text-muted hover:text-page hover:bg-surface-2 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={podeGerenciar ? (a.ativo ? "Desativar" : "Ativar") : "Somente Admin pode gerenciar um aprovador de todas as estações"}
                          >
                            {a.ativo ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SUB-MODAL: novo/editar aprovador */}
      {formOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setFormOpen(false)}>
          <div className="bg-surface rounded-2xl w-full max-w-md border border-default shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-default">
              <h2 className="font-semibold text-base">{editando ? "Editar Aprovador" : "Novo Aprovador"}</h2>
              <button onClick={() => setFormOpen(false)} className="text-muted hover:text-page transition-colors cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="px-5 py-4 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs text-muted">Nome</label>
                <input
                  type="text"
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-2 border border-default rounded-xl text-sm text-page focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-2 border border-default rounded-xl text-sm text-page focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50"
                />
              </div>

              {isAdmin ? (
                <div className="space-y-1.5">
                  <label className="text-xs text-muted">Estação</label>
                  <select
                    value={form.idEstacao}
                    onChange={(e) => setForm({ ...form, idEstacao: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-2 border border-default rounded-xl text-sm text-page focus:outline-none focus:ring-2 focus:ring-[#FA4C00]/50 appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Selecione a estação</option>
                    {estacoes.map((e) => (
                      <option key={e.idEstacao} value={e.idEstacao}>{e.nomeEstacao}</option>
                    ))}
                    <option value={TODAS_AS_ESTACOES}>Todas as estações</option>
                  </select>
                </div>
              ) : (
                <p className="text-xs text-muted bg-surface-2 border border-default rounded-xl px-3 py-2.5">
                  Este aprovador será cadastrado na sua estação atual.
                </p>
              )}

              <label className="flex items-center gap-2 text-sm text-muted cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                  className="accent-[#FA4C00]"
                />
                Ativo
              </label>
            </div>

            <div className="px-5 py-4 border-t border-default flex justify-end gap-3">
              <button onClick={() => setFormOpen(false)} className="px-5 py-2 rounded-xl bg-surface-2 hover:bg-surface-3 text-sm transition-colors cursor-pointer">
                Cancelar
              </button>
              <button
                onClick={salvar}
                disabled={salvando}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer ${salvando ? "bg-[#FA4C00]/50 cursor-not-allowed" : "bg-[#FA4C00] hover:bg-[#D84300]"} text-white`}
              >
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
