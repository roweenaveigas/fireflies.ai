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
import { getAuthToken, setAuthToken } from "@/lib/api";
import {
  fetchMe,
  loginRequest,
  logoutRequest,
  signupRequest,
  type AuthUser,
} from "@/lib/auth";
import { useProfile } from "@/components/profile/ProfileProvider";

type AuthContextValue = {
  isAuthenticated: boolean;
  ready: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { updateProfile } = useProfile();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = getAuthToken();
      if (!token) {
        if (!cancelled) {
          setUser(null);
          setReady(true);
        }
        return;
      }
      try {
        const me = await fetchMe();
        if (!cancelled) {
          setUser(me);
          updateProfile({ name: me.name, email: me.email });
        }
      } catch {
        setAuthToken(null);
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const data = await loginRequest(email, password);
      setUser(data.user);
      updateProfile({ name: data.user.name, email: data.user.email });
    },
    [updateProfile]
  );

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const data = await signupRequest(name, email, password);
      setUser(data.user);
      updateProfile({ name: data.user.name, email: data.user.email });
    },
    [updateProfile]
  );

  const logout = useCallback(async () => {
    await logoutRequest();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      ready,
      user,
      login,
      signup,
      logout,
    }),
    [user, ready, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
