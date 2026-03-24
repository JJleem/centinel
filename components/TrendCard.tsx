import { InsightSummary } from "@/types";

interface Props {
  insight: InsightSummary;
  query: string;
}

export default function TrendCard({ insight, query }: Props) {
  return (
    <div className="bg-[#0A1628] border border-[#1E3A5F] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#4DAEDB]" />
        <h2 className="text-lg font-semibold text-white">트렌드 인사이트</h2>
        <span className="ml-auto text-xs text-gray-500 bg-[#020810] px-2 py-1 rounded-full border border-[#1E3A5F]">
          {query}
        </span>
      </div>

      {/* Top keywords */}
      <div className="flex flex-wrap gap-2 mb-5">
        {insight.topKeywords.map((kw) => (
          <span
            key={kw}
            className="px-3 py-1 bg-[#4DAEDB]/10 text-[#4DAEDB] border border-[#4DAEDB]/30 rounded-full text-sm font-medium"
          >
            # {kw}
          </span>
        ))}
      </div>

      {/* 3-line summary */}
      <ul className="space-y-3">
        {insight.summary.map((line, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-[#8B7FF5] font-bold text-sm mt-0.5 shrink-0">
              {i + 1}.
            </span>
            <p className="text-gray-300 text-sm leading-relaxed">{line}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
