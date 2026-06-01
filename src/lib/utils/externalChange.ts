import type { Tab } from '../types'

export type ExternalChangeAction =
  | { kind: 'ignore' }
  | { kind: 'auto-reload'; tabId: string }
  | { kind: 'prompt'; tabId: string }

export function decideExternalChangeAction(
  tabs: ReadonlyArray<Pick<Tab, 'id' | 'filePath' | 'isDirty'>>,
  changedPath: string,
): ExternalChangeAction {
  const tab = tabs.find((t) => t.filePath === changedPath)
  if (!tab) return { kind: 'ignore' }
  return tab.isDirty
    ? { kind: 'prompt', tabId: tab.id }
    : { kind: 'auto-reload', tabId: tab.id }
}
