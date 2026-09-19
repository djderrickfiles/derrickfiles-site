/* ============================================================
   CONTACT LIST  ->  GET /api/contacts
   Behind the same password gate as the panel, so only you see it.

   /api/contacts            -> JSON, newest first
   /api/contacts?format=csv -> spreadsheet download
   ============================================================ */

function unauthorized() {
  return new Response(JSON.stringify({ ok: false, error: 'Not signed in.' }), {
    status: 401,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

// Same HMAC check the admin gate uses.
const enc = new TextEncoder();

function b64u(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function validCookie(secret, token) {
  if (!token || token.indexOf('.') < 0) return false;
  const exp = token.split('.')[0];
  if (!/^\d+$/.test(exp)) return false;
  if (Date.now() / 1000 > Number(exp)) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(exp)));
  const expected = exp + '.' + b64u(sig);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

function csvCell(v) {
  if (v === null || v === undefined) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function onRequestGet(context) {
  const { request, env } = context;

  if (!env.AUTH_SECRET || !env.DB) return unauthorized();
  await env.DB.prepare(
    'ALTER TABLE contacts ADD COLUMN marketing_opt_in INTEGER NOT NULL DEFAULT 0'
  ).run().catch(() => {});

  const cookie = request.headers.get('Cookie') || '';
  let token = null;
  for (const part of cookie.split(';')) {
    const p = part.trim();
    if (p.startsWith('dfs_admin=')) token = p.slice('dfs_admin='.length);
  }
  if (!(await validCookie(env.AUTH_SECRET, token))) return unauthorized();

  const { results } = await env.DB.prepare(
    `SELECT email, name, phone, country, source, marketing_opt_in, first_item,
            downloads, created_at, last_seen
       FROM contacts
      ORDER BY created_at DESC
      LIMIT 5000`
  ).all();

  const url = new URL(request.url);
  if (url.searchParams.get('format') === 'csv') {
    const cols = ['email', 'name', 'phone', 'country', 'source', 'marketing_opt_in',
                  'first_item', 'downloads', 'created_at', 'last_seen'];
    const lines = [cols.join(',')];
    for (const r of results) lines.push(cols.map(c => csvCell(r[c])).join(','));
    return new Response(lines.join('\n'), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="derrickfiles-contacts.csv"',
        'Cache-Control': 'no-store'
      }
    });
  }

  return new Response(JSON.stringify({ ok: true, count: results.length, contacts: results }), {
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}
