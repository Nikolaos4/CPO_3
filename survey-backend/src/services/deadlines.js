const prisma = require("../db");

const closeExpiredSurveys = async (surveyId) => {
  const now = new Date();
  const where = {
    status: "active",
    deadline: { not: null, lte: now },
  };
  if (surveyId !== undefined) where.survey_id = surveyId;

  return prisma.survey.updateMany({
    where,
    data: { status: "completed", completed_at: now },
  });
};

const startDeadlineWatcher = () => {
  const timer = setInterval(() => {
    closeExpiredSurveys().catch((error) => {
      console.error("Failed to close expired surveys:", error);
    });
  }, 60 * 1000);
  timer.unref();
  return timer;
};

module.exports = { closeExpiredSurveys, startDeadlineWatcher };

