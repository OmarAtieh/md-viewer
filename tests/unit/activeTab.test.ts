import { describe, it, expect } from 'vitest'
import { findActiveTabIdByFilePath } from '../../src/lib/utils/activeTab'

describe('findActiveTabIdByFilePath', () => {
  it('returns the id of the tab matching the file path', () => {
    const tabs = [
      { id: 'a', filePath: 'C:/notes/foo.md' },
      { id: 'b', filePath: 'C:/notes/bar.md' },
    ]
    expect(findActiveTabIdByFilePath(tabs, 'C:/notes/bar.md')).toBe('b')
  })

  it('returns null when the file path is null', () => {
    const tabs = [{ id: 'a', filePath: 'C:/notes/foo.md' }]
    expect(findActiveTabIdByFilePath(tabs, null)).toBeNull()
  })

  it('returns null when no tab matches the file path', () => {
    const tabs = [{ id: 'a', filePath: 'C:/notes/foo.md' }]
    expect(findActiveTabIdByFilePath(tabs, 'C:/notes/other.md')).toBeNull()
  })

  it('returns null for an empty tab list', () => {
    expect(findActiveTabIdByFilePath([], 'C:/notes/foo.md')).toBeNull()
  })

  it('matches the first tab when the same path appears more than once (defensive)', () => {
    const tabs = [
      { id: 'first', filePath: 'C:/notes/foo.md' },
      { id: 'second', filePath: 'C:/notes/foo.md' },
    ]
    expect(findActiveTabIdByFilePath(tabs, 'C:/notes/foo.md')).toBe('first')
  })
})
