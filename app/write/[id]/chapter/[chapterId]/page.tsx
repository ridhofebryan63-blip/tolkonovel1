"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Loading } from "@/src/components/ui";
import { errMsg } from "@/src/lib/utils";
export default function ChapterEditor() {
  const { id, chapterId } = useParams<{ id: string; chapterId: string }>(); const router = useRouter(); const { profile } = useAuth(); const isNew = chapterId === "new"; const [chapter, setChapter] = useState<any>({ title: "", content: "", status: "draft" }); const [loading, setLoading] = useState(!isNew); const [busy, setBusy] = useState(false); const [message, setMessage] = useState("");
  useEffect(() => { if (isNew || !profile) return; supabase.from("chapters").select("*").eq("id", chapterId).eq("novel_id", id).maybeSingle().then(({ data }) => { if (data) setChapter(data); setLoading(false); }); }, [id, chapterId, isNew, profile]);
  async function save(publish: boolean) { if (!profile || !chapter.title.trim() || !chapter.content.trim()) return setMessage("Judul dan isi bab wajib diisi."); setBusy(true); setMessage(""); const status = publish ? "published" : chapter.status; const body = { title: chapter.title.trim(), content: chapter.content.trim(), status, word_count: chapter.content.trim().split(/\s+/).length, published_at: publish ? new Date().toISOString() : chapter.published_at }; let error;
    if (isNew) { const { data: previous, error: previousError } = await supabase.from("chapters").select("chapter_number").eq("novel_id", id).order("chapter_number", { ascending: false }).limit(1).maybeSingle(); if (previousError) { setBusy(false); return setMessage(errMsg(previousError)); } const result = await supabase.from("chapters").insert({ ...body, novel_id: id, chapter_number: (previous?.chapter_number || 0) + 1, author_id: profile.id }).select("id").single(); error = result.error; if (!error) router.replace(`/write/${id}/chapter/${result.data.id}`); }
    else { const result = await supabase.from("chapters").update(body).eq("id", chapterId).eq("novel_id", id); error = result.error; if (!error) { setChapter({ ...chapter, ...body }); setMessage("Bab tersimpan."); } }
    if (error) setMessage(errMsg(error)); setBusy(false);
  }
  if (!profile) return <div className="empty">Masuk dulu untuk menulis bab.</div>; if (loading) return <Loading />; if (!isNew && !chapter.id) return <div className="empty"><p>Bab tidak ditemukan.</p><Link href={`/write/${id}`} className="btn btn-primary">Kembali</Link></div>;
  return <div className="card"><Link href={`/write/${id}`} className="small">← Kembali ke pengaturan novel</Link><h1 style={{ marginTop: 12 }}>{isNew ? "Bab baru" : "Edit bab"}</h1><div className="field"><label htmlFor="chapter-title">Judul bab</label><input className="input" id="chapter-title" maxLength={255} value={chapter.title} onChange={(e) => setChapter({ ...chapter, title: e.target.value })} /></div><div className="field"><label htmlFor="chapter-content">Isi bab</label><textarea className="input editor-area" id="chapter-content" maxLength={100000} value={chapter.content} onChange={(e) => setChapter({ ...chapter, content: e.target.value })} /><p className="hint">{chapter.content.trim() ? chapter.content.trim().split(/\s+/).length : 0} kata</p></div>{message && <div className="alert alert-warn" role="status">{message}</div>}<div className="row"><button className="btn btn-secondary" disabled={busy} onClick={() => save(false)}>Simpan draf</button><button className="btn btn-primary" disabled={busy} onClick={() => save(true)}>Terbitkan</button></div></div>;
}
