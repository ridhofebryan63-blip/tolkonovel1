"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/src/lib/supabase";

type Profile = { id: string; username: string; full_name: string | null; role: string };
type AuthValue = { user: User | null; profile: Profile | null; loading: boolean };
const AuthContext = createContext<AuthValue>({ user: null, profile: null, loading: true });
export function useAuth() { return useContext(AuthContext); }

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!isSupabaseConfigured) { setLoading(false); return; }
    let alive = true;
    const load = async (nextUser: User | null) => {
      setUser(nextUser);
      if (!nextUser) { setProfile(null); setLoading(false); return; }
      const { data } = await supabase.from("profiles").select("id,username,full_name,role").eq("id", nextUser.id).maybeSingle();
      if (alive) { setProfile(data); setLoading(false); }
    };
    supabase.auth.getSession().then(({ data }) => load(data.session?.user || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => { void load(session?.user || null); });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);
  return <AuthContext.Provider value={{ user, profile, loading }}>{children}{!isSupabaseConfigured && <div className="config-banner" role="status">Supabase belum diatur. Isi <code>.env.local</code> untuk mengaktifkan login dan data.</div>}</AuthContext.Provider>;
}

export function NeedLogin({ text = "Masuk dulu untuk melanjutkan." }: { text?: string }) {
  const { profile, loading } = useAuth();
  if (loading) return <div className="empty">Memuat…</div>;
  if (profile) return null;
  return <div className="empty"><p>{text}</p><Link href="/login" className="btn btn-primary">Masuk atau daftar</Link></div>;
}
