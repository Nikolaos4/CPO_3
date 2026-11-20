// survey-frontend/src/pages/CompletedPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import { api } from "../api/client.js";

const statusLabel = { draft: "Черновик", active: "Активен", completed: "Завершён" };

export default function CompletedPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [openId, setOpenId] = useState(null); // survey_id, у которого раскрыты ответы

  // Дебаунс поиска
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listMyParticipations({
        search: debouncedSearch || undefined,
        page: 1,
        limit: 50,
      });
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Не удалось загрузить пройденные опросы");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleAnswers = (surveyId) => {
    setOpenId((prev) => (prev === surveyId ? null : surveyId));
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Пройденные опросы</h1>
          <p className="page-sub">Опросы, которые вы завершили</p>
        </div>
      </div>

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} placeholder="Поиск по названию" />
      </div>

      {error && <p style={{ color: "var(--c-danger, #d33)", marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <div className="card stub"><p>Загрузка…</p></div>
      ) : items.length === 0 ? (
        <div className="card stub">
          <h2>Пока пусто</h2>
          <p>
            Вы ещё не прошли ни одного опроса.{" "}
            <Link to="/" style={{ color: "var(--c-primary-dark)", fontWeight: 600 }}>
              Перейти в каталог
            </Link>
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map(({ survey, completed_at, my_answers }) => {
            const isOpen = openId === survey.survey_id;
            // Быстрый доступ к вариантам: { option_id: text }
            const optionsById = new Map();
            for (const q of survey.questions || []) {
              for (const o of q.options || []) optionsById.set(o.option_id, o.text);
            }
            return (
              <div key={survey.survey_id} className="card" style={{ padding: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>{survey.title}</h3>
                    {survey.short_description && (
                      <p className="page-sub" style={{ margin: "4px 0 0" }}>
                        {survey.short_description}
                      </p>
                    )}
                    <p className="page-sub" style={{ margin: "8px 0 0", fontSize: 13 }}>
                      Статус: <strong>{statusLabel[survey.status] || survey.status}</strong>
                      {" · "}Пройден: {new Date(completed_at).toLocaleString()}
                      {" · "}Участников: {survey.participants_count ?? 0}
                    </p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                    <Link to={`/surveys/${survey.survey_id}`}>
                      <Button variant="ghost">Открыть опрос</Button>
                    </Link>
                    <Button onClick={() => toggleAnswers(survey.survey_id)}>
                      {isOpen ? "Скрыть ответы" : "Мои ответы"}
                    </Button>
                  </div>
                </div>

                {isOpen && (
                  <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
                    {(survey.questions || []).map((q, qi) => {
                      const my = (my_answers || []).find((a) => a.question_id === q.question_id);
                      const chosen = (my?.option_ids || []).map((oid) => optionsById.get(oid) ?? `#${oid}`);
                      return (
                        <div key={q.question_id} style={{ padding: 12, background: "var(--c-bg-soft, #f6f8f7)", borderRadius: 8 }}>
                          <strong>
                            {qi + 1}. {q.text}
                          </strong>
                          <div style={{ marginTop: 6, fontSize: 14 }}>
                            {chosen.length === 0 ? (
                              <em>Нет ответа</em>
                            ) : (
                              <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {chosen.map((text, idx) => (
                                  <li key={idx}>{text}</li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
