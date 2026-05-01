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
  const supabase = await createClient()

  // Verify server-side session
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Unauthorized: You must be logged in to add a bookmark.' }
  }

  // Insert bookmark
  const { data, error } = await supabase
    .from('bookmarks')
    .insert({
      user_id: user.id,
      url,
      title: title || url, // fallback to URL if title is empty
    })
    .select()
    .single()

  if (error) {
    console.error('Error inserting bookmark:', error)
    return { error: 'Failed to add bookmark to the database.' }
  }

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
    console.error('Error deleting bookmark:', error)
    return { error: 'Failed to delete bookmark from the database.' }
  }

  revalidatePath('/dashboard')

  return { data: null }
}
