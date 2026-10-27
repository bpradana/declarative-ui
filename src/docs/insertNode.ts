import { type CardNode, parseCard } from "@/schema/card"
import { insertChild } from "@/visual/tree"

/**
 * Append `node` to the card in `source`. Trailing `actions` stay last so the footer doesn't move.
 * Returns null when `source` isn't a valid card.
 */
export function insertNode(source: string, node: CardNode): string | null {
  const result = parseCard(source)
  if (!result.ok) return null
  return JSON.stringify(insertChild(result.card, [], node).card, null, 2)
}
