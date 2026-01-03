import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  FileText,
  ShieldAlert,
} from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import TurnoSelector from "../../components/dashboard/TurnoSelector";
import DateFilter from "../../components/dashboard/DateFilter";
import KpiCardsRow from "../../components/dashboard/KpiCardsRow";
import DistribuicaoGeneroChart from "../../components/dashboard/DistribuicaoGeneroChart";
import StatusColaboradoresSection from "../../components/dashboard/StatusColaboradoresSection";
import AusentesHojeTable from "../../components/dashboard/AusentesHojeTable";
import EmpresasResumoSection from "../../components/dashboard/EmpresasResumoSection";

import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

/* =====================================================
   ESTADO INICIAL SEGURO
===================================================== */
const INITIAL_DATA = {
  periodo: { inicio: "", fim: "" },

  totalColaboradores: 0,

  indicadores: {
    absenteismo: 0,
    turnover: 0,
    atestados: 0,
    medidasDisciplinares: 0,
    acidentes: 0,
  },

  genero: [],
  status: [],
  empresasResumo: [],
  eventos: [],
};

export default function DashboardAdmin() {
  /* =====================================================
     STATES
  ===================================================== */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dados, setDados] = useState(INITIAL_DATA);
  const [turno, setTurno] = useState("ALL");

  // 📅 filtro de período (simples e limpo)
  const [dateRange, setDateRange] = useState({
    dataInicio: "",
    dataFim: "",
  });

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  /* =====================================================
     LOAD DASHBOARD ADMIN
  ===================================================== */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/dashboard/admin", {
          params: {
            turno,
            ...dateRange,
          },
        });

        setDados({
          ...INITIAL_DATA,
          ...res.data.data,
        });
      } catch (e) {
        if (e.response?.status === 401) {
          logout();
          navigate("/login");
        } else {
          setErro("Erro ao carregar dashboard administrativo");
        }
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [turno, dateRange, logout, navigate]);

  /* =====================================================
     📊 KPIs (UMA ÚNICA LINHA)
  ===================================================== */
  const kpis = useMemo(() => {
    const i = dados.indicadores;

    return [
      {
        icon: Users,
        label: "Colaboradores",
        value: dados.totalColaboradores,
      },
      {
        icon: TrendingUp,
        label: "Absenteísmo",
        value: i.absenteismo,
        suffix: "%",
        color: i.absenteismo > 10 ? "#FF453A" : "#34C759",
      },
      {
        icon: TrendingUp,
        label: "Turnover",
        value: i.turnover,
        suffix: "%",
        color: i.turnover > 5 ? "#FF9F0A" : "#34C759",
      },
      {
        icon: FileText,
        label: "Atestados",
        value: i.atestados,
      },
      {
        icon: ShieldAlert,
        label: "Medidas Disciplinares",
        value: i.medidasDisciplinares,
      },
      {
        icon: AlertTriangle,
        label: "Acidentes",
        value: i.acidentes,
        color: "#FFD60A",
      },
    ];
  }, [dados]);

  /* =====================================================
     STATUS DOS COLABORADORES
  ===================================================== */
  const statusItems = useMemo(
    () =>
      (dados.status || []).map((s) => ({
        label: s.label,
        value: s.quantidade,
      })),
    [dados]
  );

  /* =====================================================
     EVENTOS
  ===================================================== */
  const tableColumns = useMemo(
    () => [
      { key: "nome", label: "Colaborador" },
      { key: "empresa", label: "Empresa" },
      { key: "setor", label: "Setor" },
      { key: "evento", label: "Evento" },
      {
        key: "data",
        label: "Data",
        render: (v) =>
          v ? new Date(v).toLocaleDateString("pt-BR") : "-",
      },
    ],
    []
  );

  /* =====================================================
     RENDER STATES
  ===================================================== */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-[#BFBFC3]">
        Carregando…
      </div>
    );
  }

  if (erro) {
    return (
      <div className="h-screen flex items-center justify-center text-[#FF453A]">
        {erro}
      </div>
    );
  }

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
          {/* HEADER */}
          <DashboardHeader
            title="Dashboard Administrativo"
            subtitle="Período"
            date={
              dados.periodo.inicio && dados.periodo.fim
                ? `${dados.periodo.inicio} → ${dados.periodo.fim}`
                : "-"
            }
            badges={[`Turno: ${turno === "ALL" ? "Todos" : turno}`]}
          />

          {/* FILTROS */}
          <div className="flex flex-wrap gap-6 items-center">
            <TurnoSelector
              value={turno}
              onChange={setTurno}
              options={["ALL", "T1", "T2", "T3"]}
            />

            <DateFilter
              value={dateRange}
              onApply={(range) => {
                setDateRange(range);
              }}
            />

          </div>

          {/* KPIs */}
          <KpiCardsRow items={kpis} />

          {/* GRÁFICOS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DistribuicaoGeneroChart
              title="Distribuição por Gênero"
              data={dados.genero}
            />

            <StatusColaboradoresSection
              title="Status dos Colaboradores"
              items={statusItems}
            />
          </div>

          {/* EMPRESAS */}
          <EmpresasResumoSection empresas={dados.empresasResumo} />

          {/* EVENTOS */}
          <AusentesHojeTable
            title="Eventos no período"
            data={dados.eventos}
            columns={tableColumns}
            getRowKey={(row) => row.id}
            emptyMessage="Nenhum evento no período"
          />
        </main>
      </div>
    </div>
  );
}
