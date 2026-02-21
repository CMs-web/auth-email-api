require('dotenv').config();
const { Worker, QueueEvents } = require('bullmq');
const IORedis = require('ioredis');
const { Resend } = require('resend');
const { createClient } = require('@supabase/supabase-js');

// Templates
const templates = {
  otp: require('./templates/otp'),
  magic_link: require('./templates/magic_link'),
  password_reset: require('./templates/password_reset'),
  welcome: require('./templates/welcome')
};

// Clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const resend = new Resend(process.env.RESEND_API_KEY);

const connection = new IORedis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null,
  tls: { rejectUnauthorized: false }
});

// -------------------------------------------------------
// WORKER — processes email jobs from the queue
// -------------------------------------------------------
const worker = new Worker(
  'email-jobs',
  async (job) => {
    const { log_id, to, type, subject, redirect_url, name, custom_html, from_email, from_name } = job.data;

    console.log(`[Job ${job.id}] Processing: ${type} → ${to}`);
    console.log("inside workers", redirect_url);

    // Build email content
    let emailContent;
    if (type === 'custom') {
      emailContent = { subject, html: custom_html };
    } else {
      const templateFn = templates[type];
      if (!templateFn) throw new Error(`Unknown email type: ${type}`);
      emailContent = templateFn({ to, redirect_url, name, from_name });
    }

    // Send via Resend
    const { data: sendData, error: sendError } = await resend.emails.send({
      from: `${from_name} <${from_email}>`,
      to: [to],
      subject: emailContent.subject,
      html: emailContent.html
    });

    if (sendError) {
      throw new Error(`Resend error: ${sendError.message}`);
    }

    // Update log → sent
    await supabase
      .from('usage_logs')
      .update({
        status: 'sent',
        resend_message_id: sendData.id,
        sent_at: new Date().toISOString(),
        retry_count: job.attemptsMade
      })
      .eq('id', log_id);

    console.log(`[Job ${job.id}] ✅ Sent → ${to} (Resend ID: ${sendData.id})`);
    return { success: true, resend_id: sendData.id };
  },
  {
    connection,
    concurrency: 5, // Process 5 emails simultaneously
    limiter: {
      max: 10,
      duration: 1000 // Max 10 emails/second (Resend free tier limit)
    }
  }
);

// -------------------------------------------------------
// EVENT HANDLERS
// -------------------------------------------------------

worker.on('failed', async (job, err) => {
  if (!job) return;
  const { log_id } = job.data;
  const maxAttempts = job.opts.attempts || 3;
  const isFinalAttempt = job.attemptsMade >= maxAttempts;

  console.error(`[Job ${job.id}] ❌ Failed (attempt ${job.attemptsMade}/${maxAttempts}): ${err.message}`);

  // Update DB on each failure
  await supabase
    .from('usage_logs')
    .update({
      status: isFinalAttempt ? 'failed' : 'queued',
      error_message: err.message,
      retry_count: job.attemptsMade
    })
    .eq('id', log_id);

  // Move to DLQ (Dead Letter Queue) on final failure
  if (isFinalAttempt) {
    await supabase
      .from('usage_logs')
      .update({ status: 'dead' })
      .eq('id', log_id);

    console.error(`[Job ${job.id}] 💀 Moved to dead status after ${maxAttempts} attempts.`);
  }
});

worker.on('ready', () => {
  console.log('✅ Worker connected to Redis. Listening for jobs...');
});

worker.on('error', (err) => {
  console.error('Worker error:', err);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing worker...');
  await worker.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await worker.close();
  process.exit(0);
});