// FNV-1a 32-bit. Fast, deterministic, non-cryptographic. Returns a base-36 string
// (short, constant size) so cache-key comparisons are O(1) regardless of content length.
export function hashString(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(36)
}
