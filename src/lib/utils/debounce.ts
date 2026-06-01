export function debounce<TArgs extends unknown[]>(
  fn: (...args: TArgs) => void,
  delay: number,
): (...args: TArgs) => void {
  let timer: ReturnType<typeof setTimeout> | null = null

  return (...args: TArgs) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn(...args)
      timer = null
    }, delay)
  }
}
