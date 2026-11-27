"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Cover, Loading, NeedLogin } from "@/src/components/ui";
import { PUB_LABEL, STATUS_LABEL, timeAgo } from "@/src/lib/utils";

type AuthorNovel = {
  id: string;
  slug: string;
  title: string;
  cover_url: string | null;
  status: string;
  publication_status: string;
  updated_at: string;
};

export default function WriteHomePage() {
  const { profile, loading: authLoading } = useAuth();
  const [novels, setNovels] = useState<AuthorNovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!profile) { setLoading(false); return; }
    let active = true;
    setLoading(true); setError("");
    supabase.from("novels")
      .select("id,slug,title,cover_url,status,publication_status,updated_at")
      .eq("author_id", profile.id)
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .then(({ data, error: queryError }) => {
        if (!active) return;
        if (queryError) setError(queryError.message);
        setNovels(data || []); setLoading(false);
      });
    return () => { active = false; };
  }, [profile, authLoading]);

  if (authLoading || loading) return <Loading />;
  if (!profile) return <NeedLogin text="Masuk dulu untuk melihat karya dan mulai menulis." />;

  return <div className="stack">
    <div className="row between">
      <div><h1>Karya saya</h1><p className="muted">Kelola novel dan bab yang Anda tulis.</p></div>
      <Link href="/write/new" className="btn btn-primary">+ Novel baru</Link>
    </div>
    {error && <div className="alert alert-error" role="alert">Gagal memuat daftar karya: {error}</div>}
    {novels.length === 0 && !error ? <div className="card empty">
      <h2>Belum ada karya</h2>
      <p>Mulai dengan membuat novel. Setelah disimpan, Anda bisa menambahkan bab dari halaman pengaturan novel.</p>
      <Link href="/write/new" className="btn btn-primary">Buat novel pertama</Link>
    </div> : <div className="writer-list">
      {novels.map((novel) => <article className="card writer-item" key={novel.id}>
        <Cover novel={novel} size="sm" />
        <div className="writer-item-main">
          <h2>{novel.title}</h2>
          <div className="row writer-meta">
            <span className={`badge ${novel.status === "published" ? "green" : novel.status === "suspended" ? "red" : "amber"}`}>{STATUS_LABEL[novel.status] || novel.status}</span>
            <span className="badge gray">{PUB_LABEL[novel.publication_status] || novel.publication_status}</span>
            <span className="small muted">Diubah {timeAgo(novel.updated_at)}</span>
          </div>
        </div>
        <div className="row writer-actions">
          <Link href={`/write/${novel.id}`} className="btn btn-secondary btn-sm">Kelola novel & bab</Link>
          {novel.status === "published" && <Link href={`/novel/${novel.slug}`} className="btn btn-ghost btn-sm">Lihat halaman</Link>}
        </div>
      </article>)}
    </div>}
  </div>;
}
