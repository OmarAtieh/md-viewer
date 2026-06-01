import type { ViewMode } from '../types'

const STORAGE_KEY = 'md-viewer-state'

interface PersistedState {
  darkMode: boolean
  showSupportedOnly: boolean
  lastFolder: string | null
  tabs: { filePath: string; viewMode: ViewMode }[]
  activeFilePath: string | null
  debounceMs: number
  zoom: number
}

const defaults: PersistedState = {
  darkMode: false,
  showSupportedOnly: true,
  lastFolder: null,
  tabs: [],
  activeFilePath: null,
  debounceMs: 150,
  zoom: 100,
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    const parsed = JSON.parse(raw) as Partial<PersistedState> & { activeTabId?: string | null }
    // Migration: drop the legacy `activeTabId` field — UUIDs don't survive a restart,
    // so we now persist `activeFilePath` instead and resolve on restore.
    delete parsed.activeTabId
    return { ...defaults, ...parsed }
  } catch {
    return { ...defaults }
  }
}

export function saveState(state: Partial<PersistedState>): void {
  try {
    const current = loadState()
    const merged = { ...current, ...state }
    delete (merged as { activeTabId?: unknown }).activeTabId
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // localStorage unavailable
  }
}
