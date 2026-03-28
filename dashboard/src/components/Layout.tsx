import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { MessageSquare } from 'lucide-react'
import Sidebar from './Sidebar'
import ChatSidebar from './ChatSidebar'
import { Button } from './ui/button'
import { cn } from '../lib/utils'

const CHAT_WIDTH_NARROW = 400
const CHAT_WIDTH_WIDE = 600

export default function Layout() {
  const [chatOpen, setChatOpen] = useState(false)
  const [chatExpanded, setChatExpanded] = useState(() => {
    return localStorage.getItem('chatSidebarExpanded') === 'true'
  })

  const toggleExpanded = () => {
    const newValue = !chatExpanded
    setChatExpanded(newValue)
    localStorage.setItem('chatSidebarExpanded', String(newValue))
  }

  const chatWidth = chatExpanded ? CHAT_WIDTH_WIDE : CHAT_WIDTH_NARROW

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />

      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto">
          <Outlet />
        </div>
      </main>

      <div
        className={cn(
          "relative border-l border-border bg-card transition-all duration-300 ease-in-out"
        )}
        style={{ width: chatOpen ? chatWidth : 0 }}
      >
        <div className={cn(
          "h-full transition-opacity duration-200",
          chatOpen ? "opacity-100" : "opacity-0"
        )}>
          <ChatSidebar
            onClose={() => setChatOpen(false)}
            isExpanded={chatExpanded}
            onToggleExpand={toggleExpanded}
          />
        </div>
      </div>

      {!chatOpen && (
        <Button
          onClick={() => setChatOpen(true)}
          size="icon"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      )}
    </div>
  )
}
