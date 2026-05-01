'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import * as cheerio from 'cheerio'

export async function addBookmark(url: string, title: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  const { error } = await supabase
    .from('bookmarks')
    .insert({
      url,
      title: title || url,
      user_id: user.id
    })

  if (error) {
    console.error("Error adding bookmark:", error)
    throw new Error("Failed to add bookmark")
  }

  revalidatePath('/dashboard')
}

export async function deleteBookmark(id: string) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      throw new Error("Unauthorized")
    }

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .match({ id, user_id: user.id })

    if (error) {
      console.error("Error deleting bookmark:", error)
      throw new Error("Failed to delete bookmark")
    }

    revalidatePath('/dashboard')
}

export async function fetchMetadata(url: string) {
    // Authenticate the request to prevent abuse/SSRF
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return null;
    }

    try {
        const response = await fetch(url, {
            next: { revalidate: 3600 }, // Cache for an hour
            headers: {
                // Some websites block requests without a user agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        })

        if (!response.ok) {
            return null
        }

        const html = await response.text()
        const $ = cheerio.load(html)

        // Try og:title first, then title tag
        let title = $('meta[property="og:title"]').attr('content')
        if (!title) {
            title = $('title').text()
        }

        return title ? title.trim() : null
    } catch (error) {
        console.error("Failed to fetch metadata:", error)
        return null
    }
}
