import { describe, expect, test } from "bun:test"
import { createSavedCards, STORAGE_KEY, suggestName } from "./saved-cards"

function fakeStorage() {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
  }
}

describe("saved cards", () => {
  test("save, update, rename, remove", () => {
    const storage = fakeStorage()
    const store = createSavedCards(() => storage)
    const a = store.save({ name: "Receipt", source: "{}" })!
    store.save({ name: "Poll", source: "[]" })
    expect(store.list().map((c) => c.name).sort()).toEqual(["Poll", "Receipt"])

    store.save({ id: a.id, name: "Receipt", source: '{"v":2}' })
    expect(store.list()).toHaveLength(2)
    expect(store.list().find((c) => c.id === a.id)?.source).toBe('{"v":2}')

    store.rename(a.id, "  Receipt v2 ")
    expect(store.list().find((c) => c.id === a.id)?.name).toBe("Receipt v2")

    store.remove(a.id)
    expect(store.list().map((c) => c.name)).toEqual(["Poll"])
  })

  test("list is referentially stable until storage changes", () => {
    const storage = fakeStorage()
    const store = createSavedCards(() => storage)
    expect(store.list()).toBe(store.list())
    store.save({ name: "x", source: "" })
    const first = store.list()
    expect(store.list()).toBe(first)
  })

  test("broken or missing storage degrades to an empty list", () => {
    const storage = fakeStorage()
    storage.data.set(STORAGE_KEY, "{not json")
    expect(createSavedCards(() => storage).list()).toEqual([])
    storage.data.set(STORAGE_KEY, JSON.stringify([{ id: 1 }, { id: "a", name: "ok", source: "", updatedAt: "t" }]))
    expect(createSavedCards(() => storage).list().map((c) => c.name)).toEqual(["ok"])
    const none = createSavedCards(() => null)
    expect(none.list()).toEqual([])
    expect(none.save({ name: "x", source: "" })).toBeNull()
  })

  test("a throwing setItem reports failure", () => {
    const store = createSavedCards(() => ({
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError")
      },
    }))
    expect(store.save({ name: "x", source: "" })).toBeNull()
  })

  test("suggestName", () => {
    const card = (children: unknown[], id?: string) => JSON.stringify({ version: "1", type: "card", id, children })
    expect(suggestName(card([{ type: "header", title: "Leave request" }]))).toBe("Leave request")
    expect(suggestName(card([], "receipt-1"))).toBe("receipt-1")
    expect(suggestName("{ nope")).toBe("Untitled card")
  })
})
