// survey-frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Logo from "../components/layout/Logo.jsx";
import Input from "../components/ui/Input.jsx";
import Button from "../components/ui/Button.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email.trim(), form.password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(err.message || "Не удалось войти");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth">
      <form className="card auth__card" onSubmit={onSubmit} noValidate>
        <Logo />
        <h1 className="page-title" style={{ fontSize: 24, marginBottom: 20 }}>
          Вход
        </h1>
        <div style={{ display: "grid", gap: 16 }}>
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
            autoComplete="current-password"
            value={form.password}
            onChange={onChange}
            required
          />
          {error && <p style={{ color: "var(--c-danger, #d33)", fontSize: 14 }}>{error}</p>}
          <Button type="submit" block disabled={submitting}>
            {submitting ? "Входим…" : "Войти"}
          </Button>
        </div>
        <p className="page-sub" style={{ marginTop: 16 }}>
          Нет аккаунта?{" "}
          <Link to="/register" style={{ color: "var(--c-primary-dark)", fontWeight: 600 }}>
            Зарегистрироваться
          </Link>
        </p>
      </form>
    </div>
  );
}
