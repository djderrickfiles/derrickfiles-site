const enc = new TextEncoder();

function b64u(buf) {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function validAdminCookie(secret, token) {
  if (!secret || !token || token.indexOf('.') < 0) return false;
  const exp = token.split('.')[0];
  if (!/^\d+$/.test(exp) || Date.now() / 1000 > Number(exp)) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(exp)));
  const expected = exp + '.' + b64u(sig);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

export function hasAdminCookie(request, secret) {
  const cookie = request.headers.get('Cookie') || '';
  const found = cookie.split(';').map(v => v.trim()).find(v => v.startsWith('dfs_admin='));
  return validAdminCookie(secret, found ? found.slice(9) : '');
}
