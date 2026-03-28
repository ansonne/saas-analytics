import { useChatStreaming } from '../contexts/ChatStreamingContext'

/**
 * Thin wrapper around the global ChatStreamingContext.
 * Filters state to only expose values relevant to the given sessionId.
 */
export function useStreamingChat(sessionId: string | null) {
  const ctx = useChatStreaming()
  const isActiveSession = ctx.sessionId === sessionId

  const sendMessage = (content: string) => {
    if (!sessionId) return
    ctx.sendMessage(content, sessionId)
  }

  return {
    isStreaming: isActiveSession && ctx.isStreaming,
    currentContent: isActiveSession ? ctx.currentContent : '',
    completedContent: isActiveSession ? ctx.completedContent : '',
    toolsUsed: isActiveSession ? ctx.toolsUsed : [],
    pendingUserMessage: isActiveSession ? ctx.pendingUserMessage : null,
    canvasSpec: isActiveSession ? ctx.canvasSpec : null,
    queries: isActiveSession ? ctx.queries : [],
    sendMessage,
    cancelStream: ctx.cancelStream,
    clearCanvas: ctx.clearCanvas,
  }
}
