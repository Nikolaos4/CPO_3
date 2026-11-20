// survey-frontend/src/pages/RegisterPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "../components/layout/Logo.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const initial = { nickname: "", email: "", password: "", confirm: "" };

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initial);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = () => {
    if (form.nickname.trim().length < 3) return "Nickname должен быть не короче 3 символов";
    if (form.nickname.trim().length > 30) return "Nickname должен быть не длиннее 30 символов";
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return "Некорректный email";
    if (form.password.length < 8) return "Пароль должен быть не короче 8 символов";
    if (form.password.length > 72) return "Пароль слишком длинный (максимум 72 символа)";
    if (form.password !== form.confirm) return "Пароли не совпадают";
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
      await register({
        nickname: form.nickname.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.message || "Не удалось зарегистрироваться");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={onSubmit} noValidate>
        <Logo />
        <h1 className="page-title" style={{ fontSize: 24, marginBottom: 20 }}>
          Регистрация
        </h1>
        <div style={{ display: "grid", gap: 16 }}>
          <Input
            label="Nickname"
            name="nickname"
            placeholder="username"
            autoComplete="username"
            value={form.nickname}
            onChange={onChange}
            required
          />
          <Input
            label="Email"
            type="email"
            name="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={onChange}
            required
          />
          <Input
            label="Пароль"
            type="password"
            name="password"
            autoComplete="new-password"
            value={form.password}
            onChange={onChange}
            required
          />
          <Input
            label="Повторите пароль"
            type="password"
            name="confirm"
            autoComplete="new-password"
            value={form.confirm}
            onChange={onChange}
            required
          />
          {error && <p style={{ color: "var(--c-danger, #d33)", fontSize: 14 }}>{error}</p>}
          <Button type="submit" block disabled={submitting}>
            {submitting ? "Создаём…" : "Зарегистрироваться"}
          </Button>
        </div>
        <p className="page-sub" style={{ marginTop: 16 }}>
          Уже есть аккаунт?{" "}
          <Link to="/login" style={{ color: "var(--c-primary-dark)", fontWeight: 600 }}>
            Войти
          </Link>
        </p>
      </form>
    </div>
  );
}
