// ВРЕМЕННЫЕ данные для вёрстки по макетам (этап 1).
// Будут удалены на этапе 4, когда каталог подключится к GET /api/surveys.
export const MOCK_SURVEYS = [
  { survey_id: 1, title: "Любимый язык программирования", short_description: "Выбираем язык для первого курса и спецкурсов кафедры", status: "active", participants_count: 83, is_private: false },
  { survey_id: 2, title: "Столовая: меню на неделю", short_description: "Какие блюда оставить, а какие убрать из меню корпуса Б", status: "active", participants_count: 214, is_private: false },
  { survey_id: 3, title: "Выбор темы хакатона", short_description: "Голосование за тему весеннего хакатона факультета", status: "active", participants_count: 57, is_private: true },
  { survey_id: 4, title: "Удобство расписания", short_description: "Оцените новое расписание второго семестра", status: "active", participants_count: 149, is_private: false },
  { survey_id: 5, title: "Клуб настольных игр", short_description: "В какие дни и во что играем в этом месяце", status: "active", participants_count: 31, is_private: true },
  { survey_id: 6, title: "Онлайн или очно?", short_description: "Формат лекций по выбору на следующий семестр", status: "active", participants_count: 96, is_private: false },
];

export const MOCK_COMPLETED = [
  { ...MOCK_SURVEYS[0], completed_at: "2026-11-03" },
  { ...MOCK_SURVEYS[3], status: "completed", completed_at: "2026-11-01" },
  { ...MOCK_SURVEYS[1], completed_at: "2026-10-28" },
  { ...MOCK_SURVEYS[5], status: "completed", completed_at: "2026-10-21" },
  { ...MOCK_SURVEYS[2], status: "completed", completed_at: "2026-10-14" },
  { ...MOCK_SURVEYS[4], completed_at: "2026-10-02" },
];
