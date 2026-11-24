export interface TreeNode {
  /** Stable, globally unique identifier without whitespace. */
  value: string
  label: string
  disabled?: boolean
  children?: readonly TreeNode[]
}

export interface TreeProps {
  label: string
  /** Static-shaped tree of at most 250 nodes and eight levels. */
  items: readonly TreeNode[]
  expandedValue?: readonly string[]
  defaultExpandedValue?: readonly string[]
  /** Ready Tree supports single selection: provide zero or one value. */
  selectedValue?: readonly string[]
  defaultSelectedValue?: readonly string[]
  onExpandedChange?: (value: string[]) => void
  onSelectionChange?: (value: string[]) => void
}

export function treeLabel(label: string) {
  if (typeof label !== 'string' || !label.trim()) throw new Error('Ready Tree: label must contain non-whitespace text.')
  return label
}

export function treeModel(items: readonly TreeNode[]) {
  const values = new Set<string>()
  const branches = new Set<string>()
  const selectable = new Set<string>()
  function visit(nodes: readonly TreeNode[], depth: number) {
    if (nodes.length && depth > 8) throw new Error('Ready Tree: at most eight levels are supported.')
    for (const node of nodes) {
      if (typeof node.value !== 'string' || !node.value || /\s/.test(node.value) || values.has(node.value)) {
        throw new Error('Ready Tree: node values must be globally unique, nonempty and contain no whitespace.')
      }
      treeLabel(node.label)
      values.add(node.value)
      if (values.size > 250) throw new Error('Ready Tree: at most 250 nodes are supported.')
      if (!node.disabled) selectable.add(node.value)
      if (node.children?.length) {
        branches.add(node.value)
        visit(node.children, depth + 1)
      }
    }
  }
  visit(items, 1)
  const rootNode: TreeNode = { value: '', label: '', children: items }
  return { rootNode, branches, selectable }
}

export function treeState(
  values: readonly string[] | undefined, known: ReadonlySet<string>, kind: 'expanded' | 'selected',
) {
  if (values === undefined) return
  if (kind === 'selected' && values.length > 1) throw new Error('Ready Tree: selection takes at most one node.')
  if (new Set(values).size !== values.length || values.some(value => !known.has(value))) {
    throw new Error(`Ready Tree: ${kind} values must identify distinct ${kind === 'expanded' ? 'branches' : 'enabled nodes'}.`)
  }
  return [...values]
}
