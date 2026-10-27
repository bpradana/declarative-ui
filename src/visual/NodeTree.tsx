import {
  closestCenter,
  type CollisionDetection,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { ArrowDownIcon, ArrowUpIcon, CopyIcon, GripVerticalIcon, MinusIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { createContext, useContext, useState } from "react"
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
import { allowedChildTypes, getNode, isContainer, type NodePath, samePath } from "./tree"

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
  /** Whether the node at `from` may be dropped into `toParent`. */
  canDrop: (from: NodePath, toParent: NodePath) => boolean
  onMove: (from: NodePath, toParent: NodePath, toIndex: number) => void
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

type DropPosition = "before" | "after" | "inside"
type DropTarget = { path: NodePath; position: DropPosition; valid: boolean }

const keyOf = (path: NodePath) => path.join(".")
const pathOf = (key: string): NodePath => key.split(".").map(Number)

/** Turn "drop before/after/inside row X" into the parent and index the node should end up at. */
function placement(nodes: CardNode[], target: NodePath, position: DropPosition): { parent: NodePath; index: number } {
  if (position === "inside") {
    const node = getNode({ version: "1", type: "card", children: nodes }, target)
    return { parent: target, index: node && isContainer(node) ? node.children.length : 0 }
  }
  const index = target[target.length - 1]
  return { parent: target.slice(0, -1), index: position === "before" ? index : index + 1 }
}

/** Pointer first so drops follow the finger/cursor; closest row for keyboard dragging. */
const collision: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  return hits.length > 0 ? hits : closestCenter(args)
}

function pointerY(event: DragMoveEvent): number | null {
  const start = event.activatorEvent
  if (start instanceof MouseEvent) return start.clientY + event.delta.y
  if (typeof TouchEvent !== "undefined" && start instanceof TouchEvent && start.touches[0]) {
    return start.touches[0].clientY + event.delta.y
  }
  const rect = event.active.rect.current.translated
  return rect ? rect.top + rect.height / 2 : null
}

type DragState = { activeKey: string | null; drop: DropTarget | null }
const DragContext = createContext<DragState>({ activeKey: null, drop: null })

export function NodeTree(props: Props) {
  const { nodes, canDrop, onMove } = props
  const [activeKey, setActiveKey] = useState<string | null>(null)
  const [drop, setDrop] = useState<DropTarget | null>(null)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor),
  )

  const reset = () => {
    setActiveKey(null)
    setDrop(null)
  }

  const handleMove = (event: DragMoveEvent) => {
    const { over, active } = event
    const y = pointerY(event)
    if (!over || y === null || over.id === active.id) return setDrop(null)
    const target = pathOf(String(over.id))
    const node = getNode({ version: "1", type: "card", children: nodes }, target)
    if (!node) return setDrop(null)
    const ratio = (y - over.rect.top) / over.rect.height
    let position: DropPosition
    if (!isContainer(node)) position = ratio < 0.5 ? "before" : "after"
    // An expanded container's "after" would land visually among its children, so append inside instead.
    else if (node.children.length > 0) position = ratio < 0.35 ? "before" : "inside"
    else position = ratio < 0.3 ? "before" : ratio > 0.7 ? "after" : "inside"
    const { parent } = placement(nodes, target, position)
    const next = { path: target, position, valid: canDrop(pathOf(String(active.id)), parent) }
    setDrop((prev) =>
      prev && keyOf(prev.path) === keyOf(next.path) && prev.position === next.position && prev.valid === next.valid
        ? prev
        : next,
    )
  }

  const handleEnd = (event: DragEndEvent) => {
    if (drop?.valid) {
      const { parent, index } = placement(nodes, drop.path, drop.position)
      onMove(pathOf(String(event.active.id)), parent, index)
    }
    reset()
  }

  if (nodes.length === 0) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">The card is empty. Add a node to get started.</p>
  }

  const activeNode = activeKey ? getNode({ version: "1", type: "card", children: nodes }, pathOf(activeKey)) : undefined

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collision}
      onDragStart={(e) => setActiveKey(String(e.active.id))}
      onDragMove={handleMove}
      onDragEnd={handleEnd}
      onDragCancel={reset}
    >
      <DragContext.Provider value={{ activeKey, drop }}>
        <ul role="tree" className="py-1">
          {nodes.map((node, i) => (
            <TreeRow key={i} {...props} node={node} path={[i]} siblings={nodes.length} />
          ))}
        </ul>
      </DragContext.Provider>
      <DragOverlay dropAnimation={null}>
        {activeNode && <RowLabel node={activeNode} className="rounded-md border bg-background px-2 py-1.5 shadow-md" />}
      </DragOverlay>
    </DndContext>
  )
}

function RowLabel({ node, className }: { node: CardNode; className?: string }) {
  const Icon = NODE_ICONS[node?.type] ?? MinusIcon
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5", className)}>
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <span className="font-mono text-xs">{node?.type ?? "?"}</span>
      {node && <span className="truncate text-xs text-muted-foreground">{hint(node)}</span>}
    </span>
  )
}

const dropClass: Record<DropPosition, string> = {
  before: "shadow-[inset_0_2px_0_0_var(--color-primary)]",
  after: "shadow-[inset_0_-2px_0_0_var(--color-primary)]",
  inside: "bg-primary/10 ring-2 ring-primary ring-inset",
}

const invalidDropClass: Record<DropPosition, string> = {
  before: "shadow-[inset_0_2px_0_0_var(--color-destructive)] cursor-not-allowed",
  after: "shadow-[inset_0_-2px_0_0_var(--color-destructive)] cursor-not-allowed",
  inside: "bg-destructive/10 ring-2 ring-destructive ring-inset cursor-not-allowed",
}

function TreeRow({
  node,
  path,
  siblings,
  ...props
}: Props & { node: CardNode; path: NodePath; siblings: number }) {
  const key = keyOf(path)
  const { activeKey, drop } = useContext(DragContext)
  const { attributes, listeners, setNodeRef: setDragRef, setActivatorNodeRef } = useDraggable({ id: key })
  const { setNodeRef: setDropRef } = useDroppable({ id: key })
  const selected = samePath(props.selected, path)
  const index = path[path.length - 1]
  const container = node && isContainer(node)
  const dropHere = drop && keyOf(drop.path) === key ? drop : null
  // Rows inside the node being dragged are dimmed along with it.
  const dragging = activeKey !== null && (key === activeKey || key.startsWith(`${activeKey}.`))

  return (
    <li role="treeitem" aria-selected={selected}>
      <div
        ref={(el) => {
          setDragRef(el)
          setDropRef(el)
        }}
        className={cn(
          "group flex h-8 items-center gap-1 pr-1 text-sm hover:bg-muted",
          selected && "bg-primary/10 hover:bg-primary/15",
          dragging && "opacity-40",
          dropHere && (dropHere.valid ? dropClass : invalidDropClass)[dropHere.position],
        )}
        style={{ paddingLeft: 2 + (path.length - 1) * 14 }}
      >
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          aria-label={`Drag ${node?.type ?? "node"}`}
          className="flex h-full w-5 shrink-0 cursor-grab touch-none items-center justify-center text-muted-foreground/60 hover:text-foreground active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-3.5" />
        </button>
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center text-left"
          onClick={() => props.onSelect(selected ? null : path)}
        >
          <RowLabel node={node} />
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
