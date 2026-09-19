const json = (body, status = 400) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

export async function onRequestGet({ request, env }) {
  if (!env.MEDIA_BUCKET) return json({ ok: false, error: 'Media storage is not connected.' }, 503);
  const key = new URL(request.url).searchParams.get('key') || '';
  if (!/^media\/[a-z0-9._-]+$/i.test(key)) return json({ ok: false, error: 'Invalid media key.' });
  const object = await env.MEDIA_BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('Accept-Ranges', 'bytes');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(object.body, { headers });
}
