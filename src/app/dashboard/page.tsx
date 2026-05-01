import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AddBookmark from '@/components/AddBookmark'
import BookmarkList from '@/components/BookmarkList'
import { LogOutIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect('/')
  }

  const { data: bookmarks, error } = await supabase
    .from('bookmarks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching bookmarks:', error)
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black font-sans">
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Smart Bookmarks
          </h1>
          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors"
            >
              <LogOutIcon size={16} />
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddBookmark />
        <BookmarkList initialBookmarks={bookmarks || []} />
      </main>
    </div>
  )
}
