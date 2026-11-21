import Link from "next/link";
import { NeedLogin } from "@/src/components/AuthProvider";
export { NeedLogin };
export function Loading() { return <div className="empty" role="status">Memuat…</div>; }
export function Empty({ children }: { children: React.ReactNode }) { return <div className="empty">{children}</div>; }
export function Cover({ novel, size = "md" }: { novel: { title: string; cover_url?: string | null }; size?: "sm" | "md" | "lg" }) {
  return <div className={`cover cover-${size}`}>{novel.cover_url ? <img src={novel.cover_url} alt={`Sampul ${novel.title}`} /> : <span>{novel.title}</span>}</div>;
}
export function Stars({ value }: { value: number }) { return <span className="stars" aria-label={`${Number(value).toFixed(1)} dari 5 bintang`}>★ {Number(value || 0).toFixed(1)}</span>; }
export function NovelCard({ novel }: { novel: any }) {
  return <Link className="novel-card" href={`/novel/${novel.slug}`}><Cover novel={novel} /><h3>{novel.title}</h3><p className="small muted">oleh {novel.author?.full_name || novel.author?.username || "Penulis"}</p><p className="small"><Stars value={novel.rating_average} /></p></Link>;
}
