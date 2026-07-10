import { kv } from '@vercel/kv';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }

  const data = await kv.get(`canvas:${id}`);
  
  if (!data) {
    return new Response(JSON.stringify({
      elements: [],
      appState: { theme: 'light' }
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }
  
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}