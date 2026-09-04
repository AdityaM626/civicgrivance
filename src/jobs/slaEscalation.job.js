const { processSlaEscalations } = require('../services/sla.service');

let intervalId = null;

/**
 * Start SLA Escalation background monitoring job
 * Runs every 5 minutes (300,000 ms)
 */
const startSlaEscalationJob = () => {
  if (intervalId) {
    console.log('[Job Manager] SLA Escalation job is already running.');
    return;
  }

  console.log('[Job Manager] Initializing SLA Escalation Background Job (Interval: 5m)...');

  // Initial execution after startup
  processSlaEscalations().catch((err) => {
    console.error(`[Job Error] SLA Escalation processing failed: ${err.message}`);
  });

  // Schedule periodic execution every 5 minutes
  intervalId = setInterval(async () => {
    try {
      await processSlaEscalations();
    } catch (err) {
      console.error(`[Job Error] Periodic SLA Escalation processing failed: ${err.message}`);
    }
  }, 5 * 60 * 1000);
};

/**
 * Stop background job during graceful shutdown
 */
const stopSlaEscalationJob = () => {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[Job Manager] SLA Escalation job stopped.');
  }
};

module.exports = {
  startSlaEscalationJob,
  stopSlaEscalationJob
};
