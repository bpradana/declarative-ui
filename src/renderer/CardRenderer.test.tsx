import { expect, test } from "bun:test"
import { renderToString } from "react-dom/server"
import { parseCard } from "@/schema/card"
import { templates, templateSource } from "@/templates"
import { CardRenderer } from "./CardRenderer"

test.each(templates.map((t) => [t.id, t] as const))("renders template %s", (_id, t) => {
  const result = parseCard(templateSource(t))
  if (!result.ok) throw new Error("template invalid")
  const html = renderToString(<CardRenderer card={result.card} onAction={() => {}} />)
  expect(html).toContain('data-slot="card"')
  // Trailing `actions` nodes land in the footer.
  expect(html).toContain('data-slot="card-footer"')
})
