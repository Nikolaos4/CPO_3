// survey-frontend/src/pages/CreateSurveyPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";

const emptyQuestion = () => ({
  text: "",
  allow_multiple: false,
  options: [{ text: "" }, { text: "" }],
});

export default function CreateSurveyPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    short_description: "",
    full_description: "",
    is_private: false,
    password: "",
    is_anonymous: false,
    deadline: "",
  });
  const [questions, setQuestions] = useState([emptyQuestion()]);
  const [publish, setPublish] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const updateQuestion = (qi, patch) =>
    setQuestions((qs) => qs.map((q, i) => (i === qi ? { ...q, ...patch } : q)));

  const updateOption = (qi, oi, text) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i !== qi
          ? q
          : { ...q, options: q.options.map((o, j) => (j === oi ? { text } : o)) },
      ),
    );

  const addOption = (qi) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i !== qi
          ? q
          : {
              ...q,
              options: q.options.length >= 10 ? q.options : [...q.options, { text: "" }],
            },
      ),
    );

  const removeOption = (qi, oi) =>
    setQuestions((qs) =>
      qs.map((q, i) =>
        i !== qi
          ? q
          : {
              ...q,
              options:
                q.options.length <= 2 ? q.options : q.options.filter((_, j) => j !== oi),
            },
      ),
    );

  const addQuestion = () => setQuestions((qs) => [...qs, emptyQuestion()]);

  const removeQuestion = (qi) =>
    setQuestions((qs) => (qs.length <= 1 ? qs : qs.filter((_, i) => i !== qi)));

  const validate = () => {
    if (form.title.trim().length < 3) return "Название опроса слишком короткое (минимум 3 символа)";
    if (form.is_private && form.password.length < 1)
      return "Для приватного опроса нужен пароль";
    for (const [i, q] of questions.entries()) {
      if (q.text.trim().length < 1) return `Вопрос ${i + 1}: пустой текст`;
      const opts = q.options.map((o) => o.text.trim()).filter(Boolean);
      if (opts.length < 2) return `Вопрос ${i + 1}: нужно минимум 2 варианта ответа`;
      if (new Set(opts).size !== opts.length)
        return `Вопрос ${i + 1}: варианты не должны повторяться`;
    }
    return "";
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        short_description: form.short_description.trim() || undefined,
        full_description: form.full_description.trim() || undefined,
        is_private: form.is_private,
        password: form.is_private ? form.password : undefined,
        is_anonymous: form.is_anonymous,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
        publish,
        questions: questions.map((q) => ({
          text: q.text.trim(),
          allow_multiple: q.allow_multiple,
          options: q.options
            .map((o) => o.text.trim())
            .filter(Boolean)
            .map((text) => ({ text })),
        })),
      };
      await api.createSurvey(payload);
      navigate("/created", { replace: true });
    } catch (err) {
      setError(err.message || "Не удалось создать опрос");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="page-head">
        <div>
          <h1 className="page-title">Создание опроса</h1>
          <p className="page-sub">Заполните основные поля и добавьте вопросы</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Сохраняем…" : "Сохранить"}
          </Button>
        </div>
      </div>

      <div className="card" style={{ padding: 20, display: "grid", gap: 16 }}>
        <Input
          label="Название"
          value={form.title}
          onChange={(e) => setField("title", e.target.value)}
          required
        />
        <Input
          label="Короткое описание"
          value={form.short_description}
          onChange={(e) => setField("short_description", e.target.value)}
        />
        <label style={{ display: "grid", gap: 6 }}>
          <span className="page-sub">Полное описание</span>
          <textarea
            rows={4}
            value={form.full_description}
            onChange={(e) => setField("full_description", e.target.value)}
          />
        </label>
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.is_private}
            onChange={(e) => setField("is_private", e.target.checked)}
          />
          <span>Приватный опрос (доступ по паролю)</span>
        </label>
        {form.is_private && (
          <Input
            label="Пароль опроса"
            type="password"
            value={form.password}
            onChange={(e) => setField("password", e.target.value)}
            required
          />
        )}
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={form.is_anonymous}
            onChange={(e) => setField("is_anonymous", e.target.checked)}
          />
          <span>Анонимный опрос</span>
        </label>
        <Input
          label="Дедлайн (необязательно)"
          type="datetime-local"
          value={form.deadline}
          onChange={(e) => setField("deadline", e.target.value)}
        />
        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={publish}
            onChange={(e) => setPublish(e.target.checked)}
          />
          <span>Опубликовать сразу (иначе сохранится как черновик)</span>
        </label>
      </div>

      <h2 style={{ marginTop: 24 }}>Вопросы</h2>
      <div style={{ display: "grid", gap: 16 }}>
        {questions.map((q, qi) => (
          <div key={qi} className="card" style={{ padding: 16, display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>Вопрос {qi + 1}</strong>
              <Button
                type="button"
                variant="ghost"
                onClick={() => removeQuestion(qi)}
                disabled={questions.length <= 1}
              >
                Удалить вопрос
              </Button>
            </div>
            <Input
              label="Текст вопроса"
              value={q.text}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              required
            />
            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                type="checkbox"
                checked={q.allow_multiple}
                onChange={(e) => updateQuestion(qi, { allow_multiple: e.target.checked })}
              />
              <span>Несколько вариантов ответа</span>
            </label>
            <div style={{ display: "grid", gap: 8 }}>
              {q.options.map((o, oi) => (
                <div key={oi} style={{ display: "flex", gap: 8 }}>
                  <Input
                    value={o.text}
                    placeholder={`Вариант ${oi + 1}`}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => removeOption(qi, oi)}
                    disabled={q.options.length <= 2}
                  >
                    ×
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="ghost"
                onClick={() => addOption(qi)}
                disabled={q.options.length >= 10}
              >
                + Добавить вариант
              </Button>
            </div>
          </div>
        ))}
      </div>

      {error && <p style={{ color: "var(--c-danger, #d33)", marginTop: 12 }}>{error}</p>}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <Button type="button" variant="ghost" onClick={addQuestion}>
          + Добавить вопрос
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? "Сохраняем…" : "Сохранить"}
        </Button>
      </div>
    </form>
  );
}
