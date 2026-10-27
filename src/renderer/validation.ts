import type { CardNode } from "@/schema/card"
import type { FormValues } from "./context"

export type FieldErrors = Record<string, string>

// Deliberately loose: one "@" with text on both sides and a dot in the domain.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const fieldName = (node: { name: string; label?: string }) => node.label || node.name

/** Checks every named field (including ones nested in stacks) against its rules. Empty result = valid. */
export function validateFields(nodes: CardNode[], values: FormValues, out: FieldErrors = {}): FieldErrors {
  for (const node of nodes) {
    switch (node.type) {
      case "stack":
        validateFields(node.children, values, out)
        break
      case "checkbox":
        if (node.required && values[node.name] !== true) out[node.name] = "Please check this box to continue"
        break
      case "select":
        if (node.required && !values[node.name]) out[node.name] = `Choose a ${fieldName(node).toLowerCase()}`
        break
      case "input":
      case "textarea": {
        const value = String(values[node.name] ?? "")
        const error = checkText(node, value)
        if (error) out[node.name] = error
        break
      }
    }
  }
  return out
}

function checkText(node: Extract<CardNode, { type: "input" | "textarea" }>, value: string): string | undefined {
  const label = fieldName(node)
  // Empty optional fields skip every other rule.
  if (value.trim() === "") return node.required ? `${label} is required` : undefined
  if (node.minLength !== undefined && value.length < node.minLength) {
    return `${label} must be at least ${node.minLength} characters`
  }
  if (node.maxLength !== undefined && value.length > node.maxLength) {
    return `${label} must be at most ${node.maxLength} characters`
  }
  if (node.type === "input") {
    if (node.pattern !== undefined && !new RegExp(`^(?:${node.pattern})$`).test(value)) {
      return node.patternMessage ?? `${label} is not in the expected format`
    }
    if (node.inputType === "email" && !EMAIL.test(value)) return "Enter a valid email address"
    if (node.inputType === "number" && !Number.isFinite(Number(value))) return `${label} must be a number`
  }
  return undefined
}
