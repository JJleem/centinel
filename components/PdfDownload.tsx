"use client";

export default function PdfDownload() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="no-print text-sm px-4 py-1.5 border border-[#1E3A5F] hover:border-[#4DAEDB] text-gray-400 hover:text-[#4DAEDB] rounded-lg transition-colors whitespace-nowrap"
    >
      📄 PDF 저장
    </button>
  );
}
