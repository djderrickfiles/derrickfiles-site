/* ============================================================
   BREVO SYNC  ->  POST /api/newsletter-sync   (admin only)
   Pushes everyone in the contacts database into a Brevo list,
   so campaigns are written and sent from Brevo's own dashboard.

   Set in Cloudflare Pages -> Variables (both encrypted):
     BREVO_API_KEY    from Brevo -> SMTP & API -> API keys
     BREVO_LIST_ID    the numeric id of the list to fill

   Only contacts with consent = 1 are sent. That is a legal
   requirement, not a preference.
   ============================================================ */

const enc = new TextEncoder();

const json = (obj, status = 200) => new Response(JSON.stringify(obj), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

function b64u(buf) {
  const b = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function signedIn(secret, cookie) {
  let token = null;
  for (const part of (cookie || '').split(';')) {
    const p = part.trim();
    if (p.startsWith('dfs_admin=')) token = p.slice('dfs_admin='.length);
  }
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
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

export async function onRequestPost({ request, env }) {
  if (!env.AUTH_SECRET || !env.DB) return json({ ok: false, error: 'Not configured.' }, 503);
  if (!(await signedIn(env.AUTH_SECRET, request.headers.get('Cookie')))) {
    return json({ ok: false, error: 'Sign in to the panel first.' }, 401);
  }
  if (!env.BREVO_API_KEY || !env.BREVO_LIST_ID) {
    return json({
      ok: false,
      error: 'Add BREVO_API_KEY and BREVO_LIST_ID in Cloudflare Pages settings, then redeploy.'
    }, 503);
  }

  const { results } = await env.DB.prepare(
    'SELECT email, name, phone, country FROM contacts WHERE consent = 1 AND email IS NOT NULL ORDER BY created_at DESC LIMIT 5000'
  ).all();

  if (!results.length) return json({ ok: true, sent: 0, message: 'No contacts to sync yet.' });

  const listId = parseInt(env.BREVO_LIST_ID, 10);
  let sent = 0, failed = 0;
  const problems = [];

  // Brevo accepts 100 contacts per import call.
  for (let i = 0; i < results.length; i += 100) {
    const batch = results.slice(i, i + 100).map(function (c) {
      const attrs = {};
      if (c.name) attrs.FIRSTNAME = String(c.name).split(' ')[0];
      if (c.phone) attrs.SMS = c.phone;
      if (c.country) attrs.COUNTRY = c.country;
      return { email: c.email, attributes: attrs };
    });

    try {
      const res = await fetch('https://api.brevo.com/v3/contacts/import', {
        method: 'POST',
        headers: {
          'api-key': env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          listIds: [listId],
          updateExistingContacts: true,
          emptyContactsAttributes: false,
          jsonBody: batch
        })
      });

      if (res.ok) {
        sent += batch.length;
      } else {
        failed += batch.length;
        const detail = await res.text();
        if (problems.length < 3) problems.push(res.status + ': ' + detail.slice(0, 160));
      }
    } catch (err) {
      failed += batch.length;
      if (problems.length < 3) problems.push(String(err.message || err));
    }
  }

  return json({
    ok: failed === 0,
    sent, failed,
    total: results.length,
    problems: problems.length ? problems : undefined,
    message: failed === 0
      ? sent + ' contacts synced to Brevo. Write and send campaigns from brevo.com.'
      : sent + ' synced, ' + failed + ' failed.'
  });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ ok: false, error: 'POST only.' }, 405);
}
