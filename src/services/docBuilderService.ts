import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import { ProcessingResult } from '@/types';

export interface DocStat {
  label: string;
  value: string;
  hint?: string;
}

export interface DocSection {
  id: string;
  type: 'heading' | 'paragraph' | 'bullet' | 'table' | 'callout' | 'image' | 'signature' | 'divider' | 'stat-grid';
  title?: string;
  text?: string;
  bullets?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
  calloutType?: 'info' | 'important' | 'warning';
  imageUrl?: string;
  imageCaption?: string;
  imageWidth?: number;
  signatureDataUrl?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  dateSigned?: string;
  stats?: DocStat[];
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
  stampBadge?: 'PAID' | 'CONFIDENTIAL' | 'APPROVED' | 'DRAFT' | 'ORIGINAL' | 'VERIFIED' | 'SAMPLE' | 'NONE';
  accentColor?: string;
  fontTheme?: 'sans' | 'serif' | 'mono';
}

/**
 * Word wraps text into lines fitting within a maximum width
 */
function wrapText(text: string, maxWidth: number, fontSize: number, font: any): string[] {
  if (!text) return [];
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
 * Converts a base64 Data URI to a Uint8Array for pdf-lib embedding
 */
function dataUriToUint8Array(dataUri: string): { bytes: Uint8Array; isPng: boolean } {
  const parts = dataUri.split(',');
  const isPng = parts[0]?.includes('image/png') ?? false;
  const base64Str = parts[1] || parts[0];
  const binaryStr = typeof atob !== 'undefined' ? atob(base64Str) : Buffer.from(base64Str, 'base64').toString('binary');
  const len = binaryStr.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return { bytes, isPng };
}

/**
 * Compiles a rich DocumentModel into a high-fidelity vector PDF
 */
export async function buildPdfFromDocument(docModel: DocumentModel): Promise<ProcessingResult> {
  const startTime = performance.now();

  try {
    const pdfDoc = await PDFDocument.create();

    // Font selection
    let regFontType = StandardFonts.Helvetica;
    let boldFontType = StandardFonts.HelveticaBold;
    let oblFontType = StandardFonts.HelveticaOblique;

    if (docModel.fontTheme === 'serif') {
      regFontType = StandardFonts.TimesRoman;
      boldFontType = StandardFonts.TimesRomanBold;
      oblFontType = StandardFonts.TimesRomanItalic;
    } else if (docModel.fontTheme === 'mono') {
      regFontType = StandardFonts.Courier;
      boldFontType = StandardFonts.CourierBold;
      oblFontType = StandardFonts.CourierOblique;
    }

    const regularFont = await pdfDoc.embedFont(regFontType);
    const boldFont = await pdfDoc.embedFont(boldFontType);
    const obliqueFont = await pdfDoc.embedFont(oblFontType);

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

    // Header stamp badge in top-right of page 1 if specified
    if (docModel.stampBadge && docModel.stampBadge !== 'NONE') {
      const stampText = docModel.stampBadge;
      let badgeR = 0.15;
      let badgeG = 0.35;
      let badgeB = 0.85;

      if (stampText === 'PAID' || stampText === 'APPROVED' || stampText === 'VERIFIED') {
        badgeR = 0.05;
        badgeG = 0.55;
        badgeB = 0.35;
      } else if (stampText === 'CONFIDENTIAL') {
        badgeR = 0.85;
        badgeG = 0.15;
        badgeB = 0.15;
      } else if (stampText === 'DRAFT' || stampText === 'SAMPLE') {
        badgeR = 0.85;
        badgeG = 0.55;
        badgeB = 0.10;
      }

      page.drawRectangle({
        x: pageWidth - margin - 100,
        y: currentY - 14,
        width: 100,
        height: 26,
        borderColor: rgb(badgeR, badgeG, badgeB),
        borderWidth: 1.5,
        color: rgb(0.98, 0.98, 0.99),
      });

      page.drawText(stampText, {
        x: pageWidth - margin - 88,
        y: currentY - 7,
        size: 11,
        font: boldFont,
        color: rgb(badgeR, badgeG, badgeB),
      });
    }

    // Organization Name
    if (docModel.organization) {
      page.drawText(docModel.organization.toUpperCase(), {
        x: margin,
        y: currentY,
        size: 9.5,
        font: boldFont,
        color: rgb(0.24, 0.38, 0.85),
      });
      currentY -= 16;
    }

    // Document Title
    const titleLines = wrapText(docModel.title, contentWidth - 110, 22, boldFont);
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
                color: rgb(0.24, 0.38, 0.85),
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
      } else if (section.type === 'stat-grid') {
        const stats = section.stats || [];
        if (stats.length > 0) {
          const cardHeight = 44;
          checkNewPage(cardHeight + 16);
          const gap = 10;
          const cardWidth = (contentWidth - (stats.length - 1) * gap) / stats.length;

          stats.forEach((st, idx) => {
            const cardX = margin + idx * (cardWidth + gap);
            page.drawRectangle({
              x: cardX,
              y: currentY - cardHeight,
              width: cardWidth,
              height: cardHeight,
              color: rgb(0.97, 0.98, 1.0),
              borderColor: rgb(0.88, 0.91, 0.98),
              borderWidth: 1,
            });

            // Stat Label
            page.drawText(st.label.toUpperCase(), {
              x: cardX + 8,
              y: currentY - 14,
              size: 7.5,
              font: boldFont,
              color: rgb(0.40, 0.45, 0.55),
            });

            // Stat Value
            page.drawText(st.value, {
              x: cardX + 8,
              y: currentY - 32,
              size: 13,
              font: boldFont,
              color: rgb(0.10, 0.15, 0.28),
            });
          });

          currentY -= cardHeight + 16;
        }
      } else if (section.type === 'divider') {
        checkNewPage(16);
        currentY -= 8;
        page.drawLine({
          start: { x: margin, y: currentY },
          end: { x: pageWidth - margin, y: currentY },
          thickness: 1,
          color: rgb(0.90, 0.92, 0.96),
        });
        currentY -= 16;
      } else if (section.type === 'image') {
        if (section.imageUrl && section.imageUrl.startsWith('data:image')) {
          try {
            const { bytes, isPng } = dataUriToUint8Array(section.imageUrl);
            const embeddedImage = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

            const imgDims = embeddedImage.scale(1);
            const maxWidth = Math.min(contentWidth, 380);
            const scaleFactor = Math.min(maxWidth / imgDims.width, 220 / imgDims.height, 1);
            const drawWidth = imgDims.width * scaleFactor;
            const drawHeight = imgDims.height * scaleFactor;

            checkNewPage(drawHeight + 30);

            page.drawImage(embeddedImage, {
              x: margin + (contentWidth - drawWidth) / 2,
              y: currentY - drawHeight,
              width: drawWidth,
              height: drawHeight,
            });

            currentY -= drawHeight + 6;

            if (section.imageCaption) {
              const captionLines = wrapText(section.imageCaption, contentWidth, 8.5, obliqueFont);
              for (const cl of captionLines) {
                page.drawText(cl, {
                  x: margin,
                  y: currentY - 6,
                  size: 8.5,
                  font: obliqueFont,
                  color: rgb(0.45, 0.50, 0.60),
                });
                currentY -= 11;
              }
            }
            currentY -= 12;
          } catch (imgErr) {
            console.warn('PDF image embedding skipped:', imgErr);
          }
        }
      } else if (section.type === 'signature') {
        checkNewPage(90);
        currentY -= 10;

        const sigX = margin;
        let sigBaselineY = currentY - 45;

        // Draw embedded signature line drawing if present
        if (section.signatureDataUrl && section.signatureDataUrl.startsWith('data:image')) {
          try {
            const { bytes } = dataUriToUint8Array(section.signatureDataUrl);
            const sigImg = await pdfDoc.embedPng(bytes);
            const sigDims = sigImg.scale(1);
            const sigScale = Math.min(160 / sigDims.width, 45 / sigDims.height, 0.9);
            const sigW = sigDims.width * sigScale;
            const sigH = sigDims.height * sigScale;

            page.drawImage(sigImg, {
              x: sigX + 10,
              y: sigBaselineY + 2,
              width: sigW,
              height: sigH,
            });
          } catch (sigErr) {
            console.warn('Signature PNG embedding skipped:', sigErr);
          }
        }

        // Signature rule line
        page.drawLine({
          start: { x: sigX, y: sigBaselineY },
          end: { x: sigX + 220, y: sigBaselineY },
          thickness: 1,
          color: rgb(0.30, 0.35, 0.45),
        });

        // Signatory details
        page.drawText(section.signatoryName || 'Authorized Signatory', {
          x: sigX,
          y: sigBaselineY - 14,
          size: 10,
          font: boldFont,
          color: rgb(0.12, 0.16, 0.25),
        });

        if (section.signatoryTitle) {
          page.drawText(section.signatoryTitle, {
            x: sigX,
            y: sigBaselineY - 26,
            size: 8.5,
            font: regularFont,
            color: rgb(0.40, 0.45, 0.55),
          });
        }

        if (section.dateSigned) {
          page.drawText(`Date: ${section.dateSigned}`, {
            x: sigX,
            y: sigBaselineY - (section.signatoryTitle ? 37 : 26),
            size: 8,
            font: obliqueFont,
            color: rgb(0.45, 0.50, 0.60),
          });
        }

        currentY = sigBaselineY - 50;
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
 * Exports DocumentModel as a Microsoft Word compatible (.doc) HTML document
 */
export function exportDocumentAsWordDoc(doc: DocumentModel): Blob {
  const fontFam = doc.fontTheme === 'serif' ? 'Georgia, "Times New Roman", serif' : doc.fontTheme === 'mono' ? '"Courier New", Courier, monospace' : '"Segoe UI", Calibri, Arial, sans-serif';

  let sectionsHtml = '';

  for (const s of doc.sections) {
    if (s.type === 'heading') {
      sectionsHtml += `<h2 style="font-size: 15pt; color: #1e3a8a; border-bottom: 1.5pt solid #e2e8f0; padding-bottom: 4pt; margin-top: 18pt;">${s.text || ''}</h2>`;
    } else if (s.type === 'paragraph') {
      sectionsHtml += `<p style="font-size: 11pt; line-height: 1.6; color: #1e293b; margin: 8pt 0;">${s.text || ''}</p>`;
    } else if (s.type === 'bullet') {
      sectionsHtml += '<ul style="margin: 8pt 0; padding-left: 20pt;">';
      for (const b of s.bullets || []) {
        sectionsHtml += `<li style="font-size: 11pt; line-height: 1.6; color: #1e293b; margin-bottom: 3pt;">${b}</li>`;
      }
      sectionsHtml += '</ul>';
    } else if (s.type === 'callout') {
      sectionsHtml += `<div style="background-color: #f0f7ff; border-left: 4pt solid #3b82f6; padding: 10pt; margin: 12pt 0; font-size: 10.5pt; color: #1e3a8a;">${s.text || ''}</div>`;
    } else if (s.type === 'table') {
      const headers = s.tableHeaders || [];
      const rows = s.tableRows || [];
      sectionsHtml += '<table style="width: 100%; border-collapse: collapse; margin: 14pt 0;">';
      sectionsHtml += '<thead><tr>';
      for (const h of headers) {
        sectionsHtml += `<th style="background-color: #f1f5f9; color: #0f172a; padding: 8pt; border: 1pt solid #cbd5e1; text-align: left; font-size: 10pt;">${h}</th>`;
      }
      sectionsHtml += '</tr></thead><tbody>';
      for (const r of rows) {
        sectionsHtml += '<tr>';
        for (const c of r) {
          sectionsHtml += `<td style="padding: 8pt; border: 1pt solid #e2e8f0; font-size: 10pt; color: #334155;">${c || ''}</td>`;
        }
        sectionsHtml += '</tr>';
      }
      sectionsHtml += '</tbody></table>';
    } else if (s.type === 'stat-grid') {
      const stats = s.stats || [];
      sectionsHtml += '<table style="width: 100%; border-collapse: separate; border-spacing: 10pt; margin: 12pt 0;"><tr>';
      for (const st of stats) {
        sectionsHtml += `<td style="background-color: #f8fafc; border: 1pt solid #e2e8f0; padding: 12pt; border-radius: 6pt;">
          <div style="font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: bold;">${st.label}</div>
          <div style="font-size: 16pt; font-weight: bold; color: #0f172a; margin-top: 4pt;">${st.value}</div>
        </td>`;
      }
      sectionsHtml += '</tr></table>';
    } else if (s.type === 'divider') {
      sectionsHtml += '<hr style="border: none; border-top: 1pt solid #e2e8f0; margin: 16pt 0;" />';
    } else if (s.type === 'image' && s.imageUrl) {
      sectionsHtml += `<div style="text-align: center; margin: 14pt 0;">
        <img src="${s.imageUrl}" style="max-width: 100%; height: auto; max-height: 250pt; border-radius: 4pt;" />
        ${s.imageCaption ? `<div style="font-size: 9pt; color: #64748b; font-style: italic; margin-top: 4pt;">${s.imageCaption}</div>` : ''}
      </div>`;
    } else if (s.type === 'signature') {
      sectionsHtml += `<div style="margin-top: 24pt; width: 220pt;">
        ${s.signatureDataUrl ? `<img src="${s.signatureDataUrl}" style="max-height: 45pt; margin-bottom: 2pt;" /><br/>` : ''}
        <div style="border-top: 1.5pt solid #0f172a; padding-top: 4pt;">
          <div style="font-weight: bold; font-size: 10pt; color: #0f172a;">${s.signatoryName || 'Authorized Signatory'}</div>
          ${s.signatoryTitle ? `<div style="font-size: 9pt; color: #64748b;">${s.signatoryTitle}</div>` : ''}
          ${s.dateSigned ? `<div style="font-size: 8.5pt; color: #94a3b8;">Date: ${s.dateSigned}</div>` : ''}
        </div>
      </div>`;
    }
  }

  const stampHtml = doc.stampBadge && doc.stampBadge !== 'NONE'
    ? `<div style="float: right; border: 2pt solid #2563eb; color: #2563eb; padding: 4pt 10pt; font-weight: bold; font-size: 11pt; border-radius: 4pt; text-transform: uppercase;">${doc.stampBadge}</div>`
    : '';

  const fullHtml = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${doc.title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body { font-family: ${fontFam}; margin: 2.5cm 2cm; background: #ffffff; color: #1e293b; }
  </style>
</head>
<body>
  ${stampHtml}
  ${doc.organization ? `<div style="font-size: 9.5pt; font-weight: bold; color: #2563eb; text-transform: uppercase; margin-bottom: 4pt;">${doc.organization}</div>` : ''}
  <h1 style="font-size: 24pt; color: #0f172a; margin-top: 0; margin-bottom: 4pt;">${doc.title}</h1>
  ${doc.subtitle ? `<div style="font-size: 12pt; color: #64748b; font-style: italic; margin-bottom: 8pt;">${doc.subtitle}</div>` : ''}
  ${doc.author || doc.date ? `<div style="font-size: 9pt; color: #94a3b8; margin-bottom: 12pt;">${[doc.author ? `Author: ${doc.author}` : '', doc.date ? `Date: ${doc.date}` : ''].filter(Boolean).join(' | ')}</div>` : ''}
  <hr style="border: none; border-top: 1.5pt solid #cbd5e1; margin-bottom: 18pt;" />
  ${sectionsHtml}
  <div style="margin-top: 36pt; border-top: 1pt solid #e2e8f0; padding-top: 8pt; font-size: 8pt; color: #94a3b8; text-align: center;">
    Generated with FileDoctor Privacy Engine · 100% Client-Side
  </div>
</body>
</html>`;

  return new Blob([fullHtml], { type: 'application/msword;charset=utf-8' });
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
    } else if (s.type === 'stat-grid') {
      for (const st of s.stats || []) {
        md += `**${st.label}:** ${st.value}  \n`;
      }
      md += '\n';
    } else if (s.type === 'divider') {
      md += `---\n\n`;
    } else if (s.type === 'signature') {
      md += `\n**Signed by:** ${s.signatoryName || 'Authorized Signatory'}  \n`;
      if (s.signatoryTitle) md += `**Title:** ${s.signatoryTitle}  \n`;
      if (s.dateSigned) md += `**Date:** ${s.dateSigned}  \n\n`;
    }
  }

  return md;
}

/**
 * Built-in Template Presets for God-Level Document Creation
 */
export const DOCUMENT_TEMPLATES: Record<string, { label: string; description: string; model: DocumentModel }> = {
  invoice: {
    label: 'Tax Invoice & Billing',
    description: 'Itemized commercial invoice with auto-tax, total stats, payment terms, and signature.',
    model: {
      title: 'Commercial Tax Invoice #INV-2026-089',
      subtitle: 'Professional Services Rendered · Net 30 Terms',
      author: 'Finance & Billing Dept',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      organization: 'Acme Cloud Solutions Inc.',
      pageSize: 'a4',
      stampBadge: 'PAID',
      showPageNumbers: true,
      fontTheme: 'sans',
      sections: [
        {
          id: 'inv-1',
          type: 'stat-grid',
          stats: [
            { label: 'Subtotal', value: '$3,450.00' },
            { label: 'Tax (10%)', value: '$345.00' },
            { label: 'Grand Total', value: '$3,795.00' },
            { label: 'Status', value: 'PAID IN FULL' },
          ],
        },
        {
          id: 'inv-2',
          type: 'heading',
          text: 'Client & Billed To Information',
        },
        {
          id: 'inv-3',
          type: 'paragraph',
          text: 'Billed To: Globex International Corp · 452 Innovation Blvd, Suite 800, San Francisco, CA · Attn: Accounts Payable (ap@globex.io)',
        },
        {
          id: 'inv-4',
          type: 'heading',
          text: 'Itemized Deliverables & Service Scope',
        },
        {
          id: 'inv-5',
          type: 'table',
          tableHeaders: ['Line Item', 'Description', 'Quantity / Hours', 'Unit Rate', 'Amount'],
          tableRows: [
            ['Cloud Architecture Design', 'Distributed cluster blueprint & microservices plan', '40 hrs', '$45/hr', '$1,800.00'],
            ['Zero-Trust Security Audit', 'Penetration testing & encryption compliance checks', '25 hrs', '$50/hr', '$1,250.00'],
            ['SLA Support & Maintenance', '24/7 on-call tier 3 escalation guarantee', '1 mo', '$400/mo', '$400.00'],
          ],
        },
        {
          id: 'inv-6',
          type: 'callout',
          text: 'Payment Received: Transaction ref #WIRE-98231 confirmed via JP Morgan Chase on November 5, 2026. Thank you for your business!',
        },
        {
          id: 'inv-7',
          type: 'signature',
          signatoryName: 'Evelyn Reed',
          signatoryTitle: 'VP of Finance & Operations',
          dateSigned: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        },
      ],
    },
  },

  proposal: {
    label: 'Executive SOW & Proposal',
    description: 'Statement of Work with executive summary, deliverables milestones, and sign-off.',
    model: {
      title: 'Master Project Proposal & Statement of Work',
      subtitle: 'Enterprise Digital Transformation & Security Implementation',
      author: 'Principal Solutions Architect',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      organization: 'Vanguard Engineering Group',
      pageSize: 'a4',
      stampBadge: 'APPROVED',
      showPageNumbers: true,
      fontTheme: 'sans',
      sections: [
        {
          id: 'p-1',
          type: 'heading',
          text: '1. Executive Overview & Problem Statement',
        },
        {
          id: 'p-2',
          type: 'paragraph',
          text: 'This proposal outlines the strategy, architecture, and timeline to modernize legacy workflows into high-throughput, edge-accelerated microservices with end-to-end data privacy and zero cloud leakage.',
        },
        {
          id: 'p-3',
          type: 'callout',
          text: 'Key Success Metric: 90% reduction in processing latency and 100% compliance with local data protection regulations.',
        },
        {
          id: 'p-4',
          type: 'heading',
          text: '2. Project Milestones & Deliverables',
        },
        {
          id: 'p-5',
          type: 'table',
          tableHeaders: ['Phase', 'Deliverable', 'Lead Team', 'Target Timeline'],
          tableRows: [
            ['Phase 1: Discovery', 'Audit existing infrastructure & threat model', 'Security Architecture', 'Week 1-2'],
            ['Phase 2: Core Build', 'Vector engine, client-side encryption modules', 'Core Engineering', 'Week 3-6'],
            ['Phase 3: Integration', 'API gateway wiring & stress testing', 'DevOps / QA', 'Week 7-8'],
            ['Phase 4: Production', 'Final sign-off, live cutover, staff training', 'Operations', 'Week 9'],
          ],
        },
        {
          id: 'p-6',
          type: 'heading',
          text: '3. Strategic Commitments',
        },
        {
          id: 'p-7',
          type: 'bullet',
          bullets: [
            'All computations execute client-side or within air-gapped secure enclaves.',
            'Continuous 99.99% uptime guarantee with multi-region failover.',
            'Comprehensive documentation, API specs, and automated test coverage.',
          ],
        },
        {
          id: 'p-8',
          type: 'signature',
          signatoryName: 'Marcus Vance',
          signatoryTitle: 'Chief Technology Officer',
          dateSigned: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        },
      ],
    },
  },

  certificate: {
    label: 'Certificate of Excellence',
    description: 'Formal award certificate with official seal, recipient statement, and verification signature.',
    model: {
      title: 'CERTIFICATE OF EXCELLENCE',
      subtitle: 'Recognizing Exceptional Technical Leadership & Innovation',
      author: 'Academic & Accreditation Board',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      organization: 'Institute of Advanced Software Engineering',
      pageSize: 'a4',
      stampBadge: 'VERIFIED',
      showPageNumbers: false,
      fontTheme: 'serif',
      sections: [
        {
          id: 'c-1',
          type: 'callout',
          text: 'OFFICIAL ACCREDITATION · RECORD ID #IASE-2026-9042 · CONFIDENTIAL AND PRIVILEGED',
        },
        {
          id: 'c-2',
          type: 'heading',
          text: 'This certificate is proudly awarded to:',
        },
        {
          id: 'c-3',
          type: 'paragraph',
          text: 'ALEXANDER M. HAYES, SENIOR SYSTEMS ARCHITECT, in recognition of pioneering breakthroughs in browser-native confidential computing, sub-millisecond document compilation, and outstanding contributions to open privacy standards.',
        },
        {
          id: 'c-4',
          type: 'stat-grid',
          stats: [
            { label: 'Evaluation Grade', value: 'Summa Cum Laude' },
            { label: 'Honors Category', value: 'Systems Security' },
            { label: 'Accreditation', value: 'Level 5 Master' },
          ],
        },
        {
          id: 'c-5',
          type: 'signature',
          signatoryName: 'Dr. Eleanor Vance, Ph.D.',
          signatoryTitle: 'Dean of Computing & Information Science',
          dateSigned: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        },
      ],
    },
  },

  letterhead: {
    label: 'Formal Corporate Letterhead',
    description: 'Executive business letterhead with addresses, formal salutation, closing, and signature.',
    model: {
      title: 'Executive Notice & Advisory',
      subtitle: 'Official Corporate Correspondence · Reference #CORP-2026-1105',
      author: 'Office of General Counsel',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      organization: 'Apex Global Enterprises LLC',
      pageSize: 'letter',
      stampBadge: 'ORIGINAL',
      showPageNumbers: true,
      fontTheme: 'serif',
      sections: [
        {
          id: 'l-1',
          type: 'paragraph',
          text: 'To: All Stakeholders, Department Heads, and Regional Directors\nFrom: Executive Committee & Office of the CEO\nSubject: Implementation of Mandatory Client-Side Privacy Standards',
        },
        {
          id: 'l-2',
          type: 'divider',
        },
        {
          id: 'l-3',
          type: 'paragraph',
          text: 'Dear Colleagues,\n\nWe are pleased to announce the formal ratification of our enterprise data sovereignty initiative. Effective immediately, all internal document compilation, conversion, and compression must be performed exclusively using local, client-side verified engines.',
        },
        {
          id: 'l-4',
          type: 'bullet',
          bullets: [
            'No confidential client records or proprietary trade secrets may be uploaded to third-party conversion servers.',
            'All teams must utilize the internal FileDoctor workspace for PDF manipulation, document signing, and OCR.',
            'Department audits will be conducted quarterly to verify zero data leakage compliance.',
          ],
        },
        {
          id: 'l-5',
          type: 'callout',
          text: 'Compliance with these directives is strictly mandatory. Thank you for your continued dedication to upholding the highest standards of digital trust and integrity.',
        },
        {
          id: 'l-6',
          type: 'signature',
          signatoryName: 'Jonathan Sterling',
          signatoryTitle: 'Chief Executive Officer',
          dateSigned: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        },
      ],
    },
  },

  meeting: {
    label: 'Meeting Minutes & Action Plan',
    description: 'Structured meeting minutes with attendee list, agenda, key decisions, and action items table.',
    model: {
      title: 'Executive Board Meeting Minutes',
      subtitle: 'Quarterly Strategic Alignment & Infrastructure Review',
      author: 'Corporate Secretary',
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      organization: 'Nexus Technologies Group',
      pageSize: 'a4',
      stampBadge: 'APPROVED',
      showPageNumbers: true,
      fontTheme: 'sans',
      sections: [
        {
          id: 'm-1',
          type: 'heading',
          text: '1. Meeting Details & Attendance',
        },
        {
          id: 'm-2',
          type: 'paragraph',
          text: 'Location: Executive Conference Room A & Encrypted Video Link\nAttendees: Sarah Chen (Chair), David Miller (CFO), Priya Patel (CTO), Marcus Vance (COO), Elena Rostov (General Counsel)',
        },
        {
          id: 'm-3',
          type: 'callout',
          text: 'Unanimous Resolution: The proposed Q4 capital expenditure plan was reviewed and formally adopted with zero objections.',
        },
        {
          id: 'm-4',
          type: 'heading',
          text: '2. Action Items & Accountability Matrix',
        },
        {
          id: 'm-5',
          type: 'table',
          tableHeaders: ['Action Item', 'Assigned Owner', 'Target Due Date', 'Current Status'],
          tableRows: [
            ['Finalize SOC2 Type II Privacy Audit', 'Elena Rostov', 'Nov 20, 2026', 'In Progress'],
            ['Deploy Edge Document Cluster', 'Priya Patel', 'Nov 28, 2026', 'On Track'],
            ['Present Q4 Revenue Projections', 'David Miller', 'Dec 05, 2026', 'Scheduled'],
          ],
        },
        {
          id: 'm-6',
          type: 'signature',
          signatoryName: 'Sarah Chen',
          signatoryTitle: 'Chairperson of the Board',
          dateSigned: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        },
      ],
    },
  },
};
