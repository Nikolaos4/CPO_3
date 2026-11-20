const publicUser = (user) => ({
  user_id: user.user_id,
  nickname: user.nickname,
  email: user.email,
  role: user.role?.role_name || user.role,
  created_at: user.created_at,
  is_active: user.is_active,
});

const surveyCard = (survey) => ({
  survey_id: survey.survey_id,
  title: survey.title,
  short_description: survey.short_description,
  status: survey.status,
  participants_count: survey._count?.participations ?? 0,
  is_private: survey.is_private,
  is_anonymous: survey.is_anonymous,
  deadline: survey.deadline,
  created_at: survey.created_at,
  completed_at: survey.completed_at,
  creator: survey.creator
    ? {
        user_id: survey.creator.user_id,
        nickname: survey.creator.nickname,
      }
    : undefined,
});

const answerMap = (votes) => {
  const map = new Map();
  for (const vote of votes || []) {
    const questionId = vote.option.question_id;
    if (!map.has(questionId)) map.set(questionId, []);
    map.get(questionId).push(vote.option_id);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([question_id, option_ids]) => ({ question_id, option_ids }));
};

module.exports = { publicUser, surveyCard, answerMap };

