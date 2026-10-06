import { useEffect, useState, useRef } from "react";
import { supabase } from "./supabaseClient";
import { 
  CalendarCheck, ClipboardList, Award, ArrowRight, Download, 
  Crown, BookOpen, ShieldCheck, Wand2, Moon, Sun, Leaf
} from "lucide-react";
import html2canvas from "html2canvas";

// --- EXTENDED TAROT ARCANA (MONTHLY EVENT MODE) ---
const getTarotPersona = (sesi, nilai, persen) => {
  // 1. The Priestess (Dewa Bulanan: Sesi banyak, rajin nilai, disiplin tinggi)
  if (sesi >= 30 && nilai >= 4 && persen >= 95) return {
      numeral: "II", arcanaName: "Priestess", title: "Insightful Scholar",
      desc: "Flawless discipline & profound wisdom this month.",
      bgBase: "#1A237E", bgAccent: "#536DFE", textAccent: "#E8EAF6", Icon: Moon
  };
  
  // 2. The Sun (Raja Sesi: Tukang bantai kelas bulan ini)
  if (sesi >= 40) return {
      numeral: "XIX", arcanaName: "The Sun", title: "Radiant Leader",
      desc: "Illuminating the path through massive session volumes.",
      bgBase: "#E65100", bgAccent: "#FFAB00", textAccent: "#FFF3E0", Icon: Sun
  };
  
  // 3. The Hierophant (Tukang Ujian: Fokus penilaian bulan ini)
  if (nilai >= 5) return {
      numeral: "V", arcanaName: "Hierophant", title: "The Wise Guide",
      desc: "Relentless in academic devotion and objective evaluation.",
      bgBase: "#F57F17", bgAccent: "#FFF59D", textAccent: "#FFFDE7", Icon: BookOpen 
  };
  
  // 4. The Emperor (Guru Killer: Kehadiran murid nyaris 100% sempurna)
  if (persen >= 98 && sesi >= 12) return {
      numeral: "IV", arcanaName: "Emperor", title: "Absolute Authority",
      desc: "A fortress of absolute order built across the month.",
      bgBase: "#B71C1C", bgAccent: "#FF5252", textAccent: "#FFEBEE", Icon: Crown 
  };
  
  // 5. The Empress (Guru Favorit: Kehadiran tinggi, sesi di atas rata-rata)
  if (persen >= 90 && sesi >= 20) return {
      numeral: "III", arcanaName: "Empress", title: "Nurturing Soul",
      desc: "A thriving sanctuary of guidance this month.",
      bgBase: "#004D40", bgAccent: "#1DE9B6", textAccent: "#E0F2F1", Icon: Leaf
  };
  
  // 6. The Chariot (Si Rajin: Jam terbang standar-aktif bulanan)
  if (sesi >= 15) return {
      numeral: "VII", arcanaName: "Chariot", title: "Unstoppable Force",
      desc: "Driving the classroom forward, session after session.",
      bgBase: "#0D47A1", bgAccent: "#448AFF", textAccent: "#E3F2FD", Icon: ShieldCheck 
  };
  
  // 7. The Magician (Starter: Kurang dari 15 sesi bulan ini / jarang ngajar)
  return {
      numeral: "I", arcanaName: "Magician", title: "Dynamic Creator",
      desc: "Turning complexity into magic. Your journey unfolds.",
      bgBase: "#006064", bgAccent: "#18FFFF", textAccent: "#E0F7FA", Icon: Wand2 
  };
};

export default function PublicWrapped() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('wrapped');
    if (!id) return setLoading(false);

    supabase.from('wrapped_snapshots').select('*').eq('id', id).single()
      .then(({ data }) => { setData(data); setLoading(false); });
  }, []);

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3, 
        useCORS: true,
        backgroundColor: null // Biar background ikut kotak poster aja
      });
      const link = document.createElement("a");
      link.download = `Cognitive-Report-${data.nama_guru.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to extract cognitive data.");
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#111] text-white flex items-center justify-center font-mono uppercase tracking-widest text-sm">Extracting Data...</div>;
  if (!data) return <div className="min-h-screen bg-[#111] flex items-center justify-center font-mono text-red-500 uppercase tracking-widest">Record Not Found.</div>;

  const persona = getTarotPersona(data.total_sesi, data.total_nilai, data.kelas_terbaik_persen);
  
  // FIX: Javascript pemotong teks biar html2canvas gak mabok baca CSS Truncate
  const safeClassName = data.kelas_terbaik_nama.length > 12 
    ? data.kelas_terbaik_nama.substring(0, 12) + "..." 
    : data.kelas_terbaik_nama;

  return (
    <div className="min-h-screen bg-[#111] font-sans flex flex-col items-center justify-center py-6 px-4">
      
      {/* --- RENDERED POSTER AREA (STRICT 9:16 RATIO) --- */}
      <div 
        id="wrapped-card" 
        ref={cardRef}
        className="w-[360px] h-[640px] relative overflow-hidden shadow-2xl bg-[#111]"
      >
        {/* Background Canvas (Vibrant Colors) */}
        <div className="absolute inset-0 z-0" style={{ backgroundColor: persona.bgBase }}>
          {/* Halftone Dotted Pattern */}
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(#000 2px, transparent 2px)", backgroundSize: "16px 16px" }} />
          
          {/* Angular Slashes (Persona Vibes) */}
          <div className="absolute -right-[20%] top-[-5%] w-[150%] h-[40%] rotate-[-12deg] bg-black/25 origin-top-right" />
          <div className="absolute -left-[20%] bottom-[-5%] w-[150%] h-[35%] rotate-[15deg] origin-bottom-left" style={{ backgroundColor: persona.bgAccent, opacity: 0.15 }} />
        </div>

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col h-full p-6 text-white">
           
           {/* Top Header - REDESIGN TOTAL: Ala HUD UI Persona, Bersih, Anti-Bug */}
           <div className="flex justify-between items-center w-full border-b border-white/10 pb-6">
              
              {/* Kiri: Semester */}
              <div className="flex flex-col justify-center">
                <p className="text-[8px] font-black tracking-[0.3em] uppercase opacity-60 text-white">Teaching Record</p>
                <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none drop-shadow-md mt-1.5">{data.semester}</h1>
              </div>
              
              {/* Kanan: Nama Guru & Sekolah (Tanpa Kotak, Pakai Garis Aksen Vertikal) */}
              <div 
                className="flex flex-col items-end justify-center text-right border-r-[3px] pr-3 max-w-[160px]" 
                style={{ borderColor: persona.textAccent }}
              >
                <p className="text-[11px] font-black uppercase tracking-wider text-white leading-snug break-words">
                  {data.nama_guru}
                </p>
                {data.sekolah && (
                  <p 
                    className="text-[8px] font-bold uppercase tracking-widest mt-1.5 opacity-80 break-words" 
                    style={{ color: persona.textAccent }}
                  >
                    {data.sekolah}
                  </p>
                )}
              </div>
              
           </div>

           {/* Center Canvas: Tarot Representation */}
           <div className="flex-1 flex flex-col items-center justify-center relative mt-2">
              
              {/* Giant Faded Numeral Behind Card - FIX: Posisi absolut pasti di tengah, no blend mode */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] pointer-events-none z-0">
                <span className="text-[160px] font-black italic tracking-tighter text-white/10">{persona.numeral}</span>
              </div>
              
              {/* The Tarot Card */}
              <div className="w-[130px] h-[200px] bg-[#111] border-[3px] rounded-sm relative flex flex-col items-center justify-between p-2.5 shadow-[15px_15px_0px_rgba(0,0,0,0.35)] rotate-3 z-10" style={{ borderColor: persona.textAccent }}>
                 <div className="absolute inset-1.5 border-[1.5px] border-dashed opacity-40 pointer-events-none" style={{ borderColor: persona.textAccent }} />
                 <div className="z-10 font-serif font-black text-xl w-full text-left px-1" style={{ color: persona.textAccent }}>{persona.numeral}</div>
                 <persona.Icon size={64} style={{ color: persona.textAccent }} strokeWidth={1.5} />
                 <div className="z-10 w-full bg-black/90 text-center text-[9px] py-1.5 font-black tracking-[0.2em] border-t-2 uppercase" style={{ color: persona.textAccent, borderColor: persona.textAccent }}>
                    {persona.arcanaName}
                 </div>
              </div>

              {/* Persona Title & Desc */}
              <div className="mt-8 text-center z-10">
                 <h2 className="text-[22px] font-black uppercase italic drop-shadow-lg leading-tight tracking-tight" style={{ textShadow: `2px 2px 0px #000` }}>{persona.title}</h2>
                 <p className="text-[11px] font-bold mt-2 px-2 opacity-90 drop-shadow-md leading-relaxed">{persona.desc}</p>
              </div>
           </div>

           {/* Bottom Stats Grid - FIX: bg-black/30 solid dan JS text potong biar font aman */}
           <div className="grid grid-cols-3 gap-2 mt-4 z-10">
              <div className="bg-black/30 py-3 px-1 border border-white/10 flex flex-col items-center justify-center text-center rounded-lg">
                 <CalendarCheck size={16} className="mb-1.5 opacity-80" />
                 <p className="text-2xl font-black leading-none">{data.total_sesi}</p>
                 <p className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-1">Sessions</p>
              </div>
              <div className="bg-black/30 py-3 px-1 border border-white/10 flex flex-col items-center justify-center text-center rounded-lg">
                 <ClipboardList size={16} className="mb-1.5 opacity-80" />
                 <p className="text-2xl font-black leading-none">{data.total_nilai}</p>
                 <p className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-1">Grades</p>
              </div>
              <div className="bg-black/30 py-3 px-1 border border-white/10 flex flex-col items-center justify-center text-center rounded-lg">
                 <Award size={16} className="mb-1.5 opacity-80" />
                 <p className="text-[13px] font-black leading-tight uppercase px-1 text-center w-full break-words">{safeClassName}</p>
                 <p className="text-[8px] font-bold uppercase tracking-widest opacity-70 mt-0.5">{Number(data.kelas_terbaik_persen).toFixed(1)}% Att.</p>
              </div>
           </div>

           {/* Footer Watermark (Bersih) */}
           <div className="mt-5 pt-4 border-t border-white/20 flex justify-end items-end z-10">
              <div className="text-right">
                <p className="text-[7px] font-black uppercase tracking-[0.3em] opacity-60">Verified Record</p>
                <p className="font-black text-sm tracking-widest uppercase italic mt-0.5">NGAJAR<span style={{ color: persona.bgAccent }}>GUEH</span></p>
              </div>
           </div>
        </div>
      </div>
      {/* --- END RENDERED POSTER AREA --- */}

      {/* Action Buttons (Hidden from Download) */}
      <div className="mt-6 flex flex-col sm:flex-row gap-3 w-[360px]">
        <button 
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 bg-white/10 border border-white/20 text-white px-4 py-3.5 rounded-xl font-bold hover:bg-white/20 transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 uppercase tracking-wide"
        >
          <Download size={16} /> {downloading ? "Saving..." : "Save Image"}
        </button>
        
        <a 
          href="/" 
          className="flex-1 bg-white text-black px-4 py-3.5 rounded-xl font-black hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(255,255,255,0.3)] uppercase tracking-wider"
        >
          Enter Workspace <ArrowRight size={16} />
        </a>
      </div>

    </div>
  )
}