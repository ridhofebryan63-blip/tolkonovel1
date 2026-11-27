"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/src/lib/supabase";
export default function AuthCallbackPage() {
  const router = useRouter(); const [message, setMessage] = useState("Menyelesaikan proses masuk…");
  useEffect(() => {
    let active = true;
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const errorDescription = params.get("error_description");
      if (errorDescription) { if (active) setMessage(errorDescription); return; }
      const code = params.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { if (active) setMessage(error.message); return; }
      }
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) { if (active) setMessage(error?.message || "Sesi masuk tidak ditemukan. Coba lagi."); return; }
      router.replace("/"); router.refresh();
    })();
    return () => { active = false; };
  }, [router]);
  return <div className="card empty" role="status"><p>{message}</p><a href="/login" className="btn btn-secondary">Kembali ke halaman masuk</a></div>;
}
