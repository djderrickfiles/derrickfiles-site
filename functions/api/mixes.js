/* ============================================================
   MIX CATALOGUE  ->  GET /api/mixes
   Pulls the live HearThis channel server-side and returns clean
   JSON. New uploads appear on the site by themselves.
   ============================================================ */

const USER = 'derrickfiles';
const SRC = 'https://api-v2.hearthis.at/' + USER + '/?type=tracks&count=100';

function secs(v) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : 0;
}

function clock(total) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
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
      headers: { 'User-Agent': 'derrickfiles.com' }
    });
    if (!res.ok) throw new Error('hearthis ' + res.status);

    const raw = await res.json();
    if (!Array.isArray(raw)) throw new Error('unexpected shape');

    const mixes = raw.map(function (t) {
      const d = secs(t.duration);
      return {
        id: String(t.id),
        title: t.title || 'Untitled mix',
        duration: d,
        length: clock(d),
        artwork: t.artwork_url || t.user_avatar || '',
        permalink: t.permalink_url || '',
        played: parseInt(t.playback_count, 10) || 0,
        liked: parseInt(t.favorite_count, 10) || 0,
        released: t.release_date || t.release_timestamp || '',
        embed: 'https://app.hearthis.at/embed/' + t.id + '/transparent_black/?style=2',
        // Real audio for the on-site player. Resolved fresh per play,
        // because HearThis signs stream URLs and they expire.
        stream: '/api/stream?id=' + t.id,
        waveform: t.waveform_url || ''
      };
    }).filter(m => m.id);

    return new Response(JSON.stringify({ ok: true, count: mixes.length, mixes }), { headers });
  } catch (err) {
    // Fail soft: the page shows its platform links instead of breaking.
    return new Response(JSON.stringify({ ok: false, mixes: [] }), { headers, status: 200 });
  }
}
