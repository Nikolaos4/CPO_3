const express = require("express");
const config = require("./config");
const prisma = require("./db");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const surveyRoutes = require("./routes/surveys");
const adminRoutes = require("./routes/admin");
const asyncHandler = require("./utils/async-handler");
const { notFoundHandler, errorHandler } = require("./middleware/error-handler");

const app = express();

app.disable("x-powered-by");
app.use((req, res, next) => {
  const origin = req.get("origin");
  if (origin && config.corsOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set(
      "Access-Control-Allow-Headers",
      "Authorization, Content-Type, X-Survey-Access-Token",
    );
    res.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  }
  if (req.method === "OPTIONS") return res.status(204).send();
  next();
});
app.use(express.json({ limit: "1mb" }));

app.get(
  "/health",
  asyncHandler(async (req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "connected" });
  }),
);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/surveys", surveyRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

