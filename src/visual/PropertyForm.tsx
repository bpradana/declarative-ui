import { PlusIcon, XIcon } from "lucide-react"
import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { defs, type JsonSchema } from "@/docs/props"
import { cn } from "@/lib/utils"

type Obj = Record<string, unknown>

/** Fields the form never shows: `type` is fixed per node and `children` is edited in the tree. */
const HIDDEN = new Set(["type", "children", "$schema", "version"])

const DEFAULT = "__default"

const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v)

const resolve = (s: JsonSchema): JsonSchema => (s.$ref ? defs[s.$ref.split("/").pop()!] : s)

const actionVariants = () => resolve({ $ref: "#/$defs/Action" }).oneOf ?? []

/** Smallest value that satisfies `s`, used when adding rows or turning on optional objects. */
function emptyValue(s: JsonSchema): unknown {
  s = resolve(s)
  if (s.const !== undefined) return s.const
  if (s.oneOf) return emptyValue(s.oneOf[0])
  if (s.enum) return s.enum[0]
  if (s.type === "boolean") return false
  if (s.type === "array") return s.minItems && s.items ? [emptyValue(s.items)] : []
  if (s.type === "object") {
    const out: Obj = {}
    for (const key of s.required ?? []) out[key] = emptyValue(s.properties![key])
    return out
  }
  return ""
}

const humanize = (key: string) => key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())

/** Edits every visible property of `schema` on `value`. Undefined values remove the key. */
export function ObjectFields({
  schema,
  value,
  onChange,
}: {
  schema: JsonSchema
  value: Obj
  onChange: (value: Obj) => void
}) {
  const set = (key: string, v: unknown) => {
    const next = { ...value }
    if (v === undefined) delete next[key]
    else next[key] = v
    onChange(next)
  }
  return (
    <div className="flex flex-col gap-3">
      {Object.entries(schema.properties ?? {})
        .filter(([key]) => !HIDDEN.has(key))
        .map(([key, prop]) => (
          <Field
            key={key}
            name={key}
            schema={prop}
            required={schema.required?.includes(key) ?? false}
            value={value[key]}
            onChange={(v) => set(key, v)}
          />
        ))}
    </div>
  )
}

type FieldProps = {
  name: string
  schema: JsonSchema
  required: boolean
  value: unknown
  onChange: (value: unknown) => void
}

function Field(props: FieldProps) {
  const { schema } = props
  if (schema.$ref === "#/$defs/Action") return <ActionField {...props} />
  if (schema.enum) return <EnumField {...props} />
  if (schema.type === "boolean") return <BooleanField {...props} />
  if (schema.type === "integer" || schema.type === "number") return <NumberField {...props} />
  if (schema.type === "array") return <ArrayField {...props} />
  if (schema.type === "object") return schema.properties ? <NestedObjectField {...props} /> : <JsonField {...props} />
  return <StringField {...props} />
}

function FieldLabel({ id, name, required, schema }: { id?: string; name: string; required: boolean; schema: JsonSchema }) {
  return (
    <div className="flex flex-col gap-0.5">
      <Label htmlFor={id} className="text-xs">
        {humanize(name)}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {schema.description && <p className="text-xs text-muted-foreground">{schema.description.replace(/`/g, "")}</p>}
    </div>
  )
}

function StringField({ name, schema, required, value, onChange }: FieldProps) {
  const id = useId()
  const Control = name === "content" ? Textarea : Input
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={id} name={name} required={required} schema={schema} />
      <Control
        id={id}
        value={typeof value === "string" ? value : value === undefined ? "" : String(value)}
        // Optional strings are removed when cleared so the JSON stays minimal.
        onChange={(e) => onChange(e.target.value === "" && !required ? undefined : e.target.value)}
      />
    </div>
  )
}

function NumberField({ name, schema, required, value, onChange }: FieldProps) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={id} name={name} required={required} schema={schema} />
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={0}
        step={schema.type === "integer" ? 1 : "any"}
        value={typeof value === "number" ? value : ""}
        onChange={(e) => onChange(e.target.value === "" ? (required ? 0 : undefined) : Number(e.target.value))}
      />
    </div>
  )
}

function EnumField({ name, schema, required, value, onChange }: FieldProps) {
  const id = useId()
  const options = (schema.enum ?? []).map(String)
  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={id} name={name} required={required} schema={schema} />
      <Select
        value={value === undefined ? (required ? undefined : DEFAULT) : String(value)}
        onValueChange={(v) => onChange(v === DEFAULT ? undefined : v)}
      >
        <SelectTrigger id={id} className="w-full" size="sm">
          <SelectValue placeholder="Choose…" />
        </SelectTrigger>
        <SelectContent>
          {!required && <SelectItem value={DEFAULT}>(default)</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function BooleanField({ name, schema, required, value, onChange }: FieldProps) {
  const id = useId()
  return (
    <div className="flex items-start gap-2">
      <Checkbox
        id={id}
        className="mt-0.5"
        checked={value === true}
        onCheckedChange={(c) => onChange(c === true ? true : required ? false : undefined)}
      />
      <FieldLabel id={id} name={name} required={required} schema={schema} />
    </div>
  )
}

function Group({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-md border bg-muted/30 p-3", className)}>{children}</div>
}

function NestedObjectField({ name, schema, required, value, onChange }: FieldProps) {
  const id = useId()
  const included = isObj(value)
  return (
    <div className="flex flex-col gap-1.5">
      {required ? (
        <FieldLabel name={name} required schema={schema} />
      ) : (
        <div className="flex items-start gap-2">
          <Checkbox
            id={id}
            className="mt-0.5"
            checked={included}
            onCheckedChange={(c) => onChange(c === true ? emptyValue(schema) : undefined)}
          />
          <FieldLabel id={id} name={name} required={false} schema={schema} />
        </div>
      )}
      {(required || included) && (
        <Group>
          <ObjectFields schema={schema} value={isObj(value) ? value : {}} onChange={onChange} />
        </Group>
      )}
    </div>
  )
}

function ArrayField({ name, schema, required, value, onChange }: FieldProps) {
  const items = Array.isArray(value) ? value : []
  const itemSchema = resolve(schema.items ?? {})
  const min = schema.minItems ?? 0
  const setAt = (i: number, v: unknown) => onChange(items.map((item, j) => (j === i ? v : item)))
  const removeAt = (i: number) => onChange(items.filter((_, j) => j !== i))

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel name={name} required={required} schema={schema} />
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-1">
          {itemSchema.type === "object" ? (
            <Group className="min-w-0 flex-1">
              <ObjectFields schema={itemSchema} value={isObj(item) ? item : {}} onChange={(v) => setAt(i, v)} />
            </Group>
          ) : (
            <Input
              className="min-w-0 flex-1"
              aria-label={`${humanize(name)} ${i + 1}`}
              value={String(item ?? "")}
              onChange={(e) => setAt(i, e.target.value)}
            />
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Remove"
            disabled={items.length <= min}
            onClick={() => removeAt(i)}
          >
            <XIcon />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="xs" className="self-start" onClick={() => onChange([...items, emptyValue(itemSchema)])}>
        <PlusIcon /> Add
      </Button>
    </div>
  )
}

/** Free-form object (e.g. `payload`), edited as JSON. Only valid JSON objects are written back. */
function JsonField({ name, schema, required, value, onChange }: FieldProps) {
  const id = useId()
  const external = value === undefined ? "" : JSON.stringify(value, null, 2)
  const [text, setText] = useState(external)
  const [synced, setSynced] = useState(external)
  const [error, setError] = useState<string | null>(null)

  // Pick up changes made elsewhere (JSON editor, undo) without clobbering what's being typed.
  if (external !== synced) {
    setSynced(external)
    setText(external)
    setError(null)
  }

  const handle = (next: string) => {
    setText(next)
    if (next.trim() === "") {
      setError(null)
      setSynced("")
      onChange(undefined)
      return
    }
    try {
      const parsed: unknown = JSON.parse(next)
      if (!isObj(parsed)) throw new Error("Must be a JSON object, e.g. { \"key\": \"value\" }")
      setError(null)
      setSynced(JSON.stringify(parsed, null, 2))
      onChange(parsed)
    } catch (e) {
      setError((e as Error).message)
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel id={id} name={name} required={required} schema={schema} />
      <Textarea
        id={id}
        className="font-mono text-xs"
        placeholder='{ "key": "value" }'
        value={text}
        aria-invalid={error !== null}
        onChange={(e) => handle(e.target.value)}
      />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

function ActionField({ name, schema, required, value, onChange }: FieldProps) {
  const id = useId()
  const action = isObj(value) ? value : {}
  const variants = actionVariants()
  const types = variants.map((v) => String(v.properties!.type.const))
  const variant = variants.find((v) => v.properties!.type.const === action.type) ?? variants[0]

  const changeType = (type: string) => {
    const target = variants.find((v) => v.properties!.type.const === type)!
    // Keep shared fields (id, payload); drop ones the new type doesn't allow and fill its required ones.
    const next: Obj = { type }
    for (const [key, prop] of Object.entries(target.properties!)) {
      if (key === "type") continue
      if (key in action) next[key] = action[key]
      else if (target.required?.includes(key)) next[key] = key === "url" ? "https://example.com" : emptyValue(prop)
    }
    onChange(next)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <FieldLabel name={name} required={required} schema={schema} />
      <Group className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={id} className="text-xs">
            Type<span className="text-destructive">*</span>
          </Label>
          <Select value={types.includes(String(action.type)) ? String(action.type) : undefined} onValueChange={changeType}>
            <SelectTrigger id={id} className="w-full" size="sm">
              <SelectValue placeholder="Choose…" />
            </SelectTrigger>
            <SelectContent>
              {variants.map((v) => (
                <SelectItem key={String(v.properties!.type.const)} value={String(v.properties!.type.const)}>
                  {String(v.properties!.type.const)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {variant.properties!.type.description && (
            <p className="text-xs text-muted-foreground">{variant.properties!.type.description.replace(/`/g, "")}</p>
          )}
        </div>
        <ObjectFields schema={variant} value={action} onChange={onChange} />
      </Group>
    </div>
  )
}
