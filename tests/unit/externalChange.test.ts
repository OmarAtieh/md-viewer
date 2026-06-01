import { describe, it, expect } from 'vitest'
import { decideExternalChangeAction } from '../../src/lib/utils/externalChange'
import type { Tab } from '../../src/lib/types'

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: overrides.id ?? 'tab-1',
    filePath: overrides.filePath ?? 'C:/notes/foo.md',
    fileName: overrides.fileName ?? 'foo.md',
    content: overrides.content ?? '# hello',
    savedContent: overrides.savedContent ?? '# hello',
    isDirty: overrides.isDirty ?? false,
    viewMode: overrides.viewMode ?? 'preview',
    fileKind: overrides.fileKind ?? 'markdown',
    pendingExternalChange: overrides.pendingExternalChange ?? false,
  }
}

describe('decideExternalChangeAction', () => {
  it('returns ignore when no tab matches the changed path', () => {
    const tabs = [makeTab({ filePath: 'C:/notes/foo.md' })]
    expect(decideExternalChangeAction(tabs, 'C:/notes/other.md')).toEqual({
      kind: 'ignore',
    })
  })

  it('returns auto-reload when matching tab is clean', () => {
    const tabs = [makeTab({ id: 'tab-1', filePath: 'C:/notes/foo.md', isDirty: false })]
    expect(decideExternalChangeAction(tabs, 'C:/notes/foo.md')).toEqual({
      kind: 'auto-reload',
      tabId: 'tab-1',
    })
  })

  it('returns prompt when matching tab is dirty', () => {
    const tabs = [
      makeTab({ id: 'tab-1', filePath: 'C:/notes/foo.md', isDirty: true }),
    ]
    expect(decideExternalChangeAction(tabs, 'C:/notes/foo.md')).toEqual({
      kind: 'prompt',
      tabId: 'tab-1',
    })
  })

  it('matches against an empty tab list without throwing', () => {
    expect(decideExternalChangeAction([], 'C:/notes/foo.md')).toEqual({
      kind: 'ignore',
    })
  })

  it('matches the first tab with the same path (others are not opened for the same file)', () => {
    const tabs = [
      makeTab({ id: 'first', filePath: 'C:/notes/foo.md', isDirty: false }),
      makeTab({ id: 'second', filePath: 'C:/notes/foo.md', isDirty: true }),
    ]
    const result = decideExternalChangeAction(tabs, 'C:/notes/foo.md')
    expect(result.kind).toBe('auto-reload')
    if (result.kind === 'auto-reload') {
      expect(result.tabId).toBe('first')
    }
  })

  it('is case sensitive on the path match (notify normalizes, callers should too)', () => {
    const tabs = [makeTab({ filePath: 'C:/Notes/Foo.MD' })]
    expect(decideExternalChangeAction(tabs, 'C:/Notes/Foo.MD').kind).toBe('auto-reload')
    expect(decideExternalChangeAction(tabs, 'c:/notes/foo.md').kind).toBe('ignore')
  })
})
