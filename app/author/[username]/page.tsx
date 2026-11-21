"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import { Cover, Loading } from "@/src/components/ui";
export default function AuthorPage() {
  const { username } = useParams<{ username: string }>(); const [author, setAuthor] = useState<any>(null); const [novels, setNovels] = useState<any[]>([]); const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { const { data } = await supabase.from("profiles").select("id,username,full_name,author_bio").eq("username", username).maybeSingle(); setAuthor(data); if (data) { const result = await supabase.from("novels").select("id,title,slug,cover_url,rating_average,author:profiles(username,full_name)").eq("author_id", data.id).eq("status", "published").is("deleted_at", null).order("created_at", { ascending: false }); setNovels(result.data || []); } setLoading(false); })(); }, [username]);
  if (loading) return <Loading />; if (!author) return <div className="empty">Penulis tidak ditemukan.</div>;
  return <div className="stack"><div className="card"><h1>{author.full_name || author.username}</h1><p className="muted">@{author.username}</p>{author.author_bio && <p>{author.author_bio}</p>}</div><h2>Novel karya {author.full_name || author.username}</h2><div className="grid-novels">{novels.map((n) => <Link className="novel-card" key={n.id} href={`/novel/${n.slug}`}><Cover novel={n} /><h3>{n.title}</h3></Link>)}</div>{!novels.length && <p className="muted">Belum ada novel terbit.</p>}</div>;
}
