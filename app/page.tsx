import SearchForm from "@/components/SearchForm";
import HistorySection from "@/components/HistorySection";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#F8FBFF" }}>
      {/* ── Navigation ── */}
      <nav className="bg-white border-b border-[#E8F4FC] px-6 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
          >
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <span className="font-bold text-[#0A1929] text-lg tracking-tight">Centinel</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/history"
            className="text-sm text-[#4A6080] hover:text-[#0A1929] transition-colors px-3 py-1.5 border border-[#E8F4FC] hover:border-[#C8E4F4] rounded-[10px]"
          >
            히스토리
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-white flex flex-col items-center justify-center px-4 pt-20 pb-16">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-4 mb-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="Centinel" width={52} height={52} className="rounded-xl shadow-md" />
            <h1 className="text-5xl font-bold text-[#0A1929] tracking-tight">Centinel</h1>
          </div>
          {/* Gradient underline */}
          <div
            className="mx-auto mt-3 mb-5 h-[3px] w-16 rounded-full"
            style={{ background: "linear-gradient(135deg, #0B7FD4, #6B4EFF)" }}
          />
          <p className="text-[#4A6080] text-base max-w-sm mx-auto leading-relaxed">
            경쟁 게임 트렌드를 자동 분석하고,<br />
            AI가 즉시 광고 소재 5종을 생성합니다.
          </p>
        </div>

        {/* Pipeline badges */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-10">
          {[
            "① 트렌드 분석 (Sonnet)",
            "② 인사이트 앙상블 (Haiku ×2)",
            "③ 광고 소재 앙상블 (Haiku ×2)",
            "④ 오케스트레이터 선별 (Sonnet)",
          ].map((label, i, arr) => (
            <span key={i} className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-white border border-[#C8E4F4] text-[#0B7FD4] text-xs font-medium shadow-sm">
                {label}
              </span>
              {i < arr.length - 1 && (
                <span className="text-[#C8E4F4] text-xs">→</span>
              )}
            </span>
          ))}
        </div>

        {/* Search */}
        <div className="w-full max-w-2xl">
          <SearchForm />
        </div>
      </section>

      {/* ── History section ── */}
      <section className="flex-1 px-4 pt-14 pb-10" style={{ background: "#F8FBFF" }}>
        <div className="max-w-2xl mx-auto">
          <HistorySection />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-[#E8F4FC] pb-10 pt-8 text-center space-y-2">
        <p className="text-[#4A6080] text-xs">Powered by Claude API · Real-time Analysis</p>
        <p className="text-[#0A1929] text-sm font-semibold">Made by 임재준</p>
        <p className="text-[#4A6080] text-xs flex items-center justify-center gap-2 flex-wrap">
          <a href="mailto:leemjaejun@gmail.com" className="hover:text-[#0B7FD4] transition-colors">leemjaejun@gmail.com</a>
          <span className="text-[#C8E4F4]">·</span>
          <a href="https://github.com/JJleem" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B7FD4] transition-colors">github.com/JJleem</a>
          <span className="text-[#C8E4F4]">·</span>
          <a href="https://molt-ten.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-[#0B7FD4] transition-colors">molt-ten.vercel.app</a>
        </p>
      </footer>
    </div>
  );
}
