<script lang="ts">
  import { renderMarkdown } from '../utils/markdown'
  import { getDebounceMs } from '../stores/settings.svelte'
  import { debounce } from '../utils/debounce'

  let { content = '' }: { content?: string } = $props()

  let rendered = $state('')
  let container: HTMLDivElement

  const render = debounce((src: string) => {
    rendered = renderMarkdown(src)
  }, getDebounceMs())

  $effect(() => {
    render(content)
  })
</script>

<div class="preview-pane">
  <div class="preview-content" bind:this={container}>
    {#if rendered}
      {@html rendered}
    {:else}
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
  }
  .preview-content {
    max-width: 800px;
    margin: 0 auto;
    line-height: 1.6;
  }
  .preview-empty {
    color: #999;
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
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
  }
  .preview-content :global(pre) {
    background: #f5f5f5;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
  }
  .preview-content :global(pre code) {
    background: none;
    padding: 0;
  }
  .preview-content :global(blockquote) {
    border-left: 3px solid #ccc;
    margin-left: 0;
    padding-left: 16px;
    color: #666;
  }
  .preview-content :global(table) {
    border-collapse: collapse;
    width: 100%;
  }
  .preview-content :global(th),
  .preview-content :global(td) {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  .preview-content :global(th) {
    background: #f5f5f5;
  }
  .preview-content :global(img) {
    max-width: 100%;
  }
  .preview-content :global(a) {
    color: #0066cc;
  }
  .preview-content :global(hr) {
    border: none;
    border-top: 1px solid #ddd;
    margin: 2em 0;
  }
</style>
