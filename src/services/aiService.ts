import { createWorker } from 'tesseract.js';
import { readFileAsDataURL } from './fileService';

export interface SummarizeResult {
  executiveSummary: string;
  bulletPoints: string[];
  keyTerms: string[];
  actionItems: string[];
}

export interface QaMatch {
  passage: string;
  relevanceScore: number;
  lineNumber: number;
}

/**
 * 12.1 Local Extractive Document Summarizer (TF-IDF / Frequency-based Graph Algorithm)
 */
export function summarizeDocumentLocally(text: string, sentenceCount = 4): SummarizeResult {
  const clean = text.trim();
  if (!clean) {
    return {
      executiveSummary: 'No readable text content provided.',
      bulletPoints: [],
      keyTerms: [],
      actionItems: [],
    };
  }

  // Split into sentences
  const rawSentences = clean.split(/(?<=[.?!])\s+/).filter((s) => s.trim().length > 15);
  if (rawSentences.length === 0) {
    return {
      executiveSummary: clean.slice(0, 300),
      bulletPoints: [clean],
      keyTerms: [],
      actionItems: [],
    };
  }

  // Compute word frequencies
  const stopwords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'to', 'for', 'with', 'as',
    'by', 'of', 'from', 'that', 'this', 'it', 'be', 'are', 'was', 'were', 'has', 'have', 'had',
    'not', 'but', 'can', 'will', 'if', 'all', 'any', 'about', 'we', 'they', 'you', 'i',
  ]);

  const words = clean.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (!stopwords.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  // Score sentences
  const scored = rawSentences.map((sentence, index) => {
    const sWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    let score = 0;
    for (const w of sWords) {
      if (freq[w]) score += freq[w];
    }
    // Normalize by sentence length
    score = score / Math.max(5, sWords.length);
    // Slight boost for introductory and concluding sentences
    if (index === 0 || index === rawSentences.length - 1) score *= 1.25;

    return { sentence: sentence.trim(), score, index };
  });

  scored.sort((a, b) => b.score - a.score);
  const topSentences = scored.slice(0, sentenceCount).sort((a, b) => a.index - b.index);

  const executiveSummary = topSentences.map((s) => s.sentence).join(' ');

  // Extract Top 5 Key terms
  const sortedTerms = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([term]) => term.charAt(0).toUpperCase() + term.slice(1));

  // Extract Action Items (sentences starting with verbs or containing should/must/need)
  const actionItems = rawSentences
    .filter((s) => /\b(must|should|need to|ensure|please|action|todo|required|implement|verify)\b/i.test(s))
    .slice(0, 4)
    .map((s) => s.trim());

  return {
    executiveSummary,
    bulletPoints: topSentences.map((s) => s.sentence),
    keyTerms: sortedTerms,
    actionItems,
  };
}

/**
 * 12.2 Document Q&A Search (TF-IDF passage relevance search)
 */
export function queryDocumentContent(text: string, question: string): QaMatch[] {
  const queryTerms = question.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  if (queryTerms.length === 0) return [];

  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 10);
  const matches: QaMatch[] = [];

  paragraphs.forEach((para, idx) => {
    const pLower = para.toLowerCase();
    let score = 0;
    for (const term of queryTerms) {
      const count = (pLower.match(new RegExp(`\\b${term}\\b`, 'g')) || []).length;
      score += count * 2;
    }
    if (score > 0) {
      matches.push({
        passage: para.trim(),
        relevanceScore: Math.round(score * 10),
        lineNumber: idx + 1,
      });
    }
  });

  return matches.sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, 4);
}

/**
 * 12.3 Real OCR Engine with Tesseract.js
 */
export async function performOcr(
  file: File,
  language = 'eng',
  onProgress?: (progress: number, status: string) => void
): Promise<{ text: string; confidence: number; processingTime: number }> {
  const startTime = performance.now();
  const dataUrl = await readFileAsDataURL(file);

  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100), 'Recognizing characters...');
      } else if (onProgress) {
        onProgress(15, m.status);
      }
    },
  });

  const ret = await worker.recognize(dataUrl);
  await worker.terminate();

  return {
    text: ret.data.text.trim(),
    confidence: Math.round(ret.data.confidence),
    processingTime: performance.now() - startTime,
  };
}

