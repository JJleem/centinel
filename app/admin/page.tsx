"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type PeriodStats = {
  sonnetInput: number; sonnetOutput: number;
  haikuInput:  number; haikuOutput:  number;
  cost: number; count: number;
};
type RecentRow = {
  query: string;
  sonnet_input: number; sonnet_output: number;
  haiku_input:  number; haiku_output:  number;
  estimated_cost_usd: number;
  created_at: string;
};
type TokenData = { today: PeriodStats; week: PeriodStats; month: PeriodStats; recent: RecentRow[] };

function totalTokens(s: PeriodStats) {
  return s.sonnetInput + s.sonnetOutput + s.haikuInput + s.haikuOutput;
}

function StatCard({ label, stats }: { label: string; stats: PeriodStats }) {
  return (
    <div className="bg-white border border-[#E8F4FC] rounded-[14px] p-5 shadow-sm">
      <p className="text-xs font-semibold text-[#4A6080] mb-3 uppercase tracking-wider">{label}</p>
      <p className="text-2xl font-bold text-[#0A1929] mb-1">${stats.cost.toFixed(4)}</p>
      <p className="text-xs text-[#4A6080] mb-3">{stats.count}회 분석 · {totalTokens(stats).toLocaleString()} 토큰</p>
      <div className="space-y-1.5 text-[11px] text-[#4A6080]">
        <div className="flex justify-between">
          <span>Sonnet 입력</span>
          <span className="font-medium text-[#0A1929]">{stats.sonnetInput.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Sonnet 출력</span>
          <span className="font-medium text-[#0A1929]">{stats.sonnetOutput.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Haiku 입력</span>
          <span className="font-medium text-[#0A1929]">{stats.haikuInput.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span>Haiku 출력</span>
          <span className="font-medium text-[#0A1929]">{stats.haikuOutput.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [data, setData] = useState<TokenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/tokens")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen text-[#0A1929]" style={{ background: "#F8FBFF" }}>
      <nav className="bg-white border-b border-[#E8F4FC] shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm" style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}>
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-[#0A1929]">Centinel</span>
        </Link>
        <span className="text-xs font-semibold text-[#4A6080] px-3 py-1 rounded-full" style={{ background: "#EBF5FC" }}>Admin</span>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[#0A1929]">토큰 사용량</h1>
          <p className="text-xs text-[#4A6080] mt-0.5">Sonnet $3/$15 · Haiku $0.8/$4 (per MTok 입력/출력) 기준 예상 비용</p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1,2,3].map((i) => <div key={i} className="h-44 rounded-[14px] animate-pulse" style={{ background: "#EBF5FC" }} />)}
          </div>
        ) : data ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <StatCard label="오늘" stats={data.today} />
              <StatCard label="최근 7일" stats={data.week} />
              <StatCard label="최근 30일" stats={data.month} />
            </div>

            <div className="bg-white border border-[#E8F4FC] rounded-[14px] shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-[#F0F7FF]">
                <p className="text-sm font-semibold text-[#0A1929]">최근 분석 20건</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: "#F8FBFF" }}>
                      {["시각", "검색어", "Sonnet 입/출", "Haiku 입/출", "예상 비용"].map((h) => (
                        <th key={h} className="px-4 py-2.5 text-left font-semibold text-[#4A6080]">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recent.map((row, i) => (
                      <tr key={i} className="border-t border-[#F0F7FF] hover:bg-[#F8FBFF] transition-colors">
                        <td className="px-4 py-2.5 text-[#4A6080] whitespace-nowrap">
                          {new Date(row.created_at).toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-4 py-2.5 font-medium text-[#0A1929] max-w-[160px] truncate">{row.query}</td>
                        <td className="px-4 py-2.5 text-[#4A6080]">{row.sonnet_input.toLocaleString()} / {row.sonnet_output.toLocaleString()}</td>
                        <td className="px-4 py-2.5 text-[#4A6080]">{row.haiku_input.toLocaleString()} / {row.haiku_output.toLocaleString()}</td>
                        <td className="px-4 py-2.5 font-semibold" style={{ color: "#0B7FD4" }}>${row.estimated_cost_usd.toFixed(4)}</td>
                      </tr>
                    ))}
                    {data.recent.length === 0 && (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-[#4A6080]">분석 기록이 없습니다</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <p className="text-[#4A6080] text-sm">데이터를 불러오지 못했습니다</p>
        )}
      </main>
    </div>
  );
}
