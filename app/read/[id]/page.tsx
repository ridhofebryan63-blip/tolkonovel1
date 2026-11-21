"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Loading } from "@/src/components/ui";
import Comments from "@/src/components/Comments";
export default function ReadChapter() {
  const { id } = useParams<{ id: string }>(); const { profile } = useAuth(); const [chapter, setChapter] = useState<any>(null); const [settings, setSettings] = useState({ size: 18, theme: "light" }); const [progress, setProgress] = useState(0); const [loading, setLoading] = useState(true);
  useEffect(() => { const saved = localStorage.getItem("reader-settings"); if (saved) try { setSettings(JSON.parse(saved)); } catch {} }, []);
  useEffect(() => { supabase.from("chapters").select("*,novels(id,slug,title,author_id,status)").eq("id", id).is("deleted_at", null).maybeSingle().then(({ data }) => { setChapter(data); setLoading(false); }); }, [id]);
  const saveProgress = useCallback(() => { const max = document.documentElement.scrollHeight - window.innerHeight; const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 0; setProgress(pct); if (profile && chapter?.novel_id) void supabase.from("reading_progress").upsert({ user_id: profile.id, novel_id: chapter.novel_id, chapter_id: id, scroll_position: pct, last_read_at: new Date().toISOString() }, { onConflict: "user_id,novel_id" }); }, [profile, chapter, id]);
  useEffect(() => { if (!chapter) return; window.addEventListener("scroll", saveProgress, { passive: true }); return () => window.removeEventListener("scroll", saveProgress); }, [chapter, saveProgress]);
  if (loading) return <Loading />; if (!chapter || (chapter.status !== "published" && profile?.id !== chapter.novels?.author_id)) return <div className="empty"><p>Bab tidak ditemukan atau belum terbit.</p><Link href="/" className="btn btn-primary">Ke beranda</Link></div>;
  function change(patch: Partial<typeof settings>) { const next = { ...settings, ...patch }; setSettings(next); localStorage.setItem("reader-settings", JSON.stringify(next)); }
  return <article className="reader" data-theme={settings.theme}><div className="reader-progress" style={{ width: `${progress}%` }} /><div className="reader-bar"><Link className="btn btn-secondary btn-sm" href={`/novel/${chapter.novels.slug}`}>← Novel</Link><span className="small">Bab {chapter.chapter_number}</span><div className="row"><button className="btn btn-secondary btn-sm" onClick={() => change({ size: Math.max(14, settings.size - 1) })} aria-label="Perkecil huruf">A−</button><button className="btn btn-secondary btn-sm" onClick={() => change({ size: Math.min(30, settings.size + 1) })} aria-label="Perbesar huruf">A+</button><select className="input" style={{ width: 110 }} aria-label="Tema baca" value={settings.theme} onChange={(e) => change({ theme: e.target.value })}><option value="light">Terang</option><option value="sepia">Sepia</option><option value="dark">Gelap</option></select></div></div><div className="reader-text" style={{ fontSize: settings.size }}><p className="small muted center">{chapter.novels.title}</p><h1>{chapter.title}</h1>{chapter.content.split(/\n+/).filter(Boolean).map((p: string, i: number) => <p key={i}>{p}</p>)}</div><div className="reader comments"><Comments novelId={chapter.novel_id} chapterId={chapter.id} novelAuthorId={chapter.novels.author_id} /></div></article>;
}
