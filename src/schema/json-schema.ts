import { z } from "zod"
import { CardSchema } from "./card"

export const SCHEMA_URI = "https://declarative-ui.local/card.schema.json"

export const cardJsonSchema = z.toJSONSchema(CardSchema, { io: "input", target: "draft-2020-12" })

export function downloadJsonSchema() {
  const blob = new Blob([JSON.stringify(cardJsonSchema, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = "card.schema.json"
  a.click()
  URL.revokeObjectURL(url)
}
