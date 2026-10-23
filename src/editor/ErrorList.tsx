import { CircleCheckIcon, CircleXIcon } from "lucide-react"
import { formatPath, type ParseResult } from "@/schema/card"

export function ErrorList({
  result,
  onSelect,
}: {
  result: ParseResult
  onSelect: (path: (string | number)[]) => void
}) {
  if (result.ok) {
    return (
      <div className="flex items-center gap-2 border-t px-3 py-2 text-xs text-muted-foreground">
        <CircleCheckIcon className="size-3.5 text-emerald-600" />
        Valid card
      </div>
    )
  }
  return (
    <div className="border-t">
      <div className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-destructive">
        <CircleXIcon className="size-3.5" />
        {result.kind === "syntax" ? "Invalid JSON" : `${result.issues.length} schema error${result.issues.length === 1 ? "" : "s"}`}
      </div>
      <div className="max-h-40 overflow-auto">
        <ul className="pb-1">
          {result.issues.map((issue, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => onSelect(issue.path)}
                className="flex w-full gap-3 px-3 py-1 text-left font-mono text-xs hover:bg-muted"
              >
                <span className="shrink-0 text-muted-foreground">{formatPath(issue.path)}</span>
                <span className="text-foreground">{issue.message}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
