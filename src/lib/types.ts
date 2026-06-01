export interface DirEntry {
  name: string
  path: string
  is_dir: boolean
  extension: string | null
}

export interface TreeNode {
  name: string
  path: string
  is_dir: boolean
  extension: string | null
  children: TreeNode[] | null
  loaded: boolean
  loading: boolean
  expanded: boolean
}

export interface Tab {
  id: string
  filePath: string
  fileName: string
  content: string
  savedContent: string
  isDirty: boolean
  viewMode: ViewMode
  fileKind: FileKind
  pendingExternalChange: boolean
}

export type ViewMode = 'source' | 'preview' | 'split'

export type FileKind = 'markdown' | 'text' | 'unsupported'

export const MARKDOWN_EXTENSIONS = new Set(['md', 'markdown', 'mdown'])
export const TEXT_EXTENSIONS = new Set(['txt', 'text', 'log'])
