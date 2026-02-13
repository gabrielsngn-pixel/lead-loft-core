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

  // Hide all elements marked as not for PDF (buttons, edit controls, etc.)
  const hiddenEls = Array.from(
    container.querySelectorAll("[data-pdf-hide]")
  ) as HTMLElement[];
  hiddenEls.forEach((el) => (el.style.display = "none"));

  const sections = Array.from(
    container.querySelectorAll("[data-pdf-section]")
  ) as HTMLElement[];

  if (sections.length === 0) {
    hiddenEls.forEach((el) => (el.style.display = ""));
    return;
  }

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let currentY = MARGIN_MM;

  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];

    // Set a fixed width on the section to prevent layout shrinking during capture
    const originalWidth = section.style.width;
    section.style.width = `${section.offsetWidth}px`;

    const canvas = await html2canvas(section, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      width: section.offsetWidth,
      onclone: (doc, clonedEl) => {
        // Hide interactive elements
        const clonedHidden = doc.querySelectorAll("[data-pdf-hide]");
        clonedHidden.forEach((el) => ((el as HTMLElement).style.display = "none"));

        // Fix metric card labels: increase font size and remove clipping
        const metricLabels = clonedEl.querySelectorAll("[data-pdf-metric-label]");
        metricLabels.forEach((el) => {
          const htmlEl = el as HTMLElement;
          htmlEl.style.fontSize = "9px";
          htmlEl.style.letterSpacing = "0.04em";
          htmlEl.style.overflow = "visible";
          htmlEl.style.whiteSpace = "nowrap";
          htmlEl.style.textOverflow = "unset";
        });

        // Replace Badge elements with green Loft styled spans
        const badges = doc.querySelectorAll("[data-pdf-badge]");
        badges.forEach((badge) => {
          const span = doc.createElement("span");
          span.textContent = badge.textContent;
          span.style.cssText =
            "font-size: 11px; padding: 5px 10px 3px 10px; border-radius: 4px; background: #115644; color: #ffffff; font-weight: 600; display: inline-block; line-height: 1.4; vertical-align: middle; margin-top: 2px;";
          badge.replaceWith(span);
        });

        // Remove chevron icons (collapse/expand indicators)
        const chevrons = doc.querySelectorAll("[data-pdf-hide-icon]");
        chevrons.forEach((el) => ((el as HTMLElement).style.display = "none"));
      },
    });

    // Restore original width
    section.style.width = originalWidth;

    const scaleFactor = CONTENT_WIDTH_MM / (canvas.width / 2);
    const heightMM = (canvas.height / 2) * scaleFactor;

    // Skip empty sections
    if (heightMM < 1) continue;

    const remaining = A4_HEIGHT_MM - MARGIN_MM - currentY;
    if (heightMM > remaining && currentY > MARGIN_MM) {
      pdf.addPage();
      currentY = MARGIN_MM;
    }

    const imgData = canvas.toDataURL("image/png");
    pdf.addImage(imgData, "PNG", MARGIN_MM, currentY, CONTENT_WIDTH_MM, heightMM);
    currentY += heightMM + SECTION_GAP_MM;
  }

  // Restore hidden elements
  hiddenEls.forEach((el) => (el.style.display = ""));

  pdf.save("resumo-executivo.pdf");
}
