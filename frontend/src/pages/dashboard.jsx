import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Clock, TrendingUp, Building2 } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dados, setDados] = useState(null);
  const [turno, setTurno] = useState("T1");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/dashboard");
        setDados(res.data.data);
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
          navigate("/login");
        } else {
          setErro("Erro ao carregar dashboard");
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [logout, navigate]);

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-[#BFBFC3]">
        Carregando…
      </div>
    );

  if (erro)
    return (
      <div className="h-screen flex items-center justify-center text-[#FF453A]">
        {erro}
      </div>
    );

  /* ================= DADOS ================= */

  const colaboradores = (dados.colaboradores || []).filter(
    (c) => (c.turno || "T1") === turno
  );

  const idsAusentes = new Set(
    (dados.ausenciasHoje || []).map((a) => a.colaboradorId)
  );

  const ausentes = colaboradores.filter((c) =>
    idsAusentes.has(c.id)
  ).length;

  const presentes = colaboradores.length - ausentes;

  const absenteismo = colaboradores.length
    ? ((ausentes / colaboradores.length) * 100).toFixed(1)
    : "0";

  const empresas = (dados.empresas || []).map((e) => ({
    nome: e.nome,
    qtd: colaboradores.filter((c) => c.empresa === e.nome).length,
  }));

  const generoData = Object.entries(
    colaboradores.reduce((acc, c) => {
      acc[c.genero || "N/I"] = (acc[c.genero || "N/I"] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name, value }));

  const listaAusentes = dados.ausenciasHoje || [];

  const COLORS = ["#FA4C00", "#0A84FF", "#34C759", "#FFD60A"];

  const renderPercentLabel = ({ percent }) =>
    `${(percent * 100).toFixed(0)}%`;

  /* ================= UI ================= */

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        navigate={navigate}
      />

      <div className="flex-1 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-8 space-y-10">
          {/* TURNO */}
          <div className="flex gap-2">
            {["T1", "T2", "T3"].map((t) => (
              <button
                key={t}
                onClick={() => setTurno(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition
                  ${
                    turno === t
                      ? "bg-[#FA4C00] text-white"
                      : "bg-[#1A1A1C] text-[#BFBFC3] hover:bg-[#2A2A2C]"
                  }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 bg-[#1A1A1C] rounded-2xl p-6">
            <KPI icon={Users} label="Colaboradores" value={colaboradores.length} />
            <KPI icon={Clock} label="Presentes Hoje" value={presentes} />
            <KPI
              icon={TrendingUp}
              label="Absenteísmo"
              value={`${absenteismo}%`}
              color={absenteismo > 10 ? "#FF453A" : "#34C759"}
            />
            <KPI icon={Building2} label="Empresas" value={empresas.length} />
          </div>

          {/* EMPRESAS */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
              Quantidade por Empresa
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {empresas.map((e) => (
                <div
                  key={e.nome}
                  className="bg-[#1A1A1C] rounded-xl px-5 py-4"
                >
                  <p className="text-[#BFBFC3] text-sm">{e.nome}</p>
                  <p className="text-2xl font-semibold">{e.qtd}</p>
                </div>
              ))}
            </div>
          </section>

          {/* DISTRIBUIÇÃO */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* GÊNERO */}
            <div className="bg-[#1A1A1C] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#BFBFC3] mb-4 uppercase">
                Distribuição por Gênero
              </h2>

              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie
                    data={generoData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    label={renderPercentLabel}
                    labelLine={false}
                  >
                    {generoData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                      />
                    ))}
                  </Pie>

                  <Tooltip
                    formatter={(value, name) => {
                      const total = generoData.reduce(
                        (acc, cur) => acc + cur.value,
                        0
                      );
                      const percent = ((value / total) * 100).toFixed(1);
                      return [`${value} (${percent}%)`, name];
                    }}
                    contentStyle={{
                      backgroundColor: "#1A1A1C",
                      border: "1px solid #3D3D40",
                      borderRadius: "8px",
                      color: "#FFFFFF",
                    }}
                  />

                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value) => (
                      <span className="text-[#BFBFC3] text-xs">
                        {value}
                      </span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* STATUS */}
            <div className="bg-[#1A1A1C] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[#BFBFC3] mb-4 uppercase">
                Status dos Colaboradores
              </h2>

              <div className="flex justify-between items-center">
                <span className="text-[#BFBFC3]">ATIVO</span>
                <span className="text-2xl font-semibold">
                  {colaboradores.length}
                </span>
              </div>
            </div>
          </section>

          {/* AUSENTES */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
              Ausentes Hoje
            </h2>

            <div className="bg-[#1A1A1C] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#2A2A2C] text-[#BFBFC3]">
                  <tr>
                    <th className="px-6 py-4 text-left">Colaborador</th>
                    <th className="px-6 py-4 text-left">Motivo</th>
                    <th className="px-6 py-4 text-left">Turno</th>
                  </tr>
                </thead>
                <tbody>
                  {listaAusentes.map((a, i) => (
                    <tr
                      key={i}
                      className="border-t border-[#3D3D40]"
                    >
                      <td className="px-6 py-4">{a.nome}</td>
                      <td className="px-6 py-4 text-[#BFBFC3]">
                        {a.motivo || "Sem registro"}
                      </td>
                      <td className="px-6 py-4 text-[#BFBFC3]">
                        {a.turno || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

/* ================= KPI ================= */

function KPI({ icon: Icon, label, value, color = "#FFFFFF" }) {
  return (
    <div className="flex items-center gap-4">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: "#2A2A2C", color }}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-sm text-[#BFBFC3]">{label}</p>
        <p className="text-2xl font-semibold" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}
