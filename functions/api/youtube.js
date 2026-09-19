/* ============================================================
   YOUTUBE FEED  ->  GET /api/youtube
   Reads the channel's public RSS feed on the server and returns
   clean JSON. No API key, no quota, and new uploads appear on
   the site by themselves.
   ============================================================ */

const CHANNEL_ID = 'UCc0WHu9NIWsfwHRgnLqVnkQ';
const FEED = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + CHANNEL_ID;

function pick(block, tag) {
  const m = block.match(new RegExp('<' + tag + '[^>]*>([\\s\\S]*?)</' + tag + '>'));
  return m ? m[1] : '';
}

function unescapeXml(s) {
  return s.replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
          .replace(/&amp;/g, '&').trim();
}

export async function onRequestGet(context) {
  const headers = {
    'Content-Type': 'application/json',
    // Cloudflare edge holds it 30 min; browsers 10 min.
    'Cache-Control': 'public, max-age=600, s-maxage=1800'
  };

  try {
    const res = await fetch(FEED, {
      cf: { cacheTtl: 1800, cacheEverything: true },
      headers: { 'User-Agent': 'derrickfiles.com' }
    });
    if (!res.ok) throw new Error('feed ' + res.status);

    const xml = await res.text();
    const entries = xml.split('<entry>').slice(1);

    const videos = entries.map(function (e) {
      const id = pick(e, 'yt:videoId');
      if (!id) return null;
      return {
        id: id,
        title: unescapeXml(pick(e, 'title')),
        published: pick(e, 'published'),
        thumb: 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg'
      };
    }).filter(Boolean);

    return new Response(JSON.stringify({ ok: true, count: videos.length, videos: videos }), { headers });
  } catch (err) {
    // Never break the page — the front end falls back to a channel link.
    return new Response(JSON.stringify({ ok: false, videos: [] }), { headers: headers, status: 200 });
  }
}
