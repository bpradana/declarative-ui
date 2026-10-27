import { CheckIcon, FolderOpenIcon, PencilIcon, SaveIcon, Trash2Icon, XIcon } from "lucide-react"
import { useRef, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { type SavedCard, savedCards, suggestName, useSavedCards } from "@/lib/saved-cards"
import { cn } from "@/lib/utils"
import { saveCurrent } from "./save-current"

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })

function timeAgo(iso: string): string {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000)
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86_400],
    ["hour", 3_600],
    ["minute", 60],
  ]
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relative.format(Math.round(seconds / size), unit)
  }
  return "just now"
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  source: string
  currentId: string | null
  onCurrentChange: (id: string | null) => void
  onOpenCard: (card: SavedCard) => void
}

export function SavedCardsSheet({ open, onOpenChange, source, currentId, onCurrentChange, onOpenCard }: Props) {
  const cards = useSavedCards()
  const current = cards.find((c) => c.id === currentId)
  const [name, setName] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)

  // Fresh default name each time the sheet opens.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setName(current?.name ?? suggestName(source))
  }

  const save = (asNew: boolean) => {
    const saved = saveCurrent(source, name, asNew ? null : (currentId ?? null))
    if (saved) onCurrentChange(saved.id)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          nameRef.current?.select()
        }}
      >
        <SheetHeader className="border-b">
          <SheetTitle>My cards</SheetTitle>
          <SheetDescription>Saved in this browser only. Use Share to send a card to someone.</SheetDescription>
          <form
            className="mt-3 flex flex-col gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              save(false)
            }}
          >
            <Label htmlFor="save-name" className="text-xs">
              {current ? "Save changes to" : "Save current card as"}
            </Label>
            <div className="flex gap-2">
              <Input id="save-name" ref={nameRef} value={name} onChange={(e) => setName(e.target.value)} />
              <Button type="submit">
                <SaveIcon /> Save
              </Button>
            </div>
            {current && (
              <Button type="button" variant="link" size="xs" className="self-start px-0" onClick={() => save(true)}>
                Save as a new card instead
              </Button>
            )}
          </form>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto">
          {cards.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No saved cards yet. Press ⌘S / Ctrl+S any time to save.</p>
          ) : (
            <ul className="divide-y">
              {cards.map((card) => (
                <SavedRow
                  key={card.id}
                  card={card}
                  current={card.id === currentId}
                  onOpen={() => {
                    onOpenCard(card)
                    onOpenChange(false)
                  }}
                  onDelete={() => {
                    savedCards.remove(card.id)
                    if (card.id === currentId) onCurrentChange(null)
                    toast.success(`Deleted “${card.name}”`)
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

function SavedRow({
  card,
  current,
  onOpen,
  onDelete,
}: {
  card: SavedCard
  current: boolean
  onOpen: () => void
  onDelete: () => void
}) {
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState(card.name)
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <li className={cn("flex items-center gap-2 px-4 py-2.5", current && "bg-primary/5")}>
      {renaming ? (
        <form
          className="flex min-w-0 flex-1 gap-1"
          onSubmit={(e) => {
            e.preventDefault()
            savedCards.rename(card.id, draft)
            setRenaming(false)
          }}
        >
          <Input autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8" aria-label="Card name" />
          <Button type="submit" variant="ghost" size="icon-sm" aria-label="Save name">
            <CheckIcon />
          </Button>
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Cancel" onClick={() => setRenaming(false)}>
            <XIcon />
          </Button>
        </form>
      ) : (
        <>
          <button type="button" className="min-w-0 flex-1 text-left" onClick={onOpen}>
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-medium">{card.name}</span>
              {current && <Badge variant="secondary">Open</Badge>}
            </div>
            <div className="text-xs text-muted-foreground">Updated {timeAgo(card.updatedAt)}</div>
          </button>
          {confirmDelete ? (
            <>
              <Button variant="destructive" size="xs" onClick={onDelete}>
                Delete
              </Button>
              <Button variant="ghost" size="xs" onClick={() => setConfirmDelete(false)}>
                Keep
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="icon-sm" aria-label={`Open ${card.name}`} onClick={onOpen}>
                <FolderOpenIcon />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Rename ${card.name}`}
                onClick={() => {
                  setDraft(card.name)
                  setRenaming(true)
                }}
              >
                <PencilIcon />
              </Button>
              <Button variant="ghost" size="icon-sm" aria-label={`Delete ${card.name}`} onClick={() => setConfirmDelete(true)}>
                <Trash2Icon />
              </Button>
            </>
          )}
        </>
      )}
    </li>
  )
}
