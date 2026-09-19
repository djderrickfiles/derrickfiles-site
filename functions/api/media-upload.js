import { hasAdminCookie } from '../_auth.js';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

export async function onRequestPost({ request, env }) {
  if (!(await hasAdminCookie(request, env.AUTH_SECRET))) return json({ ok: false, error: 'Not signed in.' }, 401);
  if (!env.MEDIA_BUCKET) return json({ ok: false, error: 'R2 media storage is not connected yet.' }, 503);
  const form = await request.formData().catch(() => null);
  const file = form && form.get('file');
  if (!file || typeof file.arrayBuffer !== 'function') return json({ ok: false, error: 'Choose a media file.' }, 400);
  if (file.size > 100 * 1024 * 1024) return json({ ok: false, error: 'Keep media files under 100MB.' }, 413);
  const original = String(file.name || 'media').toLowerCase().replace(/[^a-z0-9._-]+/g, '-');
  const key = `media/${Date.now().toString(36)}-${original}`;
  await env.MEDIA_BUCKET.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream', cacheControl: 'public, max-age=31536000, immutable' }
  });
  return json({ ok: true, key, url: `/api/media?key=${encodeURIComponent(key)}` });
}

export async function onRequest(context) {
  return context.request.method === 'POST' ? onRequestPost(context) : json({ ok: false, error: 'POST only.' }, 405);
}
