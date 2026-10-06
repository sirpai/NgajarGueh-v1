// ============================================================
// NgajarGueh — sync.js
// Jembatan antara state React (camelCase) dan tabel Supabase (snake_case).
// Dua fungsi utama:
//   fetchAllData(ownerId)              → tarik semua data milik satu guru dari Supabase
//   syncDiff(ownerId, prevData, next)  → bandingkan data lama vs baru, kirim cuma yang berubah
// ============================================================
import { supabase } from "./supabaseClient";

// ---------- mapping row Supabase (snake_case) <-> object JS (camelCase) ----------

const rowToKelas = (r) => ({ id: r.id, nama: r.nama });
const kelasToRow = (ownerId, k) => ({ id: k.id, owner_id: ownerId, nama: k.nama });

const rowToMapel = (r) => ({ id: r.id, nama: r.nama, bobot: r.bobot || {} });
const mapelToRow = (ownerId, m) => ({ id: m.id, owner_id: ownerId, nama: m.nama, bobot: m.bobot || {} });

const rowToSiswa = (r) => ({ id: r.id, nama: r.nama, kelasId: r.kelas_id });
const siswaToRow = (ownerId, s) => ({ id: s.id, owner_id: ownerId, kelas_id: s.kelasId, nama: s.nama });

const rowToPertemuan = (r) => ({
  id: r.id, kelasId: r.kelas_id, mapelId: r.mapel_id,
  tanggal: r.tanggal, semester: r.semester, catatan: r.catatan || "", absensi: r.absensi || {},
});
const pertemuanToRow = (ownerId, p) => ({
  id: p.id, owner_id: ownerId, kelas_id: p.kelasId, mapel_id: p.mapelId,
  tanggal: p.tanggal, semester: p.semester, catatan: p.catatan || "", absensi: p.absensi || {},
});

const rowToNilai = (r) => ({
  id: r.id, kelasId: r.kelas_id, mapelId: r.mapel_id, kategori: r.kategori,
  label: r.label, tanggal: r.tanggal, semester: r.semester, nilai: r.nilai || {},
});
const nilaiToRow = (ownerId, n) => ({
  id: n.id, owner_id: ownerId, kelas_id: n.kelasId, mapel_id: n.mapelId, kategori: n.kategori,
  label: n.label, tanggal: n.tanggal, semester: n.semester, nilai: n.nilai || {},
});

// Urutan penting karena foreign key: kelas & mapel dulu (parent),
// baru siswa, pertemuan, nilai (child). Delete kebalikannya.
const TABLES = [
  { name: "kelas", toRow: kelasToRow, fromRow: rowToKelas, dataKey: "kelas" },
  { name: "mapel", toRow: mapelToRow, fromRow: rowToMapel, dataKey: "mapel" },
  { name: "siswa", toRow: siswaToRow, fromRow: rowToSiswa, dataKey: "siswa" },
  { name: "pertemuan", toRow: pertemuanToRow, fromRow: rowToPertemuan, dataKey: "pertemuan" },
  { name: "nilai", toRow: nilaiToRow, fromRow: rowToNilai, dataKey: "nilai" },
];

// ---------- fetch semua data milik satu guru ----------

export async function fetchAllData(ownerId) {
  const result = {};
  // Semua tabel ditarik BERSAMAAN (Promise.all), bukan satu-satu bergantian —
  // total waktu tunggu jadi setara request paling lambat, bukan jumlah semuanya.
  const responses = await Promise.all(
    TABLES.map((t) => supabase.from(t.name).select("*").eq("owner_id", ownerId))
  );
  responses.forEach(({ data, error }, i) => {
    if (error) throw error;
    const t = TABLES[i];
    result[t.dataKey] = (data || []).map(t.fromRow);
  });
  return result;
}

// ---------- untuk dashboard admin: hitung jumlah baris per guru, tanpa tarik seluruh isinya ----------
// Cuma kolom owner_id yang ditarik (bukan seluruh row) supaya ringan meski dipanggil admin
// yang bisa melihat data semua guru sekaligus (RLS mengizinkan ini lewat is_admin()).
export async function fetchTeacherCounts() {
  const counts = {}; // { [ownerId]: { kelas, mapel, siswa, pertemuan, nilai } }
  // Ditarik BERSAMAAN, bukan satu-satu — mengurangi waktu tunggu total,
  // tapi tetap narik seluruh kolom owner_id tiap tabel (lihat catatan di bawah
  // soal batas skalabilitas cara ini).
  const responses = await Promise.all(
    TABLES.map((t) => supabase.from(t.name).select("owner_id"))
  );
  responses.forEach(({ data, error }, i) => {
    if (error) throw error;
    const t = TABLES[i];
    for (const row of data || []) {
      const oid = row.owner_id;
      if (!counts[oid]) counts[oid] = { kelas: 0, mapel: 0, siswa: 0, pertemuan: 0, nilai: 0 };
      counts[oid][t.dataKey] += 1;
    }
  });
  return counts;
}

// ---------- diff satu tabel: apa yang perlu di-upsert, apa yang perlu dihapus ----------

function diffArray(prevArr = [], nextArr = []) {
  const prevMap = new Map(prevArr.map((x) => [x.id, x]));
  const nextMap = new Map(nextArr.map((x) => [x.id, x]));
  const upserts = [];
  for (const [id, item] of nextMap) {
    const old = prevMap.get(id);
    if (!old || JSON.stringify(old) !== JSON.stringify(item)) upserts.push(item);
  }
  const deletes = [];
  for (const id of prevMap.keys()) {
    if (!nextMap.has(id)) deletes.push(id);
  }
  return { upserts, deletes };
}

// ---------- kirim cuma yang berubah ke Supabase ----------

export async function syncDiff(ownerId, prevData, nextData) {
  const diffs = TABLES.map((t) => ({ t, ...diffArray(prevData[t.dataKey], nextData[t.dataKey]) }));

  // upsert: parent dulu (kelas, mapel), baru child (siswa, pertemuan, nilai)
  for (const { t, upserts } of diffs) {
    if (upserts.length === 0) continue;
    const rows = upserts.map((item) => t.toRow(ownerId, item));
    const { error } = await supabase.from(t.name).upsert(rows);
    if (error) throw error;
  }

  // delete: child dulu (nilai, pertemuan, siswa), baru parent (mapel, kelas)
  for (const { t, deletes } of [...diffs].reverse()) {
    if (deletes.length === 0) continue;
    const { error } = await supabase.from(t.name).delete().in("id", deletes);
    if (error) throw error;
  }
}
