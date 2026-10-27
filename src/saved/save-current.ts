import { toast } from "sonner"
import { type SavedCard, savedCards } from "@/lib/saved-cards"

/** Save the current source to `currentId` (or as a new card). Shared by the sheet and Cmd/Ctrl+S. */
export function saveCurrent(source: string, name: string, currentId: string | null): SavedCard | null {
  const saved = savedCards.save({ id: currentId ?? undefined, name, source })
  if (saved) toast.success(`Saved “${saved.name}”`)
  else toast.error("Couldn't save: browser storage is unavailable or full")
  return saved
}
