import { describe, expect, test } from "bun:test"
import { NODE_TYPES, parseCard } from "@/schema/card"
import { cardJsonSchema } from "@/schema/json-schema"
import { componentDocs } from "./components"
import { getActionProps, getCardProps, getProps } from "./props"

describe("component docs", () => {
  test("every node type is documented exactly once", () => {
    expect(componentDocs.map((d) => d.type).sort()).toEqual([...NODE_TYPES].sort())
  })

  test.each(componentDocs.map((d) => [d.type, d] as const))("%s example is a valid node", (_t, doc) => {
    const result = parseCard(JSON.stringify({ version: "1", type: "card", children: [doc.example] }))
    if (!result.ok) throw new Error(JSON.stringify(result.issues))
    expect(doc.example.type).toBe(doc.type)
  })
})

describe("props tables", () => {
  const defs = cardJsonSchema.$defs as Record<string, { properties?: Record<string, { const?: string }>; required?: string[] }>

  test.each([...NODE_TYPES])("%s props match the schema", (type) => {
    const def = Object.values(defs).find((d) => d.properties?.type?.const === type)!
    const top = getProps(type).filter((r) => r.depth === 0)
    expect(top.map((r) => r.name)).toEqual(Object.keys(def.properties!))
    for (const row of top) expect(row.required).toBe(def.required?.includes(row.name) ?? false)
  })

  test("card and action tables", () => {
    expect(getCardProps().find((r) => r.name === "children")?.type).toBe("Node[]")
    const url = getActionProps().find((r) => r.name === "url")!
    expect(url.required).toBe(false)
    expect(url.description).toContain("openUrl")
    expect(getActionProps().find((r) => r.name === "type")?.type).toBe('"submit" | "postback" | "openUrl"')
  })
})
