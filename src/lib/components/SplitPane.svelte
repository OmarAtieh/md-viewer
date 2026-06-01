<script lang="ts">
  import type { Snippet } from 'svelte'
  import EditorPane from './EditorPane.svelte'
  import PreviewPane from './PreviewPane.svelte'

  let { content, tabId, fileKind = 'markdown', leftLabel = 'Source', rightLabel = 'Preview' }: {
    content: string
    tabId: string
    fileKind?: string
    leftLabel?: string
    rightLabel?: string
  } = $props()
</script>

<div class="split-pane">
  <div class="split-left">
    <div class="split-header">{leftLabel}</div>
    <div class="split-content">
      <EditorPane {content} {tabId} />
    </div>
  </div>
  <div class="split-divider" role="separator" tabindex="-1" ondragstart={(e) => e.preventDefault()}></div>
  <div class="split-right">
    <div class="split-header">{rightLabel}</div>
    <div class="split-content">
      <PreviewPane {content} {fileKind} />
    </div>
  </div>
</div>

<style>
  .split-pane {
    display: flex;
    height: 100%;
    overflow: hidden;
  }
  .split-left,
  .split-right {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 200px;
  }
  .split-divider {
    width: 4px;
    background: var(--border-color, #ddd);
    cursor: col-resize;
    flex-shrink: 0;
  }
  .split-divider:hover {
    background: var(--accent-bg, #0066cc);
  }
  .split-header {
    padding: 2px 8px;
    font-size: 11px;
    color: var(--text-muted);
    background: var(--header-bg, #fafafa);
    border-bottom: 1px solid var(--border-color, #ddd);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .split-content {
    flex: 1;
    overflow: hidden;
  }
</style>
