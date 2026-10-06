import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import Auth, { ResetPassword } from "./Auth.jsx";
import PublicWrapped from "./PublicWrapped.jsx"; // <-- 1. Import komponen Wrapped
import { supabase } from "./supabaseClient.js";
import "./index.css";

function Root() {
  // <-- 2. BYPASS LOGIC: Cek apakah ada parameter "wrapped" di URL
  const wrappedId = new URLSearchParams(window.location.search).get('wrapped');
  
  const [session, setSession] = useState(undefined); 
  const [passwordRecovery, setPasswordRecovery] = useState(false);

  useEffect(() => {
    // Kalau ini halaman Wrapped publik, gak usah repot-repot cek sesi login!
    if (wrappedId) return;

    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((event, sess) => {
      setSession(sess);
      if (event === "PASSWORD_RECOVERY") setPasswordRecovery(true);
    });
    return () => listener?.subscription.unsubscribe();
  }, [wrappedId]);

  // <-- 3. Kalau URL-nya halaman Wrapped, langsung tampilin!
  if (wrappedId) {
    return <PublicWrapped />;
  }

  if (session === undefined) {
    return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Memuat…</div>;
  }
  if (passwordRecovery) {
    return <ResetPassword onDone={() => setPasswordRecovery(false)} />;
  }
  if (!session) {
    return <Auth onSuccess={() => {}} />;
  }
  return <App session={session} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}