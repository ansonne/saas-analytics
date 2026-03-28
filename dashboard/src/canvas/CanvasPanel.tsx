import { useState, useRef, useEffect } from 'react'
import { LayoutDashboard, X, Pencil, Check } from 'lucide-react'
import type { CanvasEntry } from '../hooks/useCanvasStore'
import { renderCanvasComponent } from './CanvasRegistry'
import { Button } from '../components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

interface CanvasPanelProps {
  canvases: CanvasEntry[]
  selectedId: string | null
  onSelect: (id: string) => void
  onRemove: (id: string) => void
  onRename: (id: string, title: string) => void
}

export default function CanvasPanel({ canvases, selectedId, onSelect, onRemove, onRename }: CanvasPanelProps) {
  const selected = canvases.find((c) => c.id === selectedId) ?? null
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  // Reset editing state when selection changes
  useEffect(() => {
    setEditing(false)
  }, [selectedId])

  const startEdit = () => {
    if (!selected) return
    setEditValue(selected.title)
    setEditing(true)
  }

  const commitEdit = () => {
    if (!selected) return
    const trimmed = editValue.trim()
    if (!trimmed) {
      setEditValue(selected.title) // Reset to original on empty
      setEditing(false)
      return
    }
    onRename(selected.id, trimmed)
    setEditing(false)
  }

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEdit()
    if (e.key === 'Escape') setEditing(false)
  }

  return (
    <div className="flex flex-col h-full border-l border-border bg-muted/20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          <LayoutDashboard className="h-4 w-4 text-primary shrink-0" />
          {selected && editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={handleEditKeyDown}
              className="text-sm font-medium bg-transparent border-b border-primary outline-none min-w-0 flex-1"
            />
          ) : (
            <span className="text-sm font-medium truncate">
              {selected ? selected.title : 'Canvas'}
              {canvases.length > 1 && (
                <span className="text-xs text-muted-foreground ml-1">({canvases.length})</span>
              )}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {selected && !editing && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startEdit} title="Renomear">
              <Pencil className="h-3 w-3" />
            </Button>
          )}
          {selected && editing && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={commitEdit}>
              <Check className="h-3.5 w-3.5 text-primary" />
            </Button>
          )}
          {selected && !editing && (
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onRemove(selected.id)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>

      {canvases.length > 1 && (
        <div className="px-4 py-2 border-b border-border bg-card">
          <Select value={selectedId ?? ''} onValueChange={onSelect}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Selecione um canvas" />
            </SelectTrigger>
            <SelectContent>
              {canvases.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-4">
        {!selected ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <LayoutDashboard className="h-10 w-10 mb-3 opacity-20" />
            <p className="text-sm font-medium">Canvas vazio</p>
            <p className="text-xs mt-1 max-w-48">
              Peça um gráfico ou dashboard e ele aparecerá aqui
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {selected.spec.components.map((component, i) => renderCanvasComponent(component, i))}
          </div>
        )}
      </div>
    </div>
  )
}
