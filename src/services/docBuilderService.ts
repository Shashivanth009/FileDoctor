import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { ProcessingResult } from '@/types';

export interface DocSection {
  id: string;
  type: 'heading' | 'paragraph' | 'bullet' | 'table' | 'callout';
  title?: string;
  text?: string;
  bullets?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  calloutType?: 'info' | 'important' | 'warning';
}

export interface DocumentModel {
  title: string;
  subtitle?: string;
  author?: string;
  date?: string;
  organization?: string;
  pageSize: 'a4' | 'letter';
  sections: DocSection[];
  watermarkText?: string;
  showPageNumbers?: boolean;
}

/**
 * Word wraps text into lines fitting within a maximum width
 */
function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    let width = 0;
    try {
      width = font.widthOfTextAtSize(testLine, fontSize);
    } catch {
      width = testLine.length * (fontSize * 0.55);
    }

    if (width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Compiles a rich DocumentModel into a high-fidelity vector PDF
 */
export async function buildPdfFromDocument(docModel: DocumentModel): Promise<ProcessingResult> {
  const startTime = performance.now();

  try {
    const pdfDoc = await PDFDocument.create();
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const obliqueFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    const isA4 = docModel.pageSize === 'a4';
    const pageWidth = isA4 ? 595.28 : 612;
    const pageHeight = isA4 ? 841.89 : 792;
    const margin = 50;
    const contentWidth = pageWidth - margin * 2;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;

    const checkNewPage = (neededHeight: number) => {
      if (currentY - neededHeight < margin + 40) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        currentY = pageHeight - margin;
      }
    };

    // Header rule & Brand watermark
    if (docModel.organization) {
      page.drawText(docModel.organization.toUpperCase(), {
        x: margin,
        y: currentY,
        size: 9,
        font: boldFont,
        color: rgb(0.28, 0.42, 1.0),
      });
      currentY -= 16;
    }

    // Document Title
    const titleLines = wrapText(docModel.title, contentWidth, 22, boldFont);
    for (const line of titleLines) {
      checkNewPage(26);
      page.drawText(line, {
        x: margin,
        y: currentY,
        size: 22,
        font: boldFont,
        color: rgb(0.08, 0.12, 0.22),
      });
      currentY -= 26;
    }

    // Subtitle
    if (docModel.subtitle) {
      currentY -= 4;
      const subLines = wrapText(docModel.subtitle, contentWidth, 12, obliqueFont);
      for (const line of subLines) {
        checkNewPage(16);
        page.drawText(line, {
          x: margin,
          y: currentY,
          size: 12,
          font: obliqueFont,
          color: rgb(0.35, 0.42, 0.52),
        });
        currentY -= 16;
      }
    }

    // Metadata Bar (Author, Date)
    if (docModel.author || docModel.date) {
      currentY -= 6;
      const metaText = [
        docModel.author ? `Prepared by: ${docModel.author}` : '',
        docModel.date ? `Date: ${docModel.date}` : '',
      ]
        .filter(Boolean)
        .join('   |   ');

      page.drawText(metaText, {
        x: margin,
        y: currentY,
        size: 9,
        font: regularFont,
        color: rgb(0.45, 0.52, 0.62),
      });
      currentY -= 14;
    }

    // Horizontal Separator Line
    currentY -= 8;
    page.drawLine({
      start: { x: margin, y: currentY },
      end: { x: pageWidth - margin, y: currentY },
      thickness: 1.5,
      color: rgb(0.85, 0.88, 0.94),
    });
    currentY -= 24;

    // Sections Loop
    for (const section of docModel.sections) {
      if (section.type === 'heading') {
        checkNewPage(36);
        currentY -= 10;
        page.drawText(section.text || 'Section Heading', {
          x: margin,
          y: currentY,
          size: 14,
          font: boldFont,
          color: rgb(0.12, 0.18, 0.32),
        });
        currentY -= 18;
      } else if (section.type === 'paragraph') {
        const lines = wrapText(section.text || '', contentWidth, 10.5, regularFont);
        for (const line of lines) {
          checkNewPage(16);
          page.drawText(line, {
            x: margin,
            y: currentY,
            size: 10.5,
            font: regularFont,
            color: rgb(0.18, 0.22, 0.30),
          });
          currentY -= 15;
        }
        currentY -= 8;
      } else if (section.type === 'bullet') {
        const bullets = section.bullets || [];
        for (const item of bullets) {
          const lines = wrapText(item, contentWidth - 20, 10, regularFont);
          for (let li = 0; li < lines.length; li++) {
            checkNewPage(15);
            if (li === 0) {
              page.drawText('•', {
                x: margin + 4,
                y: currentY,
                size: 14,
                font: boldFont,
                color: rgb(0.28, 0.42, 1.0),
              });
            }
            page.drawText(lines[li], {
              x: margin + 18,
              y: currentY,
              size: 10,
              font: regularFont,
              color: rgb(0.18, 0.22, 0.30),
            });
            currentY -= 14;
          }
        }
        currentY -= 8;
      } else if (section.type === 'callout') {
        checkNewPage(50);
        const alertText = section.text || '';
        const lines = wrapText(alertText, contentWidth - 24, 10, obliqueFont);
        const boxHeight = lines.length * 14 + 18;

        page.drawRectangle({
          x: margin,
          y: currentY - boxHeight + 12,
          width: contentWidth,
          height: boxHeight,
          color: rgb(0.96, 0.98, 1.0),
          borderColor: rgb(0.75, 0.82, 0.98),
          borderWidth: 1,
        });

        let boxY = currentY - 2;
        for (const line of lines) {
          page.drawText(line, {
            x: margin + 12,
            y: boxY,
            size: 10,
            font: obliqueFont,
            color: rgb(0.15, 0.25, 0.45),
          });
          boxY -= 14;
        }
        currentY -= boxHeight + 14;
      } else if (section.type === 'table') {
        const headers = section.tableHeaders || ['Item', 'Description', 'Quantity', 'Amount'];
        const rows = section.tableRows || [];
        const colWidth = contentWidth / headers.length;
        const rowHeight = 20;

        checkNewPage(rowHeight * (rows.length + 1) + 20);

        // Header Background
        page.drawRectangle({
          x: margin,
          y: currentY - rowHeight + 4,
          width: contentWidth,
          height: rowHeight,
          color: rgb(0.92, 0.95, 0.99),
        });

        // Header Texts
        headers.forEach((h, ci) => {
          page.drawText(h, {
            x: margin + ci * colWidth + 6,
            y: currentY - 10,
            size: 9.5,
            font: boldFont,
            color: rgb(0.12, 0.18, 0.32),
          });
        });
        currentY -= rowHeight;

        // Rows
        for (const r of rows) {
          checkNewPage(rowHeight);
          page.drawLine({
            start: { x: margin, y: currentY + 4 },
            end: { x: pageWidth - margin, y: currentY + 4 },
            thickness: 0.5,
            color: rgb(0.88, 0.90, 0.94),
          });

          r.forEach((cell, ci) => {
            page.drawText(cell || '', {
              x: margin + ci * colWidth + 6,
              y: currentY - 10,
              size: 9,
              font: regularFont,
              color: rgb(0.20, 0.24, 0.32),
            });
          });
          currentY -= rowHeight;
        }
        currentY -= 12;
      }
    }

    // Footers & Page Numbers
    const allPages = pdfDoc.getPages();
    const totalPages = allPages.length;

    for (let i = 0; i < totalPages; i++) {
      const p = allPages[i];

      // Watermark if specified
      if (docModel.watermarkText) {
        p.drawText(docModel.watermarkText.toUpperCase(), {
          x: pageWidth / 2 - 120,
          y: pageHeight / 2 - 40,
          size: 42,
          font: boldFont,
          color: rgb(0.88, 0.90, 0.94),
          rotate: degrees(45),
        });
      }

      if (docModel.showPageNumbers !== false) {
        const pageNumText = `Page ${i + 1} of ${totalPages}`;
        p.drawText(pageNumText, {
          x: pageWidth - margin - 60,
          y: 25,
          size: 8.5,
          font: regularFont,
          color: rgb(0.55, 0.60, 0.70),
        });
      }

      p.drawText('Generated with FileDoctor Privacy Engine', {
        x: margin,
        y: 25,
        size: 8,
        font: regularFont,
        color: rgb(0.55, 0.60, 0.70),
      });
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const outputBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    const outputFilename = `${docModel.title.replace(/\s+/g, '_')}_document.pdf`;

    return {
      success: true,
      outputBlob,
      outputFilename,
      originalSize: 0,
      outputSize: outputBlob.size,
      processingTime: performance.now() - startTime,
    };
  } catch (err: any) {
    return {
      success: false,
      originalSize: 0,
      processingTime: performance.now() - startTime,
      error: err.message || 'Failed to generate PDF document',
    };
  }
}

/**
 * Exports DocumentModel as structured Markdown text
 */
export function exportDocumentAsMarkdown(doc: DocumentModel): string {
  let md = `# ${doc.title}\n\n`;
  if (doc.subtitle) md += `*${doc.subtitle}*\n\n`;
  if (doc.author || doc.date) {
    md += `**Author:** ${doc.author || 'Anonymous'} | **Date:** ${doc.date || new Date().toLocaleDateString()}\n\n`;
  }
  md += `---\n\n`;

  for (const s of doc.sections) {
    if (s.type === 'heading') {
      md += `## ${s.text}\n\n`;
    } else if (s.type === 'paragraph') {
      md += `${s.text}\n\n`;
    } else if (s.type === 'bullet') {
      for (const b of s.bullets || []) {
        md += `- ${b}\n`;
      }
      md += '\n';
    } else if (s.type === 'callout') {
      md += `> **Note:** ${s.text}\n\n`;
    } else if (s.type === 'table') {
      const headers = s.tableHeaders || [];
      const rows = s.tableRows || [];
      md += `| ${headers.join(' | ')} |\n`;
      md += `| ${headers.map(() => '---').join(' | ')} |\n`;
      for (const r of rows) {
        md += `| ${r.join(' | ')} |\n`;
      }
      md += '\n';
    }
  }

  return md;
}
