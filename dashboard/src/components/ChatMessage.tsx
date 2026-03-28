import { useState } from 'react'
import { User, Bot, Table, Database, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Link } from 'react-router-dom'
import type { ChatMessage as ChatMessageType } from '../api/types'
import { cn } from '../lib/utils'
import { Badge } from './ui/badge'
import { stripCanvas } from '../canvas/parseCanvas'

interface ChatMessageProps {
  message: ChatMessageType
  isStreaming?: boolean
  streamingQueries?: string[]
  compact?: boolean
}

// Fix table formatting - ensure proper line breaks between rows
function preprocessMarkdown(content: string): string {
  if (!content) return ''

  let processed = content

  // Fix tables on single lines by inserting newlines
  // Pattern: "| something | | something |" -> "| something |\n| something |"
  // Look for end of cell followed by start of new row
  processed = processed.replace(/\|\s+\|(?=[^-\n])/g, '|\n|')

  // Fix separator rows: "| --- | | data |" -> "| --- |\n| data |"
  processed = processed.replace(/\|[\s-:]+\|\s+\|/g, (match) => {
    return match.replace(/\|\s+\|/, '|\n|')
  })

  // Split into lines and process each
  const lines = processed.split('\n')
  const result: string[] = []

  for (const line of lines) {
    // Check if line contains multiple table rows (has "| |" pattern)
    if ((line.match(/\|/g) || []).length > 10 && line.includes('| |')) {
      // This line likely has multiple rows concatenated
      // Split by "| |" and reconstruct with newlines
      const segments = line.split(/\|\s+\|/)
      for (let i = 0; i < segments.length; i++) {
        let seg = segments[i].trim()
        if (!seg) continue
        // Ensure proper | delimiters
        if (!seg.startsWith('|')) seg = '| ' + seg
        if (!seg.endsWith('|')) seg = seg + ' |'
        result.push(seg)
      }
    } else {
      result.push(line)
    }
  }

  return result.join('\n')
}

function SqlAuditButton({ queries, compact }: { queries: string[]; compact?: boolean }) {
  const [open, setOpen] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (sql: string, index: number) => {
    navigator.clipboard.writeText(sql)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Database className="h-3 w-3" />
        {queries.length} consulta{queries.length !== 1 ? 's' : ''} SQL
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className={cn("mt-2 space-y-2", compact && "max-h-48 overflow-y-auto")}>
          {queries.map((sql, i) => (
            <div key={i} className="relative group">
              <pre className="bg-sidebar text-sidebar-foreground p-3 rounded-lg text-xs overflow-x-auto font-mono pr-10">
                {sql}
              </pre>
              <button
                onClick={() => handleCopy(sql, i)}
                className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-muted hover:bg-muted/80"
                title="Copiar SQL"
              >
                {copiedIndex === i ? (
                  <Check className="h-3 w-3 text-green-500" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ChatMessage({ message, isStreaming, streamingQueries, compact }: ChatMessageProps) {
  const isUser = message.role === 'user'
  const processedContent = preprocessMarkdown(stripCanvas(message.content || ''))

  // Resolve queries: prefer persisted (from message), fall back to live streaming queries
  const persistedQueries = message.queries_used
    ? (() => { try { return JSON.parse(message.queries_used) as string[] } catch { return [] } })()
    : []
  const queries = persistedQueries.length > 0 ? persistedQueries : (streamingQueries ?? [])

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div
        className={cn(
          "flex-1 min-w-0 rounded-xl px-4 py-3 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/50 text-foreground"
        )}
      >
        {isUser ? (
          <p className="leading-relaxed">{message.content}</p>
        ) : (
          <div className="chat-content overflow-hidden">
            {processedContent ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  table: ({ children }) => {
                    if (compact) {
                      return (
                        <div className="my-2 p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Table className="h-4 w-4" />
                            <span className="text-xs">Tabela disponível</span>
                          </div>
                          <Link
                            to="/chat"
                            className="text-xs text-primary hover:underline mt-1 block"
                          >
                            Abrir chat em tela cheia para visualizar
                          </Link>
                        </div>
                      )
                    }
                    return (
                      <div className="table-wrapper overflow-x-auto my-2">
                        <table className="border-collapse text-xs">{children}</table>
                      </div>
                    )
                  },
                  thead: ({ children }) => <thead className="bg-muted">{children}</thead>,
                  th: ({ children }) => (
                    <th className="border border-border px-2 py-1.5 text-left font-medium whitespace-nowrap">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-border px-2 py-1 whitespace-nowrap">
                      {children}
                    </td>
                  ),
                  code: ({ className, children, ...props }) => {
                    const isInline = !className
                    if (isInline) {
                      return (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">
                          {children}
                        </code>
                      )
                    }
                    return (
                      <code className={className} {...props}>
                        {children}
                      </code>
                    )
                  },
                  pre: ({ children }) => (
                    <pre className="bg-sidebar text-sidebar-foreground p-3 rounded-lg text-xs overflow-x-auto my-2 font-mono">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-primary/30 pl-3 my-2 text-muted-foreground italic">
                      {children}
                    </blockquote>
                  ),
                  h1: ({ children }) => (
                    <h1 className="text-base font-semibold text-foreground mb-2 mt-3 first:mt-0">{children}</h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-sm font-semibold text-foreground mb-1.5 mt-2 first:mt-0">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-medium text-foreground mb-1 mt-2 first:mt-0">{children}</h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal pl-4 mb-2 last:mb-0 space-y-0.5">{children}</ol>
                  ),
                  li: ({ children }) => (
                    <li className="leading-relaxed">{children}</li>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">{children}</strong>
                  ),
                  a: ({ href, children }) => (
                    <a href={href} className="text-primary underline hover:no-underline" target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  ),
                }}
              >
                {processedContent}
              </ReactMarkdown>
            ) : isStreaming ? (
              <div className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse animate-delay-100" />
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse animate-delay-200" />
              </div>
            ) : null}
          </div>
        )}
        {!isUser && message.tools_used && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.tools_used.split(',').map((tool, i) => (
              <Badge key={i} variant="secondary" className="text-[10px]">
                {tool.trim()}
              </Badge>
            ))}
          </div>
        )}
        {!isUser && queries.length > 0 && (
          <SqlAuditButton queries={queries} compact={compact} />
        )}
      </div>
    </div>
  )
}
