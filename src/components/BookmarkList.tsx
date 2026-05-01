'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { deleteBookmark, type Bookmark } from '@/app/actions/bookmarks'
import { Trash2Icon, ExternalLinkIcon } from 'lucide-react'

export default function BookmarkList({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel('realtime:bookmarks')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          setBookmarks((current) => [payload.new as Bookmark, ...current])
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'bookmarks',
        },
        (payload) => {
          setBookmarks((current) =>
            current.filter((bookmark) => bookmark.id !== payload.old.id)
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this bookmark?')) {
      // Find the bookmark to potentially restore it
      const bookmarkToDelete = bookmarks.find((b) => b.id === id)

      try {
        // Optimistic update
        setBookmarks((current) => current.filter((b) => b.id !== id))

        const response = await deleteBookmark(id)
        if (response.error) {
            throw new Error(response.error)
        }
      } catch (error) {
        console.error("Failed to delete", error)
        // Revert optimistic update
        if (bookmarkToDelete) {
             setBookmarks((current) => {
                 // Insert back in the same roughly sorted position or just unshift
                 return [bookmarkToDelete, ...current].sort((a, b) =>
                    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                 )
             })
        }
        alert(error instanceof Error ? error.message : "Failed to delete bookmark")
      }
    }
  }

  if (bookmarks.length === 0) {
    return (
        <div className="text-center py-16 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <p className="text-zinc-500 dark:text-zinc-400">No bookmarks yet. Add your first one above!</p>
        </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark.id}
          className="group flex flex-col bg-white dark:bg-zinc-900 p-5 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 hover:shadow-md transition-all hover:-translate-y-1"
        >
          <div className="flex justify-between items-start mb-3">
             <h3 className="font-semibold text-lg text-zinc-900 dark:text-zinc-50 line-clamp-2 leading-tight">
               {bookmark.title || bookmark.url}
             </h3>
             <button
                onClick={() => handleDelete(bookmark.id)}
                className="text-zinc-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                aria-label="Delete bookmark"
             >
                <Trash2Icon size={18} />
             </button>
          </div>
          <div className="mt-auto pt-4 flex items-center justify-between">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[80%]"
            >
              {bookmark.url}
            </a>
            <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
                <ExternalLinkIcon size={16} />
            </a>
          </div>
        </div>
      ))}
    </div>
  )
}
