import { loader } from "@monaco-editor/react"
import * as monaco from "monaco-editor"
import EditorWorker from "monaco-editor/editor/editor.worker?worker"
import JsonWorker from "monaco-editor/language/json/json.worker?worker"
import { cardJsonSchema, SCHEMA_URI } from "@/schema/json-schema"

// Bundle Monaco locally instead of loading it from a CDN.
self.MonacoEnvironment = {
  getWorker(_id, label) {
    return label === "json" ? new JsonWorker() : new EditorWorker()
  },
}

monaco.json.jsonDefaults.setDiagnosticsOptions({
  validate: true,
  allowComments: false,
  schemaValidation: "error",
  schemas: [{ uri: SCHEMA_URI, fileMatch: ["*"], schema: cardJsonSchema }],
})

loader.config({ monaco })

export { monaco }
