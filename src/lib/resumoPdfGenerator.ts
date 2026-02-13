import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 15;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_MM * 2;
const SECTION_GAP_MM = 4;

export async function generateResumoPdf() {
  const container = document.getElementById("resumo-pdf-content");
  if (!container) return;

  const sections = Array.from(
    container.querySelectorAll("[data-pdf-section]")
  ) as HTMLElement[];

  if (sections.length === 0) return;

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let currentY = MARGIN_MM;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    const scaleFactor = CONTENT_WIDTH_MM / (canvas.width / 2);
    const heightMM = (canvas.height / 2) * scaleFactor;

    const remaining = A4_HEIGHT_MM - MARGIN_MM - currentY;
    if (heightMM > remaining && currentY > MARGIN_MM) {
      pdf.addPage();
      currentY = MARGIN_MM;
    }

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", MARGIN_MM, currentY, CONTENT_WIDTH_MM, heightMM);
    currentY += heightMM + SECTION_GAP_MM;
  }

  pdf.save("resumo-executivo.pdf");
}
