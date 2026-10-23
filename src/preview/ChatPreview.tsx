import { MonitorIcon, MoonIcon, SmartphoneIcon, SunIcon } from "lucide-react"
import { useState } from "react"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { cn } from "@/lib/utils"

type Theme = "light" | "dark"
type Width = "mobile" | "desktop"

function Bubble({ from, children }: { from: "me" | "bot"; children: React.ReactNode }) {
  return (
    <div className={cn("flex", from === "me" ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
          from === "me" ? "rounded-br-sm bg-primary text-primary-foreground" : "rounded-bl-sm bg-muted",
        )}
      >
        {children}
      </div>
    </div>
  )
}

export function ChatPreview({ children, banner }: { children: React.ReactNode; banner?: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")
  const [width, setWidth] = useState<Width>("mobile")

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <span className="text-xs font-medium">Preview</span>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" size="sm" variant="outline" value={width} onValueChange={(v) => v && setWidth(v as Width)}>
            <ToggleGroupItem value="mobile" aria-label="Mobile width">
              <SmartphoneIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="desktop" aria-label="Desktop width">
              <MonitorIcon />
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup type="single" size="sm" variant="outline" value={theme} onValueChange={(v) => v && setTheme(v as Theme)}>
            <ToggleGroupItem value="light" aria-label="Light theme">
              <SunIcon />
            </ToggleGroupItem>
            <ToggleGroupItem value="dark" aria-label="Dark theme">
              <MoonIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto bg-muted/40 p-4">
        <div
          className={cn(
            theme === "dark" && "dark",
            "mx-auto flex min-h-full flex-col rounded-xl border bg-background text-foreground shadow-sm transition-[max-width]",
            width === "mobile" ? "max-w-[375px]" : "max-w-[720px]",
          )}
        >
          <div className="border-b px-4 py-3 text-sm font-medium">Support Bot</div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <Bubble from="me">Hi, can you show me the latest update?</Bubble>
            <Bubble from="bot">Sure, here it is:</Bubble>
            {banner}
            <div className={cn(width === "mobile" ? "w-[85%]" : "w-full max-w-[420px]")}>{children}</div>
            <Bubble from="me">Thanks!</Bubble>
          </div>
        </div>
      </div>
    </div>
  )
}
