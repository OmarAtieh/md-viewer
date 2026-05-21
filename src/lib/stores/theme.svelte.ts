let darkMode = $state(false)

export function isDarkMode(): boolean {
  return darkMode
}

export function setDarkMode(value: boolean): void {
  darkMode = value
  document.documentElement.classList.toggle('dark', value)
}

export function toggleDarkMode(): void {
  setDarkMode(!darkMode)
}
