import type { ViewMode } from '../types'

const STORAGE_KEY = 'md-viewer-state'

interface PersistedState {
  darkMode: boolean
  showSupportedOnly: boolean
  lastFolder: string | null
  tabs: { filePath: string; viewMode: ViewMode }[]
  activeTabId: string | null
  debounceMs: number
  zoom: number
}

const defaults: PersistedState = {
  darkMode: false,
  showSupportedOnly: true,
  lastFolder: null,
  tabs: [],
  activeTabId: null,
  debounceMs: 150,
  zoom: 100,
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function saveState(state: Partial<PersistedState>): void {
  try {
    const current = loadState()
    const merged = { ...current, ...state }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // localStorage unavailable
  }
}
