/* ============================================================
   MIXCLOUD CATALOGUE  ->  GET /api/mixcloud
   Pulls the live Mixcloud channel server-side, same idea as
   /api/mixes. No key, no quota — it is a public endpoint.

   Mixcloud does not publish a direct audio URL (their licensing
   requires their own widget), so each item carries the widget
   feed path. The widget plays in-page and the play counts on
   Mixcloud, which is what we want.
   ============================================================ */

const USER = 'derrickfiles';
const SRC = 'https://api.mixcloud.com/' + USER + '/cloudcasts/?limit=50';

function clock(total) {
  const t = parseInt(total, 10) || 0;
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const pad = n => (n < 10 ? '0' + n : String(n));
  return h ? h + ':' + pad(m) + ':' + pad(s) : m + ':' + pad(s);
}

export async function onRequestGet() {
  const headers = {
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=600, s-maxage=1800'
  };

  try {
    const res = await fetch(SRC, {
      cf: { cacheTtl: 1800, cacheEverything: true },
      headers: { 'Accept': 'application/json', 'User-Agent': 'derrickfiles.com' }
    });
    if (!res.ok) throw new Error('mixcloud ' + res.status);

    const body = await res.json();
    const rows = Array.isArray(body && body.data) ? body.data : [];

    const mixes = rows.map(function (c) {
      const pics = c.pictures || {};
      return {
        id: c.slug || c.key,
        key: c.key,                     // "/derrickfiles/<slug>/" — the widget feed
        title: c.name || 'Untitled set',
        duration: parseInt(c.audio_length, 10) || 0,
        length: clock(c.audio_length),
        artwork: pics['320wx320h'] || pics.large || pics.medium || '',
        permalink: c.url || '',
        played: parseInt(c.play_count, 10) || 0,
        liked: parseInt(c.favorite_count, 10) || 0,
        released: c.created_time || '',
        embed: 'https://player-widget.mixcloud.com/widget/iframe/?hide_cover=1&light=0&feed='
          + encodeURIComponent(c.key || '')
      };
    }).filter(m => m.key);

    return new Response(JSON.stringify({ ok: true, count: mixes.length, mixes }), { headers });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, mixes: [] }), { headers, status: 200 });
  }
}
