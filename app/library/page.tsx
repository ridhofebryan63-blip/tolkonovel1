"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Cover, Loading } from "@/src/components/ui";
import { LIB_LABEL } from "@/src/lib/utils";
export default function LibraryPage() {
  const { profile, loading } = useAuth(); const [items, setItems] = useState<any[]>([]); const [busy, setBusy] = useState(true);
  useEffect(() => { if (!profile) { setBusy(false); return; } supabase.from("libraries").select("category,created_at,novels(id,title,slug,cover_url,author:profiles(username,full_name))").eq("user_id", profile.id).order("created_at", { ascending: false }).then(({ data }) => { setItems(data || []); setBusy(false); }); }, [profile]);
  if (loading || busy) return <Loading />; if (!profile) return <div className="empty"><p>Masuk untuk melihat rak.</p><Link href="/login" className="btn btn-primary">Masuk</Link></div>;
  return <div><h1>Rak bacaan</h1>{items.length ? <div className="grid-novels">{items.map((item) => <Link className="novel-card" key={item.novels.id} href={`/novel/${item.novels.slug}`}><Cover novel={item.novels} /><span className="badge">{LIB_LABEL[item.category]}</span><h3>{item.novels.title}</h3><p className="small muted">oleh {item.novels.author?.full_name || item.novels.author?.username}</p></Link>)}</div> : <div className="empty"><p>Rakmu masih kosong. Simpan novel yang ingin dibaca.</p><Link href="/" className="btn btn-primary">Cari novel</Link></div>}</div>;
}
