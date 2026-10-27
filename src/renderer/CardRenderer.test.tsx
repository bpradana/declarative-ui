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

test("inspect mode tags every node with its path", () => {
  const result = parseCard(templateSource(templates.find((t) => t.id === "notification")!))
  if (!result.ok) throw new Error("template invalid")
  const plain = renderToString(<CardRenderer card={result.card} onAction={() => {}} />)
  expect(plain).not.toContain("data-path")
  const html = renderToString(
    <CardRenderer card={result.card} onAction={() => {}} inspect={{ selected: [0, 1], onSelect: () => {} }} />,
  )
  // Nested stack children and footer buttons get their own paths.
  for (const path of ["0", "0.0", "0.1", "1", "2", "3", "3.0"]) expect(html).toContain(`data-path="${path}"`)
})
