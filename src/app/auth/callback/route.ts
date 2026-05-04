import { NextResponse } from 'next/server'
// The client you created from the Server-Side Auth instructions
import { createClient } from '@/utils/supabase/server'
import { SESSION_DURATION_MS } from '@/utils/session'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let redirectUrl: string
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
      }

      const response = NextResponse.redirect(redirectUrl)
      // Set a session-expiry cookie readable by both server middleware and client JS.
      // The cookie value holds the exact expiry timestamp; maxAge ensures it auto-expires
      // after 1 minute so the middleware can detect the timeout on the next request.
      const expiresAt = Date.now() + SESSION_DURATION_MS
      response.cookies.set('login_expires', String(expiresAt), {
        maxAge: SESSION_DURATION_MS / 1000, // seconds
        sameSite: 'lax',
        path: '/',
        // Not httpOnly so the client-side SessionGuard can also read it
      })
      return response
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
