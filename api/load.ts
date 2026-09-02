import { getUser, json } from './auth'

const idPattern = /^[A-Za-z0-9_-]{8,64}$/
const empty = { elements: [], appState: { theme: 'light' } }

export async function GET(request: Request) {
  const user = await getUser(request)
  if (!user) return json({ error: 'Unauthorized' }, 401)
  const id = new URL(request.url).searchParams.get('id')
  if (!id || !idPattern.test(id)) return json({ error: 'Invalid canvas id' }, 400)
  const url = process.env.KV_REST_API_URL; const token = process.env.KV_REST_API_TOKEN
  if (!url || !token) return json({ error: 'Storage is not configured' }, 503)
  const upstream = await fetch(`${url}/get/canvas:${user.id}:${id}`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(8000) })
  if (!upstream.ok) return json({ error: 'Storage unavailable' }, 502)
  const result = (await upstream.json()).result
  if (!result) return json(empty)
  try { return json(JSON.parse(result)) } catch { return json({ error: 'Stored canvas is invalid' }, 502) }
}
