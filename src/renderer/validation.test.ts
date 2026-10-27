import { describe, expect, test } from "bun:test"
import type { CardNode } from "@/schema/card"
import { validateFields } from "./validation"

const code: CardNode = { type: "input", name: "code", label: "Code", required: true, pattern: "\\d{6}", patternMessage: "6 digits" }

describe("validateFields", () => {
  test("required text, select and checkbox", () => {
    const nodes: CardNode[] = [
      code,
      { type: "select", name: "venue", label: "Venue", required: true, options: [{ label: "A", value: "a" }] },
      { type: "checkbox", name: "agree", label: "I agree", required: true },
    ]
    expect(validateFields(nodes, { code: "", venue: "", agree: false })).toEqual({
      code: "Code is required",
      venue: "Choose a venue",
      agree: "Please check this box to continue",
    })
    expect(validateFields(nodes, { code: "123456", venue: "a", agree: true })).toEqual({})
  })

  test("pattern must match the whole value", () => {
    expect(validateFields([code], { code: "12345" })).toEqual({ code: "6 digits" })
    expect(validateFields([code], { code: "1234567" })).toEqual({ code: "6 digits" })
  })

  test("length rules", () => {
    const note: CardNode = { type: "textarea", name: "note", label: "Note", minLength: 3, maxLength: 5 }
    expect(validateFields([note], { note: "ab" }).note).toContain("at least 3")
    expect(validateFields([note], { note: "abcdef" }).note).toContain("at most 5")
    expect(validateFields([note], { note: "abcd" })).toEqual({})
  })

  test("empty optional fields skip other rules", () => {
    const email: CardNode = { type: "input", name: "email", inputType: "email", minLength: 5 }
    expect(validateFields([email], { email: "" })).toEqual({})
    expect(validateFields([email], { email: "nope" }).email).toBeDefined()
    expect(validateFields([email], { email: "a@b.co" })).toEqual({})
  })

  test("number inputs", () => {
    const qty: CardNode = { type: "input", name: "qty", label: "Quantity", inputType: "number" }
    expect(validateFields([qty], { qty: "abc" })).toEqual({ qty: "Quantity must be a number" })
    expect(validateFields([qty], { qty: "3" })).toEqual({})
  })

  test("walks nested stacks", () => {
    const nodes: CardNode[] = [{ type: "stack", children: [{ type: "stack", children: [code] }] }]
    expect(Object.keys(validateFields(nodes, { code: "" }))).toEqual(["code"])
  })
})
