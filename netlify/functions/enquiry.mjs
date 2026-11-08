// LilKangooMedia — Netlify Functions, enquiry endpoint
// Route: POST /api/enquiry. Never add secrets to this source file.
// Standalone handler so the existing static website and old HTML pages remain untouched.

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
});

const str = (val, max) => typeof val === 'string' ? val.trim().slice(0, max) : '';
const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g,
  c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const emailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;

async function verifyTurnstile(secret, token, ip) {
  if (!secret) return true; // Turnstile is strongly recommended for production.
  if (!token) return false;
  const reply = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: new URLSearchParams({secret, response: token, remoteip: ip || ''}),
  });
  if (!reply.ok) return false;
  const result = await reply.json();
  return result.success === true;
}

export default async function enquiry(request) {
  if (request.method !== 'POST') return json({ok: false, error: 'Method not allowed.'}, 405);

  const requestOrigin = request.headers.get('origin');
  if (requestOrigin && requestOrigin !== new URL(request.url).origin) {
    return json({ok: false, error: 'Cross-origin submissions are not allowed.'}, 403);
  }
  const type = request.headers.get('content-type') || '';
  if (!type.toLowerCase().includes('application/json')) {
    return json({ok: false, error: 'Expected JSON data.'}, 415);
  }
  if (Number(request.headers.get('content-length') || 0) > 32000) {
    return json({ok: false, error: 'Request too large.'}, 413);
  }

  let data;
  try {
    const raw = await request.text();
    if (raw.length > 32000) return json({ok: false, error: 'Request too large.'}, 413);
    data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Invalid payload');
  } catch {
    return json({ok: false, error: 'Invalid request.'}, 400);
  }

  // Bots filling the hidden honeypot should not create a lead.
  if (data.website) return json({ok: true});

  const name = str(data.name, 100);
  const email = str(data.email, 200);
  const phone = str(data.phone, 40);
  const service = str(data.service_slug || data.service_type, 120);
  const packageId = str(data.package_id, 100);
  const preferredDate = str(data.preferred_date, 25);
  const message = str(data.message, 3000);
  const submissionType = str(data.type, 40) || 'general_enquiry';
  const consent = data.consent === 'on' || data.consent === true || data.consent === 'true';
  if (!name || !emailValid(email) || message.length < 6 || !consent) {
    return json({ok: false, error: 'Enter your name, valid email, a message of at least 6 characters, and consent.'}, 400);
  }
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    return json({ok: false, error: 'Invalid preferred date.'}, 400);
  }

  const env = process.env;
  const needed = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RESEND_API_KEY', 'FROM_EMAIL'];
  const missing = needed.filter(n => !env[n]);
  if (missing.length) {
    console.error('LKM enquiry: missing Netlify Functions variables:', missing.join(', '));
    return json({ok: false, error: 'The form is not configured yet. Please email photo@lilkangoomedia.com.'}, 503);
  }

  try {
    const ip = (request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    if (!await verifyTurnstile(env.TURNSTILE_SECRET, data.turnstile_token || data['cf-turnstile-response'], ip)) {
      return json({ok: false, error: 'Anti-spam verification failed. Please try again.'}, 403);
    }

    const supabaseURL = env.SUPABASE_URL.replace(/\/+$/, '');
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    // Supabase legacy service_role JWT and new sb_secret_... keys use different auth headers.
    const headers = {
      'apikey': key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
    if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;

    const lead = {
      customer_name: name,
      customer_email: email,
      phone,
      preferred_date: preferredDate || null,
      service_slug: service || null,
      package_id: packageId || null,
      message,
      submission_type: submissionType,
      addons: Array.isArray(data.addon_ids) ? data.addon_ids.slice(0, 15).map(v => str(v, 80)) : [],
      status: 'new',
    };

    const saved = await fetch(`${supabaseURL}/rest/v1/contact_leads`, {
      method: 'POST', headers, body: JSON.stringify(lead),
    });
    if (!saved.ok) {
      console.error('LKM enquiry: Supabase insert failed', saved.status, (await saved.text()).slice(0, 300));
      return json({ok: false, error: 'The enquiry could not be saved. Please contact us by email.'}, 502);
    }
    const rows = await saved.json();
    const id = rows?.[0]?.id || '';
    const html = `<h2>New LilKangooMedia enquiry</h2>` +
      `<p><b>Name:</b> ${escapeHTML(name)}<br><b>Email:</b> ${escapeHTML(email)}<br>` +
      `<b>Phone:</b> ${escapeHTML(phone)}<br><b>Service:</b> ${escapeHTML(service)}<br>` +
      `<b>Package:</b> ${escapeHTML(packageId)}<br><b>Preferred date:</b> ${escapeHTML(preferredDate)}</p>` +
      `<h3>Message</h3><p style="white-space:pre-wrap">${escapeHTML(message)}</p>` +
      `<p><small>Supabase lead ID: ${escapeHTML(id)}</small></p>`;

    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {'Authorization': `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json'},
      body: JSON.stringify({
        from: env.FROM_EMAIL,
        to: [env.CONTACT_EMAIL || 'photo@lilkangoomedia.com'],
        reply_to: email,
        subject: `LilKangooMedia enquiry — ${service || 'General'} — ${name}`,
        html,
      }),
    });
    if (!sent.ok) {
      console.error('LKM enquiry: Resend notification failed', sent.status, (await sent.text()).slice(0, 300), 'lead ID:', id);
      return json({ok: false, saved: true, error: 'Your enquiry was saved, but the email notification failed. Please email photo@lilkangoomedia.com to confirm.'}, 502);
    }
    return json({ok: true, id});
  } catch (error) {
    console.error('LKM enquiry: unexpected server error', error);
    return json({ok: false, error: 'Enquiry unavailable right now. Please email photo@lilkangoomedia.com.'}, 503);
  }
}

export const config = {path: '/api/enquiry'};
