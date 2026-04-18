const Queue = require('bull');
const emailQueue = new Queue('email-queue', { redis: { host: '127.0.0.1', port: 6379 } });

async function check() {
  const waiting = await emailQueue.getWaitingCount();
  const active = await emailQueue.getActiveCount();
  const completed = await emailQueue.getCompletedCount();
  const failed = await emailQueue.getFailedCount();
  
  console.log({ waiting, active, completed, failed });
  
  if (failed > 0) {
    const failedJobs = await emailQueue.getFailed(0, 5);
    console.log("Failed jobs:", failedJobs.map(j => ({ id: j.id, failedReason: j.failedReason, dataSubject: j.data?.subject })));
  }
  process.exit();
}
check();
