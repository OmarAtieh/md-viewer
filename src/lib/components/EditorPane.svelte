<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EditorView, basicSetup } from 'codemirror'
  import { EditorState } from '@codemirror/state'
  import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
  import { keymap } from '@codemirror/view'
  import { defaultKeymap } from '@codemirror/commands'
  import { updateContent } from '../stores/tabs.svelte'
  import { getLargeFileThreshold } from '../stores/settings.svelte'

  let { content = '', tabId = '' }: { content?: string; tabId?: string } = $props()

  let container: HTMLDivElement
  let editor: EditorView | null = null
  let isLarge = $state(false)

  $effect(() => {
    isLarge = content.length > getLargeFileThreshold()
    if (editor && !isLarge && content !== editor.state.doc.toString()) {
      editor.dispatch({
        changes: {
          from: 0,
          to: editor.state.doc.length,
          insert: content,
        },
      })
    }
  })

  function handleEditorUpdate(update: import('@codemirror/view').ViewUpdate) {
    if (update.docChanged && tabId) {
      const value = update.state.doc.toString()
      updateContent(tabId, value)
    }
  }

  onMount(() => {
    if (!container) return

    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        markdown({ base: markdownLanguage }),
        keymap.of(defaultKeymap),
        EditorView.updateListener.of(handleEditorUpdate),
        EditorView.theme({
          '&': { height: '100%' },
          '.cm-scroller': { overflow: 'auto' },
        }),
      ],
    })

    editor = new EditorView({
      state,
      parent: container,
    })
  })

  onDestroy(() => {
    editor?.destroy()
    editor = null
  })
</script>

<div class="editor-pane" bind:this={container}>
  {#if isLarge}
    <div class="large-file-banner">Large file — edit with care, preview disabled</div>
  {/if}
</div>

<style>
  .editor-pane {
    height: 100%;
    overflow: hidden;
  }
  .editor-pane :global(.cm-editor) {
    height: 100%;
  }
  .large-file-banner {
    position: sticky;
    top: 0;
    z-index: 10;
    padding: 4px 12px;
    background: #fff3cd;
    color: #856404;
    font-size: 12px;
    border-bottom: 1px solid #ffc107;
  }
  :global(.dark) .large-file-banner {
    background: #3d3200;
    color: #ffc107;
    border-color: #665500;
  }
</style>
