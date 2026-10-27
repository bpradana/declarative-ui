import { CopyIcon, PlusIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { CardRenderer } from "@/renderer/CardRenderer"
import type { ActionEvent } from "@/renderer/context"
import type { Card, CardNode } from "@/schema/card"
import { type ComponentDoc, componentDocs, type DocExample, docId, GROUPS } from "./components"
import { getActionProps, getCardProps, getProps, type PropRow } from "./props"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  canInsert: boolean
  onInsert: (node: CardNode) => void
  onAction: (event: ActionEvent) => void
}

const GUIDES = [
  { key: "card", title: "Card root" },
  { key: "actions-events", title: "Actions & events" },
  { key: "form-values", title: "Form values" },
] as const

const exampleEvent: ActionEvent = {
  cardId: "survey-csat",
  actionId: "csat_submit",
  type: "submit",
  payload: { surveyId: "csat" },
  formValues: { rating: "5", comment: "Fast and friendly", contactMe: true },
  timestamp: "2026-10-23T07:20:00.000Z",
}

const minimalCard: Card = {
  version: "1",
  type: "card",
  id: "hello",
  children: [{ type: "text", content: "Hello from the backend 👋" }],
}

function matches(doc: ComponentDoc, query: string) {
  const haystack = [doc.type, doc.group, doc.summary, ...doc.examples.map((e) => e.title), ...(doc.notes ?? [])].join(" ").toLowerCase()
  return haystack.includes(query)
}

function scrollTo(key: string) {
  document.getElementById(docId(key))?.scrollIntoView({ behavior: "smooth", block: "start" })
}

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  } catch {
    toast.error("Couldn't access the clipboard")
  }
}

/** Renders `code`/inline backticks from doc strings. */
function Rich({ text }: { text: string }) {
  return (
    <>
      {text.split(/(`[^`]+`)/).map((part, i) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code key={i} className="rounded bg-muted px-1 py-0.5 font-mono text-[0.8em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        ),
      )}
    </>
  )
}

function PropsTable({ rows }: { rows: PropRow[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-left text-xs">
        <thead className="bg-muted/50 text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Field</th>
            <th className="px-3 py-2 font-medium">Type</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row) => (
            <tr key={row.name} className="align-top">
              <td className="px-3 py-2 font-mono whitespace-nowrap" style={{ paddingLeft: 12 + row.depth * 12 }}>
                {row.name}
                {row.required && (
                  <span className="ml-0.5 text-destructive" title="Required">
                    *
                  </span>
                )}
              </td>
              <td className="px-3 py-2 font-mono text-muted-foreground">{row.type}</td>
              <td className="px-3 py-2">{row.description && <Rich text={row.description} />}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CodeBlock({ code, actions }: { code: string; actions?: React.ReactNode }) {
  return (
    <div className="relative rounded-lg border bg-muted/40">
      <div className="absolute top-1.5 right-1.5 flex gap-1">
        <Button variant="ghost" size="xs" onClick={() => copy(code)}>
          <CopyIcon /> Copy
        </Button>
        {actions}
      </div>
      <pre className="overflow-x-auto p-3 pr-36 font-mono text-xs leading-relaxed">{code}</pre>
    </div>
  )
}

function Section({
  id,
  title,
  badge,
  children,
}: {
  id: string
  title: React.ReactNode
  badge?: string
  children: React.ReactNode
}) {
  return (
    <section id={docId(id)} className="scroll-mt-4 space-y-3 border-b pb-8 last:border-b-0">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold">{title}</h3>
        {badge && <Badge variant="secondary">{badge}</Badge>}
      </div>
      {children}
    </section>
  )
}

function Preview({ card, onAction }: { card: Card; onAction: (e: ActionEvent) => void }) {
  return (
    <div className="rounded-lg border bg-muted/40 p-4">
      <div className="mx-auto max-w-sm">
        <CardRenderer card={card} onAction={onAction} />
      </div>
    </div>
  )
}

type ExampleProps = {
  example: DocExample
  canInsert: boolean
  onInsert: (node: CardNode) => void
  onAction: (e: ActionEvent) => void
}

function Example({ example, canInsert, onInsert, onAction }: ExampleProps) {
  const card = useMemo<Card>(() => ({ version: "1", type: "card", children: [example.node] }), [example])

  const insertButton = (
    <Button variant="ghost" size="xs" disabled={!canInsert} onClick={() => onInsert(example.node)}>
      <PlusIcon /> Insert
    </Button>
  )

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted-foreground">{example.title}</h4>
      <Preview card={card} onAction={onAction} />
      <CodeBlock
        code={JSON.stringify(example.node, null, 2)}
        actions={
          canInsert ? (
            insertButton
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>{insertButton}</span>
              </TooltipTrigger>
              <TooltipContent>Fix the errors in the editor first</TooltipContent>
            </Tooltip>
          )
        }
      />
    </div>
  )
}

function ComponentSection({ doc, ...rest }: { doc: ComponentDoc } & Omit<ExampleProps, "example">) {
  const rows = useMemo(() => getProps(doc.type), [doc.type])

  return (
    <Section id={doc.type} title={<span className="font-mono">{doc.type}</span>} badge={doc.group}>
      <p className="text-muted-foreground">
        <Rich text={doc.summary} />
      </p>
      {doc.examples.map((example) => (
        <Example key={example.title} example={example} {...rest} />
      ))}
      <PropsTable rows={rows} />
      {doc.notes && (
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          {doc.notes.map((note, i) => (
            <li key={i}>
              <Rich text={note} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  )
}

const cardRows = getCardProps()
const actionRows = getActionProps()

function Guides({ onAction }: { onAction: (e: ActionEvent) => void }) {
  return (
    <>
      <Section id="card" title="Card root" badge="Guide">
        <p className="text-muted-foreground">
          <Rich text="Every payload is one card object. `children` are rendered top to bottom; any `actions` nodes at the very end become the footer." />
        </p>
        <Preview card={minimalCard} onAction={onAction} />
        <CodeBlock code={JSON.stringify(minimalCard, null, 2)} />
        <PropsTable rows={cardRows} />
      </Section>

      <Section id="actions-events" title="Actions & events" badge="Guide">
        <p className="text-muted-foreground">
          <Rich text="Each `button` has an `action`. When clicked, the chat client sends an event to the backend. The Action log under the preview shows exactly this event." />
        </p>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>
            <Rich text="`submit` sends `payload` plus `formValues` from every named field in the card." />
          </li>
          <li>
            <Rich text="`postback` sends `payload` only. Use it for buttons that don't need input." />
          </li>
          <li>
            <Rich text="`openUrl` opens `url` in a new tab. The event is still sent, so you can track clicks." />
          </li>
        </ul>
        <PropsTable rows={actionRows} />
        <p className="text-muted-foreground">Event sent to the backend:</p>
        <CodeBlock code={JSON.stringify(exampleEvent, null, 2)} />
      </Section>

      <Section id="form-values" title="Form values" badge="Guide">
        <p className="text-muted-foreground">
          <Rich text="`input`, `textarea`, `select` and `checkbox` each have a `name`. On `submit`, their current values are collected into `formValues`, keyed by `name`, including fields nested in a `stack`." />
        </p>
        <ul className="ml-4 list-disc space-y-1 text-muted-foreground">
          <li>
            <Rich text={'Text fields and selects send strings (`""` when empty). Checkboxes send `true`/`false`.'} />
          </li>
          <li>
            <Rich text="Names must be unique within a card, or later fields overwrite earlier ones." />
          </li>
          <li>
            <Rich text="`postback` and `openUrl` never include form values." />
          </li>
        </ul>
      </Section>
    </>
  )
}

export function DocsSheet({ open, onOpenChange, canInsert, onInsert, onAction }: Props) {
  const [query, setQuery] = useState("")
  const q = query.trim().toLowerCase()
  const docs = q ? componentDocs.filter((d) => matches(d, q)) : componentDocs
  const showGuides = !q || GUIDES.some((g) => g.title.toLowerCase().includes(q))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:w-3/4 data-[side=right]:sm:max-w-3xl">
        <SheetHeader className="border-b">
          <SheetTitle>Component docs</SheetTitle>
          <SheetDescription>Every building block a card supports, with live examples.</SheetDescription>
          <div className="relative mt-2">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search components…"
              className="pl-8"
            />
          </div>
          {/* The side nav doesn't fit on phones, so offer a scrollable row of jump links instead. */}
          <div className="-mx-4 flex gap-1 overflow-x-auto px-4 pt-1 sm:hidden">
            {[...(showGuides ? GUIDES.map((g) => ({ key: g.key, label: g.title })) : []), ...docs.map((d) => ({ key: d.type, label: d.type }))].map(
              (item) => (
                <Button key={item.key} variant="outline" size="xs" className="shrink-0" onClick={() => scrollTo(item.key)}>
                  {item.label}
                </Button>
              ),
            )}
          </div>
        </SheetHeader>

        <div className="flex min-h-0 flex-1">
          <nav className="hidden w-44 shrink-0 overflow-y-auto border-r p-3 text-sm sm:block">
            {showGuides && (
              <NavGroup title="Getting started">
                {GUIDES.map((g) => (
                  <NavLink key={g.key} onClick={() => scrollTo(g.key)}>
                    {g.title}
                  </NavLink>
                ))}
              </NavGroup>
            )}
            {GROUPS.map((group) => {
              const items = docs.filter((d) => d.group === group)
              if (items.length === 0) return null
              return (
                <NavGroup key={group} title={group}>
                  {items.map((d) => (
                    <NavLink key={d.type} mono onClick={() => scrollTo(d.type)}>
                      {d.type}
                    </NavLink>
                  ))}
                </NavGroup>
              )
            })}
          </nav>

          <div className="min-w-0 flex-1 space-y-8 overflow-y-auto p-4 sm:p-6">
            {showGuides && <Guides onAction={onAction} />}
            {docs.map((doc) => (
              <ComponentSection key={doc.type} doc={doc} canInsert={canInsert} onInsert={onInsert} onAction={onAction} />
            ))}
            {!showGuides && docs.length === 0 && (
              <p className="text-muted-foreground">No components match “{query}”.</p>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function NavGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="mb-1 px-2 text-xs font-medium text-muted-foreground">{title}</div>
      <div className="flex flex-col">{children}</div>
    </div>
  )
}

function NavLink({ children, mono, onClick }: { children: React.ReactNode; mono?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("rounded-md px-2 py-1 text-left hover:bg-muted", mono && "font-mono text-xs")}
    >
      {children}
    </button>
  )
}
