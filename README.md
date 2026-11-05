# FileDoctor

> **Your files. Feeling lighter.**  
> *Convert. Compress. Protect. All inside your browser.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Tests: 45 Passing](https://img.shields.io/badge/Tests-45%20Passing-emerald.svg)]()
[![Privacy: 100% Client--Side](https://img.shields.io/badge/Privacy-100%25%20Client--Side-48DCC7.svg)]()
[![Production: Live](https://img.shields.io/badge/Deployment-Vercel-black.svg)](https://file-doctor-shashis-projects-4eccf047.vercel.app)

---

## Live Application

Access the production deployment:  
👉 **[https://file-doctor-shashis-projects-4eccf047.vercel.app](https://file-doctor-shashis-projects-4eccf047.vercel.app)**

---

## Overview

**FileDoctor** is a privacy-first web platform combining the capabilities of **iLovePDF**, **Smallpdf**, **TinyPNG**, and **CloudConvert** into a unified browser-native clinic, enhanced with **interactive document creation**, **handwritten vector signatures**, and **smart camera scanning**.

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

### 1. Creation Studio (`/create`)
A browser-native studio for generating digital assets from scratch:
- **Document & PDF Studio (`/create?tab=doc`)**:
  - Direct WYSIWYG editing on a live A4/Letter sheet.
  - Interactive block system: Headings, Paragraphs, Bullets, Tables, KPI Stat Cards, Callout Boxes, and Rule Dividers.
  - **Handwritten Signature Pad**: Draw smooth signatures with multi-ink colors and stroke weights, embedded directly into the document.
  - **Camera & Photo Snap**: Embed receipts, IDs, or paper photos directly from camera into documents.
  - **Official Rubber Stamps**: `PAID`, `APPROVED`, `CONFIDENTIAL`, `DRAFT`, `ORIGINAL`, `VERIFIED`.
  - **Instant 1-Click Templates**: Commercial Tax Invoices, Executive SOW Proposals, Certificates of Excellence, Corporate Letterheads, and Meeting Minutes.
  - **Multi-Format Export**: High-fidelity vector PDF (`pdf-lib`), formatted Word `.doc` (HTML Word XML), structured Markdown (`.md`), and native Print.
- **Graphic & Canvas Studio (`/create?tab=image`)**:
  - Aspect ratio presets: 1:1 Square, Social Banner, YouTube Thumbnail, Story/Reel, and Custom dimensions.
  - Gradient themes, solid fills, text overlays, typography controls, and "Snap Photo onto Canvas" webcam integration.
  - Export to PNG, JPEG, or WebP.
- **Voice & Audio Studio (`/create?tab=audio`)**:
  - Live microphone recording with a 60 FPS real-time audio frequency visualizer (`AudioContext` + `AnalyserNode`).
  - Studio WAV export encoded directly as uncompressed 16-bit PCM.
- **Spreadsheet & Table Generator (`/create?tab=data`)**:
  - Interactive spreadsheet grid with dynamic column/row manipulation.
  - 1-Click export to **Excel (.xlsx)** via SheetJS or standard **CSV**.

### 2. Universal Camera & Document Scanner Pipeline
- **AI Camera Document Scanner (`/tools/pdf-scan`)**:
  - Live environment/user camera switching with shutter snapshot.
  - Interactive 4-corner homography perspective warp with draggable corner reticles.
  - 5 CamScanner filters: `Magic Color`, `Crisp B&W`, `Grayscale`, `High Contrast`, `Normal`.
  - Multi-page reel management (rotate 90°, delete, reorder) with instant PDF compilation.
- **Universal Camera Snap in Upload Zones**:
  - Intelligent format adaptation: camera snaps on PDF tools automatically convert into clean single-page vector PDFs; on image tools, they feed as high-res JPEGs.

### 3. PDF Clinic
- **PDF Compressor (Core Feature)**:
  - Presets: *Light*, *Balanced*, *Strong*, *Maximum practical compression*.
  - Percentage-based reduction with real-time target output calculation.
  - Target file size (KB/MB) matching with iterative stream packing.
  - Advanced controls: downsampling, grayscale conversion, metadata stripping, and rasterization mode.
- **Visual PDF Page Organizer (`/tools/pdf-organize`)**:
  - PDF.js page thumbnail cards, drag-and-drop / arrow reordering, 90° rotation, page duplication, and page deletion.
- **Merge PDFs**: Multi-file drag/drop reordering and stream concatenation.
- **Split PDF**: Single page extraction and custom range slicing (e.g. `1-3, 5`).
- **PDF to Images**: High-DPI export to PNG, JPEG, or WebP.
- **Images to PDF**: Convert photos/scans into formatted A4/Letter PDFs with margin controls and quick camera snapping.
- **Sign PDF**: Visual signature overlay (Draw, Type, or Upload) with interactive positioning.
- **Rotate, Watermark, & Flatten**: Page rotation, diagonal security watermarks, and form flattening.

### 4. Image Studio
- **Image Compressor**: Canvas quantization and WebP/JPEG re-encoding.
- **Image Converter**: Pixel transcoding between PNG, JPEG, WebP, and BMP.
- **Image Resizer**: Exact pixel dimensions or percentage scaling with aspect-ratio locking.
- **Metadata Remover**: Permanent stripping of EXIF GPS coordinates, device IDs, and camera serials.
- **Color Palette Extractor**: Dominant color swatches with HEX, RGB, HSL, CSS variables, and JSON export.
- **Image Filters**: Real-time grayscale, brightness, contrast, blur, and invert.

### 5. Audio & Video Studio
- **Audio Converter**: Web Audio API decoding and PCM WAV transcoding.
- **Audio Trimmer**: Timeline-based clipping with sample-accurate offline rendering.
- **Volume & Normalizer**: Gain multipliers and broadcast peak normalization without distortion.

### 6. Data & Text Lab
- **Data Conversion**: Bidirectional conversions between CSV, JSON, and Excel (`.xlsx`).
- **Code Tools**: JSON beautifier/minifier, JavaScript minification via Terser, HTML/CSS formatting.
- **Text Tools**: Whitespace cleanup, duplicate line removal, case conversion, and word counting.
- **Developer Utilities**: UUID v4 generation, JWT decoding with expiry check, Regex testing, and QR code generation.

### 7. AI Utilities (Local & Private)
- **OCR Engine**: On-device character recognition powered by Tesseract.js in Web Workers.
- **Document Summarizer**: Extractive TF-IDF sentence scoring for executive briefs and action items.
- **Document Q&A**: In-document passage relevance retrieval without external LLM API leakage.

### 8. Local Vault & History
- **IndexedDB**: Operation logs and retained outputs are stored locally in `filedoctor-db`.
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
