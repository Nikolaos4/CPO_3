const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const signAccessToken = ({ userId, sessionId, role }) =>
  jwt.sign(
    { type: "access", sid: sessionId, role },
    config.jwt.accessSecret,
    {
      subject: String(userId),
      jwtid: crypto.randomUUID(),
      expiresIn: config.jwt.accessExpiresIn,
    },
  );

const signRefreshToken = ({ userId, sessionId }) =>
  jwt.sign({ type: "refresh", sid: sessionId }, config.jwt.refreshSecret, {
    subject: String(userId),
    jwtid: crypto.randomUUID(),
    expiresIn: config.jwt.refreshExpiresIn,
  });

const signSurveyAccessToken = ({ userId, sessionId, surveyId }) =>
  jwt.sign(
    { type: "survey_access", sid: sessionId, survey_id: surveyId },
    config.jwt.surveyAccessSecret,
    {
      subject: String(userId),
      jwtid: crypto.randomUUID(),
      expiresIn: config.jwt.surveyAccessExpiresIn,
    },
  );

const verifyAccessToken = (token) => jwt.verify(token, config.jwt.accessSecret);
const verifyRefreshToken = (token) => jwt.verify(token, config.jwt.refreshSecret);
const verifySurveyAccessToken = (token) =>
  jwt.verify(token, config.jwt.surveyAccessSecret);

module.exports = {
  hashToken,
  signAccessToken,
  signRefreshToken,
  signSurveyAccessToken,
  verifyAccessToken,
  verifyRefreshToken,
  verifySurveyAccessToken,
};

