import { CircleXIcon, PlusIcon } from "lucide-react"
import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { docFor } from "@/docs/components"
import { defForNodeType, defs } from "@/docs/props"
import { type Card, type CardNode, formatPath, parseCard } from "@/schema/card"
import { NODE_ICONS } from "./icons"
import { AddNodeMenu, NodeTree, type TreeOp } from "./NodeTree"
import { ObjectFields } from "./PropertyForm"
import { duplicateNode, getNode, insertChild, looseCard, moveNode, type NodePath, removeNode, updateNode } from "./tree"

/** `[1, 0]` → `["children", 1, "children", 0]`, the path zod reports issues at. */
const jsonPath = (path: NodePath) => path.flatMap((i) => ["children", i])

type Props = {
  source: string
  onSourceChange: (source: string) => void
  selected: NodePath | null
  onSelect: (path: NodePath | null) => void
  onShowJson: () => void
}

export function VisualEditor({ source, onSourceChange, selected, onSelect, onShowJson }: Props) {
  const card = useMemo(() => looseCard(source), [source])
  const issues = useMemo(() => {
    const result = parseCard(source)
    return result.ok ? [] : result.issues
  }, [source])

  if (!card) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <CircleXIcon className="size-6 text-destructive" />
        <p className="text-sm text-muted-foreground">Fix the JSON syntax errors to use the visual editor.</p>
        <Button variant="outline" size="sm" onClick={onShowJson}>
          Back to JSON
        </Button>
      </div>
    )
  }

  const commit = (next: Card, nextSelected?: NodePath | null) => {
    onSourceChange(JSON.stringify(next, null, 2))
    if (nextSelected !== undefined) onSelect(nextSelected)
  }

  const handleOp = (path: NodePath, op: TreeOp) => {
    switch (op) {
      case "up":
      case "down": {
        const moved = moveNode(card, path, op === "up" ? -1 : 1)
        return commit(moved.card, moved.path)
      }
      case "duplicate": {
        const copy = duplicateNode(card, path)
        return commit(copy.card, copy.path)
      }
      case "delete":
        return commit(removeNode(card, path), null)
    }
  }

  const handleAdd = (parentPath: NodePath, node: CardNode) => {
    const added = insertChild(card, parentPath, node)
    commit(added.card, added.path)
  }

  const node = selected ? getNode(card, selected) : undefined
  const prefix = selected ? jsonPath(selected) : []
  const nodeIssues = issues.filter((issue) => prefix.every((p, i) => issue.path[i] === p))

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-9 shrink-0 items-center justify-between border-b px-3">
        <span className="text-xs font-medium">Structure</span>
        <AddNodeMenu parent={null} onAdd={(n) => handleAdd([], n)}>
          <Button variant="ghost" size="xs">
            <PlusIcon /> Add node
          </Button>
        </AddNodeMenu>
      </div>
      <div className="max-h-[45%] shrink-0 overflow-y-auto border-b">
        <NodeTree nodes={card.children} selected={selected} onSelect={onSelect} onOp={handleOp} onAdd={handleAdd} />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {selected && node ? (
          <NodeForm
            key={selected.join(".")}
            node={node}
            onChange={(next) => commit(updateNode(card, selected, next))}
            issues={nodeIssues}
            prefixLength={prefix.length}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-sm font-medium">Card</div>
              <p className="text-xs text-muted-foreground">
                Select a node in the tree or click one in the preview to edit it.
              </p>
            </div>
            <IssueList issues={nodeIssues} prefixLength={0} />
            <ObjectFields schema={defs.Card} value={card} onChange={(next) => commit(next as Card)} />
          </div>
        )}
      </div>
    </div>
  )
}

function NodeForm({
  node,
  onChange,
  issues,
  prefixLength,
}: {
  node: CardNode
  onChange: (node: CardNode) => void
  issues: { path: (string | number)[]; message: string }[]
  prefixLength: number
}) {
  const schema = defForNodeType(node.type)
  const Icon = NODE_ICONS[node.type]
  const doc = schema ? docFor(node.type) : undefined

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-start gap-2">
        {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />}
        <div>
          <div className="font-mono text-sm font-medium">{String(node.type)}</div>
          {doc && <p className="text-xs text-muted-foreground">{doc.summary.replace(/`/g, "")}</p>}
        </div>
      </div>
      <IssueList issues={issues} prefixLength={prefixLength} />
      {schema ? (
        <ObjectFields schema={schema} value={node} onChange={(next) => onChange(next as CardNode)} />
      ) : (
        <p className="text-xs text-muted-foreground">Unknown node type. Fix it in the JSON editor.</p>
      )}
    </div>
  )
}

function IssueList({ issues, prefixLength }: { issues: { path: (string | number)[]; message: string }[]; prefixLength: number }) {
  if (issues.length === 0) return null
  return (
    <ul className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs">
      {issues.map((issue, i) => (
        <li key={i} className="flex gap-2 font-mono">
          <span className="shrink-0 text-muted-foreground">{formatPath(issue.path.slice(prefixLength))}</span>
          <span className="text-destructive">{issue.message}</span>
        </li>
      ))}
    </ul>
  )
}
