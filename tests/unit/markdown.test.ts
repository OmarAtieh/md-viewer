import { describe, it, expect } from 'vitest'
import { renderMarkdown } from '../../src/lib/utils/markdown'

describe('renderMarkdown', () => {
  it('renders headings', () => {
    const result = renderMarkdown('# Hello')
    expect(result).toContain('<h1>')
    expect(result).toContain('Hello')
  })

  it('renders bold text', () => {
    const result = renderMarkdown('**bold**')
    expect(result).toContain('<strong>')
  })

  it('renders code blocks', () => {
    const result = renderMarkdown('```js\nconsole.log("hi")\n```')
    expect(result).toContain('<pre')
    expect(result).toContain('<code')
  })

  it('strips raw HTML when html is false', () => {
    const result = renderMarkdown('<script>alert("xss")</script>')
    expect(result).not.toContain('<script>')
  })

  it('renders links', () => {
    const result = renderMarkdown('[text](https://example.com)')
    expect(result).toContain('<a')
    expect(result).toContain('href="https://example.com"')
  })

  it('sanitizes dangerous content', () => {
    const result = renderMarkdown('[click](javascript:alert(1))')
    expect(result).not.toContain('href="javascript:')
  })

  it('renders empty string', () => {
    const result = renderMarkdown('')
    expect(result).toBe('')
  })
})
