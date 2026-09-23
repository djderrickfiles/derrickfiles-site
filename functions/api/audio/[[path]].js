/* ============================================================
   AUDIO STREAM  ->  GET /api/audio/<file>
   Serves a mix out of R2 with byte-range support, so the player
   can seek instead of downloading the whole thing.

   ?preview=1  caps the response at roughly the first 30 seconds
   of audio — used for paid mixes.
   ============================================================ */

const PREVIEW_SECONDS = 30;
// Paid mixes are usually 320kbps MP3. 40 KB/s is a safe, slightly
// generous byte estimate that never yields less than 30 seconds.
const PREVIEW_BYTES = PREVIEW_SECONDS * 40 * 1024;

function notFound() {
  return new Response('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } });
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const BUCKET = env.MEDIA_BUCKET;
  if (!BUCKET) return notFound();

  const parts = Array.isArray(params.path) ? params.path : [params.path];
  const name = parts.filter(Boolean).join('/');
  if (!name || name.indexOf('..') >= 0) return notFound();

  const key = 'mixes/' + name;
  const url = new URL(request.url);
  const preview = url.searchParams.get('preview') === '1';

  const head = await BUCKET.head(key);
  if (!head) return notFound();

  const total = head.size;
  const cap = preview ? Math.min(PREVIEW_BYTES, total) : total;

  const headers = new Headers({
    'Content-Type': (head.httpMetadata && head.httpMetadata.contentType) || 'audio/mpeg',
    'Accept-Ranges': 'bytes',
    'Cache-Control': preview ? 'public, max-age=3600' : 'public, max-age=31536000',
    'X-Content-Type-Options': 'nosniff'
  });

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

    const obj = await BUCKET.get(key, { range: { offset: start, length: end - start + 1 } });
    if (!obj) return notFound();

    headers.set('Content-Range', 'bytes ' + start + '-' + end + '/' + cap);
    headers.set('Content-Length', String(end - start + 1));
    return new Response(obj.body, { status: 206, headers });
  }

  const obj = preview
    ? await BUCKET.get(key, { range: { offset: 0, length: cap } })
    : await BUCKET.get(key);
  if (!obj) return notFound();

  headers.set('Content-Length', String(cap));
  return new Response(obj.body, { status: 200, headers });
}
