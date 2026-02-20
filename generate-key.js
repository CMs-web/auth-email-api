require('dotenv').config();
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

// Connect to Supabase using Admin privileges
const supabase = createClient(
    process.env.SUPABASE_URL, 
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function generateDeveloperKey() {
    console.log("🛠️  Generating new Developer Account and API Key...");

    try {
        // 1. Create a dummy developer account
        const dummyEmail = `test-dev-${Date.now()}@example.com`;
        const { data: developer, error: devError } = await supabase
            .from('developers')
            .insert([{ email: dummyEmail }])
            .select()
            .single();

        if (devError) throw devError;

        // 2. Generate a Cryptographically Secure API Key
        // We use Node's native 'crypto' to generate unguessable random bytes
        const rawSecret = crypto.randomBytes(32).toString('hex');
        const rawApiKey = `sk_live_${rawSecret}`;

        // 3. Hash the key using SHA-256 for secure database storage
        const hashedKey = crypto.createHash('sha256').update(rawApiKey).digest('hex');

        // 4. Store ONLY the hash and a safe prefix in the database
        const { error: keyError } = await supabase
            .from('api_keys')
            .insert([{
                developer_id: developer.id,
                key_hash: hashedKey,
                key_prefix: rawApiKey.substring(0, 12) // Keep the 'sk_live_xxxx' part for UI display
            }]);

        if (keyError) throw keyError;

        console.log(`\n✅ Success! Account created for: ${dummyEmail}`);
        console.log(`\n🔑 YOUR RAW API KEY:`);
        console.log(`--------------------------------------------------`);
        console.log(`${rawApiKey}`);
        console.log(`--------------------------------------------------`);
        console.log(`⚠️  Save this now. We only stored the hash. You will never see this raw key again.`);

    } catch (err) {
        console.error("❌ Error generating key:", err.message);
    }
}

generateDeveloperKey();