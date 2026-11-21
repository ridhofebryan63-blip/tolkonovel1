"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Loading } from "@/src/components/ui";
import { timeAgo } from "@/src/lib/utils";
export default function NotificationsPage() {
  const { profile, loading } = useAuth(); const [items, setItems] = useState<any[]>([]); const [busy, setBusy] = useState(true);
  useEffect(() => { if (!profile) { setBusy(false); return; } supabase.from("notifications").select("*,novels(title,slug),chapters(title)").eq("user_id", profile.id).order("created_at", { ascending: false }).limit(100).then(({ data }) => { setItems(data || []); setBusy(false); }); }, [profile]);
  async function markRead(item: any) { if (!item.read_at) { await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", item.id); setItems(items.map((x) => x.id === item.id ? { ...x, read_at: new Date().toISOString() } : x)); } }
  if (loading || busy) return <Loading />; if (!profile) return <div className="empty"><p>Masuk untuk melihat notifikasi.</p><Link href="/login" className="btn btn-primary">Masuk</Link></div>;
  return <div className="card"><h1>Notifikasi</h1>{items.length === 0 && <p className="muted">Belum ada notifikasi.</p>}{items.map((item) => <div className="comment" key={item.id}><div className="meta"><b>{item.kind === "new_chapter" ? "Bab baru terbit" : item.kind}</b><span>{timeAgo(item.created_at)}</span>{!item.read_at && <span className="badge">Baru</span>}</div><Link onClick={() => markRead(item)} href={item.chapters ? `/read/${item.chapter_id}` : item.novels ? `/novel/${item.novels.slug}` : "/"}>{item.chapters?.title || item.novels?.title || "Lihat pembaruan"}</Link></div>)}</div>;
}
