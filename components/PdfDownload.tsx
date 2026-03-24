"use client";

import { useState } from "react";
import { AnalysisResult } from "@/types";

interface Props {
  result: AnalysisResult;
  targetId: string;
}

export default function PdfDownload({ result, targetId }: Props) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      const element = document.getElementById(targetId);
      if (!element) return;

      const canvas = await html2canvas(element, {
        backgroundColor: "#020810",
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        windowWidth: element.scrollWidth,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const filename = `centinel-${result.query.replace(/\s+/g, "-")}-${new Date().toISOString().slice(0, 10)}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="text-sm px-4 py-1.5 border border-[#1E3A5F] hover:border-[#4DAEDB] text-gray-400 hover:text-[#4DAEDB] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {loading ? "생성 중..." : "📄 PDF 저장"}
    </button>
  );
}
