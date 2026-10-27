import {
  BookOpenIcon,
  BracesIcon,
  ChevronDownIcon,
  EllipsisIcon,
  EyeIcon,
  FileCodeIcon,
  FolderIcon,
  LayoutTemplateIcon,
  Link2Icon,
  Redo2Icon,
  ScrollTextIcon,
  SquarePenIcon,
  TextQuoteIcon,
  TriangleAlertIcon,
  Undo2Icon,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
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
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DocsSheet } from "@/docs/DocsSheet"
import { insertNode } from "@/docs/insertNode"
import { type EditorMode, EditorPanel } from "@/editor/EditorPanel"
import type { JsonEditorHandle } from "@/editor/JsonEditor"
import { ExportDialog } from "@/export/ExportDialog"
import { type SavedCard, useSavedCards } from "@/lib/saved-cards"
import { decodeCardHash, shareUrl } from "@/lib/share"
import { useHistory } from "@/lib/use-history"
import { useMediaQuery } from "@/lib/use-media-query"
import { ActionLog, type LogEntry } from "@/preview/ActionLog"
import { ChatPreview } from "@/preview/ChatPreview"
import { CardRenderer } from "@/renderer/CardRenderer"
import type { ActionEvent, BlockedSubmit } from "@/renderer/context"
import { type Card, type CardNode, parseCard } from "@/schema/card"
import { saveCurrent } from "@/saved/save-current"
import { SavedCardsSheet } from "@/saved/SavedCardsSheet"
import { TEMPLATE_CATEGORIES, templates, templateSource } from "@/templates"
import { getNode, looseCard, type NodePath } from "@/visual/tree"

type MobileTab = "editor" | "preview" | "log"

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
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const history = useHistory(initialSource)
  const { value: source, set: setSource, undo, redo } = history
  const [log, setLog] = useState<LogEntry[]>([])
  const [lastValid, setLastValid] = useState<Card | null>(null)
  const [docsOpen, setDocsOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>("json")
  const [inspect, setInspect] = useState(false)
  const [selectedPath, setSelectedPath] = useState<NodePath | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>("preview")
  const [savedOpen, setSavedOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [savedId, setSavedId] = useState<string | null>(null)

  const savedCards = useSavedCards()
  // Forget the open saved card if it was deleted (here or in another tab).
  const currentSaved = savedCards.find((c) => c.id === savedId) ?? null
  const unsaved = currentSaved !== null && currentSaved.source !== source

  const debouncedSource = useDebounced(source, 150)
  const result = useMemo(() => parseCard(debouncedSource), [debouncedSource])

  // Remember the last card that parsed so the preview survives typos mid-edit.
  if (result.ok && result.card !== lastValid) setLastValid(result.card)

  const card = result.ok ? result.card : lastValid

  // Drop the selection once the node it points at no longer exists (e.g. deleted in the JSON).
  const selected = useMemo(() => {
    if (!selectedPath) return null
    const loose = looseCard(source)
    return loose && getNode(loose, selectedPath) ? selectedPath : null
  }, [source, selectedPath])

  const handleAction = useCallback(
    (event: ActionEvent) => {
      setLog((prev) => [{ kind: "event", event }, ...prev])
      if (!isDesktop && mobileTab !== "log") {
        toast(`Action sent: ${event.actionId}`, { action: { label: "View", onClick: () => setMobileTab("log") } })
      }
    },
    [isDesktop, mobileTab],
  )

  const handleBlocked = useCallback(
    (blocked: BlockedSubmit) => {
      setLog((prev) => [{ kind: "blocked", blocked }, ...prev])
      if (!isDesktop && mobileTab !== "log") {
        toast.error(`Submit blocked: ${Object.keys(blocked.errors).length} field(s) invalid`, {
          action: { label: "View", onClick: () => setMobileTab("log") },
        })
      }
    },
    [isDesktop, mobileTab],
  )

  // Checked against the live source (not the debounced one) so Insert never acts on stale text.
  const canInsert = useMemo(() => docsOpen && parseCard(source).ok, [docsOpen, source])

  const handleInsert = (node: CardNode) => {
    const next = insertNode(source, node)
    if (!next) return
    setSource(next)
    setDocsOpen(false)
    toast.success(`Added ${node.type} to the card`)
  }

  const changeEditorMode = (mode: EditorMode) => {
    setEditorMode(mode)
    setInspect(mode === "visual")
  }

  const handlePreviewSelect = (path: NodePath) => {
    setSelectedPath(path)
    setEditorMode("visual")
    if (!isDesktop) setMobileTab("editor")
  }

  const revealPath = (path: (string | number)[]) => {
    setEditorMode("json")
    if (!isDesktop) setMobileTab("editor")
    // Wait a frame so the editor is visible before Monaco scrolls to the error.
    requestAnimationFrame(() => editorRef.current?.revealPath(path))
  }

  const saveShortcut = () => {
    if (currentSaved) saveCurrent(source, currentSaved.name, currentSaved.id)
    else setSavedOpen(true)
  }

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const mod = e.metaKey || e.ctrlKey
      const key = e.key.toLowerCase()
      if (mod && !e.altKey && key === "s") {
        e.preventDefault()
        saveShortcut()
        return
      }
      // Monaco binds undo/redo itself; everywhere else (including form inputs) uses the same shared history.
      if (mod && !e.altKey && (key === "z" || key === "y") && !target?.closest(".monaco-editor")) {
        e.preventDefault()
        if (key === "y" || e.shiftKey) redo()
        else undo()
        return
      }
      if (e.key !== "?" || mod || e.altKey) return
      // Monaco types into a hidden textarea, so this also skips the editor.
      if (target?.closest("input, textarea, select, [contenteditable=true]")) return
      e.preventDefault()
      setDocsOpen(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  })

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

  const loadSource = (next: string, savedCardId: string | null) => {
    // Drop a stale share link so a reload does not bring the old card back.
    window.history.replaceState(null, "", window.location.pathname + window.location.search)
    setSource(next)
    setSelectedPath(null)
    setSavedId(savedCardId)
  }

  const openSaved = (saved: SavedCard) => {
    loadSource(saved.source, saved.id)
    toast.success(`Opened “${saved.name}”`)
  }

  const editorPane = (
    <EditorPanel
      mode={editorMode}
      onModeChange={changeEditorMode}
      source={source}
      onSourceChange={setSource}
      onUndo={undo}
      onRedo={redo}
      result={result}
      editorRef={editorRef}
      onRevealPath={revealPath}
      selected={selected}
      onSelect={setSelectedPath}
    />
  )

  const previewPane = (
    <ChatPreview
      inspect={inspect}
      onInspectChange={setInspect}
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
      {card && (
        <CardRenderer
          card={card}
          onAction={handleAction}
          onBlocked={handleBlocked}
          inspect={inspect ? { selected, onSelect: handlePreviewSelect } : undefined}
        />
      )}
    </ChatPreview>
  )

  const logPane = <ActionLog entries={log} onClear={() => setLog([])} />

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex h-12 shrink-0 items-center gap-1.5 border-b px-2 sm:gap-2 sm:px-3">
        <div className="mr-auto flex min-w-0 items-center gap-2">
          <BracesIcon className="size-4 shrink-0" />
          <h1 className="truncate text-sm font-semibold max-[380px]:sr-only">Card Playground</h1>
          {currentSaved && (
            <button
              type="button"
              onClick={() => setSavedOpen(true)}
              className="hidden min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground hover:text-foreground lg:flex"
              title={unsaved ? "Unsaved changes. Press ⌘S / Ctrl+S to save." : "Saved"}
            >
              <span aria-hidden>/</span>
              <span className="truncate">{currentSaved.name}</span>
              {unsaved && <span className="size-1.5 shrink-0 rounded-full bg-amber-500" aria-label="Unsaved changes" />}
            </button>
          )}
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon-sm" onClick={undo} disabled={!history.canUndo} aria-label="Undo" title="Undo (⌘Z)">
            <Undo2Icon />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={redo} disabled={!history.canRedo} aria-label="Redo" title="Redo (⇧⌘Z)">
            <Redo2Icon />
          </Button>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" aria-label="Templates">
              <LayoutTemplateIcon /> <span className="hidden sm:inline">Templates</span> <ChevronDownIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-[70dvh]">
            {TEMPLATE_CATEGORIES.map((category, i) => (
              <DropdownMenuGroup key={category}>
                {i > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel>{category}</DropdownMenuLabel>
                {templates
                  .filter((t) => t.category === category)
                  .map((t) => (
                    <DropdownMenuItem key={t.id} onSelect={() => loadSource(templateSource(t), null)}>
                      {t.name}
                    </DropdownMenuItem>
                  ))}
              </DropdownMenuGroup>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          size="sm"
          className="hidden md:inline-flex"
          onClick={() => setSavedOpen(true)}
          title="My cards (⌘S to save)"
          aria-label="My cards"
        >
          <FolderIcon /> <span className="hidden lg:inline">My cards</span>
        </Button>
        <Button variant="outline" size="sm" onClick={() => setDocsOpen(true)} title="Component docs (?)" aria-label="Docs">
          <BookOpenIcon /> <span className="hidden lg:inline">Docs</span>
        </Button>
        <Button variant="outline" size="sm" className="hidden md:inline-flex" onClick={() => editorRef.current?.format()}>
          Format
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="hidden md:inline-flex"
          onClick={() => setExportOpen(true)}
          aria-label="Export"
        >
          <FileCodeIcon /> <span className="hidden lg:inline">Export</span>
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon-sm" className="md:hidden" aria-label="More">
              <EllipsisIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() => {
                changeEditorMode("json")
                setMobileTab("editor")
                requestAnimationFrame(() => editorRef.current?.format())
              }}
            >
              <TextQuoteIcon /> Format JSON
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSavedOpen(true)}>
              <FolderIcon /> My cards
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setExportOpen(true)}>
              <FileCodeIcon /> Export code
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="sm" onClick={handleShare} aria-label="Share">
          <Link2Icon /> <span className="hidden sm:inline">Share</span>
        </Button>
      </header>

      {isDesktop ? (
        <ResizablePanelGroup orientation="horizontal" className="min-h-0 flex-1">
          <ResizablePanel defaultSize="50%" minSize="25%">
            {editorPane}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize="50%" minSize="25%">
            <ResizablePanelGroup orientation="vertical">
              <ResizablePanel defaultSize="70%" minSize="20%">
                {previewPane}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize="30%" minSize="10%">
                {logPane}
              </ResizablePanel>
            </ResizablePanelGroup>
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        <Tabs
          value={mobileTab}
          onValueChange={(v) => setMobileTab(v as MobileTab)}
          className="min-h-0 flex-1 gap-0"
        >
          {/* Panes stay mounted so the editor and form state survive tab switches. */}
          <TabsContent value="editor" forceMount className="min-h-0 data-[state=inactive]:hidden">
            {editorPane}
          </TabsContent>
          <TabsContent value="preview" forceMount className="min-h-0 data-[state=inactive]:hidden">
            {previewPane}
          </TabsContent>
          <TabsContent value="log" forceMount className="min-h-0 data-[state=inactive]:hidden">
            {logPane}
          </TabsContent>
          <TabsList className="h-12 w-full shrink-0 rounded-none border-t pb-[env(safe-area-inset-bottom)]">
            <TabsTrigger value="editor">
              <SquarePenIcon /> Editor
            </TabsTrigger>
            <TabsTrigger value="preview">
              <EyeIcon /> Preview
            </TabsTrigger>
            <TabsTrigger value="log">
              <ScrollTextIcon /> Log
              {log.length > 0 && (
                <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px]">
                  {log.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
      <SavedCardsSheet
        open={savedOpen}
        onOpenChange={setSavedOpen}
        source={source}
        currentId={currentSaved?.id ?? null}
        onCurrentChange={setSavedId}
        onOpenCard={openSaved}
      />
      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} card={result.ok ? result.card : null} />
      <DocsSheet
        open={docsOpen}
        onOpenChange={setDocsOpen}
        canInsert={canInsert}
        onInsert={handleInsert}
        onAction={handleAction}
      />
    </div>
  )
}
