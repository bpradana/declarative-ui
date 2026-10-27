import type { Card, CardNode } from "@/schema/card"

/** Indices through `children` arrays, e.g. `[2, 0]` is the first child of the card's third node. */
export type NodePath = number[]

type Container = Extract<CardNode, { children: unknown[] }>

// Also checks `children` because the visual editor works on cards that may not match the schema yet.
export const isContainer = (node: CardNode): node is Container =>
  (node.type === "stack" || node.type === "actions") && Array.isArray(node.children)

export const samePath = (a: NodePath | null, b: NodePath | null) =>
  a !== null && b !== null && a.length === b.length && a.every((v, i) => v === b[i])

export function getNode(card: Card, path: NodePath): CardNode | undefined {
  let children: CardNode[] = card.children
  let node: CardNode | undefined
  for (const i of path) {
    node = children[i]
    if (!node) return undefined
    children = isContainer(node) ? node.children : []
  }
  return node
}

/** Which node types may be inserted under `parent` (null = card root). */
export function allowedChildTypes(parent: CardNode | null): CardNode["type"][] | "any" {
  if (parent?.type === "actions") return ["button"]
  if (parent && parent.type !== "stack") return []
  return "any"
}

/** Replace the children array at `parentPath` (empty = card root) without mutating `card`. */
function withChildren(card: Card, parentPath: NodePath, fn: (children: CardNode[]) => CardNode[]): Card {
  const rec = (children: CardNode[], depth: number): CardNode[] => {
    if (depth === parentPath.length) return fn(children)
    const i = parentPath[depth]
    const node = children[i]
    if (!node || !isContainer(node)) return children
    const next = children.slice()
    next[i] = { ...node, children: rec(node.children, depth + 1) } as CardNode
    return next
  }
  return { ...card, children: rec(card.children, 0) }
}

const parentOf = (path: NodePath) => path.slice(0, -1)
const indexOf = (path: NodePath) => path[path.length - 1]

export function updateNode(card: Card, path: NodePath, node: CardNode): Card {
  return withChildren(card, parentOf(path), (children) => children.map((c, i) => (i === indexOf(path) ? node : c)))
}

export function removeNode(card: Card, path: NodePath): Card {
  return withChildren(card, parentOf(path), (children) => children.filter((_, i) => i !== indexOf(path)))
}

/** Move a node within its parent by `delta`. Returns the node's new path (unchanged when at the edge). */
export function moveNode(card: Card, path: NodePath, delta: number): { card: Card; path: NodePath } {
  const parent = parentOf(path)
  const from = indexOf(path)
  let to = from
  const next = withChildren(card, parent, (children) => {
    to = Math.max(0, Math.min(children.length - 1, from + delta))
    if (to === from) return children
    const out = children.slice()
    const [moved] = out.splice(from, 1)
    out.splice(to, 0, moved)
    return out
  })
  return { card: to === from ? card : next, path: [...parent, to] }
}

export function duplicateNode(card: Card, path: NodePath): { card: Card; path: NodePath } {
  const node = getNode(card, path)
  if (!node) return { card, path }
  const copy = structuredClone(node)
  const next = withChildren(card, parentOf(path), (children) => {
    const out = children.slice()
    out.splice(indexOf(path) + 1, 0, copy)
    return out
  })
  return { card: next, path: [...parentOf(path), indexOf(path) + 1] }
}

/**
 * Insert `node` as a child of `parentPath` (empty = card root), appending by default.
 * At the root, trailing `actions` stay last so the footer doesn't move; new `actions` go at the very end.
 */
export function insertChild(card: Card, parentPath: NodePath, node: CardNode): { card: Card; path: NodePath } {
  let at = 0
  const next = withChildren(card, parentPath, (children) => {
    at = children.length
    if (parentPath.length === 0 && node.type !== "actions") {
      while (at > 0 && children[at - 1].type === "actions") at--
    }
    const out = children.slice()
    out.splice(at, 0, node)
    return out
  })
  return { card: next, path: [...parentPath, at] }
}

/**
 * Parses `source` as a card shape without validating it against the schema, so the visual editor
 * keeps working while a field is temporarily invalid (e.g. an empty required `id`).
 */
export function looseCard(source: string): Card | null {
  try {
    const json: unknown = JSON.parse(source)
    if (typeof json === "object" && json !== null && Array.isArray((json as Card).children)) return json as Card
  } catch {
    // fall through
  }
  return null
}
