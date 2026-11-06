// Сид тестовыми данными для «Сервис опросов».
// Role: 3 записи (guest / user / admin) — системный справочник.
// Остальные сущности: по 5 тестовых записей (где это имеет смысл).

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash("password123", 10);
  const privatePasswordHash = await bcrypt.hash("design2024", 10);

  // ---------------------------------------------------------------
  // 1. Роли (системный справочник — ровно 3)
  // ---------------------------------------------------------------
  const roleGuest = await prisma.role.upsert({
    where: { role_name: "guest" },
    update: {},
    create: { role_name: "guest" },
  });
  const roleUser = await prisma.role.upsert({
    where: { role_name: "user" },
    update: {},
    create: { role_name: "user" },
  });
  const roleAdmin = await prisma.role.upsert({
    where: { role_name: "admin" },
    update: {},
    create: { role_name: "admin" },
  });

  // ---------------------------------------------------------------
  // 2. Пользователи (5)
  // ---------------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      nickname: "admin_ivan",
      email: "admin@example.com",
      password_hash: passwordHash,
      role_id: roleAdmin.role_id,
      is_active: true,
    },
  });

  const maria = await prisma.user.upsert({
    where: { email: "maria@example.com" },
    update: {},
    create: {
      nickname: "maria_dev",
      email: "maria@example.com",
      password_hash: passwordHash,
      role_id: roleUser.role_id,
      is_active: true,
    },
  });

  const alex = await prisma.user.upsert({
    where: { email: "alex@example.com" },
    update: {},
    create: {
      nickname: "alex_coder",
      email: "alex@example.com",
      password_hash: passwordHash,
      role_id: roleUser.role_id,
      is_active: true,
    },
  });

  const olga = await prisma.user.upsert({
    where: { email: "olga@example.com" },
    update: {},
    create: {
      nickname: "olga_design",
      email: "olga@example.com",
      password_hash: passwordHash,
      role_id: roleUser.role_id,
      is_active: true,
    },
  });

  const blocked = await prisma.user.upsert({
    where: { email: "blocked@example.com" },
    update: {},
    create: {
      nickname: "blocked_user",
      email: "blocked@example.com",
      password_hash: passwordHash,
      role_id: roleUser.role_id,
      is_active: false,
    },
  });

  // ---------------------------------------------------------------
  // 3. Опросы (5)
  // ---------------------------------------------------------------
  const survey1 = await prisma.survey.create({
    data: {
      creator_id: maria.user_id,
      title: "Любимый язык программирования",
      short_description: "Какой язык вы используете чаще всего?",
      full_description:
        "Небольшой опрос среди разработчиков о предпочтениях в языках программирования.",
      is_private: false,
      is_anonymous: false,
      status: "active",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  const survey2 = await prisma.survey.create({
    data: {
      creator_id: alex.user_id,
      title: "Удалёнка vs Офис",
      short_description: "Где комфортнее работать?",
      full_description: "Опрос о предпочтениях формата работы после 2020 года.",
      is_private: false,
      is_anonymous: true,
      status: "active",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  });

  const survey3 = await prisma.survey.create({
    data: {
      creator_id: olga.user_id,
      title: "Дизайн-система команды",
      short_description: "Оценка текущей дизайн-системы (приватный)",
      full_description: "Только для членов дизайн-команды. Нужен пароль.",
      is_private: true,
      password_hash: privatePasswordHash,
      is_anonymous: false,
      status: "active",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  const survey4 = await prisma.survey.create({
    data: {
      creator_id: maria.user_id,
      title: "Черновик: Идеи для хакатона",
      short_description: "Пока только идеи",
      full_description: "Сбор идей. Ещё не готов к публикации.",
      is_private: false,
      is_anonymous: false,
      status: "draft",
      deadline: null,
    },
  });

  const survey5 = await prisma.survey.create({
    data: {
      creator_id: alex.user_id,
      title: "Итоги квартала (завершён)",
      short_description: "Ретроспектива Q3",
      full_description: "Опрос уже завершён. Результаты доступны.",
      is_private: false,
      is_anonymous: false,
      status: "completed",
      deadline: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      completed_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  // ---------------------------------------------------------------
  // 4. Вопросы (5)
  // ---------------------------------------------------------------
  const q1 = await prisma.question.create({
    data: {
      survey_id: survey1.survey_id,
      text: "Какой язык программирования вы используете чаще всего?",
      allow_multiple: false,
      order_index: 1,
    },
  });

  const q2 = await prisma.question.create({
    data: {
      survey_id: survey1.survey_id,
      text: "Какие фреймворки/библиотеки вы применяете?",
      allow_multiple: true,
      order_index: 2,
    },
  });

  const q3 = await prisma.question.create({
    data: {
      survey_id: survey2.survey_id,
      text: "Где вам комфортнее работать?",
      allow_multiple: false,
      order_index: 1,
    },
  });

  const q4 = await prisma.question.create({
    data: {
      survey_id: survey3.survey_id,
      text: "Насколько удобна текущая дизайн-система? (1–5)",
      allow_multiple: false,
      order_index: 1,
    },
  });

  const q5 = await prisma.question.create({
    data: {
      survey_id: survey5.survey_id,
      text: "Довольны ли вы итогами квартала?",
      allow_multiple: false,
      order_index: 1,
    },
  });

  // ---------------------------------------------------------------
  // 5. Варианты ответов (больше 5 — это нормально, лимит 10 на вопрос)
  // ---------------------------------------------------------------
  // Вопрос 1 — языки
  const optJs = await prisma.option.create({
    data: { question_id: q1.question_id, text: "JavaScript / TypeScript", order_index: 1 },
  });
  const optPython = await prisma.option.create({
    data: { question_id: q1.question_id, text: "Python", order_index: 2 },
  });
  const optJava = await prisma.option.create({
    data: { question_id: q1.question_id, text: "Java", order_index: 3 },
  });
  const optGo = await prisma.option.create({
    data: { question_id: q1.question_id, text: "Go", order_index: 4 },
  });
  const optOther = await prisma.option.create({
    data: { question_id: q1.question_id, text: "Другой", order_index: 5 },
  });

  // Вопрос 2 — фреймворки (multiple)
  const optReact = await prisma.option.create({
    data: { question_id: q2.question_id, text: "React", order_index: 1 },
  });
  const optVue = await prisma.option.create({
    data: { question_id: q2.question_id, text: "Vue", order_index: 2 },
  });
  const optAngular = await prisma.option.create({
    data: { question_id: q2.question_id, text: "Angular", order_index: 3 },
  });
  const optNest = await prisma.option.create({
    data: { question_id: q2.question_id, text: "NestJS / Express", order_index: 4 },
  });
  const optDjango = await prisma.option.create({
    data: { question_id: q2.question_id, text: "Django / FastAPI", order_index: 5 },
  });

  // Вопрос 3 — удалёнка
  const optRemote = await prisma.option.create({
    data: { question_id: q3.question_id, text: "Полностью удалённо", order_index: 1 },
  });
  const optHybrid = await prisma.option.create({
    data: { question_id: q3.question_id, text: "Гибрид (2–3 дня в офисе)", order_index: 2 },
  });
  const optOffice = await prisma.option.create({
    data: { question_id: q3.question_id, text: "Полностью офис", order_index: 3 },
  });

  // Вопрос 4 — дизайн-система
  await prisma.option.create({
    data: { question_id: q4.question_id, text: "1 — очень неудобно", order_index: 1 },
  });
  await prisma.option.create({
    data: { question_id: q4.question_id, text: "2", order_index: 2 },
  });
  await prisma.option.create({
    data: { question_id: q4.question_id, text: "3 — нормально", order_index: 3 },
  });
  await prisma.option.create({
    data: { question_id: q4.question_id, text: "4", order_index: 4 },
  });
  await prisma.option.create({
    data: { question_id: q4.question_id, text: "5 — отлично", order_index: 5 },
  });

  // Вопрос 5 — итоги квартала
  const optYes = await prisma.option.create({
    data: { question_id: q5.question_id, text: "Да, полностью", order_index: 1 },
  });
  const optPartly = await prisma.option.create({
    data: { question_id: q5.question_id, text: "Частично", order_index: 2 },
  });
  const optNo = await prisma.option.create({
    data: { question_id: q5.question_id, text: "Нет", order_index: 3 },
  });

  // ---------------------------------------------------------------
  // 6. Голоса (5+)
  // ---------------------------------------------------------------
  // maria в опросе 1
  await prisma.vote.create({ data: { user_id: maria.user_id, option_id: optJs.option_id } });
  await prisma.vote.create({ data: { user_id: maria.user_id, option_id: optReact.option_id } });
  await prisma.vote.create({ data: { user_id: maria.user_id, option_id: optNest.option_id } });

  // alex в опросе 1
  await prisma.vote.create({ data: { user_id: alex.user_id, option_id: optPython.option_id } });
  await prisma.vote.create({ data: { user_id: alex.user_id, option_id: optDjango.option_id } });

  // olga в опросе 1
  await prisma.vote.create({ data: { user_id: olga.user_id, option_id: optJs.option_id } });
  await prisma.vote.create({ data: { user_id: olga.user_id, option_id: optReact.option_id } });

  // alex и maria в опросе 2
  await prisma.vote.create({ data: { user_id: alex.user_id, option_id: optRemote.option_id } });
  await prisma.vote.create({ data: { user_id: maria.user_id, option_id: optHybrid.option_id } });

  // голоса в завершённом опросе
  await prisma.vote.create({ data: { user_id: maria.user_id, option_id: optYes.option_id } });
  await prisma.vote.create({ data: { user_id: alex.user_id, option_id: optPartly.option_id } });
  await prisma.vote.create({ data: { user_id: olga.user_id, option_id: optYes.option_id } });

  // ---------------------------------------------------------------
  // 7. Участия (Participation) — факт завершения
  // ---------------------------------------------------------------
  await prisma.participation.create({
    data: { user_id: maria.user_id, survey_id: survey1.survey_id },
  });
  await prisma.participation.create({
    data: { user_id: alex.user_id, survey_id: survey1.survey_id },
  });
  await prisma.participation.create({
    data: { user_id: olga.user_id, survey_id: survey1.survey_id },
  });
  await prisma.participation.create({
    data: { user_id: maria.user_id, survey_id: survey2.survey_id },
  });
  await prisma.participation.create({
    data: { user_id: alex.user_id, survey_id: survey2.survey_id },
  });
  await prisma.participation.create({
    data: { user_id: maria.user_id, survey_id: survey5.survey_id },
  });
  await prisma.participation.create({
    data: { user_id: alex.user_id, survey_id: survey5.survey_id },
  });
  await prisma.participation.create({
    data: { user_id: olga.user_id, survey_id: survey5.survey_id },
  });

  console.log("Сид выполнен успешно:");
  console.log("- Роли:          3 (guest, user, admin)");
  console.log("- Пользователи:  5 (пароль у всех: password123)");
  console.log("- Опросы:        5 (active / draft / completed + 1 private)");
  console.log("- Вопросы:       5");
  console.log("- Варианты:     21");
  console.log("- Голоса:       12");
  console.log("- Участия:       8");
  console.log("");
  console.log("Приватный опрос «Дизайн-система команды» — пароль: design2024");
  console.log("Админ: admin@example.com / password123");
  console.log("Пользователь: maria@example.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
