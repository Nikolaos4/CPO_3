import Button from "../components/ui/Button.jsx";

export default function NotFoundPage() {
  return (
    <div className="auth">
      <div className="card auth__card" style={{ textAlign: "center" }}>
        <h1 className="page-title">404</h1>
        <p className="page-sub" style={{ margin: "8px 0 20px" }}>Такой страницы нет</p>
        <Button to="/">На главную</Button>
      </div>
    </div>
  );
}
