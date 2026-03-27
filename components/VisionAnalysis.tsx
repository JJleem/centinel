"use client";

import { useState, useEffect } from "react";
import { GameData, VisionResult } from "@/types";

type Lang = "KO" | "EN";

interface Props {
  games: GameData[];
  lang?: string;
  storageKey?: string;
  resultId?: string | null; // Supabase analysis_history UUID
  initialVisionResult?: VisionResult | null; // pre-loaded from DB (shared link)
}

interface Screenshot {
  url: string;
  gameTitle: string;
}

function ComplexityBar({ level }: { level: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="w-5 h-2 rounded-sm"
            style={{
              background: i <= level
                ? "linear-gradient(90deg, #0B7FD4, #6B4EFF)"
                : "#E8F4FC",
            }}
          />
        ))}
      </div>
      <span className="text-xs text-[#4A6080]">{level}/5</span>
    </div>
  );
}

function ScreenshotGrid({ screenshots }: { screenshots: Screenshot[] }) {
  const [lightbox, setLightbox] = useState<number | null>(null);

  if (screenshots.length === 0) return null;

  const prev = () => setLightbox((i) => (i != null ? Math.max(0, i - 1) : 0));
  const next = () => setLightbox((i) => (i != null ? Math.min(screenshots.length - 1, i + 1) : 0));

  return (
    <>
      {/* Horizontal scrollable strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        {screenshots.map((s, i) => (
          <button
            key={i}
            onClick={() => setLightbox(i)}
            className="shrink-0 rounded-[8px] overflow-hidden border border-[#E8F4FC] hover:border-[#0B7FD4] hover:scale-105 transition-all shadow-sm relative group"
            style={{ width: 72, height: 128 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.url} alt={s.gameTitle} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
              <span className="opacity-0 group-hover:opacity-100 text-white text-lg transition-opacity">⤢</span>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 py-1.5">
              <p className="text-white text-[9px] leading-tight truncate">{s.gameTitle}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {lightbox !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative flex items-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev */}
            <button
              onClick={prev}
              disabled={lightbox === 0}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xl disabled:opacity-20 transition-all"
            >
              ‹
            </button>

            {/* Image with overlaid dots */}
            <div
              className="relative rounded-[14px] overflow-hidden shadow-2xl"
              style={{ maxHeight: "85vh", maxWidth: "min(320px, 85vw)" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshots[lightbox].url}
                alt={screenshots[lightbox].gameTitle}
                className="block"
                style={{ maxHeight: "85vh", maxWidth: "min(320px, 85vw)", objectFit: "contain" }}
              />
              {/* Bottom overlay: title + dots */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-4 pt-8 pb-3">
                <p className="text-white text-sm font-medium truncate mb-2">
                  {screenshots[lightbox].gameTitle}
                </p>
                {/* Dots */}
                <div className="flex items-center gap-1.5">
                  {screenshots.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setLightbox(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === lightbox ? 18 : 6,
                        height: 6,
                        background: i === lightbox ? "white" : "rgba(255,255,255,0.45)",
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Next */}
            <button
              onClick={next}
              disabled={lightbox === screenshots.length - 1}
              className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white text-xl disabled:opacity-20 transition-all"
            >
              ›
            </button>
          </div>

          {/* Close */}
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center text-white transition-all"
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

const LABELS: Record<Lang, {
  title: string; subtitle: string; noScreenshots: string;
  preparing: string; processed: string; failed: string; retry: string;
  headerSub: string; analyzed: string; coreInteraction: string;
  uiComplexity: string; visualHook: string; colorPalette: string;
  keyElements: string; screenshotsLabel: string; reanalyze: string;
}> = {
  KO: {
    title: "🔍 게임 화면 AI 분석 (멀티모달)",
    subtitle: "스크린샷을 Claude Vision으로 분석합니다",
    noScreenshots: "스크린샷 데이터가 없습니다 (새로 검색하면 자동 수집됩니다)",
    preparing: "분석 준비 중...",
    processed: "이미지 처리됨",
    failed: "분석 실패",
    retry: "다시 시도",
    headerSub: "Claude Vision 스크린샷 분석",
    analyzed: "개 이미지 분석됨",
    coreInteraction: "핵심 인터랙션",
    uiComplexity: "UI 복잡도",
    visualHook: "시각적 훅",
    colorPalette: "주요 색상 & 분위기",
    keyElements: "참여 유발 핵심 요소",
    screenshotsLabel: "수집된 스크린샷",
    reanalyze: "다시 분석",
  },
  EN: {
    title: "🔍 Game Screen AI Analysis (Multimodal)",
    subtitle: "Analyze screenshots with Claude Vision",
    noScreenshots: "No screenshot data (run a new search to collect)",
    preparing: "Preparing analysis...",
    processed: "images processed",
    failed: "Analysis Failed",
    retry: "Retry",
    headerSub: "Claude Vision Screenshot Analysis",
    analyzed: " images analyzed",
    coreInteraction: "Core Interaction",
    uiComplexity: "UI Complexity",
    visualHook: "Visual Hook",
    colorPalette: "Color Palette & Mood",
    keyElements: "Key Engagement Elements",
    screenshotsLabel: "Collected Screenshots",
    reanalyze: "Re-analyze",
  },
};

export default function VisionAnalysis({ games, lang: langProp = "KO", resultId, initialVisionResult }: Props) {
  const lang = (langProp === "EN" ? "EN" : "KO") as Lang;
  const L = LABELS[lang];

  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    initialVisionResult ? "done" : "idle"
  );
  const [progress, setProgress] = useState({ count: 0, total: 0, message: "" });
  const [result, setResult] = useState<VisionResult | null>(initialVisionResult ?? null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialVisionResult) {
      setResult(initialVisionResult);
      setState("done");
    }
  }, [initialVisionResult]);

  const screenshots: Screenshot[] = games.flatMap((g) =>
    (g.screenshots ?? []).map((url) => ({ url, gameTitle: g.title }))
  );
  const hasScreenshots = screenshots.length > 0;

  const handleAnalyze = async () => {
    setState("loading");
    setError("");
    setResult(null);
    let isDone = false;

    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ games, lang }),
      });

      if (!res.ok) {
        let msg = `서버 오류 (${res.status})`;
        try { const j = await res.json(); if (j.error) msg = j.error; } catch { /* ignore */ }
        setState("error"); setError(msg); return;
      }
      if (!res.body) { setState("error"); setError("응답 스트림이 없습니다."); return; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let data: Record<string, unknown>;
          try { data = JSON.parse(line.slice(6)); } catch { continue; }

          if (data.error) {
            isDone = true; setState("error"); setError(String(data.error)); return;
          }
          if (data.event === "progress") {
            setProgress({ count: data.count as number, total: data.total as number, message: data.message as string });
          } else if (data.event === "analyzing") {
            setProgress((p) => ({ ...p, message: data.message as string }));
          } else if (data.event === "done") {
            isDone = true;
            const r = data.result as VisionResult;
            setResult(r);
            setState("done");
            // Save to DB
            if (resultId) {
              fetch(`/api/history/${resultId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visionResult: r }),
              }).catch(() => {});
            }
          }
        }
      }

      if (!isDone) {
        setState("error");
        setError(lang === "KO" ? "분석이 완료되지 않았습니다. 다시 시도해주세요." : "Analysis did not complete. Please retry.");
      }
    } catch (err) {
      console.error("[VisionAnalysis]", err);
      setState("error");
      setError(err instanceof Error ? err.message : (lang === "KO" ? "알 수 없는 오류" : "Unknown error"));
    }
  };

  const handleReanalyze = () => {
    setState("idle"); setResult(null); setError("");
  };

  return (
    <div className="mt-5 pt-5 border-t border-[#EEF6FB]">
      <p className="text-xs font-semibold text-[#4A6080] uppercase tracking-wider mb-3">
        {L.screenshotsLabel}
      </p>

      {hasScreenshots && <ScreenshotGrid screenshots={screenshots} />}

      {state === "idle" && null}

      {state === "loading" && (
        <div className="flex items-center gap-3 py-4 px-4 rounded-[10px] bg-[#F8FBFF] border border-[#E8F4FC]">
          <div
            className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin shrink-0"
            style={{ borderColor: "#0B7FD4", borderTopColor: "transparent" }}
          />
          <div>
            <p className="text-sm text-[#0A1929] font-medium">{progress.message || L.preparing}</p>
            {progress.total > 0 && (
              <p className="text-xs text-[#4A6080] mt-0.5">
                {progress.count}/{progress.total} {L.processed}
              </p>
            )}
          </div>
        </div>
      )}

      {state === "error" && (
        <div>
          <div className="py-3 px-4 rounded-[10px] bg-red-50 border border-red-200">
            <p className="text-red-600 text-sm font-medium mb-0.5">{L.failed}</p>
            <p className="text-red-500 text-xs leading-relaxed">{error || "Unknown error"}</p>
          </div>
          <button onClick={() => { setState("idle"); setError(""); }} className="mt-2 text-xs text-[#4A6080] hover:text-[#0B7FD4] transition-colors">
            {L.retry}
          </button>
        </div>
      )}

      {state === "done" && result && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-[#4A6080] uppercase tracking-wider mb-1">{L.coreInteraction}</p>
              <p className="text-sm text-[#0A1929] leading-relaxed">{result.coreInteraction}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#4A6080] uppercase tracking-wider mb-1.5">{L.uiComplexity}</p>
              <ComplexityBar level={result.uiComplexity} />
            </div>
          </div>

          <hr style={{ borderColor: "#EEF6FB" }} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-semibold text-[#4A6080] uppercase tracking-wider mb-1">{L.visualHook}</p>
              <p className="text-sm text-[#0A1929] leading-relaxed">{result.visualHook}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold text-[#4A6080] uppercase tracking-wider mb-1">{L.colorPalette}</p>
              <p className="text-sm text-[#0A1929] leading-relaxed">{result.colorPalette}</p>
            </div>
          </div>

          <hr style={{ borderColor: "#EEF6FB" }} />

          <div>
            <p className="text-[10px] font-semibold text-[#4A6080] uppercase tracking-wider mb-2">{L.keyElements}</p>
            <div className="flex flex-wrap gap-1.5">
              {result.keyVisualElements.map((el, i) => (
                <span key={i} className="px-2.5 py-1 text-xs rounded-full border"
                  style={{ background: "#EBF5FC", color: "#0B7FD4", borderColor: "#C8E4F4" }}>
                  {el}
                </span>
              ))}
            </div>
          </div>

          <button onClick={handleReanalyze} className="text-xs text-[#4A6080] hover:text-[#0B7FD4] transition-colors">
            {L.reanalyze}
          </button>
        </div>
      )}
    </div>
  );
}
