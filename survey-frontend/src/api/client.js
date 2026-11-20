// survey-frontend/src/api/client.js
const ACCESS_KEY = "survey.access_token";
const REFRESH_KEY = "survey.refresh_token";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set({ access_token, refresh_token }) {
    if (access_token) localStorage.setItem(ACCESS_KEY, access_token);
    if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  constructor(message, status, payload) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

let refreshPromise = null;

async function refreshTokens() {
  const refresh_token = tokenStore.getRefresh();
  if (!refresh_token) throw new ApiError("Сессия истекла", 401, null);

  if (!refreshPromise) {
    refreshPromise = fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          tokenStore.clear();
          throw new ApiError(data.message || "Не удалось обновить сессию", res.status, data);
        }
        tokenStore.set(data);
        return data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

export async function apiFetch(path, { method = "GET", body, headers = {}, auth = true, retry = true } = {}) {
  const finalHeaders = { ...headers };
  if (body !== undefined) finalHeaders["Content-Type"] = "application/json";

  const access = tokenStore.getAccess();
  if (auth && access) finalHeaders.Authorization = `Bearer ${access}`;

  const res = await fetch(path, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && auth && retry && tokenStore.getRefresh()) {
    try {
      await refreshTokens();
      return apiFetch(path, { method, body, headers, auth, retry: false });
    } catch {
      /* fallthrough */
    }
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.message || data?.error?.message || `Ошибка ${res.status}`;
    throw new ApiError(message, res.status, data);
  }
  return data;
}

const withQuery = (path, params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ""),
  ).toString();
  return qs ? `${path}?${qs}` : path;
};

export const api = {
  // users
  getMe: () => apiFetch("/api/users/me"),
  listMyParticipations: (params = {}) =>
    apiFetch(withQuery("/api/users/me/participations", params)),
  listMySurveys: (params = {}) =>
    apiFetch(withQuery("/api/users/me/surveys", params)),

  // auth
  register: (payload) => apiFetch("/api/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => apiFetch("/api/auth/login", { method: "POST", body: payload, auth: false }),
  logout: () => apiFetch("/api/auth/logout", { method: "POST" }),

  // surveys
  listSurveys: (params = {}) =>
    apiFetch(withQuery("/api/surveys", params), { auth: false }),
  createSurvey: (payload) => apiFetch("/api/surveys", { method: "POST", body: payload }),
  publishSurvey: (id) => apiFetch(`/api/surveys/${id}/publish`, { method: "POST" }),
  closeSurvey: (id) => apiFetch(`/api/surveys/${id}/close`, { method: "POST" }),
  deleteSurvey: (id) => apiFetch(`/api/surveys/${id}`, { method: "DELETE" }),
  getSurvey: (id, surveyAccessToken) =>
    apiFetch(`/api/surveys/${id}`, {
      headers: surveyAccessToken ? { "X-Survey-Access-Token": surveyAccessToken } : {},
    }),
  saveVotes: (id, payload, surveyAccessToken) =>
    apiFetch(`/api/surveys/${id}/votes`, {
      method: "POST",
      body: payload,
      headers: surveyAccessToken ? { "X-Survey-Access-Token": surveyAccessToken } : {},
    }),
  completeSurvey: (id, surveyAccessToken) =>
    apiFetch(`/api/surveys/${id}/complete-participation`, {
      method: "POST",
      headers: surveyAccessToken ? { "X-Survey-Access-Token": surveyAccessToken } : {},
    }),
  verifyPassword: (id, payload) =>
    apiFetch(`/api/surveys/${id}/verify-password`, { method: "POST", body: payload }),
  getResults: (id) => apiFetch(`/api/surveys/${id}/results`),
    downloadResultsCsv: async (id, fallbackName = "results.csv") => {
    const headers = {};
    const access = tokenStore.getAccess();
    if (access) headers.Authorization = `Bearer ${access}`;

    const res = await fetch(`/api/surveys/${id}/export`, { headers });
    if (!res.ok) {
      let message = `Ошибка ${res.status}`;
      try {
        const data = await res.json();
        message = data?.message || data?.error?.message || message;
      } catch {
        /* ignore */
      }
      throw new ApiError(message, res.status, null);
    }

    const blob = await res.blob();
    // Попытаемся достать имя файла из Content-Disposition
    let filename = fallbackName;
    const cd = res.headers.get("Content-Disposition") || "";
    const m = cd.match(/filename="?([^"]+)"?/i);
    if (m && m[1]) filename = m[1];

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
