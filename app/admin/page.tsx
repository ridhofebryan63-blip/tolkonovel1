"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Loading } from "@/src/components/ui";
export default function AdminPage() {
  const { profile, loading } = useAuth(); const [reports, setReports] = useState<any[]>([]); const [message, setMessage] = useState("");
  const load = () => supabase.from("reports").select("*, reporter:profiles(username)").order("created_at", { ascending: false }).then(({ data, error }) => { if (error) setMessage(error.message); else setReports(data || []); });
  useEffect(() => { if (profile?.role === "admin") load(); }, [profile]);
  async function suspend(report: any) { if (report.target_type !== "novel") return setMessage("Aksi otomatis saat ini tersedia untuk laporan novel."); const { error } = await supabase.from("novels").update({ status: "suspended" }).eq("id", report.target_id); if (error) setMessage(error.message); else { await supabase.from("reports").update({ status: "resolved" }).eq("id", report.id); setMessage("Novel ditangguhkan dan laporan ditutup."); load(); } }
  if (loading) return <Loading />; if (!profile) return <div className="empty"><p>Masuk untuk membuka panel admin.</p><Link href="/login" className="btn btn-primary">Masuk</Link></div>; if (profile.role !== "admin") return <div className="empty">Akses admin diperlukan.</div>;
  return <div className="card"><h1>Panel admin</h1><p className="muted">Laporan pengguna</p>{message && <p className="alert alert-warn" role="status">{message}</p>}{reports.length === 0 ? <p>Belum ada laporan.</p> : <div style={{ overflowX: "auto" }}><table className="tbl"><thead><tr><th>Jenis</th><th>Alasan</th><th>Pelapor</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{reports.map((r) => <tr key={r.id}><td>{r.target_type}</td><td>{r.reason}</td><td>{r.reporter?.username}</td><td>{r.status}</td><td>{r.status === "open" && r.target_type === "novel" && <button className="btn btn-danger btn-sm" onClick={() => suspend(r)}>Tangguhkan novel</button>}</td></tr>)}</tbody></table></div>}</div>;
}
