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

The source of truth is `src/schema/card.ts` (zod). **JSON Schema** in the toolbar downloads the generated `card.schema.json`, which backends can use to validate payloads. **Share** puts the current JSON in the URL hash and copies the link.
