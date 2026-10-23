import { cardJsonSchema } from "@/schema/json-schema"

type JsonSchema = {
  type?: string
  const?: unknown
  enum?: unknown[]
  $ref?: string
  items?: JsonSchema
  properties?: Record<string, JsonSchema>
  required?: string[]
  oneOf?: JsonSchema[]
  anyOf?: JsonSchema[]
  additionalProperties?: unknown
  description?: string
}

export type PropRow = {
  name: string
  type: string
  required: boolean
  description?: string
  /** Nested rows (e.g. `avatar.src`) are indented in the table. */
  depth: number
}

const defs = cardJsonSchema.$defs as Record<string, JsonSchema>

const refName = (ref: string) => {
  const name = ref.split("/").pop()!
  return name === "Node" ? "Node" : name.replace(/Node$/, "")
}

export function describeType(s: JsonSchema): string {
  if (s.$ref) return refName(s.$ref)
  if (s.const !== undefined) return JSON.stringify(s.const)
  if (s.enum) return s.enum.map((v) => JSON.stringify(v)).join(" | ")
  if (s.oneOf ?? s.anyOf) return (s.oneOf ?? s.anyOf)!.map(describeType).join(" | ")
  if (s.type === "array") return `${s.items ? describeType(s.items) : "unknown"}[]`
  if (s.type === "object") {
    if (s.properties) return `{ ${Object.keys(s.properties).join(", ")} }`
    return "object"
  }
  return s.type ?? "unknown"
}

function rows(schema: JsonSchema, prefix = "", depth = 0): PropRow[] {
  const out: PropRow[] = []
  for (const [key, prop] of Object.entries(schema.properties ?? {})) {
    const name = prefix + key
    out.push({
      name,
      type: describeType(prop),
      required: schema.required?.includes(key) ?? false,
      description: prop.description,
      depth,
    })
    if (prop.type === "object" && prop.properties) out.push(...rows(prop, `${name}.`, depth + 1))
    if (prop.type === "array" && prop.items?.type === "object" && prop.items.properties) {
      out.push(...rows(prop.items, `${name}[].`, depth + 1))
    }
  }
  return out
}

function defForNodeType(nodeType: string): JsonSchema | undefined {
  return Object.values(defs).find((d) => d.properties?.type?.const === nodeType)
}

export function getProps(nodeType: string): PropRow[] {
  const def = defForNodeType(nodeType)
  return def ? rows(def) : []
}

export function getCardProps(): PropRow[] {
  return rows(defs.Card)
}

/** Action is a union on `type`; merge its variants into one table. */
export function getActionProps(): PropRow[] {
  const variants = defs.Action.oneOf ?? defs.Action.anyOf ?? []
  const merged = new Map<string, PropRow>()
  for (const v of variants) {
    for (const row of rows(v)) {
      const existing = merged.get(row.name)
      if (!existing) {
        merged.set(row.name, { ...row })
        continue
      }
      if (row.name === "type") existing.type = `${existing.type} | ${row.type}`
      existing.required &&= row.required
    }
  }
  for (const row of merged.values()) {
    if (!variants.every((v) => row.name in (v.properties ?? {}))) {
      row.required = false
      const owners = variants.filter((v) => row.name in (v.properties ?? {})).map((v) => v.properties!.type.const)
      row.description = `${row.description ?? ""} Only for ${owners.map((o) => `\`${o}\``).join(", ")}; required there.`.trim()
    }
  }
  return [...merged.values()]
}
