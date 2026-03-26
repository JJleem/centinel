"use client";

import { useEffect, useState } from "react";

type Tab = "rising" | "global" | "casual" | "surge";

interface ChartGame {
  title: string;
  appId: string;
  developer: string;
  score: number;
  icon: string;
  genre: string;
  rankChange?: number;
}

const TABS: { key: Tab; label: string }[] = [
  { key: "surge", label: "급상승" },
  { key: "global", label: "글로벌 탑" },
  { key: "rising", label: "매출 탑" },
  { key: "casual", label: "캐주얼 탑" },
];

export default function TrendCharts() {
  const [activeTab, setActiveTab] = useState<Tab>("surge");
  const [games, setGames] = useState<ChartGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string>("");
  const [surgeMessage, setSurgeMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    setError(false);
    setGames([]);
    setSurgeMessage("");

    const url = activeTab === "surge" ? "/api/charts/rising" : `/api/charts?tab=${activeTab}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.games) {
          setGames(data.games);
          setFetchedAt(
            new Date().toLocaleString("ko-KR", {
              year: "numeric", month: "long", day: "numeric",
              hour: "numeric", minute: "2-digit", hour12: true,
            })
          );
          if (data.snapshotAge) {
            setSurgeMessage(`${data.snapshotAge}분 전 대비 순위 상승`);
          }
        } else if (data.message) {
          setSurgeMessage(data.message);
          setError(true);
        } else {
          setError(true);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const handleSelect = (game: ChartGame) => {
    window.dispatchEvent(
      new CustomEvent("centinel:autorun", { detail: { query: game.title, appId: game.appId } })
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div
            className="w-1 h-4 rounded-full shrink-0"
            style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
          />
          <span className="font-bold text-[#0A1929] text-sm">
            지금 뜨는 게임
          </span>
          <span className="text-[#4A6080] text-xs hidden sm:inline">
            — 클릭하면 바로 분석
          </span>
          {fetchedAt && (
            <span className="text-[10px]" style={{ color: "#C8E4F4" }}>
              {fetchedAt} 기준
            </span>
          )}
        </div>

        {/* Tabs */}
        <div
          className="flex items-center gap-0.5 rounded-[10px] p-0.5 border self-start sm:self-auto"
          style={{ background: "#F8FBFF", borderColor: "#E8F4FC" }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-[8px] transition-all duration-200"
              style={
                activeTab === tab.key
                  ? {
                      background:
                        "linear-gradient(135deg, #0B7FD4, #6B4EFF)",
                      color: "white",
                    }
                  : { color: "#4A6080" }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Game cards */}
      <div className="max-h-[420px] overflow-y-auto pr-1 -mr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#C8E4F4 transparent" }}>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
        {loading &&
          Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="h-[68px] sm:h-[72px] rounded-[12px] animate-pulse"
              style={{ background: "#EBF5FC" }}
            />
          ))}

        {!loading && error && (
          <div className="col-span-4 text-center py-6 text-[#4A6080] text-sm">
            {surgeMessage || "차트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."}
          </div>
        )}

        {!loading &&
          !error &&
          games.map((game, i) => (
            <div
              key={game.appId || i}
              className="relative flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-[12px] bg-white border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#C8E4F4] group cursor-pointer"
              style={{ borderColor: "#E8F4FC" }}
              onClick={() => handleSelect(game)}
            >
              {/* Rank */}
              <span
                className="text-[10px] font-bold w-3.5 shrink-0 text-center hidden sm:block"
                style={{ color: i < 3 ? "#0B7FD4" : "#C8E4F4" }}
              >
                {i + 1}
              </span>

              {/* Icon */}
              {game.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={game.icon}
                  alt={game.title}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] shrink-0 object-cover"
                />
              ) : (
                <div
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] shrink-0 flex items-center justify-center text-sm"
                  style={{ background: "#EBF5FC" }}
                >
                  🎮
                </div>
              )}

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div
                  className="text-[11px] sm:text-xs font-semibold truncate leading-tight"
                  style={{ color: "#0A1929" }}
                >
                  {game.title}
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] sm:text-[10px] truncate" style={{ color: "#4A6080" }}>
                    {game.score > 0 ? `⭐ ${game.score.toFixed(1)}` : game.developer}
                  </span>
                  {game.rankChange != null && (
                    <span className="text-[9px] font-bold shrink-0" style={{ color: "#10B981" }}>
                      ▲{game.rankChange}
                    </span>
                  )}
                </div>
              </div>

              {/* Hover overlay — 분석하기 */}
              <div
                className="absolute inset-0 rounded-[12px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                style={{ background: "rgba(11,127,212,0.08)" }}
              >
                <span
                  className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white shadow-sm"
                  style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
                >
                  🔍 분석하기
                </span>
              </div>
            </div>
          ))}
      </div>
      </div>
    </div>
  );
}
