"use client"

import { useEffect, useState } from "react"
import {
  ResponsiveContainer,
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
} from "recharts"

import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"
import api from "../../services/api"

const COLORS = ["#FA4C00", "#3b82f6", "#FFB37A", "#34C759", "#A855F7"]

export default function DashboardColaboradoresExecutivo() {
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await api.get("/dashboard/colaboradores")
      setDados(res.data.data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading || !dados) {
    return (
      <div className="h-screen flex items-center justify-center text-[#BFBFC3]">
        Carregando...
      </div>
    )
  }

  const { kpis, series, donut, rankings, distribuicoes } = dados

  const tempoCasaData = Object.entries(
    donut?.tempoEmpresaDistribuicao || {}
  ).map(([name, value]) => ({ name, value }))

  const headcountMensal = series?.headcountMensal || []

  return (
    <div className="flex min-h-screen bg-[#0D0D0D] text-white">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Header />

        <main className="p-8 space-y-10">

          {/* ================= KPIs ================= */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <KpiCard label="Colaboradores Ativos" value={kpis.ativos} />
            <KpiCard label="Turnover" value={`${kpis.turnover || 0}%`} />
            <KpiCard label="Absenteísmo" value={`${kpis.absenteismoPeriodo}%`} />
            <KpiCard label="Média Idade" value={`${kpis.mediaIdade} anos`} />
            <KpiCard label="Tempo Médio Empresa" value={`${kpis.tempoMedioEmpresa} anos`} />
          </div>

          {/* ================= HEADCOUNT POR MÊS ================= */}
          <Card title="Headcount por Mês">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={headcountMensal}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" stroke="#BFBFC3" />
                <YAxis stroke="#BFBFC3" />
                <Tooltip />
                <Bar dataKey="total" fill="#FA4C00" />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* ================= DONUTS ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card title="Tempo de Casa">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={tempoCasaData}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                  >
                    {tempoCasaData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>

            {/* GÊNERO precisa ser adicionado no backend */}
            <Card title="Gênero">
              <div className="text-sm text-[#BFBFC3]">
                ⚠ Backend precisa enviar distribuição por gênero
              </div>
            </Card>
          </div>

          {/* ================= EVOLUÇÃO HC (LINHA) ================= */}
          <Card title="Evolução HC (6 meses)">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={headcountMensal.slice(-6)}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="mes" stroke="#BFBFC3" />
                <YAxis stroke="#BFBFC3" />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>

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
