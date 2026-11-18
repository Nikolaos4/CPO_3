const jwt = require("jsonwebtoken");
const { forbidden } = require("./errors");
const { verifySurveyAccessToken } = require("./jwt");

const hasPrivateSurveyAccess = (req, surveyId) => {
  const token = req.get("x-survey-access-token");
  if (!token) return false;

  try {
    const payload = verifySurveyAccessToken(token);
    return (
      payload.type === "survey_access" &&
      payload.survey_id === surveyId &&
      payload.sid === req.auth.session.session_id &&
      Number(payload.sub) === req.auth.user.user_id
    );
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      return false;
    }
    throw error;
  }
};

const assertPrivateSurveyAccess = (req, survey, { isOwner = false, participated = false } = {}) => {
  if (!survey.is_private || isOwner || participated) return;
  if (!hasPrivateSurveyAccess(req, survey.survey_id)) {
    throw forbidden("Сначала подтвердите пароль приватного опроса");
  }
};

module.exports = { hasPrivateSurveyAccess, assertPrivateSurveyAccess };

