const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkQuota } = require('../middleware/quota');
const { emailQueue } = require('../lib/redis');
const supabase = require('../lib/supabase');

/**
 * POST /v1/send
 * 
 * Headers:
 *   Authorization: Bearer sk_live_...
 *   Idempotency-Key: <unique string> (optional but recommended)
 * 
 * Body:
 *   {
 *     to: "user@example.com",
 *     type: "otp" | "magic_link" | "password_reset" | "welcome" | "custom",
 *     subject: "Your OTP Code",       // required for type=custom
 *     token: "123456",               // for otp/magic_link/password_reset
 *     name: "John",                  // optional — personalisation
 *     custom_html: "<p>...</p>"      // required for type=custom
 *   }
 */
router.post('/', authenticate, checkQuota, async (req, res) => {
  try {
    const { to, type = 'custom', subject, token, name, custom_html } = req.body;

    // --- Validation ---
    if (!to || !to.includes('@')) {
      return res.status(400).json({ error: '`to` must be a valid email address.' });
    }
    if (!['otp', 'magic_link', 'password_reset', 'welcome', 'custom'].includes(type)) {
      return res.status(400).json({ error: 'Invalid `type`. Must be otp | magic_link | password_reset | welcome | custom.' });
    }
    if (type === 'custom' && (!subject || !custom_html)) {
      return res.status(400).json({ error: 'For type=custom, `subject` and `custom_html` are required.' });
    }
    if (['otp', 'magic_link', 'password_reset'].includes(type) && !token) {
      return res.status(400).json({ error: `\`token\` is required for type=${type}.` });
    }

    // --- Idempotency Check ---
    const idempotencyKey = req.headers['idempotency-key'];
    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from('usage_logs')
        .select('id, status')
        .eq('developer_id', req.developer.id)
        .eq('idempotency_key', idempotencyKey)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // within 24h
        .single();

      if (existing) {
        return res.status(200).json({
          message: 'Duplicate request — email already queued.',
          log_id: existing.id,
          status: existing.status,
          idempotent: true
        });
      }
    }

    // --- Create log entry in DB (status: queued) ---
    const { data: log, error: logError } = await supabase
      .from('usage_logs')
      .insert({
        developer_id: req.developer.id,
        api_key_id: req.apiKey.id,
        idempotency_key: idempotencyKey || null,
        recipient_email: to,
        email_type: type,
        status: 'queued'
      })
      .select('id')
      .single();

    if (logError || !log) {
      console.error('Failed to create log entry:', logError);
      return res.status(500).json({ error: 'Failed to create log entry.' });
    }

    // --- Push job to BullMQ queue ---
    await emailQueue.add('send-email', {
      log_id: log.id,
      developer_id: req.developer.id,
      to,
      type,
      subject: subject || null,
      token: token || null,
      name: name || null,
      custom_html: custom_html || null,
      from_email: process.env.FROM_EMAIL || 'noreply@yourdomain.com',
      from_name: process.env.FROM_NAME || 'EmailAPI'
    });

    // --- Respond instantly ---
    return res.status(200).json({
      success: true,
      message: 'Email queued for delivery.',
      log_id: log.id,
      quota: {
        used: req.quotaUsed + 1,
        limit: req.quotaLimit,
        plan: req.developer.plan_tier
      }
    });

  } catch (err) {
    console.error('Send route error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;