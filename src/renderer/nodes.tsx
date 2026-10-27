import { useId } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import type { CardNode } from "@/schema/card"
import { type NodePath, samePath } from "@/visual/tree"
import { useRenderer } from "./context"

type NodeOf<T extends CardNode["type"]> = Extract<CardNode, { type: T }>

function HeaderView({ node }: { node: NodeOf<"header"> }) {
  return (
    <div className="flex items-start gap-3">
      {node.avatar && (
        <Avatar className="size-9">
          {node.avatar.src && <AvatarImage src={node.avatar.src} alt="" />}
          <AvatarFallback>{node.avatar.fallback}</AvatarFallback>
        </Avatar>
      )}
      <div className="min-w-0 flex-1">
        <div className="font-heading text-base leading-snug font-medium">{node.title}</div>
        {node.subtitle && <div className="text-sm text-muted-foreground">{node.subtitle}</div>}
      </div>
      {node.badge && <Badge variant={node.badge.variant}>{node.badge.label}</Badge>}
    </div>
  )
}

const textClass = {
  body: "text-sm",
  muted: "text-sm text-muted-foreground",
  title: "font-heading text-base font-medium",
  caption: "text-xs text-muted-foreground",
} as const

const aspectClass = { "16:9": "aspect-video", "1:1": "aspect-square", "4:3": "aspect-[4/3]" } as const

const gapClass = { sm: "gap-1", md: "gap-3", lg: "gap-5" } as const

const alignClass = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const

function Field({ id, label, children }: { id: string; label?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <Label htmlFor={id}>{label}</Label>}
      {children}
    </div>
  )
}

function InputView({ node }: { node: NodeOf<"input"> }) {
  const id = useId()
  const { values, setValue } = useRenderer()
  return (
    <Field id={id} label={node.label}>
      <Input
        id={id}
        type={node.inputType ?? "text"}
        placeholder={node.placeholder}
        value={String(values[node.name] ?? "")}
        onChange={(e) => setValue(node.name, e.target.value)}
      />
    </Field>
  )
}

function TextareaView({ node }: { node: NodeOf<"textarea"> }) {
  const id = useId()
  const { values, setValue } = useRenderer()
  return (
    <Field id={id} label={node.label}>
      <Textarea
        id={id}
        placeholder={node.placeholder}
        value={String(values[node.name] ?? "")}
        onChange={(e) => setValue(node.name, e.target.value)}
      />
    </Field>
  )
}

function SelectView({ node }: { node: NodeOf<"select"> }) {
  const id = useId()
  const { values, setValue } = useRenderer()
  return (
    <Field id={id} label={node.label}>
      <Select value={String(values[node.name] ?? "")} onValueChange={(v) => setValue(node.name, v)}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={node.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {node.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function CheckboxView({ node }: { node: NodeOf<"checkbox"> }) {
  const id = useId()
  const { values, setValue } = useRenderer()
  return (
    <div className="flex items-center gap-2">
      <Checkbox id={id} checked={values[node.name] === true} onCheckedChange={(c) => setValue(node.name, c === true)} />
      <Label htmlFor={id} className="font-normal">
        {node.label}
      </Label>
    </div>
  )
}

function ButtonView({ node }: { node: NodeOf<"button"> }) {
  const { trigger } = useRenderer()
  return (
    <Button variant={node.variant} onClick={() => trigger(node.action)}>
      {node.label}
    </Button>
  )
}

export function NodeView({ node, path }: { node: CardNode; path: NodePath }) {
  const { inspect } = useRenderer()
  if (!inspect) return <NodeContent node={node} path={path} />
  // Clicks are intercepted by CardRenderer, which reads `data-path` to select the innermost node.
  return (
    <div
      data-path={path.join(".")}
      className={cn(
        "cursor-pointer rounded-sm outline-offset-2 outline-primary/60",
        "[&:hover:not(:has([data-path]:hover))]:outline [&:hover:not(:has([data-path]:hover))]:outline-dashed",
        samePath(inspect.selected, path) && "outline-2 outline-primary outline-solid",
      )}
    >
      <NodeContent node={node} path={path} />
    </div>
  )
}

function NodeContent({ node, path }: { node: CardNode; path: NodePath }) {
  switch (node.type) {
    case "header":
      return <HeaderView node={node} />
    case "text":
      return <p className={cn("whitespace-pre-wrap", textClass[node.variant ?? "body"])}>{node.content}</p>
    case "image":
      return (
        <img
          src={node.src}
          alt={node.alt}
          className={cn("w-full rounded-lg bg-muted object-cover", node.aspectRatio && aspectClass[node.aspectRatio])}
        />
      )
    case "divider":
      return <Separator />
    case "badge":
      return <Badge variant={node.variant}>{node.label}</Badge>
    case "keyValue":
      return (
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
          {node.items.map((item, i) => (
            <div key={i} className="contents">
              <dt className="text-muted-foreground">{item.label}</dt>
              <dd className="text-right font-medium">{item.value}</dd>
            </div>
          ))}
        </dl>
      )
    case "list": {
      const Tag = node.ordered ? "ol" : "ul"
      return (
        <Tag className={cn("ml-5 space-y-1 text-sm", node.ordered ? "list-decimal" : "list-disc")}>
          {node.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </Tag>
      )
    }
    case "stack":
      return (
        <div
          className={cn(
            "flex",
            node.direction === "horizontal" ? "flex-row flex-wrap items-center" : "flex-col",
            gapClass[node.gap ?? "md"],
            node.direction === "horizontal" && alignClass[node.align ?? "start"],
            node.direction !== "horizontal" && node.align === "center" && "items-center",
            node.direction !== "horizontal" && node.align === "end" && "items-end",
          )}
        >
          {node.children.map((child, i) => (
            <NodeView key={i} node={child} path={[...path, i]} />
          ))}
        </div>
      )
    case "button":
      return <ButtonView node={node} />
    case "actions":
      return (
        <div className="flex flex-wrap justify-end gap-2">
          {node.children.map((child, i) => (
            <NodeView key={i} node={child} path={[...path, i]} />
          ))}
        </div>
      )
    case "input":
      return <InputView node={node} />
    case "textarea":
      return <TextareaView node={node} />
    case "select":
      return <SelectView node={node} />
    case "checkbox":
      return <CheckboxView node={node} />
  }
}
