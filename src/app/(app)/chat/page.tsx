import ChatInterface from '@/components/chat/ChatInterface'

export const instant = false

export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 65px)' }}>
      <h1 className="text-2xl font-bold text-white mb-4">AI Coach</h1>
      <ChatInterface />
    </div>
  )
}
