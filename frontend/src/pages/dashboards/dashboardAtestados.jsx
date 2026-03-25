"use client"

import React, { useEffect, useMemo, useState } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts"
import api from "../../services/api"
import Sidebar from "../../components/Sidebar"
import Header from "../../components/Header"

/* ─── TOKENS ─────────────────────────────────────────────────────── */
const BRAND = "#FA4C00"
const CHART_COLORS = [
  "#FA4C00",
  "#3B82F6",
  "#F59E0B",
  "#22C55E",
  "#A855F7",
  "#EC4899",
  "#14B8A6",
]

/* ─── UTILS ──────────────────────────────────────────────────────── */
function isoToday() {
  return new Date().toISOString().slice(0, 10)
}
function isoFirstDayOfMonth() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

const CID_DESCRICOES = {
  A09: "Sintomas Gripais",
  J11: "Sintomas Gripais",
  J069: "Sintomas Gripais",
  B349: "Sintomas Gripais",
  H920: "Sintomas Gripais",
  M545: "Dor lombar (lombalgia)",
  M796: "Dor em membros",
  R11: "Náuseas e vômitos",
  R52: "Dor não especificada",
  R520: "Dor aguda",
}

/* ─── CUSTOM TOOLTIP ─────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "#1A1A1A",
        border: "1px solid rgba(255,255,255,0.10)",
        borderRadius: 12,
        padding: "10px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
      }}
    >
      {label && (
        <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginBottom: 4 }}>
          {label}
        </p>
      )}
      {payload.map((p, i) => (
        <p key={i} style={{ color: "#fff", fontSize: 14, fontWeight: 600, margin: 0 }}>
          <span style={{ color: p.color || BRAND }}>● </span>
          {p.value}
        </p>
      ))}
    </div>
  )
}

/* ─── SKELETON ───────────────────────────────────────────────────── */
function Skeleton({ style = {} }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.05)",
        borderRadius: 10,
        animation: "pulse 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  )
}

/* ─── SVG ICONS ──────────────────────────────────────────────────── */
const IconDoc = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
  </svg>
)
const IconRepeat = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 1l4 4-4 4" /><path d="M3 11V9a4 4 0 014-4h14" /><path d="M7 23l-4-4 4-4" /><path d="M21 13v2a4 4 0 01-4 4H3" />
  </svg>
)
const IconUsers = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
)
const IconPercent = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
)
const IconCalDay = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M12 14h.01" />
  </svg>
)
const IconCalWeek = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h8" />
  </svg>
)
const IconCalMonth = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18M8 14h2M14 14h2M8 18h2M14 18h2" />
  </svg>
)
const IconTrend = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" />
  </svg>
)
const IconGrid = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
  </svg>
)
const IconAlert = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconList = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
)
const IconSearch = ({ c = "currentColor", s = 16 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)
const IconMedical = ({ c = "currentColor", s = 18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
)
const IconChevronDown = ({ c = "currentColor", s = 14 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

/* ─── KPI CONFIG ─────────────────────────────────────────────────── */
const KPI_META = {
  "Atestados":    { Icon: IconDoc,      color: "#FA4C00", desc: "Total no período" },
  "Recorrência":  { Icon: IconRepeat,   color: "#F59E0B", desc: "Atestaram 2+ vezes" },
  "Impactados":   { Icon: IconUsers,    color: "#3B82F6", desc: "Colaboradores únicos" },
  "% HC":         { Icon: IconPercent,  color: "#A855F7", desc: "Headcount afetado" },
  "Hoje":         { Icon: IconCalDay,   color: "#EF4444", desc: "Atestados hoje" },
  "Semana":       { Icon: IconCalWeek,  color: "#F59E0B", desc: "Esta semana" },
  "Mês":          { Icon: IconCalMonth, color: "#22C55E", desc: "Este mês" },
}

/* ─── KPI CARD ───────────────────────────────────────────────────── */
function KpiCard({ label, value, loading }) {
  const { Icon = IconDoc, color = BRAND, desc = "" } = KPI_META[label] || {}
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.07)",
        borderLeft: `3px solid ${color}`,
        borderRadius: 12,
        padding: "16px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
        cursor: "default",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#161616")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "#111111")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <Icon c={color} s={13} />
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", fontWeight: 500, margin: 0 }}>
          {label}
        </p>
      </div>
      {loading ? (
        <Skeleton style={{ height: 28, width: "55%" }} />
      ) : (
        <p style={{ fontSize: 26, fontWeight: 700, color: "#F0F0F0", margin: 0, lineHeight: 1, letterSpacing: "-0.02em" }}>
          {value ?? "—"}
        </p>
      )}
      <p style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", margin: 0 }}>{desc}</p>
    </div>
  )
}

/* ─── SECTION LABEL ──────────────────────────────────────────────── */
function SectionLabel({ num, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
      <span style={{ fontSize: 10, fontWeight: 800, color: BRAND, textTransform: "uppercase", letterSpacing: "0.16em" }}>
        {num}
      </span>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.16em" }}>
        {title}
      </span>
    </div>
  )
}

/* ─── CARD ───────────────────────────────────────────────────────── */
function Card({ title, subtitle, icon, children, style = {} }) {
  return (
    <div
      style={{
        background: "#111111",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 18,
        padding: "20px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minWidth: 0,
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {title && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
          {icon && (
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: `${BRAND}14`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              {icon}
            </div>
          )}
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.88)" }}>
              {title}
            </h2>
            {subtitle && (
              <p style={{ margin: "3px 0 0", fontSize: 11, color: "rgba(255,255,255,0.30)" }}>
                {subtitle}
              </p>
            )}
          </div>
        </div>
      )}
      {children}
    </div>
  )
}

/* ─── DATE INPUT ─────────────────────────────────────────────────── */
function DateInput({ label, value, onChange }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {label}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          background: "#1A1A1A",
          border: "1px solid rgba(255,255,255,0.08)",
          color: "#fff",
          fontSize: 13,
          borderRadius: 12,
          padding: "9px 14px",
          outline: "none",
          cursor: "pointer",
          colorScheme: "dark",
        }}
        onFocus={(e) => (e.target.style.borderColor = "rgba(250,76,0,0.5)")}
        onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
      />
    </div>
  )
}

/* ─── SELECT CID ─────────────────────────────────────────────────── */
function SelectCID({ value, onChange, options }) {
  const [open, setOpen] = useState(false)
  const selected = options.find((o) => o.codigo === value)

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, position: "relative" }}>
      <label
        style={{
          fontSize: 10,
          color: "rgba(255,255,255,0.35)",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        CID
      </label>
      <div
        onClick={() => setOpen(!open)}
        style={{
          background: "#1A1A1A",
          border: `1px solid ${open ? "rgba(250,76,0,0.5)" : "rgba(255,255,255,0.08)"}`,
          color: "#fff",
          fontSize: 13,
          borderRadius: 12,
          padding: "9px 14px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          minWidth: 160,
          userSelect: "none",
          transition: "border-color 0.2s",
        }}
      >
        <span style={{ color: selected ? "#fff" : "rgba(255,255,255,0.35)" }}>
          {selected ? `${selected.codigo} (${selected.total})` : "Todos os CIDs"}
        </span>
        <IconChevronDown c="rgba(255,255,255,0.35)" />
      </div>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            left: 0,
            zIndex: 9999,
            background: "#1A1A1A",
            border: "1px solid rgba(255,255,255,0.10)",
            borderRadius: 14,
            maxHeight: 240,
            overflowY: "auto",
            boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
            minWidth: "100%",
          }}
        >
          <div
            onClick={() => { onChange(""); setOpen(false) }}
            style={{
              padding: "10px 14px",
              fontSize: 13,
              cursor: "pointer",
              color: !value ? BRAND : "rgba(255,255,255,0.65)",
              fontWeight: !value ? 600 : 400,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            Todos os CIDs
          </div>
          {options.map((c) => (
            <div
              key={c.codigo}
              onClick={() => { onChange(c.codigo); setOpen(false) }}
              style={{
                padding: "10px 14px",
                fontSize: 13,
                cursor: "pointer",
                color: value === c.codigo ? BRAND : "rgba(255,255,255,0.65)",
                fontWeight: value === c.codigo ? 600 : 400,
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(250,76,0,0.08)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              {c.codigo} — {CID_DESCRICOES[c.codigo] || "CID"}{" "}
              <span style={{ color: "rgba(255,255,255,0.30)" }}>({c.total})</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ─── EMPTY STATE ────────────────────────────────────────────────── */
function Empty() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: 160,
        color: "rgba(255,255,255,0.18)",
        fontSize: 13,
      }}
    >
      Sem dados no período
    </div>
  )
}

/* ─── CHARTS ─────────────────────────────────────────────────────── */
function AreaBlock({ data }) {
  if (!data?.length) return <Empty />
  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 26, right: 16, bottom: 0, left: -8 }}>
        <defs>
          <linearGradient id="areaGAtst" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={BRAND} stopOpacity={0.28} />
            <stop offset="95%" stopColor={BRAND} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="data"
          tick={{ fill: "#4B4B4B", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#4B4B4B", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={28}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.06)", strokeWidth: 1 }} />
        <Area
          dataKey="total"
          stroke={BRAND}
          strokeWidth={2.5}
          fill="url(#areaGAtst)"
          dot={{ fill: BRAND, r: 3, strokeWidth: 0 }}
          activeDot={{ r: 5, fill: BRAND, strokeWidth: 0 }}
        >
          <LabelList
            dataKey="total"
            position="top"
            style={{ fill: "rgba(255,255,255,0.55)", fontSize: 10, fontWeight: 600 }}
          />
        </Area>
      </AreaChart>
    </ResponsiveContainer>
  )
}

function BarBlock({ data }) {
  if (!data?.length) return <Empty />
  const sorted = [...data].sort((a, b) => b.value - a.value)
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={sorted} margin={{ top: 22, right: 16, bottom: 0, left: -12 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fill: "#4B4B4B", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickMargin={8}
          tickFormatter={(v) => (v?.length > 10 ? v.slice(0, 10) + "…" : v)}
        />
        <YAxis
          allowDecimals={false}
          tick={{ fill: "#4B4B4B", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={26}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="value" fill={BRAND} radius={[6, 6, 0, 0]} maxBarSize={44}>
          <LabelList dataKey="value" position="top" style={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function BarBlockH({ data }) {
  if (!data?.length) return <Empty />
  const fmt = (n = "") => {
    const p = n.trim().split(" ")
    return p.length >= 2 ? `${p[0]} ${p[1]}` : n
  }
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const h = Math.max(280, sorted.length * 38)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        layout="vertical"
        data={sorted.map((d) => ({ ...d, name: fmt(d.name) }))}
        margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
      >
        <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#4B4B4B", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: "#888", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={96}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="value" fill={BRAND} radius={[0, 6, 6, 0]} maxBarSize={18}>
          <LabelList dataKey="value" position="right" style={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function BarBlockHCID({ data }) {
  if (!data?.length) return <Empty />
  const sorted = [...data].sort((a, b) => b.value - a.value)
  const h = Math.max(280, sorted.length * 38)
  return (
    <ResponsiveContainer width="100%" height={h}>
      <BarChart
        layout="vertical"
        data={sorted}
        margin={{ top: 0, right: 36, bottom: 0, left: 0 }}
      >
        <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
        <XAxis
          type="number"
          tick={{ fill: "#4B4B4B", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          dataKey="name"
          type="category"
          tick={{ fill: "#888", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={140}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
        <Bar dataKey="value" fill={BRAND} radius={[0, 6, 6, 0]} maxBarSize={18}>
          <LabelList dataKey="value" position="right" style={{ fill: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: 600 }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function PieBlock({ data }) {
  if (!data?.length) return <Empty />
  const total = data.reduce((a, b) => a + b.value, 0)
  return (
    <div style={{ position: "relative" }}>
      <ResponsiveContainer width="100%" height={210}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            innerRadius={58}
            outerRadius={82}
            paddingAngle={3}
            strokeWidth={0}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      {/* center label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          paddingBottom: 12,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 24, fontWeight: 800, color: "#fff", margin: 0, lineHeight: 1 }}>
            {total}
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", margin: "3px 0 0" }}>total</p>
        </div>
      </div>
      {/* legend with % */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", justifyContent: "center", marginTop: 8 }}>
        {data.map((d, i) => {
          const pct = total > 0 ? Math.round((d.value / total) * 100) : 0
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: CHART_COLORS[i % CHART_COLORS.length],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>{d.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: CHART_COLORS[i % CHART_COLORS.length] }}>
                {d.value} ({pct}%)
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ─── CID DISTRIBUTION TABLE ─────────────────────────────────────── */
function CidTable({ dist }) {
  const rows = useMemo(() => {
    const agrupado = {}
    ;(dist?.porCid || []).forEach((c) => {
      const cat = CID_DESCRICOES[c.name] || "Outros"
      agrupado[cat] = (agrupado[cat] || 0) + c.value
    })
    const relevantes = []
    let outrosTotal = 0
    Object.entries(agrupado).forEach(([name, value]) => {
      if (value <= 2) outrosTotal += value
      else relevantes.push({ name, value })
    })
    if (outrosTotal > 0) relevantes.push({ name: "Outros", value: outrosTotal })
    return relevantes.sort((a, b) => b.value - a.value)
  }, [dist])

  const total = rows.reduce((acc, r) => acc + r.value, 0)

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#0D0D0D", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["Categoria CID", "Qtd.", "% Total"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: h === "Categoria CID" ? "left" : "right",
                  padding: "12px 16px",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.28)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((c, idx) => {
            const pct = total > 0 ? ((c.value / total) * 100).toFixed(1) : 0
            return (
              <tr
                key={idx}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "11px 16px", fontWeight: 500, color: c.name === "Outros" ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.80)" }}>
                  {c.name}
                </td>
                <td style={{ padding: "11px 16px", textAlign: "right", fontWeight: 700, color: "#F0F0F0" }}>
                  {c.value}
                </td>
                <td style={{ padding: "11px 16px", textAlign: "right" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: `${BRAND}18`,
                      color: BRAND,
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    {pct}%
                  </span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ─── TOP OFENSORES TABLE ────────────────────────────────────────── */
function TopOfensoresTable({ rows, loading }) {
  if (loading) return <Skeleton style={{ height: 200 }} />
  if (!rows?.length) return <Empty />

  const TEMPO_STYLE = {
    "< 30 dias":  { bg: "#EF444418", color: "#EF4444" },
    "30–89 dias": { bg: "#F59E0B18", color: "#F59E0B" },
    default:      { bg: "#22C75918", color: "#22C759" },
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 13 }}>
        <thead>
          <tr style={{ background: "#0D0D0D", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            {["#", "Colaborador", "Empresa", "Setor", "Turno", "Tempo Casa", "Atest.", "Dias"].map((h) => (
              <th
                key={h}
                style={{
                  textAlign: h === "#" || h === "Atest." || h === "Dias" ? "center" : "left",
                  padding: "12px 14px",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.28)",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.10em",
                  whiteSpace: "nowrap",
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const ts = TEMPO_STYLE[r.tempoCasaFaixa] || TEMPO_STYLE.default
            const atst = r.totalAtestados || 0
            const atstColor = atst >= 3 ? "#EF4444" : atst >= 2 ? "#F59E0B" : BRAND
            const atstBg = atst >= 3 ? "#EF444418" : atst >= 2 ? "#F59E0B18" : `${BRAND}14`
            return (
              <tr
                key={r.opsId}
                style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "11px 14px", textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 12, fontWeight: 700 }}>
                  {r.rank}
                </td>
                <td style={{ padding: "11px 14px", fontWeight: 600, color: "rgba(255,255,255,0.85)", whiteSpace: "nowrap" }}>
                  {r.nome}
                </td>
                <td style={{ padding: "11px 14px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
                  {r.empresa || "—"}
                </td>
                <td style={{ padding: "11px 14px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
                  {r.setor || "—"}
                </td>
                <td style={{ padding: "11px 14px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>
                  {r.turno || "—"}
                </td>
                <td style={{ padding: "11px 14px", whiteSpace: "nowrap" }}>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 10px",
                      borderRadius: 99,
                      background: ts.bg,
                      color: ts.color,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {r.tempoCasaFaixa || "—"}
                  </span>
                </td>
                <td style={{ padding: "11px 14px", textAlign: "center" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: atstBg,
                      color: atstColor,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {atst}
                  </span>
                </td>
                <td style={{ padding: "11px 14px", textAlign: "center", fontWeight: 700, color: BRAND }}>
                  {r.diasAfastados ?? "—"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ─── ATESTADOS TABLE ────────────────────────────────────────────── */
function AtestadosTable({ data, loading, filtroTempoCasa, setFiltroTempoCasa, filtroTurno, setFiltroTurno, turnos }) {
  const [search, setSearch] = useState("")

  const filtered = useMemo(() => {
    function matchTempo(faixa, filtro) {
      if (!filtro) return true
      const map = {
        "0–30": ["0–30", "< 30 dias"],
        "31–89": ["31–89", "30–89 dias"],
        "90–180": ["90–180", "≥ 90 dias"],
        "181–364": ["181–364"],
        "365+": ["365+"],
      }
      return map[filtro]?.includes(faixa)
    }
    return data.filter((c) => {
      if (!matchTempo(c.tempoCasa, filtroTempoCasa)) return false
      if (filtroTurno && c.turno !== filtroTurno) return false
      if (search.trim()) {
        const q = search.toLowerCase()
        if (
          !c.nome?.toLowerCase().includes(q) &&
          !c.setor?.toLowerCase().includes(q) &&
          !c.empresa?.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  }, [data, filtroTempoCasa, filtroTurno, search])

  const cols = ["Nome", "Empresa", "Setor", "Turno", "Escala", "Tempo de Casa", "Atestados"]

  const selectStyle = {
    background: "#1A1A1A",
    border: "1px solid rgba(255,255,255,0.08)",
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    borderRadius: 10,
    padding: "8px 12px",
    outline: "none",
    cursor: "pointer",
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* filters + search */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 220px", maxWidth: 300 }}>
          <div
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.25)",
              pointerEvents: "none",
              display: "flex",
            }}
          >
            <IconSearch />
          </div>
          <input
            type="text"
            placeholder="Buscar por nome, setor, empresa…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#1A1A1A",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#fff",
              fontSize: 13,
              borderRadius: 12,
              padding: "9px 14px 9px 38px",
              outline: "none",
              boxSizing: "border-box",
            }}
            onFocus={(e) => (e.target.style.borderColor = "rgba(250,76,0,0.45)")}
            onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
          />
        </div>
        <select value={filtroTempoCasa} onChange={(e) => setFiltroTempoCasa(e.target.value)} style={selectStyle}>
          <option value="">Tempo de casa (Todos)</option>
          <option value="0–30">0–30 dias</option>
          <option value="31–89">31–89 dias</option>
          <option value="90–180">90–180 dias</option>
          <option value="181–364">181–364 dias</option>
          <option value="365+">365+ dias</option>
        </select>
        <select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)} style={selectStyle}>
          <option value="">Turno (Todos)</option>
          {turnos.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>

      {/* table */}
      <div
        style={{
          overflowX: "auto",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 700, fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#0D0D0D", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {cols.map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    fontSize: 10,
                    color: "rgba(255,255,255,0.28)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.10em",
                    whiteSpace: "nowrap",
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  {cols.map((_, j) => (
                    <td key={j} style={{ padding: "12px 16px" }}>
                      <Skeleton style={{ height: 14, width: "80%" }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={cols.length} style={{ padding: "48px 16px", textAlign: "center", color: "rgba(255,255,255,0.18)", fontSize: 13 }}>
                  Nenhum resultado encontrado
                </td>
              </tr>
            ) : (
              filtered.map((c, i) => {
                const atst = c.totalAtestados || 0
                const atstColor = atst >= 3 ? "#EF4444" : atst >= 2 ? "#F59E0B" : BRAND
                const atstBg = atst >= 3 ? "#EF444418" : atst >= 2 ? "#F59E0B18" : `${BRAND}14`
                return (
                  <tr
                    key={c.opsId || i}
                    style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.15s", cursor: "default" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.025)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "11px 16px", fontWeight: 500, color: "rgba(255,255,255,0.80)", whiteSpace: "nowrap" }}>
                      {c.nome}
                    </td>
                    <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{c.empresa}</td>
                    <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{c.setor}</td>
                    <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{c.turno}</td>
                    <td style={{ padding: "11px 16px", color: "rgba(255,255,255,0.45)", whiteSpace: "nowrap" }}>{c.escala}</td>
                    <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: 8,
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.55)",
                          fontSize: 12,
                        }}
                      >
                        {c.tempoCasa}
                      </span>
                    </td>
                    <td style={{ padding: "11px 16px", whiteSpace: "nowrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 30,
                          height: 30,
                          borderRadius: 8,
                          background: atstBg,
                          color: atstColor,
                          fontWeight: 700,
                          fontSize: 13,
                        }}
                      >
                        {atst}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>

        {!loading && filtered.length > 0 && (
          <div
            style={{
              padding: "10px 16px",
              borderTop: "1px solid rgba(255,255,255,0.04)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.22)", margin: 0 }}>
              {filtered.length} de {data.length} colaboradores
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/* ─── MAIN ───────────────────────────────────────────────────────── */
export default function DashboardAtestados() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [inicio, setInicio] = useState(isoFirstDayOfMonth())
  const [fim, setFim] = useState(isoToday())
  const [cid, setCid] = useState("")
  const [cids, setCids] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [kpis, setKpis] = useState(null)
  const [dist, setDist] = useState(null)
  const [tendencia, setTendencia] = useState([])
  const [topOfensores, setTopOfensores] = useState([])
  const [colaboradores, setColaboradores] = useState([])
  const [filtroTempoCasa, setFiltroTempoCasa] = useState("")
  const [filtroTurno, setFiltroTurno] = useState("")

  async function fetchAll() {
    try {
      setLoading(true)
      setError("")
      const params = { inicio, fim, cid: cid || undefined }
      const [resResumo, resDist, resTend, resRisco, resCids, resColab] = await Promise.all([
        api.get("/dashboard/atestados/resumo", { params }),
        api.get("/dashboard/atestados/distribuicoes", { params }),
        api.get("/dashboard/atestados/tendencia", { params }),
        api.get("/dashboard/atestados/risco", { params }),
        api.get("/dashboard/atestados/cids", { params }),
        api.get("/dashboard/atestados/colaboradores", { params }),
      ])
      setKpis(resResumo.data?.data?.kpis ?? resResumo.data?.kpis ?? null)
      setDist(resDist.data?.data ?? resDist.data ?? null)
      setCids(resCids.data?.data || [])
      setColaboradores(resColab.data?.data || [])
      setTendencia(
        Array.isArray(resTend.data?.data)
          ? resTend.data.data
          : Array.isArray(resTend.data) ? resTend.data : []
      )
      setTopOfensores(
        resRisco.data?.data?.topOfensores ?? resRisco.data?.topOfensores ?? []
      )
    } catch (err) {
      console.error("❌ DASHBOARD ATESTADOS:", err)
      setError("Erro ao carregar dashboard de atestados.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [inicio, fim, cid])

  /* memos */
  const porEmpresa   = useMemo(() => dist?.porEmpresa  || [], [dist])
  const porSetor     = useMemo(() => dist?.porSetor    || [], [dist])
  const porTurno     = useMemo(() => dist?.porTurno    || [], [dist])
  const porGenero    = useMemo(() => dist?.porGenero   || [], [dist])
  const porLider     = useMemo(() => (dist?.porLider   || []).slice(0, 10), [dist])
  const porTempoCasa = useMemo(() => dist?.porTempoCasa || [], [dist])

  const porCidChart = useMemo(() => {
    if (!dist?.porCid) return []
    return dist.porCid
      .map((item) => ({
        ...item,
        name: `${item.name} — ${CID_DESCRICOES[item.name] || "Outros"}`,
      }))
      .slice(0, 10)
  }, [dist])

  const turnos = useMemo(
    () => [...new Set(colaboradores.map((c) => c.turno).filter(Boolean))],
    [colaboradores]
  )

  /* pulse keyframes */
  const pulseStyle = `
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.45} }
    input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.5); cursor: pointer; }
    .recharts-wrapper, .recharts-surface { overflow: visible !important; }
    select option { background: #1A1A1A; }
  `

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#080808", color: "#fff" }}>
      <style>{pulseStyle}</style>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}
           className="lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main
          style={{
            flex: 1,
            padding: "32px 24px 64px",
            maxWidth: 1600,
            width: "100%",
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            gap: 40,
          }}
        >

          {/* ── PAGE HEADER ─────────────────────────────────── */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "space-between",
              alignItems: "flex-end",
              gap: 20,
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 4, height: 26, borderRadius: 4, background: BRAND }} />
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
                  Dashboard de Atestados
                </h1>
              </div>
              <p style={{ margin: "0 0 0 14px", fontSize: 13, color: "rgba(255,255,255,0.35)" }}>
                Visão completa de impacto, recorrência e diagnóstico de ausências médicas
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: 12 }}>
              <DateInput label="Início" value={inicio} onChange={setInicio} />
              <DateInput label="Fim" value={fim} onChange={setFim} />
              <SelectCID value={cid} onChange={setCid} options={cids} />
              <button
                onClick={fetchAll}
                disabled={loading}
                style={{
                  height: 42,
                  padding: "0 24px",
                  borderRadius: 12,
                  background: loading ? "#333" : BRAND,
                  color: "#fff",
                  fontWeight: 700,
                  fontSize: 13,
                  border: "none",
                  cursor: loading ? "not-allowed" : "pointer",
                  transition: "background 0.2s",
                  whiteSpace: "nowrap",
                  alignSelf: "flex-end",
                }}
                onMouseEnter={(e) => !loading && (e.target.style.background = "#e64500")}
                onMouseLeave={(e) => !loading && (e.target.style.background = BRAND)}
              >
                {loading ? "Carregando…" : "Atualizar"}
              </button>
            </div>
          </div>

          {/* error */}
          {error && (
            <div
              style={{
                borderRadius: 14,
                border: "1px solid rgba(239,68,68,0.2)",
                background: "rgba(239,68,68,0.06)",
                padding: "14px 18px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <IconAlert c="#EF4444" s={17} />
              <p style={{ margin: 0, fontSize: 13, color: "#EF4444" }}>{error}</p>
            </div>
          )}

          {/* ── 01 — PANORAMA GERAL ─────────────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionLabel num="01" title="Panorama Geral" />
            <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-3">
              <KpiCard label="Atestados"   value={kpis?.totalPeriodo}                                loading={loading} />
              <KpiCard label="Recorrência" value={`${kpis?.recorrencia ?? 0}%`}                      loading={loading} />
              <KpiCard label="Impactados"  value={kpis?.colaboradoresImpactados}                     loading={loading} />
              <KpiCard label="% HC"        value={`${kpis?.percentualHC ?? 0}%`}                     loading={loading} />
              <KpiCard label="Hoje"        value={kpis?.hoje}                                        loading={loading} />
              <KpiCard label="Semana"      value={kpis?.semana}                                      loading={loading} />
              <KpiCard label="Mês"         value={kpis?.mes}                                         loading={loading} />
            </div>
          </section>

          {/* ── 02 — EVOLUÇÃO ───────────────────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionLabel num="02" title="Evolução no Período" />
            <Card
              title="Atestados por dia"
              subtitle="Como o volume de afastamentos variou ao longo do tempo"
              icon={<IconTrend c={BRAND} s={15} />}
            >
              {loading ? <Skeleton style={{ height: 280 }} /> : <AreaBlock data={tendencia} />}
            </Card>
          </section>

          {/* ── 03 — DISTRIBUIÇÃO ───────────────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionLabel num="03" title="Onde Estão os Atestados?" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minWidth: 0 }}>
              <Card
                title="Por Empresa"
                subtitle="Volume por unidade"
                icon={<IconGrid c={BRAND} s={15} />}
              >
                {loading ? <Skeleton style={{ height: 260 }} /> : <BarBlock data={porEmpresa} />}
              </Card>
              <Card
                title="Por Setor"
                subtitle="Áreas com maior concentração de afastamentos"
                icon={<IconGrid c={BRAND} s={15} />}
              >
                {loading ? <Skeleton style={{ height: 260 }} /> : <BarBlock data={porSetor} />}
              </Card>
            </div>
          </section>

          {/* ── 04 — LIDERANÇAS E OFENSORES ─────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionLabel num="04" title="Quem Lidera a Ausência?" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minWidth: 0 }}>
              <Card
                title="Top Líderes"
                subtitle="Equipes com maior índice de atestados"
                icon={<IconAlert c="#F59E0B" s={15} />}
              >
                {loading ? <Skeleton style={{ height: 320 }} /> : <BarBlockH data={porLider} />}
              </Card>
              <Card
                title="Top 10 Ofensores"
                subtitle="Colaboradores com mais atestados no período"
                icon={<IconAlert c="#EF4444" s={15} />}
              >
                {loading ? (
                  <Skeleton style={{ height: 320 }} />
                ) : (
                  <BarBlockH
                    data={topOfensores.map((r) => ({ name: r.nome, value: r.totalAtestados }))}
                  />
                )}
              </Card>
            </div>
          </section>

          {/* ── 05 — PERFIL ─────────────────────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionLabel num="05" title="Perfil dos Afastados" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ minWidth: 0 }}>
              <Card title="Por Turno" subtitle="Distribuição por horário de trabalho">
                {loading ? <Skeleton style={{ height: 210 }} /> : <PieBlock data={porTurno} />}
              </Card>
              <Card title="Por Gênero" subtitle="Perfil de gênero dos afastados">
                {loading ? <Skeleton style={{ height: 210 }} /> : <PieBlock data={porGenero} />}
              </Card>
              <Card title="Tempo de Casa" subtitle="Maturidade vs. frequência de atestados">
                {loading ? <Skeleton style={{ height: 260 }} /> : <BarBlock data={porTempoCasa} />}
              </Card>
            </div>
          </section>

          {/* ── 06 — DIAGNÓSTICO CID ────────────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionLabel num="06" title="Diagnóstico por CID" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ minWidth: 0 }}>
              <Card
                title="Distribuição por Categoria"
                subtitle="Principais grupos de diagnóstico"
                icon={<IconMedical c={BRAND} s={15} />}
              >
                {loading ? <Skeleton style={{ height: 200 }} /> : <CidTable dist={dist} />}
              </Card>
              <Card
                title="Top 10 CIDs"
                subtitle="Códigos com maior volume de atestados"
                icon={<IconMedical c="#EF4444" s={15} />}
              >
                {loading ? <Skeleton style={{ height: 300 }} /> : <BarBlockHCID data={porCidChart} />}
              </Card>
            </div>
          </section>

          {/* ── 07 — RANKING OFENSORES ──────────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionLabel num="07" title="Ranking de Afastamentos" />
            <Card
              title="Top 10 Ofensores — Detalhe"
              subtitle="Colaboradores com maior número de atestados e dias afastados"
              icon={<IconAlert c="#EF4444" s={15} />}
            >
              <TopOfensoresTable rows={topOfensores} loading={loading} />
            </Card>
          </section>

          {/* ── 08 — TABELA COMPLETA ────────────────────────── */}
          <section style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <SectionLabel num="08" title="Lista de Colaboradores" />
            <Card
              title="Colaboradores com Atestados"
              subtitle="Todos os colaboradores com afastamento médico registrado no período"
              icon={<IconList c={BRAND} s={15} />}
            >
              <AtestadosTable
                data={colaboradores}
                loading={loading}
                filtroTempoCasa={filtroTempoCasa}
                setFiltroTempoCasa={setFiltroTempoCasa}
                filtroTurno={filtroTurno}
                setFiltroTurno={setFiltroTurno}
                turnos={turnos}
              />
            </Card>
          </section>

        </main>
      </div>
    </div>
  )
}
