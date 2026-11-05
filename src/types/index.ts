export interface Tool {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  icon: string;
  route: string;
  inputFormats: string[];
  outputFormats: string[];
  keywords: string[];
  isPopular: boolean;
  privacyLevel: 'local' | 'optional-external' | 'external-required';
}

export type ToolCategory = 'pdf' | 'image' | 'audio' | 'video' | 'data' | 'text' | 'ai' | 'compression' | 'developer';

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  description: string;
  accentColor: string;
  icon: string;
  route: string;
}

export interface ProcessingResult {
  success: boolean;
  outputBlob?: Blob;
  outputFilename?: string;
  originalSize: number;
  outputSize?: number;
  processingTime: number;
  message?: string;
  warnings?: string[];
  error?: string;
}

export interface HistoryEntry {
  id: string;
  toolId: string;
  toolName: string;
  inputFilename: string;
  originalSize: number;
  outputFilename?: string;
  outputSize?: number;
  timestamp: number;
  expiresAt: number; // Expiration timestamp in ms (default 1 hour after creation)
  status: 'success' | 'error' | 'cancelled';
  settings?: Record<string, any>;
  hasRetainedOutput: boolean;
  hasRetainedInput?: boolean;
  mimeType?: string;
}

export interface ActiveToolSession {
  toolId: string;
  fileBlob: Blob;
  filename: string;
  mimeType: string;
  lastModified?: number;
  settings?: Record<string, any>;
  result?: {
    success: boolean;
    outputBlob?: Blob;
    outputFilename?: string;
    originalSize: number;
    outputSize?: number;
    processingTime: number;
    strategyUsed?: string;
    warnings?: string[];
    targetAchieved?: boolean;
    error?: string;
  };
  updatedAt: number;
  expiresAt: number;
}

export interface FileInfo {
  file: File;
  id: string;
  preview?: string;
  pageCount?: number;
}

export type CompressionPreset = 'light' | 'balanced' | 'strong' | 'maximum';

export interface CompressionSettings {
  mode: 'preset' | 'percentage' | 'target-size' | 'advanced';
  preset?: CompressionPreset;
  reductionPercentage?: number;
  targetSizeKB?: number;
  imageQuality?: number;
  imageResolution?: number;
  removeMetadata?: boolean;
  grayscale?: boolean;
  rasterize?: boolean;
}
