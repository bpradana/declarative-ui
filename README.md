# Card Playground

A playground where backend and frontend engineers design chat cards together. Write card JSON on the left and see it rendered with shadcn/ui on the right.

```bash
bun install
bun run dev      # http://localhost:5173
bun test         # schema, share-link, and renderer tests
bun run build
```

## Card format (v1)

```json
{ "version": "1", "type": "card", "id": "optional", "children": [ ...nodes ] }
```

| Group | Nodes |
|---|---|
| Content | `header`, `text`, `image`, `divider`, `badge` |
| Data | `keyValue`, `list`, `stack` (nests other nodes) |
| Actions | `button`, `actions` (trailing `actions` render as the card footer) |
| Form | `input`, `textarea`, `select`, `checkbox` (each has a `name`) |

Actions are `{ "type": "submit" | "postback" | "openUrl", "id", "url"?, "payload"? }`. A `submit` sends the values of every named field as `formValues`. The **Action log** under the preview shows the exact event the backend would receive.

**Docs** in the toolbar (or press `?`) opens a side panel covering every component. Each one has several live examples whose JSON you can copy or insert into the card, and a field table. The field tables are generated from the schema, so they stay in sync with it. Hand-written summaries and examples live in `src/docs/components.ts`.

**Templates** has 15 ready-made cards grouped by category (payments, workflow, forms, commerce, notifications, layout). They live in `src/templates/index.ts`.

The source of truth is `src/schema/card.ts` (zod). **Share** puts the current JSON in the URL hash and copies the link.

## Validation

Form fields can declare rules: `required` (all fields; for a checkbox it means "must be ticked"), `minLength`/`maxLength` (`input`, `textarea`), and `pattern` + `patternMessage` (`input`). `inputType: "email"` and `"number"` are checked too. A `submit` with invalid values is not sent. The errors show under the fields and clear as they're fixed, and the Action log records a **Blocked** entry. Backends should still re-check what they receive.

## Export

**Export** generates code from the schema, so it always matches it:

- **TypeScript** types and **Go** structs for the card format and the `ActionEvent` the backend receives (Go's `Node` decodes into the concrete node struct).
- A starter **handler** (Go `net/http` or TypeScript Express) that switches on every action id in the current card and re-checks required fields.
- The **JSON Schema** (`card.schema.json`) for validating payloads.

Tests type-check every template against the generated TypeScript and, when Go is installed, round-trip every template through the generated Go structs and `go vet` the handlers.

## Undo and saved cards

- **Undo / redo** (⌘Z / ⇧⌘Z, or the toolbar arrows) is one history shared by the JSON editor, the visual editor, template switches and inserts. A burst of typing is one step.
- **My cards** saves cards in this browser (localStorage). ⌘S / Ctrl+S saves the open card, or asks for a name the first time. A dot next to its name in the header means there are unsaved changes.

## Visual editor

Switch the editor from **JSON** to **Visual** to build a card without writing JSON:

- **Structure** shows the node tree. Add nodes (at the root, or inside a `stack`/`actions`), duplicate them or delete them. Drag the grip to move a node anywhere, including into or out of a `stack` and between `actions` rows; invalid drops (e.g. text into `actions`) show red and are ignored. The ↑/↓ buttons move a node within its parent.
- The **property form** below the tree is generated from the schema. Use it to edit the selected node, or the card itself when nothing is selected. Optional fields can be cleared, and `payload` is edited as JSON.
- **Select** in the preview toolbar (on by default in Visual mode) lets you click any node in the rendered card to edit it. Turn it off to try the buttons and fields again.

The JSON stays the single source of truth: every visual edit rewrites it, so both views always match. Schema errors for the selected node show above its form.

## Mobile

Below 768px wide, the editor, preview and action log become tabs at the bottom of the screen, and Format / JSON Schema move into the **⋯** menu.
