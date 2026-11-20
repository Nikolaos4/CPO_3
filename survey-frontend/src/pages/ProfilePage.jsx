// survey-frontend/src/pages/ProfilePage.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";
import Button from "../components/ui/Button.jsx";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api.getMe();
        if (!cancelled) setProfile(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "Не удалось загрузить профиль");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div className="card stub"><p>Загрузка профиля…</p></div>;
  }

  if (error) {
    return (
      <div className="card stub">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <Link to="/"><Button variant="secondary">На главную</Button></Link>
      </div>
    );
  }

  if (!profile) return null;

  const created = profile.stats?.created_count ?? 0;
  const completed = profile.stats?.completed_count ?? 0;
  const registeredAt = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Мой профиль</h1>
          <p className="page-sub">Данные аккаунта и статистика</p>
        </div>
      </div>

      <div className="card" style={{ padding: 20, display: "grid", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span className="avatar" style={{ width: 56, height: 56, fontSize: 24 }}>
            {profile.nickname?.charAt(0).toUpperCase() || "?"}
          </span>
          <div>
            <h2 style={{ margin: 0 }}>{profile.nickname}</h2>
            <p className="page-sub" style={{ margin: "4px 0 0" }}>{profile.email}</p>
          </div>
        </div>

        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="page-sub">Дата регистрации</span>
            <strong>{registeredAt}</strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="page-sub">Статус аккаунта</span>
            <strong style={{ color: profile.is_active ? "var(--c-primary-dark, #2e7d5b)" : "var(--c-danger, #d33)" }}>
              {profile.is_active ? "Активен" : "Заблокирован"}
            </strong>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span className="page-sub">Роль</span>
            <strong>{profile.role || "user"}</strong>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="page-sub">Создано опросов</div>
          <div style={{ fontSize: 36, fontWeight: 700, marginTop: 4 }}>{created}</div>
          <Link to="/created" style={{ marginTop: 8, display: "inline-block" }}>
            <Button variant="secondary">К созданным</Button>
          </Link>
        </div>
        <div className="card" style={{ padding: 20 }}>
          <div className="page-sub">Пройдено опросов</div>
          <div style={{ fontSize: 36, fontWeight: 700, marginTop: 4 }}>{completed}</div>
          <Link to="/completed" style={{ marginTop: 8, display: "inline-block" }}>
            <Button variant="secondary">К пройденным</Button>
          </Link>
        </div>
      </div>
    </>
  );
}
