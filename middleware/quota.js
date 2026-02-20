const supabase = require('../lib/supabase');

const LIMITS = {
  free: 100,
  pro: 10000
};

/**
 * Checks monthly email quota.
 * Must run AFTER authenticate middleware.
 */
async function checkQuota(req, res, next) {
  try {
    const developer = req.developer;
    const limit = LIMITS[developer.plan_tier] || LIMITS.free;

    // Call our SQL function for efficient count
    const { data, error } = await supabase
      .rpc('get_monthly_usage', { p_developer_id: developer.id });

    if (error) {
      console.error('Quota check error:', error);
      return res.status(500).json({ error: 'Could not verify quota.' });
    }

    const used = data || 0;
    req.quotaUsed = used;
    req.quotaLimit = limit;

    if (used >= limit) {
      return res.status(402).json({
        error: 'Monthly quota exceeded.',
        used,
        limit,
        plan: developer.plan_tier,
        upgrade_url: process.env.DASHBOARD_URL + '/billing'
      });
    }

    next();
  } catch (err) {
    console.error('Quota middleware error:', err);
    res.status(500).json({ error: 'Internal server error during quota check.' });
  }
}

module.exports = { checkQuota };