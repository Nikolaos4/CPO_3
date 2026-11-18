const express = require("express");
const prisma = require("../db");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, requireAdmin } = require("../middleware/auth");
const { closeExpiredSurveys } = require("../services/deadlines");
const { surveyCard } = require("../utils/serializers");
const { badRequest } = require("../utils/errors");
const { parsePagination, paginationMeta } = require("../utils/validation");

const router = express.Router();
router.use(requireAuth, requireAdmin);

router.get(
  "/surveys",
  asyncHandler(async (req, res) => {
    await closeExpiredSurveys();
    const { page, limit, skip } = parsePagination(req.query);
    const status = req.query.status;
    if (status && !["active", "completed"].includes(status)) {
      throw badRequest("В админ-разделе status может быть active или completed");
    }
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where = {
      status: status || { in: ["active", "completed"] },
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

module.exports = router;

