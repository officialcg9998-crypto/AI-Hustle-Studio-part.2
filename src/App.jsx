import { useState, useRef, useCallback, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";


// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const TABS = [
  { id: "colorStyle", label: "Color & Style", icon: "🎨" },
  { id: "media",      label: "Media",         icon: "🎬" },
  { id: "aiTools",    label: "AI Tools",      icon: "🤖" },
  { id: "plans",      label: "Plans",         icon: "💳" },
  { id: "settings",   label: "Settings",      icon: "⚙️"  },
];

const BG_PRESETS = [
  { id: "aurora", label: "Aurora", bg: "linear-gradient(135deg,#0f0c29,#302b63,#24243e)" },
  { id: "slate",  label: "Slate",  bg: "linear-gradient(160deg,#1a1a2e,#16213e,#0f3460)" },
  { id: "ember",  label: "Ember",  bg: "linear-gradient(135deg,#1a0505,#3d0000,#1a0a00)" },
  { id: "ocean",  label: "Ocean",  bg: "linear-gradient(135deg,#001f3f,#003366,#004080)" },
  { id: "forest", label: "Forest", bg: "linear-gradient(135deg,#052e16,#14532d,#064e3b)" },
  { id: "rose",   label: "Rose",   bg: "linear-gradient(135deg,#1f0010,#4a0020,#2d0a1a)" },
  { id: "gold",   label: "Gold",   bg: "linear-gradient(135deg,#1a1000,#3d2c00,#1a1500)" },
  { id: "void",   label: "Void",   bg: "#050508" },
];

const SWATCHES = ["#7c3aed","#2563eb","#0891b2","#059669","#d97706","#dc2626","#db2777","#f97316","#6d28d9","#334155","#e2e8f0","#ffffff"];

const DEFAULT_SCHEME = {
  bgMode: "preset", presetId: "aurora",
  uploadedB64: null, uploadedName: null, isVideo: false,
  bgOpacity: 100, bgBrightness: 85, bgSaturation: 100, bgBlur: 0, bgFit: "cover",
  tabTintColor: "#302b63", tabOpacity: 75,
  usePerApp: false,
  perAppOpacity: Object.fromEntries(TABS.map(t=>[t.id,75])),
};

function hexToRgb(hex) {
  if (!hex||hex.length<7) return "48,43,99";
  return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}

// ─── STORAGE HELPERS (step 3 — persist across sessions) ──────────────────────
const STORAGE_KEY = "ahs_bg_scheme_v1";
const SCHEMES_KEY = "ahs_saved_schemes_v1";

function loadScheme() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
function saveSchemeToStorage(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}
function loadSavedSchemes() {
  try { const s = localStorage.getItem(SCHEMES_KEY); return s ? JSON.parse(s) : []; } catch { return []; }
}
function saveSchemesToStorage(arr) {
  // don't store base64 blobs to keep localStorage lean
  try {
    const slim = arr.map(s=>({...s, uploadedB64: null}));
    localStorage.setItem(SCHEMES_KEY, JSON.stringify(slim));
  } catch {}
}

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const stored = loadScheme();
  const init   = stored ? {...DEFAULT_SCHEME, ...stored, uploadedB64: null} : DEFAULT_SCHEME;

  const [activeTab,     setActiveTab]     = useState("colorStyle");
  const [bgMode,        setBgMode]        = useState(init.bgMode);
  const [presetId,      setPresetId]      = useState(init.presetId);
  const [uploadedB64,   setUploadedB64]   = useState(null);
  const [uploadedName,  setUploadedName]  = useState(init.uploadedName);
  const [isVideo,       setIsVideo]       = useState(false);
  const [bgOpacity,     setBgOpacity]     = useState(init.bgOpacity);
  const [bgBrightness,  setBgBrightness]  = useState(init.bgBrightness);
  const [bgSaturation,  setBgSaturation]  = useState(init.bgSaturation);
  const [bgBlur,        setBgBlur]        = useState(init.bgBlur);
  const [bgFit,         setBgFit]         = useState(init.bgFit);
  const [tabTintColor,  setTabTintColor]  = useState(init.tabTintColor);
  const [tabOpacity,    setTabOpacity]    = useState(init.tabOpacity);
  const [usePerApp,     setUsePerApp]     = useState(init.usePerApp);
  const [perAppOpacity, setPerAppOpacity] = useState(init.perAppOpacity);
  const [savedSchemes,  setSavedSchemes]  = useState(loadSavedSchemes);
  const [toast,         setToast]         = useState(null);
  const [dragOver,      setDragOver]      = useState(false);
  const [unlocked,      setUnlocked]      = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const fileRef = useRef();

  const preset   = BG_PRESETS.find(p=>p.id===presetId)||BG_PRESETS[0];
  const rgb      = hexToRgb(tabTintColor);
  const curTabOp = usePerApp ? perAppOpacity[activeTab] : tabOpacity;

  // ── PERSIST active scheme whenever anything changes (step 3) ────────────────
  useEffect(() => {
    saveSchemeToStorage({ bgMode, presetId, uploadedName, isVideo,
      bgOpacity, bgBrightness, bgSaturation, bgBlur, bgFit,
      tabTintColor, tabOpacity, usePerApp, perAppOpacity });
  }, [bgMode,presetId,uploadedName,isVideo,bgOpacity,bgBrightness,bgSaturation,bgBlur,bgFit,
      tabTintColor,tabOpacity,usePerApp,perAppOpacity]);

  useEffect(() => { saveSchemesToStorage(savedSchemes); }, [savedSchemes]);

  // ── FILE → BASE64 ───────────────────────────────────────────────────────────
  const handleFile = useCallback((file) => {
    if (!file) return;
    const ok = ["image/jpeg","image/png","image/gif","image/webp","image/heic","image/heif","video/mp4","video/quicktime"];
    if (!ok.includes(file.type)) { flash("⚠️ Use JPG, PNG, GIF, WebP, or MOV/MP4","error"); return; }
    const vid = file.type.startsWith("video/");
    setIsVideo(vid); setUploadedName(file.name);
    const reader = new FileReader();
    reader.onload = e => { setUploadedB64(e.target.result); setBgMode("upload"); flash(`✅ Background set: ${file.name}`,"success"); };
    reader.readAsDataURL(file);
  }, []);

  const flash = (msg,type="info") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const removeUpload = () => { setUploadedB64(null); setUploadedName(null); setIsVideo(false); setBgMode("preset"); flash("Background removed.","info"); };

  const applyScheme = (s) => {
    setPresetId(s.presetId||"aurora"); setBgMode(s.bgMode||"preset");
    setBgOpacity(s.bgOpacity??100); setBgBrightness(s.bgBrightness??85);
    setBgSaturation(s.bgSaturation??100); setBgBlur(s.bgBlur??0); setBgFit(s.bgFit||"cover");
    setTabTintColor(s.tabTintColor||"#302b63"); setTabOpacity(s.tabOpacity??75);
    setUsePerApp(s.usePerApp||false); setPerAppOpacity(s.perAppOpacity||DEFAULT_SCHEME.perAppOpacity);
    if (s.uploadedB64) { setUploadedB64(s.uploadedB64); setUploadedName(s.uploadedName); }
    flash(`✅ Applied: ${s.label}`,"success");
  };

  const saveCurrentScheme = () => {
    if (!unlocked && savedSchemes.length >= 3) { setShowUnlockModal(true); return; }
    const s = { id:Date.now(), label:`Scheme ${savedSchemes.length+1}`,
      bgMode, presetId, uploadedB64, uploadedName, isVideo,
      bgOpacity, bgBrightness, bgSaturation, bgBlur, bgFit,
      tabTintColor, tabOpacity, usePerApp, perAppOpacity };
    setSavedSchemes(p=>[...p,s]);
    flash("💾 Scheme saved!","success");
  };

  // ── TAB STYLE ────────────────────────────────────────────────────────────────
  const tabStyle = (id, size="md") => {
    const active = id===activeTab;
    const op = usePerApp ? perAppOpacity[id]/100 : tabOpacity/100;
    const pad = size==="sm" ? "5px 12px" : "8px 18px";
    return {
      padding:pad, borderRadius:9, cursor:"pointer", fontFamily:"inherit",
      fontSize: size==="sm"?12:13, fontWeight:600,
      background:`rgba(${rgb},${op})`,
      border:`1.5px solid ${active?tabTintColor:`rgba(${rgb},0.45)`}`,
      color: active?"#fff":"rgba(255,255,255,0.6)",
      backdropFilter:"blur(12px)", transition:"all .2s",
      boxShadow: active?`0 0 16px ${tabTintColor}55`:"none",
    };
  };

  // ── BG FILTER ────────────────────────────────────────────────────────────────
  const bgFilter = `brightness(${bgBrightness}%) saturate(${bgSaturation}%)${bgBlur>0?` blur(${bgBlur}px)`:""}`;

  // ── BACKGROUND LAYER ─────────────────────────────────────────────────────────
  const BgLayer = () => {
    if (bgMode==="upload" && uploadedB64) {
      if (isVideo) return (
        <video src={uploadedB64} autoPlay loop muted playsInline
          style={{position:"absolute",inset:0,width:"100%",height:"100%",
            objectFit:bgFit==="contain"?"contain":"cover",opacity:bgOpacity/100,filter:bgFilter}}/>
      );
      return <div style={{position:"absolute",inset:0,
        backgroundImage:`url("${uploadedB64}")`,
        backgroundSize:bgFit==="tile"?"300px 300px":bgFit,
        backgroundPosition:"center",backgroundRepeat:bgFit==="tile"?"repeat":"no-repeat",
        opacity:bgOpacity/100,filter:bgFilter}}/>;
    }
    return <div style={{position:"absolute",inset:0,background:preset.bg,filter:bgFilter}}/>;
  };

  // ── RENDER ───────────────────────────────────────────────────────────────────
  return (
    <div style={{fontFamily:"'Syne','DM Sans',sans-serif",minHeight:"100vh",
      background:"#040408",color:"#e2e8f0",position:"relative",overflow:"hidden"}}>

      {/* LIVE BG */}
      <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden"}}>
        <BgLayer/>
        <div style={{position:"absolute",inset:0,background:"rgba(2,2,10,0.45)"}}/>
      </div>

      <div style={{position:"relative",zIndex:1}}>

        {/* ── NAV ── */}
        <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",
          padding:"14px 24px",borderBottom:`1px solid ${tabTintColor}22`,
          background:`rgba(${rgb},${tabOpacity/100})`,backdropFilter:"blur(16px)"}}>
          <div style={{fontWeight:800,fontSize:18,background:`linear-gradient(135deg,#fff,${tabTintColor})`,
            WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
            AI Hustle Studio
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)} style={tabStyle(t.id,"sm")}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:8}}>
            <a href="/login" style={{padding:"6px 14px",borderRadius:8,background:"transparent",
  border:`1px solid ${tabTintColor}55`,color:"#94a3b8",cursor:"pointer",fontSize:12,fontFamily:"inherit",textDecoration:"none"}}>Sign In</a>
<a href="/login" style={{padding:"6px 14px",borderRadius:8,
  background:`linear-gradient(135deg,${tabTintColor},${tabTintColor}bb)`,
  border:"none",color:"#fff",cursor:"pointer",fontSize:12,fontFamily:"inherit",fontWeight:700,
  boxShadow:`0 0 12px ${tabTintColor}44`,textDecoration:"none"}}>Free Trial</a>

          </div>
        </nav>

        {/* ── TAB CONTENT ── */}
        <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 18px 80px"}}>

          {activeTab==="colorStyle" && <ColorStyleTab {...{tabTintColor,tabOpacity,rgb,curTabOp,bgMode,presetId,setPresetId,
            uploadedB64,uploadedName,isVideo,bgOpacity,setBgOpacity,bgBrightness,setBgBrightness,
            bgSaturation,setBgSaturation,bgBlur,setBgBlur,bgFit,setBgFit,setBgMode,
            tabTintColor,setTabTintColor,tabOpacity,setTabOpacity,usePerApp,setUsePerApp,
            perAppOpacity,setPerAppOpacity,handleFile,removeUpload,dragOver,setDragOver,fileRef,
            savedSchemes,setSavedSchemes,saveCurrentScheme,applyScheme,unlocked,setShowUnlockModal,flash,BG_PRESETS}}/>}

          {activeTab==="media"      && <MediaTab tint={tabTintColor} rgb={rgb} op={curTabOp}/>}
          {activeTab==="aiTools"    && <AIToolsTab tint={tabTintColor} rgb={rgb} op={curTabOp}/>}
          {activeTab==="plans"      && <PlansTab tint={tabTintColor} rgb={rgb} op={curTabOp}/>}
          {activeTab==="settings"   && <SettingsTab {...{tabTintColor,tabOpacity,rgb,curTabOp,bgMode,presetId,setPresetId,
            uploadedB64,uploadedName,isVideo,bgOpacity,setBgOpacity,bgBrightness,setBgBrightness,
            bgSaturation,setBgSaturation,bgBlur,setBgBlur,bgFit,setBgFit,setBgMode,
            tabTintColor,setTabTintColor,tabOpacity,setTabOpacity,usePerApp,setUsePerApp,
            perAppOpacity,setPerAppOpacity,handleFile,removeUpload,dragOver,setDragOver,fileRef,
            savedSchemes,setSavedSchemes,saveCurrentScheme,applyScheme,unlocked,setUnlocked,setShowUnlockModal,flash,BG_PRESETS}}/>}
        </div>
      </div>

      {/* UNLOCK MODAL */}
      {showUnlockModal && (
        <div style={{position:"fixed",inset:0,zIndex:100,background:"rgba(0,0,0,0.7)",
          backdropFilter:"blur(8px)",display:"flex",alignItems:"center",justifyContent:"center"}}
          onClick={()=>setShowUnlockModal(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#0e0e1e",border:`1px solid ${tabTintColor}44`,
            borderRadius:18,padding:"32px 28px",maxWidth:360,width:"90%",textAlign:"center",
            boxShadow:`0 24px 60px rgba(0,0,0,0.6)`}}>
            <div style={{fontSize:36,marginBottom:12}}>🔓</div>
            <h2 style={{margin:"0 0 8px",fontSize:22,fontWeight:800}}>Unlock Unlimited Schemes</h2>
            <p style={{color:"#94a3b8",fontSize:14,marginBottom:20}}>
              Save unlimited background schemes, tint colors & visibility settings — permanently.
            </p>
            <div style={{fontSize:32,fontWeight:800,color:tabTintColor,marginBottom:20}}>$7 <span style={{fontSize:14,color:"#64748b",fontWeight:400}}>one-time</span></div>
            <button onClick={()=>{setUnlocked(true);setShowUnlockModal(false);flash("🎉 Unlocked! Unlimited schemes active.","success");}}
              style={{width:"100%",padding:"12px 0",borderRadius:10,
                background:`linear-gradient(135deg,${tabTintColor},#4f46e5)`,
                border:"none",color:"#fff",fontSize:16,fontFamily:"inherit",fontWeight:800,cursor:"pointer",
                boxShadow:`0 4px 20px ${tabTintColor}55`,marginBottom:10}}>
              Unlock for $7
            </button>
            <button onClick={()=>setShowUnlockModal(false)}
              style={{background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:13,fontFamily:"inherit"}}>
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* TOAST */}
      {toast && (
        <div style={{position:"fixed",bottom:22,left:"50%",transform:"translateX(-50%)",zIndex:200,
          padding:"11px 22px",borderRadius:12,fontWeight:600,fontSize:14,color:"#fff",whiteSpace:"nowrap",
          background:toast.type==="error"?"rgba(239,68,68,0.93)":toast.type==="success"?"rgba(34,197,94,0.93)":"rgba(96,165,250,0.93)",
          backdropFilter:"blur(10px)",boxShadow:"0 8px 24px rgba(0,0,0,0.4)",animation:"fadeIn .2s ease"}}>
          {toast.msg}
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&display=swap');
        *{box-sizing:border-box;}
        body{margin:0;}
        ::-webkit-scrollbar{width:5px;background:#040408;}
        ::-webkit-scrollbar-thumb{background:#2d2d4e;border-radius:3px;}
        @keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(8px);}to{opacity:1;transform:translateX(-50%) translateY(0);}}
        input[type=range]{-webkit-appearance:none;width:100%;height:4px;border-radius:2px;outline:none;cursor:pointer;}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:15px;height:15px;border-radius:50%;
          background:var(--tc,#a78bfa);border:2px solid #fff;cursor:pointer;box-shadow:0 0 6px var(--tc,#a78bfa)55;}
        select option{background:#12122a;}
      `}</style>
    </div>
  );
}

// ─── SHARED BACKGROUND CUSTOMIZER (used in both ColorStyle + Settings) ────────
function BgCustomizer({ tint, rgb, op, bgMode, presetId, setPresetId, uploadedB64, uploadedName,
  isVideo, bgOpacity, setBgOpacity, bgBrightness, setBgBrightness, bgSaturation, setBgSaturation,
  bgBlur, setBgBlur, bgFit, setBgFit, setBgMode, tabTintColor, setTabTintColor,
  tabOpacity, setTabOpacity, usePerApp, setUsePerApp, perAppOpacity, setPerAppOpacity,
  handleFile, removeUpload, dragOver, setDragOver, fileRef,
  savedSchemes, setSavedSchemes, saveCurrentScheme, applyScheme, unlocked, setShowUnlockModal, BG_PRESETS }) {

  const inlineFileRef = fileRef;

  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>

      {/* LEFT */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {/* Source */}
        <Panel tint={tint} title="🖼️ Background Source">
          <div style={{display:"flex",gap:8,marginBottom:12}}>
            {["preset","upload"].map(m=>(
              <Pill key={m} active={bgMode===m} tint={tint} onClick={()=>setBgMode(m)}>
                {m==="preset"?"🎨 Presets":"📁 Upload"}
              </Pill>
            ))}
          </div>
          {bgMode==="preset" ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7}}>
              {BG_PRESETS.map(p=>(
                <button key={p.id} onClick={()=>setPresetId(p.id)} style={{
                  height:40,borderRadius:8,cursor:"pointer",background:p.bg,fontFamily:"inherit",
                  border:`2px solid ${presetId===p.id?tint:"transparent"}`,fontSize:11,color:"#fff",fontWeight:700,
                  boxShadow:presetId===p.id?`0 0 0 3px ${tint}44`:"none",transition:"all .2s"}}>
                  {p.label}
                </button>
              ))}
            </div>
          ):(
            <>
              <div onClick={()=>inlineFileRef.current?.click()}
                onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files[0]);}}
                onDragOver={e=>{e.preventDefault();setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                style={{border:`2px dashed ${dragOver?tint:"#2d2d4e"}`,borderRadius:12,
                  padding:"18px 14px",textAlign:"center",cursor:"pointer",
                  background:dragOver?`${tint}14`:"rgba(255,255,255,0.02)",transition:"all .2s"}}>
                <div style={{fontSize:28,marginBottom:4}}>📸</div>
                <div style={{fontSize:13,color:"#94a3b8"}}>Tap or drop photo / GIF / video</div>
                <div style={{fontSize:11,color:"#475569",marginTop:3}}>JPG · PNG · GIF · WebP · MP4 · MOV</div>
              </div>
              <input ref={inlineFileRef} type="file" accept="image/*,video/mp4,video/quicktime"
                onChange={e=>handleFile(e.target.files[0])} style={{display:"none"}}/>
              {uploadedB64 && !isVideo && (
                <div style={{marginTop:8,borderRadius:9,overflow:"hidden",height:80,
                  border:`1.5px solid ${tint}44`,position:"relative"}}>
                  <img src={uploadedB64} alt="bg" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                  <div style={{position:"absolute",inset:0,background:"linear-gradient(to top,rgba(0,0,0,0.55),transparent)",
                    display:"flex",alignItems:"flex-end",padding:"5px 8px"}}>
                    <span style={{fontSize:11,color:"#fff",fontWeight:600}}>{uploadedName}</span>
                  </div>
                </div>
              )}
              {uploadedB64 && (
                <div style={{marginTop:8,display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"7px 12px",borderRadius:8,background:`${tint}18`,border:`1px solid ${tint}33`}}>
                  <span style={{fontSize:12,color:"#cbd5e1"}}>{isVideo?"🎥":"🖼️"} {uploadedName}</span>
                  <button onClick={removeUpload} style={{background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",
                    color:"#f87171",borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>Remove</button>
                </div>
              )}
            </>
          )}
        </Panel>

        {/* Visibility */}
        <Panel tint={tint} title="👁️ Background Visibility">
          <div style={{display:"flex",flexDirection:"column",gap:12}}>
            <Slider label="Opacity" value={bgOpacity} min={0} max={100} unit="%" tint={tint} onChange={setBgOpacity} bold/>
            <Slider label="Brightness" value={bgBrightness} min={10} max={150} unit="%" tint={tint} onChange={setBgBrightness}/>
            <Slider label="Saturation" value={bgSaturation} min={0} max={200} unit="%" tint="#60a5fa" onChange={setBgSaturation}/>
            <Slider label="Blur" value={bgBlur} min={0} max={20} unit="px" tint="#a78bfa" onChange={setBgBlur}/>
            <div>
              <div style={{fontSize:12,color:"#64748b",marginBottom:5}}>Image Fit</div>
              <div style={{display:"flex",gap:7}}>
                {["cover","contain","tile"].map(f=>(
                  <Pill key={f} active={bgFit===f} tint={tint} onClick={()=>setBgFit(f)}
                    style={{flex:1,textAlign:"center",fontSize:12,textTransform:"capitalize"}}>{f}</Pill>
                ))}
              </div>
            </div>
          </div>
        </Panel>
      </div>

      {/* RIGHT */}
      <div style={{display:"flex",flexDirection:"column",gap:14}}>

        {/* Tab Tint */}
        <Panel tint={tint} title="🎨 Tab Tint Color">
          <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
            <div style={{position:"relative",width:48,height:48,borderRadius:10,overflow:"hidden",
              border:`2px solid ${tint}`,boxShadow:`0 0 16px ${tint}55`,flexShrink:0}}>
              <input type="color" value={tabTintColor} onChange={e=>setTabTintColor(e.target.value)}
                style={{position:"absolute",inset:"-8px",width:"calc(100%+16px)",height:"calc(100%+16px)",
                  cursor:"pointer",opacity:1,border:"none",padding:0}}/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>Pick any color</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:2}}>Tints all tabs, borders & accents</div>
              <div style={{fontSize:13,color:tint,fontWeight:800,marginTop:2,letterSpacing:1}}>{tabTintColor.toUpperCase()}</div>
            </div>
          </div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:11,color:"#64748b",marginBottom:6}}>Quick Swatches</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {SWATCHES.map(c=>(
                <button key={c} onClick={()=>setTabTintColor(c)} style={{width:26,height:26,borderRadius:6,
                  background:c,cursor:"pointer",border:`2px solid ${tabTintColor===c?"#fff":"transparent"}`,
                  boxShadow:tabTintColor===c?`0 0 8px ${c}88`:"none",transition:"all .15s"}}/>
              ))}
            </div>
          </div>
          <div style={{borderTop:"1px solid rgba(255,255,255,0.06)",paddingTop:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,color:"#94a3b8",fontWeight:600}}>Tab Transparency</div>
              <label style={{display:"flex",alignItems:"center",gap:7,cursor:"pointer"}} onClick={()=>setUsePerApp(v=>!v)}>
                <Toggle on={usePerApp} tint={tint}/>
                <span style={{fontSize:11,color:usePerApp?tint:"#475569"}}>Per-app</span>
              </label>
            </div>
            {!usePerApp ? (
              <Slider label="All Tabs" value={tabOpacity} min={0} max={100} unit="%" tint={tint} onChange={setTabOpacity} bold/>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {TABS.map(a=>(
                  <Slider key={a.id} label={`${a.icon} ${a.label}`}
                    value={perAppOpacity[a.id]} min={0} max={100} unit="%"
                    tint={tint} highlight={false}
                    onChange={v=>setPerAppOpacity(p=>({...p,[a.id]:v}))}/>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {/* Saved Schemes */}
        <Panel tint={tint} title="💾 Saved Schemes">
          <button onClick={saveCurrentScheme} style={{width:"100%",padding:"10px 0",borderRadius:8,
            background:`linear-gradient(135deg,${tint},${tint}99)`,border:"none",color:"#fff",
            fontSize:14,fontFamily:"inherit",fontWeight:700,cursor:"pointer",marginBottom:10,
            boxShadow:`0 4px 16px ${tint}44`}}>
            Save Current Scheme
          </button>
          {!unlocked && savedSchemes.length>=3 && (
            <div style={{fontSize:11,color:"#64748b",textAlign:"center",marginBottom:8}}>
              🔒 3/3 free slots used —{" "}
              <span style={{color:tint,cursor:"pointer",fontWeight:700}} onClick={()=>setShowUnlockModal(true)}>
                unlock unlimited for $7
              </span>
            </div>
          )}
          {savedSchemes.length===0
            ? <p style={{fontSize:12,color:"#475569",textAlign:"center",margin:0}}>No saved schemes yet.</p>
            : savedSchemes.map(s=>(
                <div key={s.id} style={{marginBottom:7,padding:"8px 12px",borderRadius:8,
                  background:"rgba(255,255,255,0.03)",border:`1px solid ${s.tabTintColor||tint}33`,
                  display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:13,color:"#e2e8f0",fontWeight:600,display:"flex",alignItems:"center",gap:6}}>
                      <div style={{width:9,height:9,borderRadius:"50%",background:s.tabTintColor||tint,flexShrink:0}}/>
                      {s.label}
                    </div>
                    <div style={{fontSize:11,color:"#475569",marginTop:2}}>
                      {s.bgMode==="upload"?s.uploadedName||"Photo":s.presetId} · bg {s.bgOpacity}% · tabs {s.tabOpacity}%
                    </div>
                  </div>
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    <button onClick={()=>applyScheme(s)} style={{background:`${tint}22`,border:`1px solid ${tint}44`,
                      color:tint,borderRadius:6,padding:"3px 9px",cursor:"pointer",fontSize:11,fontFamily:"inherit",fontWeight:700}}>Apply</button>
                    <button onClick={()=>setSavedSchemes(p=>p.filter(x=>x.id!==s.id))}
                      style={{background:"transparent",border:"none",color:"#475569",cursor:"pointer",fontSize:15}}>✕</button>
                  </div>
                </div>
              ))
          }
        </Panel>

        {/* Persist notice */}
        <div style={{padding:"10px 14px",borderRadius:10,background:`${tint}0e`,
          border:`1px solid ${tint}22`,fontSize:12,color:"#94a3b8",textAlign:"center"}}>
          ✅ Your active scheme is <strong style={{color:tint}}>auto-saved</strong> and restores on next visit.
          {" "}{!unlocked && <>Scheme slots: {savedSchemes.length}/3 free — <span style={{color:tint,cursor:"pointer"}} onClick={()=>setShowUnlockModal(true)}>unlock $7</span></>}
          {unlocked && <span style={{color:"#22c55e"}}>🔓 Unlimited schemes active</span>}
        </div>
      </div>
    </div>
  );
}

// ─── COLOR & STYLE TAB ────────────────────────────────────────────────────────
function ColorStyleTab(props) {
  const { tint=props.tabTintColor, rgb, op } = { tint:props.tabTintColor, rgb:props.rgb, op:props.curTabOp };
  return (
    <div>
      <SectionHeader tint={tint} label="Color & Style" sub="Customize your platform's look — backgrounds, tab tints, and transparency."/>
      <BgCustomizer {...props} tint={tint}/>
    </div>
  );
}

// ─── SETTINGS TAB ────────────────────────────────────────────────────────────
function SettingsTab(props) {
  const tint = props.tabTintColor;
  const { unlocked, setUnlocked, setShowUnlockModal } = props;
  return (
    <div>
      <SectionHeader tint={tint} label="Settings" sub="Manage preferences, background studio, and account options."/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16,marginBottom:20}}>
        {/* Quick toggles */}
        <Panel tint={tint} title="⚙️ App Preferences">
          {[["Background transparency","Enabled"],["Media auto-preview","On"],["Show tier badges","On"],["Global letter color","Off"]].map(([label,val])=>(
            <div key={label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",
              padding:"10px 0",borderBottom:"1px solid rgba(255,255,255,0.05)"}}>
              <span style={{fontSize:13,color:"#cbd5e1"}}>{label}</span>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:11,color:tint}}>{val}</span>
                <div style={{width:32,height:18,borderRadius:9,background:`${tint}66`,cursor:"pointer"}}/>
              </div>
            </div>
          ))}
        </Panel>
        {/* Account */}
        <Panel tint={tint} title="👤 Account">
          <div style={{textAlign:"center",padding:"8px 0"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`${tint}33`,
              border:`2px solid ${tint}`,margin:"0 auto 10px",display:"flex",alignItems:"center",
              justifyContent:"center",fontSize:22}}>👤</div>
            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0"}}>Trial Account</div>
            <div style={{fontSize:12,color:"#64748b",marginTop:2}}>7-day trial active · All tools unlocked</div>
            <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:8}}>
              <button style={{padding:"8px 0",borderRadius:8,background:`${tint}22`,
                border:`1px solid ${tint}44`,color:tint,cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:600}}>
                Upgrade Plan
              </button>
              {!unlocked && (
                <button onClick={()=>setShowUnlockModal(true)} style={{padding:"8px 0",borderRadius:8,
                  background:"linear-gradient(135deg,#7c3aed,#4f46e5)",
                  border:"none",color:"#fff",cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>
                  🔓 Unlock Unlimited Edits — $7
                </button>
              )}
              {unlocked && (
                <div style={{fontSize:12,color:"#22c55e",fontWeight:600}}>🔓 Unlimited edits active</div>
              )}
            </div>
          </div>
        </Panel>
      </div>

      {/* Background Studio embedded in Settings */}
      <div style={{marginBottom:12}}>
        <div style={{fontSize:12,letterSpacing:3,color:tint,textTransform:"uppercase",marginBottom:8}}>Background Studio</div>
      </div>
      <BgCustomizer {...props} tint={tint}/>
    </div>
  );
}

// ─── MEDIA TAB ───────────────────────────────────────────────────────────────
function MediaTab({tint,rgb,op}) {
  const tools = [
    {icon:"✂️",label:"Smart Clip & Trim",desc:"AI removes dead air automatically"},
    {icon:"💬",label:"Auto Captions",desc:"Styled AI-generated subtitles"},
    {icon:"🔄",label:"Loop & Reverse",desc:"Boomerang & rewind effects"},
    {icon:"📱",label:"Reels Formatter",desc:"Auto-crop for any platform"},
    {icon:"🎵",label:"Audio Sync",desc:"Beat-match & royalty-free tracks"},
    {icon:"✨",label:"Scene Enhancement",desc:"AI lighting & color grading"},
  ];
  return (
    <div>
      <SectionHeader tint={tint} label="Media Editor" sub="All video and photo AI tools in one place."/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
        {tools.map(t=>(
          <div key={t.label} style={{padding:"18px 16px",borderRadius:12,
            background:`rgba(${rgb},${op})`,border:`1px solid ${tint}33`,
            backdropFilter:"blur(12px)",cursor:"pointer",transition:"all .2s",
            boxShadow:`0 2px 12px ${tint}11`}}>
            <div style={{fontSize:28,marginBottom:8}}>{t.icon}</div>
            <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>{t.label}</div>
            <div style={{fontSize:12,color:"#64748b"}}>{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── AI TOOLS TAB ─────────────────────────────────────────────────────────────
function AIToolsTab({tint,rgb,op}) {
  const tools=[
    {icon:"💰",label:"Pricing Advisor",tier:"Free",desc:"Smart competitive pricing"},
    {icon:"📧",label:"Cold Email Writer",tier:"Free",desc:"High-converting outreach"},
    {icon:"📝",label:"Product Description",tier:"Free",desc:"SEO-optimized copy"},
    {icon:"📣",label:"Ad Copy Generator",tier:"Pro",desc:"FB, Google & TikTok ads"},
    {icon:"🎯",label:"Sales Funnel Builder",tier:"Pro",desc:"AI-mapped conversion funnels"},
    {icon:"🔍",label:"Niche Finder",tier:"Elite",desc:"Trending products & demand"},
    {icon:"🤖",label:"AI Business Coach",tier:"Max",desc:"Personalized strategy"},
    {icon:"📈",label:"Revenue Forecaster",tier:"Max",desc:"AI-driven projections"},
  ];
  const tierColor = {"Free":"#22c55e","Pro":"#a78bfa","Elite":"#f59e0b","Max":"#ef4444"};
  return (
    <div>
      <SectionHeader tint={tint} label="AI Tools & Resources" sub="Every AI tool organized by tier. All unlimited during your trial."/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {tools.map(t=>(
          <div key={t.label} style={{padding:"14px",borderRadius:12,
            background:`rgba(${rgb},${op})`,border:`1px solid ${tint}33`,backdropFilter:"blur(12px)"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
              <span style={{fontSize:24}}>{t.icon}</span>
              <span style={{fontSize:10,fontWeight:700,padding:"2px 7px",borderRadius:5,
                background:`${tierColor[t.tier]}22`,color:tierColor[t.tier],border:`1px solid ${tierColor[t.tier]}44`}}>
                {t.tier}
              </span>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>{t.label}</div>
            <div style={{fontSize:11,color:"#64748b"}}>{t.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── PLANS TAB ────────────────────────────────────────────────────────────────
function PlansTab({tint,rgb,op}) {
  const plans=[
    {label:"Free",price:"$0",period:"/mo",features:["Pricing Advisor","5 Product Descriptions","3 Cold Emails","Custom color schemes"],popular:false},
    {label:"Starter",price:"$9",period:"/mo",features:["All Free unlimited","Smart Clip & Trim","AI Photo Editor","Auto Captions"],popular:false},
    {label:"Pro",price:"$27",period:"/mo",features:["Everything in Starter","Ad Copy Generator","Sales Funnel Builder","Social Caption Suite"],popular:true},
    {label:"Elite",price:"$57",period:"/mo",features:["Everything in Pro","Niche Finder","Influencer Matchmaker","Store Audit AI"],popular:false},
    {label:"Max",price:"$99",period:"/mo",features:["Everything in Elite","AI Business Coach","Revenue Forecaster","Full brand customization"],popular:false},
  ];
  return (
    <div>
      <SectionHeader tint={tint} label="Subscription Plans" sub="Five tiers built for every stage of your reseller journey."/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
        {plans.map(p=>(
          <div key={p.label} style={{padding:"18px 14px",borderRadius:14,position:"relative",
            background:p.popular?`${tint}22`:`rgba(${rgb},${op})`,
            border:`1.5px solid ${p.popular?tint:`${tint}22`}`,backdropFilter:"blur(12px)",
            boxShadow:p.popular?`0 0 20px ${tint}33`:"none"}}>
            {p.popular && <div style={{position:"absolute",top:-1,left:"50%",transform:"translateX(-50%)",
              fontSize:10,fontWeight:800,padding:"2px 10px",borderRadius:"0 0 8px 8px",
              background:tint,color:"#fff"}}>MOST POPULAR</div>}
            <div style={{fontWeight:800,fontSize:16,color:"#e2e8f0",marginBottom:4,marginTop:p.popular?8:0}}>{p.label}</div>
            <div style={{fontSize:24,fontWeight:800,color:p.popular?tint:"#e2e8f0"}}>{p.price}<span style={{fontSize:12,color:"#64748b",fontWeight:400}}>{p.period}</span></div>
            <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:6}}>
              {p.features.map(f=><div key={f} style={{fontSize:11,color:"#94a3b8",display:"flex",gap:5}}>
                <span style={{color:tint}}>✓</span>{f}
              </div>)}
            </div>
            <button style={{marginTop:14,width:"100%",padding:"8px 0",borderRadius:8,fontFamily:"inherit",fontWeight:700,
              fontSize:12,cursor:"pointer",
              background:p.popular?`linear-gradient(135deg,${tint},${tint}aa)`:"transparent",
              border:`1px solid ${p.popular?tint:`${tint}44`}`,
              color:p.popular?"#fff":tint}}>
              {p.label==="Free"?"Get Started":"Select Plan"}
            </button>
          </div>
        ))}
      </div>
      <div style={{marginTop:16,textAlign:"center",fontSize:13,color:"#64748b"}}>
        🎉 7-day free trial — everything unlimited, no credit card required
      </div>
    </div>
  );
}

// ─── SMALL SHARED COMPONENTS ──────────────────────────────────────────────────
function SectionHeader({tint,label,sub}) {
  return (
    <div style={{marginBottom:22}}>
      <div style={{fontSize:11,letterSpacing:4,color:tint,textTransform:"uppercase",marginBottom:5}}>{label}</div>
      <h2 style={{margin:0,fontSize:"clamp(20px,3vw,32px)",fontWeight:800,
        background:`linear-gradient(135deg,#fff 40%,${tint})`,
        WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>{label}</h2>
      {sub && <p style={{color:"#64748b",fontSize:13,margin:"6px 0 0"}}>{sub}</p>}
    </div>
  );
}

function Panel({tint="#a78bfa",title,children}) {
  return (
    <div style={{background:"rgba(8,8,20,0.82)",backdropFilter:"blur(16px)",
      border:`1px solid ${tint}20`,borderRadius:14,padding:"15px 16px"}}>
      <div style={{fontSize:12,fontWeight:700,color:"#64748b",marginBottom:11,letterSpacing:0.3}}>{title}</div>
      {children}
    </div>
  );
}

function Pill({active,tint,onClick,children,style={}}) {
  return (
    <button onClick={onClick} style={{padding:"7px 14px",borderRadius:8,cursor:"pointer",fontFamily:"inherit",
      fontSize:13,fontWeight:700,border:`1.5px solid ${active?tint:"#2d2d4e"}`,
      background:active?`${tint}22`:"rgba(255,255,255,0.03)",
      color:active?"#fff":"#64748b",transition:"all .2s",...style}}>{children}</button>
  );
}

function Slider({label,value,min,max,unit,onChange,tint="#a78bfa",bold=false,highlight=false}) {
  const pct=((value-min)/(max-min))*100;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
        <span style={{fontSize:12,color:bold||highlight?"#e2e8f0":"#64748b",fontWeight:bold||highlight?700:400}}>{label}</span>
        <span style={{fontSize:12,color:tint,fontWeight:700}}>{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={e=>onChange(Number(e.target.value))}
        style={{"--tc":tint,background:`linear-gradient(to right,${tint} ${pct}%,#2d2d4e ${pct}%)`}}/>
    </div>
  );
}

function Toggle({on,tint}) {
  return (
    <div style={{width:34,height:19,borderRadius:10,background:on?tint:"#2d2d4e",
      position:"relative",transition:"background .2s",cursor:"pointer",flexShrink:0}}>
      <div style={{position:"absolute",top:2,left:on?16:2,width:15,height:15,borderRadius:"50%",
        background:"#fff",transition:"left .2s",boxShadow:"0 1px 3px rgba(0,0,0,0.4)"}}/>
    </div>
  );
}
import Login from "./Login";

export function Root() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<App />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

function Landing() {
  useEffect(() => {
    window.location.href = "/landing.html";
  }, []);
  return null;
}
