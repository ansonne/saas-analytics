import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { parseCanvas, stripCanvas, type CanvasSpec } from '../canvas/parseCanvas'

interface StreamingState {
  isStreaming: boolean
  currentContent: string
  completedContent: string
  toolsUsed: string[]
  pendingUserMessage: string | null
  canvasSpec: CanvasSpec | null
  sessionId: string | null
  queries: string[]
}

interface ChatStreamingContextValue extends StreamingState {
  sendMessage: (content: string, sessionId: string) => Promise<void>
  cancelStream: () => void
  clearCanvas: () => void
}

const ChatStreamingContext = createContext<ChatStreamingContextValue | null>(null)

const INITIAL_STATE: StreamingState = {
  isStreaming: false,
  currentContent: '',
  completedContent: '',
  toolsUsed: [],
  pendingUserMessage: null,
  canvasSpec: null,
  sessionId: null,
  queries: [],
}

export function ChatStreamingProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<StreamingState>(INITIAL_STATE)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isStreamingRef = useRef(false)

  const sendMessage = useCallback(
    async (content: string, sessionId: string) => {
      if (isStreamingRef.current) return
      isStreamingRef.current = true

      setState({
        isStreaming: true,
        currentContent: '',
        completedContent: '',
        toolsUsed: [],
        pendingUserMessage: content,
        canvasSpec: null,
        sessionId,
        queries: [],
      })

      const controller = new AbortController()
      abortControllerRef.current = controller

      try {
        const token = localStorage.getItem('auth_token')
        const response = await fetch(`/api/chat/sessions/${sessionId}/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ content }),
          signal: controller.signal,
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No reader available')

        const decoder = new TextDecoder()
        let buffer = ''
        let accumulated = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              try {
                const parsed = JSON.parse(data)
                if (parsed.content) {
                  accumulated += parsed.content
                  const canvas = parseCanvas(accumulated)
                  const display = canvas ? stripCanvas(accumulated) : accumulated
                  setState((prev) => ({
                    ...prev,
                    currentContent: display,
                    canvasSpec: canvas ?? prev.canvasSpec,
                  }))
                }
                if (parsed.tool) {
                  setState((prev) => ({
                    ...prev,
                    toolsUsed: [...prev.toolsUsed, parsed.tool],
                  }))
                }
                if (parsed.queries_used) {
                  setState((prev) => ({
                    ...prev,
                    queries: parsed.queries_used,
                  }))
                }
              } catch {
                // Ignore parse errors
              }
            } else if (line.startsWith('event: ')) {
              const event = line.slice(7).trim()
              if (event === 'done') {
                queryClient.invalidateQueries({ queryKey: ['chat', 'session', sessionId] })
              }
            }
          }
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Streaming error:', error)
        }
      } finally {
        isStreamingRef.current = false
        setState((prev) => ({
          ...prev,
          isStreaming: false,
          completedContent: prev.currentContent,
          currentContent: '',
          pendingUserMessage: null,
        }))
        queryClient.invalidateQueries({ queryKey: ['chat', 'session', sessionId] })
      }
    },
    [queryClient]
  )

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort()
    isStreamingRef.current = false
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  const clearCanvas = useCallback(() => {
    setState((prev) => ({ ...prev, canvasSpec: null }))
  }, [])

  return (
    <ChatStreamingContext.Provider value={{ ...state, sendMessage, cancelStream, clearCanvas }}>
      {children}
    </ChatStreamingContext.Provider>
  )
}

export function useChatStreaming() {
  const ctx = useContext(ChatStreamingContext)
  if (!ctx) throw new Error('useChatStreaming must be used within ChatStreamingProvider')
  return ctx
}
