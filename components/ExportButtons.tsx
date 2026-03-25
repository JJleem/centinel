"use client";

import { useState } from "react";
import { AnalysisResult } from "@/types";

const TONE_LABELS = ["흥분", "도전", "호기심", "FOMO", "단순함", "공감/스토리"];

function buildMarkdown(result: AnalysisResult): string {
  const date = new Date(result.createdAt).toLocaleDateString("ko-KR");
  const { insight, adCopies, games, query } = result;

  const lines: string[] = [
    `# ${query} 트렌드 분석 결과`,
    `> 분석일: ${date} | 게임 수: ${games.length}개`,
    ``,
    `## 🔍 트렌드 인사이트`,
    `**키워드:** ${insight.topKeywords.map((k) => `#${k}`).join(" ")}`,
    ``,
    ...insight.summary.map((s, i) => `${i + 1}. ${s}`),
  ];

  if (insight.notableMechanics?.length) {
    lines.push(``, `### 주목할 메카닉`);
    insight.notableMechanics.forEach((m) => lines.push(`- ${m}`));
  }
  if (insight.revenueModelTrends?.length) {
    lines.push(``, `### 수익 모델 트렌드`);
    insight.revenueModelTrends.forEach((r) => lines.push(`- ${r}`));
  }
  if (insight.marketOpportunity) {
    lines.push(``, `### 시장 기회`, insight.marketOpportunity);
  }

  lines.push(``, `## 🎯 광고 소재 6종`);
  adCopies.forEach((copy, i) => {
    const toneLabel = TONE_LABELS[i % 6];
    lines.push(
      ``,
      `### #${String(i + 1).padStart(2, "0")} ${toneLabel}`,
      `**훅:** ${copy.hook}`,
      `**메인 카피:** ${copy.mainCopy}`,
      `**숏폼 대본:** ${copy.shortFormScript}`,
      `**앱스토어 설명:** ${copy.appStoreDescription}`,
      `**타겟 키워드:** ${copy.targetKeywords.join(", ")}`,
      `**심리 태그:** ${copy.psychologicalTags?.join(", ") ?? "-"}`,
      `**예상 CTR:** ${copy.expectedCTR ?? "-"}/10`,
      `**이미지 프롬프트:** ${copy.imagePrompt ?? "-"}`,
    );
  });

  lines.push(
    ``,
    `## 📊 분석 게임 목록`,
    `| 게임명 | 개발사 | 평점 | 장르 |`,
    `|--------|--------|------|------|`,
    ...games.map((g) => `| ${g.title} | ${g.developer} | ${g.score.toFixed(1)} | ${g.genre} |`),
  );

  return lines.join("\n");
}

function buildCSV(result: AnalysisResult): string {
  const header = ["톤", "훅", "메인카피", "숏폼대본", "앱스토어설명", "타겟키워드", "심리태그", "예상CTR", "이미지프롬프트"];
  const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;

  const rows = result.adCopies.map((copy, i) => [
    TONE_LABELS[i % 6],
    copy.hook,
    copy.mainCopy,
    copy.shortFormScript,
    copy.appStoreDescription,
    copy.targetKeywords.join(", "),
    copy.psychologicalTags?.join(", ") ?? "",
    String(copy.expectedCTR ?? ""),
    copy.imagePrompt ?? "",
  ].map(escape).join(","));

  return [header.map(escape).join(","), ...rows].join("\n");
}

interface Props {
  result: AnalysisResult;
}

export default function ExportButtons({ result }: Props) {
  const [notionCopied, setNotionCopied] = useState(false);

  const handleNotionCopy = async () => {
    await navigator.clipboard.writeText(buildMarkdown(result));
    setNotionCopied(true);
    setTimeout(() => setNotionCopied(false), 2000);
  };

  const handleCSVDownload = () => {
    const csv = buildCSV(result);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const date = new Date(result.createdAt).toISOString().slice(0, 10);
    a.href = url;
    a.download = `centinel_${result.query}_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <button
        onClick={handleNotionCopy}
        className="no-print text-sm px-4 py-1.5 border rounded-[10px] transition-all whitespace-nowrap hover:bg-[#EBF5FC]"
        style={{ borderColor: "#0B7FD4", color: "#0B7FD4", background: "white" }}
      >
        {notionCopied ? "✓ 복사됨" : "📋 노션으로 복사"}
      </button>
      <button
        onClick={handleCSVDownload}
        className="no-print text-sm px-4 py-1.5 border rounded-[10px] transition-all whitespace-nowrap hover:bg-[#E6FAF5]"
        style={{ borderColor: "#00B894", color: "#00B894", background: "white" }}
      >
        📊 CSV 저장
      </button>
    </>
  );
}
