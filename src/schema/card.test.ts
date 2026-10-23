import { describe, expect, test } from "bun:test"
import { templates, templateSource } from "@/templates"
import { formatPath, parseCard } from "./card"

const card = (children: unknown[]) => JSON.stringify({ version: "1", type: "card", children })

describe("parseCard", () => {
  test.each(templates.map((t) => [t.id, t] as const))("template %s is valid", (_id, t) => {
    expect(parseCard(templateSource(t)).ok).toBe(true)
  })

  test("reports JSON syntax errors", () => {
    const result = parseCard("{ nope")
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.kind).toBe("syntax")
  })

  test("unknown node type points at the type field", () => {
    const result = parseCard(card([{ type: "txt", content: "x" }]))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0].path).toEqual(["children", 0, "type"])
  })

  test("missing required field", () => {
    const result = parseCard(card([{ type: "badge" }]))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0].path).toEqual(["children", 0, "label"])
  })

  test("extra fields are rejected", () => {
    const result = parseCard(card([{ type: "text", content: "x", colour: "red" }]))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0].message).toContain("colour")
  })

  test("errors inside nested stacks keep their full path", () => {
    const result = parseCard(
      card([{ type: "stack", children: [{ type: "button", label: "Go", action: { type: "openUrl", id: "go" } }] }]),
    )
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.issues[0].path).toEqual(["children", 0, "children", 0, "action", "url"])
  })

  test("actions only accept buttons", () => {
    const result = parseCard(card([{ type: "actions", children: [{ type: "text", content: "x" }] }]))
    expect(result.ok).toBe(false)
  })
})

test("formatPath", () => {
  expect(formatPath([])).toBe("(root)")
  expect(formatPath(["children", 2, "action", "url"])).toBe("children[2].action.url")
})
