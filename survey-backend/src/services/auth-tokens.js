const prisma = require("../db");
const config = require("../config");
const { hashToken, signAccessToken, signRefreshToken } = require("../utils/jwt");

const tokenResponse = (user, sessionId, refreshToken) => ({
  access_token: signAccessToken({
    userId: user.user_id,
    sessionId,
    role: user.role.role_name,
  }),
  refresh_token: refreshToken,
  token_type: "Bearer",
  expires_in: Math.floor(config.jwt.accessExpiresMs / 1000),
  refresh_expires_in: Math.floor(config.jwt.refreshExpiresMs / 1000),
});

const createSessionAndTokens = async (user) => {
  const session = await prisma.authSession.create({
    data: {
      user_id: user.user_id,
      expires_at: new Date(Date.now() + config.jwt.refreshExpiresMs),
    },
  });
  const refreshToken = signRefreshToken({
    userId: user.user_id,
    sessionId: session.session_id,
  });
  await prisma.authSession.update({
    where: { session_id: session.session_id },
    data: { refresh_token_hash: hashToken(refreshToken) },
  });
  return tokenResponse(user, session.session_id, refreshToken);
};

const rotateRefreshToken = async (session) => {
  const refreshToken = signRefreshToken({
    userId: session.user_id,
    sessionId: session.session_id,
  });
  await prisma.authSession.update({
    where: { session_id: session.session_id },
    data: {
      refresh_token_hash: hashToken(refreshToken),
      expires_at: new Date(Date.now() + config.jwt.refreshExpiresMs),
    },
  });
  return tokenResponse(session.user, session.session_id, refreshToken);
};

module.exports = { createSessionAndTokens, rotateRefreshToken };

