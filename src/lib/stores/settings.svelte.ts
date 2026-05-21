let debounceMs = $state(150)
let largeFileThresholdBytes = $state(2 * 1024 * 1024)
let zoom = $state(100)

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

export function getZoom(): number {
  return zoom
}

export function setZoom(value: number): void {
  zoom = Math.max(50, Math.min(200, value))
}

export function zoomIn(): void {
  setZoom(zoom + 10)
}

export function zoomOut(): void {
  setZoom(zoom - 10)
}

export function zoomReset(): void {
  zoom = 100
}
