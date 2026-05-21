import { describe, it, expect, vi } from 'vitest'
import { debounce } from '../../src/lib/utils/debounce'

describe('debounce', () => {
  it('calls the function after the delay', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    expect(fn).not.toHaveBeenCalled()
    await new Promise((r) => setTimeout(r, 150))
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('cancels previous calls when called again', async () => {
    const fn = vi.fn()
    const debounced = debounce(fn, 100)
    debounced()
    debounced()
    debounced()
    await new Promise((r) => setTimeout(r, 150))
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
