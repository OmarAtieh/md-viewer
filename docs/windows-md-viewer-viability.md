# Markdown Viewer Viability Spike

## Goal

Evaluate the simplest way to support:

- Windows File Explorer preview for Markdown files.
- A tabbed Markdown explorer/editor.
- Markdown-first file focus for the initial product, with plain text supported because it does not require rendering.
- View modes: rendered Markdown only, source only, or source plus rendered preview.
- Live preview while editing.
- Save changes back to the source file, or save as a separate file.
- Cross-platform viability for the editor experience.
- Efficient handling of large text/Markdown files, many supported files, and deep or wide folder trees.

## Short Answer

Build the real product as a standalone cross-platform desktop app first. Treat Windows File Explorer preview as a separate, optional Windows-only integration. Keep the first app Markdown-first, with plain text support.

Reason: Windows preview handlers are designed for lightweight, read-only previews hosted by File Explorer. The tabbed editing, live preview, save, and save-as workflow should not live inside Explorer's preview pane.

## Current Windows Baseline

Microsoft PowerToys already includes File Explorer add-ons for Markdown preview. That means a basic Markdown preview pane on Windows is not a missing capability; users can already get it by installing PowerToys.

Building our own preview handler is still viable if we need:

- A specific Markdown dialect or GitHub-like styling.
- Local image handling that PowerToys does not cover well enough.
- Mermaid, math, front matter, custom themes, or security controls.
- A unified installer that includes the app and preview handler.
- Integration with our own app, for example an "Open in Markdown Viewer" command.

## Windows Explorer Preview Handler

Windows File Explorer preview integration means implementing a Shell preview handler. The relevant Windows interface is `IPreviewHandler`; registration is COM/registry based.

Viability: feasible, but not the simplest first step.

Implementation shape:

- Implement a Windows-only preview handler for `.md`, `.markdown`, and optionally `.mdown`.
- Initialize through `IInitializeWithStream` where possible.
- Render Markdown to sanitized HTML.
- Display the result in a child window, likely using WebView2.
- Register the handler under the Markdown file type ProgID and preview handler registry keys.
- Package registration/unregistration in an installer.

Important constraints:

- Preview handlers are read-only. They are not the right place for editing or saving.
- They run under Shell hosting rules and may run in `prevhost.exe`.
- Low-integrity hosting is the default security posture and should be kept.
- Microsoft recommends against managed in-process Shell extensions. Preview handlers can be managed only if arranged to run in their own surrogate process.
- Registration can conflict with other preview handlers, including PowerToys or VS Code associations.

Simplest Windows-only preview route:

1. Do not build a preview handler initially. Document PowerToys as the supported Explorer preview path.
2. Build the standalone editor.
3. Add an installer option later: "Enable Explorer preview integration".
4. If custom preview is needed, base the design on the PowerToys approach: WebView2 rendering inside a Shell preview handler.

## Cross-Platform Editor App

The editor/viewer is straightforward as a normal desktop app.

Recommended stack:

- Tauri 2 for a lightweight cross-platform shell.
- Web frontend for the editor/preview UI.
- CodeMirror 6 for Markdown source editing.
- `markdown-it` or another CommonMark/GFM-compatible parser for rendering.
- A sanitizer such as DOMPurify before rendering HTML.
- Rust backend commands for file open/save/save-as and filesystem watching.

Why Tauri:

- Cross-platform desktop target: Windows, macOS, Linux.
- Uses WebView2 on Windows, WKWebView on macOS, and WebKitGTK on Linux.
- Smaller app footprint than Electron because it uses system webviews.
- File operations can be kept in the Rust backend with a narrow permission model.

Electron is also viable:

- Simpler if the whole team is JavaScript-first.
- Bundled Chromium gives more consistent rendering across OSes.
- Larger install size and higher baseline memory use.

For this app, Tauri is likely the better default unless pixel-identical rendering across platforms matters more than size.

## Supported File Scope

For now, the app should discover, open, edit, and save Markdown plus plain text files. Only Markdown files need rendered preview.

Initial Markdown extensions:

- `.md`
- `.markdown`
- `.mdown`

Initial text extensions:

- `.txt`
- `.text`
- `.log`

Generic text fallback:

- When "supported files only" is unchecked, allow opening an unsupported extension if a small initial read looks like UTF-8 or UTF-16 text.
- Treat generic text fallback files as source-only.
- Never run generic text fallback files through Markdown rendering.
- Reject or warn on binary-looking files.

Optional later:

- `.mkd`
- `.mdx`
- `.rst`
- `.adoc`

MDX should not be part of the first version unless it is explicitly required, because it changes the rendering and security model.

This supported-file scope helps performance because the app does not need to scan, classify, index, parse, or syntax-highlight arbitrary source files. Files outside the supported extensions should stay hidden in the app explorer by default, with a user-visible checkbox to reveal them.

Plain text behavior:

- Source mode is always available.
- Save and Save As work the same as Markdown.
- Preview mode can either be disabled or show escaped monospace text.
- Split mode should be disabled unless a text preview is explicitly useful.
- Text files should not enter the Markdown render pipeline.

## Performance Requirements

The app should be designed around lazy work. Large repositories and note folders can contain thousands of Markdown files, very deep folder paths, or a few huge Markdown files.

Folder tree:

- Do not recursively scan the entire folder before showing the UI.
- Load directory children only when the user expands a folder.
- At each expanded level, always show subfolders.
- When "supported files only" is checked, show only supported files.
- When "supported files only" is unchecked, show all files; unsupported files should be visually muted until opened through the generic text fallback.
- Do not recursively inspect subfolders just to decide whether to show them.
- Virtualize the visible tree rows so wide folders do not create thousands of DOM nodes at once.
- Use a background task for discovery so the UI stays responsive.
- Add cancellation when the user closes a folder, switches roots, or collapses a long-running branch.
- Cache directory results with invalidation from filesystem watcher events.
- Put hard limits on initial render counts for very wide folders, with incremental "load more" behavior.

File list/search:

- Start with filename search over loaded nodes only.
- Add background supported-file discovery later if global search is needed.
- Avoid content indexing in the first prototype.
- If content search is added, use ripgrep-style streaming search rather than pre-indexing every file.

Large file editing:

- Prefer CodeMirror 6 because it is designed around an editor state model that can handle sizeable text documents better than a basic textarea.
- Avoid re-rendering the entire preview on every keystroke for very large files.
- Debounce preview updates, starting around 150 ms for normal files and increasing for large files.
- Add a large-file mode threshold, for example 2-5 MB, where preview updates become manual or section-based.
- Show source immediately, then render preview asynchronously.
- Keep only active tab editor instances mounted; inactive tabs can keep path, dirty state, and text snapshot without a live editor view.

Markdown rendering:

- Use incremental-feeling UX even if the parser itself is whole-document at first.
- Run heavy rendering outside the main UI path where possible.
- Cache rendered HTML by file path plus content version for unchanged tabs.
- For giant files, support source-only mode as the reliable fallback.
- Defer expensive optional features such as Mermaid, math, diagram rendering, and remote image fetching.

Memory:

- Do not hold parsed/rendered HTML for every discovered file.
- Keep content loaded only for open tabs.
- Set a maximum number of warm inactive tabs before releasing editor and preview DOM.
- Avoid generating previews for files selected only during fast keyboard navigation until selection settles.

File watching:

- Watch the opened root recursively only if the platform implementation is reliable at the target scale.
- Otherwise watch expanded directories and open files first.
- Coalesce bursts of filesystem events.
- If a file changed externally and the tab is dirty, prompt before overwriting or reloading.

## Proposed UX

Main window:

- Left pane: lazy file tree rooted at an opened folder.
- Explorer checkbox: supported files only.
- Top row: tabs for open supported files.
- Center: split workspace.
- Toolbar: source, preview, split, save, save as.

Modes:

- Source: CodeMirror fills the workspace.
- Preview: rendered HTML fills the workspace.
- Split: source left, preview right.

Behavior:

- Open File opens one or more supported files directly.
- Open Folder opens a root folder in the filtered explorer.
- Opening a supported file creates or focuses a tab.
- Editing Markdown updates preview with debounce, for example 100-250 ms.
- Dirty tabs show an unsaved indicator.
- Save writes to the current source path.
- Save As writes to a chosen path and can either keep editing the new file or export a copy.
- External file changes should trigger a reload prompt if the tab has unsaved edits.

## Security Notes

Markdown rendering should be treated as untrusted content.

Default behavior:

- Disable raw HTML, or sanitize aggressively.
- Block remote resource loading by default.
- Resolve local images relative to the Markdown file path.
- Avoid executing scripts.
- For Mermaid or math support, add explicit feature flags later.

This matters more in Explorer preview because selecting a file should never execute active content.

## Recommended First Prototype

Build only the standalone app first.

Milestone 1:

- Tauri app scaffold.
- Open File dialog for supported files.
- Open folder.
- Lazy file tree with "supported files only" checkbox enabled by default.
- Tabs.
- Source/preview/split toggle.
- Live preview.
- Save and Save As.
- Basic large-file guardrails: debounced preview, async render state, and manual preview fallback above a size threshold.

Milestone 2:

- File watching and external-change prompts.
- Local image support.
- Theme support.
- Basic settings.
- Filename search over loaded supported-file nodes.

Milestone 3:

- Optional content search using streaming search.
- Performance tuning for wide folders and many open tabs.
- More Markdown extensions if needed.

Milestone 4:

- Windows installer.
- Optional Explorer context menu: "Open in Markdown Viewer".
- Decide whether custom Explorer preview handler is worth the cost.

Milestone 5, only if still needed:

- Windows preview handler.
- Register/unregister safely.
- Add conflict detection for existing preview handlers.
- Keep it read-only and share rendering code/style with the app where practical.

## Recommendation

Do not start with a custom File Explorer preview handler. It is Windows-specific, installer-heavy, registry-sensitive, and cannot support the editing workflow.

Start with a Tauri app. It covers the full requested workflow with much lower risk and leaves a clean path to optional Windows Explorer integration later.

## References

- Microsoft PowerToys File Explorer add-ons: https://learn.microsoft.com/en-us/windows/powertoys/file-explorer
- Windows `IPreviewHandler`: https://learn.microsoft.com/en-us/windows/win32/api/shobjidl_core/nn-shobjidl_core-ipreviewhandler
- Building preview handlers: https://learn.microsoft.com/en-us/windows/win32/shell/building-preview-handlers
- Registering preview handlers: https://learn.microsoft.com/en-us/windows/win32/shell/how-to-register-a-preview-handler
- Preview handler security model: https://learn.microsoft.com/en-us/windows/win32/shell/preview-handlers
- Shell extensions and managed code guidance: https://learn.microsoft.com/en-us/windows/win32/shell/shell-and-managed-code
- WebView2 distribution: https://learn.microsoft.com/en-us/microsoft-edge/webview2/concepts/distribution
- Tauri process model: https://tauri.app/concept/process-model/
- Electron overview: https://www.electronjs.org/
- CodeMirror docs: https://codemirror.net/docs/
- markdown-it package: https://www.npmjs.com/package/markdown-it
