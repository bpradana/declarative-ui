import { useCallback, useMemo, useState } from "react"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import type { Action, Card as CardModel, CardNode } from "@/schema/card"
import { type ActionEvent, type BlockedSubmit, type FormValue, type FormValues, type Inspect, RendererContext } from "./context"
import { NodeView } from "./nodes"
import { validateFields } from "./validation"

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
  onBlocked,
  inspect,
}: {
  card: CardModel
  onAction: (event: ActionEvent) => void
  onBlocked?: (entry: BlockedSubmit) => void
  inspect?: Inspect
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

  // After a blocked submit, errors are re-checked on every change so they clear as fields are fixed.
  const [showErrors, setShowErrors] = useState(false)
  const errors = useMemo(
    () => (showErrors ? validateFields(card.children, values) : {}),
    [showErrors, card.children, values],
  )

  const setValue = useCallback((name: string, value: FormValue) => {
    setEdited((prev) => ({ ...prev, [name]: value }))
  }, [])

  const trigger = useCallback(
    (action: Action) => {
      if (action.type === "submit") {
        const invalid = validateFields(card.children, values)
        setShowErrors(Object.keys(invalid).length > 0)
        if (Object.keys(invalid).length > 0) {
          onBlocked?.({ cardId: card.id, actionId: action.id, errors: invalid, timestamp: new Date().toISOString() })
          return
        }
      }
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
    [card.id, card.children, values, onAction, onBlocked],
  )

  // Trailing `actions` nodes become the card footer.
  let split = card.children.length
  while (split > 0 && card.children[split - 1].type === "actions") split--
  const body = card.children.slice(0, split)
  const footer = card.children.slice(split)

  // In inspect mode, swallow pointer events before buttons, inputs or selects see them
  // and select the innermost node under the pointer instead.
  const intercept = (e: React.PointerEvent | React.MouseEvent) => {
    if (!inspect) return
    e.preventDefault()
    e.stopPropagation()
    if (e.type !== "click") return
    const el = (e.target as HTMLElement).closest<HTMLElement>("[data-path]")
    if (el?.dataset.path) inspect.onSelect(el.dataset.path.split(".").map(Number))
  }

  return (
    <RendererContext.Provider value={{ values, setValue, trigger, errors, inspect }}>
      <Card
        className="w-full gap-0 py-0"
        onPointerDownCapture={inspect && intercept}
        onMouseDownCapture={inspect && intercept}
        onClickCapture={inspect && intercept}
      >
        {body.length > 0 && (
          <CardContent className="flex flex-col gap-3 py-4">
            {body.map((node, i) => (
              <NodeView key={i} node={node} path={[i]} />
            ))}
          </CardContent>
        )}
        {footer.map((node, i) => (
          <CardFooter key={i} className="flex-wrap justify-end gap-2">
            <NodeView node={node} path={[split + i]} />
          </CardFooter>
        ))}
      </Card>
    </RendererContext.Provider>
  )
}
