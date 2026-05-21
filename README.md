# md-viewer

A cross-platform Markdown viewer and editor built with Tauri 2 + Svelte 5.

## Status

v0.1.0 — Milestone 1 complete. See [build plan](docs/build-plan.md) for details.

## Downloads

| Platform | Installer |
|---|---|
| Windows (MSI) | `src-tauri/target/release/bundle/msi/Markdown Viewer_0.1.0_x64_en-US.msi` |
| Windows (NSIS) | `src-tauri/target/release/bundle/nsis/Markdown Viewer_0.1.0_x64-setup.exe` |

Build your own: `npx tauri build`

## Quick Start

```bash
npm install
npx tauri dev       # development mode (HMR)
npx tauri build     # production build + installer
```

## Run Tests

```bash
npm test            # unit tests (Vitest)
npm run test:e2e    # E2E tests (Playwright)
```

## Features

- **View modes**: Preview (default), Source, and Split (side-by-side)
- **Live preview**: Debounced Markdown rendering with sanitized HTML
- **Tabbed editing**: Multiple files open simultaneously
- **File tree**: Lazy-loading folder explorer with supported-files filter
- **Dark mode**: Toggle in the toolbar (persisted across sessions)
- **State persistence**: Open tabs, folder, view modes, and settings restored on restart
- **OS file associations**: Registers for `.md`, `.markdown`, `.mdown`, `.txt`, `.text`, `.log`

## Tech Stack

| Layer | Choice |
|---|---|
| Desktop shell | Tauri 2 |
| Frontend | Svelte 5 (runes) |
| Editor | CodeMirror 6 |
| Markdown | markdown-it + DOMPurify |
| Backend | Rust |
| Testing | Vitest + Playwright |

## Project Structure

```
src/              Svelte frontend
  lib/
    components/   UI components
    stores/       Svelte runes state (tabs, fileTree, settings, theme)
    utils/        markdown, debounce, file utils, persistence
src-tauri/        Rust backend
  src/
    commands.rs   IPC commands (read/write/list_dir)
    lib.rs        Tauri app bootstrap
tests/
  unit/           Vitest tests
  e2e/            Playwright tests
```

## Icon

To replace the app icon with your own:
```
node scripts/process-icon.mjs   # trims white border
npx tauri icon src-tauri/icons/icon-processed.png
```
