import { useState, useCallback } from 'react'
import type { CanvasSpec } from '../canvas/parseCanvas'

export interface CanvasEntry {
  id: string
  title: string
  spec: CanvasSpec
  sessionId: string
  createdAt: string
}

const STORAGE_KEY = 'servicepay_canvases'

function loadCanvases(): CanvasEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as CanvasEntry[]
  } catch {
    return []
  }
}

function persist(canvases: CanvasEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(canvases))
}

export function useCanvasStore() {
  const [canvases, setCanvases] = useState<CanvasEntry[]>(loadCanvases)
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const initial = loadCanvases()
    return initial[0]?.id ?? null
  })

  const addCanvas = useCallback((spec: CanvasSpec, sessionId: string, title?: string): string => {
    const entry: CanvasEntry = {
      id: crypto.randomUUID(),
      title: title || `Canvas ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
      spec,
      sessionId,
      createdAt: new Date().toISOString(),
    }
    setCanvases((prev) => {
      const updated = [entry, ...prev]
      persist(updated)
      return updated
    })
    setSelectedId(entry.id)
    return entry.id
  }, [])

  const removeCanvas = useCallback((id: string) => {
    setCanvases((prev) => {
      const updated = prev.filter((c) => c.id !== id)
      persist(updated)
      setSelectedId((sel) => {
        if (sel !== id) return sel
        return updated[0]?.id ?? null
      })
      return updated
    })
  }, [])

  const updateTitle = useCallback((id: string, title: string) => {
    const trimmed = title.trim()
    if (!trimmed) return
    setCanvases((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, title: trimmed } : c))
      persist(updated)
      return updated
    })
  }, [])

  const selectedCanvas = canvases.find((c) => c.id === selectedId) ?? null

  return { canvases, selectedCanvas, selectedId, setSelectedId, addCanvas, removeCanvas, updateTitle }
}
