<script lang="ts">
  import { onMount, onDestroy } from 'svelte'
  import Toolbar from './Toolbar.svelte'
  import FileTree from './FileTree.svelte'
  import TabBar from './TabBar.svelte'
  import EditorPane from './EditorPane.svelte'
  import PreviewPane from './PreviewPane.svelte'
  import SplitPane from './SplitPane.svelte'
  import { getTabs, getActiveTab, setTabsFromPersisted, setExternalChangePrompt, reloadTabFromDisk } from '../stores/tabs.svelte'
  import { getRoot, getRootPath, setRoot, getShowSupportedOnly, setShowSupportedOnly, markNodeStale } from '../stores/fileTree.svelte'
  import { isDarkMode, setDarkMode } from '../stores/theme.svelte'
  import { getDebounceMs, setDebounceMs, getZoom, setZoom, zoomIn, zoomOut, zoomReset } from '../stores/settings.svelte'
  import { loadState, saveState } from '../utils/persistence'
  import { invoke } from '@tauri-apps/api/core'
  import { listen, type UnlistenFn } from '@tauri-apps/api/event'
  import { openTab } from '../stores/tabs.svelte'
  import { debounce } from '../utils/debounce'
  import { decideExternalChangeAction } from '../utils/externalChange'

  let sidebarOpen = $state(true)
  let loadingState = $state(true)
  let unlistenOpenFile: UnlistenFn | null = null
  let unlistenPathChanged: UnlistenFn | null = null
  let unlistenFilesDropped: UnlistenFn | null = null

  const persist = debounce(() => {
    const tabs = getTabs()
    const active = getActiveTab()
    saveState({
      darkMode: isDarkMode(),
      showSupportedOnly: getShowSupportedOnly(),
      tabs: tabs.map((t) => ({ filePath: t.filePath, viewMode: t.viewMode })),
      activeFilePath: active?.filePath ?? null,
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

    const restoreTabs = async () => {
      if (state.tabs.length === 0) return
      const results = await Promise.all(
        state.tabs.map(async (t) => {
          try {
            const content: string = await invoke('read_file', { path: t.filePath })
            return { filePath: t.filePath, content, viewMode: t.viewMode }
          } catch {
            return null
          }
        }),
      )
      const restored = results.filter(
        (r): r is { filePath: string; content: string; viewMode: import('../types').ViewMode } => r !== null,
      )
      await setTabsFromPersisted(restored, state.activeFilePath)
    }

    const restoreFolder = async () => {
      if (!state.lastFolder) return
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
        try {
          await invoke('watch_path', { path: state.lastFolder, recursive: true })
        } catch (e) {
          console.error('Failed to start watching folder:', state.lastFolder, e)
        }
      } catch {
        // folder no longer accessible
      }
    }

    const setupListeners = async () => {
      unlistenOpenFile = await listen<string>('open-file', (event) => {
        void openFileFromPath(event.payload)
      })
      unlistenPathChanged = await listen<{ path: string; root: string; kind: string }>(
        'path-changed',
        (event) => {
          const { path, kind } = event.payload
          if (kind === 'folder') {
            markNodeStale(path)
            return
          }
          const action = decideExternalChangeAction(
            getTabs().map((t) => ({ id: t.id, filePath: t.filePath, isDirty: t.isDirty })),
            path,
          )
          if (action.kind === 'auto-reload') {
            void reloadTabFromDisk(action.tabId)
          } else if (action.kind === 'prompt') {
            setExternalChangePrompt(action.tabId, true)
          }
        },
      )
      unlistenFilesDropped = await listen<string[]>('files-dropped', (event) => {
        void openFilesFromPaths(event.payload)
      })
    }

    await Promise.all([restoreTabs(), restoreFolder(), setupListeners()])

    try {
      const pending: string | null = await invoke('take_pending_open')
      if (pending) {
        await openFileFromPath(pending)
      }
    } catch (e) {
      console.error('Failed to consume pending file:', e)
    }

    loadingState = false
  })

  onDestroy(() => {
    unlistenOpenFile?.()
    unlistenPathChanged?.()
    unlistenFilesDropped?.()
  })

  async function openFileFromPath(path: string) {
    try {
      const content: string = await invoke('read_file', { path })
      await openTab(path, content)
    } catch (e) {
      console.error('Failed to open file from path:', path, e)
    }
  }

  async function openFilesFromPaths(paths: string[]) {
    await Promise.all(paths.map((p) => openFileFromPath(p)))
  }

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
        {#if getActiveTab()?.pendingExternalChange}
          <div class="external-change-banner" data-testid="external-change-banner">
            <span class="external-change-text">
              <strong>{getActiveTab()!.fileName}</strong> changed on disk.
            </span>
            <div class="external-change-actions">
              <button
                class="external-change-reload"
                onclick={() => void reloadTabFromDisk(getActiveTab()!.id)}
              >
                Reload
              </button>
              <button
                class="external-change-keep"
                onclick={() => setExternalChangePrompt(getActiveTab()!.id, false)}
              >
                Keep mine
              </button>
            </div>
          </div>
        {/if}
        {#if getActiveTab()}
          {#if getActiveTab()!.viewMode === 'source'}
            <EditorPane content={getActiveTab()!.content} tabId={getActiveTab()!.id} />
          {:else if getActiveTab()!.viewMode === 'preview'}
            <PreviewPane content={getActiveTab()!.content} fileKind={getActiveTab()!.fileKind} />
          {:else if getActiveTab()!.viewMode === 'split'}
            <SplitPane content={getActiveTab()!.content} tabId={getActiveTab()!.id} fileKind={getActiveTab()!.fileKind} />
          {/if}
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
    color: var(--text-muted);
  }
  .welcome h2 {
    margin: 0 0 8px;
    color: var(--text-secondary);
  }
  .welcome p {
    margin: 4px 0;
  }
  .shortcuts {
    font-size: 13px;
    color: var(--text-muted);
    margin-top: 16px;
  }
  .external-change-banner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 6px 12px;
    background: var(--external-change-bg);
    color: var(--external-change-text);
    font-size: 12px;
    border-bottom: 1px solid var(--external-change-border);
    flex-shrink: 0;
  }
  .external-change-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .external-change-actions {
    display: flex;
    gap: 6px;
    flex-shrink: 0;
  }
  .external-change-actions button {
    padding: 2px 10px;
    border: 1px solid var(--external-change-border);
    border-radius: 3px;
    background: var(--button-bg);
    color: var(--external-change-text);
    font-size: 12px;
    cursor: pointer;
  }
  .external-change-actions button:hover {
    background: var(--button-hover-bg);
  }
  .external-change-reload {
    font-weight: 600;
  }
</style>
