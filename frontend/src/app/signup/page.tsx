"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "@/components/auth/AuthProvider";

export default function SignupPage() {
  const router = useRouter();
  const { signup, isAuthenticated, ready } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && isAuthenticated) router.replace("/home");
  }, [ready, isAuthenticated, router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.trim().length < 6) {
      setError("Fill in name, email, and a password (6+ characters).");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await signup(name.trim(), email.trim(), password);
      router.push("/home");
    } catch {
      setError("Could not create account. Email may already be registered.");
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

        <h1 className="mt-6 text-2xl font-semibold text-white">Get started</h1>
        <p className="mt-1 text-sm text-white/60">
          Create your account. New accounts start empty — use the demo login for the full sample library.
        </p>

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/70">Full name</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-lg border border-white/15 bg-[#0B0916] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#6C5CE7]"
              autoComplete="name"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/70">Work email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-white/15 bg-[#0B0916] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#6C5CE7]"
              autoComplete="email"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-white/70">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              className="w-full rounded-lg border border-white/15 bg-[#0B0916] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#6C5CE7]"
              autoComplete="new-password"
            />
          </label>
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#6C5CE7] py-2.5 text-sm font-semibold text-white hover:bg-[#5B4CDB] disabled:opacity-60"
          >
            {loading ? "Creating…" : "Sign up"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-white/55">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#A78BFA] hover:text-white">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
