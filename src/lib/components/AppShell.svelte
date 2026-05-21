<script lang="ts">
  import { onMount } from 'svelte'
  import Toolbar from './Toolbar.svelte'
  import FileTree from './FileTree.svelte'
  import TabBar from './TabBar.svelte'
  import EditorPane from './EditorPane.svelte'
  import PreviewPane from './PreviewPane.svelte'
  import SplitPane from './SplitPane.svelte'
  import { getTabs, getActiveTab, getActiveTabId, setTabsFromPersisted } from '../stores/tabs.svelte'
  import { getRoot, setRoot, getShowSupportedOnly, setShowSupportedOnly } from '../stores/fileTree.svelte'
  import { isDarkMode, setDarkMode } from '../stores/theme.svelte'
  import { getDebounceMs, setDebounceMs, getZoom, setZoom, zoomIn, zoomOut, zoomReset } from '../stores/settings.svelte'
  import { loadState, saveState } from '../utils/persistence'
  import { invoke } from '@tauri-apps/api/core'
  import { debounce } from '../utils/debounce'

  let sidebarOpen = $state(true)
  let loadingState = $state(true)

  const persist = debounce(() => {
    const tabs = getTabs()
    saveState({
      darkMode: isDarkMode(),
      showSupportedOnly: getShowSupportedOnly(),
      tabs: tabs.map((t) => ({ filePath: t.filePath, viewMode: t.viewMode })),
      activeTabId: getActiveTabId(),
      debounceMs: getDebounceMs(),
      zoom: getZoom(),
      lastFolder: getRootPath(),
    })
  }, 500)

  onMount(async () => {
    const state = loadState()
    setDarkMode(state.darkMode)
    setShowSupportedOnly(state.showSupportedOnly)
    setDebounceMs(state.debounceMs)
    setZoom(state.zoom)

    if (state.tabs.length > 0) {
      const restored: { filePath: string; content: string; viewMode: import('../types').ViewMode }[] = []
      const readPromises = state.tabs.map(async (t) => {
        try {
          const content: string = await invoke('read_file', { path: t.filePath })
          restored.push({ filePath: t.filePath, content, viewMode: t.viewMode })
        } catch {
          // file no longer accessible, skip
        }
      })
      await Promise.all(readPromises)
      setTabsFromPersisted(restored, state.activeTabId)
    }

    if (state.lastFolder) {
      try {
        const entries: Array<{ name: string; path: string; is_dir: boolean; extension: string | null }> =
          await invoke('list_dir', { path: state.lastFolder })
        const children = entries
          .filter((e) => e.is_dir || isPersistedSupported(e.extension))
          .map((e) => ({
            name: e.name,
            path: e.path,
            is_dir: e.is_dir,
            extension: e.extension,
            children: e.is_dir ? [] : null,
            loaded: false,
            loading: false,
            expanded: false,
          }))
        const folderName = state.lastFolder.split('\\').pop()?.split('/').pop() ?? state.lastFolder
        setRoot(state.lastFolder, {
          name: folderName,
          path: state.lastFolder,
          is_dir: true,
          extension: null,
          children,
          loaded: true,
          loading: false,
          expanded: false,
        })
      } catch {
        // folder no longer accessible
      }
    }

    loadingState = false
  })

  function isPersistedSupported(ext: string | null): boolean {
    if (!ext) return false
    const e = ext.toLowerCase()
    return ['md', 'markdown', 'mdown', 'txt', 'text', 'log'].includes(e)
  }

  $effect(() => {
    if (loadingState) return
    getTabs()
    isDarkMode()
    getShowSupportedOnly()
    getDebounceMs()
    getZoom()
    persist()
  })

  function handleKeydown(e: KeyboardEvent) {
    const mod = e.ctrlKey || e.metaKey
    if (mod && e.key === 's') {
      e.preventDefault()
      const btn = document.querySelector('[data-action="save"]') as HTMLButtonElement
      btn?.click()
    }
    if (mod && (e.key === '=' || e.key === '+')) {
      e.preventDefault()
      zoomIn()
    }
    if (mod && e.key === '-') {
      e.preventDefault()
      zoomOut()
    }
    if (mod && e.key === '0') {
      e.preventDefault()
      zoomReset()
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="app-shell" style="zoom: {getZoom()}%">
  <Toolbar {zoomIn} {zoomOut} {zoomReset} zoom={getZoom()} />
  <div class="main-area">
    {#if sidebarOpen && getRoot()}
      <FileTree />
    {/if}
    {#if sidebarOpen && getRoot()}
      <button class="sidebar-toggle" onclick={() => (sidebarOpen = false)}>&times;</button>
    {:else if getRoot()}
      <button class="sidebar-toggle closed" onclick={() => (sidebarOpen = true)}>&#9776;</button>
    {/if}
    <div class="workspace">
      <TabBar />
      <div class="editor-area">
        {#if getActiveTab()}
          {#key getActiveTab()!.id}
            {#if getActiveTab()!.viewMode === 'source'}
              <EditorPane content={getActiveTab()!.content} tabId={getActiveTab()!.id} />
            {:else if getActiveTab()!.viewMode === 'preview'}
              <PreviewPane content={getActiveTab()!.content} />
            {:else if getActiveTab()!.viewMode === 'split'}
              <SplitPane content={getActiveTab()!.content} tabId={getActiveTab()!.id} />
            {/if}
          {/key}
        {:else}
          <div class="welcome">
            <h2>Markdown Viewer</h2>
            <p>Open a file or folder to get started</p>
            <p class="shortcuts">Ctrl+O: Open File &middot; Ctrl+Shift+O: Open Folder &middot; Ctrl+S: Save &middot; Ctrl+±: Zoom</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    height: 100vh;
    overflow: hidden;
  }
  .main-area {
    display: flex;
    flex: 1;
    overflow: hidden;
    position: relative;
  }
  .sidebar-toggle {
    position: absolute;
    left: 0;
    top: 4px;
    z-index: 10;
    padding: 2px 8px;
    border: 1px solid var(--border-color, #ccc);
    border-left: none;
    border-radius: 0 4px 4px 0;
    background: var(--button-bg, #fff);
    cursor: pointer;
    font-size: 14px;
  }
  .sidebar-toggle.closed {
    left: 0;
  }
  .workspace {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
  .editor-area {
    flex: 1;
    overflow: hidden;
  }
  .welcome {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: #888;
  }
  .welcome h2 {
    margin: 0 0 8px;
    color: #555;
  }
  .welcome p {
    margin: 4px 0;
  }
  .shortcuts {
    font-size: 13px;
    color: #aaa;
    margin-top: 16px;
  }
</style>
