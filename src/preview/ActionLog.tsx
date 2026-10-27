import { ShieldAlertIcon, Trash2Icon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ActionEvent, BlockedSubmit } from "@/renderer/context"

export type LogEntry = { kind: "event"; event: ActionEvent } | { kind: "blocked"; blocked: BlockedSubmit }

export function ActionLog({ entries, onClear }: { entries: LogEntry[]; onClear: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div className="text-xs font-medium">
          Action log <span className="text-muted-foreground">· what the backend would receive</span>
        </div>
        <Button variant="ghost" size="xs" onClick={onClear} disabled={entries.length === 0}>
          <Trash2Icon /> Clear
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {entries.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">Click a button in the card to see its event here.</p>
        ) : (
          <ul className="divide-y">
            {entries.map((entry, i) => (
              <li key={entries.length - i} className="p-3">
                {entry.kind === "blocked" ? (
                  <>
                    <Badge variant="destructive" className="mb-2">
                      <ShieldAlertIcon /> Blocked: validation failed
                    </Badge>
                    <p className="mb-1 text-xs text-muted-foreground">
                      Nothing was sent. The client showed these errors instead:
                    </p>
                    <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(entry.blocked, null, 2)}</pre>
                  </>
                ) : (
                  <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(entry.event, null, 2)}</pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
