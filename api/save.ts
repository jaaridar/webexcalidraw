import { kv } from '@vercel/kv';

export async function POST(request: Request) {
  const { id, data } = await request.json();
  
  if (!id || !data) {
    return new Response(JSON.stringify({ error: 'Missing id or data' }), { status: 400 });
  }

  const key = `canvas:${id}`;
  
  // Store canvas data in Vercel KV
  await kv.set(key, data);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
