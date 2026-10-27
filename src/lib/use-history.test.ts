import { describe, expect, test } from "bun:test"
import { COALESCE_MS, type History, HISTORY_LIMIT, historyReducer } from "./use-history"

const start = (present: string): History<string> => ({ past: [], present, future: [] })
const set = (s: History<string>, value: string, at: number, coalesce?: string) =>
  historyReducer(s, { type: "set", value, at, coalesce })

describe("historyReducer", () => {
  test("undo and redo", () => {
    let s = set(set(start("a"), "b", 0), "c", 10_000)
    s = historyReducer(s, { type: "undo" })
    expect(s.present).toBe("b")
    s = historyReducer(s, { type: "undo" })
    expect(s.present).toBe("a")
    expect(historyReducer(s, { type: "undo" })).toBe(s)
    s = historyReducer(s, { type: "redo" })
    expect(s.present).toBe("b")
  })

  test("a new change clears redo", () => {
    let s = historyReducer(set(start("a"), "b", 0), { type: "undo" })
    s = set(s, "x", 1)
    expect(s.future).toEqual([])
    expect(historyReducer(s, { type: "redo" })).toBe(s)
  })

  test("typing bursts with the same tag coalesce", () => {
    let s = set(start(""), "h", 0, "typing")
    s = set(s, "he", 100, "typing")
    s = set(s, "hey", 200, "typing")
    expect(s.past).toEqual([""])
    // A pause starts a new step.
    s = set(s, "hey!", 200 + COALESCE_MS + 1, "typing")
    expect(s.past).toEqual(["", "hey"])
    // Untagged changes never merge.
    s = set(s, "template", 200 + COALESCE_MS + 2)
    expect(s.past).toEqual(["", "hey", "hey!"])
  })

  test("same value is a no-op", () => {
    const s = start("a")
    expect(set(s, "a", 0)).toBe(s)
  })

  test("history is capped", () => {
    let s = start("0")
    for (let i = 1; i <= HISTORY_LIMIT + 20; i++) s = set(s, String(i), i * 10_000)
    expect(s.past).toHaveLength(HISTORY_LIMIT)
    expect(s.past[0]).toBe("20")
  })
})
