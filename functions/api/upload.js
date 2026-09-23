/* ============================================================
   AUDIO UPLOAD  ->  POST /api/upload
   Admin only. Takes a file from the panel, puts it in R2, and
   returns the key the player uses.

   Needs: R2 binding MEDIA_BUCKET -> dfs-audio, plus AUTH_SECRET.
   ============================================================ */

const enc = new TextEncoder();
const MAX = 220 * 1024 * 1024;            // 220 MB — a long mix at 320kbps
const OK_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
  'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/x-m4a'];

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
  });
}

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

// "Rugby Chill Mix [8.1.2022].mp3" -> "rugby-chill-mix-8-1-2022-<stamp>.mp3"
function slugName(name) {
  const dot = name.lastIndexOf('.');
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 70) || 'mix';
  const ext = (dot > 0 ? name.slice(dot + 1) : 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
  return base + '-' + Date.now().toString(36) + '.' + ext;
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const BUCKET = env.MEDIA_BUCKET;

  if (!BUCKET) return json({ ok: false, error: 'Audio storage is not connected yet.' }, 503);
  if (!env.AUTH_SECRET) return json({ ok: false, error: 'Not configured.' }, 503);
  if (!(await signedIn(env.AUTH_SECRET, request.headers.get('Cookie')))) {
    return json({ ok: false, error: 'Sign in to the panel first.' }, 401);
  }

  let form;
  try { form = await request.formData(); }
  catch { return json({ ok: false, error: 'Could not read the upload.' }, 400); }

  const file = form.get('file');
  if (!file || typeof file === 'string') return json({ ok: false, error: 'No file received.' }, 400);
  if (file.size > MAX) {
    return json({ ok: false, error: 'That file is over 220MB. Export a smaller MP3.' }, 413);
  }

  const type = file.type || 'audio/mpeg';
  if (!OK_TYPES.includes(type)) {
    return json({ ok: false, error: 'That is not an audio file.' }, 415);
  }

  const key = 'mixes/' + slugName(file.name || 'mix.mp3');

  try {
    await BUCKET.put(key, file.stream(), {
      httpMetadata: { contentType: type, cacheControl: 'public, max-age=31536000' }
    });
  } catch (err) {
    return json({ ok: false, error: 'Upload failed. Try again.' }, 500);
  }

  return json({ ok: true, key, url: '/api/audio/' + key.replace(/^mixes\//, ''), size: file.size });
}

export async function onRequest(context) {
  if (context.request.method === 'POST') return onRequestPost(context);
  return json({ ok: false, error: 'POST only.' }, 405);
}
