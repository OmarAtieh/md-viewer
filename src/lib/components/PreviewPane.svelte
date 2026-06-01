<script lang="ts">
  import { renderMarkdown } from '../utils/markdown'
  import { getDebounceMs, getLargeFileThreshold } from '../stores/settings.svelte'
  import { debounce } from '../utils/debounce'

  let { content = '', fileKind = 'markdown' }: { content?: string; fileKind?: string } = $props()

  let rendered = $state('')
  let isLarge = $state(false)
  let lastRenderedContent = $state<string | null>(null)

  const render = debounce((src: string) => {
    rendered = renderMarkdown(src)
  }, getDebounceMs())

  $effect(() => {
    isLarge = content.length > getLargeFileThreshold()
    if (isLarge) {
      rendered = `<p style="color:var(--text-muted);font-style:italic;padding:2em;text-align:center">Preview disabled — large file (${(content.length / 1024 / 1024).toFixed(1)} MB). Use Source mode to edit.</p>`
      return
    }
    if (fileKind === 'text') {
      rendered = `<pre style="background:var(--pre-bg);padding:16px;border-radius:4px;overflow-x:auto;font-size:13px;line-height:1.5;color:var(--preview-text)"><code>${escapeHtml(content)}</code></pre>`
      return
    }
    if (content === lastRenderedContent) return
    lastRenderedContent = content
    render(content)
  })

  function escapeHtml(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  }
</script>

<div class="preview-pane">
  <div class="preview-content">
    {#if rendered}
      {@html rendered}
    {:else if !isLarge}
      <div class="preview-empty">Preview will appear here</div>
    {/if}
  </div>
</div>

<style>
  .preview-pane {
    height: 100%;
    overflow-y: auto;
    padding: 16px 24px;
    background: var(--preview-bg, #fff);
    color: var(--preview-text, #333);
  }
  .preview-content {
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
  .preview-empty {
    color: var(--text-subtle);
    font-style: italic;
  }
  .preview-content :global(h1),
  .preview-content :global(h2),
  .preview-content :global(h3),
  .preview-content :global(h4) {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
  }
  .preview-content :global(p) {
    margin: 0.8em 0;
  }
  .preview-content :global(code) {
    background: var(--code-bg, #f0f0f0);
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
  }
  .preview-content :global(pre) {
    background: var(--pre-bg, #f5f5f5);
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
  }
  .preview-content :global(pre code) {
    background: none;
    padding: 0;
  }
  .preview-content :global(blockquote) {
    border-left: 3px solid var(--blockquote-border, #ccc);
    margin-left: 0;
    padding-left: 16px;
    color: var(--blockquote-text, #666);
  }
  .preview-content :global(table) {
    border-collapse: collapse;
    width: 100%;
  }
  .preview-content :global(th),
  .preview-content :global(td) {
    border: 1px solid var(--border-color, #ddd);
    padding: 8px;
    text-align: left;
  }
  .preview-content :global(th) {
    background: var(--table-header-bg);
  }
  .preview-content :global(img) {
    max-width: 100%;
  }
  .preview-content :global(a) {
    color: var(--accent-bg, #0066cc);
  }
  .preview-content :global(hr) {
    border: none;
    border-top: 1px solid var(--border-color, #ddd);
    margin: 2em 0;
  }
</style>
