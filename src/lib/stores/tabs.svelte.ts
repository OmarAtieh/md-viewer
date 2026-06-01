import { type Tab, type ViewMode, type FileKind } from '../types'
import { classifyFile } from '../utils/fileUtils'
import { invoke } from '@tauri-apps/api/core'
import { findActiveTabIdByFilePath } from '../utils/activeTab'

let tabs = $state<Tab[]>([])
let activeTabId = $state<string | null>(null)

export function getTabs(): Tab[] {
  return tabs
}

export function getActiveTabId(): string | null {
  return activeTabId
}

export function getActiveTab(): Tab | undefined {
  return tabs.find((t) => t.id === activeTabId)
}

export async function openTab(filePath: string, content: string): Promise<string> {
  const existing = tabs.find((t) => t.filePath === filePath)
  if (existing) {
    activeTabId = existing.id
    return existing.id
  }

  const id = crypto.randomUUID()
  const fileName = filePath.split('\\').pop()?.split('/').pop() ?? filePath
  const ext = fileName.includes('.') ? fileName.split('.').pop() : null
  tabs.push({
    id,
    filePath,
    fileName,
    content,
    savedContent: content,
    isDirty: false,
    viewMode: 'preview',
    fileKind: classifyFile(ext ?? null),
    pendingExternalChange: false,
  })
  activeTabId = id
  try {
    await invoke('watch_path', { path: filePath, recursive: false })
  } catch (e) {
    console.error('Failed to start watching file:', filePath, e)
  }
  return id
}

export async function closeTab(id: string): Promise<void> {
  const idx = tabs.findIndex((t) => t.id === id)
  if (idx === -1) return
  const removed = tabs.splice(idx, 1)[0]
  if (activeTabId === id) {
    activeTabId = tabs.length > 0 ? tabs[Math.min(idx, tabs.length - 1)].id : null
  }
  if (removed) {
    try {
      await invoke('unwatch_path', { path: removed.filePath })
    } catch (e) {
      console.error('Failed to stop watching file:', removed.filePath, e)
    }
  }
}

export function setActiveTab(id: string): void {
  activeTabId = id
}

export function updateContent(id: string, content: string): void {
  const tab = tabs.find((t) => t.id === id)
  if (!tab) return
  if (tab.content === content) return
  tab.content = content
  tab.isDirty = content !== tab.savedContent
}

export function markClean(id: string): void {
  const tab = tabs.find((t) => t.id === id)
  if (!tab) return
  tab.savedContent = tab.content
  tab.isDirty = false
}

export function setViewMode(id: string, mode: ViewMode): void {
  const tab = tabs.find((t) => t.id === id)
  if (!tab) return
  tab.viewMode = mode
}

export function setExternalChangePrompt(id: string, value: boolean): void {
  const tab = tabs.find((t) => t.id === id)
  if (!tab) return
  tab.pendingExternalChange = value
}

export async function reloadTabFromDisk(id: string): Promise<void> {
  const tab = tabs.find((t) => t.id === id)
  if (!tab) return
  try {
    const content: string = await invoke('read_file', { path: tab.filePath })
    tab.content = content
    tab.savedContent = content
    tab.isDirty = false
    tab.pendingExternalChange = false
  } catch (e) {
    console.error('Failed to reload tab from disk:', tab.filePath, e)
  }
}

export function getAllFilePaths(): string[] {
  return tabs.map((t) => t.filePath)
}

export async function setTabsFromPersisted(
  restored: { filePath: string; content: string; viewMode: ViewMode }[],
  activeFilePath: string | null,
): Promise<void> {
  tabs = restored.map((r) => {
    const fileName = r.filePath.split('\\').pop()?.split('/').pop() ?? r.filePath
    const ext = fileName.includes('.') ? fileName.split('.').pop() : null
    return {
      id: crypto.randomUUID(),
      filePath: r.filePath,
      fileName,
      content: r.content,
      savedContent: r.content,
      isDirty: false,
      viewMode: r.viewMode,
      fileKind: classifyFile(ext ?? null),
      pendingExternalChange: false,
    }
  })
  await Promise.all(
    tabs.map((t) =>
      invoke('watch_path', { path: t.filePath, recursive: false }).catch((e) =>
        console.error('Failed to start watching file:', t.filePath, e),
      ),
    ),
  )
  const resolvedActiveId = findActiveTabIdByFilePath(tabs, activeFilePath)
  if (resolvedActiveId) {
    activeTabId = resolvedActiveId
  } else if (tabs.length > 0) {
    activeTabId = tabs[0].id
  }
}
