"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { errMsg, timeAgo } from "@/src/lib/utils";
export default function Comments({ novelId, chapterId, novelAuthorId }: { novelId: string; chapterId: string | null; novelAuthorId: string }) {
  const { profile } = useAuth(); const [items, setItems] = useState<any[]>([]); const [text, setText] = useState(""); const [message, setMessage] = useState("");
  const load = () => { let query = supabase.from("comments").select("id,content,created_at,user_id,author:profiles(username,full_name)").eq("novel_id", novelId).is("deleted_at", null).is("parent_id", null).order("created_at", { ascending: false }).limit(30); if (chapterId) query = query.eq("chapter_id", chapterId); else query = query.is("chapter_id", null); query.then(({ data }) => setItems(data || [])); };
  useEffect(load, [novelId, chapterId]);
  async function submit() { if (!profile || !text.trim()) return; const { error } = await supabase.from("comments").insert({ novel_id: novelId, chapter_id: chapterId, user_id: profile.id, content: text.trim() }); if (error) setMessage(errMsg(error)); else { setText(""); setMessage("Komentar terkirim."); load(); } }
  return <section><h2>Komentar ({items.length})</h2>{profile ? <><textarea className="input" rows={3} maxLength={3000} placeholder="Tulis komentar" value={text} onChange={(e) => setText(e.target.value)} /><button className="btn btn-primary btn-sm" style={{ marginTop: 8 }} disabled={!text.trim()} onClick={submit}>Kirim komentar</button></> : <p className="muted"><Link href="/login">Masuk</Link> untuk berkomentar.</p>}{message && <p className="small" role="status">{message}</p>}{items.map((item) => <div className="comment" key={item.id}><div className="meta"><b>{item.author?.full_name || item.author?.username || "Pembaca"}</b><span>{timeAgo(item.created_at)}</span></div><p>{item.content}</p></div>)}</section>;
}
