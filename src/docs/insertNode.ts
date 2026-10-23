import { type CardNode, parseCard } from "@/schema/card"

/**
 * Append `node` to the card in `source`. Trailing `actions` stay last so the footer doesn't move.
 * Returns null when `source` isn't a valid card.
 */
export function insertNode(source: string, node: CardNode): string | null {
  const result = parseCard(source)
  if (!result.ok) return null
  const json = JSON.parse(source) as { children: unknown[] }
  const children = json.children
  let at = children.length
  while (at > 0 && (children[at - 1] as { type?: string }).type === "actions") at--
  if (node.type === "actions") at = children.length
  children.splice(at, 0, node)
  return JSON.stringify(json, null, 2)
}
