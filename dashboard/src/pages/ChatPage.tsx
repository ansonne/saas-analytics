import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Send, Loader2, Sparkles, LayoutDashboard } from 'lucide-react'
import {
  useChatSessions,
  useChatSession,
  useCreateChatSession,
  useDeleteChatSession,
} from '../hooks/useApi'
import { useStreamingChat } from '../hooks/useStreamingChat'
import { useCanvasStore } from '../hooks/useCanvasStore'
import ChatMessage from '../components/ChatMessage'
import CanvasPanel from '../canvas/CanvasPanel'
import { Button } from '../components/ui/button'
import { Textarea } from '../components/ui/textarea'
import { ScrollArea } from '../components/ui/scroll-area'
import { Card } from '../components/ui/card'
import { cn } from '../lib/utils'

function extractCanvasTitle(content: string): string | undefined {
  for (const line of content.split('\n')) {
    const text = line.replace(/^#+\s*/, '').trim()
    if (text) return text
  }
  return undefined
}

export default function ChatPage() {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [showCanvas, setShowCanvas] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { data: sessions, refetch: refetchSessions } = useChatSessions()
  const { data: session, isLoading: sessionLoading, error: sessionError } = useChatSession(selectedSessionId)
  const createSession = useCreateChatSession()
  const deleteSession = useDeleteChatSession()
  const { isStreaming, currentContent, completedContent, pendingUserMessage, canvasSpec, queries, sendMessage } =
    useStreamingChat(selectedSessionId)
  const canvasStore = useCanvasStore()

  // Persist canvas to store when streaming ends with a canvas
  const prevIsStreamingRef = useRef(false)
  useEffect(() => {
    if (prevIsStreamingRef.current && !isStreaming && canvasSpec && selectedSessionId && completedContent.trim()) {
      const title = extractCanvasTitle(completedContent)
      canvasStore.addCanvas(canvasSpec, selectedSessionId, title)
      setShowCanvas(true)
    }
    prevIsStreamingRef.current = isStreaming
  }, [isStreaming]) // eslint-disable-line react-hooks/exhaustive-deps

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
      await deleteSession.mutateAsync(id)
      const newSession = await createSession.mutateAsync()
      setSelectedSessionId(newSession.id)
    } else {
      const nextIndex = currentIndex > 0 ? currentIndex - 1 : 1
      const nextSessionId = sessions[nextIndex].id
      await deleteSession.mutateAsync(id)
      if (selectedSessionId === id) setSelectedSessionId(nextSessionId)
    }
  }

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
    <div className="flex h-screen bg-background">
      {/* Sessions sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleCreateSession} className="h-8 w-8">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {sessions?.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelectedSessionId(s.id)}
                className={cn(
                  "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                  selectedSessionId === s.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {s.title || 'Nova conversa'}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-4 border-b border-border flex items-center justify-between bg-card shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-display font-semibold">Assistente IA</h1>
              <p className="text-sm text-muted-foreground">
                {session?.messages.length || 0} mensagens nesta conversa
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={showCanvas ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => setShowCanvas((v) => !v)}
            >
              <LayoutDashboard className="h-4 w-4" />
              Canvas
              {canvasStore.canvases.length > 0 && (
                <span className="ml-1 text-xs bg-primary-foreground/20 rounded-full px-1.5">
                  {canvasStore.canvases.length}
                </span>
              )}
            </Button>
            {selectedSessionId && canDeleteSession && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteSession(selectedSessionId)}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Messages */}
          <div className={cn("flex flex-col min-w-0", showCanvas ? "flex-1" : "w-full")}>
            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto p-6 space-y-4">
                {sessionLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : session?.messages.length === 0 && !currentContent && !pendingUserMessage ? (
                  <div className="text-center py-20">
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="font-display text-xl font-semibold text-foreground mb-2">
                      Como posso ajudar?
                    </h2>
                    <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                      Faça perguntas sobre os dados do ServicePay. Eu posso consultar faturas, assinaturas, pagamentos e mais.
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {[
                        "Quantos usuários ativos tivemos hoje?",
                        "Mostre um gráfico de pagamentos dos últimos 30 dias",
                        "Qual a distribuição de status das faturas?",
                        "Quais condomínios têm mais assinaturas ativas?",
                      ].map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => setInput(suggestion)}
                          className="text-sm px-4 py-2 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {session?.messages.map((msg, index) => (
                      <div key={msg.id} className="animate-fade-in" style={{ animationDelay: `${index * 30}ms` }}>
                        <ChatMessage message={msg} />
                      </div>
                    ))}
                    {pendingUserMessage && (() => {
                      const last = session?.messages.at(-1)
                      const alreadySaved = last?.role === 'user' && last?.content === pendingUserMessage
                      return !alreadySaved
                    })() && (
                      <ChatMessage
                        message={{ id: -2, session_id: selectedSessionId || '', role: 'user', content: pendingUserMessage, created_at: new Date().toISOString() }}
                      />
                    )}
                    {(currentContent || isStreaming) && (
                      <ChatMessage
                        message={{ id: -1, session_id: selectedSessionId || '', role: 'assistant', content: currentContent || '', created_at: new Date().toISOString() }}
                        isStreaming
                        streamingQueries={queries}
                      />
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </ScrollArea>

            <div className="p-4 border-t border-border bg-card shrink-0">
              <div className="max-w-3xl mx-auto">
                <Card className="p-2">
                  <div className="flex gap-2">
                    <Textarea
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Digite sua pergunta..."
                      className="min-h-[50px] max-h-[200px] border-0 focus-visible:ring-0 resize-none"
                      rows={1}
                      disabled={isStreaming || !selectedSessionId}
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isStreaming || !selectedSessionId}
                      size="icon"
                      className="h-[50px] w-[50px] shrink-0"
                    >
                      {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                  </div>
                </Card>
              </div>
            </div>
          </div>

          {/* Canvas panel */}
          {showCanvas && (
            <div className="w-[420px] shrink-0">
              <CanvasPanel
                canvases={canvasStore.canvases}
                selectedId={canvasStore.selectedId}
                onSelect={canvasStore.setSelectedId}
                onRemove={canvasStore.removeCanvas}
                onRename={canvasStore.updateTitle}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
