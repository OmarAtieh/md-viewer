<script lang="ts">
  import { invoke } from '@tauri-apps/api/core'
  import { getRoot, getShowSupportedOnly, setShowSupportedOnly, updateNodeChildren, setNodeLoading } from '../stores/fileTree.svelte'
  import { openTab } from '../stores/tabs.svelte'
  import TreeNodeComponent from './TreeNode.svelte'
  import type { TreeNode } from '../types'

  const MARKDOWN = new Set(['md', 'markdown', 'mdown'])
  const TEXT = new Set(['txt', 'text', 'log'])

  function isSupported(ext: string | null): boolean {
    if (!ext) return false
    return MARKDOWN.has(ext.toLowerCase()) || TEXT.has(ext.toLowerCase())
  }

  function shouldShow(node: TreeNode): boolean {
    if (node.is_dir) return true
    if (getShowSupportedOnly()) return isSupported(node.extension)
    return true
  }

  async function toggleExpand(node: TreeNode) {
    if (!node.is_dir) return
    node.expanded = !node.expanded
    if (!node.loaded && !node.loading) {
      setNodeLoading(node.path, true)
      try {
        const entries: Array<{ name: string; path: string; is_dir: boolean; extension: string | null }> =
          await invoke('list_dir', { path: node.path })
        const children = entries.map((e) => ({
          name: e.name,
          path: e.path,
          is_dir: e.is_dir,
          extension: e.extension,
          children: e.is_dir ? [] : null,
          loaded: false,
          loading: false,
          expanded: false,
        }))
        updateNodeChildren(node.path, children)
      } finally {
        setNodeLoading(node.path, false)
      }
    }
  }

  async function openFile(node: TreeNode) {
    if (node.is_dir) return
    try {
      const content: string = await invoke('read_file', { path: node.path })
      await openTab(node.path, content)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }
</script>

<aside class="file-tree">
  <div class="tree-header">
    <label class="checkbox-label">
      <input
        type="checkbox"
        checked={getShowSupportedOnly()}
        onchange={() => setShowSupportedOnly(!getShowSupportedOnly())}
      />
      Supported files only
    </label>
  </div>
  <div class="tree-content">
    {#if getRoot()}
      <TreeNodeComponent
        node={getRoot()!}
        {shouldShow}
        {toggleExpand}
        {openFile}
        depth={0}
      />
    {:else}
      <div class="empty-state">Open a folder to get started</div>
    {/if}
  </div>
</aside>

<style>
  .file-tree {
    width: 260px;
    min-width: 180px;
    display: flex;
    flex-direction: column;
    background: var(--tree-bg, #fafafa);
    border-right: 1px solid var(--border-color, #ddd);
    overflow: hidden;
  }
  .tree-header {
    padding: 8px;
    border-bottom: 1px solid var(--border-color, #ddd);
  }
  .checkbox-label {
    font-size: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;
  }
  .tree-content {
    flex: 1;
    overflow-y: auto;
    padding: 4px 0;
  }
  .empty-state {
    padding: 16px 8px;
    color: var(--text-subtle);
    font-size: 13px;
    text-align: center;
  }
</style>
