const prisma = require("../db");

const buildSurveyResults = async (surveyId) => {
  const survey = await prisma.survey.findUnique({
    where: { survey_id: surveyId },
    include: {
      questions: {
        include: { options: { orderBy: { order_index: "asc" } } },
        orderBy: { order_index: "asc" },
      },
      participations: {
        orderBy: { completed_at: "asc" },
        include: {
          user: {
            select: {
              user_id: true,
              nickname: true,
              email: true,
              votes: {
                where: { option: { question: { survey_id: surveyId } } },
                include: { option: true },
              },
            },
          },
        },
      },
    },
  });
  if (!survey) return null;

  const counts = new Map();
  for (const question of survey.questions) {
    for (const option of question.options) counts.set(option.option_id, 0);
  }
  for (const participation of survey.participations) {
    for (const vote of participation.user.votes) {
      if (counts.has(vote.option_id)) counts.set(vote.option_id, counts.get(vote.option_id) + 1);
    }
  }

  const questions = survey.questions.map((question) => ({
    question_id: question.question_id,
    text: question.text,
    allow_multiple: question.allow_multiple,
    order_index: question.order_index,
    options: question.options.map((option) => ({
      option_id: option.option_id,
      text: option.text,
      order_index: option.order_index,
      votes_count: counts.get(option.option_id) || 0,
    })),
  }));

  const participants = survey.participations.map((participation) => {
    const answerMap = new Map();
    for (const vote of participation.user.votes) {
      if (!answerMap.has(vote.option.question_id)) {
        answerMap.set(vote.option.question_id, []);
      }
      answerMap.get(vote.option.question_id).push(vote.option_id);
    }
    return {
      user: {
        user_id: participation.user.user_id,
        nickname: participation.user.nickname,
        email: participation.user.email,
      },
      completed_at: participation.completed_at,
      answers: [...answerMap.entries()].map(([question_id, option_ids]) => ({
        question_id,
        option_ids,
      })),
    };
  });

  return {
    survey,
    payload: {
      survey_id: survey.survey_id,
      title: survey.title,
      status: survey.status,
      is_anonymous: survey.is_anonymous,
      participants_count: survey.participations.length,
      questions,
      ...(survey.is_anonymous ? {} : { participants }),
    },
  };
};

module.exports = { buildSurveyResults };

