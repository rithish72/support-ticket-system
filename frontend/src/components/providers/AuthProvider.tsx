"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import api, { AUTH_EXPIRED_EVENT } from "@/lib/api";
import type { User, UserRole } from "@/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const homeFor = (role: UserRole) => (role === "admin" ? "/admin" : "/dashboard");

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // The API replies { data: { user } } — the previous dashboard stored the wrapper object by mistake.
  const fetchMe = useCallback(async (): Promise<User | null> => {
    try {
      const res = await api.get("/auth/me");
      const me = res.data.data.user as User;
      setUser(me);
      return me;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    void fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, onExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, onExpired);
  }, []);

  const startSession = useCallback(
    async (path: string, body: Record<string, string>) => {
      await api.post(path, body);
      const me = await fetchMe();
      if (!me) throw new Error("Signed in, but the session cookie was blocked. Allow cookies for this site and try again.");
      return me;
    },
    [fetchMe],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      login: (email, password) => startSession("/auth/login", { email, password }),
      register: (name, email, password) => startSession("/auth/register", { name, email, password }),
      logout: async () => {
        try {
          await api.post("/auth/logout");
        } finally {
          setUser(null);
        }
      },
    }),
    [user, loading, startSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
