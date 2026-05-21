import { describe, it, expect } from 'vitest'
import { classifyFile, isSupportedFile } from './fileUtils'

describe('classifyFile', () => {
  it('classifies .md as markdown', () => {
    expect(classifyFile('md')).toBe('markdown')
  })

  it('classifies .markdown as markdown', () => {
    expect(classifyFile('markdown')).toBe('markdown')
  })

  it('classifies .mdown as markdown', () => {
    expect(classifyFile('mdown')).toBe('markdown')
  })

  it('classifies .txt as text', () => {
    expect(classifyFile('txt')).toBe('text')
  })

  it('classifies .log as text', () => {
    expect(classifyFile('log')).toBe('text')
  })

  it('is case insensitive', () => {
    expect(classifyFile('MD')).toBe('markdown')
    expect(classifyFile('TXT')).toBe('text')
  })

  it('classifies null as unsupported', () => {
    expect(classifyFile(null)).toBe('unsupported')
  })

  it('classifies unknown extensions as unsupported', () => {
    expect(classifyFile('exe')).toBe('unsupported')
    expect(classifyFile('js')).toBe('unsupported')
  })
})

describe('isSupportedFile', () => {
  it('returns true for markdown files', () => {
    expect(isSupportedFile('md')).toBe(true)
  })

  it('returns true for text files', () => {
    expect(isSupportedFile('txt')).toBe(true)
  })

  it('returns false for unsupported files', () => {
    expect(isSupportedFile('exe')).toBe(false)
  })
})
