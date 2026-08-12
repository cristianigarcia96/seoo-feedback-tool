// Agency sign-in / sign-up. Basic email + password against Supabase Auth. The
// client (no-login) side never sees this — it uses the share link.

import { useState, type FormEvent } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";

type Mode = "signin" | "signup";

export function LoginPage() {
  const { user, authEnabled, signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? "/";

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Already signed in (or demo mode) — nothing to do here.
  if (user || !authEnabled) return <Navigate to={from} replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === "signin") {
        await signIn(email, password);
        navigate(from, { replace: true });
      } else {
        const { needsConfirmation } = await signUp(email, password);
        if (needsConfirmation) {
          setNotice("Account created. Check your email to confirm, then sign in.");
          setMode("signin");
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-[11px] uppercase tracking-[0.15em] text-[#B45532] font-semibold mb-1">
          SEO Feedback
        </div>
        <h1 className="font-serif text-2xl text-stone-800 mb-6">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-[12px] font-medium text-stone-500">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium text-stone-500">Password</span>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-stone-500 focus:outline-none"
            />
          </label>

          {error && <p className="text-red-600 text-[13px]">{error}</p>}
          {notice && <p className="text-emerald-700 text-[13px]">{notice}</p>}

          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md bg-stone-800 text-white text-sm font-medium py-2.5 hover:bg-stone-900 disabled:opacity-50 transition-colors"
          >
            {busy ? "…" : mode === "signin" ? "Sign in" : "Sign up"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setNotice(null);
          }}
          className="mt-4 text-[13px] text-stone-500 hover:text-stone-800"
        >
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}
