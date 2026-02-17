"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import type { MonthlyTrend } from "@/lib/types";

const COLORS = [
  "#f472b6", "#a78bfa", "#38bdf8", "#34d399",
  "#fbbf24", "#fb923c", "#f87171", "#818cf8",
  "#2dd4bf", "#e879f9", "#facc15", "#94a3b8",
];

function formatYen(value: number) {
  if (value >= 10000) return `¥${(value / 10000).toFixed(0)}만`;
  return `¥${value.toLocaleString()}`;
}

export function MonthlyTrendChart({ data }: { data: MonthlyTrend[] }) {
  const chartData = data.map((d) => ({
    month: d.month.slice(5),
    지출: d.totalExpense,
    수입: d.totalIncome,
    저축: d.totalSaving,
  }));

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-bold text-white mb-4">월별 추이</h3>
      {chartData.length === 0 ? (
        <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <XAxis
              dataKey="month"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              axisLine={{ stroke: "#374151" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={formatYen}
              width={55}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px",
                color: "#fff",
                fontSize: 13,
              }}
              formatter={(value) => `¥${Number(value).toLocaleString()}`}
            />
            <Bar dataKey="수입" fill="#34d399" radius={[4, 4, 0, 0]} />
            <Bar dataKey="지출" fill="#f472b6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="저축" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function CategoryPieChart({ byCategory }: { byCategory: Record<string, number> }) {
  const data = Object.entries(byCategory)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-bold text-white mb-4">카테고리별 지출</h3>
      {data.length === 0 ? (
        <p className="text-gray-500 text-center py-8">데이터가 없습니다</p>
      ) : (
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={110}
                paddingAngle={2}
                dataKey="value"
                label={(props: PieLabelRenderProps) => {
                  const { name, percent } = props;
                  return (percent ?? 0) > 0.05
                    ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                    : "";
                }}
                labelLine={false}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: 13,
                }}
                formatter={(value) => `¥${Number(value).toLocaleString()}`}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, color: "#9ca3af" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="w-full lg:w-48 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-400 border-b border-white/10 pb-1 mb-1">
              <span>합계</span>
              <span className="font-mono text-white">¥{total.toLocaleString()}</span>
            </div>
            {data.slice(0, 8).map((d, i) => (
              <div key={d.name} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="text-gray-400 truncate">{d.name}</span>
                </div>
                <span className="font-mono text-gray-300 shrink-0 text-xs">
                  ¥{d.value.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
