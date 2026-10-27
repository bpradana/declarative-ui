import { expect, test } from "bun:test"
import { TEMPLATE_CATEGORIES, templates } from "@/templates"

test("template ids are unique", () => {
  const ids = templates.map((t) => t.id)
  expect(new Set(ids).size).toBe(ids.length)
})

test("every category has at least one template", () => {
  for (const category of TEMPLATE_CATEGORIES) {
    expect(templates.some((t) => t.category === category)).toBe(true)
  }
})
