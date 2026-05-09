import { useState, useEffect } from "react";
import { Calendar, TrendingUp, TrendingDown, Minus, Clock, BarChart2 } from "lucide-react";
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LabelList, Cell, ReferenceLine, ReferenceArea,
} from "recharts";
import api from "../../services/api";
import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";
import MainLayout from "../../components/MainLayout";
import { useEstacao } from "../../context/EstacaoContext";
import toast from "react-hot-toast";

/* ─── helpers ─────────────────────────────────────────────── */

function getDataHoje() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "America/Sao_Paulo" });
}

function getTurnoAtual() {
  const h = parseInt(
    new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hour12: false })
  );
  if (h >= 6 && h < 14) return "T1";
  if (h >= 14 && h < 22) return "T2";
  return "T3";
}

function fmt(n) {
  if (n == null) return "—";
  return Math.round(n).toLocaleString("pt-BR");
}

/* ─── sub-componentes ─────────────────────────────────────── */

function DeltaBadge({ delta }) {
  if (delta == null) return <span className="text-muted text-xs">—</span>;
  if (delta > 0)
    return (
      <span className="flex items-center gap-1 text-green-400 font-semibold text-sm">
        <TrendingUp className="w-3.5 h-3.5" />+{fmt(delta)}
      </span>
    );
  if (delta < 0)
    return (
      <span className="flex items-center gap-1 text-red-400 font-semibold text-sm">
        <TrendingDown className="w-3.5 h-3.5" />{fmt(delta)}
      </span>
    );
  return (
    <span className="flex items-center gap-1 text-muted text-sm">
      <Minus className="w-3.5 h-3.5" />0
    </span>
  );
}

function StatusPill({ status }) {
  if (status === "fechada")
    return <span className="px-2 py-0.5 rounded-full bg-surface-2 text-muted text-xs">Fechada</span>;
  if (status === "em_andamento")
    return (
      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-xs font-medium flex items-center gap-1">
        <Clock className="w-3 h-3" />Em andamento
      </span>
    );
  return (
    <span className="px-2 py-0.5 rounded-full bg-surface text-muted/50 text-xs border border-default/30">
      Futura
    </span>
  );
}

function VarMeta({ metaOriginal, metaAjustada }) {
  const diff = metaAjustada - metaOriginal;
  if (diff === 0) return <span className="text-muted text-xs">—</span>;
  return (
    <span className={`text-xs font-medium ${diff > 0 ? "text-red-400" : "text-green-400"}`}>
      {diff > 0 ? "+" : ""}{fmt(diff)}
    </span>
  );
}

function rowCls(status, delta) {
  if (status === "em_andamento") return "bg-blue-500/5 border-l-2 border-l-blue-500";
  if (status === "fechada") {
    if (delta > 0) return "border-l-2 border-l-green-500";
    if (delta < 0) return "border-l-2 border-l-red-500";
    return "border-l-2 border-l-default";
  }
  return "";
}

function KpiCard({ label, value, sub, cor }) {
  const c = cor === "green" ? "text-green-400" : cor === "red" ? "text-red-400" : cor === "blue" ? "text-blue-400" : "text-page";
  return (
    <div className="bg-surface border border-default rounded-lg p-4 flex flex-col gap-1">
      <span className="text-xs text-muted font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${c}`}>{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}

/* ─── GraficoTurno ────────────────────────────────────────── */

function GraficoTurno({ horas }) {
  if (!horas || horas.length === 0) return null;

  const dados = horas.map((h) => ({
    hora: `${h.hora}h`,
    metaOriginal: h.metaOriginal,
    metaAjustada: h.metaAjustada,
    realizado: h.status !== "futura" ? h.realizado : null,
    percentual: h.percentual,
    status: h.status,
  }));

  return (
    <div className="p-4 sm:p-6">
      <ResponsiveContainer width="100%" height={340}>
        <ComposedChart data={dados} margin={{ top: 30, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="hora"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={60}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              const pct = d.percentual;
              const pc = pct == null ? "text-muted" : pct >= 100 ? "text-green-400" : pct >= 85 ? "text-yellow-400" : "text-red-400";
              return (
                <div className="bg-surface border border-default p-3 rounded-lg shadow-lg text-sm space-y-1">
                  <p className="font-bold text-page">{d.hora}</p>
                  <p className="text-muted">Meta Original: <span className="text-page font-medium">{d.metaOriginal?.toLocaleString("pt-BR") ?? "—"}</span></p>
                  <p className="text-amber-400">Meta Ajustada: <span className="font-medium">{d.metaAjustada?.toLocaleString("pt-BR") ?? "—"}</span></p>
                  {d.realizado != null && (
                    <p className={pc}>Realizado: <span className="font-medium">{d.realizado.toLocaleString("pt-BR")}</span></p>
                  )}
                  {pct != null && (
                    <p className={pc}>Performance: <span className="font-bold">{pct.toFixed(1)}%</span></p>
                  )}
                  {d.status === "em_andamento" && (
                    <p className="text-blue-400 text-xs">⏱ Em andamento (parcial)</p>
                  )}
                </div>
              );
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "var(--color-muted)", paddingTop: 8 }}
            formatter={(v) => v === "realizado" ? "Realizado" : v === "metaAjustada" ? "Meta Ajustada" : "Meta Original"}
          />

          <Bar dataKey="realizado" name="realizado" barSize={40} radius={[3, 3, 0, 0]}>
            <LabelList
              dataKey="realizado"
              position="top"
              style={{ fill: "var(--color-text)", fontSize: 11, fontWeight: "bold" }}
              formatter={(v) => (v != null && v > 0 ? v.toLocaleString("pt-BR") : "")}
            />
            {horas.map((h, i) => {
              const pct = h.percentual;
              const color =
                h.status === "futura" || h.realizado === 0 ? "transparent"
                : h.status === "em_andamento" ? "#3b82f6"
                : pct >= 100 ? "#22c55e"
                : pct >= 85  ? "#eab308"
                : "#dc2626";
              return <Cell key={i} fill={color} />;
            })}
          </Bar>

          <Line
            type="monotone"
            dataKey="metaAjustada"
            name="metaAjustada"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={{ fill: "#f59e0b", r: 4, strokeWidth: 0 }}
          >
            <LabelList
              dataKey="metaAjustada"
              position="top"
              style={{ fill: "#f59e0b", fontSize: 10, fontWeight: "bold" }}
              formatter={(v) => v?.toLocaleString("pt-BR") ?? ""}
            />
          </Line>

          <Line
            type="monotone"
            dataKey="metaOriginal"
            name="metaOriginal"
            stroke="#6b7280"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Faixa de performance */}
      {horas.some((h) => h.status !== "futura") && (
        <div className="grid gap-1 mt-3" style={{ gridTemplateColumns: `repeat(${horas.length}, 1fr)` }}>
          {horas.map((h, i) => {
            if (h.status === "futura")
              return <div key={i} className="text-center text-xs py-1.5 rounded bg-surface-2 text-muted/40">—</div>;
            if (h.status === "em_andamento")
              return <div key={i} className="text-center text-xs py-1.5 rounded bg-blue-500/20 text-blue-400 font-bold">⏱</div>;
            const bg = h.percentual >= 100 ? "bg-green-600" : h.percentual >= 85 ? "bg-yellow-600" : "bg-red-600";
            return <div key={i} className={`text-center text-xs py-1.5 rounded ${bg} text-white font-bold`}>{h.percentual?.toFixed(1)}%</div>;
          })}
        </div>
      )}
    </div>
  );
}

/* ─── GraficoUnificado ────────────────────────────────────── */

function GraficoUnificado({ horas }) {
  if (!horas || horas.length === 0) return null;

  const fmtK  = (v) => v == null ? "" : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v));
  const fmtBR = (v) => v?.toLocaleString("pt-BR") ?? "—";

  const dados = horas.map((h, idx) => ({
    idx,
    horaLabel: h.hora,
    turno: h.turno,
    // Meta Ajustada: null para horas futuras — linha para exatamente onde o turno está
    metaAjustada: h.status === "futura" ? null : Math.round(h.metaAjustada || 0),
    metaOriginal: Math.round(h.metaOriginal || 0),
    realizado: h.status !== "futura" ? (h.realizado || 0) : null,
    percentual: h.percentual,
    status: h.status,
  }));

  // Escala baseada apenas em valores reais + meta original — nunca na meta ajustada futura
  const yMax = Math.ceil(
    Math.max(
      ...dados.map((d) => d.realizado || 0),
      ...dados.map((d) => d.metaOriginal || 0),
      ...dados.filter((d) => d.metaAjustada != null).map((d) => d.metaAjustada || 0),
      1000
    ) * 1.18
  );

  const T2_IDX = dados.find((d) => d.turno === "T2")?.idx;
  const T3_IDX = dados.find((d) => d.turno === "T3")?.idx;
  const lastIdx = dados.length - 1;

  const getBarColor = (h) => {
    if (!h || h.status === "futura" || !h.realizado) return "transparent";
    if (h.status === "em_andamento") return "#3b82f6";
    if (h.percentual >= 100) return "#22c55e";
    if (h.percentual >= 85)  return "#eab308";
    return "#ef4444";
  };

  const getPctColor = (pct) =>
    pct == null ? "text-muted" : pct >= 100 ? "text-green-400" : pct >= 85 ? "text-yellow-400" : "text-red-400";

  const getPctBg = (pct) =>
    pct == null ? "bg-surface-2" : pct >= 100 ? "bg-green-600" : pct >= 85 ? "bg-yellow-600" : "bg-red-600";

  return (
    <div className="px-3 pb-5 pt-4">
      {/* Legenda compacta */}
      <div className="flex justify-center gap-2 mb-4 flex-wrap">
        {[
          { swatch: <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke="#f59e0b" strokeWidth="2.5"/></svg>, label: "Meta Ajustada", cls: "text-amber-400 border-amber-500/30" },
          { swatch: <svg width="18" height="8"><line x1="0" y1="4" x2="18" y2="4" stroke="#6b7280" strokeWidth="1.5" strokeDasharray="4 3"/></svg>, label: "Meta Original", cls: "text-gray-400 border-gray-500/30" },
          { swatch: <span className="w-2.5 h-2.5 rounded-sm bg-green-500 inline-block" />, label: "≥ 100%",       cls: "text-green-400 border-green-500/30" },
          { swatch: <span className="w-2.5 h-2.5 rounded-sm bg-yellow-500 inline-block" />, label: "85–99%",     cls: "text-yellow-400 border-yellow-500/30" },
          { swatch: <span className="w-2.5 h-2.5 rounded-sm bg-red-500 inline-block" />, label: "< 85%",         cls: "text-red-400 border-red-500/30" },
          { swatch: <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />, label: "Em andamento", cls: "text-blue-400 border-blue-500/30" },
        ].map(({ swatch, label, cls }) => (
          <div key={label} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs bg-surface-2/50 ${cls}`}>
            {swatch}<span>{label}</span>
          </div>
        ))}
      </div>

      <ResponsiveContainer width="100%" height={370}>
        <ComposedChart data={dados} margin={{ top: 22, right: 12, left: 0, bottom: 4 }}>

          <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} opacity={0.6} />

          <XAxis
            dataKey="idx"
            type="number"
            domain={[0, lastIdx]}
            ticks={dados.map((d) => d.idx)}
            tickFormatter={(idx) => dados[idx] ? `${dados[idx].horaLabel}h` : ""}
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            interval={0}
          />

          <YAxis
            domain={[0, yMax]}
            tick={{ fill: "var(--color-muted)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={46}
            tickFormatter={fmtK}
          />

          <Tooltip
            cursor={{ fill: "var(--color-surface-2)", opacity: 0.35 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload;
              const pct = d.percentual;
              return (
                <div className="bg-surface border border-default rounded-xl shadow-xl text-sm overflow-hidden min-w-[196px]">
                  <div className="px-3 py-2 bg-surface-2 border-b border-default flex items-center justify-between gap-3">
                    <span className="font-bold text-page">{d.horaLabel}h</span>
                    <span className="px-2 py-0.5 rounded-full bg-surface border border-default text-xs text-muted font-semibold">{d.turno}</span>
                  </div>
                  <div className="px-3 py-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Meta Original</span>
                      <span className="text-page font-semibold">{fmtBR(d.metaOriginal)}</span>
                    </div>
                    {d.metaAjustada != null && d.metaAjustada !== d.metaOriginal && (
                      <div className="flex justify-between items-center">
                        <span className="text-amber-400">Meta Ajustada</span>
                        <span className="text-amber-400 font-semibold">{fmtBR(d.metaAjustada)}</span>
                      </div>
                    )}
                    {d.realizado != null && (
                      <div className="flex justify-between items-center">
                        <span className={getPctColor(pct)}>Realizado</span>
                        <span className={`font-bold text-sm ${getPctColor(pct)}`}>{fmtBR(d.realizado)}</span>
                      </div>
                    )}
                    {pct != null && (
                      <div className="pt-1.5 border-t border-default">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-muted">Performance</span>
                          <span className={`font-bold ${getPctColor(pct)}`}>{pct.toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-surface-2 overflow-hidden">
                          <div className={`h-full rounded-full ${getPctBg(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                      </div>
                    )}
                    {d.status === "em_andamento" && (
                      <p className="text-blue-400 flex items-center gap-1 pt-0.5">
                        <Clock className="w-3 h-3" /> Em andamento
                      </p>
                    )}
                    {d.status === "futura" && <p className="text-muted/60">Hora futura</p>}
                  </div>
                </div>
              );
            }}
          />

          {/* Zonas por turno */}
          <ReferenceArea x1={-0.5} x2={T2_IDX != null ? T2_IDX - 0.5 : lastIdx + 0.5} fill="#6366f1" fillOpacity={0.06} />
          {T2_IDX != null && <ReferenceArea x1={T2_IDX - 0.5} x2={T3_IDX != null ? T3_IDX - 0.5 : lastIdx + 0.5} fill="#8b5cf6" fillOpacity={0.06} />}
          {T3_IDX != null && <ReferenceArea x1={T3_IDX - 0.5} x2={lastIdx + 0.5} fill="#d97706" fillOpacity={0.06} />}

          {/* Rótulos e divisores de turno */}
          <ReferenceLine x={0} stroke="transparent" label={{ value: "T1", position: "insideTopRight", fill: "#6366f1", fontSize: 11, fontWeight: "800" }} />
          {T2_IDX != null && (
            <ReferenceLine x={T2_IDX - 0.5} stroke="#374151" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: "T2", position: "insideTopRight", fill: "#8b5cf6", fontSize: 11, fontWeight: "800" }} />
          )}
          {T3_IDX != null && (
            <ReferenceLine x={T3_IDX - 0.5} stroke="#374151" strokeDasharray="3 3" strokeWidth={1}
              label={{ value: "T3", position: "insideTopRight", fill: "#d97706", fontSize: 11, fontWeight: "800" }} />
          )}

          {/* Meta Original — linha cinza tracejada sutil */}
          <Line type="monotone" dataKey="metaOriginal"
            stroke="#6b7280" strokeWidth={1.5} strokeDasharray="5 4"
            dot={false} activeDot={{ r: 3, fill: "#6b7280", strokeWidth: 0 }}
          />

          {/* Meta Ajustada — âmbar, corta em null nas horas futuras */}
          <Line type="monotone" dataKey="metaAjustada"
            stroke="#f59e0b" strokeWidth={2.5}
            dot={false} connectNulls={false}
            activeDot={{ r: 4, fill: "#f59e0b", strokeWidth: 0 }}
          />

          {/* Barras com label do valor no topo */}
          <Bar dataKey="realizado" barSize={18} radius={[3, 3, 0, 0]}>
            {horas.map((h, i) => <Cell key={i} fill={getBarColor(h)} />)}
            <LabelList
              dataKey="realizado"
              position="top"
              formatter={(v) => v && v > 0 ? fmtK(v) : ""}
              style={{ fill: "var(--color-text)", fontSize: 9, fontWeight: "700" }}
            />
          </Bar>

        </ComposedChart>
      </ResponsiveContainer>

      {/* Faixa de performance por hora */}
      <div className="grid gap-px mt-1.5" style={{ gridTemplateColumns: `repeat(${horas.length}, 1fr)` }}>
        {horas.map((h, i) => {
          if (h.status === "futura")
            return <div key={i} className="text-center text-xs py-1 rounded-sm bg-surface-2/40 text-muted/30">—</div>;
          if (h.status === "em_andamento")
            return <div key={i} className="text-center text-xs py-1 rounded-sm bg-blue-500/20 text-blue-400 font-bold">~</div>;
          return (
            <div key={i} className={`text-center text-xs py-1 rounded-sm font-semibold ${getPctBg(h.percentual)} text-white`}>
              {h.percentual != null ? `${Math.round(h.percentual)}%` : "—"}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── TabelaTurno ─────────────────────────────────────────── */

function TabelaTurno({ horas, data }) {
  if (!horas || horas.length === 0)
    return <p className="text-center py-8 text-muted text-sm">Sem dados disponíveis</p>;

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-surface-2 text-muted">
              <th className="px-4 py-3 text-left font-medium">Hora</th>
              <th className="px-4 py-3 text-right font-medium">Meta Original</th>
              <th className="px-4 py-3 text-right font-medium">Meta Ajustada</th>
              <th className="px-4 py-3 text-right font-medium">Var. Meta</th>
              <th className="px-4 py-3 text-right font-medium">Realizado</th>
              <th className="px-4 py-3 text-right font-medium">Delta</th>
              <th className="px-4 py-3 text-right font-medium">% Hora</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {horas.map((h) => (
              <tr key={h.hora} className={`border-t border-default hover:bg-surface-2/50 transition-colors ${rowCls(h.status, h.delta)}`}>
                <td className="px-4 py-3 font-mono font-semibold text-page">{h.hora}h</td>
                <td className="px-4 py-3 text-right text-muted">{fmt(h.metaOriginal)}</td>
                <td className={`px-4 py-3 text-right font-semibold ${h.status !== "futura" && h.metaAjustada !== h.metaOriginal ? "text-page" : "text-muted"}`}>
                  {fmt(h.metaAjustada)}
                </td>
                <td className="px-4 py-3 text-right"><VarMeta metaOriginal={h.metaOriginal} metaAjustada={h.metaAjustada} /></td>
                <td className="px-4 py-3 text-right font-semibold text-page">
                  {h.status === "futura" ? <span className="text-muted">—</span> : fmt(h.realizado)}
                </td>
                <td className="px-4 py-3 text-right">
                  {h.status === "fechada" ? <DeltaBadge delta={h.delta} /> : <span className="text-muted text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  {h.percentual != null ? (
                    <span className={`font-semibold ${h.percentual >= 100 ? "text-green-400" : h.percentual >= 85 ? "text-yellow-400" : "text-red-400"}`}>
                      {h.percentual.toFixed(1)}%
                    </span>
                  ) : <span className="text-muted text-xs">—</span>}
                </td>
                <td className="px-4 py-3 flex justify-center"><StatusPill status={h.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-2 p-3">
        {horas.map((h) => (
          <div key={h.hora} className={`bg-surface-2 rounded-lg p-3 border border-default ${rowCls(h.status, h.delta)}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="font-mono font-bold text-page text-lg">{h.hora}h</span>
              <StatusPill status={h.status} />
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><span className="text-muted block">Meta Original</span><span className="text-page font-medium">{fmt(h.metaOriginal)}</span></div>
              <div><span className="text-muted block">Meta Ajustada</span><span className="text-page font-medium">{fmt(h.metaAjustada)}</span></div>
              <div><span className="text-muted block">Realizado</span><span className="text-page font-medium">{h.status === "futura" ? "—" : fmt(h.realizado)}</span></div>
              <div><span className="text-muted block">Delta</span>{h.status === "fechada" ? <DeltaBadge delta={h.delta} /> : <span className="text-muted">—</span>}</div>
              {h.percentual != null && (
                <div className="col-span-2">
                  <span className="text-muted block">% da hora</span>
                  <span className={`font-semibold ${h.percentual >= 100 ? "text-green-400" : h.percentual >= 85 ? "text-yellow-400" : "text-red-400"}`}>
                    {h.percentual.toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── SecaoTurno (gráfico + tabela por turno) ─────────────── */

function SecaoTurno({ dadosTurno, mostrarGrafico = true }) {
  const { turno, horas, kpis, dataReferencia, ultimaAtualizacao } = dadosTurno;
  const pct = kpis?.performancePct ?? 0;

  return (
    <div className="space-y-0 rounded-lg overflow-hidden border border-default">
      {/* cabeçalho da seção */}
      <div className="bg-surface-2 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-[#E8491D] text-white text-sm font-bold">{turno}</span>
          <span className="text-sm text-muted">
            {dataReferencia ? new Date(dataReferencia + "T00:00:00").toLocaleDateString("pt-BR") : "—"}
          </span>
          {kpis?.turnoFinalizado && (
            <span className="px-2 py-0.5 rounded-full bg-surface text-muted text-xs border border-default">Finalizado</span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-muted">Meta: <span className="text-page font-semibold">{fmt(kpis?.metaDia)}</span></span>
          <span className="text-muted">Realizado: <span className={`font-semibold ${pct >= 100 ? "text-green-400" : pct >= 85 ? "text-yellow-400" : "text-red-400"}`}>{fmt(kpis?.realizadoTotal)}</span></span>
          <span className={`font-bold ${pct >= 100 ? "text-green-400" : pct >= 85 ? "text-yellow-400" : "text-red-400"}`}>{pct.toFixed(1)}%</span>
        </div>
      </div>

      {/* Gráfico individual — só quando não está no modo Todos */}
      {mostrarGrafico && (
        <div className="bg-surface border-t border-default">
          <div className="px-5 py-2 border-b border-default bg-surface-2/40 text-xs text-muted text-center">
            Barras = Realizado · Linha sólida = Meta Ajustada · Linha tracejada = Meta Original
          </div>
          <GraficoTurno horas={horas} />
        </div>
      )}

      {/* Tabela */}
      <div className="bg-surface border-t border-default">
        <TabelaTurno horas={horas} />
      </div>
    </div>
  );
}

/* ─── Página principal ────────────────────────────────────── */

const TURNOS = ["T1", "T2", "T3", "Todos"];

export default function ProcessamentoGeral() {
  const { estacaoId } = useEstacao();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(getDataHoje());
  const [turno, setTurno] = useState("Todos");
  const [loading, setLoading] = useState(true);
  const [dadosList, setDadosList] = useState([]);   // seções por turno (tabelas)
  const [unifiedHoras, setUnifiedHoras] = useState(null); // 27h cross-shift (gráfico Todos)
  const [kpisGerais, setKpisGerais] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    carregarDados();
    const intervalo = setInterval(carregarDados, 60000);
    return () => clearInterval(intervalo);
  }, [data, turno, estacaoId]);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);

      if (turno === "Todos") {
        // Um único endpoint — redistribuição cruzada entre turnos
        const res = await api.get("/dashboard/processamento-geral/completo", { params: { data } });
        if (res.data.success) {
          const d = res.data.data;
          setUnifiedHoras(d.horas);
          setKpisGerais(d.kpis);
          setDadosList(["T1", "T2", "T3"].map((t) => d.porTurno[t]).filter(Boolean));
        }
      } else {
        // Turno individual — redistribuição intra-turno
        setUnifiedHoras(null);
        setKpisGerais(null);
        const res = await api.get("/dashboard/processamento-geral", { params: { data, turno } });
        if (res.data.success) setDadosList([res.data.data]);
      }
    } catch (error) {
      const code = error.response?.data?.code;
      if (code === "SHEETS_NOT_CONFIGURED") {
        setErro("SHEETS_NOT_CONFIGURED");
      } else {
        const msg = error.response?.data?.message || "Erro ao carregar dados";
        setErro(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  /* ── KPIs: usa dados do endpoint /completo quando Todos, senão agrega ── */
  const kpisAgregados = kpisGerais ?? dadosList.reduce(
    (acc, d) => ({
      metaDia:              acc.metaDia              + (d.kpis?.metaDia              ?? 0),
      realizadoTotal:       acc.realizadoTotal       + (d.kpis?.realizadoTotal       ?? 0),
      realizadoParcial:     acc.realizadoParcial     + (d.kpis?.realizadoParcial     ?? 0),
      metaRestanteAjustada: acc.metaRestanteAjustada + (d.kpis?.metaRestanteAjustada ?? 0),
      performancePct: 0,
    }),
    { metaDia: 0, realizadoTotal: 0, realizadoParcial: 0, metaRestanteAjustada: 0, performancePct: 0 }
  );
  if (!kpisGerais) {
    kpisAgregados.performancePct =
      kpisAgregados.metaDia > 0
        ? Number(((kpisAgregados.realizadoTotal / kpisAgregados.metaDia) * 100).toFixed(2))
        : 0;
  }

  const pct = kpisAgregados.performancePct;
  const statusCor = pct >= 100 ? "green" : pct >= 85 ? "blue" : "red";

  /* ── estados de loading / erro ── */
  if (loading && dadosList.length === 0) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-page text-muted">
        <div className="w-16 h-16 border-4 border-default border-t-[#E8491D] rounded-full animate-spin" />
        <p className="mt-4 text-lg">Carregando dados...</p>
      </div>
    );
  }

  if (erro === "SHEETS_NOT_CONFIGURED") {
    return (
      <div className="flex min-h-screen bg-page text-page">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <MainLayout>
          <Header onMenuClick={() => setSidebarOpen(true)} />
          <div className="flex flex-col items-center justify-center h-[80vh] gap-6 text-center px-4">
            <div className="w-20 h-20 rounded-full bg-surface border border-default flex items-center justify-center">
              <span className="text-4xl">🔧</span>
            </div>
            <h2 className="text-xl font-semibold text-white">Funcionalidade em configuração</h2>
            <p className="text-muted text-sm max-w-sm">A planilha de produtividade desta estação ainda está sendo configurada.</p>
            <div className="px-4 py-1.5 rounded-full bg-[#FA4C00]/10 border border-[#FA4C00]/30 text-[#FA4C00] text-xs font-medium">Em breve</div>
          </div>
        </MainLayout>
      </div>
    );
  }

  if (erro && dadosList.length === 0) {
    return (
      <div className="h-screen flex items-center justify-center bg-page">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-2">Erro</div>
          <div className="text-muted">{erro}</div>
          <button onClick={carregarDados} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-page text-page overflow-x-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <MainLayout>
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="p-6 xl:p-10 2xl:px-20 space-y-6 max-w-[1600px] mx-auto">

          {/* ── Header: título + filtros ── */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">Processamento Geral</h1>
              <p className="text-muted text-sm mt-1">Meta dinâmica ajustada hora a hora conforme o realizado</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Botões de turno */}
              <div className="flex gap-1.5">
                {TURNOS.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTurno(t)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      turno === t
                        ? "bg-[#E8491D] border-[#E8491D] text-white"
                        : "bg-surface border-default text-muted hover:bg-surface-2"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Data */}
              <div className="relative flex items-center">
                <input
                  id="data-picker"
                  type="date"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="px-3 py-2 pr-10 bg-surface border border-default rounded-lg text-page text-sm"
                />
                <button
                  type="button"
                  onClick={() => document.getElementById("data-picker").showPicker()}
                  className="absolute right-2 text-muted hover:text-page transition-colors"
                  tabIndex={-1}
                >
                  <Calendar className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── KPI Cards agregados ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KpiCard label="Meta Total" value={fmt(kpisAgregados.metaDia)} sub={turno === "Todos" ? "Soma T1 + T2 + T3" : "Meta planejada"} />
            <KpiCard
              label="Realizado"
              value={fmt(kpisAgregados.realizadoTotal)}
              sub={kpisAgregados.realizadoParcial > 0 ? `+${fmt(kpisAgregados.realizadoParcial)} em andamento` : "Horas fechadas"}
              cor={kpisAgregados.realizadoTotal >= kpisAgregados.metaDia ? "green" : "red"}
            />
            <KpiCard
              label="Meta Restante Ajustada"
              value={fmt(kpisAgregados.metaRestanteAjustada)}
              sub="Redistribuída pelas horas restantes"
            />
            <KpiCard
              label="Performance"
              value={`${pct.toFixed(1)}%`}
              sub="Realizado ÷ Meta total"
              cor={statusCor}
            />
          </div>

          {/* ── Gauge de performance ── */}
          <div className="bg-surface border border-default rounded-lg p-6 flex flex-col sm:flex-row items-center gap-8">
            <div className="relative w-36 h-36 shrink-0">
              <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--color-border)" strokeWidth="12" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={pct >= 100 ? "#22c55e" : pct >= 85 ? "#3b82f6" : "#ef4444"}
                  strokeWidth="12"
                  strokeDasharray={`${Math.min(pct, 100) * 2.51} ${251.2 - Math.min(pct, 100) * 2.51}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-page">{pct.toFixed(1)}%</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 flex-1">
              {[
                { label: "Meta Total", value: fmt(kpisAgregados.metaDia), cor: "text-blue-400" },
                { label: "Realizado (fechadas)", value: fmt(kpisAgregados.realizadoTotal), cor: pct >= 100 ? "text-green-400" : "text-red-400" },
                { label: "Em andamento (parcial)", value: fmt(kpisAgregados.realizadoParcial), cor: "text-yellow-400" },
                { label: "Meta restante ajustada", value: fmt(kpisAgregados.metaRestanteAjustada), cor: "text-page" },
              ].map(({ label, value, cor }, i, arr) => (
                <div key={label} className={`flex justify-between items-center ${i < arr.length - 1 ? "border-b border-default pb-2" : ""}`}>
                  <span className="text-sm text-muted">{label}</span>
                  <span className={`text-lg font-bold ${cor}`}>{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* ── Gráfico unificado (só no modo Todos) ── */}
          {turno === "Todos" && unifiedHoras && (
            <div className="bg-surface border border-default rounded-lg overflow-hidden">
              <div className="px-6 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ background: "linear-gradient(135deg, #E8491D 0%, #c73d17 100%)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                    <BarChart2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">Visão Gráfica Unificada</h2>
                    <p className="text-xs text-white/60 mt-0.5">
                      Redistribuição cruzada · {new Date(data + "T00:00:00").toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {dadosList.map((d) => {
                    const p = d.kpis?.performancePct ?? 0;
                    const pillCls = p >= 100
                      ? "bg-green-500/25 border-green-300/40 text-green-200"
                      : p >= 85
                      ? "bg-yellow-500/25 border-yellow-300/40 text-yellow-200"
                      : "bg-red-500/25 border-red-300/40 text-red-200";
                    return (
                      <div key={d.turno} className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold backdrop-blur-sm ${pillCls}`}>
                        <span>{d.turno}</span>
                        <span className="opacity-60">·</span>
                        <span>{p.toFixed(1)}%</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <GraficoUnificado horas={unifiedHoras} />
            </div>
          )}

          {/* ── Seções por turno ── */}
          {dadosList.length > 0 ? (
            <div className="space-y-6">
              {dadosList.map((d) => (
                <SecaoTurno
                  key={d.turno}
                  dadosTurno={d}
                  mostrarGrafico={turno !== "Todos"}
                />
              ))}
            </div>
          ) : (
            <div className="bg-surface border border-default rounded-lg p-12 text-center text-muted">
              Nenhum dado disponível para os filtros selecionados
            </div>
          )}

          {/* ── Legenda ── */}
          <div className="bg-surface border border-default rounded-lg p-4">
            <h3 className="text-sm font-semibold text-muted mb-3 uppercase tracking-wide">Legenda</h3>
            <div className="flex flex-wrap gap-4 text-xs text-muted">
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span>Delta positivo → meta futura diminui</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span>Delta negativo → meta futura aumenta</span></div>
              <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /><span>Hora em andamento (parcial)</span></div>
              <div className="flex items-center gap-2"><span className="text-green-400 font-medium">Verde Var. Meta</span><span>= meta ajustada ficou menor (mais fácil)</span></div>
              <div className="flex items-center gap-2"><span className="text-red-400 font-medium">Vermelho Var. Meta</span><span>= meta ajustada ficou maior (mais difícil)</span></div>
            </div>
          </div>

        </main>
      </MainLayout>
    </div>
  );
}
