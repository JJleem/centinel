"use client";

import dynamic from "next/dynamic";

const TrendCharts = dynamic(() => import("@/components/TrendCharts"), {
  ssr: false,
  loading: () => (
    <div className="w-full">
      <div className="h-5 w-40 rounded-full animate-pulse mb-3" style={{ background: "#EBF5FC" }} />
      <div className="grid grid-cols-4 gap-2.5">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-[12px] animate-pulse" style={{ background: "#EBF5FC" }} />
        ))}
      </div>
    </div>
  ),
});

export default function TrendChartsClient() {
  return <TrendCharts />;
}
