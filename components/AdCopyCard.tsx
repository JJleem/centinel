"use client";

import { useState, useEffect, useRef } from "react";
import { AdCopy } from "@/types";

const TONE_LABELS = ["흥분", "도전", "호기심", "FOMO", "단순함", "공감/스토리"];

const TONE_COLORS: Record<number, { bg: string; text: string; border: string }> = {
  0: { bg: "#EBF5FC", text: "#0B7FD4", border: "#C8E4F4" },
  1: { bg: "#F0EEFF", text: "#6B4EFF", border: "#D4C9FF" },
  2: { bg: "#E6FAF5", text: "#00B894", border: "#B2EADC" },
  3: { bg: "#FEF0ED", text: "#E17055", border: "#F9C9BE" },
  4: { bg: "#E6FAFA", text: "#00CEC9", border: "#B2E8E6" },
  5: { bg: "#FFF0F0", text: "#FF7675", border: "#FFCACA" },
};

const SECTION_LABEL_COLOR: Record<string, string> = {
  hook:   "#0B7FD4",
  main:   "#6B4EFF",
  script: "#00B894",
  store:  "#E17055",
  kw:     "#00CEC9",
};

interface Props {
  adCopy: AdCopy;
  index: number;
}

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-xs px-2 py-1 rounded-[8px] border transition-colors hover:opacity-80"
      style={{ background: "#EBF5FC", borderColor: "#C8E4F4", color: "#0B7FD4" }}
    >
      {copied ? "✓ 복사됨" : `${label} 복사`}
    </button>
  );
}

function CTRBar({ score }: { score: number }) {
  const [width, setWidth] = useState(0);
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger animation after mount
    const timer = setTimeout(() => setWidth((score / 10) * 100), 80);
    return () => clearTimeout(timer);
  }, [score]);

  const scoreColor =
    score >= 8 ? "#00B894" :
    score >= 6 ? "#0B7FD4" :
                 "#E17055";

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs text-[#4A6080]">예상 CTR (클릭률)</span>
        <span className="text-sm font-bold" style={{ color: scoreColor }}>
          {score.toFixed(1)} <span className="text-[#4A6080] font-normal text-xs">/ 10</span>
        </span>
      </div>
      <div className="h-[6px] rounded-full overflow-hidden" style={{ background: "#E8F4FC" }} ref={barRef}>
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${width}%`,
            background: "linear-gradient(90deg, #0B7FD4, #6B4EFF)",
          }}
        />
      </div>
      <p className="mt-1.5 text-[10px] italic leading-relaxed" style={{ color: "#94A3B8" }}>
        ※ 실제 CTR 데이터가 아닌 AI가 트렌드 적합성 기반으로 예측한 상대적 점수입니다. 실제 서비스에서는 Sensor Tower 등 광고 집행 데이터와 연동하여 정확도를 높일 예정입니다.
      </p>
    </div>
  );
}

export default function AdCopyCard({ adCopy, index }: Props) {
  const [allCopied, setAllCopied] = useState(false);
  const tone = index % 6;
  const toneColor = TONE_COLORS[tone];

  const fullText = `[훅] ${adCopy.hook}\n\n[메인 카피] ${adCopy.mainCopy}\n\n[숏폼 대본] ${adCopy.shortFormScript}\n\n[앱스토어 설명] ${adCopy.appStoreDescription}\n\n[타겟 키워드] ${adCopy.targetKeywords.join(", ")}`;

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(fullText);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="pdf-card bg-white border border-[#E8F4FC] rounded-[14px] flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-100/60 hover:border-[#C8E4F4] shadow-sm overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between px-5 py-3 border-b border-[#F0F7FF] gap-2">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="text-[#4A6080] text-xs font-bold shrink-0">#{String(index + 1).padStart(2, "0")}</span>
          <span
            className="text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0"
            style={{ background: toneColor.bg, color: toneColor.text, borderColor: toneColor.border }}
          >
            {TONE_LABELS[tone]}
          </span>
          {/* Psychological tags */}
          {adCopy.psychologicalTags?.map((tag) => (
            <span
              key={tag}
              className="text-[11px] font-medium px-2 py-0.5 rounded-full border"
              style={{ background: "#F8FBFF", color: "#4A6080", borderColor: "#E8F4FC" }}
            >
              {tag}
            </span>
          ))}
        </div>
        <button
          onClick={handleCopyAll}
          className="no-print text-xs px-3 py-1 rounded-[8px] border transition-colors hover:opacity-80 shrink-0"
          style={{ background: "#EBF5FC", borderColor: "#C8E4F4", color: "#0B7FD4" }}
        >
          {allCopied ? "✓ 전체 복사됨" : "전체 복사"}
        </button>
      </div>

      <div className="p-5 flex flex-col gap-4 flex-1">
        {/* Hook */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: SECTION_LABEL_COLOR.hook }}>훅</span>
            <CopyButton text={adCopy.hook} label="훅" />
          </div>
          <p className="text-[#0A1929] font-bold text-lg leading-snug">{adCopy.hook}</p>
        </div>

        {/* Main copy */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: SECTION_LABEL_COLOR.main }}>메인 카피</span>
            <CopyButton text={adCopy.mainCopy} label="메인" />
          </div>
          <p className="text-[#0A1929] text-sm leading-relaxed">{adCopy.mainCopy}</p>
        </div>

        {/* Short-form script */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: SECTION_LABEL_COLOR.script }}>숏폼 대본</span>
            <CopyButton text={adCopy.shortFormScript} label="대본" />
          </div>
          <p className="text-[#4A6080] text-sm leading-relaxed italic">{adCopy.shortFormScript}</p>
        </div>

        {/* App store */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: SECTION_LABEL_COLOR.store }}>앱스토어 설명</span>
            <CopyButton text={adCopy.appStoreDescription} label="설명" />
          </div>
          <p className="text-[#0A1929] text-sm">{adCopy.appStoreDescription}</p>
        </div>

        {/* Keywords */}
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: SECTION_LABEL_COLOR.kw }}>타겟 키워드</span>
          <div className="flex flex-wrap gap-1.5">
            {adCopy.targetKeywords.map((kw) => (
              <span key={kw} className="px-2 py-0.5 text-[#1A7AAF] text-xs rounded-full border" style={{ background: "#EBF5FC", borderColor: "#C8E4F4" }}>
                {kw}
              </span>
            ))}
          </div>
        </div>

        {/* CTR bar */}
        {adCopy.expectedCTR != null && (
          <CTRBar score={adCopy.expectedCTR} />
        )}

        {/* Image Prompt */}
        {adCopy.imagePrompt && (
          <div className="rounded-[10px] p-3" style={{ background: "#F0F7FF" }}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-[#0B7FD4]">🎨 이미지 프롬프트</span>
              <CopyButton text={adCopy.imagePrompt} label="프롬프트" />
            </div>
            <p className="text-[#4A6080] text-xs leading-relaxed italic">{adCopy.imagePrompt}</p>
            <p className="mt-1.5 text-[10px] italic leading-relaxed" style={{ color: "#94A3B8" }}>
              ※ 현재 프롬프트는 방향성 참고용으로 미비한 수준입니다. 실제 프로덕션에서는 디자이너 시안 검토, 브랜드 가이드라인 준수, A/B 테스트를 통한 소재 검증을 권장합니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
