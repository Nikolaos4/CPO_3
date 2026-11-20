const crypto = require("crypto");
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../db");
const asyncHandler = require("../utils/async-handler");
const { requireAuth } = require("../middleware/auth");
const { createSessionAndTokens, rotateRefreshToken } = require("../services/auth-tokens");
const { publicUser } = require("../utils/serializers");
const { badRequest, conflict, forbidden, unauthorized } = require("../utils/errors");
const { requireObject, requiredString, isEmail } = require("../utils/validation");
const { hashToken, verifyRefreshToken } = require("../utils/jwt");

const router = express.Router();

const credentials = (body, { registration = false } = {}) => {
  requireObject(body);
  const email = requiredString(body.email, "email", { min: 5, max: 254 }).toLowerCase();
  if (!isEmail(email)) throw badRequest("Некорректный email");
  const password = requiredString(body.password, "password", { min: 8, max: 72 });
  const result = { email, password };
  if (registration) {
    result.nickname = requiredString(body.nickname, "nickname", { min: 3, max: 30 });
  }
  return result;
};

router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { email, password, nickname } = credentials(req.body, { registration: true });
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { nickname }] },
      select: { email: true, nickname: true },
    });
    if (existing?.email === email) throw conflict("Пользователь с таким email уже существует");
    if (existing?.nickname === nickname) throw conflict("Этот nickname уже занят");

    const role = await prisma.role.upsert({
      where: { role_name: "user" },
      update: {},
      create: { role_name: "user" },
    });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        nickname,
        email,
        password_hash: passwordHash,
        role_id: role.role_id,
      },
      include: { role: true },
    });
    const tokens = await createSessionAndTokens(user);
    res.status(201).json({ user: publicUser(user), ...tokens });
  }),
);

router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = credentials(req.body);
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw unauthorized("Неверный email или пароль");
    }
    if (!user.is_active) throw forbidden("Аккаунт заблокирован");

    const tokens = await createSessionAndTokens(user);
    res.json({ user: publicUser(user), ...tokens });
  }),
);

router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    requireObject(req.body);
    const refreshToken = requiredString(req.body.refresh_token, "refresh_token", {
      min: 20,
      max: 4096,
    });

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) throw unauthorized("Refresh-токен истёк");
      throw unauthorized("Некорректный refresh-токен");
    }
    if (payload.type !== "refresh" || !payload.sid || !payload.sub) {
      throw unauthorized("Некорректный тип токена");
    }

    const session = await prisma.authSession.findUnique({
      where: { session_id: payload.sid },
      include: { user: { include: { role: true } } },
    });
    if (
      !session ||
      session.user_id !== Number(payload.sub) ||
      session.revoked_at ||
      session.expires_at <= new Date() ||
      !session.refresh_token_hash
    ) {
      throw unauthorized("Сессия завершена");
    }
    if (!session.user.is_active) throw forbidden("Аккаунт заблокирован");

    const actualHash = Buffer.from(hashToken(refreshToken), "hex");
    const expectedHash = Buffer.from(session.refresh_token_hash, "hex");
    if (
      actualHash.length !== expectedHash.length ||
      !crypto.timingSafeEqual(actualHash, expectedHash)
    ) {
      await prisma.authSession.update({
        where: { session_id: session.session_id },
        data: { revoked_at: new Date() },
      });
      throw unauthorized("Refresh-токен уже использован или отозван");
    }

    const tokens = await rotateRefreshToken(session);
    res.json({ user: publicUser(session.user), ...tokens });
  }),
);

router.post(
  "/logout",
  requireAuth,
  asyncHandler(async (req, res) => {
    await prisma.authSession.update({
      where: { session_id: req.auth.session.session_id },
      data: { revoked_at: new Date(), refresh_token_hash: null },
    });
    res.status(204).send();
  }),
);

module.exports = router;

