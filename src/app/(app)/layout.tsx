import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import NavBar from '@/components/NavBar'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar user={user} />
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      {/* Mobile bottom nav spacer handled in NavBar */}
    </div>
  )
}
