// survey-frontend/src/App.jsx
import { Routes, Route } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout.jsx";
import SurveyLayout from "./components/layout/SurveyLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import CatalogPage from "./pages/CatalogPage.jsx";
import CompletedPage from "./pages/CompletedPage.jsx";
import CreatedPage from "./pages/CreatedPage.jsx";
import CreateSurveyPage from "./pages/CreateSurveyPage.jsx";
import SurveyPage from "./pages/SurveyPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SurveyResultsPage from "./pages/SurveyResultsPage.jsx";

export default function App() {
  return (
    <Routes>
      {/* Публичные страницы с боковым меню */}
      <Route element={<AppLayout />}>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/completed" element={<CompletedPage />} />
      </Route>

      {/* Страницы только для авторизованных */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/created" element={<CreatedPage />} />
          <Route path="/create" element={<CreateSurveyPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/surveys/:id/results" element={<SurveyResultsPage />} />
        </Route>
      </Route>

      {/* Страницы с верхней шапкой */}
      <Route element={<SurveyLayout />}>
        <Route path="/surveys/:id" element={<SurveyPage />} />
      </Route>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
