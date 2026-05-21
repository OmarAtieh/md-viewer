# Build Plan — md-viewer

## Tech Stack (Decided)

| Layer | Choice | Reason |
|---|---|---|
| Desktop shell | Tauri 2 | Cross-platform (Win/Mac/Linux), lightweight, system webview |
| Frontend | Svelte 5 (runes) | Minimal boilerplate, excellent Tauri pairing, small bundle |
| Bundler | Vite | Default for Svelte + Tauri, fast |
| Language (frontend) | TypeScript | Type safety for complex state |
| Language (backend) | Rust | Tauri's native |
| Markdown parser | markdown-it + DOMPurify | CommonMark/GFM, widely used, sanitization built in |
| Editor | CodeMirror 6 | Designed for large documents, extensible |
| File watching | notify crate (Rust) | Cross-platform FS events |
| Testing (unit) | Vitest | Fast, Vite-native, works with Svelte |
| Testing (E2E) | Playwright | Cross-browser, Tauri E2E support via `@playwright/test` |

## Milestone 1 — Scaffold + Core Editing

### 1.1 Project Scaffold

- `npm create tauri-app@latest` with Svelte + TypeScript + Vite template
- Set up `package.json` scripts: `dev`, `build`, `preview`, `test`, `test:e2e`
- Install frontend deps:
  - `codemirror`, `@codemirror/lang-markdown`, `@codemirror/state`, `@codemirror/view`, `@codemirror/theme-one-dark`
  - `markdown-it`, `dompurify`
  - `@tauri-apps/api`, `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs`
- Install dev deps:
  - `vitest`, `@playwright/test`, `@sveltejs/vite-plugin-svelte` (included by template)
  - `@types/dompurify`, `@types/markdown-it`
- Add Rust crate deps to `src-tauri/Cargo.toml`:
  - `serde`, `serde_json`
  - `tauri-plugin-dialog`, `tauri-plugin-fs` (already in Tauri 2 plugin system)
  - `notify` (for file watching in M2, can add later)

### 1.2 Directory Structure

```
md-viewer/
├── src-tauri/
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   └── commands.rs          # Tauri IPC commands
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   │   └── default.json         # Permissions
│   └── icons/
├── src/
│   ├── lib/
│   │   ├── components/
│   │   │   ├── AppShell.svelte      # Main layout (tree + tabs + editor)
│   │   │   ├── FileTree.svelte      # Lazy file tree
│   │   │   ├── TabBar.svelte        # Tab row
│   │   │   ├── EditorPane.svelte    # CodeMirror wrapper
│   │   │   ├── PreviewPane.svelte   # Rendered HTML
│   │   │   ├── SplitPane.svelte     # Resizable split
│   │   │   └── Toolbar.svelte       # Source/Preview/Split + Save buttons
│   │   ├── stores/
│   │   │   ├── tabs.svelte.ts       # Open tabs state (runes)
│   │   │   ├── fileTree.svelte.ts   # File tree state
│   │   │   └── settings.svelte.ts   # App settings
│   │   ├── utils/
│   │   │   ├── markdown.ts          # Render + sanitize
│   │   │   ├── debounce.ts          # Debounce helper
│   │   │   └── fileUtils.ts         # Extension checks, etc.
│   │   └── types.ts                 # Shared TS types
│   ├── App.svelte
│   ├── main.ts
│   └── app.css
├── tests/
│   ├── unit/
│   │   ├── markdown.test.ts
│   │   └── debounce.test.ts
│   └── e2e/
│       ├── basic.spec.ts
│       └── fixtures/
├── package.json
├── vite.config.ts
├── svelte.config.js
├── tsconfig.json
├── playwright.config.ts
└── README.md
```

### 1.3 Backend Commands (Rust)

Expose Tauri commands in `commands.rs`:

| Command | Input | Output | Description |
|---|---|---|---|
| `open_file_dialog` | (none) | `Option<Vec<String>>` | Native OS file picker for supported files |
| `open_folder_dialog` | (none) | `Option<String>` | Native OS folder picker |
| `read_file` | `path: String` | `String` | Read file contents (UTF-8) |
| `write_file` | `path: String, content: String` | `Result<()>` | Write content to file |
| `list_dir` | `path: String` | `Vec<DirEntry>` | List directory children (name, type, extension) |

DirEntry type:
```rust
struct DirEntry {
    name: String,
    path: String,
    is_dir: bool,
    extension: Option<String>,
}
```

### 1.4 Frontend Architecture

**AppShell.svelte** — root layout:
- Toolbar at top
- Left sidebar: FileTree
- Center: TabBar + EditorPane / PreviewPane / SplitPane

**State (runes-based stores)**:
- `tabs.svelte.ts`: `$state()` array of `{ id, path, content, isDirty, viewMode }`. Only active tab keeps editor instance; inactive tabs store content snapshot + path + dirty flag.
- `fileTree.svelte.ts`: `$state()` lazy-loaded tree. Each node: `{ name, path, isDir, children?, loaded? }`. Children loaded on expand via `list_dir` IPC call.
- `settings.svelte.ts`: `$state()` for `showSupportedOnly`, `debounceMs`, etc.

**CodeMirror integration** (`EditorPane.svelte`):
- Mount CM6 on a `<div>` via Svelte `use:action` or `onMount`
- Use `@codemirror/lang-markdown` for syntax highlighting
- On content change, fire debounced preview update

**Preview** (`PreviewPane.svelte`):
- Render markdown → HTML via `markdown-it`
- Sanitize via DOMPurify
- Set `innerHTML` on a container div
- Debounce at 150ms default

**View modes**:
- `source`: EditorPane fills workspace
- `preview`: PreviewPane fills workspace
- `split`: Both side by side (flex/grid with resize handle via SplitPane)

### 1.5 Supported Files (M1)

Markdown: `.md`, `.markdown`, `.mdown`
Text: `.txt`, `.text`, `.log`

### 1.6 Testing Plan

**Unit tests (Vitest)**:
- `markdown.test.ts`: markdown-it rendering, DOMPurify sanitization, extension filtering
- `debounce.test.ts`: debounce timing
- `fileUtils.test.ts`: isSupportedFile, classifyFile

**E2E tests (Playwright)**:
- `basic.spec.ts`: Launch app, open file, verify source mode, toggle preview, toggle split, save
- Use `@playwright/test` with Tauri's E2E utilities (`@tauri-apps/test` or direct binary launch)

### 1.7 Milestone 1 Delivery Checklist

- [ ] `npm run dev` starts Tauri dev server with Svelte HMR
- [ ] Open File dialog works, loads content into a tab
- [ ] Open Folder dialog works, shows lazy file tree
- [ ] File tree expand/collapse loads children on demand
- [ ] Tabs open, close, reorder (basic)
- [ ] Source mode: CodeMirror with Markdown syntax highlighting
- [ ] Preview mode: rendered HTML (sanitized)
- [ ] Split mode: source + preview side by side
- [ ] Live preview updates on edit (debounced ~150ms)
- [ ] Save writes back to source file
- [ ] Save As writes to new path
- [ ] Supported-files-only filter works
- [ ] Dirty tab indicator visible
- [ ] Large file mode triggered >2MB (manual/preview-off)
- [ ] Unit tests pass
- [ ] E2E tests pass

## Milestones 2–5 (Summary)

| M | Focus | Key Work |
|---|---|---|
| 2 | File watching, themes, settings | `notify` crate integration, theme switcher, settings persistence, filename search |
| 3 | Content search, perf | Streaming search (ripgrep-style), virtualized tree, memory tuning for many tabs |
| 4 | Windows installer | MSI/Wix installer, Explorer context menu ("Open in md-viewer") |
| 5 | Optional: Explorer preview handler | `IPreviewHandler` COM registration, WebView2 preview, conflict detection |

## State Management Detail (Svelte 5 Runes)

```typescript
// src/lib/stores/tabs.svelte.ts
export interface Tab {
  id: string;
  filePath: string;
  content: string;
  isDirty: boolean;
  viewMode: 'source' | 'preview' | 'split';
}

let tabs = $state<Tab[]>([]);
let activeTabId = $state<string | null>(null);

export function openTab(path: string, content: string) { ... }
export function closeTab(id: string) { ... }
export function setActiveTab(id: string) { ... }
export function updateContent(id: string, content: string) { ... }
export function markClean(id: string) { ... }

// File in .ts extension but Svelte 5 processes $state/$derived in .svelte.ts files
```

## IPC Flow Example

```
User clicks file in FileTree.svelte
  → dispatch openFile(path)
  → AppShell calls invoke('read_file', { path })
  → Rust reads file, returns String
  → AppShell calls openTab(path, content)
  → tabs store adds entry
  → TabBar renders new tab
  → EditorPane mounts CodeMirror with content
  → User types → CM6 update → debounce → markdown-it render → PreviewPane
  → User clicks Save → invoke('write_file', { path, content }) → tabs.markClean()
```

## Security Model

- DOMPurify sanitizes all markdown-rendered HTML before injection
- Raw HTML in markdown: disabled by default via markdown-it option `html: false`
- Remote images/resources: blocked by default (CSP + markdown-it option)
- Local images: resolved relative to file path in M2
- Tauri capabilities scoped to read/write only to opened files/folders
- No shell/process access in M1
