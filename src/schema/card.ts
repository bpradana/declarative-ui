import { z } from "zod"

const actionBase = {
  id: z.string().min(1).describe("Identifier the backend receives as `actionId`."),
  payload: z
    .record(z.string(), z.unknown())
    .optional()
    .describe("Arbitrary data echoed back to the backend."),
}

export const ActionSchema = z
  .discriminatedUnion("type", [
    z.strictObject({
      type: z.literal("submit").describe("Send the payload plus the values of every named field."),
      ...actionBase,
    }),
    z.strictObject({
      type: z.literal("postback").describe("Send the payload only."),
      ...actionBase,
    }),
    z.strictObject({
      type: z.literal("openUrl").describe("Open `url` in a new tab (the event is still logged)."),
      url: z.url(),
      ...actionBase,
    }),
  ])
  .meta({ id: "Action" })

const BadgeVariant = z.enum(["default", "secondary", "destructive", "outline"])

export const HeaderNodeSchema = z
  .strictObject({
    type: z.literal("header"),
    title: z.string(),
    subtitle: z.string().optional(),
    avatar: z
      .strictObject({
        src: z.string().optional(),
        fallback: z.string().describe("Initials shown when there is no image."),
      })
      .optional(),
    badge: z
      .strictObject({ label: z.string(), variant: BadgeVariant.optional() })
      .optional(),
  })
  .meta({ id: "HeaderNode", description: "Card title row with optional avatar and badge." })

export const TextNodeSchema = z
  .strictObject({
    type: z.literal("text"),
    content: z.string(),
    variant: z.enum(["body", "muted", "title", "caption"]).optional(),
  })
  .meta({ id: "TextNode", description: "A paragraph of text." })

export const ImageNodeSchema = z
  .strictObject({
    type: z.literal("image"),
    src: z.string(),
    alt: z.string(),
    aspectRatio: z.enum(["16:9", "1:1", "4:3"]).optional(),
  })
  .meta({ id: "ImageNode", description: "An image." })

export const DividerNodeSchema = z
  .strictObject({ type: z.literal("divider") })
  .meta({ id: "DividerNode", description: "Horizontal separator." })

export const BadgeNodeSchema = z
  .strictObject({
    type: z.literal("badge"),
    label: z.string(),
    variant: BadgeVariant.optional(),
  })
  .meta({ id: "BadgeNode", description: "Small status label." })

export const KeyValueNodeSchema = z
  .strictObject({
    type: z.literal("keyValue"),
    items: z.array(z.strictObject({ label: z.string(), value: z.string() })).min(1),
  })
  .meta({ id: "KeyValueNode", description: "Label/value rows, e.g. 'Amount: Rp 100.000'." })

export const ListNodeSchema = z
  .strictObject({
    type: z.literal("list"),
    items: z.array(z.string()).min(1),
    ordered: z.boolean().optional(),
  })
  .meta({ id: "ListNode", description: "Bulleted or numbered list." })

export const ButtonNodeSchema = z
  .strictObject({
    type: z.literal("button"),
    label: z.string(),
    variant: z.enum(["default", "secondary", "outline", "ghost", "destructive", "link"]).optional(),
    action: ActionSchema,
  })
  .meta({ id: "ButtonNode", description: "A button that triggers an action." })

export const ActionsNodeSchema = z
  .strictObject({
    type: z.literal("actions"),
    children: z.array(ButtonNodeSchema).min(1),
  })
  .meta({ id: "ActionsNode", description: "Row of buttons rendered in the card footer." })

export const InputNodeSchema = z
  .strictObject({
    type: z.literal("input"),
    name: z.string().min(1).describe("Key used in `formValues`."),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    inputType: z.enum(["text", "number", "email"]).optional(),
  })
  .meta({ id: "InputNode", description: "Single-line text field." })

export const TextareaNodeSchema = z
  .strictObject({
    type: z.literal("textarea"),
    name: z.string().min(1).describe("Key used in `formValues`."),
    label: z.string().optional(),
    placeholder: z.string().optional(),
  })
  .meta({ id: "TextareaNode", description: "Multi-line text field." })

export const SelectNodeSchema = z
  .strictObject({
    type: z.literal("select"),
    name: z.string().min(1).describe("Key used in `formValues`."),
    label: z.string().optional(),
    placeholder: z.string().optional(),
    options: z.array(z.strictObject({ label: z.string(), value: z.string() })).min(1),
  })
  .meta({ id: "SelectNode", description: "Dropdown with fixed options." })

export const CheckboxNodeSchema = z
  .strictObject({
    type: z.literal("checkbox"),
    name: z.string().min(1).describe("Key used in `formValues`."),
    label: z.string(),
    defaultChecked: z.boolean().optional(),
  })
  .meta({ id: "CheckboxNode", description: "Boolean toggle." })

export type Action = z.infer<typeof ActionSchema>
export type StackNode = {
  type: "stack"
  direction?: "vertical" | "horizontal"
  gap?: "sm" | "md" | "lg"
  align?: "start" | "center" | "end" | "between"
  children: CardNode[]
}
export type CardNode =
  | z.infer<typeof HeaderNodeSchema>
  | z.infer<typeof TextNodeSchema>
  | z.infer<typeof ImageNodeSchema>
  | z.infer<typeof DividerNodeSchema>
  | z.infer<typeof BadgeNodeSchema>
  | z.infer<typeof KeyValueNodeSchema>
  | z.infer<typeof ListNodeSchema>
  | z.infer<typeof ButtonNodeSchema>
  | z.infer<typeof ActionsNodeSchema>
  | z.infer<typeof InputNodeSchema>
  | z.infer<typeof TextareaNodeSchema>
  | z.infer<typeof SelectNodeSchema>
  | z.infer<typeof CheckboxNodeSchema>
  | StackNode

export const StackNodeSchema: z.ZodType<StackNode> = z
  .strictObject({
    type: z.literal("stack"),
    direction: z.enum(["vertical", "horizontal"]).optional(),
    gap: z.enum(["sm", "md", "lg"]).optional(),
    align: z.enum(["start", "center", "end", "between"]).optional(),
    get children() {
      return z.array(NodeSchema)
    },
  })
  .meta({ id: "StackNode", description: "Lays out children vertically or horizontally." })

export const NodeSchema: z.ZodType<CardNode> = z
  .discriminatedUnion("type", [
    HeaderNodeSchema,
    TextNodeSchema,
    ImageNodeSchema,
    DividerNodeSchema,
    BadgeNodeSchema,
    KeyValueNodeSchema,
    ListNodeSchema,
    ButtonNodeSchema,
    ActionsNodeSchema,
    InputNodeSchema,
    TextareaNodeSchema,
    SelectNodeSchema,
    CheckboxNodeSchema,
    // discriminatedUnion needs the concrete object type to read the `type` literal
    StackNodeSchema as unknown as z.ZodObject<{ type: z.ZodLiteral<"stack">; children: z.ZodType<CardNode[]> }>,
  ])
  .meta({ id: "Node" })

export const NODE_TYPES = [
  "header",
  "text",
  "image",
  "divider",
  "badge",
  "keyValue",
  "list",
  "stack",
  "button",
  "actions",
  "input",
  "textarea",
  "select",
  "checkbox",
] as const

export const CardSchema = z
  .strictObject({
    $schema: z.string().optional(),
    version: z.literal("1"),
    type: z.literal("card"),
    id: z.string().optional(),
    children: z.array(NodeSchema),
  })
  .meta({
    id: "Card",
    title: "Chat Card",
    description: "Declarative card rendered inside a chat message.",
  })

export type Card = z.infer<typeof CardSchema>

export type CardIssue = { path: (string | number)[]; message: string }

export type ParseResult =
  | { ok: true; card: Card }
  | { ok: false; kind: "syntax" | "schema"; issues: CardIssue[] }

export function parseCard(source: string): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(source)
  } catch (e) {
    return { ok: false, kind: "syntax", issues: [{ path: [], message: (e as Error).message }] }
  }
  const result = CardSchema.safeParse(json)
  if (result.success) return { ok: true, card: result.data }
  return {
    ok: false,
    kind: "schema",
    issues: result.error.issues.map((i) => ({
      path: i.path.map((p) => (typeof p === "symbol" ? String(p) : p)),
      message: i.message,
    })),
  }
}

export function formatPath(path: (string | number)[]): string {
  if (path.length === 0) return "(root)"
  return path.map((p) => (typeof p === "number" ? `[${p}]` : `.${p}`)).join("").replace(/^\./, "")
}
