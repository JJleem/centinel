import SearchForm from "@/components/SearchForm";
import HistorySection from "@/components/HistorySection";
import TrendChartsClient from "@/components/TrendChartsClient";
import Link from "next/link";

const PIPELINE = [
  { step: "①", label: "트렌드 분석", sub: "Sonnet",    color: "#0B7FD4" },
  { step: "②", label: "인사이트 앙상블", sub: "Haiku ×2", color: "#6B4EFF" },
  { step: "③", label: "광고 소재 앙상블", sub: "Haiku ×2", color: "#A855F7" },
  { step: "④", label: "오케스트레이터 선별", sub: "Sonnet", color: "#0B7FD4" },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F0F6FF" }}>

      {/* ── Navigation ── */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-[#E8F4FC] px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[10px] flex items-center justify-center shadow-md"
            style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
          >
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-[#0A1929] text-lg tracking-tight">Centinel</span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/임재준_AI애플리케이션엔지니어_과제전형.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4A6080] hover:text-[#0B7FD4] transition-colors px-3 py-1.5 border border-[#E8F4FC] hover:border-[#C8E4F4] rounded-[10px] hover:bg-[#F8FBFF]"
          >
            기획서
          </a>
          <a
            href="/임재준_Centinel_고도화보고서.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#4A6080] hover:text-[#6B4EFF] transition-colors px-3 py-1.5 border border-[#E8F4FC] hover:border-[#C4B8FF] rounded-[10px] hover:bg-[#F5F0FF]"
          >
            고도화 보고서
          </a>
          <Link
            href="/admin"
            className="text-xs text-[#4A6080] hover:text-[#0B7FD4] transition-colors px-3 py-1.5 border border-[#E8F4FC] hover:border-[#C8E4F4] rounded-[10px] hover:bg-[#F8FBFF]"
          >
            Admin
          </Link>
          <Link
            href="/history"
            className="text-sm text-[#4A6080] hover:text-[#0A1929] transition-colors px-3 py-1.5 border border-[#E8F4FC] hover:border-[#C8E4F4] rounded-[10px] hover:bg-[#F8FBFF]"
          >
            히스토리
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-16 pb-14 overflow-hidden"
        style={{
          background: "linear-gradient(160deg, #ffffff 0%, #EBF5FC 40%, #F0EEFF 100%)",
        }}
      >
        {/* Background blobs */}
        <div className="absolute top-[-80px] left-[-80px] w-[340px] h-[340px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #0B7FD4, transparent)" }} />
        <div className="absolute bottom-[-60px] right-[-60px] w-[280px] h-[280px] rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #6B4EFF, transparent)" }} />

        {/* Logo + title */}
        <div className="relative text-center mb-8 animate-[fadeUp_0.6s_ease_both]">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl blur-xl opacity-40 scale-110"
                style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icon.svg" alt="Centinel" width={60} height={60} className="relative rounded-2xl shadow-xl" />
            </div>
            <div>
              <h1 className="text-5xl font-bold text-[#0A1929] tracking-tight leading-none">Centinel</h1>
              <div className="mx-auto mt-3 h-[3px] w-20 rounded-full" style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }} />
            </div>
          </div>
          <p className="text-[#4A6080] text-base max-w-md mx-auto leading-relaxed mt-5">
            Google Play · App Store 게임 트렌드를 자동 분석하고,<br />
            <span className="text-[#0B7FD4] font-medium">AI가 즉시 광고 소재 6종</span>을 생성합니다.
          </p>
        </div>

        {/* Pipeline flow */}
        <div className="flex items-center justify-center gap-0 flex-wrap mb-10 animate-[fadeUp_0.7s_ease_both]">
          {PIPELINE.map((p, i) => (
            <span key={i} className="flex items-center gap-0">
              <span
                className="flex flex-col items-center px-3.5 py-2 rounded-[12px] border text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-default"
                style={{
                  background: `${p.color}0D`,
                  borderColor: `${p.color}33`,
                }}
              >
                <span className="text-[10px] font-bold mb-0.5" style={{ color: p.color }}>{p.step}</span>
                <span className="text-xs font-semibold text-[#0A1929] whitespace-nowrap">{p.label}</span>
                <span className="text-[10px] text-[#4A6080] whitespace-nowrap">{p.sub}</span>
              </span>
              {i < PIPELINE.length - 1 && (
                <span className="text-[#C8E4F4] text-sm px-1 shrink-0">→</span>
              )}
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full max-w-2xl animate-[fadeUp_0.8s_ease_both]">
          <SearchForm />
        </div>
      </section>

      {/* ── Trend Charts ── */}
      <section className="px-4 pt-10 pb-2" style={{ background: "#F0F6FF" }}>
        <div className="max-w-2xl mx-auto">
          <TrendChartsClient />
        </div>
      </section>

      {/* ── History section ── */}
      <section className="flex-1 px-4 pt-8 pb-10" style={{ background: "#F0F6FF" }}>
        <div className="max-w-2xl mx-auto">
          <HistorySection />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-[#E8F4FC] pb-10 pt-8 text-center space-y-2">
        <p className="text-[#4A6080] text-xs">Powered by Claude API · Real-time Analysis · Top 200 Charts</p>
        <p className="text-[#0A1929] text-sm font-semibold">Made by 임재준</p>
        <p className="text-[#4A6080] text-xs flex items-center justify-center gap-2 flex-wrap">
          <a href="mailto:leemjaejun@gmail.com" className="hover:text-[#0B7FD4] transition-colors">leemjaejun@gmail.com</a>
          <span className="text-[#C8E4F4]">·</span>
          <a href="https://github.com/JJleem" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B7FD4] transition-colors">github.com/JJleem</a>
          <span className="text-[#C8E4F4]">·</span>
          <a href="https://molt-ten.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B7FD4] transition-colors">molt-ten.vercel.app</a>
        </p>
      </footer>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
