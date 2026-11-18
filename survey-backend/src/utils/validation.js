const { badRequest } = require("./errors");

const parsePositiveInt = (value, field = "id") => {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw badRequest(`Поле ${field} должно быть положительным целым числом`);
  }
  return parsed;
};

const requireObject = (value, name = "body") => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw badRequest(`${name} должен быть объектом`);
  }
  return value;
};

const requiredString = (value, field, { min = 1, max = 255 } = {}) => {
  if (typeof value !== "string") {
    throw badRequest(`Поле ${field} обязательно и должно быть строкой`);
  }
  const normalized = value.trim();
  if (normalized.length < min || normalized.length > max) {
    throw badRequest(`Длина поля ${field} должна быть от ${min} до ${max}`);
  }
  return normalized;
};

const optionalString = (value, field, { max = 5000 } = {}) => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw badRequest(`Поле ${field} должно быть строкой или null`);
  }
  const normalized = value.trim();
  if (normalized.length > max) {
    throw badRequest(`Поле ${field} не должно превышать ${max} символов`);
  }
  return normalized || null;
};

const optionalBoolean = (value, field, fallback = false) => {
  if (value === undefined) return fallback;
  if (typeof value !== "boolean") {
    throw badRequest(`Поле ${field} должно быть boolean`);
  }
  return value;
};

const optionalDate = (value, field = "deadline") => {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw badRequest(`Поле ${field} должно быть строкой ISO 8601 или null`);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw badRequest(`Поле ${field} содержит некорректную дату`);
  }
  return date;
};

const parsePagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = query.page === undefined ? 1 : parsePositiveInt(query.page, "page");
  const limit =
    query.limit === undefined ? defaultLimit : parsePositiveInt(query.limit, "limit");
  if (limit > maxLimit) {
    throw badRequest(`Параметр limit не должен превышать ${maxLimit}`);
  }
  return { page, limit, skip: (page - 1) * limit };
};

const paginationMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  pages: total === 0 ? 0 : Math.ceil(total / limit),
});

const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

module.exports = {
  parsePositiveInt,
  requireObject,
  requiredString,
  optionalString,
  optionalBoolean,
  optionalDate,
  parsePagination,
  paginationMeta,
  isEmail,
};

