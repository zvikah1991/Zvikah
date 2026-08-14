import type { jsPDF } from 'jspdf';

const PAGE_WIDTH_MM = 210;
const PAGE_HEIGHT_MM = 297;
const MARGIN_MM = 10;
const CONTENT_WIDTH_MM = PAGE_WIDTH_MM - MARGIN_MM * 2;

/**
 * html2canvas מצריך שהאלמנט יהיה ממש בעץ ה-DOM ומצויר (לא display:none), לכן
 * מציבים אותו מחוץ לגבולות המסך הנראים במקום להסתיר אותו.
 */
function mountOffscreen(html: string): HTMLDivElement {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.top = '0';
  container.style.right = '-10000px';
  container.style.width = '1050px';
  container.style.background = '#ffffff';
  container.style.direction = 'rtl';
  container.style.fontFamily = "'Heebo', sans-serif";
  container.innerHTML = html;
  document.body.appendChild(container);
  return container;
}

async function captureToPdfPages(doc: jsPDF, container: HTMLElement, isFirstPage: boolean) {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
  const imgData = canvas.toDataURL('image/png');
  const imgHeightMm = (canvas.height * CONTENT_WIDTH_MM) / canvas.width;

  let heightLeftMm = imgHeightMm;
  let positionMm = 0;
  let first = true;

  while (heightLeftMm > 0) {
    if (!isFirstPage || !first) doc.addPage();
    doc.addImage(imgData, 'PNG', MARGIN_MM, MARGIN_MM - positionMm, CONTENT_WIDTH_MM, imgHeightMm);
    heightLeftMm -= PAGE_HEIGHT_MM - MARGIN_MM * 2;
    positionMm += PAGE_HEIGHT_MM - MARGIN_MM * 2;
    first = false;
  }
}

export async function exportSectionsToPdf(sectionsHtml: string[], filename: string) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  for (let i = 0; i < sectionsHtml.length; i++) {
    const container = mountOffscreen(sectionsHtml[i]);
    try {
      await captureToPdfPages(doc, container, i === 0);
    } finally {
      container.remove();
    }
  }

  doc.save(filename);
}

export function reportPageStyles(): string {
  return `
    <style>
      .rpt { padding: 24px; color: #0f172a; }
      .rpt h1 { font-size: 20px; font-weight: 800; margin: 0 0 2px; }
      .rpt .subtitle { font-size: 13px; color: #64748b; margin: 0 0 18px; }
      .rpt table { width: 100%; border-collapse: collapse; font-size: 12px; }
      .rpt th { background: #0f172a; color: #fff; text-align: right; padding: 8px 10px; font-weight: 700; }
      .rpt td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; }
      .rpt tr:nth-child(even) td { background: #f8fafc; }
      .rpt .totals-row td { font-weight: 800; background: #eff6ff; border-top: 2px solid #2563eb; }
      .rpt .meta { display: flex; justify-content: space-between; margin-bottom: 14px; font-size: 12px; color: #475569; }
    </style>
  `;
}
