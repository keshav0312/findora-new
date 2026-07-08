"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";

// Matches the "Color Theme" swatches from the product design: indigo, blue,
// green, orange, red, slate.
const PALETTE = ["#4338ca", "#2563eb", "#16a34a", "#f97316", "#dc2626", "#0f172a", "#7c3aed", "#0891b2"];

export interface DonutDatum {
  name: string;
  value: number;
}

/** Category / status breakdown donut, e.g. "Top Categories" on the admin dashboard. */
export function DonutChart({ data, height = 220 }: { data: DonutDatum[]; height?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);

  if (total === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PALETTE[i % PALETTE.length]} stroke="#fff" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number, name: string) => [`${value} (${Math.round((value / total) * 100)}%)`, name]} />
        <Legend
          layout="vertical"
          verticalAlign="middle"
          align="right"
          iconType="circle"
          wrapperStyle={{ fontSize: 12, lineHeight: "20px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export interface TrendDatum {
  label: string;
  value: number;
}

/** "Reports Overview" style trend line. */
export function TrendChart({ data, height = 200, color = "#4338ca" }: { data: TrendDatum[]; height?: number; color?: string }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export interface BarDatum {
  label: string;
  lost: number;
  found: number;
}

/** Lost vs Found comparison bars, used on the admin & police dashboards. */
export function LostFoundBarChart({ data, height = 220 }: { data: BarDatum[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="lost" fill="#dc2626" radius={[4, 4, 0, 0]} name="Lost" />
        <Bar dataKey="found" fill="#16a34a" radius={[4, 4, 0, 0]} name="Found" />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ---------------------------------------------------------------------------
// Extra visuals used to make the admin dashboard more attractive.
// ---------------------------------------------------------------------------

const RADIAN = Math.PI / 180;

/** White percentage label rendered inside each pie slice. */
function renderPctLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) {
  if (!percent || percent < 0.06) return null;
  const r = innerRadius + (outerRadius - innerRadius) * 0.6;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="#fff" fontSize={12} fontWeight={700} textAnchor="middle" dominantBaseline="central">
      {Math.round(percent * 100)}%
    </text>
  );
}

/**
 * Full pie chart with in-slice percentage labels and a legend below — used for
 * Lost vs Found, resolution status, and city breakdowns on the admin dashboard.
 */
export function PieBreakdown({
  data,
  height = 240,
  colors,
}: {
  data: DonutDatum[];
  height?: number;
  colors?: string[];
}) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const palette = colors || PALETTE;

  if (total === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-xs text-slate-400">
        No data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          outerRadius="80%"
          paddingAngle={2}
          labelLine={false}
          label={renderPctLabel}
          isAnimationActive
        >
          {data.map((_, i) => (
            <Cell key={i} fill={palette[i % palette.length]} stroke="#fff" strokeWidth={2} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number, name: string) => [`${value} (${Math.round((value / total) * 100)}%)`, name]} />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
      </PieChart>
    </ResponsiveContainer>
  );
}

/** Trend as a smooth gradient-filled area — a softer look than a bare line. */
export function AreaTrendChart({
  data,
  height = 220,
  color = "#4338ca",
}: {
  data: TrendDatum[];
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="areaTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#areaTrendFill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Radial gauge for a single 0-100 metric (e.g. recovery rate). */
export function GaugeChart({
  value,
  height = 200,
  color = "#16a34a",
  label,
}: {
  value: number;
  height?: number;
  color?: string;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const data = [{ name: "value", value: clamped }];

  return (
    <div className="relative" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="68%"
          outerRadius="100%"
          data={data}
          startAngle={220}
          endAngle={-40}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar background dataKey="value" cornerRadius={16} fill={color} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
          {clamped}%
        </span>
        {label && <span className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{label}</span>}
      </div>
    </div>
  );
}
