// Auth context for the SEO (agency) side. Wraps Supabase Auth and exposes a
// tiny surface: the current user, loading state, and sign in/up/out.
//
// Demo mode (no Supabase configured) has no real auth — the provider hands back
// a synthetic "demo" user so the editor/dashboard stay usable without a login.
// The share view never uses this; it reads through the anon RPC.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, useSupabase } from "./supabase";

interface AuthState {
  user: User | null;
  /** True until the initial session check resolves. */
  loading: boolean;
  /** False in demo mode — callers can skip the login gate entirely. */
  authEnabled: boolean;
  signIn(email: string, password: string): Promise<void>;
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Stand-in user for demo mode so `user` is never null when auth is off.
const DEMO_USER = { id: "demo-user", email: "demo@local" } as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(useSupabase ? null : DEMO_USER);
  const [loading, setLoading] = useState(useSupabase);

  useEffect(() => {
    if (!useSupabase) return;
    const db = getSupabase();
    let active = true;

    db.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: sub } = db.auth.onAuthStateChange((_event, session: Session | null) => {
      setUser(session?.user ?? null);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      authEnabled: useSupabase,
      async signIn(email, password) {
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) throw error;
      },
      async signUp(email, password) {
        const { data, error } = await getSupabase().auth.signUp({ email, password });
        if (error) throw error;
        // With email confirmation on, no session is returned until the user
        // confirms. With it off, `session` is populated and they're logged in.
        return { needsConfirmation: !data.session };
      },
      async signOut() {
        await getSupabase().auth.signOut();
      },
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
