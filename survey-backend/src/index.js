require("dotenv").config();

const app = require("./app");
const config = require("./config");
const prisma = require("./db");
const { startDeadlineWatcher } = require("./services/deadlines");

const server = app.listen(config.port, () => {
  console.log(`Survey API listening on http://localhost:${config.port}`);
});

startDeadlineWatcher();

const shutdown = (signal) => {
  console.log(`${signal} received, shutting down`);
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
