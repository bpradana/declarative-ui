import { createContext, useContext } from "react"
import type { Action } from "@/schema/card"

export type FormValue = string | boolean
export type FormValues = Record<string, FormValue>

export type ActionEvent = {
  cardId?: string
  actionId: string
  type: Action["type"]
  url?: string
  payload?: Record<string, unknown>
  formValues?: FormValues
  timestamp: string
}

type RendererContextValue = {
  values: FormValues
  setValue: (name: string, value: FormValue) => void
  trigger: (action: Action) => void
}

export const RendererContext = createContext<RendererContextValue | null>(null)

export function useRenderer() {
  const ctx = useContext(RendererContext)
  if (!ctx) throw new Error("useRenderer must be used inside <CardRenderer>")
  return ctx
}
