const supabase = require('../lib/supabase');
const { hashKey } = require('../lib/hash');

/**
 * Validates Bearer token from Authorization header.
 * Looks up SHA-256 hash in api_keys table.
 * Attaches developer + key info to req.
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header. Use: Bearer sk_live_...' });
    }

    const rawKey = authHeader.split(' ')[1];
    if (!rawKey.startsWith('sk_live_')) {
      return res.status(401).json({ error: 'Invalid API key format.' });
    }

    const keyHash = hashKey(rawKey);

    // Fetch key + developer in one join
    const { data: apiKey, error } = await supabase
      .from('api_keys')
      .select('id, developer_id, is_active, developers(id, plan_tier, email)')
      .eq('key_hash', keyHash)
      .eq('is_active', true)
      .single();

    if (error || !apiKey) {
      return res.status(401).json({ error: 'Invalid or revoked API key.' });
    }

    // Update last_used_at async (fire and forget — don't delay response)
    supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', apiKey.id)
      .then(() => {});

    req.apiKey = apiKey;
    req.developer = apiKey.developers;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
}

module.exports = { authenticate };