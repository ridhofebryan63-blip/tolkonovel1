"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/src/lib/supabase";
import { useAuth } from "@/src/components/AuthProvider";
import { Loading, NeedLogin } from "@/src/components/ui";
import { errMsg, STATUS_LABEL, uniqueSlug } from "@/src/lib/utils";

export default function NovelEditor() {
  const { id } = useParams<{ id: string }>();
  const isNew = id === "new";
  const router = useRouter();
  const { profile } = useAuth();
  const [f, setF] = useState<any>({ title: "", synopsis: "", cover_url: "", status: "draft", publication_status: "ongoing", age_rating: "all" });
  const [genres, setGenres] = useState<any[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  useEffect(() => { supabase.from("genres").select("id,name").order("name").then(({ data }) => setGenres(data || [])); }, []);
  useEffect(() => {
    if (isNew || !profile) return;
    (async () => {
      const { data } = await supabase.from("novels").select("*, novel_genres(genre_id)").eq("id", id).eq("author_id", profile.id).is("deleted_at", null).maybeSingle();
      if (data) { setF(data); setPicked(data.novel_genres.map((g: any) => g.genre_id)); }
      const c = await supabase.from("chapters").select("id,chapter_number,title,status,word_count").eq("novel_id", id).is("deleted_at", null).order("chapter_number");
      setChapters(c.data || []); setLoading(false);
    })();
  }, [id, isNew, profile]);

  async function uploadCover(file: File) {
    if (file.size > 2 * 1024 * 1024) return setMsg({ ok: false, t: "Ukuran gambar maksimal 2 MB." });
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = `${(await supabase.auth.getUser()).data.user?.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(path, file, { contentType: file.type });
    if (error) return setMsg({ ok: false, t: "Gagal mengunggah: " + error.message });
    setF({ ...f, cover_url: supabase.storage.from("covers").getPublicUrl(path).data.publicUrl });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setMsg(null);
    if (!f.title.trim() || !f.synopsis.trim()) return setMsg({ ok: false, t: "Judul dan sinopsis wajib diisi." });
    if (f.status === "published" && picked.length === 0) return setMsg({ ok: false, t: "Pilih minimal satu genre sebelum menerbitkan." });
    setBusy(true);
    const body = { title: f.title.trim(), synopsis: f.synopsis.trim(), cover_url: f.cover_url || null, status: f.status, publication_status: f.publication_status, age_rating: f.age_rating };
    let novelId = id;
    if (isNew) {
      const { data, error } = await supabase.from("novels").insert({ ...body, author_id: profile.id, slug: uniqueSlug(f.title) }).select("id").single();
      if (error) { setBusy(false); return setMsg({ ok: false, t: errMsg(error) }); }
      novelId = data.id;
    } else {
      const { error } = await supabase.from("novels").update(body).eq("id", id);
      if (error) { setBusy(false); return setMsg({ ok: false, t: errMsg(error) }); }
      await supabase.from("novel_genres").delete().eq("novel_id", id);
    }
    if (picked.length) { const { error } = await supabase.from("novel_genres").insert(picked.map((g) => ({ novel_id: novelId, genre_id: g }))); if (error) { setBusy(false); return setMsg({ ok: false, t: errMsg(error) }); } }
    setBusy(false);
    if (isNew) router.replace(`/write/${novelId}`); else setMsg({ ok: true, t: "Perubahan tersimpan." });
  }

  async function removeNovel() {
    if (!confirm("Hapus novel ini? Novel akan disembunyikan dari pembaca.")) return;
    const { error } = await supabase.from("novels").update({ deleted_at: new Date().toISOString() }).eq("id", id);
    if (error) return setMsg({ ok: false, t: errMsg(error) });
    router.replace("/write");
  }

  if (!profile) return <NeedLogin text="Masuk dulu untuk menulis." />;
  if (loading) return <Loading />;
  if (!isNew && !f.id) return <div className="empty"><p>Novel tidak ditemukan.</p><Link href="/write" className="btn btn-primary">Kembali</Link></div>;

  return (
    <div className="two-col">
      <form className="card" onSubmit={save}>
        <h1>{isNew ? "Novel baru" : "Pengaturan novel"}</h1>
        <div className="field"><label htmlFor="t">Judul</label><input id="t" className="input" maxLength={255} value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} required /></div>
        <div className="field"><label htmlFor="s">Sinopsis</label><textarea id="s" className="input" rows={6} value={f.synopsis} onChange={(e) => setF({ ...f, synopsis: e.target.value })} required /><p className="hint">Ceritakan premis novel dalam beberapa kalimat agar pembaca tertarik.</p></div>
        <div className="field"><label htmlFor="c">Sampul</label>
          <input id="c" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} />
          <p className="hint">JPG, PNG, atau WebP, maksimal 2 MB. Rasio 3:4 paling pas. Tanpa sampul, kami buatkan sampul otomatis.</p>
          {f.cover_url && <div className="row" style={{ marginTop: 8 }}><img src={f.cover_url} alt="Sampul" style={{ width: 90, borderRadius: 8 }} /><button type="button" className="btn btn-ghost btn-sm" onClick={() => setF({ ...f, cover_url: "" })}>Hapus sampul</button></div>}</div>
        <div className="field"><label>Genre</label>
          <div className="chips" style={{ flexWrap: "wrap" }}>{genres.map((g) => <button type="button" key={g.id} className={`chip ${picked.includes(g.id) ? "on" : ""}`} onClick={() => setPicked(picked.includes(g.id) ? picked.filter((x) => x !== g.id) : [...picked, g.id])}>{g.name}</button>)}</div></div>
        <div className="row" style={{ alignItems: "flex-start" }}>
          <div className="field" style={{ flex: 1, minWidth: 140 }}><label htmlFor="ps">Status cerita</label><select id="ps" className="input" value={f.publication_status} onChange={(e) => setF({ ...f, publication_status: e.target.value })}><option value="ongoing">Berlanjut</option><option value="completed">Tamat</option><option value="hiatus">Jeda</option></select></div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}><label htmlFor="ar">Batas usia</label><select id="ar" className="input" value={f.age_rating} onChange={(e) => setF({ ...f, age_rating: e.target.value })}><option value="all">Semua umur</option><option value="teen">13+</option><option value="mature">18+</option></select></div>
          <div className="field" style={{ flex: 1, minWidth: 140 }}><label htmlFor="st">Penerbitan</label>
            <select id="st" className="input" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} disabled={f.status === "suspended"}>
              <option value="draft">Draf (hanya saya)</option><option value="published">Terbit (publik)</option><option value="archived">Diarsipkan</option>{f.status === "suspended" && <option value="suspended">Ditangguhkan</option>}</select></div>
        </div>
        {f.status === "suspended" && <div className="alert alert-error">Novel ini ditangguhkan oleh admin dan tidak tampil untuk pembaca.</div>}
        {msg && <div className={`alert ${msg.ok ? "alert-ok" : "alert-error"}`} role="alert">{msg.t}</div>}
        <div className="row"><button className="btn btn-primary" disabled={busy}>{busy ? "Menyimpan…" : "Simpan"}</button>
          {!isNew && <button type="button" className="btn btn-ghost" style={{ color: "var(--color-danger)" }} onClick={removeNovel}>Hapus novel</button>}</div>
      </form>

      {!isNew && (
        <div className="card">
          <div className="row between"><h2 style={{ margin: 0 }}>Bab</h2><Link href={`/write/${id}/chapter/new`} className="btn btn-primary btn-sm">＋ Bab baru</Link></div>
          {chapters.length === 0 && <p className="muted" style={{ marginTop: 12 }}>Belum ada bab. Tambahkan bab pertamamu.</p>}
          <div className="chapter-list">
            {chapters.map((c) => <Link key={c.id} href={`/write/${id}/chapter/${c.id}`}><span>Bab {Number(c.chapter_number)}: {c.title}</span><span className={`badge ${c.status === "published" ? "green" : "amber"}`}>{STATUS_LABEL[c.status] || c.status}</span></Link>)}
          </div>
        </div>
      )}
    </div>
  );
}
