/* ============================================================
   PASSWORD GATE FOR /admin/
   Cloudflare Pages Function. Runs in front of every /admin/*
   request. Nothing else on the site is affected.

   Set these in Cloudflare Pages -> Settings -> Variables:
     SITE_PASSWORD   your panel password  (tick Encrypt)
     AUTH_SECRET     any long random string (tick Encrypt)

   Neither value is ever stored in this repository.
   ============================================================ */

var COOKIE = 'dfs_admin';
var MAX_AGE = 60 * 60 * 12;
var enc = new TextEncoder();

function toKey(secret) {
  return crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

function b64u(buf) {
  var bytes = new Uint8Array(buf), s = '';
  for (var i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(secret, exp) {
  var k = await toKey(secret);
  var sig = await crypto.subtle.sign('HMAC', k, enc.encode(String(exp)));
  return exp + '.' + b64u(sig);
}

async function valid(secret, token) {
  if (!token || token.indexOf('.') < 0) return false;
  var exp = token.split('.')[0];
  if (!/^\d+$/.test(exp)) return false;
  if (Date.now() / 1000 > Number(exp)) return false;
  var expected = await sign(secret, exp);
  if (expected.length !== token.length) return false;
  var diff = 0;
  for (var i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return diff === 0;
}

function samePassword(a, b) {
  var x = enc.encode(String(a)), y = enc.encode(String(b));
  var diff = x.length ^ y.length;
  var n = Math.max(x.length, y.length);
  for (var i = 0; i < n; i++) {
    diff |= (i < x.length ? x[i] : 0) ^ (i < y.length ? y[i] : 0);
  }
  return diff === 0;
}

function loginPage(error) {
  var err = error ? '<p class="err">' + error + '</p>' : '';
  return '<!DOCTYPE html><html lang="en"><head>' +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="robots" content="noindex,nofollow">' +
    '<title>Studio Control Panel</title>' +
    '<link rel="preconnect" href="https://fonts.googleapis.com">' +
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>' +
    '<link href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;900&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">' +
    '<style>' +
    ':root{--ink:#0a0a0b;--s1:#151517;--line:#26262a;--tx:#f1f1f3;--mu:#a6a6ad;--gold:#ffc91e;--bad:#ff6b6b}' +
    '*{box-sizing:border-box}' +
    'body{margin:0;min-height:100vh;display:grid;place-items:center;background:var(--ink);' +
    'color:var(--tx);font:16px/1.65 "Inter",system-ui,-apple-system,Arial,sans-serif;padding:24px}' +
    '.box{width:100%;max-width:380px}' +
    '.lgo{font-family:"Archivo",system-ui,sans-serif;font-weight:900;font-size:22px;' +
    'letter-spacing:-.03em;text-transform:uppercase;line-height:1}' +
    '.lgo b{color:var(--gold)}' +
    '.lgo small{display:block;font-size:9px;letter-spacing:.3em;color:#8a8a92;font-weight:600;margin-top:6px}' +
    'p.h{color:var(--mu);font-size:15px;margin:22px 0 26px}' +
    'label{display:block;font-family:"Archivo",sans-serif;font-size:10px;font-weight:700;' +
    'letter-spacing:.18em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}' +
    'input{width:100%;background:var(--s1);border:1px solid var(--line);color:var(--tx);' +
    'padding:14px 15px;font:16px/1.5 "Inter",sans-serif;border-radius:0}' +
    'input:focus{outline:0;border-color:var(--gold)}' +
    'button{width:100%;margin-top:14px;background:var(--gold);color:#000;border:0;cursor:pointer;' +
    'font-family:"Archivo",sans-serif;font-weight:900;font-size:12.5px;letter-spacing:.12em;' +
    'text-transform:uppercase;padding:15px}' +
    'button:hover{background:#fff}' +
    '.err{color:var(--bad);font-size:14px;margin:16px 0 0}' +
    '.ft{color:#6c6c74;font-size:12.5px;margin-top:28px;line-height:1.7}' +
    '</style></head><body>' +
    '<form class="box" method="POST">' +
    '<div class="lgo">DERRICK<b>FILES</b><small>STUDIO CONTROL PANEL</small></div>' +
    '<p class="h">This panel edits the live website. Enter the studio password to continue.</p>' +
    '<label for="password">Password</label>' +
    '<input id="password" name="password" type="password" autocomplete="current-password" autofocus required>' +
    '<button type="submit">Unlock</button>' + err +
    '<p class="ft">Stays unlocked for 12 hours on this browser.<br>' +
    'Plot 1 Bukoto Street, Kampala &middot; 0789 191 660</p>' +
    '</form></body></html>';
}

function htmlResponse(body, status) {
  return new Response(body, {
    status: status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      'X-Frame-Options': 'DENY',
      'Referrer-Policy': 'no-referrer'
    }
  });
}

export async function onRequest(context) {
  var request = context.request, env = context.env;
  var url = new URL(request.url);

  if (!env.SITE_PASSWORD || !env.AUTH_SECRET) {
    return htmlResponse(loginPage(
      'Not configured. Add SITE_PASSWORD and AUTH_SECRET in Cloudflare Pages, Settings, Variables, then redeploy.'
    ), 503);
  }

  if (url.searchParams.has('logout')) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/admin/',
        'Set-Cookie': COOKIE + '=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
      }
    });
  }

  if (request.method === 'POST') {
    var form = await request.formData().catch(function () { return null; });
    var given = form ? (form.get('password') || '') : '';
    if (samePassword(given, env.SITE_PASSWORD)) {
      var exp = Math.floor(Date.now() / 1000) + MAX_AGE;
      var token = await sign(env.AUTH_SECRET, exp);
      return new Response(null, {
        status: 302,
        headers: {
          Location: url.pathname,
          'Set-Cookie': COOKIE + '=' + token + '; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=' + MAX_AGE
        }
      });
    }
    await new Promise(function (r) { setTimeout(r, 900); });
    return htmlResponse(loginPage('Wrong password.'), 401);
  }

  var cookie = request.headers.get('Cookie') || '';
  var found = null;
  var parts = cookie.split(';');
  for (var i = 0; i < parts.length; i++) {
    var p = parts[i].trim();
    if (p.indexOf(COOKIE + '=') === 0) found = p.slice(COOKIE.length + 1);
  }

  if (await valid(env.AUTH_SECRET, found)) {
    var res = await context.next();
    var out = new Response(res.body, res);
    out.headers.set('Cache-Control', 'no-store');
    out.headers.set('X-Robots-Tag', 'noindex, nofollow');
    out.headers.set('X-Frame-Options', 'DENY');
    return out;
  }

  return htmlResponse(loginPage(), 401);
}
