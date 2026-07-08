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
