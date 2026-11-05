import { Tool, ToolCategory, CategoryInfo } from '@/types';

export const categories: CategoryInfo[] = [
  { id: 'pdf', name: 'PDF Clinic', description: 'Complete PDF processing suite', accentColor: '#FF788C', icon: 'FileText', route: '/pdf' },
  { id: 'image', name: 'Image Studio', description: 'Professional image processing', accentColor: '#48DCC7', icon: 'Image', route: '/image' },
  { id: 'audio', name: 'Audio & Video', description: 'Media conversion and editing', accentColor: '#9B8AFF', icon: 'Music', route: '/audio-video' },
  { id: 'data', name: 'Data & Text', description: 'Data conversion and text processing', accentColor: '#496BFF', icon: 'Database', route: '/data-text' },
  { id: 'ai', name: 'AI Utilities', description: 'Smart document processing', accentColor: '#C4B5FD', icon: 'Sparkles', route: '/ai' },
  { id: 'compression', name: 'Compression Center', description: 'Unified compression tools', accentColor: '#48DCC7', icon: 'Minimize2', route: '/compression' },
  { id: 'developer', name: 'Developer Tools', description: 'Utilities for developers', accentColor: '#496BFF', icon: 'Code', route: '/developer' },
  { id: 'text', name: 'Text Tools', description: 'Text manipulation utilities', accentColor: '#496BFF', icon: 'Type', route: '/text' },
  { id: 'video', name: 'Video Tools', description: 'Video processing', accentColor: '#9B8AFF', icon: 'Video', route: '/video' },
];

export const tools: Tool[] = [
  // PDF Tools
  { id: 'pdf-scan', name: 'Camera Document Scanner', description: 'Scan paper documents with camera, auto-crop perspective, clean filters, and multi-page PDF compilation', category: 'pdf', icon: 'Camera', route: '/tools/pdf-scan', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['application/pdf'], keywords: ['camera', 'scan', 'scanner', 'camscanner', 'crop', 'perspective', 'receipt', 'document', 'pdf'], isPopular: true, privacyLevel: 'local' },
  { id: 'pdf-compress', name: 'PDF Compressor', description: 'Reduce PDF file size with multiple compression strategies', category: 'pdf', icon: 'Minimize2', route: '/tools/pdf-compress', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['compress', 'reduce', 'size', 'smaller', 'shrink', 'optimize', 'pdf'], isPopular: true, privacyLevel: 'local' },
  { id: 'pdf-merge', name: 'Merge PDFs', description: 'Combine multiple PDF files into one document', category: 'pdf', icon: 'Merge', route: '/tools/pdf-merge', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['merge', 'combine', 'join', 'concatenate', 'pdf'], isPopular: true, privacyLevel: 'local' },
  { id: 'pdf-split', name: 'Split PDF', description: 'Split a PDF into individual pages or custom ranges', category: 'pdf', icon: 'Scissors', route: '/tools/pdf-split', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['split', 'separate', 'extract', 'pages', 'divide', 'pdf'], isPopular: true, privacyLevel: 'local' },
  { id: 'pdf-organize', name: 'Organize PDF', description: 'Reorder, rotate, delete, and duplicate pages', category: 'pdf', icon: 'LayoutGrid', route: '/tools/pdf-organize', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['organize', 'reorder', 'rearrange', 'pages', 'pdf'], isPopular: false, privacyLevel: 'local' },
  { id: 'pdf-to-images', name: 'PDF to Images', description: 'Convert PDF pages to PNG, JPEG, or WebP images', category: 'pdf', icon: 'ImageDown', route: '/tools/pdf-to-images', inputFormats: ['application/pdf'], outputFormats: ['image/png', 'image/jpeg', 'image/webp'], keywords: ['pdf', 'image', 'png', 'jpeg', 'convert', 'export', 'screenshot'], isPopular: true, privacyLevel: 'local' },
  { id: 'images-to-pdf', name: 'Images to PDF', description: 'Convert multiple images into a single PDF document', category: 'pdf', icon: 'FileUp', route: '/tools/images-to-pdf', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['application/pdf'], keywords: ['image', 'pdf', 'convert', 'create', 'photo'], isPopular: true, privacyLevel: 'local' },
  { id: 'pdf-sign', name: 'Sign PDF', description: 'Add visual signatures to your PDF documents', category: 'pdf', icon: 'PenTool', route: '/tools/pdf-sign', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['sign', 'signature', 'draw', 'pdf', 'autograph'], isPopular: true, privacyLevel: 'local' },
  { id: 'pdf-rotate', name: 'Rotate PDF', description: 'Rotate PDF pages to any orientation', category: 'pdf', icon: 'RotateCw', route: '/tools/pdf-rotate', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['rotate', 'orientation', 'landscape', 'portrait', 'pdf'], isPopular: false, privacyLevel: 'local' },
  { id: 'pdf-watermark', name: 'PDF Watermark', description: 'Add text or image watermarks to PDFs', category: 'pdf', icon: 'Stamp', route: '/tools/pdf-watermark', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['watermark', 'stamp', 'overlay', 'text', 'pdf'], isPopular: false, privacyLevel: 'local' },
  { id: 'pdf-page-numbers', name: 'PDF Page Numbers', description: 'Add page numbers to your PDF', category: 'pdf', icon: 'Hash', route: '/tools/pdf-page-numbers', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['page', 'number', 'footer', 'header', 'pdf'], isPopular: false, privacyLevel: 'local' },
  { id: 'pdf-metadata', name: 'PDF Metadata', description: 'View and edit PDF metadata properties', category: 'pdf', icon: 'Info', route: '/tools/pdf-metadata', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['metadata', 'properties', 'info', 'author', 'title', 'pdf'], isPopular: false, privacyLevel: 'local' },
  { id: 'pdf-protect', name: 'Protect PDF', description: 'Add password protection to your PDF', category: 'pdf', icon: 'Lock', route: '/tools/pdf-protect', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['password', 'protect', 'encrypt', 'security', 'lock', 'pdf'], isPopular: false, privacyLevel: 'local' },
  { id: 'pdf-to-text', name: 'PDF to Text', description: 'Extract text content from PDF documents', category: 'pdf', icon: 'FileText', route: '/tools/pdf-to-text', inputFormats: ['application/pdf'], outputFormats: ['text/plain'], keywords: ['text', 'extract', 'copy', 'content', 'pdf'], isPopular: false, privacyLevel: 'local' },
  { id: 'pdf-flatten', name: 'Flatten PDF', description: 'Flatten PDF form fields and annotations', category: 'pdf', icon: 'Layers', route: '/tools/pdf-flatten', inputFormats: ['application/pdf'], outputFormats: ['application/pdf'], keywords: ['flatten', 'form', 'annotation', 'pdf'], isPopular: false, privacyLevel: 'local' },
  
  // Image Tools
  { id: 'image-compress', name: 'Image Compressor', description: 'Reduce image file size while maintaining quality', category: 'image', icon: 'Minimize2', route: '/tools/image-compress', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['image/png', 'image/jpeg', 'image/webp'], keywords: ['compress', 'reduce', 'optimize', 'image', 'photo', 'size'], isPopular: true, privacyLevel: 'local' },
  { id: 'image-convert', name: 'Image Converter', description: 'Convert between PNG, JPEG, WebP, and other formats', category: 'image', icon: 'ArrowRightLeft', route: '/tools/image-convert', inputFormats: ['image/png', 'image/jpeg', 'image/webp', 'image/bmp'], outputFormats: ['image/png', 'image/jpeg', 'image/webp'], keywords: ['convert', 'format', 'png', 'jpeg', 'jpg', 'webp', 'image'], isPopular: true, privacyLevel: 'local' },
  { id: 'image-resize', name: 'Image Resizer', description: 'Resize images by pixels or percentage', category: 'image', icon: 'Maximize2', route: '/tools/image-resize', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['image/png', 'image/jpeg', 'image/webp'], keywords: ['resize', 'scale', 'dimensions', 'width', 'height', 'image'], isPopular: true, privacyLevel: 'local' },
  { id: 'image-crop', name: 'Image Cropper', description: 'Crop images with preset or custom aspect ratios', category: 'image', icon: 'Crop', route: '/tools/image-crop', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['image/png', 'image/jpeg', 'image/webp'], keywords: ['crop', 'trim', 'cut', 'aspect', 'ratio', 'image'], isPopular: true, privacyLevel: 'local' },
  { id: 'image-metadata', name: 'Metadata Remover', description: 'Remove EXIF data, GPS, and camera info from images', category: 'image', icon: 'ShieldOff', route: '/tools/image-metadata', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['image/png', 'image/jpeg', 'image/webp'], keywords: ['metadata', 'exif', 'gps', 'location', 'privacy', 'remove', 'strip'], isPopular: true, privacyLevel: 'local' },
  { id: 'image-palette', name: 'Color Palette', description: 'Extract dominant colors from any image', category: 'image', icon: 'Palette', route: '/tools/image-palette', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: [], keywords: ['color', 'palette', 'extract', 'dominant', 'hex', 'rgb', 'hsl'], isPopular: false, privacyLevel: 'local' },
  { id: 'image-rotate', name: 'Image Rotator', description: 'Rotate and flip images', category: 'image', icon: 'RotateCw', route: '/tools/image-rotate', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['image/png', 'image/jpeg', 'image/webp'], keywords: ['rotate', 'flip', 'mirror', 'orientation', 'image'], isPopular: false, privacyLevel: 'local' },
  { id: 'image-filters', name: 'Image Filters', description: 'Apply grayscale, brightness, contrast, blur, and sharpen', category: 'image', icon: 'SlidersHorizontal', route: '/tools/image-filters', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['image/png', 'image/jpeg', 'image/webp'], keywords: ['filter', 'grayscale', 'brightness', 'contrast', 'blur', 'sharpen', 'image'], isPopular: false, privacyLevel: 'local' },
  { id: 'image-watermark', name: 'Image Watermark', description: 'Add text or image watermarks to photos', category: 'image', icon: 'Stamp', route: '/tools/image-watermark', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['image/png', 'image/jpeg', 'image/webp'], keywords: ['watermark', 'stamp', 'overlay', 'text', 'image'], isPopular: false, privacyLevel: 'local' },

  // Audio Tools
  { id: 'audio-convert', name: 'Audio Converter', description: 'Convert between audio formats (WAV, MP3, OGG, M4A)', category: 'audio', icon: 'ArrowRightLeft', route: '/tools/audio-convert', inputFormats: ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/m4a'], outputFormats: ['audio/wav', 'audio/ogg'], keywords: ['audio', 'convert', 'wav', 'mp3', 'ogg', 'format', 'sound'], isPopular: true, privacyLevel: 'local' },
  { id: 'audio-trim', name: 'Audio Trimmer', description: 'Trim audio files with timeline preview', category: 'audio', icon: 'Scissors', route: '/tools/audio-trim', inputFormats: ['audio/wav', 'audio/mp3', 'audio/ogg'], outputFormats: ['audio/wav'], keywords: ['audio', 'trim', 'cut', 'clip', 'sound', 'segment'], isPopular: false, privacyLevel: 'local' },
  { id: 'audio-volume', name: 'Volume Adjuster', description: 'Boost or reduce audio volume and normalize levels', category: 'audio', icon: 'Volume2', route: '/tools/audio-volume', inputFormats: ['audio/wav', 'audio/mp3', 'audio/ogg'], outputFormats: ['audio/wav'], keywords: ['audio', 'volume', 'boost', 'normalize', 'loud', 'quiet'], isPopular: false, privacyLevel: 'local' },

  // Video Tools  
  { id: 'video-compress', name: 'Video Compressor', description: 'Reduce video file size (requires FFmpeg)', category: 'video', icon: 'Minimize2', route: '/tools/video-compress', inputFormats: ['video/mp4', 'video/webm'], outputFormats: ['video/mp4', 'video/webm'], keywords: ['video', 'compress', 'reduce', 'size', 'shrink'], isPopular: false, privacyLevel: 'local' },
  { id: 'video-convert', name: 'Video Converter', description: 'Convert between video formats (requires FFmpeg)', category: 'video', icon: 'ArrowRightLeft', route: '/tools/video-convert', inputFormats: ['video/mp4', 'video/webm', 'video/avi'], outputFormats: ['video/mp4', 'video/webm'], keywords: ['video', 'convert', 'mp4', 'webm', 'format'], isPopular: false, privacyLevel: 'local' },
  { id: 'video-to-gif', name: 'Video to GIF', description: 'Convert video clips to animated GIFs (requires FFmpeg)', category: 'video', icon: 'Film', route: '/tools/video-to-gif', inputFormats: ['video/mp4', 'video/webm'], outputFormats: ['image/gif'], keywords: ['video', 'gif', 'animated', 'convert', 'meme'], isPopular: false, privacyLevel: 'local' },

  // Data Tools
  { id: 'csv-to-json', name: 'CSV to JSON', description: 'Convert CSV files to JSON format', category: 'data', icon: 'ArrowRightLeft', route: '/tools/csv-to-json', inputFormats: ['text/csv'], outputFormats: ['application/json'], keywords: ['csv', 'json', 'convert', 'data', 'table'], isPopular: true, privacyLevel: 'local' },
  { id: 'json-to-csv', name: 'JSON to CSV', description: 'Convert JSON arrays to CSV format', category: 'data', icon: 'ArrowRightLeft', route: '/tools/json-to-csv', inputFormats: ['application/json'], outputFormats: ['text/csv'], keywords: ['json', 'csv', 'convert', 'data', 'table'], isPopular: true, privacyLevel: 'local' },
  { id: 'csv-to-xlsx', name: 'CSV to Excel', description: 'Convert CSV files to Excel spreadsheets', category: 'data', icon: 'Sheet', route: '/tools/csv-to-xlsx', inputFormats: ['text/csv'], outputFormats: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], keywords: ['csv', 'excel', 'xlsx', 'spreadsheet', 'convert'], isPopular: false, privacyLevel: 'local' },
  { id: 'xlsx-to-csv', name: 'Excel to CSV', description: 'Convert Excel spreadsheets to CSV', category: 'data', icon: 'Sheet', route: '/tools/xlsx-to-csv', inputFormats: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], outputFormats: ['text/csv'], keywords: ['excel', 'csv', 'xlsx', 'spreadsheet', 'convert'], isPopular: false, privacyLevel: 'local' },
  { id: 'json-to-xlsx', name: 'JSON to Excel', description: 'Convert JSON to Excel spreadsheets', category: 'data', icon: 'Sheet', route: '/tools/json-to-xlsx', inputFormats: ['application/json'], outputFormats: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], keywords: ['json', 'excel', 'xlsx', 'spreadsheet', 'convert'], isPopular: false, privacyLevel: 'local' },
  { id: 'xlsx-to-json', name: 'Excel to JSON', description: 'Convert Excel spreadsheets to JSON', category: 'data', icon: 'Sheet', route: '/tools/xlsx-to-json', inputFormats: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'], outputFormats: ['application/json'], keywords: ['excel', 'json', 'xlsx', 'spreadsheet', 'convert'], isPopular: false, privacyLevel: 'local' },

  // Code/Text Tools
  { id: 'json-formatter', name: 'JSON Beautifier', description: 'Format and validate JSON with syntax highlighting', category: 'developer', icon: 'Braces', route: '/tools/json-formatter', inputFormats: ['application/json'], outputFormats: ['application/json'], keywords: ['json', 'format', 'beautify', 'pretty', 'print', 'indent'], isPopular: true, privacyLevel: 'local' },
  { id: 'json-minifier', name: 'JSON Minifier', description: 'Minify JSON by removing whitespace', category: 'developer', icon: 'Braces', route: '/tools/json-minifier', inputFormats: ['application/json'], outputFormats: ['application/json'], keywords: ['json', 'minify', 'compact', 'compress', 'whitespace'], isPopular: false, privacyLevel: 'local' },
  { id: 'js-beautifier', name: 'JavaScript Beautifier', description: 'Format JavaScript and TypeScript code', category: 'developer', icon: 'Code', route: '/tools/js-beautifier', inputFormats: ['text/javascript'], outputFormats: ['text/javascript'], keywords: ['javascript', 'format', 'beautify', 'pretty', 'indent', 'typescript'], isPopular: false, privacyLevel: 'local' },
  { id: 'js-minifier', name: 'JavaScript Minifier', description: 'Minify JavaScript code with Terser', category: 'developer', icon: 'Code', route: '/tools/js-minifier', inputFormats: ['text/javascript'], outputFormats: ['text/javascript'], keywords: ['javascript', 'minify', 'uglify', 'compress', 'terser'], isPopular: false, privacyLevel: 'local' },
  { id: 'html-formatter', name: 'HTML Formatter', description: 'Format and indent HTML markup', category: 'developer', icon: 'Code', route: '/tools/html-formatter', inputFormats: ['text/html'], outputFormats: ['text/html'], keywords: ['html', 'format', 'beautify', 'indent', 'markup'], isPopular: false, privacyLevel: 'local' },
  { id: 'css-formatter', name: 'CSS Formatter', description: 'Format and organize CSS stylesheets', category: 'developer', icon: 'Paintbrush', route: '/tools/css-formatter', inputFormats: ['text/css'], outputFormats: ['text/css'], keywords: ['css', 'format', 'beautify', 'indent', 'style'], isPopular: false, privacyLevel: 'local' },
  { id: 'json-validator', name: 'JSON Validator', description: 'Validate JSON structure and report errors', category: 'developer', icon: 'CheckCircle', route: '/tools/json-validator', inputFormats: ['application/json'], outputFormats: [], keywords: ['json', 'validate', 'check', 'lint', 'error'], isPopular: false, privacyLevel: 'local' },
  
  // Text Utilities
  { id: 'text-cleaner', name: 'Text Cleaner', description: 'Remove extra whitespace, blank lines, and format text', category: 'text', icon: 'Eraser', route: '/tools/text-cleaner', inputFormats: ['text/plain'], outputFormats: ['text/plain'], keywords: ['text', 'clean', 'whitespace', 'blank', 'lines', 'format'], isPopular: false, privacyLevel: 'local' },
  { id: 'case-converter', name: 'Case Converter', description: 'Convert text between uppercase, lowercase, title case, and more', category: 'text', icon: 'CaseSensitive', route: '/tools/case-converter', inputFormats: ['text/plain'], outputFormats: ['text/plain'], keywords: ['case', 'uppercase', 'lowercase', 'title', 'camel', 'snake', 'text'], isPopular: false, privacyLevel: 'local' },
  { id: 'word-counter', name: 'Word Counter', description: 'Count words, characters, sentences, and paragraphs', category: 'text', icon: 'Hash', route: '/tools/word-counter', inputFormats: ['text/plain'], outputFormats: [], keywords: ['word', 'count', 'character', 'length', 'sentence', 'paragraph'], isPopular: false, privacyLevel: 'local' },
  { id: 'dedup-lines', name: 'Duplicate Line Remover', description: 'Remove duplicate lines from text', category: 'text', icon: 'ListX', route: '/tools/dedup-lines', inputFormats: ['text/plain'], outputFormats: ['text/plain'], keywords: ['duplicate', 'remove', 'unique', 'lines', 'dedup', 'text'], isPopular: false, privacyLevel: 'local' },
  { id: 'find-replace', name: 'Find & Replace', description: 'Find and replace text with regex support', category: 'text', icon: 'Search', route: '/tools/find-replace', inputFormats: ['text/plain'], outputFormats: ['text/plain'], keywords: ['find', 'replace', 'search', 'regex', 'text', 'substitute'], isPopular: false, privacyLevel: 'local' },
  { id: 'base64', name: 'Base64 Encoder/Decoder', description: 'Encode or decode Base64 strings', category: 'developer', icon: 'Binary', route: '/tools/base64', inputFormats: ['text/plain'], outputFormats: ['text/plain'], keywords: ['base64', 'encode', 'decode', 'binary', 'string'], isPopular: false, privacyLevel: 'local' },
  { id: 'url-encoder', name: 'URL Encoder/Decoder', description: 'Encode or decode URL strings', category: 'developer', icon: 'Link', route: '/tools/url-encoder', inputFormats: ['text/plain'], outputFormats: ['text/plain'], keywords: ['url', 'encode', 'decode', 'percent', 'uri'], isPopular: false, privacyLevel: 'local' },
  { id: 'hash-generator', name: 'Hash Generator', description: 'Generate MD5, SHA-1, SHA-256, SHA-512 hashes', category: 'developer', icon: 'Fingerprint', route: '/tools/hash-generator', inputFormats: ['text/plain'], outputFormats: ['text/plain'], keywords: ['hash', 'md5', 'sha', 'checksum', 'digest', 'crypto'], isPopular: false, privacyLevel: 'local' },

  // Developer Utilities
  { id: 'uuid-generator', name: 'UUID Generator', description: 'Generate random UUIDs (v4)', category: 'developer', icon: 'Key', route: '/tools/uuid-generator', inputFormats: [], outputFormats: ['text/plain'], keywords: ['uuid', 'guid', 'random', 'unique', 'id', 'generate'], isPopular: false, privacyLevel: 'local' },
  { id: 'jwt-decoder', name: 'JWT Decoder', description: 'Decode and inspect JWT tokens (does not verify signatures)', category: 'developer', icon: 'ShieldCheck', route: '/tools/jwt-decoder', inputFormats: ['text/plain'], outputFormats: [], keywords: ['jwt', 'token', 'decode', 'inspect', 'json', 'web', 'auth'], isPopular: false, privacyLevel: 'local' },
  { id: 'regex-tester', name: 'Regex Tester', description: 'Test regular expressions with live preview', category: 'developer', icon: 'Regex', route: '/tools/regex-tester', inputFormats: ['text/plain'], outputFormats: [], keywords: ['regex', 'regular', 'expression', 'pattern', 'match', 'test'], isPopular: false, privacyLevel: 'local' },
  { id: 'timestamp-converter', name: 'Timestamp Converter', description: 'Convert between Unix timestamps and dates', category: 'developer', icon: 'Clock', route: '/tools/timestamp-converter', inputFormats: [], outputFormats: [], keywords: ['timestamp', 'unix', 'date', 'time', 'epoch', 'convert'], isPopular: false, privacyLevel: 'local' },
  { id: 'color-converter', name: 'Color Converter', description: 'Convert colors between HEX, RGB, HSL formats', category: 'developer', icon: 'Palette', route: '/tools/color-converter', inputFormats: [], outputFormats: [], keywords: ['color', 'hex', 'rgb', 'hsl', 'convert', 'picker'], isPopular: false, privacyLevel: 'local' },
  { id: 'slug-generator', name: 'Slug Generator', description: 'Generate URL-friendly slugs from text', category: 'developer', icon: 'Link', route: '/tools/slug-generator', inputFormats: ['text/plain'], outputFormats: ['text/plain'], keywords: ['slug', 'url', 'seo', 'friendly', 'generate'], isPopular: false, privacyLevel: 'local' },
  { id: 'qr-generate', name: 'QR Code Generator', description: 'Generate QR codes from text or URLs', category: 'developer', icon: 'QrCode', route: '/tools/qr-generate', inputFormats: ['text/plain'], outputFormats: ['image/png'], keywords: ['qr', 'code', 'generate', 'barcode', 'scan'], isPopular: true, privacyLevel: 'local' },

  // AI Tools
  { id: 'ocr', name: 'OCR - Text Recognition', description: 'Extract text from images using Tesseract.js', category: 'ai', icon: 'ScanText', route: '/tools/ocr', inputFormats: ['image/png', 'image/jpeg', 'image/webp'], outputFormats: ['text/plain'], keywords: ['ocr', 'text', 'recognition', 'extract', 'image', 'scan', 'read'], isPopular: true, privacyLevel: 'local' },
  { id: 'document-summarizer', name: 'Document Summarizer', description: 'Generate extractive summaries from text documents', category: 'ai', icon: 'FileSearch', route: '/tools/document-summarizer', inputFormats: ['text/plain', 'application/pdf'], outputFormats: ['text/plain'], keywords: ['summarize', 'summary', 'extract', 'key', 'points', 'document', 'brief'], isPopular: false, privacyLevel: 'local' },

  // Compression Center
  { id: 'compress-all', name: 'Universal Compressor', description: 'Smart compression for PDFs, images, audio, and video', category: 'compression', icon: 'Minimize2', route: '/tools/compress-all', inputFormats: ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'audio/wav', 'video/mp4'], outputFormats: [], keywords: ['compress', 'reduce', 'optimize', 'size', 'all', 'universal'], isPopular: true, privacyLevel: 'local' },
];

// Helper functions
export function getToolById(id: string): Tool | undefined {
  return tools.find(t => t.id === id);
}

export function getToolsByCategory(category: ToolCategory): Tool[] {
  return tools.filter(t => t.category === category);
}

export function getPopularTools(): Tool[] {
  return tools.filter(t => t.isPopular);
}

export function getCategoryInfo(id: ToolCategory): CategoryInfo | undefined {
  return categories.find(c => c.id === id);
}

export function searchTools(query: string): Tool[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const terms = q.split(/\s+/);
  return tools
    .map(tool => {
      let score = 0;
      const searchable = [tool.name, tool.description, ...tool.keywords, ...tool.inputFormats, ...tool.outputFormats].join(' ').toLowerCase();
      for (const term of terms) {
        if (tool.name.toLowerCase().includes(term)) score += 10;
        if (tool.keywords.some(k => k.includes(term))) score += 5;
        if (tool.description.toLowerCase().includes(term)) score += 3;
        if (searchable.includes(term)) score += 1;
      }
      return { tool, score };
    })
    .filter(r => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(r => r.tool);
}
