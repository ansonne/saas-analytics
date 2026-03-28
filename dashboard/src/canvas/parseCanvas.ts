export interface CanvasComponent {
  type: string
  props: Record<string, unknown>
}

export interface CanvasSpec {
  components: CanvasComponent[]
}

const CANVAS_REGEX = /~~~canvas\s*([\s\S]*?)~~~\s*$/

/**
 * Extracts the canvas spec from a message that may contain a ~~~canvas block.
 * Returns null if no valid canvas block found.
 */
export function parseCanvas(text: string): CanvasSpec | null {
  const match = text.match(CANVAS_REGEX)
  if (!match) return null

  try {
    const parsed = JSON.parse(match[1].trim())
    if (!Array.isArray(parsed.components)) return null
    return parsed as CanvasSpec
  } catch {
    return null
  }
}

/**
 * Strips the ~~~canvas block from a message string for display.
 */
export function stripCanvas(text: string): string {
  return text.replace(CANVAS_REGEX, '').trimEnd()
}
