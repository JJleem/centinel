"use client";

export default function PdfDownload() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="no-print text-sm px-4 py-1.5 border border-[#E8F4FC] hover:border-[#C8E4F4] text-[#4A6080] hover:text-[#0B7FD4] rounded-[10px] transition-colors whitespace-nowrap bg-white"
    >
      PDF 저장
    </button>
  );
}
