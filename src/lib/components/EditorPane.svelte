<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { basicSetup } from 'codemirror'
  import { EditorView } from 'codemirror'
  import { keymap } from '@codemirror/view'
  import { EditorState } from '@codemirror/state'
  import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
  import { defaultKeymap } from '@codemirror/commands'
  import { updateContent } from '../stores/tabs.svelte'

  let { content = '', tabId = '' }: { content?: string; tabId?: string } = $props()

  let container: HTMLDivElement
  let editor: EditorView | null = null

  $effect(() => {
    if (editor && content !== editor.state.doc.toString()) {
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

<div class="editor-pane" bind:this={container}></div>

<style>
  .editor-pane {
    height: 100%;
    overflow: hidden;
  }
  .editor-pane :global(.cm-editor) {
    height: 100%;
  }
</style>
