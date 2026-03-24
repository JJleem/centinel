import { InsightSummary } from "@/types";

interface Props {
  insight: InsightSummary;
  query: string;
  usedFallback?: boolean;
}

export default function TrendCard({ insight, query, usedFallback }: Props) {
  return (
    <div className="pdf-card bg-[#0A1628] border border-[#1E3A5F] rounded-2xl p-6">
      {usedFallback && (
        <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-yellow-500/80 text-xs">
          ⚠️ 검색 결과가 부족하여 유사 장르 데이터로 분석했습니다
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#4DAEDB]" />
        <h2 className="text-lg font-semibold text-white">트렌드 인사이트</h2>
        <span className="ml-auto text-xs text-gray-500 bg-[#020810] px-2 py-1 rounded-full border border-[#1E3A5F]">
          {query}
        </span>
      </div>

      {/* Top keywords */}
      <div className="flex flex-wrap gap-2 mb-6">
        {insight.topKeywords.map((kw) => (
          <span
            key={kw}
            className="px-3 py-1 bg-[#4DAEDB]/10 text-[#4DAEDB] border border-[#4DAEDB]/30 rounded-full text-sm font-medium"
          >
            # {kw}
          </span>
        ))}
      </div>

      {/* 5-line summary */}
      <ul className="space-y-3 mb-6">
        {insight.summary.map((line, i) => (
          <li key={i} className="flex gap-3">
            <span className="text-[#8B7FF5] font-bold text-sm mt-0.5 shrink-0">
              {i + 1}.
            </span>
            <p className="text-gray-300 text-sm leading-relaxed">{line}</p>
          </li>
        ))}
      </ul>

      {/* Extended sections */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-5 border-t border-[#1E3A5F]">
        {/* Notable Mechanics */}
        {insight.notableMechanics && insight.notableMechanics.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">🎮 주목할 메카닉</p>
            <ul className="space-y-1.5">
              {insight.notableMechanics.map((m, i) => (
                <li key={i} className="text-xs text-gray-400 flex gap-1.5 items-start">
                  <span className="text-[#4DAEDB] shrink-0 mt-0.5">·</span>
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Revenue Model Trends */}
        {insight.revenueModelTrends && insight.revenueModelTrends.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">💰 수익 모델 트렌드</p>
            <ul className="space-y-1.5">
              {insight.revenueModelTrends.map((r, i) => (
                <li key={i} className="text-xs text-gray-400 flex gap-1.5 items-start">
                  <span className="text-[#8B7FF5] shrink-0 mt-0.5">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Market Opportunity */}
        {insight.marketOpportunity && (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-2">🎯 시장 기회</p>
            <p className="text-xs text-gray-300 leading-relaxed">{insight.marketOpportunity}</p>
          </div>
        )}
      </div>
    </div>
  );
}
