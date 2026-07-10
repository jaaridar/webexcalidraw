export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id' }), { status: 400 });
  }

  const kvUrl = process.env.KV_REST_API_URL;
  const token = process.env.KV_REST_API_TOKEN;

  if (!kvUrl || !token) {
    return new Response(JSON.stringify({ elements: [], appState: { theme: 'light' } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch(`${kvUrl}/get/canvas:${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json();
  const data = json.result ? JSON.parse(json.result) : null;

  if (!data) {
    return new Response(JSON.stringify({ elements: [], appState: { theme: 'light' } }), {
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}