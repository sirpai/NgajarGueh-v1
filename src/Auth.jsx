import { useState, useEffect, useRef } from "react";
import { LogIn, UserPlus, Loader2, AlertCircle, MessageCircle, ShieldCheck, ArrowLeft, Mail, CheckCircle2, Eye, EyeOff, KeyRound } from "lucide-react";
import { supabase } from "./supabaseClient.js";

// GANTI nomor ini sebelum deploy — format 62xxxxxxxxxx, TANPA tanda + atau spasi.
const ADMIN_WHATSAPP = "6281280144412";
const waLink = (message) => `https://wa.me/${ADMIN_WHATSAPP}?text=${encodeURIComponent(message)}`;

const RESEND_COOLDOWN_SECONDS = 45;

// ---------- token & font sama persis kayak App.jsx ----------
const C = {
  bg: "#F6F2E7",
  surface: "#FFFFFF",
  surfaceAlt: "#EFE7D3",
  ink: "#2A2318",
  muted: "#7C7260",
  line: "#E4DAC0",
  brown: "#241C12",
  primary: "#4C6E54",
  primaryDark: "#324A38",
  primarySoft: "#E1EADF",
  accentDark: "#8C6A22",
  danger: "#A34632",
  dangerSoft: "#F1DED7",
};
const F_DISPLAY = "'Plus Jakarta Sans', sans-serif";
const F_BODY = "'Inter', sans-serif";

const inputCls = "w-full rounded-2xl px-4 py-2.5 text-sm outline-none transition";
const inputStyle = { background: C.surfaceAlt, border: "1px solid transparent", color: C.ink, fontFamily: F_BODY };

// Pesan error mentah dari Supabase (Inggris) dipetakan ke Bahasa Indonesia yang jelas.
const ERROR_MAP = {
  "Invalid login credentials": "Email atau kata sandi salah.",
  "User already registered": "Email ini sudah terdaftar — coba masuk (login) aja. Kalau belum pernah verifikasi, masuk dulu lalu minta kirim ulang kode OTP.",
  "Email not confirmed": "Email ini belum diverifikasi. Masukkan kode OTP yang dikirim ke emailmu.",
  "Token has expired or is invalid": "Kode OTP salah atau sudah kedaluwarsa. Coba kirim ulang kodenya.",
  "For security purposes, you can only request this after": "Tunggu sebentar sebelum minta kirim ulang kode.",
};
const friendlyError = (err) => {
  const raw = err?.message || "";
  const hit = Object.keys(ERROR_MAP).find((k) => raw.includes(k));
  return hit ? ERROR_MAP[hit] : raw || "Terjadi kesalahan, coba lagi.";
};

function Logo({ size = 56 }) {
  return (
    <img
      src="/apple-touch-icon.png"
      alt="NgajarGueh"
      width={size}
      height={size}
      className="rounded-2xl"
      style={{ width: size, height: size, objectFit: "cover", boxShadow: "0 4px 16px rgba(36,28,18,0.35)" }}
    />
  );
}

function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <div className="flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-xs" style={{ background: C.dangerSoft, color: C.danger }}>
      <AlertCircle size={14} className="shrink-0 mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

// Input password dengan tombol "lihat/sembunyikan" — dipakai di login, daftar, dan reset password.
function PasswordField({ label, value, onChange, placeholder, minLength, autoComplete }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block">
      <span className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted, letterSpacing: "0.03em" }}>{label}</span>
      <div className="relative">
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputCls}
          style={{ ...inputStyle, paddingRight: 40 }}
          required
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={-1}
          aria-label={visible ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
          className="absolute right-3.5 top-1/2 -translate-y-1/2"
          style={{ color: C.muted }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </label>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: C.bg, fontFamily: F_BODY }}>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}

function Header({ title, subtitle }) {
  return (
    <div className="text-center mb-7">
      <div className="mb-3 flex justify-center"><Logo /></div>
      <h1 style={{ fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 22, color: C.ink }}>NgajarGueh</h1>
      <p className="text-sm mt-1" style={{ color: C.muted }}>{subtitle}</p>
    </div>
  );
}

function HelpLink() {
  return (
    <a
      href={waLink("Halo, saya butuh bantuan login/akun di NgajarGueh.")}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-8 flex flex-col items-center justify-center gap-1 text-center rounded-xl px-3 py-2.5 transition hover:brightness-105"
      style={{ color: C.primaryDark, background: "#E1EADF", border: `1px solid rgba(76,110,84,0.35)` }}
    >
      <span className="text-[10.5px] font-medium" style={{ color: C.muted }}>Masih ada kendala?</span>
      <span className="flex items-center justify-center gap-1.5 text-[11.5px] font-semibold">
        <MessageCircle size={12} />
        Hubungi Admin
      </span>
    </a>
  );
}

export default function Auth({ onSuccess }) {
  // mode: "login" | "signup" | "otp" | "forgot" | "forgot-sent"
  const [mode, setMode] = useState("login");
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [pendingEmail, setPendingEmail] = useState(""); // email yang lagi nunggu verifikasi OTP
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const cooldownTimer = useRef(null);

  useEffect(() => () => clearInterval(cooldownTimer.current), []);

  const startCooldown = () => {
    setCooldown(RESEND_COOLDOWN_SECONDS);
    clearInterval(cooldownTimer.current);
    cooldownTimer.current = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(cooldownTimer.current); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  // ---------- login / signup ----------
  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { nama: nama.trim() || "Guru" } },
        });
        if (err) throw err;
        // Supabase sengaja TIDAK ngasih error kalau email yang didaftarin udah punya
        // akun (biar orang gak bisa nebak-nebak email siapa aja yang terdaftar).
        // Ciri khasnya: data.user.identities balik array KOSONG. Kalau kita gak cek ini,
        // guru yang iseng daftar ulang malah kebawa ke layar OTP padahal akunnya udah ada.
        if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
          throw new Error("Email ini sudah terdaftar. Silakan masuk, atau pakai menu \"Lupa kata sandi\" kalau lupa kata sandinya.");
        }
        // Kalau "Confirm email" aktif di Supabase, signUp TIDAK langsung ngasih session —
        // akun baru berstatus belum terverifikasi sampai kode OTP dimasukkan.
        if (!data.session) {
          setPendingEmail(email);
          setMode("otp");
          startCooldown();
        } else {
          onSuccess?.();
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) {
          // Login gagal karena belum verifikasi email → langsung arahkan ke layar OTP,
          // jangan biarkan user mentok di pesan error doang.
          if (err.message?.includes("Email not confirmed")) {
            setPendingEmail(email);
            setMode("otp");
            startCooldown();
            return;
          }
          throw err;
        }
        onSuccess?.();
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ---------- verifikasi kode OTP ----------
  const submitOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otpCode.trim(),
        type: "signup",
      });
      if (err) throw err;
      onSuccess?.();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (cooldown > 0) return;
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resend({ type: "signup", email: pendingEmail });
      if (err) throw err;
      startCooldown();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ---------- lupa kata sandi ----------
  const submitForgot = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: window.location.origin,
      });
      if (err) throw err;
      setMode("forgot-sent");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  // ================= LAYAR: verifikasi kode OTP =================
  if (mode === "otp") {
    return (
      <Shell>
        <Header subtitle="Verifikasi email kamu" />
        <form onSubmit={submitOtp} className="rounded-[28px] p-5 flex flex-col gap-3" style={{ background: C.surface, boxShadow: "0 2px 14px rgba(42,35,24,0.06)" }}>
          <div className="flex items-start gap-2.5 rounded-2xl px-3.5 py-3" style={{ background: C.primarySoft, color: C.primaryDark }}>
            <Mail size={16} className="shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed">
              Kode verifikasi 6 digit sudah dikirim ke <strong>{pendingEmail}</strong>. Buka email kamu (cek juga folder Spam/Promosi) lalu masukkan kodenya di bawah.
            </p>
          </div>

          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted, letterSpacing: "0.03em" }}>Kode OTP</span>
            <input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              className={inputCls}
              style={{ ...inputStyle, textAlign: "center", letterSpacing: "0.5em", fontFamily: F_DISPLAY, fontWeight: 700, fontSize: 20 }}
              required
            />
          </label>

          <ErrorBox>{error}</ErrorBox>

          <button
            type="submit"
            disabled={loading || otpCode.length !== 6}
            className="rounded-full font-semibold text-sm py-3 flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-105 hover:shadow-md disabled:opacity-40"
            style={{ background: C.primary, color: "#fff", boxShadow: "0 3px 10px rgba(50,74,56,0.28)", fontFamily: F_DISPLAY }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <ShieldCheck size={15} />}
            Verifikasi & Masuk
          </button>

          <button
            type="button"
            onClick={resendOtp}
            disabled={loading || cooldown > 0}
            className="text-xs font-semibold text-center disabled:opacity-40"
            style={{ color: C.accentDark }}
          >
            {cooldown > 0 ? `Kirim ulang kode (${cooldown}s)` : "Kirim ulang kode"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode("login"); setError(""); setOtpCode(""); }}
          className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold w-full"
          style={{ color: C.muted }}
        >
          <ArrowLeft size={13} /> Kembali ke halaman masuk
        </button>
        <HelpLink />
      </Shell>
    );
  }

  // ================= LAYAR: lupa kata sandi — form input email =================
  if (mode === "forgot") {
    return (
      <Shell>
        <Header subtitle="Reset kata sandi" />
        <form onSubmit={submitForgot} className="rounded-[28px] p-5 flex flex-col gap-3" style={{ background: C.surface, boxShadow: "0 2px 14px rgba(42,35,24,0.06)" }}>
          <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
            Masukkan email akun kamu. Kami kirim link buat bikin kata sandi baru — buka lewat aplikasi Gmail atau email apapun yang kamu pakai daftar.
          </p>
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted, letterSpacing: "0.03em" }}>Email</span>
            <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="nama@email.com" className={inputCls} style={inputStyle} required />
          </label>

          <ErrorBox>{error}</ErrorBox>

          <button
            type="submit"
            disabled={loading}
            className="rounded-full font-semibold text-sm py-3 flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-105 hover:shadow-md disabled:opacity-40"
            style={{ background: C.primary, color: "#fff", boxShadow: "0 3px 10px rgba(50,74,56,0.28)", fontFamily: F_DISPLAY }}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Mail size={15} />}
            Kirim Link Reset
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setMode("login"); setError(""); }}
          className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold w-full"
          style={{ color: C.muted }}
        >
          <ArrowLeft size={13} /> Kembali ke halaman masuk
        </button>
        <HelpLink />
      </Shell>
    );
  }

  // ================= LAYAR: konfirmasi link reset sudah dikirim =================
  if (mode === "forgot-sent") {
    return (
      <Shell>
        <Header subtitle="Cek email kamu" />
        <div className="rounded-[28px] p-5 flex flex-col items-center gap-3 text-center" style={{ background: C.surface, boxShadow: "0 2px 14px rgba(42,35,24,0.06)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: C.primarySoft }}>
            <CheckCircle2 size={22} style={{ color: C.primary }} />
          </div>
          <p className="text-sm" style={{ color: C.ink }}>
            Link reset kata sandi sudah dikirim ke <strong>{forgotEmail}</strong>.
          </p>
          <p className="text-xs leading-relaxed" style={{ color: C.muted }}>
            Buka email itu (cek juga folder Spam/Promosi kalau belum kelihatan), klik link-nya, lalu buat kata sandi baru. Setelah itu kamu bisa langsung masuk pakai kata sandi baru itu.
          </p>
        </div>

        <button
          type="button"
          onClick={() => { setMode("login"); setError(""); }}
          className="mt-4 flex items-center justify-center gap-1.5 text-xs font-semibold w-full"
          style={{ color: C.muted }}
        >
          <ArrowLeft size={13} /> Kembali ke halaman masuk
        </button>
        <HelpLink />
      </Shell>
    );
  }

  // ================= LAYAR: login / signup (default) =================
  return (
    <Shell>
      <Header subtitle={mode === "login" ? "Masuk ke akun kamu" : "Buat akun guru baru"} />

      <form onSubmit={submit} className="rounded-[28px] p-5 flex flex-col gap-3" style={{ background: C.surface, boxShadow: "0 2px 14px rgba(42,35,24,0.06)" }}>
        {mode === "signup" && (
          <label className="block">
            <span className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted, letterSpacing: "0.03em" }}>Nama Lengkap</span>
            <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama kamu" className={inputCls} style={inputStyle} required />
          </label>
        )}
        <label className="block">
          <span className="block text-[11px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: C.muted, letterSpacing: "0.03em" }}>Email</span>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@email.com" className={inputCls} style={inputStyle} required />
        </label>
        <PasswordField
          label="Kata Sandi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          minLength={6}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />

        {mode === "login" && (
          <button
            type="button"
            onClick={() => { setForgotEmail(email); setMode("forgot"); setError(""); }}
            className="text-right text-xs font-semibold -mt-1"
            style={{ color: C.accentDark }}
          >
            Lupa kata sandi?
          </button>
        )}

        <ErrorBox>{error}</ErrorBox>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full font-semibold text-sm py-3 flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-105 hover:shadow-md disabled:opacity-40"
          style={{ background: C.primary, color: "#fff", boxShadow: "0 3px 10px rgba(50,74,56,0.28)", fontFamily: F_DISPLAY }}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : mode === "login" ? <LogIn size={15} /> : <UserPlus size={15} />}
          {mode === "login" ? "Masuk" : "Daftar"}
        </button>
      </form>

      <p className="text-center text-xs mt-4" style={{ color: C.muted }}>
        {mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <button
          type="button"
          onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
          className="font-semibold underline underline-offset-2"
          style={{ color: C.accentDark }}
        >
          {mode === "login" ? "Daftar di sini" : "Masuk di sini"}
        </button>
      </p>

      <HelpLink />
    </Shell>
  );
}

// ================= LAYAR TERPISAH: buat kata sandi baru =================
// Dipakai oleh main.jsx saat event "PASSWORD_RECOVERY" terdeteksi (user klik
// link reset dari email). Berbeda dari mode "forgot" di atas — ini bukan
// bagian dari <Auth>, jadi diexport sendiri dan dirender langsung oleh main.jsx
// SEBELUM masuk ke <App>, walaupun session recovery-nya sudah aktif.
export function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) { setError("Kata sandi minimal 6 karakter."); return; }
    if (password !== confirmPassword) { setError("Konfirmasi kata sandi tidak cocok."); return; }
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw err;
      setDone(true);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <Shell>
        <Header subtitle="Kata sandi berhasil diganti" />
        <div className="rounded-[28px] p-5 flex flex-col items-center gap-3 text-center" style={{ background: C.surface, boxShadow: "0 2px 14px rgba(42,35,24,0.06)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: C.primarySoft }}>
            <CheckCircle2 size={22} style={{ color: C.primary }} />
          </div>
          <p className="text-sm" style={{ color: C.ink }}>Kata sandi baru kamu sudah aktif.</p>
          <button
            type="button"
            onClick={onDone}
            className="mt-1 rounded-full font-semibold text-sm py-3 px-6 flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-105 hover:shadow-md"
            style={{ background: C.primary, color: "#fff", boxShadow: "0 3px 10px rgba(50,74,56,0.28)", fontFamily: F_DISPLAY }}
          >
            Lanjut ke Aplikasi
          </button>
        </div>
        <HelpLink />
      </Shell>
    );
  }

  return (
    <Shell>
      <Header subtitle="Buat kata sandi baru" />
      <form onSubmit={submit} className="rounded-[28px] p-5 flex flex-col gap-3" style={{ background: C.surface, boxShadow: "0 2px 14px rgba(42,35,24,0.06)" }}>
        <div className="flex items-start gap-2.5 rounded-2xl px-3.5 py-3" style={{ background: C.primarySoft, color: C.primaryDark }}>
          <KeyRound size={16} className="shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">Masukkan kata sandi baru buat akun kamu. Setelah ini, gunakan kata sandi baru ini untuk masuk selanjutnya.</p>
        </div>

        <PasswordField
          label="Kata Sandi Baru"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 6 karakter"
          minLength={6}
          autoComplete="new-password"
        />
        <PasswordField
          label="Ulangi Kata Sandi Baru"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Ketik ulang kata sandi baru"
          minLength={6}
          autoComplete="new-password"
        />

        <ErrorBox>{error}</ErrorBox>

        <button
          type="submit"
          disabled={loading}
          className="rounded-full font-semibold text-sm py-3 flex items-center justify-center gap-2 transition-all duration-200 hover:brightness-105 hover:shadow-md disabled:opacity-40"
          style={{ background: C.primary, color: "#fff", boxShadow: "0 3px 10px rgba(50,74,56,0.28)", fontFamily: F_DISPLAY }}
        >
          {loading ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
          Simpan Kata Sandi Baru
        </button>
      </form>
      <HelpLink />
    </Shell>
  );
}