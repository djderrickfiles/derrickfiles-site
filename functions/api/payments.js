import { hasAdminCookie } from '../_auth.js';

const response = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }
});

export async function onRequestGet({ request, env }) {
  if (!env.DB || !(await hasAdminCookie(request, env.AUTH_SECRET))) {
    return response({ ok: false, error: 'Not signed in.' }, 401);
  }

  try {
    const { results } = await env.DB.prepare(`
      SELECT id, item, amount, currency, phone, network, status, reference, created_at, processed_at
      FROM payments
      ORDER BY created_at DESC
      LIMIT 500
    `).all();
    return response({ ok: true, payments: results });
  } catch {
    return response({ ok: false, error: 'Payment records are not available yet.' }, 500);
  }
}
