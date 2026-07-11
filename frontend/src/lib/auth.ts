import api, { setAuthToken } from "@/lib/api";

export type AuthUser = {
  id: number;
  name: string;
  email: string;
  meeting_count: number;
};

export type AuthResponse = {
  token: string;
  user: AuthUser;
};

export async function loginRequest(
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/login", {
    email,
    password,
  });
  setAuthToken(data.token);
  return data;
}

export async function signupRequest(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/api/auth/signup", {
    name,
    email,
    password,
  });
  setAuthToken(data.token);
  return data;
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>("/api/auth/me");
  return data;
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post("/api/auth/logout");
  } catch {
    /* ignore */
  } finally {
    setAuthToken(null);
  }
}

export const DEMO_LOGIN = {
  name: "Maya Rivera",
  email: "maya.rivera@acme.io",
  password: "Demo@1234",
} as const;
