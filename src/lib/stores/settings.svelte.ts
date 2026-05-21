let debounceMs = $state(150)
let largeFileThresholdBytes = $state(2 * 1024 * 1024)

export function getDebounceMs(): number {
  return debounceMs
}

export function setDebounceMs(ms: number): void {
  debounceMs = ms
}

export function getLargeFileThreshold(): number {
  return largeFileThresholdBytes
}

export function setLargeFileThreshold(bytes: number): void {
  largeFileThresholdBytes = bytes
}
