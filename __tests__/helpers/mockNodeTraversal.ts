export type MockNode = {
  type: string
  props: Record<string, unknown>
}

export function resolveNode(node: unknown, depth = 0): MockNode | null {
  if (!node || typeof node !== 'object' || depth > 5) return null
  const n = node as Record<string, unknown>
  if (typeof n.type === 'function') {
    try {
      const rendered = (n.type as (...args: unknown[]) => unknown)(
        n.props || {}
      )
      if (!rendered || typeof rendered !== 'object') return null
      if (typeof (rendered as Record<string, unknown>).type === 'function') {
        return resolveNode(rendered, depth + 1)
      }
      if (typeof (rendered as MockNode).type === 'string') {
        return rendered as MockNode
      }
    } catch {
      return null
    }
    return null
  }
  if (typeof n.type === 'string') {
    return n as unknown as MockNode
  }
  return null
}

export function collectAllNodes(node: unknown): MockNode[] {
  const results: MockNode[] = []
  const resolved = resolveNode(node)
  if (resolved) {
    results.push(resolved)
    const children = resolved.props?.children
    if (Array.isArray(children)) {
      children.forEach(child => results.push(...collectAllNodes(child)))
    } else if (children && typeof children === 'object') {
      results.push(...collectAllNodes(children))
    }
    return results
  }
  const n = node as Record<string, unknown>
  if (n?.props) {
    const children = (n.props as Record<string, unknown>)?.children
    if (Array.isArray(children)) {
      children.forEach(child => results.push(...collectAllNodes(child)))
    } else if (children && typeof children === 'object') {
      results.push(...collectAllNodes(children))
    }
  }
  return results
}

export function findByType(node: unknown, type: string): MockNode[] {
  return collectAllNodes(node).filter(n => n.type === type)
}

export function findByAccessibilityLabel(
  node: unknown,
  label: string
): MockNode | undefined {
  return collectAllNodes(node).find(n => n.props?.accessibilityLabel === label)
}
