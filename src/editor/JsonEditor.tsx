import Editor, { type OnMount } from "@monaco-editor/react"
import { findNodeAtLocation, parseTree } from "jsonc-parser"
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import "./monaco"
import type { monaco } from "./monaco"

export type JsonEditorHandle = {
  format: () => void
  revealPath: (path: (string | number)[]) => void
}

type Props = {
  value: string
  onChange: (value: string) => void
  /** Undo/redo go to the app's shared history instead of Monaco's own stack. */
  onUndo: () => void
  onRedo: () => void
}

export const JsonEditor = forwardRef<JsonEditorHandle, Props>(function JsonEditor(
  { value, onChange, onUndo, onRedo },
  ref,
) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  // Commands are registered once on mount, so they read the latest callbacks through a ref.
  const historyRef = useRef({ onUndo, onRedo })
  useEffect(() => {
    historyRef.current = { onUndo, onRedo }
  })

  useImperativeHandle(ref, () => ({
    format() {
      editorRef.current?.getAction("editor.action.formatDocument")?.run()
    },
    revealPath(path) {
      const editor = editorRef.current
      const model = editor?.getModel()
      if (!editor || !model) return
      const root = parseTree(model.getValue())
      // Fall back to the closest existing ancestor (e.g. a missing property's parent object).
      let node = root
      for (let i = path.length; i >= 0 && root; i--) {
        node = findNodeAtLocation(root, path.slice(0, i))
        if (node) break
      }
      if (!node) return
      const position = model.getPositionAt(node.parent?.type === "property" ? node.parent.offset : node.offset)
      editor.setPosition(position)
      editor.revealPositionInCenter(position)
      editor.focus()
    },
  }))

  const handleMount: OnMount = (editor, m) => {
    editorRef.current = editor
    const { KeyMod, KeyCode } = m
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyZ, () => historyRef.current.onUndo())
    editor.addCommand(KeyMod.CtrlCmd | KeyMod.Shift | KeyCode.KeyZ, () => historyRef.current.onRedo())
    editor.addCommand(KeyMod.CtrlCmd | KeyCode.KeyY, () => historyRef.current.onRedo())
  }

  return (
    <Editor
      language="json"
      path="card.json"
      value={value}
      onChange={(v) => onChange(v ?? "")}
      onMount={handleMount}
      theme="vs"
      options={{
        minimap: { enabled: false },
        fontSize: 13,
        tabSize: 2,
        scrollBeyondLastLine: false,
        automaticLayout: true,
        formatOnPaste: true,
        fixedOverflowWidgets: true,
      }}
    />
  )
})
