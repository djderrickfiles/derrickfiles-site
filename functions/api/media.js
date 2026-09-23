/* ============================================================
   MEDIA STREAM  ->  GET /api/media?key=media/<file>
   Serves audio out of R2 with real byte-range support, so the
   player can seek instead of downloading the whole mix.

   &preview=1 caps the response at roughly the first 30 seconds.
   Used for paid mixes: the browser physically cannot read past
   the cap, so the limit is enforced on the server, not in JS.
   ============================================================ */

const PREVIEW_SECONDS = 30;
// Mixes are usually 320kbps MP3 (~40 KB/s). Slightly generous so a
// preview is never shorter than the promised 30 seconds.
const PREVIEW_BYTES = PREVIEW_SECONDS * 40 * 1024;

const json = (body, status = 400) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

export async function onRequestGet({ request, env }) {
  if (!env.MEDIA_BUCKET) return json({ ok: false, error: 'Media storage is not connected.' }, 503);

  const url = new URL(request.url);
  const key = url.searchParams.get('key') || '';
  if (!/^media\/[a-z0-9._-]+$/i.test(key)) return json({ ok: false, error: 'Invalid media key.' });

  const preview = url.searchParams.get('preview') === '1';

  const head = await env.MEDIA_BUCKET.head(key);
  if (!head) return new Response('Not found', { status: 404 });

  const total = head.size;
  const cap = preview ? Math.min(PREVIEW_BYTES, total) : total;

  const headers = new Headers();
  if (head.httpMetadata && head.httpMetadata.contentType) {
    headers.set('Content-Type', head.httpMetadata.contentType);
  } else {
    headers.set('Content-Type', 'audio/mpeg');
  }
  headers.set('Accept-Ranges', 'bytes');
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('Cache-Control', preview
    ? 'public, max-age=3600'
    : 'public, max-age=31536000, immutable');

  const range = request.headers.get('Range');
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1], 10) : 0;
    let end = m && m[2] ? parseInt(m[2], 10) : cap - 1;
    if (end > cap - 1) end = cap - 1;

    if (!Number.isFinite(start) || start > end || start >= cap) {
      headers.set('Content-Range', 'bytes */' + cap);
      return new Response(null, { status: 416, headers });
    }

    const part = await env.MEDIA_BUCKET.get(key, {
      range: { offset: start, length: end - start + 1 }
    });
    if (!part) return new Response('Not found', { status: 404 });

    headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + cap);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(part.body, { status: 206, headers });
  }

  const object = preview
    ? await env.MEDIA_BUCKET.get(key, { range: { offset: 0, length: cap } })
    : await env.MEDIA_BUCKET.get(key);
  if (!object) return new Response('Not found', { status: 404 });

  headers.set('Content-Length', String(cap));
  return new Response(object.body, { status: 200, headers });
}
