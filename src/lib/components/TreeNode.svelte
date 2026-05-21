<script lang="ts">
  import type { TreeNode as TreeNodeType } from '../types'
  import TreeNodeComponent from './TreeNode.svelte'

  let { node, shouldShow, toggleExpand, openFile, depth = 0 }: {
    node: TreeNodeType
    shouldShow: (n: TreeNodeType) => boolean
    toggleExpand: (n: TreeNodeType) => void
    openFile: (n: TreeNodeType) => void
    depth?: number
  } = $props()
</script>

<div class="tree-node" style="padding-left: {depth * 16}px">
  <div
    class="node-row"
    class:dir={node.is_dir}
    class:file={!node.is_dir}
    onclick={() => (node.is_dir ? toggleExpand(node) : openFile(node))}
    role="treeitem"
    aria-selected={false}
    tabindex="0"
    onkeydown={(e) => { if (e.key === 'Enter') node.is_dir ? toggleExpand(node) : openFile(node) }}
  >
    <span class="expand-icon">
      {#if node.is_dir}
        {#if node.loading}
          &#8987;
        {:else if node.expanded}
          &#9660;
        {:else}
          &#9654;
        {/if}
      {:else}
        <span class="file-icon">
          {#if node.extension === 'md'}
            M
          {:else}
            T
          {/if}
        </span>
      {/if}
    </span>
    <span class="node-name">{node.name}</span>
  </div>
  {#if node.is_dir && node.expanded && node.children}
    {#each node.children.filter(shouldShow) as child}
      <TreeNodeComponent node={child} {shouldShow} {toggleExpand} {openFile} depth={depth + 1} />
    {/each}
  {/if}
</div>

<style>
  .tree-node {
    user-select: none;
  }
  .node-row {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .node-row:hover {
    background: var(--tree-hover-bg, #e8e8e8);
  }
  .expand-icon {
    width: 16px;
    text-align: center;
    flex-shrink: 0;
    font-size: 10px;
  }
  .file-icon {
    font-size: 10px;
    font-weight: bold;
    color: #666;
  }
  .node-name {
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
