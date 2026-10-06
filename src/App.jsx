import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
// xlsx (~600KB) di-lazy-load, bukan di-import statis — library ini cuma kepake
// pas user klik Ekspor/Impor, jadi gak perlu ikut nge-download & nge-parse di load awal.
let xlsxPromise = null;
const getXLSX = () => (xlsxPromise ||= import("xlsx"));
import {
  Home, Users, BookOpen, CalendarCheck, ClipboardList, BarChart3,
  Plus, Trash2, Save, ChevronDown, Download, ArrowRight,
  ListPlus, AlertTriangle, GraduationCap, Info, Sparkles,
  Upload, RefreshCw, CheckCircle2, XCircle, LogOut, MessageCircle,
  User, Camera, School, Award
} from "lucide-react";
import Cropper from "react-easy-crop";
import { supabase } from "./supabaseClient";
import { fetchAllData, syncDiff, fetchTeacherCounts } from "./sync";

// GANTI nomor ini sebelum deploy — harus SAMA PERSIS dengan yang di Auth.jsx.
const ADMIN_WHATSAPP = "6281280144412";
const waLink = (message) => `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;

// ---------- design tokens ----------
const C = {
  bg: "#F6F2E7",
  surface: "#FFFFFF",
  surfaceAlt: "#EFE7D3",
  ink: "#2A2318",
  muted: "#7C7260",
  line: "#E4DAC0",
  brown: "#241C12",
  brownSoft: "#3B3222",
  primary: "#4C6E54",
  primaryDark: "#324A38",
  primarySoft: "#E1EADF",
  primaryMuted: "#7A9C74",
  primaryMutedSoft: "#E9F0E5",
  accent: "#BE9A34",
  accentDark: "#8C6A22",
  accentSoft: "#F3E8C8",
  brownTint: "#8A6F49",
  brownTintSoft: "#E9DEC5",
  info: "#3E6E93",
  infoSoft: "#DDE9F1",
  warn: "#B07F2E",
  warnSoft: "#F1E4C9",
  danger: "#A34632",
  dangerSoft: "#F1DED7",
};

const FONTS = `
@keyframes ngSplashIn { from { opacity:0; transform: scale(0.8) translateY(8px);} to {opacity:1; transform:scale(1) translateY(0);} }
@keyframes ngFadeUp { from {opacity:0; transform: translateY(12px);} to {opacity:1; transform:translateY(0);} }
@keyframes ngDot { 0%,80%,100% {opacity:0.3; transform: translateY(0);} 40% {opacity:1; transform:translateY(-4px);} }
@keyframes ngGlowPulse { 0%,100% { opacity:0.35; transform: scale(1); } 50% { opacity:0.55; transform: scale(1.08); } }
@keyframes ngOverlayIn { from { opacity:0; } to { opacity:1; } }
@keyframes ngModalIn { from { opacity:0; transform: scale(0.94) translateY(6px); } to { opacity:1; transform: scale(1) translateY(0); } }
@keyframes ngRowIn { from { opacity:0; transform: translateY(-6px); } to { opacity:1; transform: translateY(0); } }
@keyframes ngWave { 0%,60%,100% { transform: rotate(0deg); } 10%,30% { transform: rotate(14deg); } 20% { transform: rotate(-8deg); } 40% { transform: rotate(10deg); } 50% { transform: rotate(-4deg); } }
.ng-wave { display:inline-block; transform-origin: 70% 70%; animation: ngWave 1.8s ease-in-out 0.4s 1; }
.ng-splash-logo { animation: ngSplashIn 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
.ng-splash-text { animation: ngFadeUp 0.5s ease 0.18s both; }
.ng-splash-dots { animation: ngFadeUp 0.5s ease 0.3s both; }
.ng-splash-overlay { transition: opacity 0.45s ease, transform 0.45s ease; }
.ng-splash-exit { opacity: 0; transform: scale(1.04); pointer-events: none; }
.ng-app-enter { animation: ngFadeUp 0.4s ease both; }
.ng-dot { width:6px; height:6px; border-radius:9999px; background:#fff; display:inline-block; animation: ngDot 1.1s ease-in-out infinite; }
.ng-dot:nth-child(2){ animation-delay:0.15s; }
.ng-dot:nth-child(3){ animation-delay:0.3s; }
.ng-press { transition: transform 120ms ease, box-shadow 120ms ease, background-color 200ms ease; }
.ng-press:active { transform: scale(0.96); }
.ng-glow { animation: ngGlowPulse 3.2s ease-in-out infinite; }
.ng-overlay-in { animation: ngOverlayIn 0.2s ease both; }
.ng-modal-in { animation: ngModalIn 0.28s cubic-bezier(0.22,1,0.36,1) both; }
.ng-row-in { animation: ngRowIn 0.25s ease both; }
.ng-chevron { transition: transform 0.28s cubic-bezier(0.22,1,0.36,1); }
.ng-chevron-open { transform: rotate(180deg); }
.ng-icon-btn { transition: background-color 160ms ease, color 160ms ease, transform 120ms ease; }
.ng-icon-btn:hover { background: rgba(42,35,24,0.06); }
.ng-icon-btn:active { transform: scale(0.92); }
.ng-list-row { transition: background-color 180ms ease, transform 180ms ease, box-shadow 180ms ease; }
.ng-list-row:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(42,35,24,0.08); }
.ng-tr { transition: background-color 160ms ease; }
.ng-tr:hover { background: rgba(76,110,84,0.06); }

/* ---------- premium responsive header ---------- */
:root{
  --ng-content-max: 1440px;
  --ng-side-pad: clamp(12px, 2.4vw, 42px);
  --ng-bottom-space: calc(104px + env(safe-area-inset-bottom));
}
.ng-topbar{
  position:sticky;
  top:0;
  z-index:30;
  width:100%;
  background:
    radial-gradient(circle at 18% 0%, rgba(122,156,116,0.11), transparent 27%),
    radial-gradient(circle at 84% 0%, rgba(190,154,52,0.07), transparent 23%),
    linear-gradient(180deg, #2A2116 0%, #241C12 100%);
  color:#fff;
  border-bottom:1px solid rgba(255,255,255,0.07);
  box-shadow:0 8px 24px rgba(36,28,18,0.16);
  overflow:hidden;
}
.ng-topbar::after{
  content:"";
  position:absolute;
  left:0; right:0; bottom:0;
  height:1px;
  background:linear-gradient(90deg, transparent, rgba(122,156,116,0.55), rgba(190,154,52,0.28), transparent);
}
.ng-topbar-inner{
  position:relative;
  z-index:1;
  width:min(100%, var(--ng-content-max));
  margin:0 auto;
  padding:clamp(10px,1.3vw,17px) var(--ng-side-pad);
  display:grid;
  grid-template-columns:minmax(0,1fr) minmax(185px, auto) minmax(300px, auto);
  grid-template-areas:"brand semester right";
  align-items:center;
  gap:clamp(10px,1.8vw,28px);
}
.ng-brand{ grid-area:brand; }
.ng-semester-col{ grid-area:semester; }
.ng-topbar-right{ grid-area:right; }
.ng-brand{
  display:flex;
  align-items:center;
  gap:clamp(9px,1vw,13px);
  min-width:0;
}
.ng-brand-mark{
  width:clamp(38px,3vw,46px);
  height:clamp(38px,3vw,46px);
  flex:0 0 auto;
  border-radius:clamp(11px,1vw,14px);
  padding:2px;
  background:linear-gradient(145deg, rgba(255,255,255,0.24), rgba(122,156,116,0.52));
  box-shadow:0 6px 18px rgba(0,0,0,0.22), inset 0 0 0 1px rgba(255,255,255,0.08);
}
.ng-brand-mark img{width:100%;height:100%;display:block;object-fit:cover;border-radius:inherit;}
.ng-brand-copy{min-width:0;line-height:1.08;}
.ng-brand-eyebrow{
  font-family:'Nunito Sans',sans-serif;
  font-size:clamp(8px,.58vw,10px);
  font-weight:800;
  letter-spacing:.13em;
  text-transform:uppercase;
  color:rgba(255,255,255,0.47);
  margin-bottom:2px;
}
.ng-brand-title{
  font-family:'Nunito Sans',sans-serif;
  font-size:clamp(18px,1.55vw,23px);
  font-weight:800;
  letter-spacing:-.035em;
  color:#fff;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.ng-brand-title span{color:#A7C3A2;}
.ng-brand-sub{
  margin-top:3px;
  font-family:'Inter',sans-serif;
  font-size:clamp(9px,.7vw,10.5px);
  font-weight:500;
  color:rgba(255,255,255,0.43);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.ng-semester-col{
  justify-self:center;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:6px;
  min-width:0;
}
.ng-semester-wrap{
  display:flex;
  align-items:center;
  gap:8px;
  padding:5px 6px 5px 10px;
  background:rgba(255,255,255,0.055);
  border:1px solid rgba(255,255,255,0.11);
  border-radius:15px;
  box-shadow:inset 0 1px 0 rgba(255,255,255,0.05);
}
.ng-semester-meta{
  font-family:'Inter',sans-serif;
  font-size:8.5px;
  font-weight:700;
  letter-spacing:.08em;
  text-transform:uppercase;
  color:rgba(255,255,255,0.42);
  white-space:nowrap;
}
.ng-semester-select{
  appearance:none;
  -webkit-appearance:none;
  min-width:clamp(150px,12vw,190px);
  padding:8px 31px 8px 12px;
  border-radius:11px;
  border:1px solid rgba(255,255,255,0.11);
  color:#fff;
  background:
    linear-gradient(45deg, transparent 50%, rgba(255,255,255,.74) 50%) calc(100% - 14px) 50%/5px 5px no-repeat,
    linear-gradient(135deg, rgba(255,255,255,.74) 50%, transparent 50%) calc(100% - 10px) 50%/5px 5px no-repeat,
    rgba(255,255,255,0.065);
  outline:none;
  cursor:pointer;
  font-family:'Nunito Sans',sans-serif;
  font-size:12px;
  font-weight:800;
  transition:background .18s ease,border-color .18s ease,transform .18s ease;
}
.ng-semester-select:hover{background-color:rgba(255,255,255,0.10);border-color:rgba(255,255,255,0.18);}
.ng-semester-select:focus{border-color:rgba(167,195,162,0.55);box-shadow:0 0 0 3px rgba(167,195,162,0.10);}
.ng-semester-select option{color:#2A2318;background:#fff;}
.ng-save-caption{
  display:flex;
  align-items:center;
  gap:6px;
  min-width:0;
}
.ng-save-dot{
  width:7px;height:7px;border-radius:999px;flex:0 0 auto;
  box-shadow:0 0 0 4px rgba(122,156,116,0.10);
}
.ng-save-caption-text{
  font-family:'Inter',sans-serif;
  font-size:10px;
  font-weight:600;
  color:rgba(255,255,255,0.4);
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.ng-topbar-right{
  justify-self:end;
  display:flex;
  align-items:center;
  flex-wrap:wrap;
  justify-content:flex-end;
  gap:10px;
  min-width:0;
}
.ng-account{
  display:flex;
  align-items:center;
  gap:9px;
  height:40px;
  padding:0 15px 0 5px;
  border-radius:999px;
  background:rgba(255,255,255,0.07);
  border:1px solid rgba(255,255,255,0.13);
  min-width:0;
  flex:0 1 auto;
  max-width:220px;
}
.ng-account-avatar{
  width:29px;height:29px;border-radius:999px;flex:0 0 auto;
  display:flex;align-items:center;justify-content:center;
  background:linear-gradient(145deg, rgba(122,156,116,0.95), rgba(76,110,84,0.95));
  color:#fff;font-family:'Nunito Sans',sans-serif;font-weight:800;font-size:11.5px;
}
.ng-account-name{
  font-family:'Inter',sans-serif;
  font-size:13px;
  font-weight:600;
  color:#fff;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
  min-width:0;
  max-width:150px;
}
.ng-actions{
  display:flex;
  align-items:center;
  gap:8px;
  flex:0 0 auto;
}
.ng-action-btn{
  display:flex;
  align-items:center;
  justify-content:center;
  gap:6px;
  height:40px;
  padding:0 16px;
  border-radius:999px;
  font-family:'Inter',sans-serif;
  font-size:12.5px;
  font-weight:700;
  white-space:nowrap;
  border:1px solid transparent;
  flex:0 0 auto;
}
.ng-action-wa{
  background:rgba(122,156,116,0.92);
  color:#152016;
}
.ng-action-wa:hover{background:rgba(122,156,116,1);}
.ng-action-logout{
  background:rgba(163,70,50,0.85);
  color:#fff;
}
.ng-action-logout:hover{background:rgba(163,70,50,1);}
.ng-action-label{display:inline;}

/* ---------- versi ringkas header saat discroll ---------- */
.ng-topbar,
.ng-topbar-inner,
.ng-brand-mark,
.ng-semester-wrap,
.ng-semester-select,
.ng-account,
.ng-account-avatar,
.ng-action-btn{
  transition: padding .25s ease, width .25s ease, height .25s ease, box-shadow .25s ease;
}
.ng-topbar-compact .ng-topbar-inner{ padding-top:7px; padding-bottom:7px; }
.ng-topbar-compact .ng-brand-mark{ width:30px; height:30px; }
.ng-topbar-compact .ng-brand-eyebrow{ display:none; }
.ng-topbar-compact .ng-brand-title{ font-size:15px; }
.ng-topbar-compact .ng-brand-sub{ display:none; }
.ng-topbar-compact .ng-semester-meta{ display:none; }
.ng-topbar-compact .ng-semester-wrap{ padding:3px 4px 3px 8px; gap:0; }
.ng-topbar-compact .ng-semester-select{ font-size:10.5px; padding:5px 20px 5px 8px; min-width:0; max-width:118px; }
.ng-topbar-compact .ng-save-caption-text{ display:none; }
.ng-topbar-compact .ng-account{ padding:0; width:34px; height:34px; max-width:34px; justify-content:center; }
.ng-topbar-compact .ng-account-name{ display:none; }
.ng-topbar-compact .ng-account-avatar{ width:26px; height:26px; font-size:10px; }
.ng-topbar-compact .ng-action-btn{ padding:0; width:34px; height:34px; }
.ng-topbar-compact .ng-action-label{ display:none; }

/* --- mode layar HP: semester + status simpan pindah sebaris sama brand (kanan atas),
   baris kedua khusus akun + tombol aksi, full width biar gak pernah ke-wrap dua baris --- */
@media (max-width: 899px){
  .ng-topbar-inner{
    grid-template-columns:minmax(0,1fr) auto;
    grid-template-areas:
      "brand semester"
      "right right";
    gap:10px 12px;
  }
  .ng-brand-sub{display:none;}

  .ng-semester-col{
    justify-self:end;
    align-items:flex-end;
    gap:4px;
  }
  .ng-semester-wrap{padding:4px 5px 4px 9px;gap:6px;}
  .ng-semester-meta{display:none;}
  .ng-semester-select{
    min-width:0;
    width:auto;
    max-width:132px;
    padding:6px 24px 6px 9px;
    font-size:11px;
  }
  .ng-save-caption-text{font-size:9px;}

  .ng-topbar-right{width:100%;flex-wrap:nowrap;gap:7px;}
  .ng-account{height:36px;padding:0 12px 0 4px;gap:7px;flex:0 1 auto;min-width:0;max-width:52%;}
  .ng-account-avatar{width:25px;height:25px;font-size:10.5px;}
  .ng-account-name{font-size:12px;}
  .ng-action-btn{height:36px;padding:0 13px;font-size:11.5px;gap:5px;flex:0 0 auto;}
}

/* ---------- fluid application shell ---------- */
.ng-app-root{
  width:100%;
  min-height:100vh;
  min-height:100dvh;
  display:flex;
  flex-direction:column;
}
.ng-main-shell{
  width:min(100%, var(--ng-content-max));
  margin:0 auto;
  padding:clamp(14px,2vw,30px) var(--ng-side-pad) var(--ng-bottom-space);
  min-width:0;
}
.ng-main-shell > *{min-width:0;}
.ng-dock{
  width:min(calc(100% - 24px), 760px) !important;
  max-width:760px !important;
  left:50% !important;
  right:auto !important;
  margin-left:0 !important;
  margin-right:0 !important;
  transform:translateX(-50%);
}
.ng-dock-inner{width:100%;}

@media (min-width: 768px){
  .ng-main-shell{
    padding-top:22px;
    --ng-bottom-space:calc(112px + env(safe-area-inset-bottom));
  }
  .ng-dock{bottom:18px !important;}
}
@media (min-width: 1100px){
  .ng-main-shell{
    padding-top:28px;
    padding-inline:clamp(24px,3vw,44px);
  }
}
@media (max-width: 479px){
  .ng-topbar-inner{padding:10px 12px 12px;gap:8px 10px;}
  .ng-brand-title{font-size:16px;}
  .ng-brand-eyebrow{font-size:7.5px;letter-spacing:.11em;}
  .ng-semester-wrap{padding:4px 4px 4px 8px;border-radius:13px;}
  .ng-semester-select{max-width:104px;padding:6px 22px 6px 8px;font-size:10.5px;}
  .ng-main-shell{padding-inline:12px;}
  .ng-dock{width:calc(100% - 14px) !important;bottom:8px !important;}
}
@media (max-width: 360px){
  .ng-main-shell{padding-inline:10px;}
  .ng-dock{width:calc(100% - 10px) !important;}
  .ng-brand-mark{width:36px;height:36px;}
  .ng-brand-title{font-size:15px;}
  .ng-account-name{max-width:64px;}
  .ng-action-btn{padding:0 10px;font-size:11px;}
}

/* ---------- admin "Semua Guru" table: list on phones, full table on wider screens ---------- */
.ng-admin-list{display:flex;flex-direction:column;row-gap:8px;}
.ng-admin-table-wrap{display:none;}
@media (min-width: 641px){
  .ng-admin-list{display:none;}
  .ng-admin-table-wrap{display:block;}
}
`;
const F_DISPLAY = "'Plus Jakarta Sans', sans-serif";
const F_BODY = "'Inter', sans-serif";
const F_MONO = "'IBM Plex Mono', monospace";

const KATEGORI = [
  { key: "tugas", label: "Tugas" },
  { key: "adab", label: "Adab & Ketertiban" },
  { key: "uh", label: "Ulangan Harian" },
  { key: "praktek", label: "Praktek" },
  { key: "uts", label: "UTS" },
  { key: "uas", label: "UAS" },
];

const STATUS = {
  H: { label: "Hadir", color: "#4C6E54", soft: "#E1EADF" },
  I: { label: "Izin", color: "#3E6E93", soft: "#DDE9F1" },
  S: { label: "Sakit", color: "#B07F2E", soft: "#F1E4C9" },
  A: { label: "Alpa", color: "#A34632", soft: "#F1DED7" },
};
const STATUS_ORDER = ["H", "I", "S", "A"];

const genId = () => crypto.randomUUID();
const naturalCollator = new Intl.Collator("id", { numeric: true, sensitivity: "base" });
const sortByNama = (arr) => [...arr].sort((a, b) => naturalCollator.compare(a.nama, b.nama));
const todayISO = () => new Date().toISOString().slice(0, 10);
const fmtDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};
const defaultBobot = () => ({ tugas: 10, adab: 10, uh: 15, praktek: 15, uts: 20, uas: 30 });
const genSemesters = () => {
  const arr = [];
  for (let y = 2024; y <= 2032; y++) { arr.push(`Ganjil ${y}/${y + 1}`); arr.push(`Genap ${y}/${y + 1}`); }
  return arr;
};
const emptyData = () => ({
  mapel: [], kelas: [], siswa: [], pertemuan: [], nilai: [],
  semesters: genSemesters(), currentSemester: "Ganjil 2026/2027",
});

// ---------- migrasi data lama (localStorage) ke akun Supabase ----------
const LEGACY_STORAGE_KEY = "ngajargueh-app-data";
const MIGRATION_ASKED_KEY = "ngajargueh-migration-asked";

function readLegacyData() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const total = (parsed.kelas?.length || 0) + (parsed.mapel?.length || 0) +
      (parsed.siswa?.length || 0) + (parsed.pertemuan?.length || 0) + (parsed.nilai?.length || 0);
    if (total === 0) return null;
    return { ...emptyData(), ...parsed };
  } catch (e) {
    console.error("Gagal membaca data lama dari localStorage:", e);
    return null;
  }
}

function isRemoteEmpty(d) {
  return (d.kelas?.length || 0) + (d.mapel?.length || 0) + (d.siswa?.length || 0) +
    (d.pertemuan?.length || 0) + (d.nilai?.length || 0) === 0;
}

// ---------- full-data backup ----------
const BACKUP_SHEETS = [
  "Petunjuk",
  "Daftar Kelas",
  "Daftar Mapel",
  "Daftar Murid",
  "Pertemuan",
  "Absensi",
  "Penilaian",
  "Nilai Murid",
  "Pengaturan",
];

const LEGACY_BACKUP_SHEETS = ["Kelas", "Mapel", "Siswa", "Pertemuan", "Absensi", "Nilai", "NilaiDetail", "Meta"];

const makeExportCode = (prefix, index) => `${prefix}-${String(index + 1).padStart(3, "0")}`;

const setSheetView = (ws, widths) => {
  ws["!cols"] = widths.map((wch) => ({ wch }));
  ws["!autofilter"] = {
    ref: ws["!ref"],
  };
  return ws;
};

const textToRows = (rows) => rows.map((row) => Object.fromEntries(
  Object.entries(row).map(([key, value]) => [key, value ?? ""])
));

function buildBackupWorkbook(XLSX, data) {
  const wb = XLSX.utils.book_new();

  const kelasSorted = sortByNama(data.kelas);
  const mapelSorted = [...data.mapel].sort((a, b) => naturalCollator.compare(a.nama, b.nama));
  const siswaSorted = sortByNama(data.siswa);

  const kelasCode = new Map(kelasSorted.map((item, index) => [item.id, makeExportCode("KLS", index)]));
  const mapelCode = new Map(mapelSorted.map((item, index) => [item.id, makeExportCode("MPL", index)]));
  const siswaCode = new Map(siswaSorted.map((item, index) => [item.id, makeExportCode("MUR", index)]));
  const pertemuanSorted = [...data.pertemuan].sort((a, b) =>
    `${a.tanggal}|${a.kelasId}|${a.mapelId}`.localeCompare(`${b.tanggal}|${b.kelasId}|${b.mapelId}`)
  );
  const nilaiSorted = [...data.nilai].sort((a, b) =>
    `${a.tanggal}|${a.kelasId}|${a.mapelId}|${a.kategori}|${a.label}`
      .localeCompare(`${b.tanggal}|${b.kelasId}|${b.mapelId}|${b.kategori}|${b.label}`)
  );

  const pertemuanCode = new Map(pertemuanSorted.map((item, index) => [item.id, makeExportCode("PRT", index)]));
  const nilaiCode = new Map(nilaiSorted.map((item, index) => [item.id, makeExportCode("NIL", index)]));

  const petunjuk = [
    { Bagian: "Tujuan file", Keterangan: "Backup lengkap untuk memindahkan seluruh data NgajarGueh ke perangkat lain." },
    { Bagian: "Cara memakai", Keterangan: "Jangan mengubah nama sheet atau judul kolom. Untuk pindah perangkat, cukup impor kembali file ini lewat menu Beranda." },
    { Bagian: "Kode", Keterangan: "Kode KLS/MPL/MUR/PRT/NIL adalah identitas sederhana agar data mudah dibaca. Kode tersebut dipakai untuk menghubungkan antar-sheet saat impor." },
    { Bagian: "Penting", Keterangan: "Impor akan mengganti seluruh data di perangkat tujuan, bukan menggabungkannya." },
    { Bagian: "Isi file", Keterangan: "Daftar kelas, mapel, murid, pertemuan, absensi, penilaian, nilai per murid, serta pengaturan semester." },
  ];

  const wsPetunjuk = setSheetView(
    XLSX.utils.json_to_sheet(textToRows(petunjuk)),
    [18, 95]
  );
  XLSX.utils.book_append_sheet(wb, wsPetunjuk, "Petunjuk");

  const wsKelas = setSheetView(
    XLSX.utils.json_to_sheet(textToRows(
      kelasSorted.map((kelas, index) => ({
        No: index + 1,
        "Kode Kelas": kelasCode.get(kelas.id),
        "Nama Kelas": kelas.nama,
      }))
    )),
    [8, 15, 30]
  );
  XLSX.utils.book_append_sheet(wb, wsKelas, "Daftar Kelas");

  const wsMapel = setSheetView(
    XLSX.utils.json_to_sheet(textToRows(
      mapelSorted.map((mapel, index) => ({
        No: index + 1,
        "Kode Mapel": mapelCode.get(mapel.id),
        "Nama Mata Pelajaran": mapel.nama,
        "Bobot Tugas (%)": mapel.bobot?.tugas || 0,
        "Bobot Adab (%)": mapel.bobot?.adab || 0,
        "Bobot Ulangan Harian (%)": mapel.bobot?.uh || 0,
        "Bobot Praktek (%)": mapel.bobot?.praktek || 0,
        "Bobot UTS (%)": mapel.bobot?.uts || 0,
        "Bobot UAS (%)": mapel.bobot?.uas || 0,
      }))
    )),
    [8, 15, 30, 18, 18, 26, 20, 16, 16]
  );
  XLSX.utils.book_append_sheet(wb, wsMapel, "Daftar Mapel");

  const wsMurid = setSheetView(
    XLSX.utils.json_to_sheet(textToRows(
      siswaSorted.map((siswa, index) => {
        const kelas = data.kelas.find((item) => item.id === siswa.kelasId);
        return {
          No: index + 1,
          "Kode Murid": siswaCode.get(siswa.id),
          "Nama Murid": siswa.nama,
          "Kode Kelas": kelasCode.get(siswa.kelasId) || "",
          "Nama Kelas": kelas?.nama || "",
        };
      })
    )),
    [8, 15, 30, 15, 30]
  );
  XLSX.utils.book_append_sheet(wb, wsMurid, "Daftar Murid");

  const wsPertemuan = setSheetView(
    XLSX.utils.json_to_sheet(textToRows(
      pertemuanSorted.map((pertemuan, index) => ({
        No: index + 1,
        "Kode Pertemuan": pertemuanCode.get(pertemuan.id),
        Tanggal: fmtDate(pertemuan.tanggal),
        "Tanggal Data": pertemuan.tanggal,
        Semester: pertemuan.semester,
        "Kode Kelas": kelasCode.get(pertemuan.kelasId) || "",
        "Nama Kelas": data.kelas.find((item) => item.id === pertemuan.kelasId)?.nama || "",
        "Kode Mapel": mapelCode.get(pertemuan.mapelId) || "",
        "Nama Mata Pelajaran": data.mapel.find((item) => item.id === pertemuan.mapelId)?.nama || "",
        "Catatan Pembelajaran": pertemuan.catatan || "",
      }))
    )),
    [8, 18, 16, 16, 22, 15, 25, 15, 30, 55]
  );
  XLSX.utils.book_append_sheet(wb, wsPertemuan, "Pertemuan");

  const absensiRows = [];
  pertemuanSorted.forEach((pertemuan) => {
    const kelas = data.kelas.find((item) => item.id === pertemuan.kelasId);
    const mapel = data.mapel.find((item) => item.id === pertemuan.mapelId);
    const siswaDiKelas = siswaSorted.filter((siswa) => siswa.kelasId === pertemuan.kelasId);

    siswaDiKelas.forEach((siswa) => {
      const status = pertemuan.absensi?.[siswa.id];
      if (!status) return;
      absensiRows.push({
        "Kode Pertemuan": pertemuanCode.get(pertemuan.id),
        Tanggal: fmtDate(pertemuan.tanggal),
        Semester: pertemuan.semester,
        "Kode Kelas": kelasCode.get(pertemuan.kelasId) || "",
        "Nama Kelas": kelas?.nama || "",
        "Kode Mapel": mapelCode.get(pertemuan.mapelId) || "",
        "Nama Mata Pelajaran": mapel?.nama || "",
        "Kode Murid": siswaCode.get(siswa.id),
        "Nama Murid": siswa.nama,
        Kehadiran: STATUS[status]?.label || status,
        "Kode Kehadiran": status,
      });
    });
  });

  const wsAbsensi = setSheetView(
    XLSX.utils.json_to_sheet(textToRows(absensiRows)),
    [18, 16, 22, 15, 25, 15, 30, 15, 30, 18, 18]
  );
  XLSX.utils.book_append_sheet(wb, wsAbsensi, "Absensi");

  const wsPenilaian = setSheetView(
    XLSX.utils.json_to_sheet(textToRows(
      nilaiSorted.map((nilai, index) => ({
        No: index + 1,
        "Kode Penilaian": nilaiCode.get(nilai.id),
        Tanggal: fmtDate(nilai.tanggal),
        "Tanggal Data": nilai.tanggal,
        Semester: nilai.semester,
        "Kode Kelas": kelasCode.get(nilai.kelasId) || "",
        "Nama Kelas": data.kelas.find((item) => item.id === nilai.kelasId)?.nama || "",
        "Kode Mapel": mapelCode.get(nilai.mapelId) || "",
        "Nama Mata Pelajaran": data.mapel.find((item) => item.id === nilai.mapelId)?.nama || "",
        Kategori: KATEGORI.find((item) => item.key === nilai.kategori)?.label || nilai.kategori,
        "Kode Kategori": nilai.kategori,
        "Nama Penilaian": nilai.label || "",
      }))
    )),
    [8, 18, 16, 16, 22, 15, 25, 15, 30, 24, 18, 30]
  );
  XLSX.utils.book_append_sheet(wb, wsPenilaian, "Penilaian");

  const nilaiDetailRows = [];
  nilaiSorted.forEach((nilai) => {
    const kelas = data.kelas.find((item) => item.id === nilai.kelasId);
    const mapel = data.mapel.find((item) => item.id === nilai.mapelId);
    const kategori = KATEGORI.find((item) => item.key === nilai.kategori)?.label || nilai.kategori;
    const siswaDiKelas = siswaSorted.filter((siswa) => siswa.kelasId === nilai.kelasId);

    siswaDiKelas.forEach((siswa) => {
      const nilaiMurid = nilai.nilai?.[siswa.id];
      nilaiDetailRows.push({
        "Kode Penilaian": nilaiCode.get(nilai.id),
        Tanggal: fmtDate(nilai.tanggal),
        "Tanggal Data": nilai.tanggal,
        Semester: nilai.semester,
        "Kode Kelas": kelasCode.get(nilai.kelasId) || "",
        "Nama Kelas": kelas?.nama || "",
        "Kode Mapel": mapelCode.get(nilai.mapelId) || "",
        "Nama Mata Pelajaran": mapel?.nama || "",
        Kategori: kategori,
        "Kode Kategori": nilai.kategori,
        "Nama Penilaian": nilai.label || "",
        "Kode Murid": siswaCode.get(siswa.id),
        "Nama Murid": siswa.nama,
        Nilai: nilaiMurid !== undefined && nilaiMurid !== null && nilaiMurid !== "" ? Number(nilaiMurid) : "",
      });
    });
  });

  const wsNilaiMurid = setSheetView(
    XLSX.utils.json_to_sheet(textToRows(nilaiDetailRows)),
    [18, 16, 16, 22, 15, 25, 15, 30, 24, 18, 30, 15, 30, 10]
  );
  XLSX.utils.book_append_sheet(wb, wsNilaiMurid, "Nilai Murid");

  const wsPengaturan = setSheetView(
    XLSX.utils.json_to_sheet(textToRows([
      { "Pengaturan": "Semester Aktif", "Nilai": data.currentSemester || "" },
      { "Pengaturan": "Daftar Semester", "Nilai": (data.semesters || []).join(" | ") },
      { "Pengaturan": "Waktu Ekspor", "Nilai": new Date().toLocaleString("id-ID") },
      { "Pengaturan": "Versi Format", "Nilai": "ngajargueh-backup-v2" },
    ])),
    [22, 100]
  );
  XLSX.utils.book_append_sheet(wb, wsPengaturan, "Pengaturan");

  return wb;
}

class BackupParseError extends Error {}

function parseBackupWorkbook(XLSX, wb) {
  const hasNewFormat = BACKUP_SHEETS.every((sheetName) => wb.SheetNames.includes(sheetName));
  const hasLegacyFormat = LEGACY_BACKUP_SHEETS.every((sheetName) => wb.SheetNames.includes(sheetName));

  if (!hasNewFormat && !hasLegacyFormat) {
    throw new BackupParseError(
      "Bukan file backup NgajarGueh yang dikenali. Gunakan file hasil Ekspor Data Lengkap dari NgajarGueh."
    );
  }

  const sheet = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: "" });
  const text = (value) => (value === undefined || value === null ? "" : String(value).trim());

  if (hasNewFormat) {
    const kelasRows = sheet("Daftar Kelas");
    const mapelRows = sheet("Daftar Mapel");
    const siswaRows = sheet("Daftar Murid");
    const pertemuanRows = sheet("Pertemuan");
    const absensiRows = sheet("Absensi");
    const penilaianRows = sheet("Penilaian");
    const nilaiMuridRows = sheet("Nilai Murid");
    const pengaturanRows = sheet("Pengaturan");

    const kelas = kelasRows.map((row) => ({
      id: text(row["Kode Kelas"]),
      nama: text(row["Nama Kelas"]),
    })).filter((row) => row.id && row.nama);

    const mapel = mapelRows.map((row) => ({
      id: text(row["Kode Mapel"]),
      nama: text(row["Nama Mata Pelajaran"]),
      bobot: {
        tugas: Number(row["Bobot Tugas (%)"]) || 0,
        adab: Number(row["Bobot Adab (%)"]) || 0,
        uh: Number(row["Bobot Ulangan Harian (%)"]) || 0,
        praktek: Number(row["Bobot Praktek (%)"]) || 0,
        uts: Number(row["Bobot UTS (%)"]) || 0,
        uas: Number(row["Bobot UAS (%)"]) || 0,
      },
    })).filter((row) => row.id && row.nama);

    const siswa = siswaRows.map((row) => ({
      id: text(row["Kode Murid"]),
      nama: text(row["Nama Murid"]),
      kelasId: text(row["Kode Kelas"]),
    })).filter((row) => row.id && row.nama && row.kelasId);

    const pertemuan = pertemuanRows.map((row) => ({
      id: text(row["Kode Pertemuan"]),
      kelasId: text(row["Kode Kelas"]),
      mapelId: text(row["Kode Mapel"]),
      tanggal: text(row["Tanggal Data"]) || text(row.Tanggal),
      catatan: text(row["Catatan Pembelajaran"]),
      semester: text(row.Semester),
      absensi: {},
    })).filter((row) => row.id && row.kelasId && row.mapelId && row.tanggal);

    const pertemuanMap = new Map(pertemuan.map((row) => [row.id, row]));
    absensiRows.forEach((row) => {
      const pertemuan = pertemuanMap.get(text(row["Kode Pertemuan"]));
      const siswaId = text(row["Kode Murid"]);
      const statusCode = text(row["Kode Kehadiran"]);
      if (pertemuan && siswaId && STATUS[statusCode]) {
        pertemuan.absensi[siswaId] = statusCode;
      } else if (pertemuan && siswaId) {
        const statusEntry = Object.entries(STATUS).find(([, meta]) => meta.label.toLowerCase() === text(row.Kehadiran).toLowerCase());
        if (statusEntry) pertemuan.absensi[siswaId] = statusEntry[0];
      }
    });

    const nilai = penilaianRows.map((row) => ({
      id: text(row["Kode Penilaian"]),
      kelasId: text(row["Kode Kelas"]),
      mapelId: text(row["Kode Mapel"]),
      tanggal: text(row["Tanggal Data"]) || text(row.Tanggal),
      semester: text(row.Semester),
      kategori: text(row["Kode Kategori"]),
      label: text(row["Nama Penilaian"]),
      nilai: {},
    })).filter((row) => row.id && row.kelasId && row.mapelId && row.tanggal);

    const nilaiMap = new Map(nilai.map((row) => [row.id, row]));
    nilaiMuridRows.forEach((row) => {
      const penilaian = nilaiMap.get(text(row["Kode Penilaian"]));
      const siswaId = text(row["Kode Murid"]);
      if (penilaian && siswaId && row.Nilai !== "") {
        penilaian.nilai[siswaId] = Number(row.Nilai);
      }
    });

    if (!kelas.length && !mapel.length && !siswa.length && !pertemuan.length && !nilai.length) {
      throw new BackupParseError("File backup terbaca tetapi tidak berisi data.");
    }

    const pengaturan = Object.fromEntries(
      pengaturanRows.map((row) => [text(row.Pengaturan), row.Nilai])
    );
    const semestersFromFile = pengaturan["Daftar Semester"]
      ? String(pengaturan["Daftar Semester"]).split("|").map((item) => item.trim()).filter(Boolean)
      : [];
    const semesters = Array.from(new Set([...genSemesters(), ...semestersFromFile]));
    const currentSemester = text(pengaturan["Semester Aktif"]) || semesters[0] || "Ganjil 2026/2027";

    return { kelas, mapel, siswa, pertemuan, nilai, semesters, currentSemester };
  }

  // Legacy backup parser: mempertahankan kompatibilitas dengan file backup versi lama.
  const kelas = sheet("Kelas").map((row) => ({
    id: text(row.id),
    nama: text(row.nama),
  })).filter((row) => row.id);

  const mapel = sheet("Mapel").map((row) => ({
    id: text(row.id),
    nama: text(row.nama),
    bobot: {
      tugas: Number(row.bobot_tugas) || 0,
      adab: Number(row.bobot_adab) || 0,
      uh: Number(row.bobot_uh) || 0,
      praktek: Number(row.bobot_praktek) || 0,
      uts: Number(row.bobot_uts) || 0,
      uas: Number(row.bobot_uas) || 0,
    },
  })).filter((row) => row.id);

  const siswa = sheet("Siswa").map((row) => ({
    id: text(row.id),
    nama: text(row.nama),
    kelasId: text(row.kelasId),
  })).filter((row) => row.id);

  const absensiRows = sheet("Absensi");
  const pertemuan = sheet("Pertemuan").map((row) => {
    const id = text(row.id);
    const absensi = {};
    absensiRows.filter((attendance) => text(attendance.pertemuanId) === id).forEach((attendance) => {
      const siswaId = text(attendance.siswaId);
      if (siswaId) absensi[siswaId] = text(attendance.status);
    });
    return {
      id,
      kelasId: text(row.kelasId),
      mapelId: text(row.mapelId),
      tanggal: text(row.tanggal),
      catatan: text(row.catatan),
      semester: text(row.semester),
      absensi,
    };
  }).filter((row) => row.id);

  const nilaiDetailRows = sheet("NilaiDetail");
  const nilai = sheet("Nilai").map((row) => {
    const id = text(row.id);
    const nilaiMap = {};
    nilaiDetailRows.filter((detail) => text(detail.nilaiId) === id).forEach((detail) => {
      const siswaId = text(detail.siswaId);
      if (siswaId && detail.nilai !== "") nilaiMap[siswaId] = Number(detail.nilai);
    });
    return {
      id,
      kelasId: text(row.kelasId),
      mapelId: text(row.mapelId),
      tanggal: text(row.tanggal),
      semester: text(row.semester),
      kategori: text(row.kategori),
      label: text(row.label),
      nilai: nilaiMap,
    };
  }).filter((row) => row.id);

  if (!kelas.length && !mapel.length && !siswa.length && !pertemuan.length && !nilai.length) {
    throw new BackupParseError("File backup terbaca tetapi tidak berisi data.");
  }

  const metaMap = Object.fromEntries(sheet("Meta").map((row) => [text(row.key), row.value]));
  const semestersFromFile = metaMap.semesters
    ? String(metaMap.semesters).split(",").map((item) => item.trim()).filter(Boolean)
    : [];
  const semesters = Array.from(new Set([...genSemesters(), ...semestersFromFile]));
  const currentSemester = metaMap.currentSemester
    ? text(metaMap.currentSemester)
    : (semesters[0] || "Ganjil 2026/2027");

  return { kelas, mapel, siswa, pertemuan, nilai, semesters, currentSemester };
}

// ---------- brand mark ----------
function Logo({ size = 36, rounded = "rounded-xl" }) {
  return (
    <img src="/apple-touch-icon.png" alt="NgajarGueh" width={size} height={size}
      className={rounded} style={{ width: size, height: size, objectFit: "cover", boxShadow: "0 2px 8px rgba(0,0,0,0.35)" }} />
  );
}

// ---------- small UI helpers ----------
function Button({ children, onClick, variant = "primary", size = "md", type = "button", disabled, className = "" }) {
  const styles = {
    primary: { background: C.primary, color: "#fff", boxShadow: "0 3px 10px rgba(50,74,56,0.28)" },
    accent: { background: C.accent, color: "#fff", boxShadow: "0 3px 10px rgba(150,118,35,0.28)" },
    ghost: { background: C.surface, color: C.ink, boxShadow: "0 1px 3px rgba(42,35,24,0.08)" },
    danger: { background: C.dangerSoft, color: C.danger },
  };
  const pad = size === "sm" ? "px-3.5 py-1.5 text-sm" : "px-5 py-2.5 text-sm";
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={styles[variant]}
      className={`${pad} rounded-full font-semibold inline-flex items-center gap-1.5 justify-center transition-all duration-200 ng-press hover:brightness-105 hover:shadow-md disabled:opacity-40 disabled:hover:brightness-100 disabled:hover:shadow-none ${className}`}>
      {children}
    </button>
  );
}

function Field({ label, children, error }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: error ? C.danger : C.muted, letterSpacing: "0.03em" }}>
        {label}{error && " *"}
      </span>
      {children}
    </label>
  );
}

const inputCls = "w-full rounded-2xl px-4 py-2.5 text-sm outline-none transition";
const baseInputStyle = { background: C.surfaceAlt, border: "1px solid transparent", color: C.ink };
const invalidInputStyle = { background: "#FCEEE9", border: `1.5px solid ${C.danger}`, color: C.ink };
const st = (invalid) => (invalid ? invalidInputStyle : baseInputStyle);

function Select({ value, onChange, options, placeholder, invalid }) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls + " appearance-none pr-8"} style={st(invalid && !value)}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown size={15} className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: invalid && !value ? C.danger : C.muted }} />
    </div>
  );
}

function Card({ children, className = "" }) {
  return (
    <div className={`rounded-[28px] p-5 ${className}`} style={{ background: C.surface, boxShadow: "0 2px 14px rgba(42,35,24,0.06)" }}>
      {children}
    </div>
  );
}

function SectionHead({ title, subtitle }) {
  return (
    <div className="mb-4">
      <h2 style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: 19, color: C.ink }}>{title}</h2>
      {subtitle && <p className="text-xs mt-1 leading-relaxed" style={{ color: C.muted }}>{subtitle}</p>}
    </div>
  );
}

function Empty({ icon: Icon, text }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 gap-2" style={{ color: C.muted }}>
      <Icon size={26} strokeWidth={1.4} />
      <p className="text-sm max-w-xs">{text}</p>
    </div>
  );
}

function Guide({ children }) {
  return (
    <div className="flex gap-3 rounded-2xl px-4 py-3.5 text-[13px] leading-relaxed" style={{ background: C.primarySoft, color: C.primaryDark, fontFamily: F_BODY }}>
      <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: C.primary }}>
        <Info size={12} color="#fff" />
      </div>
      <p>{children}</p>
    </div>
  );
}

function Confirm({ open, title, desc, onCancel, onConfirm }) {
  if (!open) return null;
  return createPortal(
    <div className="ng-overlay-in fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/45 p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="ng-modal-in w-full sm:max-w-sm rounded-3xl p-5" style={{ background: C.surface, boxShadow: "0 20px 50px rgba(36,28,18,0.35)" }}>
        <div className="flex items-center gap-2 mb-2" style={{ color: C.danger }}>
          <AlertTriangle size={18} />
          <h3 className="font-semibold" style={{ fontFamily: F_DISPLAY, fontSize: 17 }}>{title}</h3>
        </div>
        <p className="text-sm mb-4" style={{ color: C.muted }}>{desc}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Batal</Button>
          <Button variant="danger" onClick={onConfirm}>Hapus</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ImportConfirm({ preview, current, onCancel, onConfirm }) {
  if (!preview) return null;
  const Row = ({ label, before, after }) => (
    <div className="flex items-center justify-between text-sm py-1.5">
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontFamily: F_MONO }}>
        <span style={{ color: C.muted }}>{before}</span>
        <ArrowRight size={11} className="inline mx-1.5 -mt-0.5" style={{ color: C.muted }} />
        <span style={{ color: C.primary, fontWeight: 700 }}>{after}</span>
      </span>
    </div>
  );
  return createPortal(
    <div className="ng-overlay-in fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/45 p-4" onClick={onCancel}>
      <div onClick={(e) => e.stopPropagation()} className="ng-modal-in w-full sm:max-w-sm rounded-3xl p-5" style={{ background: C.surface, boxShadow: "0 20px 50px rgba(36,28,18,0.35)" }}>
        <div className="flex items-center gap-2 mb-2" style={{ color: C.warn }}>
          <AlertTriangle size={18} />
          <h3 className="font-semibold" style={{ fontFamily: F_DISPLAY, fontSize: 17 }}>Timpa data di perangkat ini?</h3>
        </div>
        <p className="text-sm mb-3 leading-relaxed" style={{ color: C.muted }}>
          Impor akan <strong style={{ color: C.ink }}>mengganti seluruh data</strong> yang ada di perangkat ini dengan isi file — bukan digabung. Data lama di perangkat ini yang tidak ada di file akan hilang.
        </p>
        <div className="rounded-2xl px-3.5 py-1 mb-4" style={{ background: C.surfaceAlt }}>
          <Row label="Kelas" before={current.kelas.length} after={preview.kelas.length} />
          <Row label="Mapel" before={current.mapel.length} after={preview.mapel.length} />
          <Row label="Murid" before={current.siswa.length} after={preview.siswa.length} />
          <Row label="Pertemuan" before={current.pertemuan.length} after={preview.pertemuan.length} />
          <Row label="Data nilai" before={current.nilai.length} after={preview.nilai.length} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onCancel}>Batal</Button>
          <Button variant="accent" onClick={onConfirm}><RefreshCw size={14} />Timpa & Impor</Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function MigrationOffer({ legacyData, migrating, onSkip, onConfirm }) {
  if (!legacyData) return null;
  const Row = ({ label, count }) => (
    <div className="flex items-center justify-between text-sm py-1">
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontFamily: F_MONO, fontWeight: 700, color: C.primary }}>{count}</span>
    </div>
  );
  return createPortal(
    <div className="ng-overlay-in fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/45 p-4">
      <div className="ng-modal-in w-full sm:max-w-sm rounded-3xl p-5" style={{ background: C.surface, boxShadow: "0 20px 50px rgba(36,28,18,0.35)" }}>
        <div className="flex items-center gap-2 mb-2" style={{ color: C.primary }}>
          <Upload size={18} />
          <h3 className="font-semibold" style={{ fontFamily: F_DISPLAY, fontSize: 17 }}>Data lama ditemukan di perangkat ini</h3>
        </div>
        <p className="text-sm mb-3 leading-relaxed" style={{ color: C.muted }}>
          Sebelum akun ini dibuat, perangkat ini sudah menyimpan data berikut. Impor sekarang supaya tidak hilang — data akan dipindahkan ke akun kamu yang baru login.
        </p>
        <div className="rounded-2xl px-3.5 py-1 mb-4" style={{ background: C.surfaceAlt }}>
          <Row label="Kelas" count={legacyData.kelas.length} />
          <Row label="Mapel" count={legacyData.mapel.length} />
          <Row label="Murid" count={legacyData.siswa.length} />
          <Row label="Pertemuan" count={legacyData.pertemuan.length} />
          <Row label="Data nilai" count={legacyData.nilai.length} />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="ghost" onClick={onSkip} disabled={migrating}>Lewati</Button>
          <Button variant="accent" onClick={onConfirm} disabled={migrating}>
            {migrating ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
            {migrating ? "Mengimpor…" : "Impor ke Akun Ini"}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ImportErrorModal({ message, onClose }) {
  if (!message) return null;
  return createPortal(
    <div className="ng-overlay-in fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ng-modal-in w-full sm:max-w-sm rounded-3xl p-5" style={{ background: C.surface, boxShadow: "0 20px 50px rgba(36,28,18,0.35)" }}>
        <div className="flex items-center gap-2 mb-2" style={{ color: C.danger }}>
          <XCircle size={18} />
          <h3 className="font-semibold" style={{ fontFamily: F_DISPLAY, fontSize: 17 }}>Impor gagal</h3>
        </div>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: C.muted }}>{message}</p>
        <div className="flex justify-end"><Button onClick={onClose}>Mengerti</Button></div>
      </div>
    </div>,
    document.body
  );
}

function NoticeModal({ notice, onClose }) {
  if (!notice) return null;
  return createPortal(
    <div className="ng-overlay-in fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="ng-modal-in w-full sm:max-w-sm rounded-3xl p-5" style={{ background: C.surface, boxShadow: "0 20px 50px rgba(36,28,18,0.35)" }}>
        <div className="flex items-start gap-3 mb-3">
          <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: C.infoSoft }}>
            <Info size={17} style={{ color: C.info }} />
          </div>
          <div className="min-w-0 pt-1">
            <h3 className="font-semibold" style={{ fontFamily: F_DISPLAY, fontSize: 16, color: C.ink }}>{notice.title}</h3>
          </div>
        </div>
        <p className="text-sm mb-4 leading-relaxed" style={{ color: C.brownSoft, fontWeight: 500 }}>{notice.message}</p>
        <div className="flex justify-end"><Button onClick={onClose}>Mengerti</Button></div>
      </div>
    </div>,
    document.body
  );
}

// ================= APP =================
function PaywallLocked({ myId, userEmail, onLogout, onPaidSuccess }) {
  const [loadingPay, setLoadingPay] = useState(false);
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    if (!myId) return;
    const channel = supabase
      .channel('payment-status')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${myId}` },
        (payload) => {
          if (payload.new.is_paid === true) {
            onPaidSuccess?.(); 
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [myId, onPaidSuccess]);

  const handlePay = async () => {
    setLoadingPay(true);
    const checkoutUrl = `https://ngajargueh.myr.id/pl/ngajargueh?email=${encodeURIComponent(userEmail || '')}&reference_id=${myId}`;
    window.open(checkoutUrl, "_blank");
    setLoadingPay(false);
  };

  return (
    <div className="ng-app-root" style={{ background: C.bg, color: C.ink, fontFamily: F_BODY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <style>{FONTS}</style>
      <div className="rounded-3xl p-5" style={{ background: C.surface, maxWidth: 420, width: "100%", boxShadow: "0 12px 40px rgba(42,35,24,0.18)" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🔒</div>
        <p className="font-bold" style={{ fontFamily: F_BODY, fontSize: 18, marginBottom: 8 }}>Akun Belum Aktif</p>
        <p className="text-sm leading-relaxed" style={{ color: C.muted, marginBottom: 14 }}>
          Akun kamu terdaftar tapi belum aktif. Aktifkan akses penuh NgajarGueh (sekali bayar, seumur hidup). Setelah pembayaran berhasil, halaman ini akan otomatis terbuka.
        </p>
        
        <button
          onClick={handlePay}
          disabled={loadingPay}
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all ng-press hover:brightness-105"
          style={{ background: C.primary, color: "#fff", marginBottom: 10, boxShadow: "0 3px 10px rgba(50,74,56,0.28)" }}
        >
          {loadingPay ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loadingPay ? "Memproses..." : "Bayar Sekarang (Otomatis)"}
        </button>

        <a
          href={waLink("Halo, saya sudah mendaftar akun NgajarGueh dan ingin melakukan pembayaran secara manual.")}
          target="_blank"
          rel="noreferrer"
          className="w-full flex items-center justify-center gap-2 rounded-xl py-3 font-semibold text-sm transition-all ng-press"
          style={{ background: C.surfaceAlt, color: C.ink, marginBottom: 10 }}
        >
          <MessageCircle size={16} style={{ color: C.primary }} />
          Konfirmasi Manual via WA
        </a>

        <button
          onClick={async () => { await supabase.auth.signOut(); onLogout?.(); }}
          className="block w-full text-center rounded-xl py-3 font-semibold text-sm ng-press"
          style={{ background: "transparent", color: C.muted, border: `1px solid ${C.line}` }}
        >
          Keluar
        </button>
      </div>
      <NoticeModal notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

export default function App({ session, onLogout }) {
  const [data, setData] = useState(emptyData());
  const [dataLoading, setDataLoading] = useState(true);
  const [splashExiting, setSplashExiting] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [saveState, setSaveState] = useState("idle");
  const [tab, setTab] = useState("beranda");
  const loadedOnce = useRef(false);
  const saveTimer = useRef(null);
  const prevDataRef = useRef(emptyData());
  const myId = session.user.id;
  const [viewingOwnerId, setViewingOwnerId] = useState(myId);
  const [myRole, setMyRole] = useState("guru");
  const [myName, setMyName] = useState("");
  const [myNickname, setMyNickname] = useState("");
  const [myGelar, setMyGelar] = useState("");
  const [mySekolah, setMySekolah] = useState("");
  const [myAvatarUrl, setMyAvatarUrl] = useState("");
  const [myIsPaid, setMyIsPaid] = useState(null);
  const [teacherList, setTeacherList] = useState([]);
  const [teacherCounts, setTeacherCounts] = useState({});
  const fileInputRef = useRef(null);
  const [importPreview, setImportPreview] = useState(null);
  const [importError, setImportError] = useState("");
  const [importDone, setImportDone] = useState(false);
  const [migrationOffer, setMigrationOffer] = useState(null);
  const [migrating, setMigrating] = useState(false);
  const [passwordRecoveryMode, setPasswordRecoveryMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [newPassword2, setNewPassword2] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setPasswordRecoveryMode(true);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const submitNewPassword = async (e) => {
    e.preventDefault();
    setPwError("");
    if (newPassword.length < 6) { setPwError("Kata sandi minimal 6 karakter."); return; }
    if (newPassword !== newPassword2) { setPwError("Konfirmasi kata sandi tidak cocok."); return; }
    setPwSaving(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      if (err) throw err;
      setPwDone(true);
    } catch (err) {
      setPwError(err.message || "Gagal mengubah kata sandi. Coba lagi.");
    } finally {
      setPwSaving(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role,is_paid,nama,nama_panggilan,gelar,sekolah,avatar_url")
        .eq("id", myId)
        .single();

      if (error) { console.error("Gagal membaca role akun:", error); return; }
      if (cancelled) return;
      setMyRole(profile?.role || "guru");
      setMyName(profile?.nama || "");
      setMyNickname(profile?.nama_panggilan || "");
      setMyGelar(profile?.gelar || "");
      setMySekolah(profile?.sekolah || "");
      setMyAvatarUrl(profile?.avatar_url || "");
      setMyIsPaid(profile?.is_paid ?? false);
      
      if (profile?.role === "admin") {
        const { data: profiles, error: err2 } = await supabase.from("profiles").select("id,nama,role,is_paid").order("nama");
        if (err2) { console.error("Gagal memuat daftar guru:", err2); return; }
        if (!cancelled) setTeacherList(profiles || []);
        try {
          const counts = await fetchTeacherCounts();
          if (!cancelled) setTeacherCounts(counts);
        } catch (err3) {
          console.error("Gagal memuat ringkasan data semua guru:", err3);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [myId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const fetched = await fetchAllData(viewingOwnerId);
        (fetched.mapel || []).forEach((m) => {
          if (m.bobot && "tertulis" in m.bobot) {
            const lama = Number(m.bobot.tertulis) || 0;
            const half = Math.round(lama / 2);
            m.bobot.uts = (m.bobot.uts ?? 0) + half;
            m.bobot.uas = (m.bobot.uas ?? 0) + (lama - half);
            delete m.bobot.tertulis;
          }
        });
        (fetched.nilai || []).forEach((n) => { if (n.kategori === "tertulis") n.kategori = "uts"; });

        const savedSemester = localStorage.getItem("ngajargueh-current-semester");
        const next = { ...emptyData(), ...fetched };
        if (savedSemester) next.currentSemester = savedSemester;

        if (!cancelled) {
          setData(next);
          prevDataRef.current = next;

          const alreadyAsked = localStorage.getItem(MIGRATION_ASKED_KEY) === "1";
          if (viewingOwnerId === myId && isRemoteEmpty(next) && !alreadyAsked) {
            const legacy = readLegacyData();
            if (legacy) setMigrationOffer(legacy);
          }
        }
      } catch (e) {
        console.error("Gagal memuat data dari Supabase:", e);
      } finally {
        if (!cancelled) {
          loadedOnce.current = true;
          setDataLoading(false);
          setTimeout(() => setSplashExiting(true), 250);
          setTimeout(() => setShowSplash(false), 700);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [viewingOwnerId]);

  useEffect(() => {
    if (!loadedOnce.current) return;
    localStorage.setItem("ngajargueh-current-semester", data.currentSemester);
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await syncDiff(viewingOwnerId, prevDataRef.current, data);
        prevDataRef.current = data;
        setSaveState("saved");
      } catch (e) {
        console.error("Gagal sync ke Supabase:", e);
        setSaveState("error");
      }
    }, 600);
    return () => clearTimeout(saveTimer.current);
  }, [data, viewingOwnerId]);

  const update = (fn) => setData((prev) => { const next = structuredClone(prev); fn(next); return next; });
  const kelasMap = useMemo(() => Object.fromEntries(data.kelas.map((k) => [k.id, k])), [data.kelas]);
  const mapelMap = useMemo(() => Object.fromEntries(data.mapel.map((m) => [m.id, m])), [data.mapel]);

  const exportAllData = async () => {
    const XLSX = await getXLSX();
    const wb = buildBackupWorkbook(XLSX, data);
    XLSX.writeFile(wb, `NgajarGueh-Backup-${todayISO()}.xlsx`.replace(/\s+/g, "_"));
  };
  const skipMigration = () => {
    localStorage.setItem(MIGRATION_ASKED_KEY, "1");
    setMigrationOffer(null);
  };
  const confirmMigration = async () => {
    if (!migrationOffer) return;
    setMigrating(true);
    try {
      const remapped = remapImportedIds(migrationOffer);
      await syncDiff(myId, emptyData(), remapped);
      prevDataRef.current = remapped;
      setData(remapped);
      localStorage.setItem(MIGRATION_ASKED_KEY, "1");
      setMigrationOffer(null);
    } catch (e) {
      console.error("Gagal migrasi data lama:", e);
      setImportError("Gagal mengimpor data lama ke akun ini. Coba lagi — data lama di perangkat ini masih aman dan belum terhapus.");
    } finally {
      setMigrating(false);
    }
  };
  const triggerImportPicker = () => { setImportError(""); fileInputRef.current?.click(); };
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImportError("");
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const XLSX = await getXLSX();
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const parsed = parseBackupWorkbook(XLSX, wb);
        setImportPreview(parsed);
      } catch (err) {
        setImportError(err instanceof BackupParseError ? err.message : "Gagal membaca file. Pastikan file .xlsx ini hasil Ekspor Semua Data dari NgajarGueh dan tidak rusak.");
      }
    };
    reader.onerror = () => setImportError("Gagal membaca file dari perangkat ini.");
    reader.readAsArrayBuffer(file);
  };
  
  const remapImportedIds = (parsed) => {
    const kelasIdMap = new Map(parsed.kelas.map((k) => [k.id, crypto.randomUUID()]));
    const mapelIdMap = new Map(parsed.mapel.map((m) => [m.id, crypto.randomUUID()]));
    const siswaIdMap = new Map(parsed.siswa.map((s) => [s.id, crypto.randomUUID()]));
    const pertemuanIdMap = new Map(parsed.pertemuan.map((p) => [p.id, crypto.randomUUID()]));
    const nilaiIdMap = new Map(parsed.nilai.map((n) => [n.id, crypto.randomUUID()]));

    const kelas = parsed.kelas.map((k) => ({ ...k, id: kelasIdMap.get(k.id) }));
    const mapel = parsed.mapel.map((m) => ({ ...m, id: mapelIdMap.get(m.id) }));
    const siswa = parsed.siswa.map((s) => ({
      ...s, id: siswaIdMap.get(s.id), kelasId: kelasIdMap.get(s.kelasId) || s.kelasId,
    }));
    const pertemuan = parsed.pertemuan.map((p) => {
      const absensi = {};
      Object.entries(p.absensi || {}).forEach(([siswaId, status]) => {
        absensi[siswaIdMap.get(siswaId) || siswaId] = status;
      });
      return {
        ...p, id: pertemuanIdMap.get(p.id),
        kelasId: kelasIdMap.get(p.kelasId) || p.kelasId,
        mapelId: mapelIdMap.get(p.mapelId) || p.mapelId,
        absensi,
      };
    });
    const nilai = parsed.nilai.map((n) => {
      const nilaiMap = {};
      Object.entries(n.nilai || {}).forEach(([siswaId, val]) => {
        nilaiMap[siswaIdMap.get(siswaId) || siswaId] = val;
      });
      return {
        ...n, id: nilaiIdMap.get(n.id),
        kelasId: kelasIdMap.get(n.kelasId) || n.kelasId,
        mapelId: mapelIdMap.get(n.mapelId) || n.mapelId,
        nilai: nilaiMap,
      };
    });

    return { ...parsed, kelas, mapel, siswa, pertemuan, nilai };
  };
  const confirmImport = () => {
    if (!importPreview) return;
    setData(remapImportedIds(importPreview));
    setImportPreview(null);
    setImportDone(true);
    setTimeout(() => setImportDone(false), 2500);
  };

  const togglePaid = async (teacherId, nextValue) => {
    const { error } = await supabase.from("profiles").update({ is_paid: nextValue }).eq("id", teacherId);
    if (error) {
      console.error("Gagal mengubah status pembayaran:", error);
      alert("Gagal mengubah status pembayaran. Coba lagi.");
      return;
    }
    setTeacherList((prev) => prev.map((t) => (t.id === teacherId ? { ...t, is_paid: nextValue } : t)));
  };

  if (passwordRecoveryMode) {
    return (
      <div className="ng-app-root" style={{ background: C.bg, color: C.ink, fontFamily: F_BODY, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
        <style>{FONTS}</style>
        <div className="rounded-3xl p-5" style={{ background: C.surface, maxWidth: 400, width: "100%", boxShadow: "0 12px 40px rgba(42,35,24,0.18)" }}>
          {pwDone ? (
            <>
              <p className="font-bold" style={{ fontFamily: F_DISPLAY, fontSize: 18, marginBottom: 8 }}>Kata sandi berhasil diubah</p>
              <p className="text-sm leading-relaxed mb-4" style={{ color: C.muted }}>Kamu bisa lanjut pakai NgajarGueh sekarang dengan kata sandi barumu.</p>
              <Button onClick={() => setPasswordRecoveryMode(false)} className="w-full justify-center">Lanjutkan</Button>
            </>
          ) : (
            <form onSubmit={submitNewPassword} className="flex flex-col gap-3">
              <p className="font-bold" style={{ fontFamily: F_DISPLAY, fontSize: 18 }}>Buat kata sandi baru</p>
              <p className="text-sm leading-relaxed mb-1" style={{ color: C.muted }}>Ini akun: <strong style={{ color: C.ink }}>{session.user.email}</strong></p>
              <Field label="Kata sandi baru">
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required className={inputCls} style={baseInputStyle} placeholder="Minimal 6 karakter" />
              </Field>
              <Field label="Ulangi kata sandi baru">
                <input type="password" value={newPassword2} onChange={(e) => setNewPassword2(e.target.value)} minLength={6} required className={inputCls} style={baseInputStyle} placeholder="Ketik ulang persis sama" />
              </Field>
              {pwError && (
                <div className="flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-xs" style={{ background: C.dangerSoft, color: C.danger }}>
                  <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                  <span>{pwError}</span>
                </div>
              )}
              <Button type="submit" disabled={pwSaving} className="justify-center">
                {pwSaving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
                Simpan Kata Sandi Baru
              </Button>
            </form>
          )}
        </div>
      </div>
    );
  }

  if (myRole !== "admin" && myIsPaid === false) {
    return <PaywallLocked myId={myId} userEmail={session?.user?.email} onLogout={onLogout} onPaidSuccess={() => setMyIsPaid(true)} />;
  }
  const TABS = [
    { key: "beranda", label: "Beranda", icon: Home },
    { key: "kelas", label: "Kelas", icon: Users },
    { key: "mapel", label: "Mapel", icon: BookOpen },
    { key: "pertemuan", label: "Pertemuan", icon: CalendarCheck },
    { key: "nilai", label: "Nilai", icon: ClipboardList },
    { key: "rekap", label: "Rekap", icon: BarChart3 },
    { key: "profil", label: "Profil", icon: User },
    ...(myRole === "admin" ? [{ key: "admin", label: "Admin", icon: GraduationCap }] : []),
  ];

  return (
    <div className="ng-app-root" style={{ background: C.bg, color: C.ink, fontFamily: F_BODY, position: "relative" }}>
      <style>{FONTS}</style>

      <header className={`ng-topbar sticky top-0 z-30${scrolled ? " ng-topbar-compact" : ""}`}>
        <div className="ng-topbar-inner">
          <div className="ng-brand">
            <div className="ng-brand-mark"><Logo size={38} rounded="rounded-xl" /></div>
            <div className="ng-brand-copy">
              <div className="ng-brand-eyebrow">Teacher Workspace</div>
              <div className="ng-brand-title">Ngajar<span>Gueh</span></div>
              <div className="ng-brand-sub">Absensi · Nilai · Rekap</div>
            </div>
          </div>

          <div className="ng-semester-col">
            <div className="ng-semester-wrap">
              <span className="ng-semester-meta">Semester aktif</span>
              <select value={data.currentSemester} onChange={(e) => update((d) => { d.currentSemester = e.target.value; })}
                className="ng-semester-select">
                {data.semesters.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="ng-save-caption" title={saveState === "error" ? "Penyimpanan gagal" : saveState === "saving" ? "Sedang menyimpan perubahan" : "Semua perubahan tersimpan"}>
              <span className="ng-save-dot" style={{ background: saveState === "error" ? C.danger : saveState === "saving" ? C.accent : C.primaryMuted }} />
              <span className="ng-save-caption-text">
                {saveState === "saving" ? "Menyimpan perubahan…" : saveState === "error" ? "Penyimpanan gagal" : "Data tersimpan"} · Cloud
              </span>
            </div>
          </div>

          <div className="ng-topbar-right">
            <button 
              onClick={() => setTab("profil")}
              className="ng-account ng-press cursor-pointer border-0 text-left" 
              title="Edit Profil"
            >
              {myAvatarUrl ? (
                <img 
                  src={myAvatarUrl} 
                  alt="Avatar" 
                  className="w-[29px] h-[29px] rounded-full object-cover shrink-0" 
                />
              ) : (
                <span className="ng-account-avatar">
                  {(myNickname || myName || "?").trim().charAt(0).toUpperCase()}
                </span>
              )}
              <span className="ng-account-name">
                {myNickname || myName || "Memuat…"}
              </span>
            </button>

            <div className="ng-actions">
              <a
                href={waLink("Halo, saya butuh bantuan di NgajarGueh.")}
                target="_blank"
                rel="noopener noreferrer"
                className="ng-press ng-action-btn ng-action-wa"
                title="Hubungi Admin lewat WhatsApp"
                aria-label="Hubungi Admin lewat WhatsApp"
              >
                <MessageCircle size={15} />
                <span className="ng-action-label">Bantuan</span>
              </a>

              <button
                onClick={async () => { await supabase.auth.signOut(); onLogout?.(); }}
                className="ng-press ng-action-btn ng-action-logout"
                title="Keluar dari akun"
                aria-label="Keluar dari akun"
              >
                <LogOut size={15} />
                <span className="ng-action-label">Keluar</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {myRole === "admin" && (
        <div
          className="flex flex-wrap items-center gap-2.5 px-4 py-2.5 relative z-20"
          style={{
            background: viewingOwnerId !== myId ? C.danger : C.surfaceAlt,
            color: viewingOwnerId !== myId ? "#fff" : C.ink,
          }}
        >
          <ClipboardList size={15} />
          <span className="text-xs font-semibold">
            {viewingOwnerId !== myId
              ? `MODE ADMIN — sedang mengedit data milik ${teacherList.find((t) => t.id === viewingOwnerId)?.nama || "guru lain"}`
              : "Mode Admin — lihat/kelola data guru lain:"}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <div style={{ minWidth: 200 }}>
              <Select
                value={viewingOwnerId}
                onChange={setViewingOwnerId}
                options={[
                  { value: myId, label: "Data saya sendiri" },
                  ...teacherList.filter((t) => t.id !== myId).map((t) => ({ value: t.id, label: `${t.nama}${t.role === "admin" ? " (admin)" : ""}` })),
                ]}
              />
            </div>
            {viewingOwnerId !== myId && (
              <Button size="sm" variant="ghost" onClick={() => setViewingOwnerId(myId)}>Kembali ke akun saya</Button>
            )}
          </div>
        </div>
      )}

      <main key={tab} className="ng-main-shell ng-app-enter">
        {tab === "beranda" && (
          <TabBeranda
            data={data} setTab={setTab} kelasMap={kelasMap} mapelMap={mapelMap}
            onExportAll={exportAllData} onImportClick={triggerImportPicker}
            displayName={
              viewingOwnerId === myId 
                ? `${myName}${myGelar ? `, ${myGelar}` : ""}` 
                : (teacherList.find((t) => t.id === viewingOwnerId)?.nama || "")
            }
            sekolah={viewingOwnerId === myId ? mySekolah : ""}
          />
        )}
        {tab === "kelas" && <TabKelas data={data} update={update} />}
        {tab === "mapel" && <TabMapel data={data} update={update} />}
        {tab === "pertemuan" && <TabPertemuan data={data} update={update} kelasMap={kelasMap} mapelMap={mapelMap} />}
        {tab === "nilai" && <TabNilai data={data} update={update} kelasMap={kelasMap} mapelMap={mapelMap} />}
        {tab === "rekap" && <TabRekap data={data} kelasMap={kelasMap} mapelMap={mapelMap} />}
        {tab === "profil" && (
          <TabProfil
            myId={myId}
            profile={{
              nama: myName,
              nama_panggilan: myNickname,
              gelar: myGelar,
              sekolah: mySekolah,
              avatar_url: myAvatarUrl
            }}
            onSaved={(updated) => {
              setMyName(updated.nama);
              setMyNickname(updated.nama_panggilan);
              setMyGelar(updated.gelar);
              setMySekolah(updated.sekolah);
              setMyAvatarUrl(updated.avatar_url);
            }}
          />
        )}
        {tab === "admin" && myRole === "admin" && (
          <TabAdmin
            teacherList={teacherList}
            teacherCounts={teacherCounts}
            myId={myId}
            onOpenTeacher={(id) => { setViewingOwnerId(id); setTab("beranda"); }}
            onTogglePaid={togglePaid}
          />
        )}
      </main>

      {/* floating dock nav */}
      <nav className="fixed bottom-4 left-4 right-4 z-30 mx-auto max-w-md ng-dock">
        <div className="ng-dock-inner relative flex items-center rounded-full p-1"
          style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(14px)", boxShadow: "0 10px 30px rgba(42,35,24,0.16)" }}>
          {TABS.map((t) => {
            const Icon = t.icon; const active = tab === t.key;
            return (
              <button key={t.key} onClick={() => setTab(t.key)}
                className="relative z-10 flex-1 flex flex-col items-center justify-center gap-0.5 py-1">
                <span className="flex items-center justify-center rounded-full transition-all"
                  style={{ width: 34, height: 34, background: active ? C.primarySoft : "transparent", transitionDuration: "250ms" }}>
                  <Icon size={15} style={{ color: active ? C.primary : C.muted }} strokeWidth={active ? 2.4 : 1.8} />
                </span>
                <span className="text-[9px] font-semibold" style={{ color: active ? C.primary : C.muted }}>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {showSplash && (
        <div className={`ng-splash-overlay fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 ${splashExiting ? "ng-splash-exit" : ""}`}
          style={{ background: C.brown, color: "#fff" }}>
          <div className="relative flex items-center justify-center">
            <div className="ng-glow absolute rounded-full" style={{ width: 130, height: 130, background: C.primaryMuted, filter: "blur(28px)" }} />
            <div className="ng-splash-logo relative"><Logo size={92} rounded="rounded-3xl" /></div>
          </div>
          <div className="text-center ng-splash-text">
            <p style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 22 }}>NgajarGueh</p>
            <p className="text-xs opacity-60 mt-1">Absensi & nilai, beres di satu tempat</p>
          </div>
          <div className="flex gap-1.5 mt-1 ng-splash-dots">
            <span className="ng-dot" /><span className="ng-dot" /><span className="ng-dot" />
          </div>
        </div>
      )}

      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleImportFile} />
      <ImportConfirm preview={importPreview} current={data} onCancel={() => setImportPreview(null)} onConfirm={confirmImport} />
      <ImportErrorModal message={importError} onClose={() => setImportError("")} />
      <MigrationOffer legacyData={migrationOffer} migrating={migrating} onSkip={skipMigration} onConfirm={confirmMigration} />

      {importDone && createPortal(
        <div className="ng-overlay-in fixed bottom-24 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold"
          style={{ background: C.brown, color: "#fff", boxShadow: "0 10px 30px rgba(42,35,24,0.3)" }}>
          <CheckCircle2 size={16} style={{ color: C.primaryMuted }} />
          Data berhasil diimpor
        </div>,
        document.body
      )}
    </div>
  );
}

// ================= TAB: BERANDA =================
function TabBeranda({ data, setTab, kelasMap, mapelMap, onExportAll, onImportClick, displayName, sekolah }) {
  const [wrappedLink, setWrappedLink] = useState(null);
  const [generatingWrapped, setGeneratingWrapped] = useState(false);

  const jmlPertemuanSemester = data.pertemuan.filter((p) => p.semester === data.currentSemester).length;
  const jmlNilaiSemester = data.nilai.filter((n) => n.semester === data.currentSemester).length;
  const kehadiranSemester = useMemo(() => {
    let hadir = 0, total = 0;
    data.pertemuan.filter((p) => p.semester === data.currentSemester).forEach((p) => {
      Object.values(p.absensi || {}).forEach((v) => { total++; if (v === "H") hadir++; });
    });
    return total ? Math.round((hadir / total) * 100) : null;
  }, [data.pertemuan, data.currentSemester]);
  
  const stats = [
    { label: "Kelas", value: data.kelas.length, icon: Users, ic: C.primary, tint: C.primarySoft, tab: "kelas" },
    { label: "Mapel", value: data.mapel.length, icon: BookOpen, ic: C.accentDark, tint: C.accentSoft, tab: "mapel" },
    { label: "Murid", value: data.siswa.length, icon: GraduationCap, ic: C.brownTint, tint: C.brownTintSoft, tab: "kelas" },
    { label: "Nilai", value: jmlNilaiSemester, icon: ClipboardList, ic: C.primaryMuted, tint: C.primaryMutedSoft, tab: "nilai" },
  ];
  const actions = [
    { label: "Catat Pertemuan", desc: "Absensi + materi hari ini", icon: CalendarCheck, tab: "pertemuan", tint: C.primarySoft, ic: C.primary },
    { label: "Input Nilai", desc: "Tugas, ulangan, ujian", icon: ClipboardList, tab: "nilai", tint: C.accentSoft, ic: C.accentDark },
    { label: "Lihat Rekap", desc: "Nilai akhir & ekspor Excel", icon: BarChart3, tab: "rekap", tint: C.primaryMutedSoft, ic: C.primaryMuted },
    { label: "Kelola Profil", desc: "Update foto & identitas", icon: User, tab: "profil", tint: C.brownTintSoft, ic: C.brownTint },
  ];
  const belumSetup = data.kelas.length === 0 || data.mapel.length === 0;

  const aktivitas = useMemo(() => {
    const p = data.pertemuan.map((x) => ({ type: "pertemuan", tanggal: x.tanggal, kelasId: x.kelasId, mapelId: x.mapelId, text: x.catatan || "Absensi dicatat" }));
    const n = data.nilai.map((x) => ({ type: "nilai", tanggal: x.tanggal, kelasId: x.kelasId, mapelId: x.mapelId, text: `${x.label} · ${KATEGORI.find((k) => k.key === x.kategori)?.label}` }));
    return [...p, ...n].sort((a, b) => b.tanggal.localeCompare(a.tanggal)).slice(0, 5);
  }, [data.pertemuan, data.nilai]);

  // LOGIKA KALKULATOR NGAJAR WRAPPED (EDISI BULANAN)
  const handleGenerateWrapped = async () => {
    setGeneratingWrapped(true);
    try {
      // 1. Ambil ID User
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Gagal mengambil data akun.");

      // --- FILTER DATA CUMA UNTUK BULAN INI ---
      const today = new Date();
      // Hasilnya misal: "SEPTEMBER 2026" (Buat judul di poster)
      const namaBulanIni = today.toLocaleString('id-ID', { month: 'long', year: 'numeric' }).toUpperCase(); 
      // Hasilnya misal: "2026-09" (Buat filter database)
      const filterBulan = today.toISOString().substring(0, 7); 

      // Saring data pertemuan & nilai yang tanggalnya ada di bulan ini
      const pertemuanBulanIni = data.pertemuan.filter(p => p.tanggal && p.tanggal.startsWith(filterBulan));
      const nilaiBulanIni = data.nilai.filter(n => n.tanggal && n.tanggal.startsWith(filterBulan));

      const totalSesiBulanIni = pertemuanBulanIni.length;
      const totalNilaiBulanIni = nilaiBulanIni.length;

      // 2. Hitung Metrik Disiplin Kelas (Pake data bulanan)
      let kelasStats = {};
      pertemuanBulanIni.forEach(p => {
        if (!kelasStats[p.kelasId]) kelasStats[p.kelasId] = { H: 0, total: 0 };
        Object.values(p.absensi || {}).forEach(status => {
          kelasStats[p.kelasId].total += 1;
          if (status === 'H') kelasStats[p.kelasId].H += 1;
        });
      });

      let bestClassId = null;
      let bestPercent = -1; 

      // Putaran 1: Kandidat dengan minimal 4 titik data
      Object.entries(kelasStats).forEach(([cId, stat]) => {
        if (stat.total >= 4) {
          const pct = (stat.H / stat.total) * 100;
          if (pct > bestPercent) { 
            bestPercent = pct; 
            bestClassId = cId; 
          }
        }
      });

      // Putaran 2 (Fallback): Kalau guru baru masukin data sedikit
      if (!bestClassId) {
        Object.entries(kelasStats).forEach(([cId, stat]) => {
          if (stat.total > 0) {
            const pct = (stat.H / stat.total) * 100;
            if (pct > bestPercent) { 
              bestPercent = pct; 
              bestClassId = cId; 
            }
          }
        });
      }

      // 3. Susun Data Mentah buat Disimpan (Pake variabel bulanan)
      const payload = {
        owner_id: user.id,
        semester: namaBulanIni, // Mengganti "GANJIL 2026/2027" jadi nama bulan
        total_sesi: totalSesiBulanIni,
        total_nilai: totalNilaiBulanIni,
        kelas_terbaik_nama: bestClassId ? (kelasMap[bestClassId]?.nama || "Belum ada") : "Belum ada",
        kelas_terbaik_persen: bestClassId ? bestPercent : 0,
        nama_guru: displayName,
        sekolah: sekolah || ""
      };

      // 4. Lempar ke Supabase & Ambil UUID-nya
      const { data: inserted, error } = await supabase
        .from('wrapped_snapshots')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;

      // 5. Bikin Link Publik
      const link = `${window.location.origin}/?wrapped=${inserted.id}`;
      setWrappedLink(link);
    } catch (err) {
      console.error("Gagal buat wrapped:", err);
      alert("Gagal membuat Ngajar Wrapped.");
    } finally {
      setGeneratingWrapped(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(wrappedLink);
    alert("Link berhasil disalin! Tinggal paste di Story IG / WA.");
  };

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[22px] p-5" style={{ background: C.brown, color: "#fff" }}>
        {/* decorative cluster — solid outlines only, no gradient/blur */}
        <div className="absolute -right-4 -top-6 pointer-events-none" style={{ opacity: 0.09 }}>
          <BookOpen size={88} strokeWidth={1.3} />
        </div>
        <div className="absolute right-[62px] top-9 pointer-events-none" style={{ opacity: 0.16, transform: "rotate(-14deg)" }}>
          <GraduationCap size={30} strokeWidth={1.5} />
        </div>
        <div className="absolute right-7 bottom-4 pointer-events-none" style={{ opacity: 0.22 }}>
          <Sparkles size={18} strokeWidth={1.6} />
        </div>
        <div className="absolute -left-9 -bottom-11 rounded-full pointer-events-none" style={{ width: 140, height: 140, border: "1.5px solid rgba(255,255,255,0.07)" }} />
        <div className="absolute left-1 bottom-1 rounded-full pointer-events-none" style={{ width: 54, height: 54, border: "1.5px solid rgba(255,255,255,0.09)" }} />

        <div className="relative flex items-center gap-3 mb-3 pr-10">
          <Logo size={44} />
          <div className="min-w-0">
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2.5 py-1 rounded-full mb-1.5" style={{ background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.85)", letterSpacing: "0.04em" }}>
              {data.currentSemester}
            </span>
            <h1 style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: 21 }}>Halo, {displayName || "Bapak/Ibu Guru"} <span className="ng-wave">👋</span></h1>
            {sekolah && (
              <div className="flex items-center gap-1.5 mt-1 opacity-80 text-xs">
                <School size={13} />
                <span className="truncate">{sekolah}</span>
              </div>
            )}
          </div>
        </div>
        <p className="relative text-sm mt-3 opacity-75 leading-relaxed">Absensi, catatan pembelajaran, dan nilai murid — semuanya dari satu tempat.</p>
      </div>

{/* BANNER NGAJAR WRAPPED (WARNA EMAS KONTRAS) */}
      {!belumSetup && jmlPertemuanSemester > 0 && (
        <div className="rounded-[24px] p-6 relative overflow-hidden mt-4" style={{ background: 'linear-gradient(135deg, #BE9A34 0%, #8C6A22 100%)', color: '#fff', boxShadow: '0 8px 24px rgba(190,154,52,0.25)' }}>
          <Award className="absolute -right-4 -bottom-4 opacity-20" size={140} />
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-2xl rounded-full" />
          
          <div className="relative z-10">
            <h2 className="text-xl font-black mb-2" style={{ fontFamily: F_DISPLAY }}>Waktunya Ngajar Wrapped! 🎉</h2>
            <p className="text-[13px] text-white/90 mb-5 leading-relaxed max-w-[90%] font-medium">Berapa banyak kelas yang sudah Anda bimbing semester ini? Yuk, buat infografis rekap mengajar Anda dan bagikan momen serunya ke teman-teman!</p>
            <button 
              onClick={handleGenerateWrapped} 
              disabled={generatingWrapped}
              className="bg-[#241C12] text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 hover:bg-[#3B3222]"
            >
              {generatingWrapped ? <RefreshCw size={16} className="animate-spin" /> : <Award size={16} />}
              {generatingWrapped ? "Memproses Data..." : "Buat Ngajar Wrapped Saya"}
            </button>
          </div>
        </div>
      )}
            
      {/* Pop-up Link Share Wrapped */}
      {wrappedLink && createPortal(
        <div className="ng-overlay-in fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onClick={() => setWrappedLink(null)}>
          <div onClick={(e) => e.stopPropagation()} className="ng-modal-in w-full max-w-sm rounded-3xl p-6 text-center" style={{ background: C.surface, boxShadow: "0 20px 50px rgba(36,28,18,0.35)" }}>
            <div className="mx-auto w-16 h-16 bg-[#BE9A34]/20 text-[#BE9A34] rounded-full flex items-center justify-center mb-4"><Sparkles size={32} /></div>
            <h3 className="font-bold text-xl mb-2" style={{ color: C.ink, fontFamily: F_DISPLAY }}>Wrapped Berhasil Dibuat!</h3>
            <p className="text-sm mb-5" style={{ color: C.muted }}>Salin link di bawah ini dan bagikan ke media sosialmu (atau cek dulu link-nya di tab baru).</p>
            
            <div className="bg-gray-100 p-3 rounded-xl flex items-center gap-2 mb-4 overflow-hidden border border-gray-200">
              <span className="text-xs truncate flex-1 text-gray-600 font-mono">{wrappedLink}</span>
            </div>

            <div className="flex gap-2">
              <Button variant="ghost" className="flex-1" onClick={() => window.open(wrappedLink, '_blank')}>Lihat Hasil</Button>
              <Button variant="accent" className="flex-1" onClick={copyToClipboard}>Salin Link</Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {belumSetup ? (
        <Card>
          <SectionHead title="Mulai di sini" subtitle="Sebelum mulai mencatat, siapkan dulu data dasarnya." />
          <div className="flex flex-col gap-2">
            <Button onClick={() => setTab("kelas")}><Users size={16} />Buat Kelas & Tambah Murid</Button>
            <Button onClick={() => setTab("mapel")} variant="ghost"><BookOpen size={16} />Tambah Mata Pelajaran</Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {stats.map((s) => (
              <button
                key={s.label}
                onClick={() => setTab(s.tab)}
                className="ng-list-row relative overflow-hidden flex flex-col items-start gap-2.5 rounded-2xl p-4 text-left active:scale-[0.97]"
                style={{ background: C.surface, boxShadow: "0 2px 14px rgba(42,35,24,0.06)" }}
              >
                <s.icon size={64} strokeWidth={1.4} className="absolute -right-3 -bottom-4 pointer-events-none" style={{ color: s.ic, opacity: 0.08 }} />
                <div className="relative w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.tint }}>
                  <s.icon size={18} style={{ color: s.ic }} />
                </div>
                <div className="relative">
                  <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 24, color: C.ink, lineHeight: 1 }}>{s.value}</div>
                  <div className="text-[11px] font-semibold mt-1" style={{ color: C.muted }}>{s.label}</div>
                </div>
              </button>
            ))}
          </div>

          <Card>
            <SectionHead title="Aksi Cepat" />
            <div className="flex flex-col gap-2">
              {actions.map((a) => (
                <button key={a.tab} onClick={() => setTab(a.tab)}
                  className="ng-list-row flex items-center gap-3 rounded-2xl p-3.5 text-left"
                  style={{ background: C.surfaceAlt }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-200" style={{ background: a.tint }}>
                    <a.icon size={18} style={{ color: a.ic }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: C.ink }}>{a.label}</div>
                    <div className="text-xs" style={{ color: C.muted }}>{a.desc}</div>
                  </div>
                  <ArrowRight size={16} style={{ color: C.muted }} />
                </button>
              ))}
            </div>
          </Card>
        </>
      )}

      <Card>
        <SectionHead title="Aktivitas Terbaru" subtitle={`${jmlNilaiSemester} data nilai tercatat semester ini`} />
        {aktivitas.length === 0 ? (
          <Empty icon={CalendarCheck} text="Belum ada aktivitas. Mulai dari Catat Pertemuan atau Input Nilai." />
        ) : (
          <ul className="space-y-2">
            {aktivitas.map((a, i) => {
              const Icon = a.type === "pertemuan" ? CalendarCheck : ClipboardList;
              const tint = a.type === "pertemuan" ? C.primarySoft : C.accentSoft;
              const ic = a.type === "pertemuan" ? C.primary : C.accentDark;
              return (
                <li key={i} className="ng-list-row flex items-center gap-3 rounded-2xl p-3" style={{ background: C.surfaceAlt }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: tint }}>
                    <Icon size={15} style={{ color: ic }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: C.ink }}>{a.text}</p>
                    <p className="text-xs mt-0.5" style={{ color: C.muted }}>{fmtDate(a.tanggal)} · {kelasMap[a.kelasId]?.nama} · {mapelMap[a.mapelId]?.nama}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card>
        <SectionHead
          title="Backup & Pindah Perangkat"
          subtitle="Simpan seluruh data ke satu file Excel yang rapi dan mudah dibaca. File ini dipakai khusus untuk cadangan atau memindahkan data lengkap ke HP/laptop lain."
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onExportAll} variant="ghost" className="flex-1"><Download size={16} />Ekspor Data Lengkap</Button>
          <Button onClick={onImportClick} variant="accent" className="flex-1"><Upload size={16} />Impor Data Lengkap</Button>
        </div>
        <p className="text-[11px] mt-3 leading-relaxed" style={{ color: C.muted }}>
          <strong>Catatan:</strong> impor akan <strong>mengganti seluruh data</strong> di perangkat ini, bukan menggabungkannya. Untuk pindah perangkat: ekspor di perangkat lama → kirim file → impor di perangkat baru.
        </p>
      </Card>
    </div>
  );
}

// ================= TAB: KELAS & SISWA =================
function TabKelas({ data, update }) {
  const [selKelas, setSelKelas] = useState(data.kelas[0]?.id || "");
  const [newKelas, setNewKelas] = useState("");
  const [newSiswa, setNewSiswa] = useState("");
  const [bulk, setBulk] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  useEffect(() => { if (!data.kelas.find((k) => k.id === selKelas)) setSelKelas(data.kelas[0]?.id || ""); }, [data.kelas]);

  const addKelas = () => {
    if (!newKelas.trim()) return;
    const id = genId();
    update((d) => d.kelas.push({ id, nama: newKelas.trim() }));
    setNewKelas(""); setSelKelas(id);
  };
  const delKelas = (id) => {
    update((d) => {
      d.kelas = d.kelas.filter((k) => k.id !== id);
      d.siswa = d.siswa.filter((s) => s.kelasId !== id);
      d.pertemuan = d.pertemuan.filter((p) => p.kelasId !== id);
      d.nilai = d.nilai.filter((n) => n.kelasId !== id);
    });
    setConfirmDel(null);
  };
  const addSiswa = () => {
    if (!newSiswa.trim() || !selKelas) return;
    update((d) => d.siswa.push({ id: genId(), nama: newSiswa.trim(), kelasId: selKelas }));
    setNewSiswa("");
  };
  const addBulk = () => {
    const names = bulk.split("\n").map((s) => s.trim()).filter(Boolean);
    if (!names.length || !selKelas) return;
    update((d) => { names.forEach((n) => d.siswa.push({ id: genId(), nama: n, kelasId: selKelas })); });
    setBulk("");
  };
  const delSiswa = (id) => update((d) => { d.siswa = d.siswa.filter((s) => s.id !== id); });
  const renameSiswa = (id, nama) => update((d) => { d.siswa.find((s) => s.id === id).nama = nama; });

  const kelasSorted = sortByNama(data.kelas);
  const siswaInKelas = sortByNama(data.siswa.filter((s) => s.kelasId === selKelas));

  return (
    <div className="space-y-4">
      <Guide>Mulai dari sini. Buat kelas dulu (misal 7B), lalu tambahkan murid ke kelasnya — bisa satu-satu atau tempel banyak nama sekaligus. Nama murid bisa langsung diedit dengan mengetik di kolomnya.</Guide>
      <Card>
        <SectionHead title="Kelas" subtitle="Buat kelas, lalu pilih salah satu untuk mengelola daftar muridnya." />
        <div className="flex flex-wrap gap-2 mb-3">
          {kelasSorted.map((k) => (
            <button key={k.id} onClick={() => setSelKelas(k.id)}
              className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition"
              style={{ background: selKelas === k.id ? C.primary : C.surfaceAlt, color: selKelas === k.id ? "#fff" : C.ink }}>
              {k.nama}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newKelas} onChange={(e) => setNewKelas(e.target.value)} placeholder="Nama kelas baru, mis. 7B"
            className={inputCls} style={baseInputStyle} onKeyDown={(e) => e.key === "Enter" && addKelas()} />
          <Button onClick={addKelas}><Plus size={16} />Tambah</Button>
        </div>
      </Card>

      {selKelas && (
        <Card>
          <div className="flex items-center justify-between mb-1">
            <h2 style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: 19 }}>Murid — {data.kelas.find((k) => k.id === selKelas)?.nama}</h2>
            <button onClick={() => setConfirmDel({ type: "kelas", id: selKelas })} className="text-xs font-medium transition hover:opacity-70" style={{ color: C.danger }}>Hapus kelas</button>
          </div>
          <p className="text-xs mb-4" style={{ color: C.muted }}>{siswaInKelas.length} murid terdaftar · ketuk nama untuk mengubahnya</p>

          {siswaInKelas.length === 0 ? (
            <Empty icon={Users} text="Belum ada murid di kelas ini. Tambahkan satu-satu, atau tempel daftar nama sekaligus di bawah." />
          ) : (
            <ul className="divide-y mb-4" style={{ borderColor: C.line }}>
              {siswaInKelas.map((s) => (
                <li key={s.id} className="flex items-center gap-2 py-2.5">
                  <input value={s.nama} onChange={(e) => renameSiswa(s.id, e.target.value)}
                    className="flex-1 text-sm bg-transparent outline-none px-1 py-1 rounded transition-colors"
                    style={{ color: C.ink, borderBottom: "1px dashed " + C.line }}
                    onFocus={(e) => { e.target.style.borderBottom = `1px dashed ${C.primary}`; }}
                    onBlur={(e) => { e.target.style.borderBottom = `1px dashed ${C.line}`; }} />
                  <button onClick={() => setConfirmDel({ type: "siswa", id: s.id })} className="ng-icon-btn rounded-full p-2" style={{ color: C.muted }}><Trash2 size={15} /></button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex gap-2 mb-3">
            <input value={newSiswa} onChange={(e) => setNewSiswa(e.target.value)} placeholder="Nama murid"
              className={inputCls} style={baseInputStyle} onKeyDown={(e) => e.key === "Enter" && addSiswa()} />
            <Button onClick={addSiswa} variant="ghost"><Plus size={16} /></Button>
          </div>

          <details>
            <summary className="text-xs font-semibold cursor-pointer" style={{ color: C.muted }}>Tempel banyak nama sekaligus (1 nama per baris)</summary>
            <div className="mt-2 flex flex-col gap-2">
              <textarea value={bulk} onChange={(e) => setBulk(e.target.value)} rows={4} placeholder={"Contoh:\nAhmad Fadli\nSiti Nur Aisyah\n..."}
                className={inputCls} style={baseInputStyle} />
              <Button onClick={addBulk} variant="ghost" size="sm"><ListPlus size={15} />Tambahkan semua</Button>
            </div>
          </details>
        </Card>
      )}

      <Confirm open={!!confirmDel} title={confirmDel?.type === "kelas" ? "Hapus kelas?" : "Hapus murid?"}
        desc={confirmDel?.type === "kelas" ? "Semua murid, absensi, dan nilai di kelas ini akan ikut terhapus. Tidak bisa dibatalkan." : "Riwayat absensi & nilai murid ini akan ikut terhapus. Tidak bisa dibatalkan."}
        onCancel={() => setConfirmDel(null)}
        onConfirm={() => confirmDel.type === "kelas" ? delKelas(confirmDel.id) : (delSiswa(confirmDel.id), setConfirmDel(null))} />
    </div>
  );
}

// ================= TAB: MAPEL & BOBOT =================
function TabMapel({ data, update }) {
  const [newMapel, setNewMapel] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);

  const addMapel = () => {
    if (!newMapel.trim()) return;
    update((d) => d.mapel.push({ id: genId(), nama: newMapel.trim(), bobot: defaultBobot() }));
    setNewMapel("");
  };
  const delMapel = (id) => {
    update((d) => {
      d.mapel = d.mapel.filter((m) => m.id !== id);
      d.pertemuan = d.pertemuan.filter((p) => p.mapelId !== id);
      d.nilai = d.nilai.filter((n) => n.mapelId !== id);
    });
    setConfirmDel(null);
  };
  const setBobot = (id, key, val) => update((d) => { d.mapel.find((m) => m.id === id).bobot[key] = Math.max(0, Math.min(100, Number(val) || 0)); });
  const setNama = (id, nama) => update((d) => { d.mapel.find((m) => m.id === id).nama = nama; });

  return (
    <div className="space-y-4">
      <Guide>Tambahkan mapel yang kamu ajar. Atur bobot nilai akhir raport per kategori (Tugas, UH, Praktek, UTS, UAS, Adab) — kategori yang gak dipakai boleh diisi 0. Bobot UTS & UAS terpisah dan bisa di-custom sendiri-sendiri sesuai ketentuan sekolah. Bobot ini yang dipakai buat hitung Nilai Akhir di tab Rekap.</Guide>
      <Card>
        <SectionHead title="Mata Pelajaran" subtitle="Tambahkan mapel yang kamu ajar. Bisa nambah lagi kapan saja." />
        <div className="flex gap-2">
          <input value={newMapel} onChange={(e) => setNewMapel(e.target.value)} placeholder="Nama mapel, mis. Bahasa Arab"
            className={inputCls} style={baseInputStyle} onKeyDown={(e) => e.key === "Enter" && addMapel()} />
          <Button onClick={addMapel}><Plus size={16} />Tambah</Button>
        </div>
      </Card>

      {data.mapel.length === 0 && <Card><Empty icon={BookOpen} text="Belum ada mapel. Tambahkan dulu di atas." /></Card>}

      {data.mapel.map((m) => {
        const sum = KATEGORI.reduce((a, k) => a + (m.bobot[k.key] || 0), 0);
        return (
          <Card key={m.id}>
            <div className="flex items-center justify-between mb-1">
              <input value={m.nama} onChange={(e) => setNama(m.id, e.target.value)}
                className="bg-transparent outline-none flex-1" style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: 18, color: C.ink }} />
              <button onClick={() => setConfirmDel(m.id)} className="ng-icon-btn rounded-full p-2" style={{ color: C.muted }}><Trash2 size={15} /></button>
            </div>
            <p className="text-xs mb-3" style={{ color: C.muted }}>Bobot nilai akhir raport — kategori yang tidak dipakai boleh diisi 0.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {KATEGORI.map((k) => (
                <div key={k.key} className="flex items-center gap-1.5 rounded-xl px-2.5 py-2" style={{ background: C.surfaceAlt }}>
                  <span className="text-xs flex-1" style={{ color: C.muted }}>{k.label}</span>
                  <input type="number" value={m.bobot[k.key]} onChange={(e) => setBobot(m.id, k.key, e.target.value)}
                    className="w-10 text-sm text-right bg-transparent outline-none" style={{ color: C.ink, fontFamily: F_MONO }} />
                  <span className="text-xs" style={{ color: C.muted }}>%</span>
                </div>
              ))}
            </div>
            <p className="text-xs font-semibold" style={{ color: sum === 100 ? C.primary : C.danger }}>Total bobot: {sum}% {sum !== 100 && "— idealnya 100%"}</p>
          </Card>
        );
      })}

      <Confirm open={!!confirmDel} title="Hapus mapel?" desc="Semua catatan pertemuan dan nilai untuk mapel ini akan ikut terhapus."
        onCancel={() => setConfirmDel(null)} onConfirm={() => delMapel(confirmDel)} />
    </div>
  );
}

// ---- reusable attendance row ----
function AbsensiList({ siswaList, absen, onCycle }) {
  return (
    <ul className="divide-y" style={{ borderColor: C.line }}>
      {siswaList.map((s) => {
        const stt = absen[s.id] || "H";
        return (
          <li key={s.id} className="ng-list-row flex items-center justify-between py-2.5 px-1.5 rounded-xl">
            <span className="text-sm">{s.nama}</span>
            <button onClick={() => onCycle(s.id)} className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-150 active:scale-90 hover:scale-105"
              style={{ background: STATUS[stt].soft, color: STATUS[stt].color, border: `2px solid ${STATUS[stt].color}`, fontFamily: F_MONO }}>
              {stt}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

// ================= TAB: PERTEMUAN =================
function TabPertemuan({ data, update, kelasMap, mapelMap }) {
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [tanggal, setTanggal] = useState(todayISO());
  const [catatan, setCatatan] = useState("");
  const [absen, setAbsen] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [editState, setEditState] = useState(null);

  const siswaKelas = sortByNama(data.siswa.filter((s) => s.kelasId === kelasId));

  useEffect(() => { const init = {}; siswaKelas.forEach((s) => { init[s.id] = "H"; }); setAbsen(init); }, [kelasId]);

  const cycle = (siswaId) => setAbsen((prev) => {
    const cur = prev[siswaId] || "H"; const idx = STATUS_ORDER.indexOf(cur);
    return { ...prev, [siswaId]: STATUS_ORDER[(idx + 1) % STATUS_ORDER.length] };
  });

  const save = () => {
    if (!kelasId || !mapelId) return;
    update((d) => d.pertemuan.push({ id: genId(), kelasId, mapelId, tanggal, catatan, semester: d.currentSemester, absensi: absen }));
    setCatatan(""); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 1800);
  };
  const delPertemuan = (id) => { update((d) => { d.pertemuan = d.pertemuan.filter((p) => p.id !== id); }); setConfirmDel(null); setOpenId(null); };
  const openRow = (p) => {
    if (openId === p.id) { setOpenId(null); setEditState(null); return; }
    setOpenId(p.id); setEditState({ id: p.id, tanggal: p.tanggal, catatan: p.catatan || "", absensi: { ...p.absensi } });
  };
  const cycleEdit = (siswaId) => setEditState((prev) => {
    const cur = prev.absensi[siswaId] || "H"; const idx = STATUS_ORDER.indexOf(cur);
    return { ...prev, absensi: { ...prev.absensi, [siswaId]: STATUS_ORDER[(idx + 1) % STATUS_ORDER.length] } };
  });
  const saveEdit = () => {
    update((d) => { const p = d.pertemuan.find((x) => x.id === editState.id); p.tanggal = editState.tanggal; p.catatan = editState.catatan; p.absensi = editState.absensi; });
    setOpenId(null); setEditState(null);
  };

  const riwayat = data.pertemuan.filter((p) => (!kelasId || p.kelasId === kelasId) && (!mapelId || p.mapelId === mapelId)).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const noSetup = data.kelas.length === 0 || data.mapel.length === 0;

  return (
    <div className="space-y-4">
      <Guide>Setiap kali ngajar, pilih kelas & mapel, tandai kehadiran tiap murid (ketuk lingkarannya buat ganti H/I/S/A), lalu tulis materi yang diajarkan. Riwayat pertemuan ada di bawah — ketuk salah satu buat lihat rinciannya atau mengubahnya.</Guide>
      {noSetup ? (
        <Card><Empty icon={CalendarCheck} text="Tambahkan minimal 1 kelas dan 1 mapel dulu sebelum mencatat pertemuan." /></Card>
      ) : (
        <>
          <Card>
            <SectionHead title="Catat Pertemuan" subtitle="Absen murid, lalu catat materi yang diajarkan hari ini." />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Field label="Kelas" error={!kelasId}><Select value={kelasId} onChange={setKelasId} invalid placeholder="Pilih kelas" options={sortByNama(data.kelas).map((k) => ({ value: k.id, label: k.nama }))} /></Field>
              <Field label="Mapel" error={!mapelId}><Select value={mapelId} onChange={setMapelId} invalid placeholder="Pilih mapel" options={data.mapel.map((m) => ({ value: m.id, label: m.nama }))} /></Field>
            </div>
            <Field label="Tanggal"><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} style={baseInputStyle} /></Field>

            {kelasId && mapelId && (
              <>
                <div className="mt-4 mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Absensi · {siswaKelas.length} murid</div>
                {siswaKelas.length === 0 ? <p className="text-xs" style={{ color: C.muted }}>Kelas ini belum ada muridnya.</p> : <div className="mb-3"><AbsensiList siswaList={siswaKelas} absen={absen} onCycle={cycle} /></div>}
                <Field label="Rekap pembelajaran (materi / kegiatan hari ini)">
                  <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={3} placeholder="Contoh: Bab 3 - Kosakata keluarga, latihan menulis 10 kalimat" className={inputCls} style={baseInputStyle} />
                </Field>
                <div className="flex items-center gap-3 mt-4">
                  <Button onClick={save}><Save size={16} />Simpan Pertemuan</Button>
                  {savedMsg && <span className="text-xs font-semibold" style={{ color: C.primary }}>Tersimpan ✓</span>}
                </div>
              </>
            )}
          </Card>

          <Card>
            <SectionHead title="Riwayat Pertemuan" subtitle="Ketuk salah satu untuk melihat atau mengubah lagi." />
            {riwayat.length === 0 ? <Empty icon={CalendarCheck} text="Belum ada pertemuan tercatat untuk filter kelas/mapel ini." /> : (
              <ul className="space-y-2">
                {riwayat.slice(0, 30).map((p) => {
                  const isOpen = openId === p.id; const siswaP = sortByNama(data.siswa.filter((s) => s.kelasId === p.kelasId));
                  return (
                    <li key={p.id} className="ng-list-row rounded-2xl overflow-hidden" style={{ background: C.surfaceAlt }}>
                      <button onClick={() => openRow(p)} className="w-full flex items-start justify-between gap-2 p-3.5 text-left">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: C.primary }}>{fmtDate(p.tanggal)} · {kelasMap[p.kelasId]?.nama} · {mapelMap[p.mapelId]?.nama}</p>
                          {p.catatan && <p className="text-xs mt-0.5" style={{ color: C.muted }}>{p.catatan}</p>}
                        </div>
                        <ChevronDown size={16} className={`ng-chevron shrink-0 mt-0.5 ${isOpen ? "ng-chevron-open" : ""}`} style={{ color: C.muted }} />
                      </button>
                      {isOpen && editState && (
                        <div className="ng-row-in p-3.5 pt-0 border-t" style={{ borderColor: C.line, background: C.surface }}>
                          <div className="mt-3.5 mb-2"><Field label="Tanggal"><input type="date" value={editState.tanggal} onChange={(e) => setEditState((s) => ({ ...s, tanggal: e.target.value }))} className={inputCls} style={baseInputStyle} /></Field></div>
                          <div className="mb-3"><AbsensiList siswaList={siswaP} absen={editState.absensi} onCycle={cycleEdit} /></div>
                          <Field label="Rekap pembelajaran"><textarea value={editState.catatan} onChange={(e) => setEditState((s) => ({ ...s, catatan: e.target.value }))} rows={3} className={inputCls} style={baseInputStyle} /></Field>
                          <div className="flex items-center gap-2 mt-3.5">
                            <Button onClick={saveEdit} size="sm"><Save size={14} />Simpan Perubahan</Button>
                            <Button onClick={() => setConfirmDel(p.id)} variant="danger" size="sm"><Trash2 size={14} />Hapus</Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
      <Confirm open={!!confirmDel} title="Hapus catatan pertemuan?" desc="Data absensi di pertemuan ini akan ikut terhapus." onCancel={() => setConfirmDel(null)} onConfirm={() => delPertemuan(confirmDel)} />
    </div>
  );
}

// ================= TAB: NILAI =================
function TabNilai({ data, update, kelasMap, mapelMap }) {
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [kategori, setKategori] = useState("tugas");
  const [label, setLabel] = useState("");
  const [tanggal, setTanggal] = useState(todayISO());
  const [nilaiMap, setNilaiMap] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);
  const [savedMsg, setSavedMsg] = useState(false);
  const [openId, setOpenId] = useState(null);
  const [editState, setEditState] = useState(null);

  const siswaKelas = sortByNama(data.siswa.filter((s) => s.kelasId === kelasId));

  const save = () => {
    if (!kelasId || !mapelId || !label.trim()) return;
    update((d) => d.nilai.push({ id: genId(), kelasId, mapelId, kategori, label: label.trim(), tanggal, semester: d.currentSemester, nilai: nilaiMap }));
    setLabel(""); setNilaiMap({}); setSavedMsg(true); setTimeout(() => setSavedMsg(false), 1800);
  };
  const delNilai = (id) => { update((d) => { d.nilai = d.nilai.filter((n) => n.id !== id); }); setConfirmDel(null); setOpenId(null); };
  const openRow = (n) => {
    if (openId === n.id) { setOpenId(null); setEditState(null); return; }
    setOpenId(n.id); setEditState({ id: n.id, label: n.label, kategori: n.kategori, tanggal: n.tanggal, nilai: { ...n.nilai } });
  };
  const saveEdit = () => {
    update((d) => { const n = d.nilai.find((x) => x.id === editState.id); n.label = editState.label; n.kategori = editState.kategori; n.tanggal = editState.tanggal; n.nilai = editState.nilai; });
    setOpenId(null); setEditState(null);
  };

  const riwayat = data.nilai.filter((n) => (!kelasId || n.kelasId === kelasId) && (!mapelId || n.mapelId === mapelId)).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  const noSetup = data.kelas.length === 0 || data.mapel.length === 0;

  return (
    <div className="space-y-4">
      <Guide>Setiap ada tugas, ulangan, atau ujian, pilih kelas, mapel, dan kategori nilai, kasih nama (mis. "Tugas 1"), lalu isi nilai semua murid sekaligus. Riwayat penilaian ada di bawah — ketuk buat lihat rincian nilai tiap murid atau mengubahnya.</Guide>
      {noSetup ? (
        <Card><Empty icon={ClipboardList} text="Tambahkan minimal 1 kelas dan 1 mapel dulu sebelum input nilai." /></Card>
      ) : (
        <>
          <Card>
            <SectionHead title="Input Nilai" subtitle='Pilih kategori, kasih nama penilaiannya, lalu isi nilai semua murid sekaligus.' />
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Field label="Kelas" error={!kelasId}><Select value={kelasId} onChange={setKelasId} invalid placeholder="Pilih kelas" options={sortByNama(data.kelas).map((k) => ({ value: k.id, label: k.nama }))} /></Field>
              <Field label="Mapel" error={!mapelId}><Select value={mapelId} onChange={setMapelId} invalid placeholder="Pilih mapel" options={data.mapel.map((m) => ({ value: m.id, label: m.nama }))} /></Field>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <Field label="Kategori"><Select value={kategori} onChange={setKategori} options={KATEGORI.map((k) => ({ value: k.key, label: k.label }))} /></Field>
              <Field label="Tanggal"><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} className={inputCls} style={baseInputStyle} /></Field>
            </div>
            <Field label='Nama penilaian (mis. "Tugas 1", "UH Bab 3")' error={!label.trim()}>
              <input value={label} onChange={(e) => setLabel(e.target.value)} className={inputCls} style={st(!label.trim())} />
            </Field>

            {kelasId && mapelId && siswaKelas.length > 0 && (
              <>
                <div className="mt-4 mb-1 text-[11px] font-semibold uppercase tracking-wide" style={{ color: C.muted }}>Nilai per murid (0–100)</div>
                <ul className="divide-y mb-3" style={{ borderColor: C.line }}>
                  {siswaKelas.map((s) => (
                    <li key={s.id} className="flex items-center justify-between py-2.5">
                      <span className="text-sm">{s.nama}</span>
                      <input type="number" min={0} max={100} value={nilaiMap[s.id] ?? ""}
                        onChange={(e) => setNilaiMap((prev) => ({ ...prev, [s.id]: e.target.value === "" ? undefined : Number(e.target.value) }))}
                        placeholder="-" className="w-16 text-sm text-right rounded-lg px-2 py-1.5" style={{ ...baseInputStyle, fontFamily: F_MONO }} />
                    </li>
                  ))}
                </ul>
                <div className="flex items-center gap-3">
                  <Button onClick={save}><Save size={16} />Simpan Nilai</Button>
                  {savedMsg && <span className="text-xs font-semibold" style={{ color: C.primary }}>Tersimpan ✓</span>}
                </div>
              </>
            )}
          </Card>

          <Card>
            <SectionHead title="Riwayat Penilaian" subtitle="Ketuk salah satu untuk melihat rincian atau mengubah nilainya." />
            {riwayat.length === 0 ? <Empty icon={ClipboardList} text="Belum ada nilai tercatat untuk filter kelas/mapel ini." /> : (
              <ul className="space-y-2">
                {riwayat.slice(0, 30).map((n) => {
                  const isOpen = openId === n.id; const siswaN = sortByNama(data.siswa.filter((s) => s.kelasId === n.kelasId));
                  return (
                    <li key={n.id} className="ng-list-row rounded-2xl overflow-hidden" style={{ background: C.surfaceAlt }}>
                      <button onClick={() => openRow(n)} className="w-full flex items-start justify-between gap-2 p-3.5 text-left">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: C.primary }}>{n.label} · {KATEGORI.find((k) => k.key === n.kategori)?.label}</p>
                          <p className="text-xs mt-0.5" style={{ color: C.muted }}>{fmtDate(n.tanggal)} · {kelasMap[n.kelasId]?.nama} · {mapelMap[n.mapelId]?.nama} · {Object.keys(n.nilai || {}).length} murid dinilai</p>
                        </div>
                        <ChevronDown size={16} className={`ng-chevron shrink-0 mt-0.5 ${isOpen ? "ng-chevron-open" : ""}`} style={{ color: C.muted }} />
                      </button>
                      {isOpen && editState && (
                        <div className="ng-row-in p-3.5 pt-0 border-t" style={{ borderColor: C.line, background: C.surface }}>
                          <div className="grid grid-cols-2 gap-2 mt-3.5 mb-2">
                            <Field label="Kategori"><Select value={editState.kategori} onChange={(v) => setEditState((s) => ({ ...s, kategori: v }))} options={KATEGORI.map((k) => ({ value: k.key, label: k.label }))} /></Field>
                            <Field label="Tanggal"><input type="date" value={editState.tanggal} onChange={(e) => setEditState((s) => ({ ...s, tanggal: e.target.value }))} className={inputCls} style={baseInputStyle} /></Field>
                          </div>
                          <div className="mb-2"><Field label="Nama penilaian"><input value={editState.label} onChange={(e) => setEditState((s) => ({ ...s, label: e.target.value }))} className={inputCls} style={baseInputStyle} /></Field></div>
                          <div className="text-[11px] font-semibold uppercase tracking-wide mb-1" style={{ color: C.muted }}>Nilai per murid</div>
                          <ul className="divide-y mb-3" style={{ borderColor: C.line }}>
                            {siswaN.map((s) => (
                              <li key={s.id} className="flex items-center justify-between py-2.5">
                                <span className="text-sm">{s.nama}</span>
                                <input type="number" min={0} max={100} value={editState.nilai[s.id] ?? ""}
                                  onChange={(e) => setEditState((prev) => ({ ...prev, nilai: { ...prev.nilai, [s.id]: e.target.value === "" ? undefined : Number(e.target.value) } }))}
                                  placeholder="-" className="w-16 text-sm text-right rounded-lg px-2 py-1.5" style={{ ...baseInputStyle, fontFamily: F_MONO }} />
                              </li>
                            ))}
                          </ul>
                          <div className="flex items-center gap-2">
                            <Button onClick={saveEdit} size="sm"><Save size={14} />Simpan Perubahan</Button>
                            <Button onClick={() => setConfirmDel(n.id)} variant="danger" size="sm"><Trash2 size={14} />Hapus</Button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </>
      )}
      <Confirm open={!!confirmDel} title="Hapus data nilai ini?" desc="Nilai semua murid untuk penilaian ini akan terhapus." onCancel={() => setConfirmDel(null)} onConfirm={() => delNilai(confirmDel)} />
    </div>
  );
}

// ================= TAB: REKAP =================
function TabRekap({ data, kelasMap, mapelMap }) {
  const [kelasId, setKelasId] = useState("");
  const [mapelId, setMapelId] = useState("");
  const [bulanFilter, setBulanFilter] = useState("all");
  const mapel = data.mapel.find((m) => m.id === mapelId);
  const siswaKelas = sortByNama(data.siswa.filter((s) => s.kelasId === kelasId));

  const availableBulan = useMemo(() => {
    if (!kelasId || !mapelId) return [];
    const tanggalSet = new Set();
    data.nilai.forEach((n) => { if (n.kelasId === kelasId && n.mapelId === mapelId && n.semester === data.currentSemester) tanggalSet.add(n.tanggal.slice(0, 7)); });
    data.pertemuan.forEach((p) => { if (p.kelasId === kelasId && p.mapelId === mapelId && p.semester === data.currentSemester) tanggalSet.add(p.tanggal.slice(0, 7)); });
    return Array.from(tanggalSet)
      .sort((a, b) => b.localeCompare(a))
      .map((ym) => {
        const label = new Date(ym + "-02").toLocaleDateString("id-ID", { month: "long", year: "numeric" });
        return { value: ym, label: label.charAt(0).toUpperCase() + label.slice(1) };
      });
  }, [kelasId, mapelId, data.nilai, data.pertemuan, data.currentSemester]);

  useEffect(() => { setBulanFilter("all"); }, [kelasId, mapelId]);

  const rows = useMemo(() => {
    if (!kelasId || !mapelId) return [];
    let nilaiRelevan = data.nilai.filter((n) => n.kelasId === kelasId && n.mapelId === mapelId && n.semester === data.currentSemester);
    let pertemuanRelevan = data.pertemuan.filter((p) => p.kelasId === kelasId && p.mapelId === mapelId && p.semester === data.currentSemester);
    if (bulanFilter !== "all") {
      nilaiRelevan = nilaiRelevan.filter((n) => n.tanggal.slice(0, 7) === bulanFilter);
      pertemuanRelevan = pertemuanRelevan.filter((p) => p.tanggal.slice(0, 7) === bulanFilter);
    }
    return siswaKelas.map((s) => {
      const perKategori = {};
      KATEGORI.forEach((k) => {
        const entries = nilaiRelevan.filter((n) => n.kategori === k.key && n.nilai[s.id] !== undefined && n.nilai[s.id] !== null);
        perKategori[k.key] = entries.length ? entries.reduce((a, e) => a + Number(e.nilai[s.id]), 0) / entries.length : null;
      });
      let nilaiAkhir = null;
      if (mapel) {
        let totalBobot = 0, totalNilai = 0;
        KATEGORI.forEach((k) => { const b = mapel.bobot[k.key] || 0; if (b > 0 && perKategori[k.key] !== null) { totalBobot += b; totalNilai += perKategori[k.key] * b; } });
        nilaiAkhir = totalBobot > 0 ? totalNilai / totalBobot : null;
      }
      const absen = { H: 0, I: 0, S: 0, A: 0 };
      pertemuanRelevan.forEach((p) => { const stt = p.absensi?.[s.id]; if (stt && absen[stt] !== undefined) absen[stt]++; });
      return { siswa: s, perKategori, nilaiAkhir, absen };
    });
  }, [kelasId, mapelId, data.nilai, data.pertemuan, data.currentSemester, siswaKelas, mapel, bulanFilter]);

  const summary = useMemo(() => {
    if (!rows.length) return null;
    const perKategori = {};
    KATEGORI.forEach((k) => {
      const vals = rows.map((r) => r.perKategori[k.key]).filter((v) => v !== null && v !== undefined);
      perKategori[k.key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    });
    const nilaiAkhirVals = rows.map((r) => r.nilaiAkhir).filter((v) => v !== null && v !== undefined);
    const rataNilaiAkhir = nilaiAkhirVals.length ? nilaiAkhirVals.reduce((a, b) => a + b, 0) / nilaiAkhirVals.length : null;
    const absen = rows.reduce((acc, r) => {
      acc.H += r.absen.H; acc.I += r.absen.I; acc.S += r.absen.S; acc.A += r.absen.A;
      return acc;
    }, { H: 0, I: 0, S: 0, A: 0 });
    return { perKategori, rataNilaiAkhir, absen, jumlahMurid: nilaiAkhirVals.length };
  }, [rows]);

  const pertemuanRelevan = useMemo(() => {
    if (!kelasId || !mapelId) return [];
    return data.pertemuan
      .filter((p) => p.kelasId === kelasId && p.mapelId === mapelId && p.semester === data.currentSemester)
      .filter((p) => bulanFilter === "all" || p.tanggal.slice(0, 7) === bulanFilter)
      .slice()
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal));
  }, [kelasId, mapelId, data.pertemuan, data.currentSemester, bulanFilter]);

  const nilaiRelevanList = useMemo(() => {
    if (!kelasId || !mapelId) return [];
    return data.nilai
      .filter((n) => n.kelasId === kelasId && n.mapelId === mapelId && n.semester === data.currentSemester)
      .filter((n) => bulanFilter === "all" || n.tanggal.slice(0, 7) === bulanFilter)
      .slice()
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .map((n) => {
        const scores = Object.values(n.nilai || {}).filter((v) => v !== undefined && v !== null && v !== "").map(Number);
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
        return { ...n, avg, jumlahDinilai: scores.length };
      });
  }, [kelasId, mapelId, data.nilai, data.currentSemester, bulanFilter]);

  const exportExcel = async () => {
    const XLSX = await getXLSX();
    const sheetData = rows.map((r) => {
      const obj = { "Nama Murid": r.siswa.nama };
      KATEGORI.forEach((k) => { obj[k.label] = r.perKategori[k.key] !== null ? Number(r.perKategori[k.key].toFixed(1)) : ""; });
      obj["Nilai Akhir"] = r.nilaiAkhir !== null ? Number(r.nilaiAkhir.toFixed(1)) : "";
      obj["Hadir"] = r.absen.H; obj["Izin"] = r.absen.I; obj["Sakit"] = r.absen.S; obj["Alpa"] = r.absen.A;
      return obj;
    });
    if (summary) {
      const rataRow = { "Nama Murid": "RATA-RATA KELAS" };
      KATEGORI.forEach((k) => { rataRow[k.label] = summary.perKategori[k.key] !== null ? Number(summary.perKategori[k.key].toFixed(1)) : ""; });
      rataRow["Nilai Akhir"] = summary.rataNilaiAkhir !== null ? Number(summary.rataNilaiAkhir.toFixed(1)) : "";
      rataRow["Hadir"] = summary.absen.H; rataRow["Izin"] = summary.absen.I; rataRow["Sakit"] = summary.absen.S; rataRow["Alpa"] = summary.absen.A;
      sheetData.push(rataRow);
    }
    const ws = XLSX.utils.json_to_sheet(sheetData);
    ws["!cols"] = [{ wch: 24 }, ...KATEGORI.map(() => ({ wch: 12 })), { wch: 12 }, { wch: 7 }, { wch: 7 }, { wch: 7 }, { wch: 7 }];

    const wsPertemuan = XLSX.utils.json_to_sheet(
      pertemuanRelevan.length
        ? pertemuanRelevan.map((p) => ({ Tanggal: fmtDate(p.tanggal), "Materi / Kegiatan": p.catatan || "-" }))
        : [{ Tanggal: "", "Materi / Kegiatan": "" }]
    );
    wsPertemuan["!cols"] = [{ wch: 14 }, { wch: 70 }];

    const wsNilai = XLSX.utils.json_to_sheet(
      nilaiRelevanList.length
        ? nilaiRelevanList.map((n) => ({
            Tanggal: fmtDate(n.tanggal),
            Kategori: KATEGORI.find((k) => k.key === n.kategori)?.label || n.kategori,
            "Nama Penilaian": n.label,
            "Rata-rata Kelas": n.avg !== null ? Number(n.avg.toFixed(1)) : "",
            "Jumlah Dinilai": n.jumlahDinilai,
          }))
        : [{ Tanggal: "", Kategori: "", "Nama Penilaian": "", "Rata-rata Kelas": "", "Jumlah Dinilai": "" }]
    );
    wsNilai["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 14 }];

    const wsDetail = XLSX.utils.json_to_sheet(
      nilaiRelevanList.length
        ? nilaiRelevanList.flatMap((n) =>
            siswaKelas.map((s) => ({
              Tanggal: fmtDate(n.tanggal),
              Kategori: KATEGORI.find((k) => k.key === n.kategori)?.label || n.kategori,
              "Nama Penilaian": n.label,
              "Nama Murid": s.nama,
              Nilai: n.nilai[s.id] !== undefined && n.nilai[s.id] !== null && n.nilai[s.id] !== "" ? Number(n.nilai[s.id]) : "",
            }))
          )
        : [{ Tanggal: "", Kategori: "", "Nama Penilaian": "", "Nama Murid": "", Nilai: "" }]
    );
    wsDetail["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 28 }, { wch: 24 }, { wch: 8 }];

    const wb = XLSX.utils.book_new();
    const bulanLabel = bulanFilter === "all" ? "" : availableBulan.find((b) => b.value === bulanFilter)?.label || "";

    const wsInfo = setSheetView(
      XLSX.utils.json_to_sheet(textToRows([
        { "Informasi": "Jenis laporan", "Keterangan": "Rekap nilai, absensi, catatan pembelajaran, dan rincian penilaian." },
        { "Informasi": "Kelas", "Keterangan": kelasMap[kelasId]?.nama || "" },
        { "Informasi": "Mata Pelajaran", "Keterangan": mapelMap[mapelId]?.nama || "" },
        { "Informasi": "Semester", "Keterangan": data.currentSemester || "" },
        { "Informasi": "Periode", "Keterangan": bulanLabel || "Seluruh semester" },
        { "Informasi": "Cara pakai", "Keterangan": "Sheet utama dapat dipakai sebagai sumber pengisian raport; sheet lain berisi rincian pendukung." },
      ])),
      [22, 100]
    );

    ws["!autofilter"] = { ref: ws["!ref"] };
    wsPertemuan["!autofilter"] = { ref: wsPertemuan["!ref"] };
    wsNilai["!autofilter"] = { ref: wsNilai["!ref"] };
    wsDetail["!autofilter"] = { ref: wsDetail["!ref"] };

    XLSX.utils.book_append_sheet(wb, wsInfo, "Petunjuk");
    XLSX.utils.book_append_sheet(wb, ws, "Rekap Nilai & Absensi");
    XLSX.utils.book_append_sheet(wb, wsPertemuan, "Catatan Pembelajaran");
    XLSX.utils.book_append_sheet(wb, wsNilai, "Daftar Penilaian");
    XLSX.utils.book_append_sheet(wb, wsDetail, "Detail Nilai Murid");
    XLSX.writeFile(
      wb,
      `Rekap-${kelasMap[kelasId]?.nama}-${mapelMap[mapelId]?.nama}-${data.currentSemester}${bulanFilter !== "all" ? "-" + bulanLabel : ""}.xlsx`.replace(/\s+/g, "_")
    );
  };

  const noSetup = data.kelas.length === 0 || data.mapel.length === 0;

  return (
    <div className="space-y-4">
      <Guide>Pilih kelas & mapel buat lihat rekap akhir semester ini: rata-rata tiap kategori, nilai akhir (udah dihitung pakai bobot dari tab Mapel), dan rekap absensi tiap murid. Kalau mau lihat data per bulan aja (bukan seluruh semester), pakai dropdown "Bulan" yang muncul di atas tabel. Tinggal ekspor ke Excel buat disalin ke raport.</Guide>
      {noSetup ? (
        <Card><Empty icon={BarChart3} text="Rekap akan muncul di sini setelah ada kelas, mapel, absensi, dan nilai." /></Card>
      ) : (
        <>
          <Card>
            <SectionHead title="Rekap Akhir" subtitle="Nilai akhir sudah dihitung otomatis pakai bobot dari tab Mapel." />
            <div className="grid grid-cols-2 gap-2 mb-1">
              <Field label="Kelas" error={!kelasId}><Select value={kelasId} onChange={setKelasId} invalid placeholder="Pilih kelas" options={sortByNama(data.kelas).map((k) => ({ value: k.id, label: k.nama }))} /></Field>
              <Field label="Mapel" error={!mapelId}><Select value={mapelId} onChange={setMapelId} invalid placeholder="Pilih mapel" options={data.mapel.map((m) => ({ value: m.id, label: m.nama }))} /></Field>
            </div>
          </Card>

          {kelasId && mapelId && (
            <Card>
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <h3 style={{ fontFamily: F_DISPLAY, fontWeight: 600, fontSize: 17 }}>{kelasMap[kelasId]?.nama} — {mapelMap[mapelId]?.nama}</h3>
                <div className="flex items-center gap-2">
                  {availableBulan.length > 0 && (
                    <div style={{ minWidth: 168 }}>
                      <Select
                        value={bulanFilter}
                        onChange={setBulanFilter}
                        options={[{ value: "all", label: "Semua Bulan (Semester Ini)" }, ...availableBulan]}
                      />
                    </div>
                  )}
                  <Button onClick={exportExcel} variant="accent" size="sm"><Download size={14} />Ekspor Excel</Button>
                </div>
              </div>

              {rows.length === 0 ? <Empty icon={BarChart3} text="Belum ada murid di kelas ini." /> : (
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-xs border-separate" style={{ fontFamily: F_MONO, minWidth: 560, borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ color: C.muted, fontFamily: F_BODY }}>
                        <th className="text-left py-2.5 px-2 sticky left-0 rounded-l-xl" style={{ background: C.surfaceAlt }}>Nama</th>
                        {KATEGORI.map((k) => <th key={k.key} className="text-right py-2.5 px-2 font-medium" style={{ background: C.surfaceAlt }}>{k.label}</th>)}
                        <th className="text-right py-2.5 px-2 font-semibold" style={{ background: C.primarySoft, color: C.primaryDark }}>Akhir</th>
                        <th className="text-right py-2.5 px-2" style={{ background: C.surfaceAlt }}>H</th>
                        <th className="text-right py-2.5 px-2" style={{ background: C.surfaceAlt }}>I</th>
                        <th className="text-right py-2.5 px-2" style={{ background: C.surfaceAlt }}>S</th>
                        <th className="text-right py-2.5 px-2 rounded-r-xl" style={{ background: C.surfaceAlt }}>A</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => (
                        <tr key={r.siswa.id} className="ng-tr">
                          <td className="py-2 px-2 sticky left-0" style={{ background: C.surface, fontFamily: F_BODY, borderTop: `1px solid ${C.line}` }}>{r.siswa.nama}</td>
                          {KATEGORI.map((k) => <td key={k.key} className="text-right py-2 px-2" style={{ color: C.muted, borderTop: `1px solid ${C.line}` }}>{r.perKategori[k.key] !== null ? r.perKategori[k.key].toFixed(1) : "–"}</td>)}
                          <td className="text-right py-2 px-2 font-semibold" style={{ color: C.primary, background: C.primarySoft, borderTop: `1px solid ${C.line}` }}>{r.nilaiAkhir !== null ? r.nilaiAkhir.toFixed(1) : "–"}</td>
                          <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>{r.absen.H}</td>
                          <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>{r.absen.I}</td>
                          <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>{r.absen.S}</td>
                          <td className="text-right py-2 px-2" style={{ color: r.absen.A > 0 ? C.danger : C.muted, borderTop: `1px solid ${C.line}` }}>{r.absen.A}</td>
                        </tr>
                      ))}
                    </tbody>
                    {summary && (
                      <tfoot>
                        <tr>
                          <td className="py-2.5 px-2 sticky left-0 font-semibold rounded-l-xl" style={{ background: C.primaryMutedSoft, fontFamily: F_BODY, color: C.primaryDark }}>Rata-rata kelas</td>
                          {KATEGORI.map((k) => <td key={k.key} className="text-right py-2.5 px-2 font-semibold" style={{ background: C.primaryMutedSoft, color: C.primaryDark }}>{summary.perKategori[k.key] !== null ? summary.perKategori[k.key].toFixed(1) : "–"}</td>)}
                          <td className="text-right py-2.5 px-2 font-bold" style={{ background: C.primarySoft, color: C.primaryDark }}>{summary.rataNilaiAkhir !== null ? summary.rataNilaiAkhir.toFixed(1) : "–"}</td>
                          <td className="text-right py-2.5 px-2 font-semibold" style={{ background: C.primaryMutedSoft, color: C.primaryDark }}>{summary.absen.H}</td>
                          <td className="text-right py-2.5 px-2 font-semibold" style={{ background: C.primaryMutedSoft, color: C.primaryDark }}>{summary.absen.I}</td>
                          <td className="text-right py-2.5 px-2 font-semibold" style={{ background: C.primaryMutedSoft, color: C.primaryDark }}>{summary.absen.S}</td>
                          <td className="text-right py-2.5 px-2 font-semibold rounded-r-xl" style={{ background: C.primaryMutedSoft, color: summary.absen.A > 0 ? C.danger : C.primaryDark }}>{summary.absen.A}</td>
                        </tr>
                      </tfoot>
                    )}
                  </table>
                </div>
              )}
              <p className="text-[11px] mt-4" style={{ color: C.muted, fontFamily: F_BODY }}>Kategori tanpa nilai otomatis diabaikan dari perhitungan nilai akhir. Baris "Rata-rata kelas" di bawah tabel: kolom nilai dihitung rata-rata dari seluruh murid yang punya Nilai Akhir, kolom H/I/S/A dihitung total kejadian.</p>
            </Card>
          )}

          {kelasId && mapelId && (
            <Card>
              <SectionHead title="Catatan Pertemuan" subtitle="Materi/kegiatan tiap sesi — ikut kebawa saat ekspor Excel." />
              {pertemuanRelevan.length === 0 ? (
                <Empty icon={CalendarCheck} text="Belum ada catatan pertemuan untuk kelas & mapel ini." />
              ) : (
                <ul className="space-y-2">
                  {pertemuanRelevan.map((p) => (
                    <li key={p.id} className="rounded-2xl p-3" style={{ background: C.surfaceAlt }}>
                      <p className="text-xs font-semibold" style={{ color: C.primary }}>{fmtDate(p.tanggal)}</p>
                      <p className="text-sm mt-0.5" style={{ color: p.catatan ? C.ink : C.muted }}>{p.catatan || "Belum ada materi dicatat untuk pertemuan ini."}</p>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {kelasId && mapelId && (
            <Card>
              <SectionHead title="Riwayat Penilaian" subtitle="Keterangan tiap tugas/UH/praktek/UTS/UAS yang pernah diinput." />
              {nilaiRelevanList.length === 0 ? (
                <Empty icon={ClipboardList} text="Belum ada penilaian untuk kelas & mapel ini." />
              ) : (
                <ul className="space-y-2">
                  {nilaiRelevanList.map((n) => (
                    <li key={n.id} className="flex items-center justify-between gap-3 rounded-2xl p-3" style={{ background: C.surfaceAlt }}>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: C.ink }}>{n.label}</p>
                        <p className="text-xs mt-0.5" style={{ color: C.muted }}>{KATEGORI.find((k) => k.key === n.kategori)?.label} · {fmtDate(n.tanggal)} · {n.jumlahDinilai} murid dinilai</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p style={{ fontFamily: F_MONO, fontWeight: 600, fontSize: 15, color: C.primary }}>{n.avg !== null ? n.avg.toFixed(1) : "–"}</p>
                        <p className="text-[10px]" style={{ color: C.muted }}>rata-rata</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ================= ADMIN OVERVIEW DASHBOARD =================
function TabAdmin({ teacherList, teacherCounts, myId, onOpenTeacher, onTogglePaid }) {
  const rows = useMemo(() => {
    return teacherList.map((t) => {
      const c = teacherCounts[t.id] || { kelas: 0, mapel: 0, siswa: 0, pertemuan: 0, nilai: 0 };
      return { ...t, ...c };
    }).sort((a, b) => a.nama.localeCompare(b.nama));
  }, [teacherList, teacherCounts]);

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    guru: acc.guru + 1,
    kelas: acc.kelas + r.kelas,
    siswa: acc.siswa + r.siswa,
    pertemuan: acc.pertemuan + r.pertemuan,
    nilai: acc.nilai + r.nilai,
  }), { guru: 0, kelas: 0, siswa: 0, pertemuan: 0, nilai: 0 }), [rows]);

  const PaidBadge = ({ r }) => (
    <button
      onClick={() => onTogglePaid(r.id, !r.is_paid)}
      className="shrink-0 text-[10px] font-semibold px-2 py-1 rounded-full"
      style={
        r.is_paid
          ? { background: "#DCEFDF", color: "#1F7A3D" }
          : { background: "#FBE2E1", color: "#B3261E" }
      }
      title="Klik untuk ubah status pembayaran"
    >
      {r.is_paid ? "Lunas" : "Belum Bayar"}
    </button>
  );

  const StatBox = ({ label, value }) => (
    <div className="rounded-2xl px-4 py-3" style={{ background: C.surfaceAlt }}>
      <p style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 20, color: C.primary }}>{value}</p>
      <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>{label}</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <Guide>Ringkasan seluruh akun guru di sistem ini. Klik "Buka" pada satu guru buat masuk ke workspace-nya secara penuh (lihat & edit) — kamu tetap dalam Mode Admin sampai memilih "Kembali ke akun saya".</Guide>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <StatBox label="Guru terdaftar" value={totals.guru} />
        <StatBox label="Total kelas" value={totals.kelas} />
        <StatBox label="Total murid" value={totals.siswa} />
        <StatBox label="Pertemuan tercatat" value={totals.pertemuan} />
        <StatBox label="Data nilai" value={totals.nilai} />
      </div>

      <Card>
        <SectionHead title="Semua Guru" subtitle={`${rows.length} akun terdaftar`} />
        {rows.length === 0 ? (
          <Empty icon={Users} text="Belum ada guru yang terdaftar." />
        ) : (
          <>
            {/* Phones: compact stacked list */}
            <div className="ng-admin-list">
              {rows.map((r) => (
                <div key={r.id} className="rounded-xl px-3 py-2.5" style={{ background: C.surfaceAlt }}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0" style={{ columnGap: 6 }}>
                      <span className="text-[13px] font-semibold truncate" style={{ color: C.ink, fontFamily: F_BODY }}>
                        {r.nama}
                        {r.id === myId && <span style={{ color: C.muted, fontWeight: 500 }}> (kamu)</span>}
                      </span>
                      {r.role === "admin" && (
                        <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: C.accentSoft, color: C.accentDark, marginLeft: 6 }}>admin</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {r.id !== myId && <PaidBadge r={r} />}
                      {r.id !== myId && (
                        <Button size="sm" variant="ghost" onClick={() => onOpenTeacher(r.id)}>Buka</Button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", columnGap: 16, rowGap: 4, marginTop: 8, fontFamily: F_MONO, fontSize: 11 }}>
                    {[["Kelas", r.kelas], ["Mapel", r.mapel], ["Murid", r.siswa], ["Pertemuan", r.pertemuan], ["Nilai", r.nilai]].map(([label, val]) => (
                      <span key={label} style={{ color: C.muted, whiteSpace: "nowrap" }}>
                        <b style={{ color: C.primary, fontWeight: 700 }}>{val}</b>{" "}{label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet / desktop: full table */}
            <div className="ng-admin-table-wrap overflow-x-auto -mx-1">
              <table className="w-full text-xs border-separate" style={{ fontFamily: F_MONO, minWidth: 640, borderSpacing: 0 }}>
                <thead>
                  <tr style={{ color: C.muted, fontFamily: F_BODY }}>
                    <th className="text-left py-2.5 px-2 sticky left-0 rounded-l-xl" style={{ background: C.surfaceAlt }}>Nama</th>
                    <th className="text-right py-2.5 px-2" style={{ background: C.surfaceAlt }}>Kelas</th>
                    <th className="text-right py-2.5 px-2" style={{ background: C.surfaceAlt }}>Mapel</th>
                    <th className="text-right py-2.5 px-2" style={{ background: C.surfaceAlt }}>Murid</th>
                    <th className="text-right py-2.5 px-2" style={{ background: C.surfaceAlt }}>Pertemuan</th>
                    <th className="text-right py-2.5 px-2" style={{ background: C.surfaceAlt }}>Nilai</th>
                    <th className="text-right py-2.5 px-2" style={{ background: C.surfaceAlt }}>Bayar</th>
                    <th className="text-right py-2.5 px-2 rounded-r-xl" style={{ background: C.surfaceAlt }}></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="ng-tr">
                      <td className="py-2 px-2 sticky left-0" style={{ background: C.surface, fontFamily: F_BODY, borderTop: `1px solid ${C.line}` }}>
                        {r.nama}{r.id === myId && <span style={{ color: C.muted }}> (kamu)</span>}
                        {r.role === "admin" && <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: C.accentSoft, color: C.accentDark }}>admin</span>}
                      </td>
                      <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>{r.kelas}</td>
                      <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>{r.mapel}</td>
                      <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>{r.siswa}</td>
                      <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>{r.pertemuan}</td>
                      <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>{r.nilai}</td>
                      <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>
                        {r.id !== myId && <PaidBadge r={r} />}
                      </td>
                      <td className="text-right py-2 px-2" style={{ borderTop: `1px solid ${C.line}` }}>
                        {r.id !== myId && (
                          <Button size="sm" variant="ghost" onClick={() => onOpenTeacher(r.id)}>Buka</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}

// Helper pemotong gambar (Canvas) untuk react-easy-crop
const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.src = url;
  });

async function getCroppedImg(imageSrc, pixelCrop) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) return null;

  // Resolusi akhir foto profil 256x256 biar ringan tapi tetap tajam
  canvas.width = 256;
  canvas.height = 256;

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    256,
    256
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg', 0.9);
  });
}

// ================= TAB: PROFIL GURU =================
function TabProfil({ myId, profile, onSaved }) {
  const [nama, setNama] = useState(profile.nama || "");
  const [panggilan, setPanggilan] = useState(profile.nama_panggilan || "");
  const [gelar, setGelar] = useState(profile.gelar || "");
  const [sekolah, setSekolah] = useState(profile.sekolah || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState(false);

  // --- State untuk Fitur Crop Gambar ---
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Saat user milih file foto
  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await new Promise((resolve) => {
        let reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });
      setImageSrc(imageDataUrl);
    }
    e.target.value = ""; // Reset input biar bisa milih file yang sama lagi
  };

  const handleCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  // Eksekusi potong & upload ke Supabase
  const handleUploadAvatar = async () => {
    try {
      setUploading(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      const filePath = `${myId}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, croppedImageBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath);

      const newUrl = `${publicUrlData.publicUrl}?t=${Date.now()}`; // Tambah timestamp biar gak ke-cache browser
      setAvatarUrl(newUrl);
      setImageSrc(null); // Tutup modal crop
      
      // Otomatis simpan url baru ke profile
      await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', myId);
      onSaved?.({ ...profile, avatar_url: newUrl });

    } catch (err) {
      console.error("Gagal upload foto:", err);
      alert("Gagal mengunggah foto profil. Pastikan Rules Storage sudah benar.");
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = {
        nama: nama.trim(),
        nama_panggilan: panggilan.trim(),
        gelar: gelar.trim(),
        sekolah: sekolah.trim(),
        avatar_url: avatarUrl,
      };

      const { error } = await supabase.from('profiles').update(updates).eq('id', myId);
      if (error) throw error;

      onSaved?.(updates);
      setSavedMsg(true);
      setTimeout(() => setSavedMsg(false), 2000);
    } catch (err) {
      console.error("Gagal simpan profil:", err);
      alert("Gagal menyimpan profil.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto">
      <Guide>Lengkapi identitas mengajar Anda. Nama panggilan akan tampil di navbar atas, sedangkan nama lengkap, gelar, dan nama sekolah akan tercetak otomatis pada kop laporan raport dan ringkasan semester.</Guide>

      <Card>
        <SectionHead title="Profil Pengajar" subtitle="Atur identitas resmi dan personalisasi akun Anda." />

        <div className="flex flex-col items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center" style={{ background: C.surfaceAlt, border: `2px solid ${C.line}` }}>
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={40} style={{ color: C.muted }} />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer shadow-md ng-press" style={{ background: C.primary, color: '#fff' }}>
              <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              <Camera size={14} />
            </label>
          </div>
          <span className="text-xs" style={{ color: C.muted }}>Ketuk ikon kamera untuk ganti foto</span>
        </div>

        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3">
          <Field label="Nama Panggilan (Muncul di navbar atas)">
            <input value={panggilan} onChange={(e) => setPanggilan(e.target.value)} placeholder="Contoh: Pak Fakhri" className={inputCls} style={baseInputStyle} />
          </Field>

          <Field label="Nama Lengkap (Sesuai KTP / SK Mengajar)">
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Contoh: Fakhri Rabbani" required className={inputCls} style={baseInputStyle} />
          </Field>

          <Field label="Gelar Akademik">
            <input value={gelar} onChange={(e) => setGelar(e.target.value)} placeholder="Contoh: S.Pd. atau M.Pd." className={inputCls} style={baseInputStyle} />
          </Field>

          <Field label="Instansi / Nama Sekolah">
            <input value={sekolah} onChange={(e) => setSekolah(e.target.value)} placeholder="Contoh: SMP Negeri 1 Jakarta" className={inputCls} style={baseInputStyle} />
          </Field>

          <div className="flex items-center gap-3 mt-3">
            <Button type="submit" disabled={saving}>
              {saving ? <RefreshCw size={15} className="animate-spin" /> : <Save size={15} />}
              Simpan Profil
            </Button>
            {savedMsg && <span className="text-xs font-semibold" style={{ color: C.primary }}>Tersimpan ✓</span>}
          </div>
        </form>
      </Card>

      {/* --- Modal Cropper --- */}
      {imageSrc && createPortal(
        <div className="ng-overlay-in fixed inset-0 z-[120] flex flex-col bg-black/95 p-4" onClick={() => !uploading && setImageSrc(null)}>
          <div className="relative flex-1 w-full max-w-md mx-auto mt-6 mb-24 overflow-hidden rounded-3xl" onClick={e => e.stopPropagation()}>
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onCropComplete={handleCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div className="fixed bottom-0 left-0 right-0 p-5 pb-8 bg-black/90 flex items-center justify-center gap-4 z-[130]" onClick={e => e.stopPropagation()}>
            <Button variant="ghost" onClick={() => setImageSrc(null)} disabled={uploading}>Batal</Button>
            <Button onClick={handleUploadAvatar} disabled={uploading}>
              {uploading ? <RefreshCw size={15} className="animate-spin" /> : <Camera size={15} />}
              {uploading ? "Memproses..." : "Selesai & Pasang"}
            </Button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}