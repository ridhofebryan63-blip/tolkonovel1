"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Cover, Empty, Loading, NovelCard } from "@/src/components/ui";

const SORTS: [string, string][] = [["new", "Terbaru"], ["popular", "Terpopuler"], ["rating", "Rating tertinggi"]];

export default function Home() {
  const { profile } = useAuth();
  const [novels, setNovels] = useState<any[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("new");
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [resume, setResume] = useState<any>(null);

  useEffect(() => { supabase.from("genres").select("id,name").order("name").then(({ data }) => setGenres(data || [])); }, []);

  useEffect(() => {
    if (!profile) { setResume(null); return; }
    supabase.from("reading_progress").select("chapter_id,scroll_position,novels(title,slug,cover_url),chapters(title,chapter_number)")
      .order("last_read_at", { ascending: false }).limit(1).maybeSingle().then(({ data }) => setResume(data));
  }, [profile]);

  useEffect(() => {
    setLoading(true);
    setLoadError("");
    const emb = genre ? "novel_genres!inner(genre_id,genres(name))" : "novel_genres(genres(name))";
    let query = supabase.from("novels")
      .select(`id,slug,title,cover_url,publication_status,views_count,rating_average,rating_count,author:profiles!novels_author_id_fkey(username,full_name),${emb}`)
      .eq("status", "published").is("deleted_at", null).limit(48);
    if (term) query = query.ilike("title", `%${term.replace(/[%_]/g, "")}%`);
    if (genre) query = query.eq("novel_genres.genre_id", genre);
    query = sort === "popular" ? query.order("views_count", { ascending: false }) : sort === "rating" ? query.order("rating_average", { ascending: false }).order("rating_count", { ascending: false }) : query.order("created_at", { ascending: false });
    query.then(({ data, error }) => { setNovels(data || []); setLoadError(error?.message || ""); setLoading(false); });
  }, [genre, sort, term]);

  return (
    <div className="stack">
      <section className="hero">
        <h1>Baca cerita favoritmu. Tulis ceritamu sendiri.</h1>
        <p>Ribuan bab dari penulis Indonesia, gratis dibaca di HP maupun laptop.</p>
        <form className="search" onSubmit={(e) => { e.preventDefault(); setTerm(q.trim()); }} role="search">
          <input className="input" placeholder="Cari judul novel…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari judul novel" />
          <button className="btn btn-secondary" type="submit">Cari</button>
        </form>
      </section>

      {resume?.novels && (
        <Link href={`/read/${resume.chapter_id}`} className="card continue">
          <Cover novel={resume.novels} size="sm" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="small muted" style={{ margin: 0 }}>Lanjutkan membaca</p>
            <b>{resume.novels.title}</b>
            <p className="small muted" style={{ margin: 0 }}>Bab {Number(resume.chapters?.chapter_number)} — {resume.chapters?.title} ({Math.round(resume.scroll_position)}%)</p>
          </div>
          <span className="btn btn-primary btn-sm">Lanjut</span>
        </Link>
      )}

      <div>
        <div className="chips" role="tablist" aria-label="Genre">
          <button className={`chip ${genre === "" ? "on" : ""}`} onClick={() => setGenre("")}>Semua</button>
          {genres.map((g) => <button key={g.id} className={`chip ${genre === g.id ? "on" : ""}`} onClick={() => setGenre(g.id)}>{g.name}</button>)}
        </div>
        <div className="row between" style={{ margin: "8px 0 12px" }}>
          <h2 style={{ margin: 0 }}>{term ? `Hasil untuk “${term}”` : "Novel"}</h2>
          <select className="input" style={{ width: "auto" }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Urutkan">
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        {loading ? <Loading /> : loadError ? (
          <div className="alert alert-error" role="alert">Gagal memuat novel: {loadError}. Muat ulang halaman atau periksa koneksi Supabase.</div>
        ) : novels.length === 0 ? (
          <Empty><p>Belum ada novel yang cocok.</p><Link href="/write" className="btn btn-primary">Jadi penulis pertama</Link></Empty>
        ) : <div className="grid-novels">{novels.map((n) => <NovelCard key={n.id} novel={n} />)}</div>}
      </div>
    </div>
  );
}
