import { z } from "zod"
import { downloadText } from "@/lib/download"
import { CardSchema } from "./card"

export const SCHEMA_URI = "https://declarative-ui.local/card.schema.json"

export const cardJsonSchema = z.toJSONSchema(CardSchema, { io: "input", target: "draft-2020-12" })

export const cardJsonSchemaSource = JSON.stringify(cardJsonSchema, null, 2)

export function downloadJsonSchema() {
  downloadText("card.schema.json", cardJsonSchemaSource, "application/json")
}
