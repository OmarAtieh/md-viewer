<script lang="ts">
  import { getActiveTab, setViewMode } from '../stores/tabs.svelte'
  import { getRootPath, clearTree, setRoot } from '../stores/fileTree.svelte'
  import { invoke } from '@tauri-apps/api/core'
  import { open as openDialog } from '@tauri-apps/plugin-dialog'
  import { openTab, getActiveTabId, getAllFilePaths, markClean } from '../stores/tabs.svelte'
  import { isDarkMode, toggleDarkMode } from '../stores/theme.svelte'

  let loading = $state(false)

  function activeViewMode() {
    return getActiveTab()?.viewMode ?? 'preview'
  }

  function setMode(mode: 'source' | 'preview' | 'split') {
    const tab = getActiveTab()
    if (tab) setViewMode(tab.id, mode)
  }

  async function handleOpenFile() {
    const selected = await openDialog({
      multiple: false,
      filters: [
        {
          name: 'Supported Files',
          extensions: ['md', 'markdown', 'mdown', 'txt', 'text', 'log'],
        },
      ],
    })
    if (!selected) return
    const content: string = await invoke('read_file', { path: selected })
    openTab(selected, content)
  }

  async function handleOpenFolder() {
    const selected = await openDialog({
      multiple: false,
      directory: true,
    })
    if (!selected) return
    await loadFolder(selected)
  }

  async function loadFolder(path: string) {
    loading = true
    try {
      const entries: Array<{ name: string; path: string; is_dir: boolean; extension: string | null }> =
        await invoke('list_dir', { path })
      const children = entries
        .filter((e) => e.is_dir || (e.extension !== null && isSupported(e.extension)))
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
      const folderName = path.split('\\').pop()?.split('/').pop() ?? path
      setRoot(path, {
        name: folderName,
        path,
        is_dir: true,
        extension: null,
        children,
        loaded: true,
        loading: false,
        expanded: false,
      })
    } finally {
      loading = false
    }
  }

  function isSupported(ext: string | null): boolean {
    const MARKDOWN = new Set(['md', 'markdown', 'mdown'])
    const TEXT = new Set(['txt', 'text', 'log'])
    if (!ext) return false
    const e = ext.toLowerCase()
    return MARKDOWN.has(e) || TEXT.has(e)
  }

  async function handleSave() {
    const tab = getActiveTab()
    if (!tab || !tab.isDirty) return
    await invoke('write_file', { path: tab.filePath, content: tab.content })
    markClean(tab.id)
  }

  async function handleSaveAs() {
    const tab = getActiveTab()
    if (!tab) return
    const selected = await openDialog({
      multiple: false,
      save: true,
      filters: [
        {
          name: 'Markdown',
          extensions: ['md'],
        },
      ],
    })
    if (!selected) return
    await invoke('write_file', { path: selected, content: tab.content })
    if (!getAllFilePaths().includes(selected)) {
      openTab(selected, tab.content)
    }
    markClean(getActiveTabId()!)
  }
</script>

<header>
  <div class="toolbar-group">
    <button onclick={handleOpenFile} title="Open File">Open File</button>
    <button onclick={handleOpenFolder} title="Open Folder">Open Folder</button>
    <span class="separator"></span>
    <button onclick={() => setMode('source')} class:active={activeViewMode() === 'source'} title="Source">Source</button>
    <button onclick={() => setMode('preview')} class:active={activeViewMode() === 'preview'} title="Preview">Preview</button>
    <button onclick={() => setMode('split')} class:active={activeViewMode() === 'split'} title="Split">Split</button>
    <span class="separator"></span>
    <span class="separator"></span>
    <button onclick={handleSave} title="Save" disabled={!getActiveTab()?.isDirty} data-action="save">Save</button>
    <button onclick={handleSaveAs} title="Save As">Save As</button>
    <span class="separator"></span>
    <button onclick={toggleDarkMode} title="Toggle Dark Mode" class="dark-toggle">
      {isDarkMode() ? '☀' : '☾'}
    </button>
  </div>
  <div class="toolbar-status">
    {#if getRootPath()}
      <span class="folder-path">{getRootPath()}</span>
    {/if}
  </div>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 4px 8px;
    background: var(--toolbar-bg, #f5f5f5);
    border-bottom: 1px solid var(--border-color, #ddd);
    gap: 8px;
    min-height: 36px;
  }
  .toolbar-group {
    display: flex;
    align-items: center;
    gap: 4px;
  }
  .toolbar-group button {
    padding: 4px 10px;
    border: 1px solid var(--border-color, #ccc);
    border-radius: 4px;
    background: var(--button-bg, #fff);
    cursor: pointer;
    font-size: 13px;
  }
  .toolbar-group button:hover {
    background: var(--button-hover-bg, #eaeaea);
  }
  .toolbar-group button.active {
    background: var(--accent-bg, #0066cc);
    color: white;
    border-color: var(--accent-bg, #0066cc);
  }
  .toolbar-group button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .separator {
    width: 1px;
    height: 20px;
    background: var(--border-color, #ccc);
    margin: 0 4px;
  }
  .folder-path {
    font-size: 12px;
    color: #888;
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
