export const STATUS_LABEL: Record<string, string> = { draft: "Draf", published: "Terbit", archived: "Diarsipkan", suspended: "Ditangguhkan" };
export const PUB_LABEL: Record<string, string> = { ongoing: "Berlanjut", completed: "Tamat", hiatus: "Jeda" };
export const AGE_LABEL: Record<string, string> = { all: "Semua umur", teen: "13+", mature: "18+" };
export const LIB_LABEL: Record<string, string> = { want_to_read: "Ingin dibaca", reading: "Sedang dibaca", completed: "Selesai dibaca", dropped: "Ditinggalkan" };
export function errMsg(error: { message?: string } | null | undefined) { return error?.message || "Terjadi kesalahan. Silakan coba lagi."; }
export function uniqueSlug(value: string) { return `${value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "novel"}-${Math.random().toString(36).slice(2, 7)}`; }
export function fmt(value: number | null | undefined) { return new Intl.NumberFormat("id-ID", { notation: (value || 0) >= 10000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value || 0); }
export function timeAgo(value: string) { const days = Math.floor((Date.now() - new Date(value).getTime()) / 86400000); return days < 1 ? "Hari ini" : days < 30 ? `${days} hari lalu` : new Date(value).toLocaleDateString("id-ID"); }
