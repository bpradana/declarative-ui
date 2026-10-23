import { expect, test } from "bun:test"
import { NODE_TYPES } from "./card"
import { cardJsonSchema } from "./json-schema"

test("exported JSON Schema describes every node type", () => {
  const defs = cardJsonSchema.$defs as Record<string, { properties?: { type?: { const?: string } } }>
  const types = Object.values(defs)
    .map((d) => d.properties?.type?.const)
    .filter(Boolean)
  for (const t of NODE_TYPES) expect(types).toContain(t)
  expect(cardJsonSchema.$schema).toBe("https://json-schema.org/draft/2020-12/schema")
})

test("openUrl requires url in the exported schema", () => {
  const action = (cardJsonSchema.$defs as Record<string, { oneOf?: { properties: { type: { const: string } }; required: string[] }[] }>).Action
  const openUrl = action.oneOf?.find((v) => v.properties.type.const === "openUrl")
  expect(openUrl?.required).toContain("url")
})
