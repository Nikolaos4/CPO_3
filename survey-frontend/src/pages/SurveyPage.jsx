// survey-frontend/src/pages/SurveyPage.jsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import Button from "../components/ui/Button.jsx";
import Input from "../components/ui/Input.jsx";

export default function SurveyPage() {
  const { id } = useParams();
  const [survey, setSurvey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState({}); // { [question_id]: [option_id, ...] }
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  // Для приватных опросов
  const [surveyToken, setSurveyToken] = useState(null);
  const [password, setPassword] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.getSurvey(id, surveyToken);
      setSurvey(data);
      // Если пользователь уже голосовал раньше — подставим его ответы
      if (data.my_answers) {
        const map = {};
        for (const a of data.my_answers) map[a.question_id] = a.option_ids;
        setAnswers(map);
      }
    } catch (err) {
      setError(err.message || "Не удалось загрузить опрос");
    } finally {
      setLoading(false);
    }
  }, [id, surveyToken]);

  useEffect(() => {
    load();
  }, [load]);

  const onVerifyPassword = async (e) => {
    e.preventDefault();
    if (!password.trim() || verifying) return;
    setVerifying(true);
    setPasswordError("");
    try {
      const res = await api.verifyPassword(id, { password });
      setSurveyToken(res.survey_access_token);
      // После установки токена useEffect перезапустит load()
    } catch (err) {
      setPasswordError(err.message || "Неверный пароль");
    } finally {
      setVerifying(false);
    }
  };

  const toggleOption = (question, optionId) => {
    setAnswers((prev) => {
      const current = prev[question.question_id] || [];
      if (question.allow_multiple) {
        const exists = current.includes(optionId);
        return {
          ...prev,
          [question.question_id]: exists
            ? current.filter((x) => x !== optionId)
            : [...current, optionId],
        };
      }
      return { ...prev, [question.question_id]: [optionId] };
    });
  };

  const allAnswered = useMemo(() => {
    if (!survey?.questions?.length) return false;
    return survey.questions.every((q) => (answers[q.question_id] || []).length > 0);
  }, [survey, answers]);

  const onSubmit = async () => {
    if (!allAnswered || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const payload = {
        answers: Object.entries(answers).map(([question_id, option_ids]) => ({
          question_id: Number(question_id),
          option_ids,
        })),
      };
      await api.saveVotes(id, payload, surveyToken);
      await api.completeSurvey(id, surveyToken);
      setCompleted(true);
    } catch (err) {
      setError(err.message || "Не удалось завершить опрос");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="card stub"><p>Загрузка опроса…</p></div>;
  }

  if (error) {
    return (
      <div className="card stub">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <Link to="/"><Button variant="secondary">В каталог</Button></Link>
      </div>
    );
  }

  if (!survey) {
    return <div className="card stub"><p>Опрос не найден</p></div>;
  }

  // Приватный опрос: форма ввода пароля
  if (survey.requires_password) {
    return (
      <div className="card stub">
        <h2>{survey.title}</h2>
        {survey.short_description && <p className="page-sub">{survey.short_description}</p>}
        <p>Этот опрос защищён паролем. Введите пароль, чтобы пройти его.</p>
        <form onSubmit={onVerifyPassword} style={{ display: "grid", gap: 12, maxWidth: 360 }}>
          <Input
            label="Пароль опроса"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {passwordError && (
            <p style={{ color: "var(--c-danger, #d33)", fontSize: 14, margin: 0 }}>
              {passwordError}
            </p>
          )}
          <Button type="submit" disabled={verifying}>
            {verifying ? "Проверяем…" : "Войти в опрос"}
          </Button>
          <Link to="/">
            <Button type="button" variant="secondary" block>В каталог</Button>
          </Link>
        </form>
      </div>
    );
  }

  if (survey.is_completed_by_me) {
    return (
      <div className="card stub">
        <h2>{survey.title}</h2>
        <p>Вы уже прошли этот опрос. Просмотр своих ответов доступен в разделе «Пройденные опросы».</p>
        <Link to="/completed"><Button variant="secondary">К пройденным</Button></Link>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="card stub">
        <h2>Спасибо!</h2>
        <p>Ваши ответы сохранены.</p>
        <Link to="/"><Button variant="secondary">В каталог</Button></Link>
      </div>
    );
  }

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">{survey.title}</h1>
          {survey.short_description && (
            <p className="page-sub">{survey.short_description}</p>
          )}
        </div>
      </div>

      {survey.full_description && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <p style={{ margin: 0 }}>{survey.full_description}</p>
        </div>
      )}

      <div style={{ display: "grid", gap: 16 }}>
        {survey.questions?.map((q, qi) => {
          const selected = answers[q.question_id] || [];
          return (
            <div key={q.question_id} className="card" style={{ padding: 16 }}>
              <h3 style={{ marginTop: 0 }}>
                {qi + 1}. {q.text}
              </h3>
              <p className="page-sub" style={{ fontSize: 13, marginTop: 0 }}>
                {q.allow_multiple ? "Можно выбрать несколько вариантов" : "Выберите один вариант"}
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {q.options?.map((o) => {
                  const checked = selected.includes(o.option_id);
                  return (
                    <label
                      key={o.option_id}
                      style={{ display: "flex", gap: 8, alignItems: "center", cursor: "pointer" }}
                    >
                      <input
                        type={q.allow_multiple ? "checkbox" : "radio"}
                        name={`q-${q.question_id}`}
                        checked={checked}
                        onChange={() => toggleOption(q, o.option_id)}
                      />
                      <span>{o.text}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {error && <p style={{ color: "var(--c-danger, #d33)", marginTop: 12 }}>{error}</p>}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button onClick={onSubmit} disabled={!allAnswered || submitting}>
          {submitting ? "Отправляем…" : "Завершить опрос"}
        </Button>
        <Link to="/">
          <Button variant="secondary">Выйти без сохранения</Button>
        </Link>
      </div>
    </>
  );
}
