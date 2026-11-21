"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
const links = [["/", "⌂", "Beranda"], ["/library", "▤", "Rak"], ["/write", "✎", "Tulis"], ["/notifications", "♧", "Info"], ["/profile", "●", "Profil"]];
export default function Header() {
  const path = usePathname(); const { profile } = useAuth();
  return <><header className="header"><div className="container header-inner"><Link href="/" className="logo">Tolko<span>Novel</span></Link><nav className="nav-desktop">{links.map(([href, , name]) => <Link key={href} href={href} className={path === href ? "active" : ""}>{name}</Link>)}</nav><div className="row">{profile ? <><Link href="/profile" className="small">{profile.full_name || profile.username}</Link><button className="btn btn-secondary btn-sm" onClick={() => supabase.auth.signOut()}>Keluar</button></> : <Link href="/login" className="btn btn-primary btn-sm">Masuk</Link>}</div></div></header><nav className="bottom-nav" aria-label="Navigasi utama">{links.map(([href, icon, name]) => <Link key={href} href={href} className={path === href ? "active" : ""}><span aria-hidden="true">{icon}</span>{name}</Link>)}</nav></>;
}
