import { useState, useEffect, useRef } from 'react'
import { X, Plus, Trash2, Send, Loader2, Sparkles, PanelLeft, PanelLeftClose, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  useChatSessions,
  useChatSession,
  useCreateChatSession,
  useDeleteChatSession,
} from '../hooks/useApi'
import { useStreamingChat } from '../hooks/useStreamingChat'
import ChatMessage from './ChatMessage'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { ScrollArea } from './ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { cn } from '../lib/utils'

interface ChatSidebarProps {
  onClose: () => void
  isExpanded?: boolean
  onToggleExpand?: () => void
}

export default function ChatSidebar({ onClose, isExpanded, onToggleExpand }: ChatSidebarProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: sessions, refetch: refetchSessions } = useChatSessions()
  const { data: session, isLoading: sessionLoading, error: sessionError } = useChatSession(selectedSessionId)
  const createSession = useCreateChatSession()
  const deleteSession = useDeleteChatSession()
  const { isStreaming, currentContent, pendingUserMessage, queries, sendMessage } = useStreamingChat(selectedSessionId)

  useEffect(() => {
    if (sessions?.length && !selectedSessionId) {
      setSelectedSessionId(sessions[0].id)
    }
  }, [sessions, selectedSessionId])

  useEffect(() => {
    if (sessionError && selectedSessionId) {
      setSelectedSessionId(null)
      refetchSessions()
    }
  }, [sessionError, selectedSessionId, refetchSessions])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [session?.messages, currentContent])

  const handleCreateSession = async () => {
    const newSession = await createSession.mutateAsync()
    setSelectedSessionId(newSession.id)
  }

  const handleDeleteSession = async (id: string) => {
    if (!sessions) return

    const currentIndex = sessions.findIndex((s) => s.id === id)
    const isLastSession = sessions.length === 1

    if (isLastSession) {
      // Last session: delete it and create a new empty one
      await deleteSession.mutateAsync(id)
      const newSession = await createSession.mutateAsync()
      setSelectedSessionId(newSession.id)
    } else {
      // Multiple sessions: delete current and select the previous (or next if first)
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 1
      const nextSessionId = sessions[nextIndex].id

      await deleteSession.mutateAsync(id)
      if (selectedSessionId === id) {
        setSelectedSessionId(nextSessionId)
      }
    }
  }

  // Button should be disabled when there are no messages in the current session
  const canDeleteSession = sessions && !(sessions.length === 1 && session?.messages.length === 0)

  const handleSend = () => {
    if (!input.trim() || isStreaming) return
    sendMessage(input)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          {onToggleExpand && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleExpand}
              className="h-8 w-8"
              title={isExpanded ? "Reduzir chat" : "Expandir chat"}
            >
              {isExpanded ? (
                <PanelLeftClose className="h-4 w-4" />
              ) : (
                <PanelLeft className="h-4 w-4" />
              )}
            </Button>
          )}
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-sm">Assistente IA</h2>
            <p className="text-xs text-muted-foreground">Pergunte sobre seus dados</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Link to="/chat">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Abrir em tela cheia"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreateSession}
            className="h-8 w-8"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {sessions && sessions.length > 1 && (
        <div className="p-3 border-b border-border">
          <Select
            value={selectedSessionId || ''}
            onValueChange={setSelectedSessionId}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="Selecione uma conversa" />
            </SelectTrigger>
            <SelectContent>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.title || 'Nova conversa'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {sessionLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : session?.messages.length === 0 && !currentContent && !pendingUserMessage ? (
            <div className="text-center py-12 px-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">Como posso ajudar?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Faça perguntas sobre o ServicePay
              </p>
              <div className="space-y-2">
                {[
                  "Quantos usuários ativos tivemos hoje?",
                  "Qual a taxa de sucesso dos pagamentos?",
                  "Mostre as faturas pagas este mês",
                ].map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(suggestion)}
                    className="w-full text-left text-sm px-3 py-2 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  >
                    "{suggestion}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {session?.messages.map((msg, index) => (
                <div
                  key={msg.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ChatMessage message={msg} compact />
                </div>
              ))}
              {pendingUserMessage && (() => {
                const last = session?.messages.at(-1)
                return !(last?.role === 'user' && last?.content === pendingUserMessage)
              })() && (
                <ChatMessage
                  message={{
                    id: -2,
                    session_id: selectedSessionId || '',
                    role: 'user',
                    content: pendingUserMessage,
                    created_at: new Date().toISOString(),
                  }}
                  compact
                />
              )}
              {(currentContent || isStreaming) && (
                <ChatMessage
                  message={{
                    id: -1,
                    session_id: selectedSessionId || '',
                    role: 'assistant',
                    content: currentContent || '',
                    created_at: new Date().toISOString(),
                  }}
                  isStreaming
                  streamingQueries={queries}
                  compact
                />
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Digite sua pergunta..."
            className="min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isStreaming || !selectedSessionId}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isStreaming || !selectedSessionId}
            size="icon"
            className="h-[44px] w-[44px] shrink-0"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
        {selectedSessionId && session && (
          <div className="mt-3 flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              {session.messages.length} mensagen{session.messages.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => handleDeleteSession(selectedSessionId)}
              disabled={!canDeleteSession}
              className={cn(
                "flex items-center gap-1 text-xs transition-colors",
                canDeleteSession
                  ? "text-muted-foreground hover:text-destructive"
                  : "text-muted-foreground/40 cursor-not-allowed"
              )}
            >
              <Trash2 className="h-3 w-3" />
              Excluir conversa
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
