'use client'

import { useState } from 'react'
import { addBookmark, fetchMetadata } from '@/app/actions'
import { PlusIcon } from 'lucide-react'

export default function AddBookmark() {
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [isFetchingMetadata, setIsFetchingMetadata] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url) return

    setLoading(true)
    try {
      await addBookmark(url, title)
      setUrl('')
      setTitle('')
    } catch (error) {
      console.error(error)
      alert('Failed to add bookmark')
    } finally {
      setLoading(false)
    }
  }

  const handleUrlBlur = async () => {
    if (!url || title) return // Don't fetch if no URL or if title is already set

    try {
      // Basic URL validation
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

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 mb-8">
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
            Title (Optional)
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
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin"></div>
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
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
               <>
                 <PlusIcon size={20} />
                 <span>Add</span>
               </>
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
