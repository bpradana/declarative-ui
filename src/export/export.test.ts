import { describe, expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { templates } from "@/templates"
import { generateGo } from "./go"
import { collectCardIO, generateGoHandler, generateTsHandler } from "./handler"
import { nodeDefNames } from "./schema"
import { generateTypeScript } from "./typescript"

const run = (cmd: string[], cwd: string) => {
  const proc = Bun.spawnSync(cmd, { cwd, stderr: "pipe", stdout: "pipe" })
  return { ok: proc.exitCode === 0, output: `${proc.stdout.toString()}${proc.stderr.toString()}` }
}

describe("TypeScript export", () => {
  const ts = generateTypeScript()

  test("declares every node type, Node, Card and ActionEvent", () => {
    for (const name of [...nodeDefNames, "Node", "Card", "Action", "ActionEvent"]) {
      expect(ts).toContain(`export type ${name} =`)
    }
    expect(ts).toMatch(/\n {2}title: string\n/) // required
    expect(ts).toContain("subtitle?: string") // optional
  })

  test("every template type-checks against the generated types", () => {
    const dir = mkdtempSync(join(tmpdir(), "card-ts-"))
    writeFileSync(join(dir, "card.ts"), ts)
    writeFileSync(
      join(dir, "check.ts"),
      `import type { Card } from "./card"\nexport const cards: Card[] = ${JSON.stringify(templates.map((t) => t.card))}\n`,
    )
    const tsc = join(import.meta.dir, "../../node_modules/.bin/tsc")
    const result = run([tsc, "--noEmit", "--strict", "--target", "es2022", "--module", "esnext", "check.ts"], dir)
    expect(result.output).toBe("")
  }, 30_000)
})

describe("Go export", () => {
  const go = generateGo()

  test("declares every node struct and marks optional fields omitempty", () => {
    for (const name of [...nodeDefNames, "Card", "Action", "ActionEvent", "Node"]) {
      expect(go).toContain(`type ${name} struct`)
    }
    expect(go).toMatch(/Title +string +`json:"title"`/)
    expect(go).toMatch(/Subtitle +string +`json:"subtitle,omitempty"`/)
  })

  test.skipIf(!Bun.which("go"))(
    "is gofmt-clean, vets, and round-trips every template",
    () => {
      const dir = mkdtempSync(join(tmpdir(), "card-go-"))
      writeFileSync(join(dir, "go.mod"), "module example.com/card\n\ngo 1.22\n")
      writeFileSync(join(dir, "card.go"), go)
      writeFileSync(join(dir, "templates.json"), JSON.stringify(templates.map((t) => t.card)))
      writeFileSync(
        join(dir, "card_test.go"),
        `package card

import (
	"encoding/json"
	"os"
	"reflect"
	"testing"
)

func TestRoundTrip(t *testing.T) {
	data, err := os.ReadFile("templates.json")
	if err != nil {
		t.Fatal(err)
	}
	var raw []any
	var cards []Card
	if err := json.Unmarshal(data, &raw); err != nil {
		t.Fatal(err)
	}
	if err := json.Unmarshal(data, &cards); err != nil {
		t.Fatal(err)
	}
	out, _ := json.Marshal(cards)
	var back []any
	_ = json.Unmarshal(out, &back)
	if !reflect.DeepEqual(raw, back) {
		t.Fatalf("round trip changed the cards:\\n%s", out)
	}
}
`,
      )
      expect(run(["gofmt", "-l", "card.go"], dir).output).toBe("")
      const vet = run(["go", "vet", "./..."], dir)
      expect(vet.output).toBe("")
      const result = run(["go", "test", "./..."], dir)
      if (!result.ok) throw new Error(result.output)
    },
    60_000,
  )
})

describe("handlers", () => {
  const approval = templates.find((t) => t.id === "approval")!.card

  test("collects the card's actions and fields", () => {
    const { actions, fields } = collectCardIO(approval)
    expect(actions.map((a) => a.id)).toEqual(["leave_reject", "leave_approve"])
    expect(fields).toEqual([{ name: "note", kind: "string", required: false }])
  })

  test("both handlers switch on every action id", () => {
    for (const code of [generateGoHandler(approval), generateTsHandler(approval)]) {
      expect(code).toContain('case "leave_reject"')
      expect(code).toContain('case "leave_approve"')
    }
  })

  test.skipIf(!Bun.which("go"))(
    "Go handlers vet for every template",
    () => {
      // One module with a package per template, so Go only starts once.
      const dir = mkdtempSync(join(tmpdir(), "card-handler-"))
      writeFileSync(join(dir, "go.mod"), "module example.com/handlers\n\ngo 1.22\n")
      for (const t of templates) {
        mkdirSync(join(dir, t.id))
        writeFileSync(join(dir, t.id, "handler.go"), generateGoHandler(t.card))
      }
      expect(run(["gofmt", "-l", "."], dir).output).toBe("")
      const vet = run(["go", "vet", "./..."], dir)
      if (!vet.ok) throw new Error(vet.output)
    },
    120_000,
  )
})
