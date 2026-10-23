import { expect, test } from "bun:test"
import { decodeCardHash, encodeCardHash } from "./share"

test("hash round-trips card source", () => {
  const source = JSON.stringify({ version: "1", type: "card", children: [{ type: "text", content: "Halo 👋 Rp 100.000" }] })
  const hash = encodeCardHash(source)
  expect(hash.startsWith("#card=")).toBe(true)
  expect(decodeCardHash(hash)).toBe(source)
})

test("ignores unrelated hashes", () => {
  expect(decodeCardHash("#something")).toBeNull()
  expect(decodeCardHash("")).toBeNull()
})
