import { describe, it, expect } from 'vitest'
import { hashString } from '../../src/lib/utils/hash'

describe('hashString', () => {
  it('is deterministic for the same input', () => {
    expect(hashString('hello')).toBe(hashString('hello'))
  })

  it('returns a different value for a different input', () => {
    expect(hashString('hello')).not.toBe(hashString('world'))
  })

  it('changes when only the end of the string changes (the original cache-key bug)', () => {
    const a = 'a'.repeat(200)
    const b = 'a'.repeat(199) + 'b'
    expect(hashString(a)).not.toBe(hashString(b))
  })

  it('changes when only the middle of the string changes', () => {
    const a = 'a'.repeat(100) + 'X' + 'a'.repeat(100)
    const b = 'a'.repeat(100) + 'Y' + 'a'.repeat(100)
    expect(hashString(a)).not.toBe(hashString(b))
  })

  it('handles the empty string without throwing and returns a string', () => {
    const h = hashString('')
    expect(typeof h).toBe('string')
    expect(h.length).toBeGreaterThan(0)
  })

  it('is stable for unicode content', () => {
    const a = 'héllo 👋 world'
    const b = 'héllo 👋 world'
    const c = 'héllo 👊 world'
    expect(hashString(a)).toBe(hashString(b))
    expect(hashString(a)).not.toBe(hashString(c))
  })

  it('distinguishes a 1-character insertion at position 0 of a large string', () => {
    const a = 'a'.repeat(10_000)
    const b = 'X' + 'a'.repeat(10_000)
    expect(hashString(a)).not.toBe(hashString(b))
  })

  it('returns a bounded-length string (constant-size cache key, O(1) compare)', () => {
    const small = hashString('hi')
    const big = hashString('x'.repeat(100_000))
    expect(small.length).toBeLessThan(32)
    expect(big.length).toBeLessThan(32)
  })
})
