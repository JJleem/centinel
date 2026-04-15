"use client";

import { useEffect, useState, useMemo } from "react";

function GameIcon({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <span>🎮</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setBroken(true)} />;
}

type Platform = "google" | "ios";
type TabKey   = "global" | "rising" | "casual" | "surge";
type RankRange = "1-50" | "51-100" | "101-200" | "all";

interface ChartGame {
  title: string;
  appId: string;
  developer: string;
  score: number;
  icon: string;
  genre: string;
  platform?: "google" | "ios";
  rank?: number;
  rankChange?: number;
  isNewEntry?: boolean;
}

type SurgeStatus = "no_data" | "insufficient_snapshots" | "no_changes" | null;

const TABS: { key: TabKey; label: string }[] = [
  { key: "global",  label: "글로벌탑" },
  { key: "rising",  label: "매출탑"   },
  { key: "casual",  label: "캐주얼탑" },
  { key: "surge",   label: "급상승"   },
];

const RANK_RANGES: { key: RankRange; label: string }[] = [
  { key: "1-50",    label: "1-50위"    },
  { key: "51-100",  label: "51-100위"  },
  { key: "101-200", label: "101-200위" },
  { key: "all",     label: "전체"      },
];

const TAB_URL: Record<Platform, Record<TabKey, string>> = {
  google: {
    global: "/api/charts?tab=global",
    rising: "/api/charts?tab=rising",
    casual: "/api/charts?tab=casual",
    surge:  "/api/charts/rising?platform=google",
  },
  ios: {
    global: "/api/charts?tab=ios-global",
    rising: "/api/charts?tab=ios-grossing",
    casual: "/api/charts?tab=ios-casual",
    surge:  "/api/charts/rising?platform=ios",
  },
};

function formatKST(iso: string) {
  return new Date(iso).toLocaleString("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long", day: "numeric",
    hour: "numeric", minute: "2-digit", hour12: true,
  });
}

function SurgeEmptyState({ status, latestSnapshotAt }: { status: SurgeStatus; latestSnapshotAt: string | null }) {
  return (
    <div className="col-span-4">
      <div className="rounded-[14px] border border-dashed border-[#C8E4F4] bg-[#F8FBFF] p-6 text-center">
        <div className="text-2xl mb-3">📡</div>

        {status === "no_data" && (
          <>
            <p className="text-sm font-semibold text-[#0A1929] mb-1">스냅샷 데이터 수집 중</p>
            <p className="text-xs text-[#4A6080] leading-relaxed">
              현재 차트 데이터를 수집하고 있습니다.<br />
              첫 번째 스냅샷이 저장되면 비교가 시작됩니다.
            </p>
          </>
        )}

        {status === "insufficient_snapshots" && (
          <>
            <p className="text-sm font-semibold text-[#0A1929] mb-1">첫 스냅샷 수집 완료 — 비교 대기 중</p>
            <p className="text-xs text-[#4A6080] leading-relaxed">
              {latestSnapshotAt ? `${formatKST(latestSnapshotAt)}부터 데이터를 모으고 있습니다.` : ""}
              <br />
              45분 이상 간격의 두 번째 스냅샷이 쌓이면 급상승 게임이 표시됩니다.
            </p>
          </>
        )}

        {status === "no_changes" && (
          <>
            <p className="text-sm font-semibold text-[#0A1929] mb-1">Top 200 내 순위 변경 없음</p>
            <p className="text-xs text-[#4A6080] leading-relaxed">
              {latestSnapshotAt ? `${formatKST(latestSnapshotAt)} 기준` : "최근 기준"}으로<br />
              글로벌 Top 200 내에 순위 변동이 감지되지 않았습니다.<br />
              Google Play 차트는 하루 1~3회 업데이트됩니다.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrendCharts() {
  const [platform,       setPlatform]       = useState<Platform>("google");
  const [activeTab,      setActiveTab]      = useState<TabKey>("global");
  const [rankRange,      setRankRange]      = useState<RankRange>("1-50");
  const [games,          setGames]          = useState<ChartGame[]>([]);
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(false);
  const [fetchedAt,      setFetchedAt]      = useState<string>("");
  const [surgeMessage,   setSurgeMessage]   = useState("");
  const [surgeStatus,    setSurgeStatus]    = useState<SurgeStatus>(null);
  const [surgeLatestAt,  setSurgeLatestAt]  = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setGames([]);
    setSurgeMessage("");
    setSurgeStatus(null);
    setSurgeLatestAt(null);

    fetch(TAB_URL[platform][activeTab])
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "no_data") {
          setSurgeStatus("no_data");
        } else if (data.error === "insufficient_snapshots") {
          setSurgeStatus("insufficient_snapshots");
          setSurgeLatestAt(data.latestSnapshotAt ?? null);
        } else if (data.games) {
          if (data.noChanges) {
            setSurgeStatus("no_changes");
            setSurgeLatestAt(data.latestSnapshotAt ?? null);
          } else {
            setGames(data.games);
            setFetchedAt(
              data.fetchedAt
                ? formatKST(data.fetchedAt)
                : new Date().toLocaleString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true })
            );
            if (data.snapshotAge) {
              const mins  = data.snapshotAge as number;
              const label = mins < 60 ? `${mins}분 전` : mins < 1440 ? `${Math.round(mins / 60)}시간 전` : `${Math.round(mins / 1440)}일 전`;
              setSurgeMessage(`${label} 대비 순위 상승`);
            }
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
  }, [activeTab, platform]);

  // Reset rank range when switching to surge tab
  useEffect(() => {
    if (activeTab === "surge") setRankRange("all");
    else if (rankRange === "all") setRankRange("1-50");
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredGames = useMemo(() => {
    if (activeTab === "surge" || rankRange === "all") return games;
    return games.filter((g) => {
      const r = g.rank ?? (games.indexOf(g) + 1);
      if (rankRange === "1-50")    return r >= 1   && r <= 50;
      if (rankRange === "51-100")  return r >= 51  && r <= 100;
      if (rankRange === "101-200") return r >= 101 && r <= 200;
      return true;
    });
  }, [games, rankRange, activeTab]);

  const handleSelect = (game: ChartGame, rank: number) => {
    const tabConfig  = TABS.find((t) => t.key === activeTab);
    const chartLabel = tabConfig?.label.replace(" ", "") ?? undefined;
    window.dispatchEvent(
      new CustomEvent("centinel:autorun", {
        detail: {
          query:      game.title,
          appId:      game.appId,
          chartRank:  activeTab === "surge" ? undefined : rank,
          chartLabel: activeTab === "surge" ? undefined : chartLabel,
        },
      })
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalCount = games.length;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-1 h-4 rounded-full shrink-0" style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }} />
          <span className="font-bold text-[#0A1929] text-sm">지금 뜨는 게임</span>
          <span className="text-[#4A6080] text-xs hidden sm:inline">— 클릭하면 바로 분석</span>
          {fetchedAt && (
            <span className="text-[10px]" style={{ color: "#C8E4F4" }}>{fetchedAt} 기준</span>
          )}
          {surgeMessage && activeTab === "surge" && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#10B981" }}>
              ▲ {surgeMessage}
            </span>
          )}
          {totalCount > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#EBF5FC", color: "#0B7FD4" }}>
              Top {totalCount}
            </span>
          )}
        </div>

        {/* Platform switcher + Tabs */}
        <div className="flex flex-col gap-1 self-start sm:self-auto">
          <div className="flex items-center gap-0.5 rounded-[10px] p-0.5 border self-start" style={{ background: "#F0F4FA", borderColor: "#D8E8F4" }}>
            <button
              onClick={() => setPlatform("google")}
              className="px-3 py-1 text-xs font-semibold rounded-[8px] transition-all duration-200 whitespace-nowrap"
              style={platform === "google" ? { background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)", color: "white" } : { color: "#4A6080" }}
            >
              🤖 Android
            </button>
            <button
              onClick={() => setPlatform("ios")}
              className="px-3 py-1 text-xs font-semibold rounded-[8px] transition-all duration-200 whitespace-nowrap"
              style={platform === "ios" ? { background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "white" } : { color: "#4A6080" }}
            >
              🍎 iOS
            </button>
          </div>
          <div className="flex items-center gap-0.5 rounded-[10px] p-0.5 border" style={{ background: "#F8FBFF", borderColor: "#E8F4FC" }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-[8px] transition-all duration-200 whitespace-nowrap"
                style={activeTab === tab.key
                  ? platform === "ios"
                    ? { background: "linear-gradient(135deg, #7C3AED, #A855F7)", color: "white" }
                    : { background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)", color: "white" }
                  : { color: "#4A6080" }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rank range filter (hidden for surge tab) */}
      {activeTab !== "surge" && !loading && games.length > 50 && (
        <div className="flex items-center gap-1 mb-2.5">
          <span className="text-[10px] text-[#4A6080] mr-1">구간</span>
          {RANK_RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRankRange(r.key)}
              className="px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-all duration-150"
              style={rankRange === r.key
                ? { background: platform === "ios" ? "#7C3AED" : "#0B7FD4", color: "white", borderColor: "transparent" }
                : { background: "#F8FBFF", color: "#4A6080", borderColor: "#E8F4FC" }}
            >
              {r.label}
            </button>
          ))}
          <span className="text-[10px] text-[#C8E4F4] ml-1">{filteredGames.length}개</span>
        </div>
      )}

      {/* Game cards */}
      <div className="max-h-[600px] overflow-y-auto pr-1 -mr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#C8E4F4 transparent" }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
          {loading &&
            Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-[68px] sm:h-[72px] rounded-[12px] animate-pulse" style={{ background: "#EBF5FC" }} />
            ))}

          {!loading && activeTab === "surge" && surgeStatus && (
            <SurgeEmptyState status={surgeStatus} latestSnapshotAt={surgeLatestAt} />
          )}

          {!loading && error && !surgeStatus && (
            <div className="col-span-4 text-center py-6 text-[#4A6080] text-sm">
              {surgeMessage || "차트를 불러오지 못했습니다. 잠시 후 다시 시도해주세요."}
            </div>
          )}

          {!loading && !surgeStatus && !error && filteredGames.map((game, i) => {
            const displayRank = game.rank ?? (games.indexOf(game) + 1);
            return (
              <div
                key={game.appId || i}
                className="relative flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-[12px] bg-white border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#C8E4F4] group cursor-pointer"
                style={{ borderColor: "#E8F4FC" }}
                onClick={() => handleSelect(game, displayRank)}
              >
                <span
                  className="text-[10px] font-bold w-5 shrink-0 text-center hidden sm:block"
                  style={{ color: displayRank <= 3 ? "#0B7FD4" : displayRank <= 10 ? "#6B4EFF" : "#C8E4F4" }}
                >
                  {displayRank}
                </span>
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[8px] shrink-0 overflow-hidden flex items-center justify-center text-sm" style={{ background: "#EBF5FC" }}>
                  {game.icon ? <GameIcon src={game.icon} alt={game.title} /> : "🎮"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] sm:text-xs font-semibold truncate leading-tight" style={{ color: "#0A1929" }}>
                    {game.title}
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="text-[9px] sm:text-[10px] truncate" style={{ color: "#4A6080" }}>
                      {game.score > 0 ? `⭐ ${game.score.toFixed(1)}` : "⭐ -"}
                    </span>
                    {activeTab !== "surge" && game.platform === "ios" && (
                      <span className="text-[9px] font-bold shrink-0 px-1 rounded" style={{ background: "#F5F0FF", color: "#7C3AED" }}>🍎</span>
                    )}
                    {activeTab !== "surge" && (game.platform === "google" || !game.platform) && (
                      <span className="text-[9px] font-bold shrink-0 px-1 rounded" style={{ background: "#EBF5FC", color: "#0B7FD4" }}>🤖</span>
                    )}
                    {game.isNewEntry ? (
                      <span className="text-[9px] font-bold shrink-0 px-1 rounded" style={{ background: "#F0FDF4", color: "#10B981" }}>🆕 신규</span>
                    ) : game.rankChange != null && game.rankChange > 0 && (
                      <span className="text-[9px] font-bold shrink-0" style={{ color: "#10B981" }}>▲{game.rankChange}</span>
                    )}
                  </div>
                </div>
                <div
                  className="absolute inset-0 rounded-[12px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150"
                  style={{ background: "rgba(11,127,212,0.08)" }}
                >
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full text-white shadow-sm" style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}>
                    🔍 분석하기
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
