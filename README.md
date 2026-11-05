# FileDoctor

> **Your files. Feeling lighter.**  
> *Convert. Compress. Protect. All inside your browser.*

---

## Overview

**FileDoctor** is a privacy-first web platform combining the capabilities of **iLovePDF**, **Smallpdf**, **TinyPNG**, and **CloudConvert** into a unified browser-native clinic.

Every tool executes **100% locally** inside the client browser. No user account is required, no backend file upload servers exist, and sensitive documents never traverse the public network.

---

## Visual Identity: Arctic Pulse

FileDoctor utilizes the **Arctic Pulse** design system:
- **Ink Navy** (`#10172A`) & **Deep Navy** (`#151F35`): Primary dark backgrounds
- **Surface Navy** (`#1B2942`) & **Elevated Navy** (`#243653`): Card & container surfaces
- **Electric Blue** (`#496BFF`) & **Bright Blue** (`#6382FF`): Primary interactive actions
- **Arctic Mint** (`#48DCC7`): Privacy badges & secondary highlights
- **Coral** (`#FF788C`): PDF Clinic accent & alert states
- **Amber** (`#FFBF69`): Caution & warnings
- **Success** (`#35C98A`): Verified operations

---

## Architecture & Specialized Clinics

### 1. PDF Clinic
- **PDF Compressor (Core Feature)**:
  - Presets: *Light*, *Balanced*, *Strong*, *Maximum practical compression*.
  - Percentage-based reduction with real-time target output calculation.
  - Target file size (KB/MB) matching with iterative stream packing.
  - Advanced controls: downsampling, grayscale conversion, metadata stripping, and rasterization mode.
- **Merge PDFs**: Multi-file drag/drop reordering and stream concatenation.
- **Split PDF**: Single page extraction and custom range slicing (e.g. `1-3, 5`).
- **PDF to Images**: High-DPI export to PNG, JPEG, or WebP.
- **Images to PDF**: Convert photos/scans into formatted A4/Letter PDFs with margin controls.
- **Sign PDF**: Visual signature overlay (Draw, Type, or Upload) with interactive positioning.
- **Rotate, Watermark, & Flatten**: Page rotation, diagonal security watermarks, and form flattening.

### 2. Image Studio
- **Image Compressor**: Canvas quantization and WebP/JPEG re-encoding.
- **Image Converter**: Pixel transcoding between PNG, JPEG, WebP, and BMP.
- **Image Resizer**: Exact pixel dimensions or percentage scaling with aspect-ratio locking.
- **Metadata Remover**: Permanent stripping of EXIF GPS coordinates, device IDs, and camera serials.
- **Color Palette Extractor**: Dominant color swatches with HEX, RGB, HSL, CSS variables, and JSON export.
- **Image Filters**: Real-time grayscale, brightness, contrast, blur, and invert.

### 3. Audio & Video Studio
- **Audio Converter**: Web Audio API decoding and PCM WAV transcoding.
- **Audio Trimmer**: Timeline-based clipping with sample-accurate offline rendering.
- **Volume & Normalizer**: Gain multipliers and broadcast peak normalization without distortion.

### 4. Data & Text Lab
- **Data Conversion**: Bidirectional conversions between CSV, JSON, and Excel (`.xlsx`).
- **Code Tools**: JSON beautifier/minifier, JavaScript minification via Terser, HTML/CSS formatting.
- **Text Tools**: Whitespace cleanup, duplicate line removal, case conversion, and word counting.
- **Developer Utilities**: UUID v4 generation, JWT decoding with expiry check, Regex testing, and QR code generation.

### 5. AI Utilities (Local & Private)
- **OCR Engine**: On-device character recognition powered by Tesseract.js in Web Workers.
- **Document Summarizer**: Extractive TF-IDF sentence scoring for executive briefs and action items.
- **Document Q&A**: In-document passage relevance retrieval without external LLM API leakage.

### 6. Local Vault & History
- **IndexedDB**: Operation logs and retained outputs are stored in `filedoctor-db`.
- **Zero Telemetry**: No tracking scripts, cookies, or telemetry.

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Animations | Framer Motion |
| State Management | Zustand |
| Routing | React Router 7 |
| PDF Processing | `pdf-lib` + `pdfjs-dist` |
| Image Processing | HTML5 Canvas + Web APIs |
| Data Processing | PapaParse + SheetJS (`xlsx`) |
| Minification | Terser |
| Audio Engine | Web Audio API |
| OCR | Tesseract.js |
| Local Storage | IndexedDB + localStorage |
| Testing | Vitest + React Testing Library |

---

## Development & Verification

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Run Unit & Integration Tests
```bash
npm run test
```

### Typecheck & Lint
```bash
npm run typecheck
npm run lint
```

### Production Build
```bash
npm run build
```

---

## Privacy Guarantee

FileDoctor guarantees that **zero file data ever leaves your device**. All computation takes place in temporary browser RAM and is discarded or retained strictly at your explicit instruction.
