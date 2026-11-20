// survey-frontend/src/components/layout/AppLayout.jsx
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import Logo from "./Logo.jsx";
import Icon from "../ui/Icon.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

const NAV = [
  { to: "/", label: "Главная", icon: "home", end: true },
  { to: "/completed", label: "Пройденные опросы", icon: "checkSquare", protected: true },
  { to: "/created", label: "Созданные опросы", icon: "pencil", protected: true },
];

export default function AppLayout() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <Logo />
        <nav className="nav" aria-label="Основное меню">
          {NAV.map((item) => {
            if (item.protected && !isAuthenticated) return null;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav__link${isActive ? " nav__link--active" : ""}`}
              >
                <Icon name={item.icon} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar__user">
          {isAuthenticated ? (
            <>
              <Link to="/profile" className="sidebar__user-profile">
                <span className="avatar">{user.nickname.charAt(0).toUpperCase()}</span>
                <div>
                  <div className="sidebar__user-name">{user.nickname}</div>
                  <div className="sidebar__user-sub">{user.email}</div>
                </div>
              </Link>
              <button
                className="icon-btn"
                type="button"
                aria-label="Выйти"
                title="Выйти"
                onClick={handleLogout}
              >
                <Icon name="logout" />
              </button>
            </>
          ) : (
            <div style={{ display: "grid", gap: 8, width: "100%" }}>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <button className="btn btn--block" type="button">Войти</button>
              </Link>
              <Link to="/register" style={{ textDecoration: "none" }}>
                <button className="btn btn--block btn--ghost" type="button">Регистрация</button>
              </Link>
            </div>
          )}
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
