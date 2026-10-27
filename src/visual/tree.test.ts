import { describe, expect, test } from "bun:test"
import type { Card, CardNode } from "@/schema/card"
import { allowedChildTypes, duplicateNode, getNode, insertChild, moveNode, removeNode, updateNode } from "./tree"

const text = (content: string): CardNode => ({ type: "text", content })
const button: CardNode = { type: "button", label: "Ok", action: { type: "postback", id: "ok" } }
const footer: CardNode = { type: "actions", children: [button] }

const card = (): Card => ({
  version: "1",
  type: "card",
  children: [text("a"), { type: "stack", children: [text("b"), text("c")] }, footer],
})

const contents = (nodes: CardNode[]) => nodes.map((n) => (n.type === "text" ? n.content : n.type))

describe("tree ops", () => {
  test("getNode walks into stacks", () => {
    expect(getNode(card(), [1, 1])).toEqual(text("c"))
    expect(getNode(card(), [5])).toBeUndefined()
    expect(getNode(card(), [0, 0])).toBeUndefined()
  })

  test("updateNode replaces a nested node without mutating the input", () => {
    const before = card()
    const after = updateNode(before, [1, 0], text("B"))
    expect(getNode(after, [1, 0])).toEqual(text("B"))
    expect(getNode(before, [1, 0])).toEqual(text("b"))
  })

  test("removeNode", () => {
    expect(contents(removeNode(card(), [0]).children)).toEqual(["stack", "actions"])
    const stack = getNode(removeNode(card(), [1, 0]), [1]) as Extract<CardNode, { type: "stack" }>
    expect(contents(stack.children)).toEqual(["c"])
  })

  test("moveNode clamps at the edges and returns the new path", () => {
    const down = moveNode(card(), [1, 0], 1)
    expect(down.path).toEqual([1, 1])
    expect(getNode(down.card, [1, 1])).toEqual(text("b"))
    const edge = moveNode(card(), [0], -1)
    expect(edge.path).toEqual([0])
    expect(edge.card).toEqual(card())
  })

  test("duplicateNode inserts a deep copy right after", () => {
    const { card: next, path } = duplicateNode(card(), [1])
    expect(path).toEqual([2])
    expect(contents(next.children)).toEqual(["a", "stack", "stack", "actions"])
    expect(getNode(next, [2])).not.toBe(getNode(next, [1]))
  })

  test("insertChild keeps trailing actions as the footer", () => {
    const { card: next, path } = insertChild(card(), [], { type: "divider" })
    expect(path).toEqual([2])
    expect(contents(next.children)).toEqual(["a", "stack", "divider", "actions"])
    expect(contents(insertChild(card(), [], footer).card.children).at(-1)).toBe("actions")
  })

  test("insertChild appends inside containers", () => {
    const { path } = insertChild(card(), [2], button)
    expect(path).toEqual([2, 1])
  })

  test("allowedChildTypes", () => {
    expect(allowedChildTypes(null)).toBe("any")
    expect(allowedChildTypes(footer)).toEqual(["button"])
    expect(allowedChildTypes(text("x"))).toEqual([])
  })
})
