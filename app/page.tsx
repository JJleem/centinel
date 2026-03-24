import SearchForm from "@/components/SearchForm";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#020810] flex flex-col items-center justify-center px-4 py-16">
      {/* Logo / Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4DAEDB] to-[#8B7FF5] flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Centinel
          </h1>
        </div>
        <p className="text-gray-400 text-base max-w-md mx-auto leading-relaxed">
          경쟁 게임 트렌드를 자동 분석하고,
          <br />
          AI가 즉시 광고 소재 5종을 생성합니다.
        </p>

        {/* Pipeline badges */}
        <div className="flex items-center justify-center gap-2 mt-6 text-xs flex-wrap">
          <span className="px-3 py-1 rounded-full bg-[#4DAEDB]/10 text-[#4DAEDB] border border-[#4DAEDB]/20">
            ① 트렌드 분석가
          </span>
          <span className="text-gray-700">→</span>
          <span className="px-3 py-1 rounded-full bg-[#8B7FF5]/10 text-[#8B7FF5] border border-[#8B7FF5]/20">
            ② 인사이트 요약가
          </span>
          <span className="text-gray-700">→</span>
          <span className="px-3 py-1 rounded-full bg-[#4DAEDB]/10 text-[#4DAEDB] border border-[#4DAEDB]/20">
            ③ 광고 카피라이터
          </span>
        </div>
      </div>

      {/* Search form */}
      <SearchForm />

      {/* Footer */}
      <p className="mt-16 text-gray-700 text-xs">
        Powered by Claude AI · Google Play 실시간 데이터 기반
      </p>
    </main>
  );
}
