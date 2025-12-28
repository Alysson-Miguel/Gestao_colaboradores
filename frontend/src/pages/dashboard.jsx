import { useState, useEffect, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";

import DashboardHeader from "../components/dashboard/DashboardHeader";
import TurnoSelector from "../components/dashboard/TurnoSelector";
import KpiCardsRow from "../components/dashboard/KpiCardsRow";
import EmpresasSection from "../components/dashboard/EmpresasSection";
import DistribuicaoGeneroChart from "../components/dashboard/DistribuicaoGeneroChart";
import StatusColaboradoresSection from "../components/dashboard/StatusColaboradoresSection";
import AusentesHojeTable from "../components/dashboard/AusentesHojeTable";
import SetorDistribuicaoSection from "../components/dashboard/SetorDistribuicaoSection";

import { AuthContext } from "../context/AuthContext";
import api from "../services/api";

export default function Dashboard() {
  /* =====================================================
     STATES
     ===================================================== */
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dados, setDados] = useState(null);
  const [turno, setTurno] = useState(null);
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
   🔑 DADOS DO TURNO SELECIONADO (FONTE ÚNICA)
   ===================================================== */
const turnoData = useMemo(() => {
  if (!dados || !dados.distribuicaoTurnoSetor || !turno) {
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
  if (!totalColaboradores) return "0.0";
  return ((ausentes / totalColaboradores) * 100).toFixed(1);
}, [ausentes, totalColaboradores]);

/* =====================================================
   📌 STATUS POR TURNO
   ===================================================== */
const statusData = useMemo(() => {
  return dados?.statusColaboradoresPorTurno?.[turno] || [];
}, [dados, turno]);

/* =====================================================
   🚨 AUSENTES DO TURNO
   ===================================================== */
const ausentesTurno = useMemo(() => {
  if (!dados || !turno) return [];
  return dados.ausenciasHoje.filter(
    (a) => a.turno === turno
  );
}, [dados, turno]);

/* =====================================================
   🏢 EMPRESAS (INSTITUCIONAL)
   ===================================================== */
const empresas = useMemo(() => {
  return dados?.empresas || [];
}, [dados]);

/* =====================================================
   🧭 SETORES (SOMENTE PRESENTES)
   ===================================================== */
const setores = useMemo(() => {
  return turnoData.setores;
}, [turnoData]);

// 🏢 Quantidade por empresa (ESCALADOS POR TURNO)
const empresasPorTurno = useMemo(() => {
  return dados?.empresaPorTurno?.[turno] || [];
}, [dados, turno]);


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
            dataOperacional={dados.dataOperacional}
            turnoAtual={dados.turnoAtual}
          />

          {/* SELETOR DE TURNO */}
          <TurnoSelector turno={turno} onChange={setTurno} />

          {/* KPIs */}
          <KpiCardsRow
            total={totalColaboradores}
            presentes={presentes}
            absenteismo={absenteismo}
            empresasCount={empresas.length}
          />

          {/* EMPRESAS */}
          <EmpresasSection empresas={empresasPorTurno} />


          {/* DISTRIBUIÇÕES */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <DistribuicaoGeneroChart
              data={dados.generoPorTurno?.[turno] || []}
            />
            <StatusColaboradoresSection status={statusData} />
          </div>

          {/* SETORES */}
          <SetorDistribuicaoSection setores={setores} />

          {/* AUSENTES */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-[#BFBFC3] uppercase">
              Ausentes Hoje — {turno}
            </h2>

            <AusentesHojeTable ausentes={ausentesTurno} />
          </section>
        </main>
      </div>
    </div>
  );
}
