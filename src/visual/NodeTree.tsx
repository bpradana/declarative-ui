import { ArrowDownIcon, ArrowUpIcon, CopyIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { componentDocs, GROUPS } from "@/docs/components"
import { cn } from "@/lib/utils"
import type { CardNode } from "@/schema/card"
import { NODE_ICONS } from "./icons"
import { allowedChildTypes, isContainer, type NodePath, samePath } from "./tree"

/** Short human hint shown after the node type, e.g. the button label. */
function hint(node: CardNode): string {
  switch (node.type) {
    case "header":
      return node.title
    case "text":
      return node.content
    case "image":
      return node.alt
    case "badge":
    case "button":
    case "checkbox":
      return node.label
    case "input":
    case "textarea":
    case "select":
      return node.label ?? node.name
    case "keyValue":
    case "list":
      return `${node.items?.length ?? 0} items`
    case "stack":
      return node.direction ?? "vertical"
    case "actions":
      return `${node.children?.length ?? 0} buttons`
    default:
      return ""
  }
}

export type TreeOp = "up" | "down" | "duplicate" | "delete"

type Props = {
  nodes: CardNode[]
  selected: NodePath | null
  onSelect: (path: NodePath | null) => void
  onOp: (path: NodePath, op: TreeOp) => void
  onAdd: (parentPath: NodePath, node: CardNode) => void
}

export function AddNodeMenu({
  parent,
  onAdd,
  children,
}: {
  parent: CardNode | null
  onAdd: (node: CardNode) => void
  children: React.ReactNode
}) {
  const allowed = allowedChildTypes(parent)
  const docs = componentDocs.filter((d) => allowed === "any" || allowed.includes(d.type))
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80">
        {GROUPS.map((group, gi) => {
          const items = docs.filter((d) => d.group === group)
          if (items.length === 0) return null
          return (
            <DropdownMenuGroup key={group}>
              {gi > 0 && allowed === "any" && <DropdownMenuSeparator />}
              <DropdownMenuLabel>{group}</DropdownMenuLabel>
              {items.map((d) => {
                const Icon = NODE_ICONS[d.type]
                return (
                  <DropdownMenuItem key={d.type} onSelect={() => onAdd(structuredClone(d.examples[0].node))}>
                    <Icon /> <span className="font-mono text-xs">{d.type}</span>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuGroup>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function NodeTree(props: Props) {
  if (props.nodes.length === 0) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">The card is empty. Add a node to get started.</p>
  }
  return (
    <ul role="tree" className="py-1">
      {props.nodes.map((node, i) => (
        <TreeRow key={i} {...props} node={node} path={[i]} siblings={props.nodes.length} />
      ))}
    </ul>
  )
}

function TreeRow({
  node,
  path,
  siblings,
  ...props
}: Props & { node: CardNode; path: NodePath; siblings: number }) {
  const selected = samePath(props.selected, path)
  const index = path[path.length - 1]
  const Icon = NODE_ICONS[node?.type] ?? MinusIcon
  const container = node && isContainer(node)

  return (
    <li role="treeitem" aria-selected={selected}>
      <div
        className={cn(
          "group flex h-8 items-center gap-1.5 pr-1 text-sm hover:bg-muted",
          selected && "bg-primary/10 hover:bg-primary/15",
        )}
        style={{ paddingLeft: 8 + (path.length - 1) * 14 }}
      >
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-left"
          onClick={() => props.onSelect(selected ? null : path)}
        >
          <Icon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="font-mono text-xs">{node?.type ?? "?"}</span>
          {node && <span className="truncate text-xs text-muted-foreground">{hint(node)}</span>}
        </button>
        {/* Always visible on touch screens, on hover/selection with a mouse. */}
        <div
          className={cn(
            "flex shrink-0 items-center [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100",
            selected && "[@media(hover:hover)]:opacity-100",
          )}
        >
          {container && (
            <AddNodeMenu parent={node} onAdd={(child) => props.onAdd(path, child)}>
              <Button variant="ghost" size="icon-xs" aria-label={`Add to ${node.type}`}>
                <PlusIcon />
              </Button>
            </AddNodeMenu>
          )}
          <Button variant="ghost" size="icon-xs" aria-label="Move up" disabled={index === 0} onClick={() => props.onOp(path, "up")}>
            <ArrowUpIcon />
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Move down"
            disabled={index === siblings - 1}
            onClick={() => props.onOp(path, "down")}
          >
            <ArrowDownIcon />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Duplicate" onClick={() => props.onOp(path, "duplicate")}>
            <CopyIcon />
          </Button>
          <Button variant="ghost" size="icon-xs" aria-label="Delete" onClick={() => props.onOp(path, "delete")}>
            <Trash2Icon />
          </Button>
        </div>
      </div>
      {container && node.children.length > 0 && (
        <ul role="group">
          {node.children.map((child, i) => (
            <TreeRow key={i} {...props} node={child} path={[...path, i]} siblings={node.children.length} />
          ))}
        </ul>
      )}
    </li>
  )
}
