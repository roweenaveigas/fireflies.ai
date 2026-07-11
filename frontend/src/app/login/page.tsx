"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { DEMO_LOGIN } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, ready } = useAuth();
  const [email, setEmail] = useState<string>(DEMO_LOGIN.email);
  const [password, setPassword] = useState<string>(DEMO_LOGIN.password);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) router.replace("/home");
  }, [ready, isAuthenticated, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Enter email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
      router.push("/home");
    } catch {
      setError("Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07041A] px-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(108,92,231,0.35),_transparent_55%)]"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#12101F] p-6 shadow-2xl sm:p-8">
        <Link href="/" className="inline-flex items-center gap-2">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M7 3.5C7 2.67 7.67 2 8.5 2H12v6.5c0 .83-.67 1.5-1.5 1.5H7V3.5Z" fill="#A78BFA" />
            <path d="M12 2h3.5C16.33 2 17 2.67 17 3.5V8H13.5C12.67 8 12 7.33 12 6.5V2Z" fill="#7C3AED" />
            <path d="M7 10h5v5.5c0 .83-.67 1.5-1.5 1.5H8.5C7.67 17 7 16.33 7 15.5V10Z" fill="#8B5CF6" />
            <path d="M12 10h5v4.5c0 .83-.67 1.5-1.5 1.5H12V10Z" fill="#6C5CE7" />
          </svg>
          <span className="text-[16px] font-semibold text-white">fireflies.ai</span>
        </Link>

        <h1 className="mt-6 text-2xl font-semibold text-white">Log in</h1>
        <p className="mt-1 text-sm text-white/60">
          Welcome back — continue to your meetings workspace.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/70">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0B0916] px-3 py-2.5 text-sm text-white outline-none focus:border-[#6C5CE7]"
              autoComplete="email"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/70">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-white/15 bg-[#0B0916] px-3 py-2.5 text-sm text-white outline-none focus:border-[#6C5CE7]"
              autoComplete="current-password"
            />
          </label>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#6C5CE7] py-2.5 text-sm font-semibold text-white hover:bg-[#5B4CDB] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/55">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-[#A78BFA] hover:text-white">
            Sign up
          </Link>
        </p>
        <div className="mt-4 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-[11px] text-white/55">
          <p className="font-semibold text-white/80">Demo account (full meeting library)</p>
          <p className="mt-1">Email: {DEMO_LOGIN.email}</p>
          <p>Password: {DEMO_LOGIN.password}</p>
        </div>
      </div>
    </div>
  );
}
