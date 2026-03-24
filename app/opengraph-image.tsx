import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Centinel — 경쟁 게임 트렌드 분석 AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#020810",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
          position: "relative",
        }}
      >
        {/* Background grid decoration */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "radial-gradient(circle at 20% 50%, rgba(77,174,219,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(139,127,245,0.08) 0%, transparent 50%)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 18,
            background: "linear-gradient(135deg, #4DAEDB, #8B7FF5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <span style={{ color: "white", fontSize: 48, fontWeight: 900 }}>C</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 64,
            fontWeight: 800,
            color: "#ffffff",
            margin: 0,
            letterSpacing: "-1px",
          }}
        >
          Centinel
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: 26,
            color: "#4DAEDB",
            margin: "16px 0 0",
            fontWeight: 500,
          }}
        >
          경쟁 게임 트렌드 분석 AI
        </p>

        {/* Description */}
        <p
          style={{
            fontSize: 18,
            color: "#6b7280",
            margin: "12px 0 0",
            textAlign: "center",
            maxWidth: 700,
          }}
        >
          Google Play 실시간 수집 → 트렌드 분석 → 광고 소재 5종 즉시 생성
        </p>

        {/* Pipeline badges */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: 36,
          }}
        >
          {["① 트렌드 분석", "② 인사이트 요약", "③ 광고 소재 생성"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                border: "1px solid rgba(77,174,219,0.3)",
                background: "rgba(77,174,219,0.08)",
                color: "#4DAEDB",
                fontSize: 15,
                fontWeight: 500,
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p
          style={{
            position: "absolute",
            bottom: 32,
            fontSize: 14,
            color: "#374151",
          }}
        >
          Powered by Claude API · Made by 임재준
        </p>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
