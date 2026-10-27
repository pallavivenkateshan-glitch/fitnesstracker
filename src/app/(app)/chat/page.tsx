import ChatInterface from '@/components/chat/ChatInterface'
import { createClient } from '@/lib/supabase/server'
import type { ChatMessage } from '@/lib/types'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let initialMessages: ChatMessage[] = []
  if (user) {
    const { data } = await supabase
      .from('chat_messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)
    initialMessages = ((data ?? []) as ChatMessage[]).reverse()
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col" style={{ height: 'calc(100vh - 65px)' }}>
      <h1 className="text-2xl font-bold text-white mb-4">AI Coach</h1>
      <ChatInterface initialMessages={initialMessages} />
    </div>
  )
}
