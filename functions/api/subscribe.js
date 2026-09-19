/* ============================================================
   CONTACT CAPTURE  ->  POST /api/subscribe
   Someone wants a mix. They give an email (and optionally a
   phone). We store them once, count repeat downloads, and
   return the download URL.

   Needs a D1 binding named DB, pointing at "dfs-contacts".
   ============================================================ */

const json = (obj, status) => new Response(JSON.stringify(obj), {
  status: status || 200,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

// Deliberately permissive. A DJ in Kampala with a weird domain
// should not be blocked by a clever regex.
function looksLikeEmail(v) {
  return typeof v === 'string' && v.length > 4 && v.length < 254
    && v.indexOf('@') > 0 && v.indexOf('.', v.indexOf('@')) > 0
    && !/\s/.test(v);
}

function clean(v, max) {
  if (typeof v !== 'string') return null;
  const s = v.trim().slice(0, max || 120);
  return s.length ? s : null;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  if (!env.DB) {
    return json({ ok: false, error: 'Contact storage is not connected yet.' }, 503);
  }

  let body;
  try {
    const ct = request.headers.get('Content-Type') || '';
    if (ct.includes('application/json')) {
      body = await request.json();
    } else {
      const form = await request.formData();
      body = Object.fromEntries(form);
    }
  } catch {
    return json({ ok: false, error: 'Could not read that.' }, 400);
  }

  const email = clean(body.email, 254);
  if (!looksLikeEmail(email)) {
    return json({ ok: false, error: 'That email does not look right.' }, 400);
  }

  const name    = clean(body.name, 80);
  const phone   = clean(body.phone, 32);
  const source  = clean(body.source, 40) || 'newsletter';
  const item    = clean(body.item, 160);
  const country = request.headers.get('CF-IPCountry') || null;

  try {
    // One row per person. Coming back for a second mix bumps the
    // counter and refreshes anything they left blank the first time.
    await env.DB.prepare(
      `INSERT INTO contacts (email, name, phone, country, source, first_item)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(email) DO UPDATE SET
         downloads = downloads + 1,
         last_seen = datetime('now'),
         name  = COALESCE(excluded.name,  contacts.name),
         phone = COALESCE(excluded.phone, contacts.phone)`
    ).bind(email, name, phone, country, source, item).run();

    if (item) {
      const row = await env.DB.prepare('SELECT id FROM contacts WHERE email = ?')
        .bind(email).first();
      await env.DB.prepare('INSERT INTO downloads (contact_id, item) VALUES (?, ?)')
        .bind(row ? row.id : null, item).run();
    }
  } catch (err) {
    return json({ ok: false, error: 'Could not save that. Try again.' }, 500);
  }

  return json({ ok: true, message: 'You are on the list. Your download is ready.' });
}

// Anything other than POST gets a flat no.
export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ ok: false, error: 'POST only.' }, 405);
}
