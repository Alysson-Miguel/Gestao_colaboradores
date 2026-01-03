import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Users, Clock, TrendingUp, Building2 } from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import DashboardHeader from "../../components/dashboard/DashboardHeader";
import TurnoSelector from "../../components/dashboard/TurnoSelector";
import KpiCardsRow from "../../components/dashboard/KpiCardsRow";
import EmpresasSection from "../../components/dashboard/EmpresasSection";
import DistribuicaoGeneroChart from "../../components/dashboard/DistribuicaoGeneroChart";
import StatusColaboradoresSection from "../../components/dashboard/StatusColaboradoresSection";
import AusentesHojeTable from "../../components/dashboard/AusentesHojeTable";
import SetorDistribuicaoSection from "../../components/dashboard/SetorDistribuicaoSection";

import { AuthContext } from "../../context/AuthContext";
import api from "../../services/api";

export default function DashboardOperacional() {
  /* =====================================================
     STATES
  ===================================================== */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dados, setDados] = useState(null);
  const [turno, setTurno] = useState("T1");
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState(null);

  const navigate = useNavigate();
  const { logout } = useContext(AuthContext);

  /* =====================================================
     LOAD DASHBOARD
  ===================================================== */
  useEffect(() => {
    async function load() {
      try {
        const res = await api.get("/dashboard");
        const payload = res.data.data;

        setDados(payload);
        setTurno(payload.turnoAtual || "T1");
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

  /* =====================================================
     🔑 TURNO SELECIONADO (FONTE ÚNICA)
  ===================================================== */
  const turnoData = useMemo(() => {
    if (!dados?.distribuicaoTurnoSetor) {
      return {
        totalEscalados: 0,
        presentes: 0,
        ausentes: 0,
        setores: [],
      };
    }

    return (
      dados.distribuicaoTurnoSetor.find(
        (t) => t.turno === turno
      ) || {
        totalEscalados: 0,
        presentes: 0,
        ausentes: 0,
        setores: [],
      }
    );
  }, [dados, turno]);

  /* =====================================================
     📊 KPIs
  ===================================================== */
  const totalColaboradores = turnoData.totalEscalados;
  const presentes = turnoData.presentes;
  const ausentes = turnoData.ausentes;

  const absenteismo = useMemo(() => {
    if (!totalColaboradores) return 0;
    return ((ausentes / totalColaboradores) * 100).toFixed(1);
  }, [ausentes, totalColaboradores]);

  const kpis = useMemo(
    () => [
      { icon: Users, label: "Colaboradores", value: totalColaboradores },
      { icon: Clock, label: "Presentes no turno", value: presentes },
      {
        icon: TrendingUp,
        label: "Absenteísmo",
        value: absenteismo,
        suffix: "%",
        color: absenteismo > 10 ? "#FF453A" : "#34C759",
      },
      {
        icon: Building2,
        label: "Empresas",
        value: dados?.empresas?.length || 0,
      },
    ],
    [totalColaboradores, presentes, absenteismo, dados]
  );

  /* =====================================================
     📌 STATUS POR TURNO
  ===================================================== */
  const statusItems = useMemo(() => {
    return (dados?.statusColaboradoresPorTurno?.[turno] || []).map(
      (s) => ({
        label: s.status,
        value: s.quantidade,
      })
    );
  }, [dados, turno]);

  /* =====================================================
     🚨 AUSENTES DO TURNO
  ===================================================== */
  const ausentesTurno = useMemo(() => {
    if (!dados?.ausenciasHoje) return [];
    return dados.ausenciasHoje.filter(
      (a) => a.turno === turno
    );
  }, [dados, turno]);

  /* 🔹 COLUNAS DA TABELA (GENÉRICA) */
  const ausentesColumns = useMemo(
    () => [
      { key: "nome", label: "Colaborador" },
      { key: "motivo", label: "Motivo" },
      { key: "turno", label: "Turno" },
      { key: "setor", label: "Setor" },
      { key: "empresa", label: "Empresa" },
      {
        key: "dataAdmissao",
        label: "Admissão",
        render: (v) =>
          v
            ? new Date(v).toLocaleDateString("pt-BR")
            : "-",
      },
    ],
    []
  );

  /* =====================================================
     🏢 EMPRESAS POR TURNO
  ===================================================== */
  const empresasPorTurno = useMemo(() => {
    return dados?.empresaPorTurno?.[turno] || [];
  }, [dados, turno]);

  const empresasItems = useMemo(
    () =>
      empresasPorTurno.map((e) => ({
        label: e.empresa,
        value: e.quantidade,
      })),
    [empresasPorTurno]
  );

  /* =====================================================
     🧭 SETORES (PRESENTES)
  ===================================================== */
  const setoresItems = useMemo(() => {
    return (turnoData.setores || []).map((s) => ({
      label: s.setor,
      value: s.quantidade,
    }));
  }, [turnoData]);

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

  if (!dados) return null;

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
            title="Dashboard Operacional"
            subtitle="Dia operacional"
            date={dados.dataOperacional}
            badges={[`Turno atual: ${dados.turnoAtual}`]}
          />

          {/* SELETOR DE TURNO */}
          <TurnoSelector
            value={turno}
            onChange={setTurno}
            options={["T1", "T2", "T3"]}
          />

          {/* KPIs */}
          <KpiCardsRow items={kpis} />

          {/* EMPRESAS */}
          <EmpresasSection
            title="Quantidade por Empresa"
            items={empresasItems}
          />

          {/* DISTRIBUIÇÕES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DistribuicaoGeneroChart
              title="Distribuição por Gênero"
              data={dados.generoPorTurno?.[turno] || []}
            />

            <StatusColaboradoresSection
              title="Status dos Colaboradores"
              items={statusItems}
            />
          </div>

          {/* SETORES */}
          <SetorDistribuicaoSection
            title="Presença por Setor"
            items={setoresItems}
          />

          {/* AUSENTES */}
          <AusentesHojeTable
            title={`Ausentes no turno — ${turno}`}
            data={ausentesTurno}
            columns={ausentesColumns}
            getRowKey={(row) => row.opsId}
            emptyMessage="Nenhum ausente no turno"
          />
        </main>
      </div>
    </div>
  );
}
