"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, isSupabaseConfigured } from "@/src/lib/supabase";
import { errMsg } from "@/src/lib/utils";
export default function LoginPage() {
  const router = useRouter(); const [mode, setMode] = useState<"login" | "signup">("login"); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [username, setUsername] = useState(""); const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) { e.preventDefault(); setBusy(true); setMessage("");
    if (mode === "login") { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) setMessage(errMsg(error)); else router.replace("/"); }
    else { const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username: username.trim(), full_name: username.trim() } } }); if (error) setMessage(errMsg(error)); else if (!data.session) setMessage("Pendaftaran berhasil. Periksa email untuk konfirmasi."); else router.replace("/"); }
    setBusy(false);
  }
  return <div className="card" style={{ maxWidth: 460, margin: "20px auto" }}><h1>{mode === "login" ? "Masuk" : "Buat akun"}</h1>{!isSupabaseConfigured && <div className="alert alert-warn">Atur koneksi Supabase di <code>.env.local</code> terlebih dahulu.</div>}<form onSubmit={submit}><div className="field"><label htmlFor="email">Email</label><input className="input" id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>{mode === "signup" && <div className="field"><label htmlFor="username">Nama pengguna</label><input className="input" id="username" minLength={3} maxLength={30} pattern="[A-Za-z0-9_]+" required value={username} onChange={(e) => setUsername(e.target.value)} /></div>}<div className="field"><label htmlFor="password">Kata sandi</label><input className="input" id="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} required value={password} onChange={(e) => setPassword(e.target.value)} /></div>{message && <div className="alert alert-warn" role="status">{message}</div>}<button className="btn btn-primary block" disabled={busy || !isSupabaseConfigured}>{busy ? "Memproses…" : mode === "login" ? "Masuk" : "Daftar"}</button></form><p className="small center" style={{ marginTop: 16 }}>{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"} <button className="linkbtn" onClick={() => { setMode(mode === "login" ? "signup" : "login"); setMessage(""); }}>{mode === "login" ? "Daftar" : "Masuk"}</button></p><p className="small center"><Link href="/">Kembali ke beranda</Link></p></div>;
}
