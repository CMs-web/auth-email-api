const { createClient } = require('@supabase/supabase-js');

// Uses SERVICE ROLE KEY — bypasses RLS for server-side operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = supabase;