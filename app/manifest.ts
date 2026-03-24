import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Centinel",
    short_name: "Centinel",
    description: "경쟁 게임 트렌드 자동 분석 → 광고 소재 5종 즉시 생성",
    start_url: "/",
    display: "standalone",
    background_color: "#020810",
    theme_color: "#020810",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
