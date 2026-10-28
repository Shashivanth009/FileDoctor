# FileDoctor

> Your files. Your browser. Your control.

FileDoctor is a **privacy-first, browser-based file processing suite** that lets you convert, compress, organize, and transform files without creating an account or uploading to a server.

## Features

### PDF Clinic
| Tool | Status |
|------|--------|
| Merge PDF | ✅ Real processing |
| Split PDF | ✅ Real processing |
| Compress PDF | ⚡ Partial (structural rebuild via pdf-lib) |
| PDF to Images | ✅ Real processing (pdfjs-dist) |
| Images to PDF | ✅ Real processing |
| Sign PDF | ✅ Real processing (visual signature) |

### Image Studio
| Tool | Status |
|------|--------|
| Convert Images | ✅ Real processing (Canvas API) |
| Resize Images | ✅ Real processing (Canvas API) |
| Compress Images | ✅ Real processing (browser-image-compression) |
| Strip Metadata | ✅ Real processing (canvas re-encode) |
| Color Palette | ✅ Real processing (pixel analysis) |

### Data & Text
| Tool | Status |
|------|--------|
| CSV / JSON / Excel | ✅ Real processing (papaparse + xlsx) |
| Code Formatter | ✅ Real processing (built-in parser) |
| Text Cleaner | ✅ Real processing |

### Audio & Video
| Tool | Status |
|------|--------|
| Trim & Volume | ⚡ Partial — WAV export via Web Audio API |
| Audio Converter | ⚡ Partial — format support limited by browser codecs |

### AI Utilities
| Tool | Status |
|------|--------|
| Document Summarizer | ⚡ Local extractive summary only; no generative AI |
| OCR Extractor | ⚡ Tesseract.js (downloads ~10 MB language data on first use) |

## Privacy

- All core processing runs **locally in your browser**
- No file upload server for core operations
- No account required
- No telemetry or tracking
- Operation history stores metadata only (filenames, sizes, timestamps)

## Tech Stack

- **React 19** + TypeScript + Vite
- **Tailwind CSS** + Framer Motion + Lucide React
- **pdf-lib** — PDF creation and manipulation
- **pdfjs-dist** — PDF rendering
- **browser-image-compression** — Image compression
- **papaparse** — CSV parsing
- **xlsx** — Excel read/write
- **tesseract.js** — OCR (loaded on demand)
- **fflate** — ZIP creation
- **idb** — IndexedDB wrapper

## Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Test

```bash
npm test
```

## Type Check

```bash
npm run typecheck
```

## Deployment

Configured for **Vercel static hosting** via `vercel.json`. The SPA rewrite rule ensures nested routes work after refresh.

No backend or database required.

## Known Limitations

- **PDF compression**: pdf-lib structural rebuild doesn't compress image-heavy PDFs significantly
- **Audio export**: Only WAV (PCM) is available; MP3/M4A encoding requires a WASM codec not currently bundled
- **OCR**: Requires Tesseract.js language data download (~10 MB) on first use per language
- **HEIC/AVIF**: Not supported without additional native decoders
- **PDF signature**: Visual electronic signature only — not a cryptographic certificate
