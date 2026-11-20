const parseDuration = (value, fallback) => {
  const source = value || fallback;
  const match = /^(\d+)(s|m|h|d)$/i.exec(source);
  if (!match) {
    throw new Error(`Invalid duration: ${source}`);
  }

  const multipliers = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return Number(match[1]) * multipliers[match[2].toLowerCase()];
};

const isProduction = process.env.NODE_ENV === "production";

const secret = (name, developmentFallback) => {
  const value = process.env[name];
  if (value) return value;
  if (isProduction) throw new Error(`${name} is required in production`);
  return developmentFallback;
};

const accessExpiresIn = process.env.JWT_ACCESS_EXPIRES_IN || "15m";
const refreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || "30d";
const surveyAccessExpiresIn = process.env.SURVEY_ACCESS_EXPIRES_IN || "20m";

module.exports = {
  port: Number(process.env.PORT) || 3000,
  corsOrigins: (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwt: {
    accessSecret: secret("JWT_ACCESS_SECRET", "dev-access-secret-change-in-env"),
    refreshSecret: secret("JWT_REFRESH_SECRET", "dev-refresh-secret-change-in-env"),
    surveyAccessSecret: secret(
      "JWT_SURVEY_ACCESS_SECRET",
      "dev-survey-access-secret-change-in-env",
    ),
    accessExpiresIn,
    refreshExpiresIn,
    surveyAccessExpiresIn,
    accessExpiresMs: parseDuration(accessExpiresIn, "15m"),
    refreshExpiresMs: parseDuration(refreshExpiresIn, "30d"),
    surveyAccessExpiresMs: parseDuration(surveyAccessExpiresIn, "20m"),
  },
};

