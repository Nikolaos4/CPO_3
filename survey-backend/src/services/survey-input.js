const { badRequest } = require("../utils/errors");
const {
  requireObject,
  requiredString,
  optionalString,
  optionalBoolean,
  optionalDate,
} = require("../utils/validation");

const normalizeQuestions = (questions, { publishing = false } = {}) => {
  if (questions === undefined) {
    if (publishing) throw badRequest("Для публикации нужен хотя бы один вопрос");
    return [];
  }
  if (!Array.isArray(questions)) throw badRequest("Поле questions должно быть массивом");
  if (publishing && questions.length === 0) {
    throw badRequest("Для публикации нужен хотя бы один вопрос");
  }

  return questions.map((question, questionIndex) => {
    requireObject(question, `questions[${questionIndex}]`);
    const text = requiredString(question.text, `questions[${questionIndex}].text`, {
      min: 1,
      max: 1000,
    });
    const allowMultiple = optionalBoolean(
      question.allow_multiple,
      `questions[${questionIndex}].allow_multiple`,
      false,
    );
    if (!Array.isArray(question.options)) {
      throw badRequest(`questions[${questionIndex}].options должен быть массивом`);
    }
    const minOptions = publishing ? 2 : 0;
    if (question.options.length < minOptions || question.options.length > 10) {
      throw badRequest(
        `У вопроса ${questionIndex + 1} должно быть от ${minOptions} до 10 вариантов`,
      );
    }
    const options = question.options.map((option, optionIndex) =>
      requiredString(
        typeof option === "object" && option !== null ? option.text : option,
        `questions[${questionIndex}].options[${optionIndex}]`,
        { min: 1, max: 500 },
      ),
    );
    if (new Set(options.map((value) => value.toLowerCase())).size !== options.length) {
      throw badRequest(`В вопросе ${questionIndex + 1} варианты не должны повторяться`);
    }
    return { text, allow_multiple: allowMultiple, options };
  });
};

const normalizeSurveyInput = (
  body,
  { publishing = false, existing = null } = {},
) => {
  requireObject(body);
  const title = requiredString(body.title, "title", { min: 1, max: 200 });
  const isPrivate = optionalBoolean(
    body.is_private,
    "is_private",
    existing?.is_private ?? false,
  );
  const isAnonymous = optionalBoolean(
    body.is_anonymous,
    "is_anonymous",
    existing?.is_anonymous ?? false,
  );
  const password = optionalString(body.password, "password", { max: 72 });
  if (password && password.length < 4) {
    throw badRequest("Пароль приватного опроса должен содержать минимум 4 символа");
  }
  if (publishing && isPrivate && !password && !existing?.password_hash) {
    throw badRequest("Для приватного опроса требуется пароль");
  }

  const deadline = optionalDate(body.deadline, "deadline");
  if (deadline && deadline <= new Date()) {
    throw badRequest("Дедлайн должен быть в будущем");
  }

  return {
    title,
    short_description: optionalString(body.short_description, "short_description", {
      max: 500,
    }),
    full_description: optionalString(body.full_description, "full_description", {
      max: 5000,
    }),
    is_private: isPrivate,
    is_anonymous: isAnonymous,
    password,
    deadline,
    questions: normalizeQuestions(body.questions, { publishing }),
  };
};

const assertPublishableSurvey = (survey) => {
  if (!survey.title?.trim()) throw badRequest("Название опроса обязательно");
  if (survey.is_private && !survey.password_hash) {
    throw badRequest("Для приватного опроса требуется пароль");
  }
  if (survey.deadline && survey.deadline <= new Date()) {
    throw badRequest("Дедлайн должен быть в будущем");
  }
  if (!survey.questions?.length) {
    throw badRequest("Для публикации нужен хотя бы один вопрос");
  }
  for (const [index, question] of survey.questions.entries()) {
    if (!question.text?.trim()) throw badRequest(`Вопрос ${index + 1} не заполнен`);
    if (question.options.length < 2 || question.options.length > 10) {
      throw badRequest(`У вопроса ${index + 1} должно быть от 2 до 10 вариантов`);
    }
  }
};

const nestedQuestions = (questions) => ({
  create: questions.map((question, questionIndex) => ({
    text: question.text,
    allow_multiple: question.allow_multiple,
    order_index: questionIndex + 1,
    options: {
      create: question.options.map((text, optionIndex) => ({
        text,
        order_index: optionIndex + 1,
      })),
    },
  })),
});

module.exports = {
  normalizeSurveyInput,
  assertPublishableSurvey,
  nestedQuestions,
};

