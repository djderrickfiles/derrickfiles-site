const json = (x, status = 200) => new Response(JSON.stringify(x), {
  status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

const clean = (v) => typeof v === 'string' ? v.trim().replace(/\D/g, '') : '';

export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, error: 'Payment storage is not connected.' }, 503);
  
  const body = await request.json().catch(() => ({}));
  const item = typeof body.item === 'string' ? body.item.trim().slice(0, 120) : '';
  const phone = clean(body.phone);
  const amount = Number(body.amount) || 0;
  const network = typeof body.network === 'string' ? body.network.trim().slice(0, 30) : 'MTN';
  
  if (!item || !phone || amount <= 0 || phone.length < 9) {
    return json({ ok: false, error: 'Item, valid phone number and amount required.' }, 400);
  }
  
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item TEXT NOT NULL, amount INTEGER NOT NULL, currency TEXT DEFAULT 'UGX',
        phone TEXT NOT NULL, network TEXT, status TEXT DEFAULT 'pending',
        reference TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), processed_at TEXT
      )
    `).run();
    
    const ref = 'PAY-' + Date.now().toString(36).toUpperCase();
    await env.DB.prepare(
      'INSERT INTO payments (item, amount, phone, network, reference) VALUES (?, ?, ?, ?, ?)'
    ).bind(item, amount, phone, network, ref).run();
    
    return json({
      ok: true,
      reference: ref,
      message: `Payment request created. The studio will process this shortly. Amount: ${amount} UGX to ${network} ${phone}`
    });
  } catch (err) {
    return json({ ok: false, error: 'Payment could not be saved. Try again.' }, 500);
  }
}

export function onRequest(context) {
  return context.request.method === 'POST' ? onRequestPost(context) : json({ok:false,error:'POST only.'},405);
}
