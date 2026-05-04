'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export interface Bookmark {
  id: string
  user_id: string
  url: string
  title: string | null
  created_at: string
}

export type ActionResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: string }

export async function addBookmark(
  url: string,
  title?: string
): Promise<ActionResponse<Bookmark>> {
  console.log('addBookmark called with:', { url, title })
  const supabase = await createClient()

  // Verify server-side session
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('Auth error or no user:', { authError, user: user?.id })
    return { error: 'Unauthorized: You must be logged in to add a bookmark.' }
  }

  console.log('User authenticated:', user.id)

  // Prevent XSS via javascript: protocols
  try {
      const parsedUrl = new URL(url)
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          return { error: 'Invalid URL. Only HTTP and HTTPS protocols are allowed.' }
      }
  } catch {
      return { error: 'Invalid URL format.' }
  }

  // Insert bookmark
  const result = await supabase
    .from('bookmarks')
    .insert({
      user_id: user.id,
      url,
      title: title || url, // fallback to URL if title is empty
    })
    .select()

  // Handle both error from Supabase and empty result
  if (result.error) {
    console.error('Error inserting bookmark - Supabase error:', {
      message: result.error.message,
      code: result.error.code,
    })
    return { error: 'Failed to add bookmark to the database.' }
  }

  if (!result.data || result.data.length === 0) {
    console.error('Error inserting bookmark - No data returned after insert', {
      data: result.data,
      dataLength: result.data?.length,
    })
    return { error: 'Failed to add bookmark to the database.' }
  }

  const data = result.data[0]
  console.log('Successfully inserted bookmark:', data.id)

  revalidatePath('/dashboard')

  return { data: data as Bookmark }
}

export async function deleteBookmark(
  id: string
): Promise<ActionResponse<null>> {
  const supabase = await createClient()

  // Verify server-side session
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized: You must be logged in to delete a bookmark.' }
  }

  // Delete bookmark
  // Due to RLS, it will only delete if user_id matches, but we explicitly match anyway for safety
  const { error } = await supabase
    .from('bookmarks')
    .delete()
    .match({ id, user_id: user.id })

  if (error) {
    console.error('Error deleting bookmark:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    })
    return { error: 'Failed to delete bookmark from the database.' }
  }

  revalidatePath('/dashboard')

  return { data: null }
}
