// ─── Core Processing Types ─────────────────────────────────────────────────

export type ProcessingResult = {
  blob: Blob;
  fileName: string;
  mimeType: string;
  metadata?: Record<string, unknown>;
};

export type ProcessingContext = {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
};

export type ProcessingStatus = 'idle' | 'loading' | 'processing' | 'done' | 'error' | 'cancelled';

export type ProcessingError = {
  code: string;
  message: string;
  details?: string;
};

// ─── File Validation ────────────────────────────────────────────────────────

export type ValidationResult =
  | { valid: true }
  | { valid: false; error: string };

export type FileConstraints = {
  maxSizeBytes?: number;
  acceptedMimeTypes?: string[];
  acceptedExtensions?: string[];
  maxWidth?: number;
  maxHeight?: number;
};

// ─── Tool Registry ───────────────────────────────────────────────────────────

export type ToolCategory =
  | 'pdf'
  | 'image'
  | 'audio'
  | 'data-text'
  | 'ai'
  | 'all';

export type ToolAvailability = 'available' | 'partial' | 'unavailable' | 'demo';

export type ToolDefinition = {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  route: string;
  availability: ToolAvailability;
  inputFormats: string[];
  outputFormats: string[];
  tags: string[];
  popular?: boolean;
};

// ─── History ─────────────────────────────────────────────────────────────────

export type OperationStatus = 'success' | 'error' | 'cancelled';

export type HistoryEntry = {
  id: string;
  toolId: string;
  toolName: string;
  inputFileName: string;
  inputFileSizeBytes: number;
  outputFileName?: string;
  outputFileSizeBytes?: number;
  outputMimeType?: string;
  timestamp: number;
  status: OperationStatus;
  settings?: Record<string, unknown>;
  hasStoredOutput?: boolean;
};

// ─── Preferences ─────────────────────────────────────────────────────────────

export type Theme = 'light' | 'dark' | 'system';

export type AppPreferences = {
  theme: Theme;
  favoriteTools: string[];
  recentTools: string[];
  retainOutputs: boolean;
  maxStoredOutputs: number;
};

// ─── PDF Types ────────────────────────────────────────────────────────────────

export type PdfPageInfo = {
  pageNumber: number;
  width: number;
  height: number;
};

export type PdfDocumentInfo = {
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  sizeBytes: number;
  pages: PdfPageInfo[];
};

// ─── Image Types ──────────────────────────────────────────────────────────────

export type ImageInfo = {
  width: number;
  height: number;
  format: string;
  sizeBytes: number;
  hasAlpha?: boolean;
};

export type ImageOutputFormat = 'image/png' | 'image/jpeg' | 'image/webp';

// ─── Audio Types ──────────────────────────────────────────────────────────────

export type AudioInfo = {
  duration: number;
  sampleRate?: number;
  channels?: number;
  sizeBytes: number;
  format: string;
};
