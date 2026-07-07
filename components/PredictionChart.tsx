"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface PredictionPoint {
  date: string;
  real: number | null;
  base: number;
  optimista: number;
  pesimista: number;
}

function generateDemoData(): PredictionPoint[] {
  const points: PredictionPoint[] = [];
  const today = new Date();
  for (let i = -15; i < 15; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    const label = date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
    });
    const trend = 120 + Math.sin(i / 4) * 20 + i * 1.5;
    points.push({
      date: label,
      real: i <= 0 ? Math.round(trend + (Math.random() * 10 - 5)) : null,
      base: Math.round(trend),
      optimista: Math.round(trend * 1.15),
      pesimista: Math.round(trend * 0.85),
    });
  }
  return points;
}

const DEMO_DATA = generateDemoData();

interface PredictionChartProps {
  data?: PredictionPoint[];
}

export default function PredictionChart({
  data = DEMO_DATA,
}: PredictionChartProps) {
  return (
    <div className="rounded-lg border border-border bg-panel-raised p-6">
      <h3 className="font-display text-lg text-text-high">
        Ventas reales vs. predicción (30 días)
      </h3>
      <div className="mt-4 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#1F2937" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              stroke="#94A3B8"
              tick={{ fontSize: 12, fontFamily: "var(--font-jetbrains-mono)" }}
            />
            <YAxis
              stroke="#94A3B8"
              tick={{ fontSize: 12, fontFamily: "var(--font-jetbrains-mono)" }}
            />
            <Tooltip
              contentStyle={{
                background: "#111827",
                border: "1px solid #1F2937",
                borderRadius: 8,
                fontFamily: "var(--font-jetbrains-mono)",
                fontSize: 12,
              }}
              labelStyle={{ color: "#E5E7EB" }}
            />
            <Line
              type="monotone"
              dataKey="real"
              name="Real"
              stroke="#E5E7EB"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
            />
            <Line
              type="monotone"
              dataKey="base"
              name="Predicción base"
              stroke="#00D9A3"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="optimista"
              name="Optimista"
              stroke="#00D9A3"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="pesimista"
              name="Pesimista"
              stroke="#F5A623"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
