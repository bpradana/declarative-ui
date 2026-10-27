import type { CardNode } from "@/schema/card"

export type DocGroup = "Content" | "Data" | "Actions" | "Form"

export type DocExample = { title: string; node: CardNode }

export type ComponentDoc = {
  type: CardNode["type"]
  group: DocGroup
  summary: string
  /** The first example is also the default node the visual editor inserts. */
  examples: [DocExample, ...DocExample[]]
  notes?: string[]
}

export const GROUPS: DocGroup[] = ["Content", "Data", "Actions", "Form"]

export const componentDocs: ComponentDoc[] = [
  {
    type: "header",
    group: "Content",
    summary: "Title row at the top of a card, with optional avatar and status badge.",
    examples: [
      {
        title: "Avatar and badge",
        node: {
          type: "header",
          title: "Leave request",
          subtitle: "From Rina Wulandari",
          avatar: { fallback: "RW" },
          badge: { label: "Pending", variant: "outline" },
        },
      },
      { title: "Title only", node: { type: "header", title: "How did we do?" } },
      {
        title: "Avatar image",
        node: {
          type: "header",
          title: "Sari Lestari",
          subtitle: "Account manager",
          avatar: { src: "https://i.pravatar.cc/96?img=47", fallback: "SL" },
        },
      },
      {
        title: "Destructive badge",
        node: { type: "header", title: "Payment failed", subtitle: "Card declined", badge: { label: "Failed", variant: "destructive" } },
      },
    ],
    notes: ["Usually the first child. You can use more than one, e.g. for sections."],
  },
  {
    type: "text",
    group: "Content",
    summary: "A paragraph of text in one of four styles.",
    examples: [
      { title: "Muted", node: { type: "text", content: "Your order has shipped and should arrive tomorrow.", variant: "muted" } },
      { title: "Body (default)", node: { type: "text", content: "Thanks for your payment. A receipt is on its way." } },
      { title: "Title", node: { type: "text", content: "Order summary", variant: "title" } },
      { title: "Caption", node: { type: "text", content: "Updated 2 minutes ago", variant: "caption" } },
      { title: "Multiple lines", node: { type: "text", content: "Line one\nLine two\nLine three" } },
    ],
    notes: ["`title` is for a heading without the header's avatar/badge.", "`caption` suits fine print and timestamps."],
  },
  {
    type: "image",
    group: "Content",
    summary: "An image, optionally cropped to a fixed aspect ratio.",
    examples: [
      {
        title: "16:9",
        node: { type: "image", src: "https://picsum.photos/seed/docs/800/450", alt: "Sample photo", aspectRatio: "16:9" },
      },
      {
        title: "Square",
        node: { type: "image", src: "https://picsum.photos/seed/square/600/600", alt: "Square photo", aspectRatio: "1:1" },
      },
      { title: "Natural size", node: { type: "image", src: "https://picsum.photos/seed/natural/800/300", alt: "Wide banner" } },
    ],
    notes: ["Always set `alt` so screen readers can describe it."],
  },
  {
    type: "divider",
    group: "Content",
    summary: "A thin horizontal line separating sections.",
    examples: [{ title: "Divider", node: { type: "divider" } }],
  },
  {
    type: "badge",
    group: "Content",
    summary: "A small status label.",
    examples: [
      { title: "Destructive", node: { type: "badge", label: "Overdue", variant: "destructive" } },
      { title: "Default", node: { type: "badge", label: "New" } },
      { title: "Secondary", node: { type: "badge", label: "Paid", variant: "secondary" } },
      { title: "Outline", node: { type: "badge", label: "Draft", variant: "outline" } },
    ],
    notes: ["To put a badge next to text, wrap both in a horizontal `stack`."],
  },
  {
    type: "keyValue",
    group: "Data",
    summary: "Label/value rows for amounts, IDs, dates and other facts.",
    examples: [
      {
        title: "Invoice",
        node: {
          type: "keyValue",
          items: [
            { label: "Invoice", value: "INV-2026-0042" },
            { label: "Amount", value: "Rp 100.000" },
          ],
        },
      },
      {
        title: "Shipping details",
        node: {
          type: "keyValue",
          items: [
            { label: "Courier", value: "JNE REG" },
            { label: "Tracking no.", value: "JN0012345678" },
            { label: "Estimate", value: "1–2 days" },
            { label: "Address", value: "Jl. Sudirman No. 1, Jakarta" },
          ],
        },
      },
    ],
    notes: ["Values are plain strings. Format numbers and currency on the backend."],
  },
  {
    type: "list",
    group: "Data",
    summary: "A bulleted or numbered list of short strings.",
    examples: [
      { title: "Numbered", node: { type: "list", items: ["Check your email", "Confirm the code", "You're done"], ordered: true } },
      { title: "Bulleted", node: { type: "list", items: ["Free shipping", "30-day returns", "1-year warranty"] } },
    ],
  },
  {
    type: "stack",
    group: "Data",
    summary: "Groups nodes vertically or horizontally. The only node that can nest other nodes.",
    examples: [
      {
        title: "Horizontal, spread apart",
        node: {
          type: "stack",
          direction: "horizontal",
          align: "between",
          children: [
            { type: "text", content: "Wireless Earbuds", variant: "title" },
            { type: "badge", label: "-20%", variant: "destructive" },
          ],
        },
      },
      {
        title: "Horizontal row of badges",
        node: {
          type: "stack",
          direction: "horizontal",
          gap: "sm",
          children: [
            { type: "badge", label: "SSO", variant: "outline" },
            { type: "badge", label: "Audit log", variant: "outline" },
            { type: "badge", label: "API", variant: "outline" },
          ],
        },
      },
      {
        title: "Vertical, centered",
        node: {
          type: "stack",
          align: "center",
          gap: "sm",
          children: [
            { type: "text", content: "Rp 1.199.000", variant: "title" },
            { type: "text", content: "Free shipping", variant: "caption" },
          ],
        },
      },
      {
        title: "Nested stacks",
        node: {
          type: "stack",
          direction: "horizontal",
          align: "between",
          children: [
            {
              type: "stack",
              gap: "sm",
              children: [
                { type: "text", content: "From", variant: "caption" },
                { type: "text", content: "Jakarta (CGK)", variant: "title" },
              ],
            },
            {
              type: "stack",
              gap: "sm",
              align: "end",
              children: [
                { type: "text", content: "To", variant: "caption" },
                { type: "text", content: "Bali (DPS)", variant: "title" },
              ],
            },
          ],
        },
      },
    ],
    notes: [
      "Horizontal stacks wrap onto the next line on narrow screens.",
      "Form fields inside stacks still send their values on `submit`.",
    ],
  },
  {
    type: "button",
    group: "Actions",
    summary: "A single button that triggers an action. See Actions & events.",
    examples: [
      {
        title: "Postback",
        node: {
          type: "button",
          label: "Track package",
          variant: "secondary",
          action: { type: "postback", id: "track_package", payload: { orderId: "A-1029" } },
        },
      },
      {
        title: "Submit form values",
        node: { type: "button", label: "Send", action: { type: "submit", id: "send_form", payload: { formId: "contact" } } },
      },
      {
        title: "Open a link",
        node: {
          type: "button",
          label: "View on web",
          variant: "link",
          action: { type: "openUrl", id: "view_web", url: "https://example.com" },
        },
      },
      {
        title: "Destructive",
        node: { type: "button", label: "Delete", variant: "destructive", action: { type: "postback", id: "delete_item" } },
      },
    ],
    notes: ["To show buttons in the footer, put them in an `actions` node at the end of the card."],
  },
  {
    type: "actions",
    group: "Actions",
    summary: "A right-aligned row of buttons. When it's the last child, it renders as the card footer.",
    examples: [
      {
        title: "Approve / reject",
        node: {
          type: "actions",
          children: [
            { type: "button", label: "Reject", variant: "destructive", action: { type: "submit", id: "reject" } },
            { type: "button", label: "Approve", action: { type: "submit", id: "approve" } },
          ],
        },
      },
      {
        title: "Single primary",
        node: { type: "actions", children: [{ type: "button", label: "Continue", action: { type: "postback", id: "continue" } }] },
      },
      {
        title: "Three buttons",
        node: {
          type: "actions",
          children: [
            { type: "button", label: "Later", variant: "ghost", action: { type: "postback", id: "later" } },
            { type: "button", label: "Details", variant: "outline", action: { type: "openUrl", id: "details", url: "https://example.com" } },
            { type: "button", label: "Pay now", action: { type: "postback", id: "pay_now" } },
          ],
        },
      },
    ],
    notes: ["Put the primary action last (right-most)."],
  },
  {
    type: "input",
    group: "Form",
    summary: "Single-line text field.",
    examples: [
      { title: "Email", node: { type: "input", name: "email", label: "Email", placeholder: "you@example.com", inputType: "email" } },
      { title: "Text", node: { type: "input", name: "fullName", label: "Full name", placeholder: "Rina Wulandari" } },
      { title: "Number", node: { type: "input", name: "quantity", label: "Quantity", placeholder: "1", inputType: "number" } },
      { title: "No label", node: { type: "input", name: "search", placeholder: "Search orders…" } },
      {
        title: "With validation",
        node: {
          type: "input",
          name: "postalCode",
          label: "Postal code",
          placeholder: "12345",
          required: true,
          pattern: "\\d{5}",
          patternMessage: "Postal codes have 5 digits",
        },
      },
    ],
    notes: ["`name` must be unique within the card. It becomes the key in `formValues`."],
  },
  {
    type: "textarea",
    group: "Form",
    summary: "Multi-line text field for comments and notes.",
    examples: [
      { title: "With label", node: { type: "textarea", name: "comment", label: "Comments", placeholder: "Tell us more" } },
      { title: "No label", node: { type: "textarea", name: "reason", placeholder: "Reason for cancelling (optional)" } },
      {
        title: "With validation",
        node: { type: "textarea", name: "summary", label: "Summary", required: true, minLength: 10, maxLength: 200 },
      },
    ],
  },
  {
    type: "select",
    group: "Form",
    summary: "Dropdown with a fixed list of options.",
    examples: [
      {
        title: "Rating",
        node: {
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
      },
      {
        title: "Time slot",
        node: {
          type: "select",
          name: "slot",
          label: "Delivery slot",
          placeholder: "Pick a time",
          options: [
            { label: "Morning (09:00 – 12:00)", value: "morning" },
            { label: "Afternoon (12:00 – 15:00)", value: "afternoon" },
            { label: "Evening (15:00 – 18:00)", value: "evening" },
          ],
        },
      },
      {
        title: "Required",
        node: {
          type: "select",
          name: "size",
          label: "Size",
          placeholder: "Choose a size",
          required: true,
          options: [
            { label: "S", value: "s" },
            { label: "M", value: "m" },
            { label: "L", value: "l" },
          ],
        },
      },
    ],
    notes: ["Sends `\"\"` if nothing was chosen."],
  },
  {
    type: "checkbox",
    group: "Form",
    summary: "A yes/no toggle with a label.",
    examples: [
      { title: "Checked by default", node: { type: "checkbox", name: "subscribe", label: "Email me about updates", defaultChecked: true } },
      { title: "Unchecked", node: { type: "checkbox", name: "agree", label: "I agree to the terms" } },
      { title: "Required", node: { type: "checkbox", name: "terms", label: "I accept the terms of service", required: true } },
    ],
    notes: ["Sends `true` or `false`."],
  },
]

export const docFor = (type: CardNode["type"]) => componentDocs.find((d) => d.type === type)!

export const docId = (key: string) => `doc-${key}`
