import { CopyIcon, DownloadIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { monaco } from "@/editor/monaco"
import { downloadText } from "@/lib/download"
import type { Card } from "@/schema/card"
import { cardJsonSchemaSource } from "@/schema/json-schema"
import { generateGo } from "./go"
import { generateGoHandler, generateTsHandler } from "./handler"
import { generateTypeScript } from "./typescript"

type Tab = "typescript" | "go" | "handler" | "schema"
type Lang = "go" | "ts"

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  } catch {
    toast.error("Couldn't access the clipboard")
  }
}

type Language = "typescript" | "go" | "json"

/** Highlights with Monaco's tokenizer (already bundled for the editor); shows plain text until it's ready. */
function useColorized(code: string, language: Language): string | null {
  const [result, setResult] = useState<{ code: string; language: Language; html: string } | null>(null)
  useEffect(() => {
    let cancelled = false
    monaco.editor
      .colorize(code, language, { tabSize: 4 })
      .then((html) => !cancelled && setResult({ code, language, html }))
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [code, language])
  return result && result.code === code && result.language === language ? result.html : null
}

function CodePanel({
  filename,
  code,
  language,
  note,
}: {
  filename: string
  code: string
  language: Language
  note?: React.ReactNode
}) {
  const html = useColorized(code, language)
  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-auto font-mono text-xs text-muted-foreground">{filename}</span>
        <Button variant="outline" size="xs" onClick={() => copy(code)}>
          <CopyIcon /> Copy
        </Button>
        <Button variant="outline" size="xs" onClick={() => downloadText(filename, code)}>
          <DownloadIcon /> Download
        </Button>
      </div>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
      {html ? (
        // colorize() HTML-escapes the code and only adds token spans.
        <pre
          className="max-h-[55dvh] overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre className="max-h-[55dvh] overflow-auto rounded-lg border bg-muted/40 p-3 font-mono text-xs leading-relaxed">
          {code}
        </pre>
      )}
    </div>
  )
}

export function ExportDialog({
  open,
  onOpenChange,
  card,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The current card, used for the handler. Null while the JSON is invalid. */
  card: Card | null
}) {
  const [tab, setTab] = useState<Tab>("typescript")
  const [lang, setLang] = useState<Lang>("go")
  // The type exports only depend on the schema, so they're generated once.
  const typescript = useMemo(() => (open ? generateTypeScript() : ""), [open])
  const go = useMemo(() => (open ? generateGo() : ""), [open])
  const handler = useMemo(
    () => (open && card ? (lang === "go" ? generateGoHandler(card) : generateTsHandler(card)) : ""),
    [open, card, lang],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90dvh] flex-col sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Export</DialogTitle>
          <DialogDescription>Types for the card format and a starter backend for this card.</DialogDescription>
        </DialogHeader>
        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="min-h-0">
          <TabsList className="w-full overflow-x-auto sm:w-fit">
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="go">Go</TabsTrigger>
            <TabsTrigger value="handler">Handler</TabsTrigger>
            <TabsTrigger value="schema">JSON Schema</TabsTrigger>
          </TabsList>
          <TabsContent value="typescript" className="min-h-0">
            <CodePanel filename="card.ts" language="typescript" code={typescript} note="Every node type, the Card, and the ActionEvent your backend receives." />
          </TabsContent>
          <TabsContent value="go" className="min-h-0">
            <CodePanel
              filename="card.go"
              language="go"
              code={go}
              note="Structs with JSON tags. Node decodes into the concrete *Node struct based on its type."
            />
          </TabsContent>
          <TabsContent value="handler" className="flex min-h-0 flex-col gap-2">
            <ToggleGroup
              type="single"
              size="sm"
              variant="outline"
              value={lang}
              onValueChange={(v) => v && setLang(v as Lang)}
              className="self-start"
            >
              <ToggleGroupItem value="go">Go (net/http)</ToggleGroupItem>
              <ToggleGroupItem value="ts">TypeScript (Express)</ToggleGroupItem>
            </ToggleGroup>
            {card ? (
              <CodePanel
                filename={lang === "go" ? "handler.go" : "handler.ts"}
                language={lang === "go" ? "go" : "typescript"}
                code={handler}
                note="Switches on every action id in the current card and re-checks required fields on submit."
              />
            ) : (
              <p className="text-sm text-muted-foreground">Fix the errors in the card to generate a handler for it.</p>
            )}
          </TabsContent>
          <TabsContent value="schema" className="min-h-0">
            <CodePanel
              filename="card.schema.json"
              language="json"
              code={cardJsonSchemaSource}
              note="Validate payloads on the backend with any JSON Schema (draft 2020-12) library."
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
