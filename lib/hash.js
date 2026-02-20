const crypto = require('crypto');

function hashKey(rawKey) {
  return crypto.createHash('sha256').update(rawKey).digest('hex');
}

function generateApiKey() {
  // e.g. sk_live_<32 random bytes as hex>
  const random = crypto.randomBytes(32).toString('hex');
  return `sk_live_${random}`;
}

module.exports = { hashKey, generateApiKey };