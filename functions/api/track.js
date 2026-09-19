const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false }, 503);
  const body = await request.json().catch(() => ({}));
  const item = typeof body.item === 'string' ? body.item.trim().slice(0, 160) : '';
  const event = typeof body.event === 'string' ? body.event.trim().slice(0, 30) : '';
  if (!item || !/^(play|download|favorite|buy|outbound)$/.test(event)) return json({ ok: false }, 400);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS media_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item TEXT NOT NULL,
    event TEXT NOT NULL,
    country TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`).run();
  await env.DB.prepare('INSERT INTO media_events (item, event, country) VALUES (?, ?, ?)')
    .bind(item, event, request.headers.get('CF-IPCountry') || null).run();
  return json({ ok: true });
}

export function onRequest() {
  return json({ ok: false, error: 'POST only.' }, 405);
}
