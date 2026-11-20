// survey-frontend/src/context/AuthContext.jsx
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, tokenStore } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // При загрузке приложения пытаемся восстановить сессию по refresh-токену.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!tokenStore.getRefresh()) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: tokenStore.getRefresh() }),
        });
        if (res.ok) {
          const data = await res.json();
          tokenStore.set(data);
          if (!cancelled) setUser(data.user);
        } else {
          tokenStore.clear();
        }
      } catch {
        tokenStore.clear();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.login({ email, password });
    tokenStore.set(data);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ nickname, email, password }) => {
    const data = await api.register({ nickname, email, password });
    tokenStore.set(data);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* игнорируем ошибки сети при выходе */
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAuthenticated: Boolean(user), login, register, logout }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
