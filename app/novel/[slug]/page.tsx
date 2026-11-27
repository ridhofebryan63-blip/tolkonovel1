"use client";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Cover, Loading, Stars } from "@/src/components/ui";
import Comments from "@/src/components/Comments";
import ReportButton from "@/src/components/ReportButton";
import { AGE_LABEL, errMsg, fmt, LIB_LABEL, PUB_LABEL, STATUS_LABEL, timeAgo } from "@/src/lib/utils";

export default function NovelPage() {
  const { slug } = useParams<{ slug: string }>();
  const { profile } = useAuth();
  const [novel, setNovel] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [lib, setLib] = useState<string>("");
  const [myRating, setMyRating] = useState<any>(null);
  const [stars, setStars] = useState(0);
  const [review, setReview] = useState("");
  const [following, setFollowing] = useState(false);
  const [progress, setProgress] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data: n } = await supabase.from("novels")
      .select("*, author:profiles!novels_author_id_fkey(id,username,full_name,author_bio), novel_genres(genres(id,name))").eq("slug", slug).is("deleted_at", null).maybeSingle();
    setNovel(n);
    if (n) {
      const [c, r] = await Promise.all([
        supabase.from("chapters").select("id,chapter_number,title,word_count,published_at,status").eq("novel_id", n.id).is("deleted_at", null).order("chapter_number"),
        supabase.from("ratings").select("id,user_id,rating,review_content,created_at,author:profiles(username,full_name)").eq("novel_id", n.id).order("created_at", { ascending: false }).limit(30),
      ]);
      setChapters(c.data || []); setReviews(r.data || []);
    }
    setLoading(false);
  }, [slug]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!profile || !novel) return;
    supabase.from("libraries").select("category").eq("novel_id", novel.id).eq("user_id", profile.id).maybeSingle().then(({ data }) => setLib(data?.category || ""));
    supabase.from("ratings").select("*").eq("novel_id", novel.id).eq("user_id", profile.id).maybeSingle().then(({ data }) => { setMyRating(data); setStars(data?.rating || 0); setReview(data?.review_content || ""); });
    supabase.from("follows").select("follower_id").eq("follower_id", profile.id).eq("following_id", novel.author.id).maybeSingle().then(({ data }) => setFollowing(!!data));
    supabase.from("reading_progress").select("chapter_id,scroll_position").eq("novel_id", novel.id).eq("user_id", profile.id).maybeSingle().then(({ data }) => setProgress(data));
  }, [profile, novel]);

  async function setLibrary(cat: string) {
    setMsg("");
    if (!cat) { await supabase.from("libraries").delete().eq("novel_id", novel.id).eq("user_id", profile.id); setLib(""); }
    else {
      const { error } = lib
        ? await supabase.from("libraries").update({ category: cat }).eq("novel_id", novel.id).eq("user_id", profile.id)
        : await supabase.from("libraries").insert({ user_id: profile.id, novel_id: novel.id, category: cat });
      if (error) return setMsg(errMsg(error));
      setLib(cat);
    }
    load();
  }
  async function saveRating() {
    setMsg("");
    const row = { rating: stars, review_content: review.trim() || null };
    const { error } = myRating
      ? await supabase.from("ratings").update(row).eq("id", myRating.id)
      : await supabase.from("ratings").insert({ ...row, user_id: profile.id, novel_id: novel.id });
    if (error) return setMsg(errMsg(error));
    setMsg("Rating tersimpan."); load();
    supabase.from("ratings").select("*").eq("novel_id", novel.id).eq("user_id", profile.id).maybeSingle().then(({ data }) => setMyRating(data));
  }
  async function toggleFollow() {
    if (following) await supabase.from("follows").delete().eq("follower_id", profile.id).eq("following_id", novel.author.id);
    else await supabase.from("follows").insert({ follower_id: profile.id, following_id: novel.author.id });
    setFollowing(!following);
  }

  if (loading) return <Loading />;
  if (!novel) return <div className="empty"><p>Novel tidak ditemukan atau belum diterbitkan.</p><Link href="/" className="btn btn-primary">Ke beranda</Link></div>;

  const isOwner = profile?.id === novel.author_id;
  const visibleChapters = novel.status === "published" ? chapters.filter((c) => c.status === "published") : isOwner ? chapters : [];
  const firstId = visibleChapters.find((c) => c.status === "published")?.id;
  const readHref = progress ? `/read/${progress.chapter_id}` : firstId ? `/read/${firstId}` : null;

  return (
    <div className="stack">
      <div className="card detail">
        <Cover novel={novel} size="lg" />
        <div style={{ flex: 1 }}>
          <h1>{novel.title}</h1>
          <p className="muted">oleh <Link href={`/author/${novel.author.username}`} style={{ color: "var(--color-primary)", fontWeight: 600 }}>{novel.author.full_name || novel.author.username}</Link></p>
          <div className="row" style={{ gap: 8, marginBottom: 10 }}>
            {novel.status !== "published" && <span className="badge amber">{STATUS_LABEL[novel.status]}</span>}
            <span className="badge green">{PUB_LABEL[novel.publication_status]}</span>
            <span className="badge gray">{AGE_LABEL[novel.age_rating]}</span>
            {novel.novel_genres.map((g: any) => <span key={g.genres.id} className="badge">{g.genres.name}</span>)}
          </div>
          <p className="row" style={{ gap: 16 }}>
            {novel.rating_count > 0 ? <span><Stars value={novel.rating_average} /> <span className="muted small">({novel.rating_count})</span></span> : <span className="muted">Belum ada rating</span>}
            <span className="muted">👁 {fmt(novel.views_count)}</span><span className="muted">❤ {fmt(novel.favorites_count)}</span>
          </p>
          <div className="row">
            {readHref ? <Link href={readHref} className="btn btn-primary">{progress ? "Lanjut baca" : "Mulai baca"}</Link> : <span className="muted">Belum ada bab terbit.</span>}
            {isOwner && <Link href={`/write/${novel.id}`} className="btn btn-secondary">Kelola novel</Link>}
            {profile ? (
              <select className="input" style={{ width: "auto" }} value={lib} onChange={(e) => setLibrary(e.target.value)} aria-label="Simpan ke rak">
                <option value="">＋ Simpan ke rak</option>{Object.entries(LIB_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            ) : <Link href="/login" className="btn btn-secondary">Masuk untuk menyimpan</Link>}
          </div>
          {msg && <div className="alert alert-warn" role="status">{msg}</div>}
        </div>
      </div>

      <div className="two-col">
        <div className="stack">
          <div className="card"><h2>Sinopsis</h2><p style={{ whiteSpace: "pre-wrap", marginBottom: 0 }}>{novel.synopsis}</p></div>

          <div className="card">
            <h2>Daftar bab ({visibleChapters.filter((c) => c.status === "published").length})</h2>
            {visibleChapters.length === 0 && <p className="muted">Belum ada bab.</p>}
            <div className="chapter-list">
              {visibleChapters.map((c) => (
                <Link key={c.id} href={c.status === "published" ? `/read/${c.id}` : `/write/${novel.id}/chapter/${c.id}`}>
                  <span>Bab {Number(c.chapter_number)}: {c.title} {c.status !== "published" && <span className="badge amber">{STATUS_LABEL[c.status] || c.status}</span>}</span>
                  <span className="muted small">{c.published_at ? timeAgo(c.published_at) : ""}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className="card"><Comments novelId={novel.id} chapterId={null} novelAuthorId={novel.author_id} /></div>
        </div>

        <div className="stack">
          <div className="card">
            <h2>Beri penilaian</h2>
            {!profile ? <p className="muted"><Link href="/login" style={{ color: "var(--color-primary)", fontWeight: 600 }}>Masuk</Link> untuk menilai.</p>
              : isOwner ? <p className="muted">Penulis tidak dapat menilai novelnya sendiri.</p> : (
                <>
                  <div className="star-pick" role="radiogroup" aria-label="Bintang">{[1, 2, 3, 4, 5].map((s) => <button key={s} className={s <= stars ? "on" : ""} onClick={() => setStars(s)} aria-label={`${s} bintang`} role="radio" aria-checked={s === stars}>★</button>)}</div>
                  <textarea className="input" rows={3} placeholder="Tulis ulasan (opsional)" value={review} onChange={(e) => setReview(e.target.value)} maxLength={3000} />
                  <button className="btn btn-primary block" style={{ marginTop: 8 }} disabled={!stars} onClick={saveRating}>{myRating ? "Perbarui" : "Kirim"} rating</button>
                </>
              )}
          </div>
          <div className="card">
            <h2>Ulasan pembaca</h2>
            {reviews.length === 0 && <p className="muted">Belum ada ulasan.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="comment">
                <div className="meta"><b>{r.author?.full_name || r.author?.username}</b><Stars value={r.rating} /></div>
                {r.review_content && <p>{r.review_content}</p>}
              </div>
            ))}
          </div>
          <div className="row" style={{ gap: 12 }}>
            {profile && !isOwner && <button className="btn btn-secondary btn-sm" onClick={toggleFollow}>{following ? "Berhenti mengikuti penulis" : "Ikuti penulis"}</button>}
            {profile && !isOwner && <ReportButton type="novel" targetId={novel.id} label="Laporkan novel" />}
          </div>
        </div>
      </div>
    </div>
  );
}
