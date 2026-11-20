// survey-frontend/src/pages/CreatedPage.jsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Button from "../components/ui/Button.jsx";

const statusLabel = { draft: "Черновик", active: "Активен", completed: "Завершён" };

export default function CreatedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.listMySurveys();
      setItems(data.items || []);
    } catch (err) {
      setError(err.message || "Не удалось загрузить опросы");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onPublish = async (id) => {
    setBusyId(id);
    try {
      await api.publishSurvey(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const onClose = async (id) => {
    if (!window.confirm("Завершить опрос? После этого его нельзя будет пройти.")) return;
    setBusyId(id);
    try {
      await api.closeSurvey(id);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("Удалить опрос безвозвратно?")) return;
    setBusyId(id);
    try {
      await api.deleteSurvey(id);
      setItems((xs) => xs.filter((x) => x.survey_id !== id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Созданные опросы</h1>
          <p className="page-sub">Черновики, активные и завершённые опросы</p>
        </div>
        <Link to="/create">
          <Button>Создать опрос</Button>
        </Link>
      </div>

      {error && <p style={{ color: "var(--c-danger, #d33)", marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <div className="card stub">
          <p>Загрузка…</p>
        </div>
      ) : items.length === 0 ? (
        <div className="card stub">
          <h2>Пока пусто</h2>
          <p>Создайте первый опрос — он появится здесь.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {items.map((s) => (
            <div key={s.survey_id} className="card" style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12,
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <h3 style={{ margin: 0 }}>{s.title}</h3>
                  {s.short_description && (
                    <p className="page-sub" style={{ margin: "4px 0 0" }}>
                      {s.short_description}
                    </p>
                  )}
                  <p className="page-sub" style={{ margin: "8px 0 0", fontSize: 13 }}>
                    Статус: <strong>{statusLabel[s.status] || s.status}</strong>
                    {" · "}Участников: {s.participants_count ?? s._count?.participations ?? 0}
                    {s.deadline && (
                      <>{" · "}До: {new Date(s.deadline).toLocaleDateString()}</>
                    )}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                  }}
                >
                  <Link to={`/surveys/${s.survey_id}`}>
                    <Button variant="ghost">Открыть</Button>
                  </Link>
                  <Link to={`/surveys/${s.survey_id}/results`}>
                    <Button variant="ghost">Результаты</Button>
                  </Link>
                  {s.status === "draft" && (
                    <Button
                      onClick={() => onPublish(s.survey_id)}
                      disabled={busyId === s.survey_id}
                    >
                      Опубликовать
                    </Button>
                  )}
                  {s.status === "active" && (
                    <Button
                      onClick={() => onClose(s.survey_id)}
                      disabled={busyId === s.survey_id}
                    >
                      Завершить
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    onClick={() => onDelete(s.survey_id)}
                    disabled={busyId === s.survey_id}
                  >
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
