import { createClient } from '@supabase/supabase-js'

export async function getUser(request: Request) {
  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Bearer ')) return { id: 'guest', email: 'guest@local' }
  const token = authorization.slice(7)
  if (!token) return { id: 'guest', email: 'guest@local' }
  const supabase = createClient(process.env.SUPABASE_URL ?? '', process.env.SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? '')
  const { data } = await supabase.auth.getUser(token)
  return data.user
}

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } })
}
