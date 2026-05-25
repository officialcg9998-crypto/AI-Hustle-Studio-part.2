import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./Login";

const TOOLS = [
  { id:"pricing", icon:"💰", name:"Pricing Advisor", tier:"free", desc:"Smart competitive pricing" },
  { id:"email", icon:"📧", name:"Cold Email Writer", tier:"free", desc:"High-converting outreach" },
  { id:"product", icon:"📝", name:"Product Description", tier:"free", desc:"SEO-optimized copy" },
  { id:"adcopy", icon:"📣", name:"Ad Copy Generator", tier:"starter", desc:"FB, Google & TikTok ads" },
  { id:"funnel", icon:"🎯", name:"Sales Funnel Builder", tier:"pro", desc:"AI-mapped funnels" },
  { id:"niche", icon:"🔍", name:"Niche Finder", tier:"elite", desc:"Trending products & demand" },
  { id:"coach", icon:"🤖", name:"AI Business Coach", tier:"max", desc:"Personalized strategy" },
  { id:"revenue", icon:"📈", name:"Revenue Forecaster", tier:"max", desc:"AI-driven projections" },
];

function canAccess(userTier, toolTier) {
  if (userTier === "unlimited" || userTier === "trial") return true;
  const order = ["free","starter","pro","elite","max"];
  return order.indexOf(userTier) >= order.indexOf(toolTier);
}

function Dashboard({ tier, email, onSignOut }) {
  const [activeTab, setActiveTab] = useState("tools");
  const tabs = [
    { id:"tools", label:"🤖 AI Tools" },
    { id:"plans", label:"💳 Plans" },
    { id:"settings", label:"⚙️ Settings" },
  ];

  return (
    <div style={{minHeight:"100vh",background:"#040408",color:"#e2e8f0",fontFamily:"'Syne',sans-serif"}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",
        padding:"14px 24px",background:"rgba(124,58,237,0.15)",
        backdropFilter:"blur(16px)",borderBottom:"1px solid #7c3aed33"}}>
        <div style={{fontWeight:800,fontSize:18,color:"#fff"}}>AI Hustle Studio</div>
        <div style={{display:"flex",gap:8}}>
          {tabs.map(t=>(
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{padding:"7px 16px",borderRadius:8,cursor:"pointer",
                fontFamily:"inherit",fontSize:13,fontWeight:600,
                background:activeTab===t.id?"#7c3aed":"transparent",
                border:`1px solid ${activeTab===t.id?"#7c3aed":"#7c3aed44"}`,
                color:activeTab===t.id?"#fff":"#94a3b8"}}>
              {t.label}
            </button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{fontSize:12,color:"#64748b"}}>
            {tier==="unlimited"?"👑 Owner":tier==="trial"?"🎉 Trial":tier==="free"?"🆓 Free":`⭐ ${tier}`}
          </div>
          <button onClick={onSignOut}
            style={{padding:"6px 14px",borderRadius:8,background:"transparent",
              border:"1px solid #ef444444",color:"#ef4444",cursor:"pointer",
              fontSize:12,fontFamily:"inherit"}}>Sign Out</button>
        </div>
      </nav>

      <div style={{maxWidth:1100,margin:"0 auto",padding:"28px 18px"}}>
        {activeTab==="tools" && (
          <div>
            <h2 style={{fontSize:28,fontWeight:800,color:"#fff",marginBottom:6}}>Your AI Toolkit</h2>
            <p style={{color:"#64748b",fontSize:14,marginBottom:24}}>
              {tier==="trial"?"All tools unlocked — trial active":
               tier==="unlimited"?"Full owner access":
               "Upgrade to unlock more tools"}
            </p>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:16}}>
              {TOOLS.map(tool=>{
                const access = canAccess(tier, tool.tier);
                return (
                  <div key={tool.id} style={{padding:"20px",borderRadius:14,
                    background:access?"rgba(124,58,237,0.12)":"rgba(255,255,255,0.02)",
                    border:`1px solid ${access?"#7c3aed44":"#ffffff11"}`,
                    opacity:access?1:0.5,position:"relative"}}>
                    {!access && (
                      <div style={{position:"absolute",top:12,right:12,fontSize:10,
                        fontWeight:700,padding:"2px 8px",borderRadius:20,
                        background:"rgba(239,68,68,0.15)",color:"#ef4444",
                        border:"1px solid rgba(239,68,68,0.3)"}}>
                        🔒 {tool.tier.toUpperCase()}
                      </div>
                    )}
                    <div style={{fontSize:28,marginBottom:10}}>{tool.icon}</div>
                    <div style={{fontSize:14,fontWeight:700,color:"#e2e8f0",marginBottom:4}}>{tool.name}</div>
                    <div style={{fontSize:12,color:"#64748b",marginBottom:14}}>{tool.desc}</div>
                    <button disabled={!access}
                      style={{width:"100%",padding:"9px",borderRadius:8,
                        background:access?"#7c3aed":"#2d2d4e",border:"none",
                        color:access?"#fff":"#475569",
                        cursor:access?"pointer":"not-allowed",
                        fontSize:13,fontFamily:"inherit",fontWeight:600}}>
                      {access?"Use Tool →":"Upgrade to Unlock"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab==="plans" && (
          <div>
            <h2 style={{fontSize:28,fontWeight:800,color:"#fff",marginBottom:24}}>Choose Your Plan</h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16}}>
              {[
                {name:"Free",price:"$0",features:["3 AI Tools","5 uses/day"],stripe:null},
                {name:"Starter",price:"$19",features:["4 AI Tools","50 uses/mo"],stripe:"https://buy.stripe.com/eVqeVc6S13cX24b1Xg7wA00"},
                {name:"Pro",price:"$49",features:["5 AI Tools","300 uses/mo","Priority output"],stripe:"https://buy.stripe.com/4gM00i2BL4h16kr7hA7wA01",popular:true},
                {name:"Elite",price:"$57",features:["6 AI Tools","500 uses/mo"],stripe:"https://buy.stripe.com/4gM00i2BL4h16kr7hA7wA01"},
                {name:"Max",price:"$99",features:["All Tools","Unlimited","API Access"],stripe:"https://buy.stripe.com/aFa9AS1xH00L9wD0Tc7wA02"},
              ].map(p=>(
                <div key={p.name} style={{padding:"20px 16px",borderRadius:14,
                  background:p.popular?"rgba(124,58,237,0.2)":"rgba(255,255,255,0.03)",
                  border:`1.5px solid ${p.popular?"#7c3aed":"#ffffff11"}`,position:"relative"}}>
                  {p.popular && <div style={{position:"absolute",top:-1,left:"50%",
                    transform:"translateX(-50%)",fontSize:10,fontWeight:800,
                    padding:"2px 12px",borderRadius:"0 0 8px 8px",
                    background:"#7c3aed",color:"#fff"}}>POPULAR</div>}
                  <div style={{fontWeight:800,fontSize:16,color:"#e2e8f0",
                    marginBottom:4,marginTop:p.popular?10:0}}>{p.name}</div>
                  <div style={{fontSize:24,fontWeight:800,color:p.popular?"#a78bfa":"#e2e8f0",marginBottom:12}}>
                    {p.price}<span style={{fontSize:12,color:"#64748b",fontWeight:400}}>/mo</span>
                  </div>
                  {p.features.map(f=>(
                    <div key={f} style={{fontSize:12,color:"#94a3b8",display:"flex",gap:6,marginBottom:4}}>
                      <span style={{color:"#7c3aed"}}>✓</span>{f}
                    </div>
                  ))}
                  <button onClick={()=>p.stripe&&window.open(p.stripe)}
                    style={{width:"100%",padding:"9px",borderRadius:8,marginTop:14,
                      background:p.popular?"#7c3aed":"transparent",
                      border:`1px solid ${p.popular?"#7c3aed":"#7c3aed44"}`,
                      color:p.popular?"#fff":"#a78bfa",
                      cursor:"pointer",fontSize:13,fontFamily:"inherit",fontWeight:700}}>
                    {p.name==="Free"?"Current Plan":"💳 Upgrade"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab==="settings" && (
          <div style={{maxWidth:480}}>
            <h2 style={{fontSize:28,fontWeight:800,color:"#fff",marginBottom:24}}>Account</h2>
            <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid #7c3aed33",
              borderRadius:14,padding:"24px",textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:12}}>👤</div>
              <div style={{fontWeight:700,color:"#e2e8f0",fontSize:15}}>{email}</div>
              <div style={{fontSize:12,color:"#64748b",marginTop:4,marginBottom:20}}>
                {tier==="unlimited"?"👑 Owner — Unlimited Access":
                 tier==="trial"?"🎉 7-Day Free Trial Active":
                 `⭐ ${tier} Plan`}
              </div>
              <button onClick={onSignOut}
                style={{width:"100%",padding:"11px",borderRadius:10,
                  background:"rgba(239,68,68,0.15)",border:"1px solid rgba(239,68,68,0.3)",
                  color:"#ef4444",cursor:"pointer",fontSize:14,
                  fontFamily:"inherit",fontWeight:700}}>
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LandingPage() {
  return (
    <div style={{minHeight:"100vh",background:"#040408",
      display:"flex",flexDirection:"column",alignItems:"center",
      justifyContent:"center",fontFamily:"'Syne',sans-serif",color:"#fff"}}>
      <h1 style={{fontSize:"clamp(40px,7vw,80px)",fontWeight:800,marginBottom:20,
        background:"linear-gradient(135deg,#fff 40%,#7c3aed)",
        WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
        AI Hustle Studio
      </h1>
      <p style={{color:"#64748b",marginBottom:32,fontSize:16}}>
        The AI that works while you sleep
      </p>
      <div style={{display:"flex",gap:12}}>
        <button onClick={()=>window.location.href="/login"}
          style={{padding:"12px 28px",borderRadius:10,background:"#7c3aed",
            border:"none",color:"#fff",fontSize:15,fontFamily:"inherit",
            fontWeight:700,cursor:"pointer"}}>
          Start Free →
        </button>
        <button onClick={()=>window.location.href="/login"}
          style={{padding:"12px 28px",borderRadius:10,background:"transparent",
            border:"1px solid #7c3aed44",color:"#94a3b8",fontSize:15,
            fontFamily:"inherit",cursor:"pointer"}}>
          Sign In
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return <LandingPage />;
}

export function Root() {
  const [user, setUser] = useState(null);
  const [tier, setTier] = useState("free");

  const handleLogin = (userData) => {
    setUser(userData);
    setTier(userData.tier);
  };

  const handleSignOut = () => {
    setUser(null);
    setTier("free");
    window.location.href = "/";
  };

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
 <Route path="/dashboard" element={
          <Dashboard tier={tier} email="test@test.com" onSignOut={handleSignOut} />
        } />
      </Routes>
    </BrowserRouter>
  );
}
