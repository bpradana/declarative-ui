import { actionVariants, defs, HEADER, type JsonSchema, nodeDefNames, refName } from "./schema"

const ident = (key: string) => (/^[A-Za-z_]\w*$/.test(key) ? key : JSON.stringify(key))

const doc = (text: string | undefined, indent: string) => (text ? `${indent}/** ${text.replace(/\*\//g, "*\\/")} */\n` : "")

function tsType(s: JsonSchema, indent: string): string {
  if (s.$ref) return refName(s.$ref)
  if (s.const !== undefined) return JSON.stringify(s.const)
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ")
  const union = s.oneOf ?? s.anyOf
  if (union) return union.map((u) => tsType(u, indent)).join(" | ")
  switch (s.type) {
    case "string":
      return "string"
    case "boolean":
      return "boolean"
    case "integer":
    case "number":
      return "number"
    case "array": {
      const item = s.items ? tsType(s.items, indent) : "unknown"
      return item.includes(" | ") ? `(${item})[]` : `${item}[]`
    }
    case "object":
      return s.properties ? objectType(s, indent) : "Record<string, unknown>"
    default:
      return "unknown"
  }
}

function objectType(s: JsonSchema, indent: string): string {
  const inner = `${indent}  `
  const fields = Object.entries(s.properties ?? {}).map(([key, prop]) => {
    const optional = s.required?.includes(key) ? "" : "?"
    return `${doc(prop.description, inner)}${inner}${ident(key)}${optional}: ${tsType(prop, inner)}`
  })
  return `{\n${fields.join("\n")}\n${indent}}`
}

/** TypeScript types for the whole card format plus the event the backend receives. */
export function generateTypeScript(): string {
  const parts: string[] = [`// ${HEADER}\n`]

  parts.push(
    `${doc("What a button does when pressed.", "")}export type Action =\n${actionVariants
      .map((v) => `  | ${objectType(v, "  ")}`)
      .join("\n")}\n`,
  )

  for (const name of nodeDefNames) {
    const def = defs[name]
    parts.push(`${doc(def.description, "")}export type ${name} = ${objectType(def, "")}\n`)
  }

  parts.push(`export type Node =\n${nodeDefNames.map((n) => `  | ${n}`).join("\n")}\n`)
  parts.push(`${doc(defs.Card.description, "")}export type Card = ${objectType(defs.Card, "")}\n`)

  parts.push(`/** Values of every named field, keyed by \`name\`. Text fields and selects send strings, checkboxes booleans. */
export type FormValues = Record<string, string | boolean>

/** What the chat client POSTs to the backend when a button is pressed. */
export type ActionEvent = {
  cardId?: string
  actionId: string
  type: Action["type"]
  /** Only for \`openUrl\`. */
  url?: string
  payload?: Record<string, unknown>
  /** Only for \`submit\`. */
  formValues?: FormValues
  timestamp: string
}
`)
  return parts.join("\n")
}
