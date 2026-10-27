import { defs, HEADER, type JsonSchema, mergedActionProps, nodeDefNames, refName } from "./schema"

const INITIALISMS: Record<string, string> = { id: "ID", url: "URL", $schema: "Schema" }

/** `aspectRatio` → `AspectRatio`, `id` → `ID`, `cardId` → `CardID`. */
export function goName(key: string): string {
  if (INITIALISMS[key]) return INITIALISMS[key]
  const pascal = key.replace(/^\$/, "").replace(/^./, (c) => c.toUpperCase())
  return pascal.replace(/Id$/, "ID").replace(/Url$/, "URL")
}

type Field = { name: string; type: string; tag: string; doc?: string }
type Struct = { name: string; doc?: string; fields: Field[] }

/** Collects every struct needed, naming nested objects after their owner, e.g. `HeaderNodeAvatar`. */
class StructSet {
  structs: Struct[] = []

  add(name: string, schema: JsonSchema, doc?: string) {
    const struct: Struct = { name, doc, fields: [] }
    this.structs.push(struct)
    for (const [key, prop] of Object.entries(schema.properties ?? {})) {
      const required = schema.required?.includes(key) ?? false
      struct.fields.push(this.field(name, key, prop, required))
    }
  }

  field(owner: string, key: string, prop: JsonSchema, required: boolean): Field {
    const name = goName(key)
    let type = this.type(`${owner}${name}`, prop)
    // Pointers keep "unset" distinct from false/0 and from an empty object.
    if (!required && (type === "bool" || type === "int" || /^[A-Z]/.test(type))) type = `*${type}`
    const tag = `\`json:"${key}${required ? "" : ",omitempty"}"\``
    const allowed = prop.enum ? `One of ${prop.enum.map((v) => JSON.stringify(v)).join(", ")}.` : ""
    const fixed =
      prop.const !== undefined && !prop.description?.includes(JSON.stringify(prop.const))
        ? `Always ${JSON.stringify(prop.const)}.`
        : ""
    const doc = [prop.description, allowed, fixed].filter(Boolean).join(" ") || undefined
    return { name, type, tag, doc }
  }

  type(nestedName: string, s: JsonSchema): string {
    if (s.$ref) return refName(s.$ref)
    if (s.enum || s.const !== undefined) return "string"
    switch (s.type) {
      case "string":
        return "string"
      case "boolean":
        return "bool"
      case "integer":
        return "int"
      case "number":
        return "float64"
      case "array":
        return `[]${s.items ? this.type(`${nestedName}Item`, s.items) : "any"}`
      case "object":
        if (!s.properties) return "map[string]any"
        this.add(nestedName, s)
        return nestedName
      default:
        return "any"
    }
  }
}

const comment = (text: string, indent: string) => `${indent}// ${text.replace(/`/g, "")}\n`

/**
 * Render a struct the way gofmt would: names, types and tags line up in columns, and a comment line
 * starts a new alignment run.
 */
function renderStruct({ name, doc, fields }: Struct): string {
  const runs: Field[][] = []
  for (const f of fields) {
    if (f.doc || runs.length === 0) runs.push([f])
    else runs[runs.length - 1].push(f)
  }
  const lines = runs.flatMap((run) => {
    const nameWidth = Math.max(...run.map((f) => f.name.length))
    const typeWidth = Math.max(...run.map((f) => f.type.length))
    return run.map(
      (f) => `${f.doc ? comment(f.doc, "\t") : ""}\t${f.name.padEnd(nameWidth)} ${f.type.padEnd(typeWidth)} ${f.tag}`,
    )
  })
  return `${doc ? comment(doc, "") : ""}type ${name} struct {\n${lines.join("\n")}\n}\n`
}

/** Go structs for the card format, with a `Node` wrapper that decodes into the concrete node type. */
export function generateGo(packageName = "card"): string {
  const set = new StructSet()

  set.add("Card", defs.Card, "Card is the declarative card rendered inside a chat message.")

  const action: Struct = {
    name: "Action",
    doc: "Action is what a button does when pressed.",
    fields: mergedActionProps().map(({ name, schema, required }) => {
      const f = set.field("Action", name, schema, required)
      if (name === "type") return { ...f, doc: 'One of "submit", "postback", "openUrl".' }
      return name === "url" ? { ...f, doc: `${f.doc ?? ""} Only for openUrl.`.trim() } : f
    }),
  }

  for (const name of nodeDefNames) {
    const def = defs[name]
    set.add(name, def, def.description ? `${name}: ${def.description}` : undefined)
  }

  set.add("ActionEvent", {
    type: "object",
    required: ["actionId", "type", "timestamp"],
    properties: {
      cardId: { type: "string", description: "The card's `id`, if it has one." },
      actionId: { type: "string", description: "The button action's `id`." },
      type: { type: "string", description: "\"submit\", \"postback\" or \"openUrl\"." },
      url: { type: "string", description: "Only for openUrl." },
      payload: { type: "object", description: "The action's payload, echoed back." },
      formValues: { type: "object", description: "Only for submit: field name to string (text, select) or bool (checkbox)." },
      timestamp: { type: "string", description: "ISO 8601 time of the click." },
    },
  }, "ActionEvent is what the chat client POSTs to the backend when a button is pressed.")

  const cases = nodeDefNames
    .map((name) => `\tcase ${JSON.stringify(defs[name].properties!.type.const)}:\n\t\tn.Value, err = decodeAs[${name}](data)`)
    .join("\n")

  return `// ${HEADER}

package ${packageName}

import (
\t"encoding/json"
\t"fmt"
)

${set.structs.map(renderStruct).join("\n")}
${renderStruct(action)}
// Node holds one of the *Node structs above in Value. It marshals and unmarshals as the plain node JSON.
type Node struct {
\tValue any
}

func (n *Node) UnmarshalJSON(data []byte) error {
\tvar probe struct {
\t\tType string \`json:"type"\`
\t}
\tif err := json.Unmarshal(data, &probe); err != nil {
\t\treturn err
\t}
\tvar err error
\tswitch probe.Type {
${cases}
\tdefault:
\t\treturn fmt.Errorf("card: unknown node type %q", probe.Type)
\t}
\treturn err
}

func (n Node) MarshalJSON() ([]byte, error) {
\treturn json.Marshal(n.Value)
}

func decodeAs[T any](data []byte) (any, error) {
\tvar v T
\terr := json.Unmarshal(data, &v)
\treturn v, err
}
`
}
