const express = require("express");
const bcrypt = require("bcrypt");
const prisma = require("../db");
const config = require("../config");
const asyncHandler = require("../utils/async-handler");
const { requireAuth, optionalAuth } = require("../middleware/auth");
const { closeExpiredSurveys } = require("../services/deadlines");
const {
  normalizeSurveyInput,
  assertPublishableSurvey,
  nestedQuestions,
} = require("../services/survey-input");
const { buildSurveyResults } = require("../services/results");
const { surveyCard, answerMap } = require("../utils/serializers");
const {
  badRequest,
  conflict,
  forbidden,
  notFound,
} = require("../utils/errors");
const {
  parsePositiveInt,
  requireObject,
  requiredString,
  optionalBoolean,
  parsePagination,
  paginationMeta,
} = require("../utils/validation");
const { signSurveyAccessToken } = require("../utils/jwt");
const {
  hasPrivateSurveyAccess,
  assertPrivateSurveyAccess,
} = require("../utils/survey-access");

const router = express.Router();

const detailInclude = {
  creator: { select: { user_id: true, nickname: true } },
  questions: {
    include: { options: { orderBy: { order_index: "asc" } } },
    orderBy: { order_index: "asc" },
  },
  _count: { select: { participations: true } },
};

const loadSurvey = async (id, include = detailInclude) => {
  await closeExpiredSurveys(id);
  const survey = await prisma.survey.findUnique({
    where: { survey_id: id },
    include,
  });
  if (!survey) throw notFound("Опрос не найден");
  return survey;
};

const ensureActive = (survey) => {
  if (survey.status !== "active") throw conflict("Опрос не активен");
};

const participationFor = (surveyId, userId) =>
  prisma.participation.findUnique({
    where: { user_id_survey_id: { user_id: userId, survey_id: surveyId } },
  });

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    await closeExpiredSurveys();
    const filter = req.query.filter || "popular";
    const allowedFilters = ["popular", "newest", "oldest", "private", "public", "all"];
    if (!allowedFilters.includes(filter)) {
      throw badRequest(`filter должен быть одним из: ${allowedFilters.join(", ")}`);
    }
    const defaultLimit = filter === "popular" ? 6 : 20;
    const { page, limit, skip } = parsePagination(req.query, { defaultLimit });
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const where = {
      status: "active",
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
      ...(filter === "private" ? { is_private: true } : {}),
      ...(filter === "public" ? { is_private: false } : {}),
    };
    let orderBy;
    if (filter === "popular") {
      orderBy = [{ participations: { _count: "desc" } }, { created_at: "desc" }];
    } else if (filter === "oldest") {
      orderBy = { created_at: "asc" };
    } else {
      orderBy = { created_at: "desc" };
    }

    const [surveys, total] = await Promise.all([
      prisma.survey.findMany({
        where,
        include: {
          creator: { select: { user_id: true, nickname: true } },
          _count: { select: { participations: true } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.survey.count({ where }),
    ]);
    res.json({
      items: surveys.map(surveyCard),
      pagination: paginationMeta({ page, limit, total }),
    });
  }),
);

router.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    const publish = optionalBoolean(req.body?.publish, "publish", false);
    const input = normalizeSurveyInput(req.body, { publishing: publish });
    const passwordHash = input.password ? await bcrypt.hash(input.password, 12) : null;
    const survey = await prisma.survey.create({
      data: {
        creator_id: req.auth.user.user_id,
        title: input.title,
        short_description: input.short_description,
        full_description: input.full_description,
        is_private: input.is_private,
        password_hash: input.is_private ? passwordHash : null,
        is_anonymous: input.is_anonymous,
        deadline: input.deadline,
        status: publish ? "active" : "draft",
        questions: nestedQuestions(input.questions),
      },
      include: detailInclude,
    });
    res.status(201).json({ ...survey, password_hash: undefined, is_owner: true });
  }),
);

router.get(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    const survey = await loadSurvey(id);
    const userId = req.auth.user.user_id;
    const isOwner = survey.creator_id === userId;
    const participation = await participationFor(id, userId);

    if (survey.status === "draft" && !isOwner) throw forbidden("Черновик видит только создатель");
    if (survey.status === "completed" && !isOwner && !participation) {
      throw forbidden("Завершённый опрос доступен только создателю и участникам");
    }

    if (
      survey.status === "active" &&
      survey.is_private &&
      !isOwner &&
      !participation &&
      !hasPrivateSurveyAccess(req, id)
    ) {
      return res.json({
        survey_id: survey.survey_id,
        title: survey.title,
        short_description: survey.short_description,
        full_description: survey.full_description,
        status: survey.status,
        is_private: true,
        is_anonymous: survey.is_anonymous,
        deadline: survey.deadline,
        creator: survey.creator,
        participants_count: survey._count.participations,
        requires_password: true,
        is_owner: false,
      });
    }

    const votes = await prisma.vote.findMany({
      where: { user_id: userId, option: { question: { survey_id: id } } },
      include: { option: true },
    });
    const { password_hash, ...safeSurvey } = survey;
    res.json({
      ...safeSurvey,
      participants_count: survey._count.participations,
      requires_password: false,
      is_owner: isOwner,
      is_completed_by_me: Boolean(participation),
      my_answers: answerMap(votes),
    });
  }),
);

router.post(
  "/:id/verify-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    const survey = await loadSurvey(id, undefined);
    ensureActive(survey);
    if (!survey.is_private) throw badRequest("Опрос является публичным");
    requireObject(req.body);
    const password = requiredString(req.body.password, "password", { min: 1, max: 72 });
    if (!survey.password_hash || !(await bcrypt.compare(password, survey.password_hash))) {
      throw forbidden("Неверный пароль опроса");
    }
    const token = signSurveyAccessToken({
      userId: req.auth.user.user_id,
      sessionId: req.auth.session.session_id,
      surveyId: id,
    });
    res.json({
      survey_access_token: token,
      expires_in: Math.floor(config.jwt.surveyAccessExpiresMs / 1000),
      token_type: "SurveyAccess",
    });
  }),
);

router.put(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    const existing = await loadSurvey(id);
    if (existing.creator_id !== req.auth.user.user_id) throw forbidden("Это не ваш опрос");
    if (existing.status !== "draft") throw conflict("Редактировать можно только черновик");

    const input = normalizeSurveyInput(req.body, { existing });
    let passwordHash = existing.password_hash;
    if (!input.is_private) passwordHash = null;
    else if (input.password) passwordHash = await bcrypt.hash(input.password, 12);

    const survey = await prisma.$transaction(async (tx) => {
      await tx.question.deleteMany({ where: { survey_id: id } });
      return tx.survey.update({
        where: { survey_id: id },
        data: {
          title: input.title,
          short_description: input.short_description,
          full_description: input.full_description,
          is_private: input.is_private,
          password_hash: passwordHash,
          is_anonymous: input.is_anonymous,
          deadline: input.deadline,
          questions: nestedQuestions(input.questions),
        },
        include: detailInclude,
      });
    });
    const { password_hash, ...safeSurvey } = survey;
    res.json({ ...safeSurvey, is_owner: true });
  }),
);

router.post(
  "/:id/publish",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    const survey = await loadSurvey(id);
    if (survey.creator_id !== req.auth.user.user_id) throw forbidden("Это не ваш опрос");
    if (survey.status !== "draft") throw conflict("Опубликовать можно только черновик");
    assertPublishableSurvey(survey);
    const updated = await prisma.survey.update({
      where: { survey_id: id },
      data: { status: "active" },
      include: detailInclude,
    });
    const { password_hash, ...safeSurvey } = updated;
    res.json({ ...safeSurvey, is_owner: true });
  }),
);

router.post(
  "/:id/close",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    const survey = await loadSurvey(id);
    if (survey.creator_id !== req.auth.user.user_id) throw forbidden("Это не ваш опрос");
    if (survey.status !== "active") throw conflict("Закрыть можно только активный опрос");
    const completedAt = new Date();
    const updated = await prisma.survey.update({
      where: { survey_id: id },
      data: { status: "completed", completed_at: completedAt },
    });
    res.json({ survey_id: updated.survey_id, status: updated.status, completed_at: completedAt });
  }),
);

router.delete(
  "/:id",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    const survey = await loadSurvey(id, { creator: true });
    const isOwner = survey.creator_id === req.auth.user.user_id;
    const isAdmin = req.auth.user.role.role_name === "admin";
    if (!isOwner && !isAdmin) throw forbidden("Удалить опрос может создатель или администратор");
    if (!isOwner && survey.status === "draft") {
      throw forbidden("Администратор не может удалять чужие черновики");
    }
    await prisma.survey.delete({ where: { survey_id: id } });
    res.status(204).send();
  }),
);

const loadAnswerableSurvey = async (req, id) => {
  const survey = await loadSurvey(id);
  ensureActive(survey);
  const participation = await participationFor(id, req.auth.user.user_id);
  if (participation) throw conflict("Опрос уже пройден");
  assertPrivateSurveyAccess(req, survey, {
    isOwner: survey.creator_id === req.auth.user.user_id,
  });
  return survey;
};

router.post(
  "/:id/votes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    const survey = await loadAnswerableSurvey(req, id);
    requireObject(req.body);
    if (!Array.isArray(req.body.answers) || req.body.answers.length === 0) {
      throw badRequest("Поле answers должно быть непустым массивом");
    }
    const questions = new Map(survey.questions.map((question) => [question.question_id, question]));
    const seenQuestions = new Set();
    const answers = req.body.answers.map((answer, index) => {
      requireObject(answer, `answers[${index}]`);
      const questionId = parsePositiveInt(answer.question_id, `answers[${index}].question_id`);
      const question = questions.get(questionId);
      if (!question) throw badRequest(`Вопрос ${questionId} не принадлежит опросу`);
      if (seenQuestions.has(questionId)) throw badRequest(`Вопрос ${questionId} указан дважды`);
      seenQuestions.add(questionId);
      if (!Array.isArray(answer.option_ids) || answer.option_ids.length === 0) {
        throw badRequest(`Для вопроса ${questionId} нужен хотя бы один вариант`);
      }
      const optionIds = answer.option_ids.map((optionId) =>
        parsePositiveInt(optionId, `option_id вопроса ${questionId}`),
      );
      if (new Set(optionIds).size !== optionIds.length) {
        throw badRequest(`В ответе на вопрос ${questionId} варианты не должны повторяться`);
      }
      if (!question.allow_multiple && optionIds.length !== 1) {
        throw badRequest(`Для вопроса ${questionId} можно выбрать ровно один вариант`);
      }
      const allowed = new Set(question.options.map((option) => option.option_id));
      if (optionIds.some((optionId) => !allowed.has(optionId))) {
        throw badRequest(`Ответ содержит вариант не из вопроса ${questionId}`);
      }
      return { question, questionId, optionIds };
    });

    const userId = req.auth.user.user_id;
    await prisma.$transaction(
      async (tx) => {
        const current = await tx.survey.findUnique({ where: { survey_id: id } });
        if (!current || current.status !== "active" || (current.deadline && current.deadline <= new Date())) {
          throw conflict("Опрос больше не активен");
        }
        const completed = await tx.participation.findUnique({
          where: { user_id_survey_id: { user_id: userId, survey_id: id } },
        });
        if (completed) throw conflict("Опрос уже пройден");
        for (const answer of answers) {
          const allOptionIds = answer.question.options.map((option) => option.option_id);
          await tx.vote.deleteMany({
            where: { user_id: userId, option_id: { in: allOptionIds } },
          });
          await tx.vote.createMany({
            data: answer.optionIds.map((optionId) => ({ user_id: userId, option_id: optionId })),
          });
        }
      },
      { isolationLevel: "Serializable" },
    );
    res.json({ answers: answers.map(({ questionId, optionIds }) => ({ question_id: questionId, option_ids: optionIds })) });
  }),
);

router.delete(
  "/:id/votes",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    const survey = await loadAnswerableSurvey(req, id);
    const optionIds = survey.questions.flatMap((question) =>
      question.options.map((option) => option.option_id),
    );
    await prisma.vote.deleteMany({
      where: { user_id: req.auth.user.user_id, option_id: { in: optionIds } },
    });
    res.status(204).send();
  }),
);

router.post(
  "/:id/complete-participation",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    const survey = await loadAnswerableSurvey(req, id);
    const userId = req.auth.user.user_id;
    const result = await prisma.$transaction(
      async (tx) => {
        const current = await tx.survey.findUnique({ where: { survey_id: id } });
        if (!current || current.status !== "active" || (current.deadline && current.deadline <= new Date())) {
          throw conflict("Опрос больше не активен");
        }
        const existing = await tx.participation.findUnique({
          where: { user_id_survey_id: { user_id: userId, survey_id: id } },
        });
        if (existing) throw conflict("Опрос уже пройден");

        const votes = await tx.vote.findMany({
          where: { user_id: userId, option: { question: { survey_id: id } } },
          include: { option: true },
        });
        const answered = new Set(votes.map((vote) => vote.option.question_id));
        const missing = survey.questions
          .filter((question) => !answered.has(question.question_id))
          .map((question) => question.question_id);
        if (missing.length) {
          throw badRequest("Необходимо ответить на все вопросы", { missing_question_ids: missing });
        }
        return tx.participation.create({ data: { user_id: userId, survey_id: id } });
      },
      { isolationLevel: "Serializable" },
    );
    res.status(201).json(result);
  }),
);

router.get(
  "/:id/results",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    await closeExpiredSurveys(id);
    const result = await buildSurveyResults(id);
    if (!result) throw notFound("Опрос не найден");
    if (result.survey.creator_id !== req.auth.user.user_id) {
      throw forbidden("Результаты доступны только создателю опроса");
    }
    if (result.survey.status === "draft") throw conflict("У черновика ещё нет результатов");
    res.json(result.payload);
  }),
);

const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

router.get(
  "/:id/export",
  requireAuth,
  asyncHandler(async (req, res) => {
    const id = parsePositiveInt(req.params.id, "id");
    await closeExpiredSurveys(id);
    const result = await buildSurveyResults(id);
    if (!result) throw notFound("Опрос не найден");
    if (result.survey.creator_id !== req.auth.user.user_id) {
      throw forbidden("Экспорт доступен только создателю опроса");
    }
    if (result.survey.status !== "completed") {
      throw conflict("Экспорт доступен только после завершения опроса");
    }
    const rows = [["question_id", "question", "option_id", "option", "votes_count"]];
    for (const question of result.payload.questions) {
      for (const option of question.options) {
        rows.push([
          question.question_id,
          question.text,
          option.option_id,
          option.text,
          option.votes_count,
        ]);
      }
    }
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}`;
    res.set({
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="survey-${id}-results.csv"`,
    });
    res.send(csv);
  }),
);

module.exports = router;

