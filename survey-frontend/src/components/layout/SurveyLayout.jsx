import { Link, Outlet } from "react-router-dom";
import Logo from "./Logo.jsx";
import Icon from "../ui/Icon.jsx";

export default function SurveyLayout() {
  return (
    <>
      <header className="topbar">
        <Logo />
        <Link to="/" className="back">
          <Icon name="arrowLeft" size={18} />
          Каталог опросов
        </Link>
        <span className="avatar" title="Профиль">M</span>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
