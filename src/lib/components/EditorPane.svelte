<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import { EditorView, basicSetup } from 'codemirror'
  import { EditorState, Compartment } from '@codemirror/state'
  import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
  import { keymap } from '@codemirror/view'
  import { defaultKeymap } from '@codemirror/commands'
  import { updateContent } from '../stores/tabs.svelte'
  import { getLargeFileThreshold } from '../stores/settings.svelte'
  import { isDarkMode } from '../stores/theme.svelte'

  let { content = '', tabId = '' }: { content?: string; tabId?: string } = $props()

  let container: HTMLDivElement
  let editor: EditorView | null = null
  let isLarge = $state(false)

  // Track the current tabId in reactive state so the CodeMirror update listener
  // (registered once at mount) always writes to the tab the user is currently on,
  // not the tab that was active when the editor was first created.
  let activeTabId = $state<string>('')
  $effect(() => {
    activeTabId = tabId
  })

  const oneDark = EditorView.theme(
    {
      '&': {
        color: '#ddd',
        backgroundColor: '#1e1e1e',
      },
      '.cm-content': { caretColor: '#fff' },
      '.cm-cursor, .cm-dropCursor': { borderLeftColor: '#fff' },
      '&.cm-focused .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: '#3a3d41',
      },
      '.cm-panels': { backgroundColor: '#252526', color: '#ddd' },
      '.cm-gutters': {
        backgroundColor: '#1e1e1e',
        color: '#858585',
        border: 'none',
      },
      '.cm-activeLineGutter': { backgroundColor: '#2a2d2e' },
      '.cm-activeLine': { backgroundColor: '#2a2d2e' },
    },
    { dark: true },
  )

  const themeCompartment = new Compartment()
  const listenerCompartment = new Compartment()

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

  onMount(() => {
    if (!container) return

    const id = activeTabId
    const state = EditorState.create({
      doc: content,
      extensions: [
        basicSetup,
        themeCompartment.of(isDarkMode() ? oneDark : []),
        markdown({ base: markdownLanguage }),
        keymap.of(defaultKeymap),
        listenerCompartment.of(
          EditorView.updateListener.of((update) => {
            if (update.docChanged && activeTabId) {
              updateContent(activeTabId, update.state.doc.toString())
            }
          }),
        ),
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
    void id
  })

  // Re-configure the editor on dark mode change without remounting the editor.
  $effect(() => {
    if (!editor) return
    const dark = isDarkMode()
    editor.dispatch({
      effects: themeCompartment.reconfigure(dark ? oneDark : []),
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
    background: var(--external-change-bg);
    color: var(--external-change-text);
    font-size: 12px;
    border-bottom: 1px solid var(--external-change-border);
  }
</style>
