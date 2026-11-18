const { Prisma } = require("@prisma/client");
const { AppError } = require("../utils/errors");

const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: "ROUTE_NOT_FOUND",
      message: `Маршрут ${req.method} ${req.originalUrl} не найден`,
    },
  });
};

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error);

  if (error instanceof AppError) {
    const body = { code: error.code, message: error.message };
    if (error.details !== undefined) body.details = error.details;
    return res.status(error.status).json({ error: body });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        error: {
          code: "DUPLICATE_VALUE",
          message: "Запись с таким уникальным значением уже существует",
          details: { fields: error.meta?.target },
        },
      });
    }
    if (error.code === "P2025") {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "Ресурс не найден" },
      });
    }
    if (error.code === "P2034") {
      return res.status(409).json({
        error: {
          code: "CONCURRENT_UPDATE",
          message: "Данные изменились одновременно с запросом. Повторите операцию",
        },
      });
    }
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    return res.status(400).json({
      error: { code: "INVALID_JSON", message: "Некорректный JSON" },
    });
  }

  console.error(error);
  return res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Внутренняя ошибка сервера" },
  });
};

module.exports = { notFoundHandler, errorHandler };

