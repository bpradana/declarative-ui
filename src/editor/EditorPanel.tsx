import { BracesIcon, MousePointerClickIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { ParseResult } from "@/schema/card"
import { VisualEditor } from "@/visual/VisualEditor"
import type { NodePath } from "@/visual/tree"
import { ErrorList } from "./ErrorList"
import { JsonEditor, type JsonEditorHandle } from "./JsonEditor"

export type EditorMode = "json" | "visual"

type Props = {
  mode: EditorMode
  onModeChange: (mode: EditorMode) => void
  source: string
  onSourceChange: (source: string) => void
  result: ParseResult
  editorRef: React.Ref<JsonEditorHandle>
  onRevealPath: (path: (string | number)[]) => void
  selected: NodePath | null
  onSelect: (path: NodePath | null) => void
}

export function EditorPanel({ mode, onModeChange, source, onSourceChange, result, editorRef, onRevealPath, selected, onSelect }: Props) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center border-b px-2">
        <Tabs value={mode} onValueChange={(v) => onModeChange(v as EditorMode)}>
          <TabsList className="h-7">
            <TabsTrigger value="json" className="px-2 text-xs">
              <BracesIcon /> JSON
            </TabsTrigger>
            <TabsTrigger value="visual" className="px-2 text-xs">
              <MousePointerClickIcon /> Visual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {/* Both stay mounted so Monaco keeps its undo history across mode switches. */}
      <div className={cn("flex min-h-0 flex-1 flex-col", mode !== "json" && "hidden")}>
        <div className="min-h-0 flex-1">
          <JsonEditor ref={editorRef} value={source} onChange={onSourceChange} />
        </div>
        <ErrorList result={result} onSelect={onRevealPath} />
      </div>
      {mode === "visual" && (
        <div className="min-h-0 flex-1">
          <VisualEditor
            source={source}
            onSourceChange={onSourceChange}
            selected={selected}
            onSelect={onSelect}
            onShowJson={() => onModeChange("json")}
          />
        </div>
      )}
    </div>
  )
}
