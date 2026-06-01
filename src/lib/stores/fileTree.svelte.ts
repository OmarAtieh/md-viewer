import { type TreeNode } from '../types'

let root: TreeNode | null = $state(null)
let showSupportedOnly = $state(true)
let rootPath = $state<string | null>(null)

export function getRoot(): TreeNode | null {
  return root
}

export function getShowSupportedOnly(): boolean {
  return showSupportedOnly
}

export function setShowSupportedOnly(value: boolean): void {
  showSupportedOnly = value
}

export function getRootPath(): string | null {
  return rootPath
}

export function setRoot(path: string | null, tree: TreeNode | null): void {
  rootPath = path
  root = tree
}

export function clearTree(): void {
  root = null
  rootPath = null
}

export function updateNodeChildren(path: string, children: TreeNode[]): void {
  function find(nodes: TreeNode[]): TreeNode | undefined {
    for (const n of nodes) {
      if (n.path === path) return n
      if (n.children) {
        const found = find(n.children)
        if (found) return found
      }
    }
    return undefined
  }
  if (!root) return
  const node = find([root])
  if (node) {
    node.children = children
    node.loaded = true
    node.loading = false
  }
}

export function setNodeLoading(path: string, loading: boolean): void {
  function find(nodes: TreeNode[]): TreeNode | undefined {
    for (const n of nodes) {
      if (n.path === path) return n
      if (n.children) {
        const found = find(n.children)
        if (found) return found
      }
    }
    return undefined
  }
  if (!root) return
  const node = find([root])
  if (node) {
    node.loading = loading
  }
}

export function markNodeStale(path: string): void {
  function find(nodes: TreeNode[]): TreeNode | undefined {
    for (const n of nodes) {
      if (n.path === path) return n
      if (n.children) {
        const found = find(n.children)
        if (found) return found
      }
    }
    return undefined
  }
  if (!root) return
  const node = find([root])
  if (!node) return
  node.loaded = false
  if (node.expanded) {
    node.children = []
  }
}
