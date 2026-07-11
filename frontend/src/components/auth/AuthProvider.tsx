"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "ff-auth";

type AuthContextValue = {
  isAuthenticated: boolean;
  ready: boolean;
  login: (email: string, password: string) => void;
  signup: (name: string, email: string, password: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setIsAuthenticated(raw === "1");
    } catch {
      setIsAuthenticated(false);
    }
    setReady(true);
  }, []);

  const login = useCallback((_email: string, _password: string) => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsAuthenticated(true);
  }, []);

  const signup = useCallback((_name: string, _email: string, _password: string) => {
    localStorage.setItem(STORAGE_KEY, "1");
    setIsAuthenticated(true);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setIsAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, ready, login, signup, logout }),
    [isAuthenticated, ready, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
