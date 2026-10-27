import {
  ChevronsUpDownIcon,
  HeadingIcon,
  ImageIcon,
  LayersIcon,
  LetterTextIcon,
  ListIcon,
  MinusIcon,
  MousePointerClickIcon,
  PanelBottomIcon,
  Rows3Icon,
  SquareCheckIcon,
  TagIcon,
  TextCursorInputIcon,
  TypeIcon,
} from "lucide-react"
import type { CardNode } from "@/schema/card"

export const NODE_ICONS: Record<CardNode["type"], React.ComponentType<{ className?: string }>> = {
  header: HeadingIcon,
  text: TypeIcon,
  image: ImageIcon,
  divider: MinusIcon,
  badge: TagIcon,
  keyValue: Rows3Icon,
  list: ListIcon,
  stack: LayersIcon,
  button: MousePointerClickIcon,
  actions: PanelBottomIcon,
  input: TextCursorInputIcon,
  textarea: LetterTextIcon,
  select: ChevronsUpDownIcon,
  checkbox: SquareCheckIcon,
}
