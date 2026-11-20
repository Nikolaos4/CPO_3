// survey-frontend/src/pages/SurveyResultsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Button from "../components/ui/Button.jsx";

export default function SurveyResultsPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.getResults(id);
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить результаты");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const totalVotes = useMemo(() => {
    if (!data) return 0;
    return data.participants_count ?? 0;
  }, [data]);

  const onDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    setDownloadError("");
    try {
      await api.downloadResultsCsv(id, `survey-${id}-results.csv`);
    } catch (err) {
      setDownloadError(err.message || "Не удалось скачать CSV");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return <div className="card stub"><p>Загрузка результатов…</p></div>;
  }

  if (error) {
    return (
      <div className="card stub">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <Link to="/created"><Button variant="secondary">К созданным</Button></Link>
      </div>
    );
  }

  if (!data) return null;

  const canExport = data.status === "completed";

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Результаты: {data.title}</h1>
          <p className="page-sub">
            Статус: {data.status}
            {" · "}Участников: {totalVotes}
            {" · "}Вопросов: {data.questions?.length ?? 0}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {canExport && (
            <Button onClick={onDownload} disabled={downloading}>
              {downloading ? "Скачиваем…" : "Скачать CSV"}
            </Button>
          )}
          <Link to="/created">
            <Button variant="secondary">К созданным</Button>
          </Link>
        </div>
      </div>

      {!canExport && (
        <p className="page-sub" style={{ marginBottom: 12, fontSize: 13 }}>
          Экспорт CSV доступен только после завершения опроса.
        </p>
      )}

      {downloadError && (
        <p style={{ color: "var(--c-danger, #d33)", marginBottom: 12 }}>{downloadError}</p>
      )}

      {(!data.questions || data.questions.length === 0) ? (
        <div className="card stub"><p>В опросе нет вопросов.</p></div>
      ) : (
        <div style={{ display: "grid", gap: 16 }}>
          {data.questions.map((q, qi) => {
            const totalForQuestion = q.options.reduce(
              (sum, o) => sum + (o.votes_count || 0),
              0,
            );
            return (
              <div key={q.question_id} className="card" style={{ padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>
                  {qi + 1}. {q.text}
                </h3>
                <p className="page-sub" style={{ fontSize: 13, marginTop: 0 }}>
                  {q.allow_multiple ? "Множественный выбор" : "Одиночный выбор"}
                  {" · "}Ответов: {totalForQuestion}
                </p>
                <div style={{ display: "grid", gap: 8 }}>
                  {q.options.map((o) => {
                    const votes = o.votes_count || 0;
                    const percent = totalForQuestion > 0 ? Math.round((votes / totalForQuestion) * 100) : 0;
                    return (
                      <div key={o.option_id}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                          <span>{o.text}</span>
                          <span>
                            <strong>{votes}</strong>{" "}
                            <span className="page-sub">({percent}%)</span>
                          </span>
                        </div>
                        <div
                          style={{
                            height: 8,
                            background: "var(--c-bg-soft, #eef3ef)",
                            borderRadius: 4,
                            marginTop: 4,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${percent}%`,
                              height: "100%",
                              background: "var(--c-primary, #3a9d72)",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
