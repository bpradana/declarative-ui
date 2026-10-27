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

The source of truth is `src/schema/card.ts` (zod). **JSON Schema** in the toolbar downloads the generated `card.schema.json`, which backends can use to validate payloads. **Share** puts the current JSON in the URL hash and copies the link.

## Visual editor

Switch the editor from **JSON** to **Visual** to build a card without writing JSON:

- **Structure** shows the node tree. Add nodes (at the root, or inside a `stack`/`actions`), move them up and down, duplicate them or delete them.
- The **property form** below the tree is generated from the schema. Use it to edit the selected node, or the card itself when nothing is selected. Optional fields can be cleared, and `payload` is edited as JSON.
- **Select** in the preview toolbar (on by default in Visual mode) lets you click any node in the rendered card to edit it. Turn it off to try the buttons and fields again.

The JSON stays the single source of truth: every visual edit rewrites it, so both views always match. Schema errors for the selected node show above its form.

## Mobile

Below 768px wide, the editor, preview and action log become tabs at the bottom of the screen, and Format / JSON Schema move into the **⋯** menu.
