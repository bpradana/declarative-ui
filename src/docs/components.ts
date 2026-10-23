import type { CardNode } from "@/schema/card"

export type DocGroup = "Content" | "Data" | "Actions" | "Form"

export type ComponentDoc = {
  type: CardNode["type"]
  group: DocGroup
  summary: string
  example: CardNode
  notes?: string[]
}

export const GROUPS: DocGroup[] = ["Content", "Data", "Actions", "Form"]

export const componentDocs: ComponentDoc[] = [
  {
    type: "header",
    group: "Content",
    summary: "Title row at the top of a card, with optional avatar and status badge.",
    example: {
      type: "header",
      title: "Leave request",
      subtitle: "From Rina Wulandari",
      avatar: { fallback: "RW" },
      badge: { label: "Pending", variant: "outline" },
    },
    notes: ["Usually the first child. You can use more than one, e.g. for sections."],
  },
  {
    type: "text",
    group: "Content",
    summary: "A paragraph of text in one of four styles.",
    example: { type: "text", content: "Your order has shipped and should arrive tomorrow.", variant: "muted" },
    notes: ["`title` is for a heading without the header's avatar/badge.", "`caption` suits fine print and timestamps."],
  },
  {
    type: "image",
    group: "Content",
    summary: "An image, optionally cropped to a fixed aspect ratio.",
    example: {
      type: "image",
      src: "https://picsum.photos/seed/docs/800/450",
      alt: "Sample photo",
      aspectRatio: "16:9",
    },
    notes: ["Always set `alt` so screen readers can describe it."],
  },
  {
    type: "divider",
    group: "Content",
    summary: "A thin horizontal line separating sections.",
    example: { type: "divider" },
  },
  {
    type: "badge",
    group: "Content",
    summary: "A small status label.",
    example: { type: "badge", label: "Overdue", variant: "destructive" },
    notes: ["To put a badge next to text, wrap both in a horizontal `stack`."],
  },
  {
    type: "keyValue",
    group: "Data",
    summary: "Label/value rows for amounts, IDs, dates and other facts.",
    example: {
      type: "keyValue",
      items: [
        { label: "Invoice", value: "INV-2026-0042" },
        { label: "Amount", value: "Rp 100.000" },
      ],
    },
    notes: ["Values are plain strings. Format numbers and currency on the backend."],
  },
  {
    type: "list",
    group: "Data",
    summary: "A bulleted or numbered list of short strings.",
    example: { type: "list", items: ["Check your email", "Confirm the code", "You're done"], ordered: true },
  },
  {
    type: "stack",
    group: "Data",
    summary: "Groups nodes vertically or horizontally. The only node that can nest other nodes.",
    example: {
      type: "stack",
      direction: "horizontal",
      align: "between",
      children: [
        { type: "text", content: "Wireless Earbuds", variant: "title" },
        { type: "badge", label: "-20%", variant: "destructive" },
      ],
    },
    notes: [
      "Horizontal stacks wrap onto the next line on narrow screens.",
      "Form fields inside stacks still send their values on `submit`.",
    ],
  },
  {
    type: "button",
    group: "Actions",
    summary: "A single button that triggers an action. See Actions & events.",
    example: {
      type: "button",
      label: "Track package",
      variant: "secondary",
      action: { type: "postback", id: "track_package", payload: { orderId: "A-1029" } },
    },
    notes: ["To show buttons in the footer, put them in an `actions` node at the end of the card."],
  },
  {
    type: "actions",
    group: "Actions",
    summary: "A right-aligned row of buttons. When it's the last child, it renders as the card footer.",
    example: {
      type: "actions",
      children: [
        { type: "button", label: "Reject", variant: "destructive", action: { type: "submit", id: "reject" } },
        { type: "button", label: "Approve", action: { type: "submit", id: "approve" } },
      ],
    },
    notes: ["Put the primary action last (right-most)."],
  },
  {
    type: "input",
    group: "Form",
    summary: "Single-line text field.",
    example: { type: "input", name: "email", label: "Email", placeholder: "you@example.com", inputType: "email" },
    notes: ["`name` must be unique within the card. It becomes the key in `formValues`."],
  },
  {
    type: "textarea",
    group: "Form",
    summary: "Multi-line text field for comments and notes.",
    example: { type: "textarea", name: "comment", label: "Comments", placeholder: "Tell us more" },
  },
  {
    type: "select",
    group: "Form",
    summary: "Dropdown with a fixed list of options.",
    example: {
      type: "select",
      name: "rating",
      label: "Rating",
      placeholder: "Choose a rating",
      options: [
        { label: "Good", value: "good" },
        { label: "Okay", value: "okay" },
        { label: "Poor", value: "poor" },
      ],
    },
    notes: ["Sends `\"\"` if nothing was chosen."],
  },
  {
    type: "checkbox",
    group: "Form",
    summary: "A yes/no toggle with a label.",
    example: { type: "checkbox", name: "subscribe", label: "Email me about updates", defaultChecked: true },
    notes: ["Sends `true` or `false`."],
  },
]

export const docId = (key: string) => `doc-${key}`
