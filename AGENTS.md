# Agent Working Principles

These are the non-negotiable rules for any AI agent (or human) working on this codebase. Established by the project owner and persisted across sessions.

## 1. Test-Driven Development (TDD) is mandatory

For every new feature, behavior, or non-trivial helper:

1. **Write the test first.** Add a failing test in `tests/unit/**/*.test.ts` (Vitest) or `#[cfg(test)]` module (Rust) that describes the intended behavior.
2. **Confirm it fails.** Run the test suite. The new test must fail for the right reason.
3. **Implement the minimum to pass.** Don't gold-plate, don't speculatively add features.
4. **Confirm it passes.** Run the test suite again. The new test must pass; all existing tests must still pass.
5. **Refactor** only after green.

Pure functions, deciders, and validators get unit tests. Side effects (Tauri IPC, DOM, filesystem) get tested via a thin pure-function seam whenever possible. Visual / Tauri-only behavior gets a smoke test or a documented manual check.

## 2. Versioning

- **Patch digit** (`0.1.X`) is bumped **after** a feature is fully implemented, tested, and validated.
- A version bump is the final act of a feature, not the first.
- Bump in all three places: `package.json`, `src-tauri/Cargo.toml`, `src-tauri/tauri.conf.json`.
- Bump order is monotonic; never skip a patch digit for a merged feature.

## 3. Performance is a core principle

- No introduced slowness or inefficiency.
- For new code paths, reason about hot paths: render loops, IPC round-trips, store reads, DOM mutations.
- When touching existing code, look for adjacent performance wins; clean them up in the same patch (with their own tests).
- If a feature is likely to touch 1000+ items (file trees, search results, tab lists), virtualization or pagination is the default — not a future optimization.
- Validate perf claims with measurement (a benchmark, a profiling run, or at minimum a deliberate worst-case manual test) before declaring "fast enough".

## 4. No commits without explicit instruction

- Never `git commit` or `git push` unless the user explicitly asks in that turn.
- Version bumps, file edits, and new files are fine; the commit/push step is always human-driven.

## 5. Dark mode and theming are first-class

- All hardcoded colors are bugs. Use CSS variables from `src/app.css`.
- New UI surfaces must define variables for their light and dark values before shipping.
- Inline `style="color:#..."` is acceptable only when the color is `var(--...)`.

## 6. The "fast, native, scale-friendly" spine

The project's differentiator is a **lightweight, native Markdown viewer/editor that stays fast on huge repos and large files**. Every feature decision should reinforce this:

- Favor lazy / on-demand work over upfront scans.
- Favor small, fast operations over large, one-shot operations.
- Avoid feature bloat that would compromise the "no bullshit" positioning.
- If a feature is heavy (search, indexing, theming marketplace), it gets scoped, isolated, and optionally deferred — not silently accepted.

## 7. Tauri-specific rules

- All filesystem and shell access goes through Rust commands. The frontend never touches `fs` directly.
- Every new IPC command gets a clear, narrow permission in `src-tauri/capabilities/default.json`.
- Prefer events (`emit` + `listen`) for backend → frontend notifications; prefer `invoke` for frontend → backend requests.
- File paths in events must be the same canonical form across OSes (the Rust `Path` API handles this; don't re-implement path joining in JS).
