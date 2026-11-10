// LilKangooMedia Phase 20.4 — reliable Netlify enquiry handler.
// POST /api/enquiry — records are stored before attempting a best-effort email.
// The optional browser-generated request_id is a UUID v4 and also the lead PK.
// Repeating the same request cannot create a second lead or email notification.
// Keep all Supabase/Resend credentials in Netlify environment variables.

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
});

const str = (val, max) => typeof val === 'string' ? val.trim().slice(0, max) : '';
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,
  c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const emailValid = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 200;
const uuidV4 = value => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

async function verifyTurnstile(secret, token, ip) {
  if (!secret) return true;
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
  const type = (request.headers.get('content-type') || '').toLowerCase();
  if (!type.includes('application/json')) return json({ok: false, error: 'Expected JSON data.'}, 415);
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
  if (data.website) return json({ok: true}); // Existing honeypot behavior.

  const name = str(data.name, 100);
  const email = str(data.email, 200);
  const phone = str(data.phone, 40);
  const service = str(data.service_slug || data.service_type, 120);
  const packageId = str(data.package_id, 100);
  const preferredDate = str(data.preferred_date, 25);
  const message = str(data.message, 3000);
  const submissionType = str(data.type, 40) || 'general_enquiry';
  const consent = data.consent === 'on' || data.consent === true || data.consent === 'true';
  const requestId = str(data.request_id, 80);
  if (requestId && !uuidV4(requestId)) {
    return json({ok: false, error: 'Invalid request identifier.'}, 400);
  }
  if (!name || !emailValid(email) || message.length < 6 || !consent) {
    return json({ok: false, error: 'Enter your name, valid email, a message of at least 6 characters, and consent.'}, 400);
  }
  if (preferredDate && !/^\d{4}-\d{2}-\d{2}$/.test(preferredDate)) {
    return json({ok: false, error: 'Invalid preferred date.'}, 400);
  }

  const env = process.env;
  const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !env[key]);
  if (missing.length) {
    console.error('LKM enquiry: missing database environment variables:', missing.join(', '));
    return json({ok: false, error: 'The form is not configured yet. Please email photo@lilkangoomedia.com.'}, 503);
  }

  try {
    const ip = (request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    if (!await verifyTurnstile(env.TURNSTILE_SECRET, data.turnstile_token || data['cf-turnstile-response'], ip)) {
      return json({ok: false, error: 'Anti-spam verification failed. Please try again.'}, 403);
    }
  } catch (error) {
    console.error('LKM enquiry: anti-spam service unavailable', error);
    return json({ok: false, error: 'Anti-spam verification unavailable. Please try again.'}, 503);
  }

  const supabaseURL = env.SUPABASE_URL.replace(/\/+$/, '');
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  const headers = {
    apikey: key,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
  };
  if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`;
  const addons = Array.isArray(data.addon_ids) ? data.addon_ids.slice(0, 15).map(v => str(v, 80)) : [];
  const lead = {
    ...(requestId ? {id: requestId} : {}),
    customer_name: name,
    customer_email: email,
    phone,
    preferred_date: preferredDate || null,
    service_slug: service || null,
    package_id: packageId || null,
    message,
    submission_type: submissionType,
    addons,
    status: 'new',
  };

  let id = requestId;
  try {
    const saved = await fetch(`${supabaseURL}/rest/v1/contact_leads`, {
      method: 'POST', headers, body: JSON.stringify(lead),
    });
    if (saved.status === 409 && requestId) {
      // Only acknowledge a retry if the previously stored record exactly matches
      // this client's submitted data. Never return any private lead fields.
      const lookup = await fetch(`${supabaseURL}/rest/v1/contact_leads?id=eq.${encodeURIComponent(requestId)}&select=id,customer_name,customer_email,phone,preferred_date,service_slug,package_id,message,submission_type,addons&limit=1`, {
        headers: {apikey: key, ...(headers.Authorization ? {Authorization: headers.Authorization} : {})},
      });
      if (lookup.ok) {
        const records = await lookup.json();
        const existing = Array.isArray(records) ? records[0] : null;
        if (existing && existing.customer_name === name && existing.customer_email === email &&
            existing.phone === phone && (existing.preferred_date || null) === (preferredDate || null) &&
            (existing.service_slug || null) === (service || null) && (existing.package_id || null) === (packageId || null) &&
            existing.message === message && existing.submission_type === submissionType &&
            JSON.stringify(existing.addons || []) === JSON.stringify(addons)) {
          return json({ok: true, saved: true, duplicate: true, id: requestId, notification_sent: null});
        }
      }
      console.error('LKM enquiry: conflicting request identifier; refusing to overwrite existing lead.');
      return json({ok: false, error: 'This request could not be verified. Please contact us directly.'}, 409);
    }
    if (!saved.ok) {
      console.error('LKM enquiry: Supabase insert failed', saved.status, (await saved.text()).slice(0, 250));
      return json({ok: false, saved: false, error: 'The enquiry could not be saved. Please contact us by email.'}, 502);
    }
    const rows = await saved.json();
    id = rows?.[0]?.id || requestId || '';
  } catch (error) {
    console.error('LKM enquiry: database request failed', error);
    return json({ok: false, saved: false, error: 'Enquiry unavailable right now. Please email photo@lilkangoomedia.com.'}, 503);
  }

  // The lead is DURABLY SAVED. Email is a secondary, best-effort notification.
  // A Resend failure must not tell customers that their submission failed.
  if (!env.RESEND_API_KEY || !env.FROM_EMAIL) {
    console.error('LKM enquiry: lead saved, but Resend notification is not configured; lead ID:', id);
    return json({ok: true, saved: true, id, notification_sent: false});
  }
  const html = `<h2>New LilKangooMedia enquiry</h2>` +
    `<p><b>Name:</b> ${escapeHTML(name)}<br><b>Email:</b> ${escapeHTML(email)}<br>` +
    `<b>Phone:</b> ${escapeHTML(phone)}<br><b>Service:</b> ${escapeHTML(service)}<br>` +
    `<b>Package:</b> ${escapeHTML(packageId)}<br><b>Preferred date:</b> ${escapeHTML(preferredDate)}</p>` +
    `<h3>Message</h3><p style="white-space:pre-wrap">${escapeHTML(message)}</p>` +
    `<p><small>Supabase lead ID: ${escapeHTML(id)}</small></p>`;
  try {
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
      console.error('LKM enquiry: lead saved, Resend failed', sent.status, (await sent.text()).slice(0, 250), 'lead ID:', id);
      return json({ok: true, saved: true, id, notification_sent: false});
    }
    return json({ok: true, saved: true, id, notification_sent: true});
  } catch (error) {
    console.error('LKM enquiry: lead saved, Resend request threw an error', error, 'lead ID:', id);
    return json({ok: true, saved: true, id, notification_sent: false});
  }
}

export const config = {path: '/api/enquiry'};
