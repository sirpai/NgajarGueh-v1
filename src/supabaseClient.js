import { createClient } from "@supabase/supabase-js";

// Ambil dari Supabase Dashboard → Project Settings → API
// JANGAN taruh langsung di sini kalau mau upload ke GitHub publik —
// pakai file .env (lihat catatan di bawah file ini).
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/*
  CARA PASANG:
  1. npm install @supabase/supabase-js
  2. Di root folder project (sejajar sama package.json), bikin file baru
     namanya ".env" isinya:

     VITE_SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
     VITE_SUPABASE_ANON_KEY=isi-anon-key-kamu-di-sini

     (dua nilai itu diambil dari Supabase Dashboard → Settings → API)
  3. Taruh file ini di src/supabaseClient.js
  4. Restart npm run dev setelah bikin .env (Vite cuma baca .env pas start)
*/
