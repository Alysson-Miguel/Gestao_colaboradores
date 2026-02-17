"use client"

import { useEffect, useState } from "react"
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts"

import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import api from "../../services/api"
import TurnoSelector from "../../components/dashboard/TurnoSelector"
import DateFilter from "../../components/dashboard/DateFilter"
import DashboardHeader from "../../components/dashboard/DashboardHeader"

const COLORS = ["#FA4C00", "#3b82f6", "#FFB37A", "#34C759", "#A855F7"]

export default function DashboardColaboradoresExecutivo() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [turno, setTurno] = useState("ALL")
  const [dateRange, setDateRange] = useState({})

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await api.get("/dashboard/colaboradores", {
        params: {
          turno: turno === "ALL" ? undefined : turno,
          ...dateRange,
        },
      })
      setDados(res.data.data)
      setLoading(false)
    }

    load()
  }, [turno, dateRange])


  if (loading || !dados) {
    return (
      <div className="h-screen flex items-center justify-center text-[#BFBFC3]">
        Carregando...
      </div>
    )
  }

  const { kpis, series, donut, rankings, distribuicoes, hc } = dados
  

  const tempoCasaData = Object.entries(
    donut?.tempoEmpresaDistribuicao || {}
  ).map(([name, value]) => ({ name, value }))

  const generoData = Object.entries(
    donut?.generoDistribuicao || {}
  ).map(([name, value]) => ({ name, value }))

  const turnoData = Object.entries(
    donut?.turnoDistribuicao || {}
  ).map(([name, value]) => ({ name, value }))

  const headcountMensal = series?.headcountMensal || []

  const hcLider = hc?.hcPorLider || []
  const hcSetor = hc?.hcPorSetor || []
  const hcEscala = hc?.hcPorEscala || []

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Header />

        <main className="p-8 space-y-10">
        <DashboardHeader
          title="Dashboard de Colaboradores"
          subtitle="Período"
          date={
            dados?.periodo?.inicio && dados?.periodo?.fim
              ? `${dados.periodo.inicio} → ${dados.periodo.fim}`
              : "-"
          }
          badges={[`Turno: ${turno === "ALL" ? "Todos" : turno}`]}
        />

        <div className="flex flex-wrap gap-6 items-center">
          <TurnoSelector
            value={turno}
            onChange={setTurno}
            options={["ALL", "T1", "T2", "T3"]}
        />

          <DateFilter value={dateRange} onApply={setDateRange} />
        </div>

          {/* ================= KPIs ================= */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <KpiCard label="Colaboradores Ativos" value={kpis.ativos} />
            <KpiCard label="Turnover" value={`${Number(kpis.turnover ?? 0).toFixed(2)}%`} />
            <KpiCard label="Absenteísmo" value={`${kpis.absenteismoPeriodo}%`} />
            <KpiCard label="Média Idade" value={`${kpis.mediaIdade} anos`} />
            <KpiCard label="Tempo Médio Empresa" value={`${kpis.tempoMedioEmpresa} anos`} />
          </div>

          {/* ================= HEADCOUNT + MOVIMENTAÇÃO ================= */}
          <Card title="Headcount & Movimentações">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart
                data={headcountMensal.map((h, index) => ({
                  mes: h.mes,
                  headcount: h.total,
                  admissoes: series?.admissoesMensal?.[index]?.total || 0,
                  desligamentos: series?.desligamentosMensal?.[index]?.total || 0,
                }))}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />

                <XAxis dataKey="mes" stroke="#BFBFC3" />
                <YAxis stroke="#BFBFC3" />

                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1F1F22",
                    border: "none",
                    borderRadius: 12,
                  }}
                />

                <Legend />

                {/* 🔵 Linha HC */}
                <Line
                  type="monotone"
                  dataKey="headcount"
                  stroke="#FA4C00"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Headcount"
                  label={{
                    position: "top",
                    fill: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                />

                {/* 🟢 Admissões */}
                <Bar
                  dataKey="admissoes"
                  fill="#34C759"
                  radius={[6, 6, 0, 0]}
                  name="Admissões">
                  <LabelList
                  dataKey="admissoes"
                  position="top"
                  fill="#34C759"
                  fontSize={12}
                  fontWeight={600}
                  />
                </Bar>

                {/* 🔴 Demissões */}
                <Bar
                  dataKey="desligamentos"
                  fill="#FF453A"
                  radius={[6, 6, 0, 0]}
                  name="Demissões">
                  <LabelList
                    dataKey="desligamentos"
                    position="top"
                    fill="#FF453A"
                    fontSize={12}
                    fontWeight={600}
                  />  
                </Bar>
              </ComposedChart>
            </ResponsiveContainer>
          </Card>


          {/* ================= DONUTS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            {/* TEMPO DE CASA */}
            <Card title="Tempo de Casa">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={tempoCasaData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    innerRadius={60}
                    label
                  >
                    {tempoCasaData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{
                      paddingTop: 20,
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* GÊNERO */}
            <Card title="Distribuição por Gênero">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={generoData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    innerRadius={60}
                    label
                  >
                    {generoData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* TURNO */}
            <Card title="Distribuição por Turno">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={turnoData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    innerRadius={60}
                    label
                  >
                    {turnoData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </Card>
                    
          </div>
          {/* ================= HC POR LIDER / SETOR / ESCALA ================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

            <Card title="HC por Líder">
              <RankingListHC data={hcLider} />
            </Card>

            <Card title="HC por Setor">
              <RankingListHC data={hcSetor} />
            </Card>

            <Card title="HC por Escala">
              <RankingListHC data={hcEscala} />
            </Card>

          </div>
                    
          {/* ================= TOP 10 ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Top 10 Faltas">
              <RankingList data={rankings?.topFaltas || []} />
            </Card>

            <Card title="Top 10 Atestados">
              <RankingList data={rankings?.topAtestados || []} />
            </Card>
          </div>

        </main>
      </div>
    </div>
  )
}

/* ================= COMPONENTS ================= */

function Card({ title, children }) {
  return (
    <div className="bg-[#1A1A1C] rounded-xl p-6">
      <h2 className="mb-4 font-semibold">{title}</h2>
      {children}
    </div>
  )
}

function KpiCard({ label, value }) {
  return (
    <div className="bg-[#1A1A1C] rounded-xl p-6">
      <div className="text-xs text-[#BFBFC3]">{label}</div>
      <div className="text-2xl font-semibold mt-2">{value}</div>
    </div>
  )
}

function RankingList({ data }) {
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span>{item.colaborador}</span>
          <span className="text-[#FA4C00]">{item.qtd}</span>
        </div>
      ))}
    </div>
  )
}
function RankingListHC({ data }) {
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex justify-between text-sm">
          <span>{item.name}</span>
          <span className="text-[#3b82f6] font-semibold">
            {item.total}
          </span>
        </div>
      ))}
    </div>
  )
}
