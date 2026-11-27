"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/src/lib/supabase";
import { errMsg } from "@/src/lib/utils";

type Mode = "login" | "signup";
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMessage("");
    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      setBusy(false);
      if (error) return setMessage(errMsg(error));
      router.replace("/"); router.refresh(); return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(), password,
      options: { data: { username: username.trim(), full_name: username.trim() } },
    });
    setBusy(false);
    if (error) return setMessage(errMsg(error));
    if (!data.session) return setMessage("Akun dibuat, tetapi email masih perlu dikonfirmasi. Untuk pendaftaran tanpa email, matikan Confirm email di pengaturan Supabase lalu coba lagi.");
    router.replace("/"); router.refresh();
  }

  async function signInWithGoogle() {
    setBusy(true); setMessage("");
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
    if (error) { setBusy(false); setMessage(errMsg(error)); }
  }

  return <div className="card auth-card">
    <h1>{mode === "login" ? "Masuk" : "Buat akun"}</h1>
    {!isSupabaseConfigured && <div className="alert alert-warn">Atur koneksi Supabase di <code>.env.local</code> terlebih dahulu.</div>}
    <button type="button" className="btn btn-secondary block google-btn" disabled={busy || !isSupabaseConfigured} onClick={signInWithGoogle}><GoogleMark /> Lanjut dengan Google</button>
    <div className="auth-divider"><span>atau gunakan email</span></div>
    <form onSubmit={submit}>
      <div className="field"><label htmlFor="email">Email</label><input className="input" id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      {mode === "signup" && <div className="field"><label htmlFor="username">Nama pengguna</label><input className="input" id="username" minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" required value={username} onChange={(e) => setUsername(e.target.value)} /><p className="hint">Gunakan 3–30 huruf, angka, atau garis bawah.</p></div>}
      <div className="field"><label htmlFor="password">Kata sandi</label><input className="input" id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /><p className="hint">Minimal 8 karakter.</p></div>
      {message && <div className="alert alert-warn" role="status">{message}</div>}
      <button className="btn btn-primary block" disabled={busy || !isSupabaseConfigured}>{busy ? "Memproses…" : mode === "login" ? "Masuk dengan email" : "Daftar dengan email"}</button>
    </form>
    <p className="small center" style={{ marginTop: 16 }}>{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"} <button className="linkbtn" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Daftar" : "Masuk"}</button></p>
    <p className="small center"><Link href="/">Kembali ke beranda</Link></p>
  </div>;
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" width="20" height="20"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.72 9.5 24 9.5Z" transform="translate(0 5)"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.82 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.17 2.3-6.28 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}
