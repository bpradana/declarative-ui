import type { Card } from "@/schema/card"

export type TemplateCategory = "Payments" | "Workflow" | "Forms" | "Commerce" | "Notifications" | "Layout"

export type Template = { id: string; name: string; category: TemplateCategory; card: Card }

export const TEMPLATE_CATEGORIES: TemplateCategory[] = ["Payments", "Workflow", "Forms", "Commerce", "Notifications", "Layout"]

export const templates: Template[] = [
  {
    id: "receipt",
    name: "Payment receipt",
    category: "Payments",
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
    category: "Workflow",
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
    name: "Deployment notice",
    category: "Notifications",
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
    category: "Forms",
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
    category: "Commerce",
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
  {
    id: "transfer",
    name: "Transfer confirmation",
    category: "Payments",
    card: {
      version: "1",
      type: "card",
      id: "transfer-TRF-7781",
      children: [
        {
          type: "header",
          title: "Confirm transfer",
          subtitle: "Review the details before sending",
          avatar: { fallback: "BA" },
          badge: { label: "Needs review", variant: "outline" },
        },
        {
          type: "keyValue",
          items: [
            { label: "To", value: "Budi Santoso" },
            { label: "Bank", value: "BCA · 1234567890" },
            { label: "Amount", value: "Rp 2.500.000" },
            { label: "Fee", value: "Rp 0" },
          ],
        },
        { type: "input", name: "reference", label: "Reference", placeholder: "e.g. Rent November" },
        { type: "text", content: "Transfers above Rp 10.000.000 need an extra PIN check.", variant: "caption" },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "Cancel",
              variant: "outline",
              action: { type: "postback", id: "transfer_cancel", payload: { transferId: "TRF-7781" } },
            },
            {
              type: "button",
              label: "Send money",
              action: { type: "submit", id: "transfer_confirm", payload: { transferId: "TRF-7781" } },
            },
          ],
        },
      ],
    },
  },
  {
    id: "otp",
    name: "Verification code",
    category: "Forms",
    card: {
      version: "1",
      type: "card",
      id: "otp-login",
      children: [
        { type: "header", title: "Enter verification code", subtitle: "Sent by SMS to +62 812-••••-3021" },
        { type: "input", name: "code", label: "6-digit code", placeholder: "123456", inputType: "number" },
        { type: "checkbox", name: "trustDevice", label: "Trust this device for 30 days" },
        { type: "text", content: "The code expires in 5 minutes.", variant: "caption" },
        {
          type: "actions",
          children: [
            { type: "button", label: "Resend code", variant: "ghost", action: { type: "postback", id: "otp_resend" } },
            { type: "button", label: "Verify", action: { type: "submit", id: "otp_verify", payload: { flow: "login" } } },
          ],
        },
      ],
    },
  },
  {
    id: "poll",
    name: "Team poll",
    category: "Forms",
    card: {
      version: "1",
      type: "card",
      id: "poll-offsite-2026",
      children: [
        {
          type: "header",
          title: "Where should we hold the offsite?",
          subtitle: "Poll closes Friday, 17:00",
          badge: { label: "Anonymous", variant: "secondary" },
        },
        {
          type: "select",
          name: "venue",
          label: "Venue",
          placeholder: "Pick one",
          options: [
            { label: "Bandung", value: "bandung" },
            { label: "Bali", value: "bali" },
            { label: "Yogyakarta", value: "yogyakarta" },
          ],
        },
        {
          type: "stack",
          gap: "sm",
          children: [
            { type: "text", content: "Activities you'd join", variant: "muted" },
            { type: "checkbox", name: "hiking", label: "Hiking" },
            { type: "checkbox", name: "cooking", label: "Cooking class" },
            { type: "checkbox", name: "karaoke", label: "Karaoke" },
          ],
        },
        {
          type: "actions",
          children: [{ type: "button", label: "Vote", action: { type: "submit", id: "poll_vote", payload: { pollId: "offsite-2026" } } }],
        },
      ],
    },
  },
  {
    id: "esign",
    name: "Signature request",
    category: "Workflow",
    card: {
      version: "1",
      type: "card",
      id: "esign-DOC-5510",
      children: [
        {
          type: "header",
          title: "Employment contract",
          subtitle: "Sent by HR · PT Maju Jaya",
          avatar: { fallback: "HR" },
          badge: { label: "Awaiting you", variant: "default" },
        },
        {
          type: "keyValue",
          items: [
            { label: "Document", value: "DOC-5510.pdf" },
            { label: "Pages", value: "12" },
            { label: "Signers", value: "2 of 3 signed" },
            { label: "Due", value: "30 Oct 2026" },
          ],
        },
        {
          type: "button",
          label: "Read document",
          variant: "link",
          action: { type: "openUrl", id: "esign_open", url: "https://example.com/docs/DOC-5510" },
        },
        { type: "checkbox", name: "agree", label: "I have read and agree to the document" },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "Decline",
              variant: "destructive",
              action: { type: "submit", id: "esign_decline", payload: { documentId: "DOC-5510" } },
            },
            { type: "button", label: "Sign", action: { type: "submit", id: "esign_sign", payload: { documentId: "DOC-5510" } } },
          ],
        },
      ],
    },
  },
  {
    id: "order-tracking",
    name: "Order tracking",
    category: "Commerce",
    card: {
      version: "1",
      type: "card",
      id: "order-A-1029",
      children: [
        {
          type: "stack",
          direction: "horizontal",
          align: "between",
          children: [
            { type: "text", content: "Order #A-1029", variant: "title" },
            { type: "badge", label: "On the way", variant: "secondary" },
          ],
        },
        { type: "text", content: "Arriving tomorrow, 09:00 – 12:00", variant: "muted" },
        {
          type: "list",
          ordered: true,
          items: ["Order placed · 25 Oct", "Packed · 26 Oct", "Picked up by courier · 26 Oct", "Out for delivery"],
        },
        { type: "divider" },
        {
          type: "keyValue",
          items: [
            { label: "Courier", value: "JNE REG" },
            { label: "Tracking no.", value: "JN0012345678" },
          ],
        },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "Contact seller",
              variant: "ghost",
              action: { type: "postback", id: "contact_seller", payload: { orderId: "A-1029" } },
            },
            {
              type: "button",
              label: "Track package",
              action: { type: "openUrl", id: "track_package", url: "https://example.com/track/JN0012345678" },
            },
          ],
        },
      ],
    },
  },
  {
    id: "booking",
    name: "Booking confirmation",
    category: "Commerce",
    card: {
      version: "1",
      type: "card",
      id: "booking-HTL-3390",
      children: [
        { type: "image", src: "https://picsum.photos/seed/hotel-room/800/600", alt: "Hotel room", aspectRatio: "4:3" },
        {
          type: "header",
          title: "Hotel Santika Bandung",
          subtitle: "Deluxe King · 2 nights",
          badge: { label: "Confirmed", variant: "secondary" },
        },
        {
          type: "keyValue",
          items: [
            { label: "Check-in", value: "Fri, 7 Nov · 14:00" },
            { label: "Check-out", value: "Sun, 9 Nov · 12:00" },
            { label: "Guests", value: "2 adults" },
            { label: "Total", value: "Rp 1.840.000" },
          ],
        },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "Cancel booking",
              variant: "ghost",
              action: { type: "postback", id: "booking_cancel", payload: { bookingId: "HTL-3390" } },
            },
            {
              type: "button",
              label: "Reschedule",
              variant: "outline",
              action: { type: "postback", id: "booking_reschedule", payload: { bookingId: "HTL-3390" } },
            },
          ],
        },
      ],
    },
  },
  {
    id: "incident",
    name: "Incident alert",
    category: "Notifications",
    card: {
      version: "1",
      type: "card",
      id: "incident-INC-204",
      children: [
        {
          type: "stack",
          direction: "horizontal",
          align: "between",
          children: [
            { type: "text", content: "High error rate on payments-api", variant: "title" },
            { type: "badge", label: "SEV-2", variant: "destructive" },
          ],
        },
        { type: "text", content: "5xx rate is 7.4% (threshold 2%) for the last 10 minutes.", variant: "muted" },
        {
          type: "keyValue",
          items: [
            { label: "Started", value: "27 Oct 2026, 10:42" },
            { label: "Region", value: "ap-southeast-3" },
            { label: "On-call", value: "@dimas" },
          ],
        },
        { type: "text", content: "Suggested next steps", variant: "body" },
        { type: "list", items: ["Check the last deploy (v3.8.1)", "Look at database connection pool", "Roll back if not fixed in 15 min"] },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "Runbook",
              variant: "outline",
              action: { type: "openUrl", id: "incident_runbook", url: "https://example.com/runbooks/payments-5xx" },
            },
            {
              type: "button",
              label: "Acknowledge",
              action: { type: "postback", id: "incident_ack", payload: { incidentId: "INC-204" } },
            },
          ],
        },
      ],
    },
  },
  {
    id: "contact",
    name: "Contact card",
    category: "Notifications",
    card: {
      version: "1",
      type: "card",
      id: "contact-u-118",
      children: [
        {
          type: "header",
          title: "Sari Lestari",
          subtitle: "Account manager · Online",
          avatar: { src: "https://i.pravatar.cc/96?img=47", fallback: "SL" },
        },
        { type: "text", content: "Hi! I'll be your contact for onboarding. Reach out any time on weekdays." },
        {
          type: "keyValue",
          items: [
            { label: "Email", value: "sari@example.com" },
            { label: "Phone", value: "+62 811-2345-678" },
            { label: "Hours", value: "Mon–Fri, 09:00–17:00" },
          ],
        },
        {
          type: "actions",
          children: [
            {
              type: "button",
              label: "Schedule a call",
              variant: "outline",
              action: { type: "openUrl", id: "contact_schedule", url: "https://example.com/calendar/sari" },
            },
            { type: "button", label: "Message", action: { type: "postback", id: "contact_message", payload: { userId: "u-118" } } },
          ],
        },
      ],
    },
  },
  {
    id: "layout",
    name: "Layout showcase",
    category: "Layout",
    card: {
      version: "1",
      type: "card",
      id: "layout-demo",
      children: [
        { type: "header", title: "Stacks in stacks", subtitle: "Nesting, gap and alignment" },
        {
          type: "stack",
          direction: "horizontal",
          align: "between",
          children: [
            {
              type: "stack",
              gap: "sm",
              children: [
                { type: "text", content: "Plan", variant: "caption" },
                { type: "text", content: "Business", variant: "title" },
              ],
            },
            {
              type: "stack",
              gap: "sm",
              align: "end",
              children: [
                { type: "text", content: "Renews", variant: "caption" },
                { type: "text", content: "1 Dec 2026", variant: "title" },
              ],
            },
          ],
        },
        { type: "divider" },
        {
          type: "stack",
          direction: "horizontal",
          gap: "sm",
          children: [
            { type: "badge", label: "SSO", variant: "outline" },
            { type: "badge", label: "Audit log", variant: "outline" },
            { type: "badge", label: "50 seats", variant: "outline" },
            { type: "badge", label: "Priority support", variant: "secondary" },
          ],
        },
        {
          type: "stack",
          align: "center",
          gap: "lg",
          children: [
            { type: "text", content: "Centered content in a vertical stack", variant: "muted" },
            {
              type: "button",
              label: "Compare plans",
              variant: "secondary",
              action: { type: "openUrl", id: "compare_plans", url: "https://example.com/pricing" },
            },
          ],
        },
        {
          type: "actions",
          children: [{ type: "button", label: "Manage plan", action: { type: "postback", id: "manage_plan" } }],
        },
      ],
    },
  },
]

export const templateSource = (t: Template) => JSON.stringify(t.card, null, 2)
