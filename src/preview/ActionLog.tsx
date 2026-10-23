import { Trash2Icon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { ActionEvent } from "@/renderer/context"

export function ActionLog({ events, onClear }: { events: ActionEvent[]; onClear: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div className="text-xs font-medium">
          Action log <span className="text-muted-foreground">· what the backend would receive</span>
        </div>
        <Button variant="ghost" size="xs" onClick={onClear} disabled={events.length === 0}>
          <Trash2Icon /> Clear
        </Button>
      </div>
      <ScrollArea className="min-h-0 flex-1">
        {events.length === 0 ? (
          <p className="p-3 text-xs text-muted-foreground">Click a button in the card to see its event here.</p>
        ) : (
          <ul className="divide-y">
            {events.map((event, i) => (
              <li key={events.length - i} className="p-3">
                <pre className="font-mono text-xs whitespace-pre-wrap">{JSON.stringify(event, null, 2)}</pre>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>
  )
}
