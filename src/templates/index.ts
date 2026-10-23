import type { Card } from "@/schema/card"

export type Template = { id: string; name: string; card: Card }

export const templates: Template[] = [
  {
    id: "receipt",
    name: "Payment receipt",
    card: {
      version: "1",
      type: "card",
      id: "receipt-INV-2026-0042",
      children: [
        {
          type: "header",
          title: "Payment successful",
          subtitle: "23 Oct 2026, 14:20",
          avatar: { fallback: "PY" },
          badge: { label: "Paid", variant: "secondary" },
        },
        {
          type: "keyValue",
          items: [
            { label: "Invoice", value: "INV-2026-0042" },
            { label: "Merchant", value: "Kopi Kenangan" },
            { label: "Method", value: "QRIS" },
            { label: "Amount", value: "Rp 100.000" },
          ],
        },
        { type: "divider" },
        { type: "text", content: "Keep this receipt for your records.", variant: "caption" },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "View invoice",
              variant: "outline",
              action: { type: "openUrl", id: "view_invoice", url: "https://example.com/invoice/INV-2026-0042" },
            },
            {
              type: "button",
              label: "Report a problem",
              variant: "ghost",
              action: { type: "postback", id: "report_problem", payload: { invoiceId: "INV-2026-0042" } },
            },
          ],
        },
      ],
    },
  },
  {
    id: "approval",
    name: "Approval request",
    card: {
      version: "1",
      type: "card",
      id: "approval-PR-311",
      children: [
        {
          type: "header",
          title: "Leave request",
          subtitle: "From Rina Wulandari",
          avatar: { fallback: "RW" },
          badge: { label: "Pending", variant: "outline" },
        },
        {
          type: "keyValue",
          items: [
            { label: "Type", value: "Annual leave" },
            { label: "Dates", value: "3 – 7 Nov 2026" },
            { label: "Days", value: "5" },
          ],
        },
        { type: "textarea", name: "note", label: "Note (optional)", placeholder: "Add a note for Rina" },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "Reject",
              variant: "destructive",
              action: { type: "submit", id: "leave_reject", payload: { requestId: "PR-311" } },
            },
            {
              type: "button",
              label: "Approve",
              action: { type: "submit", id: "leave_approve", payload: { requestId: "PR-311" } },
            },
          ],
        },
      ],
    },
  },
  {
    id: "notification",
    name: "Notification",
    card: {
      version: "1",
      type: "card",
      children: [
        {
          type: "stack",
          direction: "horizontal",
          align: "between",
          children: [
            { type: "text", content: "Deployment finished", variant: "title" },
            { type: "badge", label: "Production", variant: "default" },
          ],
        },
        { type: "text", content: "api-gateway v2.14.0 was deployed to production in 3m 12s.", variant: "muted" },
        {
          type: "list",
          items: ["Fix rate limiter for burst traffic", "Add /v2/cards endpoint", "Upgrade to Bun 1.4"],
        },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "Open dashboard",
              variant: "secondary",
              action: { type: "openUrl", id: "open_dashboard", url: "https://example.com/deploys/2140" },
            },
          ],
        },
      ],
    },
  },
  {
    id: "survey",
    name: "Feedback form",
    card: {
      version: "1",
      type: "card",
      id: "survey-csat",
      children: [
        { type: "header", title: "How did we do?", subtitle: "Takes less than a minute" },
        {
          type: "select",
          name: "rating",
          label: "Rating",
          placeholder: "Choose a rating",
          options: [
            { label: "Excellent", value: "5" },
            { label: "Good", value: "4" },
            { label: "Okay", value: "3" },
            { label: "Poor", value: "2" },
          ],
        },
        { type: "input", name: "email", label: "Email", placeholder: "you@example.com", inputType: "email" },
        { type: "textarea", name: "comment", label: "Comments", placeholder: "Tell us more" },
        { type: "checkbox", name: "contactMe", label: "You may contact me about this feedback", defaultChecked: true },
        {
          type: "actions",
          children: [
            { type: "button", label: "Send feedback", action: { type: "submit", id: "csat_submit", payload: { surveyId: "csat" } } },
          ],
        },
      ],
    },
  },
  {
    id: "product",
    name: "Product",
    card: {
      version: "1",
      type: "card",
      id: "product-sku-889",
      children: [
        { type: "image", src: "https://picsum.photos/seed/declarative-ui/800/450", alt: "Product photo", aspectRatio: "16:9" },
        {
          type: "stack",
          gap: "sm",
          children: [
            {
              type: "stack",
              direction: "horizontal",
              align: "between",
              children: [
                { type: "text", content: "Wireless Earbuds Pro", variant: "title" },
                { type: "badge", label: "-20%", variant: "destructive" },
              ],
            },
            { type: "text", content: "Rp 1.199.000", variant: "body" },
            { type: "text", content: "Free shipping · Ships in 1 day", variant: "muted" },
          ],
        },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "Details",
              variant: "outline",
              action: { type: "openUrl", id: "product_details", url: "https://example.com/p/889" },
            },
            {
              type: "button",
              label: "Add to cart",
              action: { type: "postback", id: "add_to_cart", payload: { sku: "889", qty: 1 } },
            },
          ],
        },
      ],
    },
  },
]

export const templateSource = (t: Template) => JSON.stringify(t.card, null, 2)
