"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface HistoryItem {
  id: string;
  query: string;
  insight: { summary: string[]; topKeywords: string[] };
  trend_analysis: { keywords: string[] };
  created_at: string;
  lang: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string) => {
    if (!confirm("이 분석 기록을 삭제할까요?")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/history/${id}`, { method: "DELETE" });
      setHistory((prev) => prev.filter((item) => item.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetch("/api/history")
      .then((r) => r.json())
      .then((data) => {
        if (data.history) setHistory(data.history);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen text-[#0A1929]" style={{ background: "#F8FBFF" }}>
      <nav className="bg-white border-b border-[#E8F4FC] shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
          >
            <span className="text-white font-bold text-xs">C</span>
          </div>
          <span className="font-bold text-[#0A1929]">Centinel</span>
        </Link>
        <Link
          href="/"
          className="text-sm px-4 py-1.5 text-white rounded-[10px] transition-opacity hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
        >
          새 분석
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0A1929]">분석 히스토리</h1>
          <p className="text-[#4A6080] text-sm mt-1">
            최근 분석 결과를 다시 확인하고 공유할 수 있습니다.
          </p>
        </div>

        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-white border border-[#E8F4FC] rounded-[14px] animate-pulse" />
            ))}
          </div>
        )}

        {!loading && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white border border-[#E8F4FC] flex items-center justify-center mb-4 shadow-sm">
              <span className="text-2xl">📭</span>
            </div>
            <p className="text-[#0A1929] font-medium mb-1">분석 히스토리가 없습니다</p>
            <p className="text-[#4A6080] text-sm mb-6">검색을 시작하면 분석 결과가 자동 저장됩니다.</p>
            <Link
              href="/"
              className="px-5 py-2 text-white text-sm font-medium rounded-[10px] transition-opacity hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
            >
              첫 분석 시작하기
            </Link>
          </div>
        )}

        {!loading && history.length > 0 && (
          <div className="space-y-3">
            {history.map((item, i) => (
              <div
                key={item.id}
                className="bg-white border border-[#E8F4FC] hover:border-[#C8E4F4] rounded-[14px] p-5 transition-all duration-200 hover:shadow-md hover:shadow-blue-100/50 hover:-translate-y-[2px] shadow-sm group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="text-[10px] font-medium px-2 py-0.5 rounded-full border"
                        style={{ background: "#EBF5FC", color: "#4A6080", borderColor: "#C8E4F4" }}
                      >
                        #{history.length - i}
                      </span>
                      <h2 className="text-base font-semibold text-[#0A1929] truncate">{item.query}</h2>
                      <span className="text-[10px] text-[#4A6080] border border-[#E8F4FC] px-1.5 py-0.5 rounded-full">{item.lang}</span>
                    </div>
                    <p className="text-[#4A6080] text-xs mb-3">
                      {new Date(item.created_at).toLocaleString("ko-KR")}
                    </p>
                    {item.insight?.topKeywords?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {item.insight.topKeywords.slice(0, 3).map((kw, j) => (
                          <span key={j} className="px-2 py-0.5 text-[11px] rounded-full border" style={{ background: "#EBF5FC", color: "#0B7FD4", borderColor: "#C8E4F4" }}>
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/result/${item.id}`);
                        setCopiedId(item.id);
                        setTimeout(() => setCopiedId(null), 2000);
                      }}
                      className="text-xs px-3 py-2 border rounded-[10px] transition-all duration-200"
                      style={copiedId === item.id
                        ? { borderColor: "#10B981", color: "#10B981", background: "#F0FDF4" }
                        : { borderColor: "#E8F4FC", color: "#4A6080" }
                      }
                    >
                      {copiedId === item.id ? "✓ 복사됨" : "🔗"}
                    </button>
                    <button
                      onClick={() => router.push(`/result/${item.id}`)}
                      className="text-sm px-4 py-2 border border-[#E8F4FC] group-hover:border-[#C8E4F4] text-[#4A6080] group-hover:text-[#0B7FD4] rounded-[10px] transition-colors whitespace-nowrap bg-white"
                    >
                      결과 보기
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="text-xs px-3 py-2 border rounded-[10px] transition-all duration-200 disabled:opacity-40"
                      style={{ borderColor: "#FFE4E4", color: "#EF4444" }}
                    >
                      {deletingId === item.id ? "삭제중..." : "🗑"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
