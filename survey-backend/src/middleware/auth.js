const jwt = require("jsonwebtoken");
const prisma = require("../db");
const { forbidden, unauthorized } = require("../utils/errors");
const { verifyAccessToken } = require("../utils/jwt");

const bearerToken = (req) => {
  const header = req.get("authorization");
  if (!header) return null;
  const [scheme, token, extra] = header.split(/\s+/);
  if (scheme?.toLowerCase() !== "bearer" || !token || extra) {
    throw unauthorized("Ожидается заголовок Authorization: Bearer <token>");
  }
  return token;
};

const authenticate = async (req, { optional = false } = {}) => {
  const token = bearerToken(req);
  if (!token) {
    if (optional) return null;
    throw unauthorized();
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw unauthorized("Access-токен истёк");
    }
    throw unauthorized("Некорректный access-токен");
  }

  if (payload.type !== "access" || !payload.sid || !payload.sub) {
    throw unauthorized("Некорректный тип токена");
  }

  const userId = Number(payload.sub);
  if (!Number.isSafeInteger(userId)) throw unauthorized("Некорректный токен");

  const session = await prisma.authSession.findUnique({
    where: { session_id: payload.sid },
    include: { user: { include: { role: true } } },
  });

  if (
    !session ||
    session.user_id !== userId ||
    session.revoked_at ||
    session.expires_at <= new Date()
  ) {
    throw unauthorized("Сессия завершена");
  }
  if (!session.user.is_active) {
    throw forbidden("Аккаунт заблокирован");
  }

  req.auth = { token, payload, session, user: session.user };
  return req.auth;
};

const requireAuth = async (req, res, next) => {
  try {
    await authenticate(req);
    next();
  } catch (error) {
    next(error);
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    await authenticate(req, { optional: true });
    next();
  } catch (error) {
    next(error);
  }
};

const requireAdmin = (req, res, next) => {
  if (req.auth?.user.role.role_name !== "admin") {
    return next(forbidden("Доступ разрешён только администратору"));
  }
  next();
};

module.exports = { bearerToken, authenticate, requireAuth, optionalAuth, requireAdmin };

