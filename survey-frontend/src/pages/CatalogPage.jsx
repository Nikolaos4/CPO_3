// survey-frontend/src/pages/CatalogPage.jsx
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "../components/ui/Button.jsx";
import Icon from "../components/ui/Icon.jsx";
import SearchInput from "../components/ui/SearchInput.jsx";
import SurveyCard from "../components/ui/SurveyCard.jsx";
import { api } from "../api/client.js";

// Значения filter совпадают с query-параметром API: GET /api/surveys?filter=...
const FILTERS = [
  { value: "popular", label: "Популярные" },
  { value: "newest", label: "Новые" },
  { value: "oldest", label: "Старые" },
  { value: "private", label: "Приватные" },
  { value: "public", label: "Публичные" },
  { value: "all", label: "Все" },
];

const PAGE_SIZE = 6;

export default function CatalogPage() {
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filter, setFilter] = useState("popular");
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  // Дебаунс поиска: не дёргаем API на каждую букву
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const load = useCallback(
    async (page, { append = false } = {}) => {
      const id = ++requestId.current;
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError("");
      try {
        const data = await api.listSurveys({
          filter,
          search: debouncedSearch || undefined,
          page,
          limit: PAGE_SIZE,
        });
        if (id !== requestId.current) return; // устаревший ответ
        const newItems = data.items || [];
        setItems((prev) => (append ? [...prev, ...newItems] : newItems));
        setPagination(data.pagination || null);
      } catch (err) {
        if (id !== requestId.current) return;
        setError(err.message || "Не удалось загрузить опросы");
        if (!append) setItems([]);
      } finally {
        if (id === requestId.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filter, debouncedSearch],
  );

  // Перезапрос при смене фильтра или поиска
  useEffect(() => {
    load(1);
  }, [load]);

  const hasMore = useMemo(() => {
    if (!pagination) return false;
    return pagination.page * pagination.limit < pagination.total;
  }, [pagination]);

  const onLoadMore = () => {
    if (!pagination || loadingMore) return;
    load(pagination.page + 1, { append: true });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h1 className="page-title">Каталог опросов</h1>
          <p className="page-sub">Самые популярные активные опросы</p>
        </div>
        <Button to="/create">
          <Icon name="plus" size={18} strokeWidth={2.4} />
          Создать опрос
        </Button>
      </div>

      <div className="toolbar">
        <SearchInput value={search} onChange={setSearch} />
        <div className="chips" role="group" aria-label="Фильтры">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              className={`chip${filter === f.value ? " chip--active" : ""}`}
              aria-pressed={filter === f.value}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error && <p style={{ color: "var(--c-danger, #d33)", marginBottom: 12 }}>{error}</p>}

      {loading ? (
        <p className="empty">Загрузка…</p>
      ) : items.length === 0 ? (
        <p className="empty">Ничего не найдено</p>
      ) : (
        <div className="grid">
          {items.map((s) => (
            <SurveyCard key={s.survey_id} survey={s} />
          ))}
        </div>
      )}

      <div className="more">
        {filter !== "all" && !debouncedSearch ? (
          <Button variant="secondary" onClick={() => setFilter("all")}>
            Показать все опросы
          </Button>
        ) : hasMore ? (
          <Button variant="secondary" onClick={onLoadMore} disabled={loadingMore}>
            {loadingMore ? "Загрузка…" : "Показать ещё"}
          </Button>
        ) : null}
      </div>
    </>
  );
}
