import { useSyncExternalStore } from "react"
import { looseCard } from "@/visual/tree"

export type SavedCard = { id: string; name: string; source: string; updatedAt: string }

export const STORAGE_KEY = "declarative-ui:saved-cards"

type StorageLike = Pick<Storage, "getItem" | "setItem">

function browserStorage(): StorageLike | null {
  try {
    return window.localStorage
  } catch {
    return null // private mode, blocked storage, or no window (tests)
  }
}

const isSavedCard = (v: unknown): v is SavedCard =>
  typeof v === "object" &&
  v !== null &&
  ["id", "name", "source", "updatedAt"].every((k) => typeof (v as Record<string, unknown>)[k] === "string")

/** Cards saved in this browser. Storage failures degrade to an empty, in-memory list. */
export function createSavedCards(getStorage: () => StorageLike | null = browserStorage) {
  const listeners = new Set<() => void>()
  let cachedRaw: string | null | undefined
  let cached: SavedCard[] = []

  function list(): SavedCard[] {
    let raw: string | null = null
    try {
      raw = getStorage()?.getItem(STORAGE_KEY) ?? null
    } catch {
      raw = null
    }
    // Same raw string → same array, which useSyncExternalStore needs to avoid re-rendering forever.
    if (raw === cachedRaw) return cached
    cachedRaw = raw
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : []
      cached = Array.isArray(parsed) ? parsed.filter(isSavedCard) : []
    } catch {
      cached = []
    }
    return cached
  }

  function write(cards: SavedCard[]): boolean {
    try {
      const storage = getStorage()
      if (!storage) return false
      storage.setItem(STORAGE_KEY, JSON.stringify(cards))
      return true
    } catch {
      return false // quota exceeded or storage blocked
    } finally {
      listeners.forEach((l) => l())
    }
  }

  const sorted = (cards: SavedCard[]) => [...cards].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))

  return {
    list,
    /** Create a new card, or overwrite `id` when given. Returns null if storage refused the write. */
    save({ id, name, source }: { id?: string; name: string; source: string }): SavedCard | null {
      const card: SavedCard = {
        id: id ?? crypto.randomUUID(),
        name: name.trim() || "Untitled card",
        source,
        updatedAt: new Date().toISOString(),
      }
      const others = list().filter((c) => c.id !== card.id)
      return write(sorted([card, ...others])) ? card : null
    },
    rename(id: string, name: string) {
      write(list().map((c) => (c.id === id ? { ...c, name: name.trim() || c.name } : c)))
    },
    remove(id: string) {
      write(list().filter((c) => c.id !== id))
    },
    subscribe(listener: () => void) {
      listeners.add(listener)
      // Other tabs saving or deleting cards.
      const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && listener()
      if (typeof window !== "undefined") window.addEventListener("storage", onStorage)
      return () => {
        listeners.delete(listener)
        if (typeof window !== "undefined") window.removeEventListener("storage", onStorage)
      }
    },
  }
}

export const savedCards = createSavedCards()

export function useSavedCards(): SavedCard[] {
  return useSyncExternalStore(savedCards.subscribe, savedCards.list, () => [])
}

/** A sensible default name: the first header's title, else the card id. */
export function suggestName(source: string): string {
  const card = looseCard(source)
  const header = card?.children.find((n) => n?.type === "header")
  if (header?.type === "header" && header.title) return header.title
  return card?.id || "Untitled card"
}
