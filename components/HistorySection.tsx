"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnalysisResult } from "@/types";

export default function HistorySection() {
  const [history, setHistory] = useState<AnalysisResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    const raw = localStorage.getItem("centinel_history");
    if (raw) setHistory(JSON.parse(raw).slice(0, 3));
  }, []);

  if (history.length === 0) return null;

  const handleClick = (item: AnalysisResult) => {
    localStorage.setItem("centinel_current", JSON.stringify(item));
    router.push("/result");
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-10">
      <p className="text-xs text-gray-600 mb-3 px-1">최근 분석</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {history.map((item, i) => (
          <button
            key={i}
            onClick={() => handleClick(item)}
            className="group text-left bg-[#0A1628] border border-[#1E3A5F] hover:border-[#4DAEDB]/50 rounded-xl p-4 transition-colors"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#4DAEDB] text-xs font-semibold truncate">
                {item.query}
              </span>
              <span className="text-gray-700 text-[10px] shrink-0 ml-2">
                {new Date(item.createdAt).toLocaleDateString("ko-KR", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
              {item.insight.summary[0]}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              {item.insight.topKeywords.slice(0, 2).map((kw) => (
                <span
                  key={kw}
                  className="px-1.5 py-0.5 bg-[#020810] border border-[#1E3A5F] text-gray-600 text-[10px] rounded-full"
                >
                  {kw}
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
