export function findActiveTabIdByFilePath(
  tabs: ReadonlyArray<{ id: string; filePath: string }>,
  activeFilePath: string | null,
): string | null {
  if (!activeFilePath) return null
  const tab = tabs.find((t) => t.filePath === activeFilePath)
  return tab?.id ?? null
}
