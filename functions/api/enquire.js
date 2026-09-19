const json = (x, status = 200) => new Response(JSON.stringify(x), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});
const clean = (v, n) => typeof v === 'string' ? v.trim().slice(0, n) : '';
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok:false, error:'Enquiry storage is not connected yet.' }, 503);
  const b = await request.json().catch(() => ({}));
  const kind = clean(b.kind, 80), name = clean(b.name, 80), email = clean(b.email, 254);
  const phone = clean(b.phone, 32), message = clean(b.message, 1200);
  if (!kind || (!email && !phone) || (!message && kind !== 'appointment')) return json({ ok:false, error:'Add a phone or email and a few details.' }, 400);
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS enquiries (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, name TEXT, email TEXT, phone TEXT, message TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')) )`).run();
  await env.DB.prepare('INSERT INTO enquiries (kind,name,email,phone,message) VALUES (?,?,?,?,?)').bind(kind,name,email,phone,message).run();
  return json({ ok:true, message:'Thanks — the studio will get back to you.' });
}
export function onRequest(context) { return context.request.method === 'POST' ? onRequestPost(context) : json({ok:false,error:'POST only.'},405); }
