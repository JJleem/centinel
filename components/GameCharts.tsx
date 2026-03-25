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
import { GameData } from "@/types";

const COLORS = [
  "#0B7FD4",
  "#6B4EFF",
  "#00C2A8",
  "#F59E0B",
  "#EF4444",
  "#3B82F6",
  "#8B5CF6",
  "#10B981",
];

interface Props {
  games: GameData[];
}

function RatingBar({ games }: Props) {
  const data = [...games]
    .sort((a, b) => b.score - a.score)
    .map((g) => ({
      name: g.title.length > 16 ? g.title.slice(0, 15) + "…" : g.title,
      score: parseFloat(g.score.toFixed(1)),
    }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#4A6080] mb-3">게임별 평점</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="barGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#0B7FD4" />
              <stop offset="100%" stopColor="#6B4EFF" />
            </linearGradient>
          </defs>
          <XAxis
            type="number"
            domain={[0, 5]}
            tick={{ fill: "#4A6080", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: "#4A6080", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(11,127,212,0.06)" }}
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #C5DFF5",
              borderRadius: 8,
              fontSize: 12,
              color: "#0A1929",
            }}
            formatter={(value) => [Number(value).toFixed(1), "평점"]}
          />
          <Bar dataKey="score" fill="url(#barGrad)" radius={[0, 4, 4, 0]} barSize={14} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function GenrePie({ games }: Props) {
  const genreCount: Record<string, number> = {};
  for (const g of games) {
    const genre = g.genre || "기타";
    genreCount[genre] = (genreCount[genre] ?? 0) + 1;
  }
  const data = Object.entries(genreCount).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <h3 className="text-sm font-semibold text-[#4A6080] mb-3">장르별 분포</h3>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} fillOpacity={0.9} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "#ffffff",
              border: "1px solid #C5DFF5",
              borderRadius: 8,
              fontSize: 12,
              color: "#0A1929",
            }}
            formatter={(value, name) => [`${value}개`, String(name)]}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "#4A6080", fontSize: 11 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function GameCharts({ games }: Props) {
  if (!games || games.length === 0) return null;

  return (
    <div className="mt-10 pdf-section">
      <h2 className="text-lg font-bold text-[#0A1929] mb-4 flex items-center gap-3">
        <span
          className="w-[3px] h-5 rounded-full shrink-0"
          style={{ background: "linear-gradient(180deg, #0B7FD4, #6B4EFF)" }}
        />
        게임 데이터 시각화
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-[#E8F4FC] rounded-[14px] p-5 shadow-sm">
          <RatingBar games={games} />
        </div>
        <div className="bg-white border border-[#E8F4FC] rounded-[14px] p-5 shadow-sm">
          <GenrePie games={games} />
        </div>
      </div>
    </div>
  );
}
