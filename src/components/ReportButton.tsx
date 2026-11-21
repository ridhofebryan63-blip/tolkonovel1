"use client";
import { useState } from "react";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
export default function ReportButton({ type, targetId, label }: { type: string; targetId: string; label: string }) {
  const { profile } = useAuth(); const [message, setMessage] = useState("");
  async function report() { const reason = window.prompt("Jelaskan alasan laporan:"); if (!reason?.trim() || !profile) return; const { error } = await supabase.from("reports").insert({ reporter_id: profile.id, target_type: type, target_id: targetId, reason: reason.trim() }); setMessage(error ? error.message : "Laporan terkirim."); }
  return <span><button className="btn btn-secondary btn-sm" onClick={report}>{label}</button>{message && <small role="status"> {message}</small>}</span>;
}
