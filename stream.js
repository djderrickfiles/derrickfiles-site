/* ============================================================
   STREAM RESOLVER  ->  GET /api/stream?id=<hearthis track id>

   The site's player needs a real audio URL, not an iframe.
   HearThis hands out a signed, short-lived stream URL per track,
   so we resolve a fresh one on every request and redirect to it.

   Redirecting (rather than piping the bytes) means:
     - the play still registers on HearThis's own counter
     - none of the audio bandwidth lands on our Cloudflare bill
     - range requests / seeking are handled by HearThis
   ============================================================ */

const USER = 'derrickfiles';

function bad(status, msg) {
  return new Response(msg, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function onRequestGet({ request }) {
  const id = new URL(request.url).searchParams.get('id') || '';
  if (!/^\d+$/.test(id)) return bad(400, 'Bad id.');

  let track;
  try {
    const res = await fetch(
      'https://api-v2.hearthis.at/' + USER + '/?type=tracks&count=100',
      { headers: { 'Accept': 'application/json' }, cf: { cacheTtl: 600 } }
    );
    if (!res.ok) return bad(502, 'Catalogue unavailable.');
    const all = await res.json();
    track = (Array.isArray(all) ? all : []).find(t => String(t.id) === id);
  } catch (err) {
    return bad(502, 'Catalogue unavailable.');
  }

  if (!track) return bad(404, 'No such mix.');

  const url = track.stream_url || track.preview_url;
  if (!url) return bad(404, 'No stream for that mix.');

  // 302, not 301 — the signed URL changes and must never be cached hard.
  return new Response(null, {
    status: 302,
    headers: { Location: url, 'Cache-Control': 'no-store' }
  });
}

export async function onRequest(context) {
  if (context.request.method === 'GET' || context.request.method === 'HEAD') {
    return onRequestGet(context);
  }
  return bad(405, 'GET only.');
}
