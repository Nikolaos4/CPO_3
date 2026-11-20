const express = require("express");
const prisma = require("../db");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { closeExpiredSurveys } = require("../services/deadlines");
const { publicUser, surveyCard, answerMap } = require("../utils/serializers");
const { badRequest, notFound } = require("../utils/errors");
const {
  parsePositiveInt,
  parsePagination,
  paginationMeta,
} = require("../utils/validation");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const userId = req.auth.user.user_id;
    const [createdCount, completedCount] = await Promise.all([
      prisma.survey.count({ where: { creator_id: userId } }),
      prisma.participation.count({ where: { user_id: userId } }),
    ]);
    res.json({
      ...publicUser(req.auth.user),
      stats: { created_count: createdCount, completed_count: completedCount },
    });
  }),
);

router.get(
  "/me/surveys",
  asyncHandler(async (req, res) => {
    await closeExpiredSurveys();
    const userId = req.auth.user.user_id;
    const { page, limit, skip } = parsePagination(req.query);
    const allowedStatuses = ["draft", "active", "completed"];
    if (req.query.status && !allowedStatuses.includes(req.query.status)) {
      throw badRequest("status должен быть draft, active или completed");
    }
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where = {
      creator_id: userId,
      ...(req.query.status ? { status: req.query.status } : {}),
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    };

    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        where,
        include: {
          creator: { select: { user_id: true, nickname: true } },
          _count: { select: { participations: true, questions: true } },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.survey.count({ where }),
    ]);

    res.json({
      items: surveys.map((survey) => ({
        ...surveyCard(survey),
        questions_count: survey._count.questions,
      })),
      pagination: paginationMeta({ page, limit, total }),
    });
  }),
);

router.get(
  "/me/participations",
  asyncHandler(async (req, res) => {
    await closeExpiredSurveys();
    const userId = req.auth.user.user_id;
    const { page, limit, skip } = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where = {
      user_id: userId,
      ...(search
        ? { survey: { title: { contains: search, mode: "insensitive" } } }
        : {}),
    };

    const [participations, total] = await Promise.all([
      prisma.participation.findMany({
        where,
        include: {
          survey: {
            include: {
              creator: { select: { user_id: true, nickname: true } },
              questions: {
                include: { options: { orderBy: { order_index: "asc" } } },
                orderBy: { order_index: "asc" },
              },
              _count: { select: { participations: true } },
            },
          },
        },
        orderBy: { completed_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.participation.count({ where }),
    ]);

    const surveyIds = participations.map((item) => item.survey_id);
    const votes = surveyIds.length
      ? await prisma.vote.findMany({
          where: {
            user_id: userId,
            option: { question: { survey_id: { in: surveyIds } } },
          },
          include: { option: true },
        })
      : [];
    const votesBySurvey = new Map();
    for (const vote of votes) {
      const surveyId = participations.find((item) =>
        item.survey.questions.some((question) => question.question_id === vote.option.question_id),
      )?.survey_id;
      if (!surveyId) continue;
      if (!votesBySurvey.has(surveyId)) votesBySurvey.set(surveyId, []);
      votesBySurvey.get(surveyId).push(vote);
    }

    res.json({
      items: participations.map((item) => ({
        survey: {
          ...surveyCard(item.survey),
          questions: item.survey.questions,
        },
        completed_at: item.completed_at,
        my_answers: answerMap(votesBySurvey.get(item.survey_id) || []),
      })),
      pagination: paginationMeta({ page, limit, total }),
    });
  }),
);

router.get(
  "/",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query);
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where = search
      ? {
          OR: [
            { nickname: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {};
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          role: true,
          _count: { select: { surveys: true, participations: true } },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);
    res.json({
      items: users.map((user) => ({
        ...publicUser(user),
        stats: {
          created_count: user._count.surveys,
          completed_count: user._count.participations,
        },
      })),
      pagination: paginationMeta({ page, limit, total }),
    });
  }),
);

const setActive = (isActive) =>
  asyncHandler(async (req, res) => {
    const userId = parsePositiveInt(req.params.id, "id");
    if (!isActive && userId === req.auth.user.user_id) {
      throw badRequest("Администратор не может заблокировать собственный аккаунт");
    }
    const user = await prisma.user.findUnique({ where: { user_id: userId } });
    if (!user) throw notFound("Пользователь не найден");

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { user_id: userId },
        data: { is_active: isActive },
        include: { role: true },
      });
      if (!isActive) {
        await tx.authSession.updateMany({
          where: { user_id: userId, revoked_at: null },
          data: { revoked_at: new Date(), refresh_token_hash: null },
        });
      }
      return result;
    });
    res.json(publicUser(updated));
  });

router.patch("/:id/block", requireAdmin, setActive(false));
router.patch("/:id/unblock", requireAdmin, setActive(true));

module.exports = router;

