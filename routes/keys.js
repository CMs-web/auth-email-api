const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { generateApiKey, hashKey } = require('../lib/hash');

/**
 * POST /internal/keys/generate
 * Called by the dashboard (server-side) to generate a new API key.
 * Requires supabase user session passed as Bearer token (Supabase JWT).
 * 
 * This route uses Supabase Auth JWT — NOT the API key.
 */
router.post('/generate', async (req, res) => {
  console.log ('Generating new API key...')
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const jwt = authHeader.split(' ')[1];

    // Verify Supabase JWT
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid session.' });
    }

    // Revoke ALL existing active keys for this developer
    await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('developer_id', user.id)
      .eq('is_active', true);

    // Generate new key
    const rawKey = generateApiKey();
    const keyHash = hashKey(rawKey);
    const keyPrefix = rawKey.substring(0, 16); // "sk_live_XXXXXXXX"

    const { error: insertError } = await supabase
      .from('api_keys')
      .insert({
        developer_id: user.id,
        key_hash: keyHash,
        key_prefix: keyPrefix,
        is_active: true
      });

    if (insertError) {
      console.error('Key insert error:', insertError);
      return res.status(500).json({ error: 'Failed to generate key.' });
    }

    // Return the raw key ONCE — never stored, never shown again
    return res.status(201).json({
      key: rawKey,
      prefix: keyPrefix,
      warning: 'Copy this key now. It will NOT be shown again.'
    });

  } catch (err) {
    console.error('Key generation error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

module.exports = router;