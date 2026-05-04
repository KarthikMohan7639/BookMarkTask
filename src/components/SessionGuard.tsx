'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { SESSION_DURATION_MS } from '@/utils/session'

/**
 * SessionGuard reads the `login_expires` cookie that is set at login time
 * (maxAge = 60 s) and sets a precise client-side timer so the user is signed
 * out exactly when the 1-minute window closes – even if they never navigate
 * away and the middleware never gets a chance to enforce it server-side.
 */
export default function SessionGuard() {
  const router = useRouter()

  useEffect(() => {
    let cancelled = false

    const getCookieValue = (name: string): string | undefined =>
      document.cookie
        .split('; ')
        .find((row) => row.startsWith(`${name}=`))
        ?.split('=')
        .slice(1)
        .join('=')

    const signOut = async () => {
      if (cancelled) return
      const supabase = createClient()
      await supabase.auth.signOut()
      if (!cancelled) {
        router.replace('/')
      }
    }

    const loginExpires = getCookieValue('login_expires')
    const expiresAt = loginExpires ? parseInt(loginExpires, 10) : NaN

    if (!loginExpires || isNaN(expiresAt) || Date.now() >= expiresAt) {
      // Cookie already gone or expired – sign out immediately
      signOut()
      return () => { cancelled = true }
    }

    const remaining = expiresAt - Date.now()
    // Cap at the max session duration to guard against extreme clock skew or a
    // corrupted cookie value producing an unreasonably large timeout.
    const delay = Math.min(remaining, SESSION_DURATION_MS)

    const timer = setTimeout(signOut, delay)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
