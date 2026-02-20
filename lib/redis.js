const { Queue } = require('bullmq');
const IORedis = require('ioredis');

const connection = new IORedis(process.env.UPSTASH_REDIS_URL, {
  maxRetriesPerRequest: null, // Required by BullMQ
  tls: { rejectUnauthorized: false }
});

const emailQueue = new Queue('email-jobs', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500
  }
});

module.exports = { emailQueue, connection };