import { BracesIcon, ChevronDownIcon, DownloadIcon, LayoutTemplateIcon, Link2Icon, TriangleAlertIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { ErrorList } from "@/editor/ErrorList"
import { JsonEditor, type JsonEditorHandle } from "@/editor/JsonEditor"
import { decodeCardHash, shareUrl } from "@/lib/share"
import { ActionLog } from "@/preview/ActionLog"
import { ChatPreview } from "@/preview/ChatPreview"
import { CardRenderer } from "@/renderer/CardRenderer"
import type { ActionEvent } from "@/renderer/context"
import { type Card, parseCard } from "@/schema/card"
import { downloadJsonSchema } from "@/schema/json-schema"
import { templates, templateSource } from "@/templates"

function initialSource() {
  return decodeCardHash(window.location.hash) ?? templateSource(templates[0])
}

function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return debounced
}

export default function App() {
  const editorRef = useRef<JsonEditorHandle>(null)
  const [source, setSource] = useState(initialSource)
  const [events, setEvents] = useState<ActionEvent[]>([])
  const [lastValid, setLastValid] = useState<Card | null>(null)

  const debouncedSource = useDebounced(source, 150)
  const result = useMemo(() => parseCard(debouncedSource), [debouncedSource])

  // Remember the last card that parsed so the preview survives typos mid-edit.
  if (result.ok && result.card !== lastValid) setLastValid(result.card)

  const card = result.ok ? result.card : lastValid

  const handleAction = useCallback((event: ActionEvent) => {
    setEvents((prev) => [event, ...prev])
  }, [])

  const handleShare = async () => {
    const url = shareUrl(source)
    window.history.replaceState(null, "", url)
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Share link copied to clipboard")
    } catch {
      toast.info("Share link is in the address bar")
    }
  }

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <BracesIcon className="size-4" />
        <h1 className="mr-auto text-sm font-semibold">Card Playground</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <LayoutTemplateIcon /> Templates <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {templates.map((t) => (
              <DropdownMenuItem key={t.id} onSelect={() => {
                  // Drop a stale share link so a reload does not bring the old card back.
                  window.history.replaceState(null, "", window.location.pathname + window.location.search)
                  setSource(templateSource(t))
                }}>
                {t.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="outline" size="sm" onClick={() => editorRef.current?.format()}>
          Format
        </Button>
        <Button variant="outline" size="sm" onClick={downloadJsonSchema}>
          <DownloadIcon /> JSON Schema
        </Button>
        <Button size="sm" onClick={handleShare}>
          <Link2Icon /> Share
        </Button>
      </header>

      <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
        <ResizablePanel defaultSize="50%" minSize="25%">
          <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1">
              <JsonEditor ref={editorRef} value={source} onChange={setSource} />
            </div>
            <ErrorList result={result} onSelect={(path) => editorRef.current?.revealPath(path)} />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize="50%" minSize="25%">
          <ResizablePanelGroup orientation="vertical">
            <ResizablePanel defaultSize="70%" minSize="20%">
              <ChatPreview
                banner={
                  !result.ok && (
                    <Alert variant="destructive">
                      <TriangleAlertIcon />
                      <AlertTitle>{result.kind === "syntax" ? "Invalid JSON" : "Card doesn't match the schema"}</AlertTitle>
                      <AlertDescription>
                        {lastValid ? "Showing the last valid version." : "Fix the errors to see a preview."}
                      </AlertDescription>
                    </Alert>
                  )
                }
              >
                {card && <CardRenderer card={card} onAction={handleAction} />}
              </ChatPreview>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="30%" minSize="10%">
              <ActionLog events={events} onClear={() => setEvents([])} />
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
