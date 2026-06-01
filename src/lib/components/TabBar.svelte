<script lang="ts">
  import { getTabs, getActiveTabId, setActiveTab, closeTab } from '../stores/tabs.svelte'

  function handleTabClick(id: string) {
    setActiveTab(id)
  }

  function handleTabClose(e: Event, id: string) {
    e.stopPropagation()
    void closeTab(id)
  }
</script>

<div class="tab-bar">
  {#each getTabs() as tab (tab.id)}
    <div
      class="tab"
      class:active={tab.id === getActiveTabId()}
      class:dirty={tab.isDirty}
      role="tab"
      tabindex="0"
      onclick={() => handleTabClick(tab.id)}
      onkeydown={(e) => { if (e.key === 'Enter') handleTabClick(tab.id) }}
    >
      <span class="tab-name">{tab.fileName}</span>
      <span class="tab-close" role="button" tabindex="0" onkeydown={(e) => { if (e.key === 'Enter') handleTabClose(e, tab.id) }} onclick={(e) => handleTabClose(e, tab.id)}>&times;</span>
    </div>
  {/each}
  {#if getTabs().length === 0}
    <span class="empty-tabs">No file open</span>
  {/if}
</div>

<style>
  .tab-bar {
    display: flex;
    align-items: center;
    background: var(--tabs-bg, #ececec);
    border-bottom: 1px solid var(--border-color, #ddd);
    min-height: 32px;
    overflow-x: auto;
  }
  .tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border: none;
    border-right: 1px solid var(--border-color, #ddd);
    background: transparent;
    cursor: pointer;
    font-size: 13px;
    white-space: nowrap;
    color: var(--tab-color, #444);
  }
  .tab:hover {
    background: var(--tab-hover-bg, #ddd);
  }
  .tab.active {
    background: var(--tab-active-bg, #fff);
    border-bottom: 2px solid var(--accent-bg, #0066cc);
    color: var(--tab-active-color, #000);
  }
  .tab.dirty .tab-name::after {
    content: ' *';
    color: var(--dirty-color, #cc6600);
  }
  .tab-close {
    font-size: 16px;
    line-height: 1;
    padding: 0 2px;
    border-radius: 3px;
  }
  .tab-close:hover {
    background: var(--close-hover-bg, #ccc);
  }
  .empty-tabs {
    padding: 4px 12px;
    color: var(--text-subtle);
    font-size: 13px;
  }
</style>
