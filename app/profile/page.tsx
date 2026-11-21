"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Loading } from "@/src/components/ui";
import { errMsg } from "@/src/lib/utils";
export default function ProfilePage() {
  const { profile, loading } = useAuth(); const [fullName, setFullName] = useState(""); const [bio, setBio] = useState(""); const [message, setMessage] = useState(""); const [saving, setSaving] = useState(false);
  useEffect(() => { setFullName(profile?.full_name || ""); if (!profile) return; supabase.from("profiles").select("author_bio").eq("id", profile.id).maybeSingle().then(({ data }) => setBio(data?.author_bio || "")); }, [profile]);
  async function save(e: React.FormEvent) { e.preventDefault(); if (!profile) return; setSaving(true); const { error } = await supabase.from("profiles").update({ full_name: fullName.trim() || null, author_bio: bio.trim() || null }).eq("id", profile.id); setSaving(false); setMessage(error ? errMsg(error) : "Profil tersimpan. Muat ulang halaman untuk memperbarui nama di navigasi."); }
  if (loading) return <Loading />; if (!profile) return <div className="empty"><p>Masuk untuk mengelola profil.</p><Link href="/login" className="btn btn-primary">Masuk</Link></div>;
  return <div className="card" style={{ maxWidth: 700, margin: "0 auto" }}><h1>Profil</h1><p className="muted">@{profile.username}</p><form onSubmit={save}><div className="field"><label htmlFor="fullname">Nama tampilan</label><input id="fullname" className="input" maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} /></div><div className="field"><label htmlFor="bio">Bio penulis</label><textarea id="bio" className="input" rows={5} maxLength={2000} value={bio} onChange={(e) => setBio(e.target.value)} /></div>{message && <div className="alert alert-warn" role="status">{message}</div>}<button className="btn btn-primary" disabled={saving}>{saving ? "Menyimpan…" : "Simpan profil"}</button></form><div className="row" style={{ marginTop: 18 }}><Link href="/library" className="btn btn-secondary">Rak saya</Link><Link href="/notifications" className="btn btn-secondary">Notifikasi</Link>{profile.role === "admin" && <Link href="/admin" className="btn btn-secondary">Panel admin</Link>}</div></div>;
}
