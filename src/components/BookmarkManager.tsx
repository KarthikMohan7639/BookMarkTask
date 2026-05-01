'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { addBookmark, deleteBookmark, type Bookmark } from '@/app/actions/bookmarks'
import { fetchMetadata } from '@/app/actions'
import { Trash2Icon, ExternalLinkIcon, PlusIcon, Loader2Icon } from 'lucide-react'

export default function BookmarkManager({ initialBookmarks }: { initialBookmarks: Bookmark[] }) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(initialBookmarks)

  // Add Bookmark State
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Delete Modal State
  const [bookmarkToDelete, setBookmarkToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const supabase = createClient()

  // Realtime Subscription
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
          setBookmarks((current) => {
            // Prevent duplicates if optimistic update already added it
            if (current.some(b => b.id === payload.new.id)) return current
            return [payload.new as Bookmark, ...current]
          })
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

  // Handlers
  const handleUrlBlur = async () => {
    if (!url || title) return

    try {
      new URL(url)
    } catch {
      return // Invalid URL
    }

    setIsFetchingMetadata(true)
    try {
      const fetchedTitle = await fetchMetadata(url)
      if (fetchedTitle) {
        setTitle(fetchedTitle)
      }
    } catch (error) {
       console.error("Could not fetch metadata automatically", error)
    } finally {
      setIsFetchingMetadata(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return
    setErrorMsg(null)

    setLoading(true)
    try {
      const response = await addBookmark(url, title)

      if (response.error) {
        setErrorMsg(response.error)
      } else {
        setUrl('')
        setTitle('')
      }
    } catch (error) {
      console.error(error)
      setErrorMsg('An unexpected error occurred while adding the bookmark.')
    } finally {
      setLoading(false)
    }
  }

  const confirmDelete = async () => {
    if (!bookmarkToDelete) return

    setIsDeleting(true)
    const id = bookmarkToDelete

    // Find bookmark for potential rollback
    const bookmarkToRestore = bookmarks.find((b) => b.id === id)

    try {
      // Optimistic UI update
      setBookmarks((current) => current.filter((b) => b.id !== id))
      setBookmarkToDelete(null)

      const response = await deleteBookmark(id)
      if (response.error) {
          throw new Error(response.error)
      }
    } catch (error) {
      console.error("Failed to delete", error)
      // Rollback
      if (bookmarkToRestore) {
           setBookmarks((current) => {
               return [bookmarkToRestore, ...current].sort((a, b) =>
                  new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
               )
           })
      }
      alert(error instanceof Error ? error.message : "Failed to delete bookmark")
    } finally {
        setIsDeleting(false)
    }
  }

  return (
    <div>
      {/* Add Bookmark Form */}
      <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
        {errorMsg && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="url" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              URL
            </label>
            <input
              type="url"
              id="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onBlur={handleUrlBlur}
              className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white text-black"
              placeholder="https://example.com"
            />
          </div>
          <div className="flex-1 relative">
            <label htmlFor="title" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Title <span className="text-zinc-400 text-xs">(Auto-fetches on paste)</span>
            </label>
            <div className="relative">
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all dark:text-white text-black"
                  placeholder="My awesome link"
                  disabled={isFetchingMetadata}
                />
                {isFetchingMetadata && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">
                      <Loader2Icon size={16} className="animate-spin" />
                  </div>
                )}
            </div>
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || !url}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium h-[42px]"
            >
              {loading ? (
                  <Loader2Icon size={20} className="animate-spin" />
              ) : (
                 <>
                   <PlusIcon size={20} />
                   <span>Save</span>
                 </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Bookmark List */}
      {bookmarks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-900 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-800">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4 text-zinc-400">
                <PlusIcon size={32} />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">No bookmarks yet</h3>
            <p className="text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm text-center">Save your first bookmark using the form above to see it appear here instantly.</p>
        </div>
      ) : (
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
                    onClick={() => setBookmarkToDelete(bookmark.id)}
                    className="text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors p-1.5 opacity-0 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Delete bookmark"
                 >
                    <Trash2Icon size={18} />
                 </button>
              </div>
              <div className="mt-auto pt-4 flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800/50">
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
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1"
                >
                    <ExternalLinkIcon size={16} />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {bookmarkToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">Delete Bookmark?</h3>
                <p className="text-zinc-500 dark:text-zinc-400 mb-6">
                    This action cannot be undone. Are you sure you want to remove this bookmark?
                </p>
                <div className="flex gap-3 justify-end">
                    <button
                        onClick={() => setBookmarkToDelete(null)}
                        disabled={isDeleting}
                        className="px-4 py-2 font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={confirmDelete}
                        disabled={isDeleting}
                        className="flex items-center gap-2 px-4 py-2 font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                        {isDeleting ? <Loader2Icon size={16} className="animate-spin" /> : <Trash2Icon size={16} />}
                        Delete
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  )
}
