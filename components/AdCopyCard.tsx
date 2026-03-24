"use client";

import { useState } from "react";
import { AdCopy } from "@/types";

const TONE_LABELS = ["흥분", "도전", "호기심", "FOMO", "단순함"];
const TONE_COLORS = [
  "text-[#4DAEDB]",
  "text-[#8B7FF5]",
  "text-emerald-400",
  "text-orange-400",
  "text-pink-400",
];

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
      className="text-xs px-2 py-1 rounded border border-[#1E3A5F] hover:border-[#4DAEDB] text-gray-500 hover:text-[#4DAEDB] transition-colors"
    >
      {copied ? "✓ 복사됨" : `${label} 복사`}
    </button>
  );
}

export default function AdCopyCard({ adCopy, index }: Props) {
  const [allCopied, setAllCopied] = useState(false);

  const fullText = `[훅] ${adCopy.hook}\n\n[메인 카피] ${adCopy.mainCopy}\n\n[숏폼 대본] ${adCopy.shortFormScript}\n\n[앱스토어 설명] ${adCopy.appStoreDescription}\n\n[타겟 키워드] ${adCopy.targetKeywords.join(", ")}`;

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(fullText);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  return (
    <div className="pdf-card bg-[#0A1628] border border-[#1E3A5F] rounded-2xl p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-600">
            #{String(index + 1).padStart(2, "0")}
          </span>
          <span className={`text-xs font-semibold ${TONE_COLORS[index % 5]}`}>
            {TONE_LABELS[index % 5]}
          </span>
        </div>
        <button
          onClick={handleCopyAll}
          className="no-print text-xs px-3 py-1 rounded-lg border border-[#1E3A5F] hover:border-[#4DAEDB] text-gray-500 hover:text-[#4DAEDB] transition-colors"
        >
          {allCopied ? "✓ 전체 복사됨" : "전체 복사"}
        </button>
      </div>

      {/* Hook */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[#4DAEDB] uppercase tracking-wider">
            훅
          </span>
          <CopyButton text={adCopy.hook} label="훅" />
        </div>
        <p className="text-white font-semibold text-base">{adCopy.hook}</p>
      </div>

      {/* Main copy */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-[#8B7FF5] uppercase tracking-wider">
            메인 카피
          </span>
          <CopyButton text={adCopy.mainCopy} label="메인" />
        </div>
        <p className="text-gray-300 text-sm leading-relaxed">
          {adCopy.mainCopy}
        </p>
      </div>

      {/* Short-form script */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-emerald-400 uppercase tracking-wider">
            숏폼 대본
          </span>
          <CopyButton text={adCopy.shortFormScript} label="대본" />
        </div>
        <p className="text-gray-400 text-sm leading-relaxed italic">
          {adCopy.shortFormScript}
        </p>
      </div>

      {/* App store description */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-orange-400 uppercase tracking-wider">
            앱스토어 설명
          </span>
          <CopyButton text={adCopy.appStoreDescription} label="설명" />
        </div>
        <p className="text-gray-300 text-sm">{adCopy.appStoreDescription}</p>
      </div>

      {/* Target keywords */}
      <div>
        <span className="text-xs font-medium text-pink-400 uppercase tracking-wider block mb-2">
          타겟 키워드
        </span>
        <div className="flex flex-wrap gap-1.5">
          {adCopy.targetKeywords.map((kw) => (
            <span
              key={kw}
              className="px-2 py-0.5 bg-[#020810] border border-[#1E3A5F] text-gray-400 text-xs rounded-full"
            >
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
