import { MARKDOWN_EXTENSIONS, TEXT_EXTENSIONS, type FileKind } from '../types'

export function classifyFile(extension: string | null): FileKind {
  if (!extension) return 'unsupported'
  const ext = extension.toLowerCase()
  if (MARKDOWN_EXTENSIONS.has(ext)) return 'markdown'
  if (TEXT_EXTENSIONS.has(ext)) return 'text'
  return 'unsupported'
}

export function isSupportedFile(extension: string | null): boolean {
  return classifyFile(extension) !== 'unsupported'
}

export function getFileLabel(extension: string | null): string {
  const kind = classifyFile(extension)
  switch (kind) {
    case 'markdown':
      return 'Markdown'
    case 'text':
      return 'Text'
    default:
      return 'Unsupported'
  }
}
