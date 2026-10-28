import type { ToolDefinition } from '@/types';

export const TOOL_REGISTRY: ToolDefinition[] = [
  // ─── PDF Clinic ─────────────────────────────────────────────────────────────
  {
    id: 'pdf-merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document.',
    category: 'pdf',
    icon: 'FilePlus2',
    route: '/pdf/merge',
    availability: 'available',
    inputFormats: ['pdf'],
    outputFormats: ['pdf'],
    tags: ['merge', 'combine', 'join', 'concatenate', 'pdf', 'multiple'],
    popular: true,
  },
  {
    id: 'pdf-split',
    name: 'Split PDF',
    description: 'Extract pages or split a PDF into multiple files.',
    category: 'pdf',
    icon: 'Scissors',
    route: '/pdf/split',
    availability: 'available',
    inputFormats: ['pdf'],
    outputFormats: ['pdf'],
    tags: ['split', 'extract', 'pages', 'pdf', 'divide', 'separate'],
    popular: true,
  },
  {
    id: 'pdf-compress',
    name: 'Compress PDF',
    description: 'Reduce PDF file size with optional rasterization mode.',
    category: 'pdf',
    icon: 'Minimize2',
    route: '/pdf/compress',
    availability: 'partial',
    inputFormats: ['pdf'],
    outputFormats: ['pdf'],
    tags: ['compress', 'reduce', 'size', 'optimize', 'pdf', 'smaller'],
    popular: true,
  },
  {
    id: 'pdf-to-images',
    name: 'PDF to Images',
    description: 'Convert PDF pages to PNG, JPEG, or WebP images.',
    category: 'pdf',
    icon: 'Images',
    route: '/pdf/to-images',
    availability: 'available',
    inputFormats: ['pdf'],
    outputFormats: ['png', 'jpeg', 'webp'],
    tags: ['pdf', 'image', 'convert', 'png', 'jpeg', 'export', 'render'],
    popular: true,
  },
  {
    id: 'pdf-from-images',
    name: 'Images to PDF',
    description: 'Combine images into a single PDF document.',
    category: 'pdf',
    icon: 'FileImage',
    route: '/pdf/from-images',
    availability: 'available',
    inputFormats: ['png', 'jpeg', 'webp', 'jpg'],
    outputFormats: ['pdf'],
    tags: ['images', 'pdf', 'convert', 'combine', 'create'],
    popular: true,
  },
  {
    id: 'pdf-sign',
    name: 'Sign PDF',
    description: 'Draw or type a signature and embed it into a PDF.',
    category: 'pdf',
    icon: 'PenTool',
    route: '/pdf/sign',
    availability: 'available',
    inputFormats: ['pdf'],
    outputFormats: ['pdf'],
    tags: ['sign', 'signature', 'pdf', 'electronic', 'draw'],
  },

  // ─── Image Studio ─────────────────────────────────────────────────────────
  {
    id: 'image-convert',
    name: 'Convert Images',
    description: 'Convert images between PNG, JPEG, and WebP formats.',
    category: 'image',
    icon: 'RefreshCw',
    route: '/images/convert',
    availability: 'available',
    inputFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp'],
    outputFormats: ['png', 'jpeg', 'webp'],
    tags: ['convert', 'image', 'png', 'jpeg', 'jpg', 'webp', 'format'],
    popular: true,
  },
  {
    id: 'image-resize',
    name: 'Resize & Crop',
    description: 'Resize images to exact dimensions, percentages, or presets.',
    category: 'image',
    icon: 'Crop',
    route: '/images/resize',
    availability: 'available',
    inputFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp'],
    outputFormats: ['png', 'jpeg', 'webp'],
    tags: ['resize', 'crop', 'scale', 'dimensions', 'image', 'width', 'height'],
    popular: true,
  },
  {
    id: 'image-compress',
    name: 'Compress Images',
    description: 'Reduce image file size while preserving quality.',
    category: 'image',
    icon: 'Archive',
    route: '/images/compress',
    availability: 'available',
    inputFormats: ['png', 'jpeg', 'jpg', 'webp'],
    outputFormats: ['png', 'jpeg', 'webp'],
    tags: ['compress', 'optimize', 'reduce', 'image', 'size', 'tinypng'],
    popular: true,
  },
  {
    id: 'image-metadata',
    name: 'Strip Metadata',
    description: 'Remove EXIF and metadata from images for privacy.',
    category: 'image',
    icon: 'ShieldOff',
    route: '/images/metadata',
    availability: 'available',
    inputFormats: ['png', 'jpeg', 'jpg', 'webp'],
    outputFormats: ['png', 'jpeg', 'webp'],
    tags: ['metadata', 'exif', 'strip', 'privacy', 'location', 'remove', 'gps'],
    popular: false,
  },
  {
    id: 'image-palette',
    name: 'Color Palette',
    description: 'Extract dominant colors from any image.',
    category: 'image',
    icon: 'Palette',
    route: '/images/palette',
    availability: 'available',
    inputFormats: ['png', 'jpeg', 'jpg', 'webp', 'gif', 'bmp'],
    outputFormats: [],
    tags: ['palette', 'color', 'extract', 'dominant', 'swatch', 'hex'],
  },

  // ─── Data & Text ─────────────────────────────────────────────────────────
  {
    id: 'tabular-convert',
    name: 'CSV / JSON / Excel',
    description: 'Convert between CSV, JSON, and Excel XLSX formats.',
    category: 'data-text',
    icon: 'Table',
    route: '/data/tabular',
    availability: 'available',
    inputFormats: ['csv', 'json', 'xlsx'],
    outputFormats: ['csv', 'json', 'xlsx'],
    tags: ['csv', 'json', 'excel', 'xlsx', 'convert', 'spreadsheet', 'table', 'data'],
    popular: true,
  },
  {
    id: 'code-format',
    name: 'Code Formatter',
    description: 'Beautify and minify JSON, HTML, CSS, and JavaScript.',
    category: 'data-text',
    icon: 'Code2',
    route: '/data/code',
    availability: 'available',
    inputFormats: ['json', 'html', 'css', 'js'],
    outputFormats: ['json', 'html', 'css', 'js'],
    tags: ['format', 'beautify', 'minify', 'code', 'json', 'html', 'css', 'js', 'javascript'],
    popular: false,
  },
  {
    id: 'text-cleaner',
    name: 'Text Cleaner',
    description: 'Remove duplicates, fix whitespace, strip markdown, and more.',
    category: 'data-text',
    icon: 'Eraser',
    route: '/data/text',
    availability: 'available',
    inputFormats: ['txt', 'md'],
    outputFormats: ['txt'],
    tags: ['text', 'clean', 'whitespace', 'duplicates', 'markdown', 'strip', 'normalize'],
  },

  // ─── Audio & Video ────────────────────────────────────────────────────────
  {
    id: 'audio-convert',
    name: 'Audio Converter',
    description: 'Convert and compress audio files in your browser.',
    category: 'audio',
    icon: 'Music',
    route: '/audio/convert',
    availability: 'partial',
    inputFormats: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
    outputFormats: ['wav', 'ogg'],
    tags: ['audio', 'convert', 'mp3', 'wav', 'compress', 'music', 'sound'],
  },
  {
    id: 'audio-trim',
    name: 'Trim & Volume',
    description: 'Trim audio clips and adjust volume with waveform preview.',
    category: 'audio',
    icon: 'Scissors',
    route: '/audio/trim',
    availability: 'partial',
    inputFormats: ['mp3', 'wav', 'ogg', 'm4a'],
    outputFormats: ['wav'],
    tags: ['audio', 'trim', 'cut', 'volume', 'boost', 'waveform'],
  },

  // ─── AI Utilities ─────────────────────────────────────────────────────────
  {
    id: 'ai-summarize',
    name: 'Document Summarizer',
    description: 'Extract text and summarize documents locally or with AI.',
    category: 'ai',
    icon: 'FileText',
    route: '/ai/summarize',
    availability: 'partial',
    inputFormats: ['pdf', 'txt'],
    outputFormats: ['txt'],
    tags: ['ai', 'summarize', 'summary', 'document', 'text', 'extract', 'qa'],
  },
  {
    id: 'ai-ocr',
    name: 'OCR Extractor',
    description: 'Extract text from images using browser-based OCR.',
    category: 'ai',
    icon: 'ScanText',
    route: '/ai/ocr',
    availability: 'partial',
    inputFormats: ['png', 'jpeg', 'jpg', 'webp', 'bmp'],
    outputFormats: ['txt'],
    tags: ['ocr', 'extract', 'text', 'image', 'scan', 'recognize'],
  },
];

/**
 * Search tools by query string. Matches name, description, category, tags, and formats.
 */
export function searchTools(query: string): ToolDefinition[] {
  if (!query.trim()) return TOOL_REGISTRY;
  const q = query.toLowerCase();
  return TOOL_REGISTRY.filter(
    (tool) =>
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.category.includes(q) ||
      tool.tags.some((t) => t.includes(q)) ||
      tool.inputFormats.some((f) => f.includes(q)) ||
      tool.outputFormats.some((f) => f.includes(q))
  );
}

export function getToolById(id: string): ToolDefinition | undefined {
  return TOOL_REGISTRY.find((t) => t.id === id);
}

export function getToolsByCategory(category: ToolDefinition['category']): ToolDefinition[] {
  if (category === 'all') return TOOL_REGISTRY;
  return TOOL_REGISTRY.filter((t) => t.category === category);
}

export function getPopularTools(): ToolDefinition[] {
  return TOOL_REGISTRY.filter((t) => t.popular);
}
