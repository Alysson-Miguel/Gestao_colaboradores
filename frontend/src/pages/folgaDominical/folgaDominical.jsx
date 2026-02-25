// src/pages/folgaDominical/folgaDominical.jsx
"use client";

import { useEffect, useState, useCallback, useContext } from "react";
import { CalendarDays, RefreshCcw, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import api from "../../services/api";
import { AuthContext } from "../../context/AuthContext";

const MESES = [
  { value: 1, label: "janeiro" },
  { value: 2, label: "fevereiro" },
  { value: 3, label: "março" },
  { value: 4, label: "abril" },
  { value: 5, label: "maio" },
  { value: 6, label: "junho" },
  { value: 7, label: "julho" },
  { value: 8, label: "agosto" },
  { value: 9, label: "setembro" },
  { value: 10, label: "outubro" },
  { value: 11, label: "novembro" },
  { value: 12, label: "dezembro" },
];

function getMesAtual() {
  const now = new Date();
  return { ano: now.getFullYear(), mes: now.getMonth() + 1 };
}

function formatDateBR(dateStr) {
  // dateStr vem tipo "2026-04-05"
  const [y, m, d] = String(dateStr).slice(0, 10).split("-");
  if (!y || !m || !d) return dateStr;
  return `${d}/${m}/${y}`;
}

export default function FolgaDominicalPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const isAdmin = user?.role === "ADMIN";
  const isLideranca = user?.role === "LIDERANCA";

  const atual = getMesAtual();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [ano, setAno] = useState(atual.ano);
  const [mes, setMes] = useState(atual.mes);

  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState(null);
  const [erro, setErro] = useState("");

  /* ================= LOAD (igual DW) ================= */
  const load = useCallback(async () => {
    setLoading(true);
    setErro("");
    try {
      const res = await api.get(`/folga-dominical?ano=${ano}&mes=${mes}`);
      setResumo(res.data?.data || null);
    } catch (e) {
      const msg = e?.response?.data?.error || "Nenhum planejamento encontrado.";
      setResumo(null);
      setErro(msg);
    } finally {
      setLoading(false);
    }
  }, [ano, mes]);

  useEffect(() => {
    load();
  }, [load]);

  async function gerar() {
    if (!isAdmin) return;
    if (!window.confirm("Deseja gerar o planejamento deste mês?")) return;

    setLoading(true);
    setErro("");
    try {
      await api.post("/folga-dominical", { ano, mes });
      await load();
    } catch (e) {
      setErro(e?.response?.data?.error || "Erro ao gerar planejamento.");
    } finally {
      setLoading(false);
    }
  }

  async function reprocessar() {
    if (!isAdmin) return;
    if (
      !window.confirm(
        "Isso irá remover o planejamento atual do mês e apagar DSRs automáticos desse planejamento.\nDeseja continuar?"
      )
    )
      return;

    setLoading(true);
    setErro("");
    try {
      await api.delete(`/folga-dominical?ano=${ano}&mes=${mes}`);
      // opcional: já gera de novo em seguida
      await api.post("/folga-dominical", { ano, mes });
      await load();
    } catch (e) {
      setErro(e?.response?.data?.error || "Erro ao reprocessar planejamento.");
    } finally {
      setLoading(false);
    }
  }

  const total = resumo?.total ?? 0;
  const porDomingo = resumo?.porDomingo ?? {};

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      {/* SIDEBAR (igual DW) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      {/* CONTEÚDO (igual DW) */}
      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* HEADER */}
          <div>
            <h1 className="text-2xl font-semibold">Folga Dominical</h1>
            <p className="text-sm text-[#BFBFC3]">
              Distribuição automática de DSR aos domingos (Escala B)
            </p>
          </div>

          {/* FILTROS + CTA (mesmo padrão DW) */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-wrap">
              {/* ANO */}
              <div className="bg-[#1A1A1C] px-4 py-2 rounded-xl flex items-center gap-2">
                <CalendarDays size={16} className="text-[#FA4C00]" />
                <input
                  type="number"
                  value={ano}
                  onChange={(e) => setAno(Number(e.target.value))}
                  className="bg-transparent outline-none text-sm text-white w-24"
                />
              </div>

              {/* MÊS */}
              <select
                value={mes}
                onChange={(e) => setMes(Number(e.target.value))}
                className="bg-[#1A1A1C] text-sm px-4 py-2 rounded-xl text-[#BFBFC3] outline-none hover:bg-[#2A2A2C]"
              >
                {MESES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>

              <button
                onClick={load}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A1A1C] hover:bg-[#2A2A2C] text-sm rounded-xl disabled:opacity-60"
              >
                <RefreshCcw size={16} />
                Atualizar
              </button>
            </div>

            {/* BOTÕES (ADMIN apenas) */}
            {isAdmin && (
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={gerar}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FA4C00] hover:bg-[#ff5a1a] text-sm font-medium rounded-xl transition disabled:opacity-60"
                >
                  <RefreshCcw size={16} />
                  Gerar
                </button>

                <button
                  onClick={reprocessar}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-sm font-medium rounded-xl transition disabled:opacity-60"
                >
                  <Trash2 size={16} />
                  Reprocessar
                </button>
              </div>
            )}

            {/* LIDERANCA: sem botões */}
            {isLideranca && !isAdmin && (
              <div className="text-xs text-[#BFBFC3]">
                Visualização apenas (LIDERANÇA)
              </div>
            )}
          </div>

          {/* STATUS / ERRO */}
          {loading && (
            <div className="bg-[#1A1A1C] rounded-2xl p-6 text-[#BFBFC3]">
              Carregando planejamento…
            </div>
          )}

          {!loading && erro && (
            <div className="bg-[#1A1A1C] rounded-2xl p-6 text-[#FF453A]">
              {erro}
            </div>
          )}

          {/* RESUMO */}
          {!loading && resumo && (
            <div className="bg-[#1A1A1C] rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h2 className="text-lg font-semibold">Resumo do Planejamento</h2>
                <div className="text-xs text-[#BFBFC3]">
                  {ano} • {MESES.find((m) => m.value === mes)?.label}
                </div>
              </div>

              {/* CARDS RESPONSIVOS (igual vibe DW) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Card
                  title="Total Colaboradores"
                  value={total}
                  highlight
                />

                {Object.entries(porDomingo).map(([data, qtd]) => (
                  <Card
                    key={data}
                    title={formatDateBR(data)}
                    value={qtd}
                  />
                ))}
              </div>
            </div>
          )}
          {/* ================= TABELA COLABORADORES ================= */}
        {!loading && resumo?.colaboradores?.length > 0 && (
        <div className="bg-[#1A1A1C] rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#2A2A2C]">
            <h2 className="text-lg font-semibold">
                Colaboradores no Planejamento
            </h2>
            <p className="text-xs text-[#BFBFC3]">
                Lista de colaboradores elegíveis (Escala B)
            </p>
            </div>

            <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead className="border-b border-[#2A2A2C] text-[#BFBFC3]">
                <tr>
                    <th className="px-6 py-4 text-left">OPS ID</th>
                    <th className="px-6 py-4 text-left">Nome Completo</th>
                    <th className="px-6 py-4 text-center">Turno</th>
                    <th className="px-6 py-4 text-left">Líder</th>
                    <th className="px-6 py-4 text-left">Setor</th>
                </tr>
                </thead>

                <tbody>
                {resumo.colaboradores.map((colab, index) => (
                    <tr
                    key={index}
                    className="border-t border-[#2A2A2C] hover:bg-[#242426] transition"
                    >
                    <td className="px-6 py-4 font-semibold text-[#FA4C00]">
                        {colab.opsId}
                    </td>

                    <td className="px-6 py-4">
                        {colab.nome}
                    </td>

                    <td className="px-6 py-4 text-center">
                        {colab.turno || "-"}
                    </td>

                    <td className="px-6 py-4">
                        {colab.lider || "-"}
                    </td>

                    <td className="px-6 py-4">
                        {colab.setor || "-"}
                    </td>
                    </tr>
                ))}
                </tbody>
            </table>
            </div>
        </div>
        )}
        </main>
      </div>
    </div>
  );
}

function Card({ title, value, highlight }) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        highlight
          ? "bg-[#FA4C00]/10 border border-[#FA4C00]"
          : "bg-[#242426]"
      }`}
    >
      <div className="text-xs text-[#BFBFC3] mb-1">{title}</div>
      <div className="text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}