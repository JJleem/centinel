"use client";

import { useEffect, useState } from "react";

function GameIcon({ src, alt }: { src: string; alt: string }) {
  const [broken, setBroken] = useState(false);
  if (broken) return <span>🎮</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setBroken(true)} />;
}

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

type SurgeStatus = "no_data" | "insufficient_snapshots" | "no_changes" | null;

const TABS: { key: Tab; label: string }[] = [
  { key: "global", label: "글로벌 탑" },
  { key: "rising", label: "매출 탑" },
  { key: "casual", label: "캐주얼 탑" },
  { key: "surge", label: "급상승" },
];

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
              1시간 이상 간격의 두 번째 스냅샷이 쌓이면 급상승 게임이 표시됩니다.
            </p>
          </>
        )}

        {status === "no_changes" && (
          <>
            <p className="text-sm font-semibold text-[#0A1929] mb-1">Top 30 내 순위 변경 없음</p>
            <p className="text-xs text-[#4A6080] leading-relaxed">
              {latestSnapshotAt ? `${formatKST(latestSnapshotAt)} 기준` : "최근 기준"}으로<br />
              글로벌 Top 30 내에 순위 변동이 감지되지 않았습니다.<br />
              Google Play 차트는 하루 1~3회 업데이트됩니다.
            </p>
          </>
        )}

        {/* Q&A */}
        <div className="mt-5 text-left rounded-[10px] border border-[#E8F4FC] bg-white px-4 py-3">
          <p className="text-[11px] font-bold text-[#0B7FD4] mb-1">Q. 왜 Top 30 게임만 분석하나요?</p>
          <p className="text-[11px] text-[#4A6080] leading-relaxed">
            현재 프로토타입은 상위 30개로 제한했지만, 실제로는 50~200위 구간 분석이 더 실용적입니다.
            1위 게임은 누구나 알지만, 조용히 올라오는 틈새 게임이 다음 트렌드 신호입니다.
            프로덕션 전환 시 랭킹 구간 선택 기능을 추가할 예정입니다.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function TrendCharts() {
  const [activeTab, setActiveTab] = useState<Tab>("global");
  const [games, setGames] = useState<ChartGame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string>("");
  const [surgeMessage, setSurgeMessage] = useState("");
  const [surgeStatus, setSurgeStatus] = useState<SurgeStatus>(null);
  const [surgeLatestAt, setSurgeLatestAt] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(false);
    setGames([]);
    setSurgeMessage("");
    setSurgeStatus(null);
    setSurgeLatestAt(null);

    const url = activeTab === "surge" ? "/api/charts/rising" : `/api/charts?tab=${activeTab}`;

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (data.error === "no_data") {
          setSurgeStatus("no_data");
        } else if (data.error === "insufficient_snapshots") {
          setSurgeStatus("insufficient_snapshots");
          setSurgeLatestAt(data.latestSnapshotAt ?? null);
        } else if (data.games) {
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
          if (data.noChanges) {
            setSurgeStatus("no_changes");
            setSurgeLatestAt(data.latestSnapshotAt ?? null);
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

  const handleSelect = (game: ChartGame, rank: number) => {
    const tabConfig = TABS.find((t) => t.key === activeTab);
    const chartLabel = tabConfig?.label.replace(" ", "") ?? undefined;
    window.dispatchEvent(
      new CustomEvent("centinel:autorun", {
        detail: {
          query: game.title,
          appId: game.appId,
          chartRank: activeTab === "surge" ? undefined : rank,
          chartLabel: activeTab === "surge" ? undefined : chartLabel,
        },
      })
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
          {surgeMessage && activeTab === "surge" && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full" style={{ background: "#F0FDF4", color: "#10B981" }}>
              ▲ {surgeMessage}
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className="flex items-center gap-0.5 rounded-[10px] p-0.5 border"
            style={{ background: "#F8FBFF", borderColor: "#E8F4FC" }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className="px-2.5 sm:px-3 py-1 text-xs font-semibold rounded-[8px] transition-all duration-200 whitespace-nowrap"
                style={
                  activeTab === tab.key
                    ? { background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)", color: "white" }
                    : { color: "#4A6080" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Game cards */}
      <div className="max-h-[420px] overflow-y-auto pr-1 -mr-1" style={{ scrollbarWidth: "thin", scrollbarColor: "#C8E4F4 transparent" }}>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-2.5">
          {loading &&
            Array.from({ length: 12 }).map((_, i) => (
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

          {!loading && !surgeStatus && !error &&
            games.map((game, i) => (
              <div
                key={game.appId || i}
                className="relative flex items-center gap-2 sm:gap-2.5 p-2 sm:p-2.5 rounded-[12px] bg-white border text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-[#C8E4F4] group cursor-pointer"
                style={{ borderColor: "#E8F4FC" }}
                onClick={() => handleSelect(game, i + 1)}
              >
                <span
                  className="text-[10px] font-bold w-3.5 shrink-0 text-center hidden sm:block"
                  style={{ color: i < 3 ? "#0B7FD4" : "#C8E4F4" }}
                >
                  {i + 1}
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
                      {game.score > 0 ? `⭐ ${game.score.toFixed(1)}` : game.developer}
                    </span>
                    {game.rankChange != null && (
                      <span className="text-[9px] font-bold shrink-0" style={{ color: "#10B981" }}>
                        ▲{game.rankChange}
                      </span>
                    )}
                  </div>
                </div>
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
