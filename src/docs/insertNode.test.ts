import { expect, test } from "bun:test"
import { insertNode } from "./insertNode"

const source = (children: unknown[]) => JSON.stringify({ version: "1", type: "card", children }, null, 2)
const types = (json: string | null) => (JSON.parse(json!) as { children: { type: string }[] }).children.map((c) => c.type)

test("appends to children", () => {
  const out = insertNode(source([{ type: "text", content: "a" }]), { type: "divider" })
  expect(types(out)).toEqual(["text", "divider"])
})

test("keeps trailing actions as the footer", () => {
  const footer = { type: "actions", children: [{ type: "button", label: "Ok", action: { type: "postback", id: "ok" } }] }
  const out = insertNode(source([{ type: "text", content: "a" }, footer]), { type: "divider" })
  expect(types(out)).toEqual(["text", "divider", "actions"])
})

test("actions nodes go at the very end", () => {
  const footer = { type: "actions", children: [{ type: "button", label: "Ok", action: { type: "postback", id: "ok" } }] }
  const out = insertNode(source([footer]), footer as never)
  expect(types(out)).toEqual(["actions", "actions"])
})

test("returns null for invalid source", () => {
  expect(insertNode("{ nope", { type: "divider" })).toBeNull()
  expect(insertNode(source([{ type: "nope" }]), { type: "divider" })).toBeNull()
})
