const { startSlaEscalationJob, stopSlaEscalationJob } = require('./slaEscalation.job');

/**
 * Initialize background scheduled tasks
 */
const initJobs = () => {
  startSlaEscalationJob();
};

module.exports = {
  initJobs,
  stopSlaEscalationJob
};
