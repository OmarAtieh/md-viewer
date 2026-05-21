import { type Tab, type ViewMode, type FileKind } from '../types'
import { classifyFile } from '../utils/fileUtils'

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

export function openTab(filePath: string, content: string): string {
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
  })
  activeTabId = id
  return id
}

export function closeTab(id: string): void {
  const idx = tabs.findIndex((t) => t.id === id)
  if (idx === -1) return
  tabs.splice(idx, 1)
  if (activeTabId === id) {
    activeTabId = tabs.length > 0 ? tabs[Math.min(idx, tabs.length - 1)].id : null
  }
}

export function setActiveTab(id: string): void {
  activeTabId = id
}

export function updateContent(id: string, content: string): void {
  const tab = tabs.find((t) => t.id === id)
  if (!tab) return
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

export function getAllFilePaths(): string[] {
  return tabs.map((t) => t.filePath)
}

export function setTabsFromPersisted(
  restored: { filePath: string; content: string; viewMode: ViewMode }[],
  activeId: string | null,
): void {
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
    }
  })
  if (activeId && tabs.length > 0) {
    activeTabId = tabs[0].id
  }
}
