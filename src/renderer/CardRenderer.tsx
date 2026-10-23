import { useCallback, useMemo, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Action, Card as CardModel, CardNode } from "@/schema/card"
import { type ActionEvent, type FormValue, type FormValues, RendererContext } from "./context"
import { NodeView } from "./nodes"

function collectFieldDefaults(nodes: CardNode[], out: FormValues = {}): FormValues {
  for (const node of nodes) {
    switch (node.type) {
      case "input":
      case "textarea":
      case "select":
        out[node.name] = ""
        break
      case "checkbox":
        out[node.name] = node.defaultChecked ?? false
        break
      case "stack":
        collectFieldDefaults(node.children, out)
        break
    }
  }
  return out
}

export function CardRenderer({
  card,
  onAction,
}: {
  card: CardModel
  onAction: (event: ActionEvent) => void
}) {
  // Values persist across edits so typing in the preview survives JSON changes;
  // fields no longer in the card are dropped when collecting.
  const [edited, setEdited] = useState<FormValues>({})
  const defaults = useMemo(() => collectFieldDefaults(card.children), [card])

  const values = useMemo(() => {
    const merged: FormValues = {}
    for (const name of Object.keys(defaults)) merged[name] = edited[name] ?? defaults[name]
    return merged
  }, [defaults, edited])

  const setValue = useCallback((name: string, value: FormValue) => {
    setEdited((prev) => ({ ...prev, [name]: value }))
  }, [])

  const trigger = useCallback(
    (action: Action) => {
      const event: ActionEvent = {
        cardId: card.id,
        actionId: action.id,
        type: action.type,
        url: action.type === "openUrl" ? action.url : undefined,
        payload: action.payload,
        formValues: action.type === "submit" ? values : undefined,
        timestamp: new Date().toISOString(),
      }
      onAction(event)
      if (action.type === "openUrl") {
        window.open(action.url, "_blank", "noopener,noreferrer")
      }
    },
    [card.id, values, onAction],
  )

  // Trailing `actions` nodes become the card footer.
  let split = card.children.length
  while (split > 0 && card.children[split - 1].type === "actions") split--
  const body = card.children.slice(0, split)
  const footer = card.children.slice(split)

  return (
    <RendererContext.Provider value={{ values, setValue, trigger }}>
      <Card className="w-full gap-0 py-0">
        {body.length > 0 && (
          <CardContent className="flex flex-col gap-3 py-4">
            {body.map((node, i) => (
              <NodeView key={i} node={node} />
            ))}
          </CardContent>
        )}
        {footer.map((node, i) => (
          <CardFooter key={i} className="flex-wrap justify-end gap-2">
            <NodeView node={node} />
          </CardFooter>
        ))}
      </Card>
    </RendererContext.Provider>
  )
}
