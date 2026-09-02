import { getUser, json } from './auth'

const idPattern = /^[A-Za-z0-9_-]{8,64}$/
const maxBytes = 4_000_000

export async function POST(request: Request) {
  const user = await getUser(request)
  if (!user) return json({ error: 'Unauthorized' }, 401)
  let body: { id?: string; data?: unknown }
  try { body = await request.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  if (!body.id || !idPattern.test(body.id) || !body.data) return json({ error: 'Invalid canvas payload' }, 400)
  const serialized = JSON.stringify(body.data)
  if (serialized.length > maxBytes) return json({ error: 'Canvas is too large' }, 413)
  const url = process.env.KV_REST_API_URL; const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return json({ error: 'Storage is not configured' }, 503)
  const upstream = await fetch(`${url}/set/canvas:${user.id}:${body.id}`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(serialized), signal: AbortSignal.timeout(8000) })
  if (!upstream.ok) return json({ error: 'Storage unavailable' }, 502)
  return json({ success: true })
}
