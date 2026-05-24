import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";

// ─── FIREBASE CONFIG ─────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyAWFBYl2eCR5m3JybMwe-WSjq74jemxMfw",
  authDomain: "ai-hustle-studio.firebaseapp.com",
  projectId: "ai-hustle-studio",
  storageBucket: "ai-hustle-studio.firebasestorage.app",
  messagingSenderId: "108144561022",
  appId: "1:108144561022:web:11d78142fcae23dab4c12f",
};
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// ─── STRIPE CONFIG ───────────────────────────────────────────────
const STRIPE_CONFIG = {
  publishableKey: "YOUR_STRIPE_PUBLISHABLE_KEY",
  prices: {
    starter: "YOUR_STARTER_PRICE_ID",
    pro: "YOUR_PRO_PRICE_ID",
    unlimited: "YOUR_UNLIMITED_PRICE_ID",
  },
  successUrl: window.location.origin + "?session_id={CHECKOUT_SESSION_ID}&plan=",
  cancelUrl: window.location.origin + "?canceled=true",
};

// ─── PLAN CONFIG ─────────────────────────────────────────────────
const PLANS = [
  {
    id: "free", name: "Free", price: 0, priceLabel: "$0", period: "",
    tagline: "Try before you buy", color: "#6b7280", accent: "#9ca3af",
    gens: 5, tools: 2, stripePriceId: null,
    features: ["5 generations / month", "2 tools unlocked", "Standard output quality", "Copy to clipboard"],
    locked: ["Priority generation", "Export to PDF/DOC", "API access", "White-label rights"],
    cta: "Start Free", badge: null,
  },
  {
    id: "starter", name: "Starter", price: 19, priceLabel: "$19", period: "/mo",
    tagline: "For side hustlers getting started", color: "#10b981", accent: "#34d399",
    gens: 50, tools: 6, stripePriceId: STRIPE_CONFIG.prices.starter,
    features: ["50 generations / month", "All 6 tools unlocked", "Standard output quality", "Copy to clipboard"],
    locked: ["Priority generation", "Export to PDF/DOC", "API access", "White-label rights"],
    cta: "Start Earning", badge: null,
  },
  {
    id: "pro", name: "Pro", price: 49, priceLabel: "$49", period: "/mo",
    tagline: "For serious income builders", color: "#f59e0b", accent: "#fbbf24",
    gens: 300, tools: 6, stripePriceId: STRIPE_CONFIG.prices.pro,
    features: ["300 generations / month", "All 6 tools unlocked", "Priority output quality", "Export to PDF / DOC"],
    locked: ["API access", "White-label rights"],
    cta: "Go Pro", badge: "MOST POPULAR",
  },
  {
    id: "unlimited", name: "Unlimited", price: 99, priceLabel: "$99", period: "/mo",
    tagline: "For agencies & power users", color: "#ef4444", accent: "#f87171",
    gens: Infinity, tools: 6, stripePriceId: STRIPE_CONFIG.prices.unlimited,
    features: ["Unlimited generations", "All 6 tools unlocked", "Priority output quality", "Export to PDF / DOC", "API access", "White-label rights"],
    locked: [], cta: "Go Unlimited", badge: "BEST VALUE",
  },
];

const TOOLS = [
  {
    id: "product-desc", icon: "📦", label: "Product Descriptions", tag: "eCommerce", tagColor: "#f59e0b",
    pitch: "SEO-optimized listings that sell — for Etsy, Amazon, Shopify.",
    placeholder: "Describe your product (e.g. handmade lavender soy candle, 8oz, cotton wick)",
    minPlan: "free",
    systemPrompt: `You are an expert eCommerce copywriter. Generate a compelling, SEO-optimized product description. Include: a punchy headline, a 2-3 sentence hook, 4 bullet point features/benefits, and a closing CTA.`,
    userPrompt: (i) => `Write a product description for: ${i}`,
  },
  {
    id: "cold-email", icon: "✉️", label: "Cold Email Writer", tag: "Freelancing", tagColor: "#10b981",
    pitch: "Win clients on autopilot with emails that actually get replies.",
    placeholder: "Describe your service and target client (e.g. I do web design for local restaurants)",
    minPlan: "free",
    systemPrompt: `You are a cold email expert. Write a short, high-reply-rate cold email with: subject line, personalized opener, 1-2 sentence value prop, credibility signal, low-friction CTA. Under 120 words.`,
    userPrompt: (i) => `Write a cold email for: ${i}`,
  },
  {
    id: "youtube-hook", icon: "🎬", label: "YouTube Hook Generator", tag: "Creator Economy", tagColor: "#ef4444",
    pitch: "5 viral hooks for any video topic using proven psychological triggers.",
    placeholder: "Enter your video topic (e.g. how I made $5k in one month flipping furniture)",
    minPlan: "starter",
    systemPrompt: `You are a YouTube growth strategist. Generate 5 opening hooks using different psychological triggers (curiosity gap, bold claim, story, controversy, relatability). Number + label each. 1-3 sentences each.`,
    userPrompt: (i) => `Generate YouTube hooks for: ${i}`,
  },
  {
    id: "niche-ideas", icon: "💡", label: "Niche Business Finder", tag: "Entrepreneurship", tagColor: "#8b5cf6",
    pitch: "Discover untapped micro-niches you can monetize in 30 days.",
    placeholder: "Enter your skills or interests (e.g. I like fitness and I know Excel)",
    minPlan: "starter",
    systemPrompt: `You are a serial entrepreneur. Generate 5 specific micro-niche business ideas. For each: niche name, target customer, monetization method, estimated monthly revenue, one first step to start TODAY.`,
    userPrompt: (i) => `Generate niche business ideas for: ${i}`,
  },
  {
    id: "social-bio", icon: "🧲", label: "Social Media Bio", tag: "Personal Brand", tagColor: "#3b82f6",
    pitch: "Magnetic bios for Instagram, Twitter/X, and LinkedIn.",
    placeholder: "Tell me about yourself (e.g. fitness coach helping busy moms lose weight)",
    minPlan: "starter",
    systemPrompt: `You are a personal branding expert. Write 3 bios: Instagram (150 chars), Twitter/X (160 chars), LinkedIn (300 chars). Each: who you help, what transformation, CTA.`,
    userPrompt: (i) => `Write social media bios for: ${i}`,
  },
  {
    id: "pricing", icon: "💰", label: "Freelance Pricing Advisor", tag: "Freelancing", tagColor: "#10b981",
    pitch: "Stop undercharging. Custom pricing strategy for your exact service.",
    placeholder: "Describe your freelance service (e.g. I write blog posts for SaaS companies)",
    minPlan: "starter",
    systemPrompt: `You are a freelance business consultant. Provide: starter rate, mid-level rate, expert rate, a productized package with price, and one pricing psychology tip. Be specific with dollar amounts.`,
    userPrompt: (i) => `Create a pricing strategy for: ${i}`,
  },
];

const PLAN_ORDER = ["free", "starter", "pro", "unlimited"];
function planIndex(id) { return PLAN_ORDER.indexOf(id); }

async function redirectToStripeCheckout(plan) {
  const paymentLinks = {
    starter: "https://buy.stripe.com/eVqeVc6S13cX24b1Xg7wA00",
    pro: "https://buy.stripe.com/4gM00i2BL4h16kr7hA7wA01",
    unlimited: "https://buy.stripe.com/aFa9AS1xH00L9wD0Tc7wA02",
  };
  if (paymentLinks[plan.id]) {
    window.location.href = paymentLinks[plan.id];
  } else {
    alert("Payment link not found for this plan.");
  }
}

// ─── STYLES ──────────────────────────────────────────────────────
const S = {
  font: "'Palatino Linotype', Palatino, 'Book Antiqua', Georgia, serif",
  bg: "#07070e",
  card: "#0f0f1a",
  border: "#1a1a2a",
  text: "#e8e2d4",
  muted: "#555",
  gold: "#f59e0b",
  red: "#ef4444",
};

// ─── MAIN APP ────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState("signin"); // "signin" | "signup"

  const [page, setPage] = useState("landing");
  const [currentPlan, setCurrentPlan] = useState("free");
  const [genCounts, setGenCounts] = useState({});
  const [selected, setSelected] = useState(null);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(null);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // Handle Stripe return
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const plan = params.get("plan");
    const canceled = params.get("canceled");
    if (plan && PLAN_ORDER.includes(plan)) {
      setCurrentPlan(plan);
      setPage("app");
      window.history.replaceState({}, "", window.location.pathname);
    }
    if (canceled) {
      setPage("pricing");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleSignOut = async () => {
    await signOut(auth);
    setPage("landing");
    setCurrentPlan("free");
    setSelected(null);
  };

  const plan = PLANS.find(p => p.id === currentPlan);
  const usedGens = genCounts[currentPlan] || 0;
  const gensLeft = plan.gens === Infinity ? "∞" : Math.max(0, plan.gens - usedGens);
  const hasGens = plan.gens === Infinity || usedGens < plan.gens;
  const canUseTool = (tool) => planIndex(currentPlan) >= planIndex(tool.minPlan);

  const handleSelectTool = (tool) => {
    if (!user) { setAuthMode("signin"); setShowAuth(true); return; }
    if (!canUseTool(tool)) { setUpgradeReason(`The ${tool.label} tool requires the Starter plan or above.`); setShowUpgrade(true); return; }
    if (!hasGens) { setUpgradeReason(`You've used all ${plan.gens} generations on the ${plan.name} plan.`); setShowUpgrade(true); return; }
    setSelected(tool); setInput(""); setOutput("");
  };

  const handleGenerate = async () => {
    if (!input.trim() || !hasGens) return;
    setLoading(true); setOutput("");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: selected.systemPrompt,
          messages: [{ role: "user", content: selected.userPrompt(input) }],
        }),
      });
      const data = await res.json();
      const text = data.content?.map(b => b.text || "").join("\n") || "No response.";
      setOutput(text);
      setGenCounts(prev => ({ ...prev, [currentPlan]: (prev[currentPlan] || 0) + 1 }));
    } catch (e) {
      setOutput("Error generating. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId) => {
    if (!user) { setAuthMode("signup"); setShowAuth(true); return; }
    const selectedPlan = PLANS.find(p => p.id === planId);
    if (planId === "free") { setCurrentPlan("free"); setShowUpgrade(false); setPage("app"); return; }
    setCheckoutLoading(planId);
    await redirectToStripeCheckout(selectedPlan);
    setCheckoutLoading(null);
  };

  if (authLoading) return (
    <div style={{ minHeight: "100vh", background: S.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ color: S.gold, fontFamily: S.font, fontSize: 14, letterSpacing: "0.1em" }}>Loading...</div>
    </div>
  );

  return (
    <>
      {showAuth && (
        <AuthModal
          mode={authMode}
          onClose={() => setShowAuth(false)}
          onSwitch={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
          onSuccess={() => { setShowAuth(false); setPage("app"); }}
        />
      )}
      {page === "landing" && (
        <Landing
          user={user}
          onStart={() => setPage("pricing")}
          onFree={() => { if (!user) { setAuthMode("signup"); setShowAuth(true); } else { setCurrentPlan("free"); setPage("app"); } }}
          onSignIn={() => { setAuthMode("signin"); setShowAuth(true); }}
          onSignOut={handleSignOut}
          onApp={() => setPage("app")}
        />
      )}
      {page === "pricing" && (
        <PricingPage
          plans={PLANS} onSelect={handleSelectPlan}
          onBack={() => setPage("landing")} checkoutLoading={checkoutLoading}
          user={user} onSignIn={() => { setAuthMode("signin"); setShowAuth(true); }}
        />
      )}
      {page === "app" && (
        <AppShell plan={plan} gensLeft={gensLeft} onPricing={() => setPage("pricing")} user={user} onSignOut={handleSignOut}>
          {showUpgrade && (
            <UpgradeModal reason={upgradeReason} plans={PLANS} currentPlan={currentPlan}
              onSelect={handleSelectPlan} onClose={() => setShowUpgrade(false)} checkoutLoading={checkoutLoading} />
          )}
          {!selected ? (
            <ToolGrid tools={TOOLS} currentPlan={currentPlan} canUseTool={canUseTool} onSelect={handleSelectTool} />
          ) : (
            <ToolView tool={selected} input={input} setInput={setInput} output={output} loading={loading}
              onGenerate={handleGenerate} onBack={() => { setSelected(null); setOutput(""); setInput(""); }}
              plan={plan} gensLeft={gensLeft}
              onUpgrade={() => { setUpgradeReason("Upgrade for more generations and features."); setShowUpgrade(true); }} />
          )}
          <SetupGuide />
        </AppShell>
      )}
    </>
  );
}

// ─── AUTH MODAL ──────────────────────────────────────────────────
function AuthModal({ mode, onClose, onSwitch, onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === "signup";

  const handleGoogle = async () => {
    setLoading(true); setError("");
    try {
      await signInWithPopup(auth, googleProvider);
      onSuccess();
    } catch (e) {
      setError(e.message.replace("Firebase: ", "").replace(/ \(auth\/.*\)\.?/, ""));
    } finally {
      setLoading(false);
    }
  };

  const handleEmail = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true); setError("");
    try {
      if (isSignUp) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await updateProfile(cred.user, { displayName: name });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
    } catch (e) {
      const msg = e.code === "auth/email-already-in-use" ? "An account with this email already exists."
        : e.code === "auth/wrong-password" ? "Incorrect password."
        : e.code === "auth/user-not-found" ? "No account found with this email."
        : e.code === "auth/weak-password" ? "Password must be at least 6 characters."
        : e.code === "auth/invalid-email" ? "Please enter a valid email address."
        : "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.88)",
      zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: "#0d0d1a", border: "1px solid #f59e0b33",
        borderRadius: 24, padding: "36px 32px", maxWidth: 420, width: "100%",
        fontFamily: S.font, animation: "authPop 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: 20, color: "#000", margin: "0 auto 16px",
          }}>$</div>
          <h2 style={{ margin: "0 0 6px", color: "#fff", fontSize: 22, fontWeight: "normal" }}>
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p style={{ color: S.muted, fontSize: 13, margin: 0 }}>
            {isSignUp ? "Start your 7-day free trial — no card required" : "Sign in to AI Hustle Studio"}
          </p>
        </div>

        {/* Google Button */}
        <button onClick={handleGoogle} disabled={loading} style={{
          width: "100%", background: "#fff", color: "#111",
          border: "none", borderRadius: 12, padding: "13px",
          fontSize: 14, fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer",
          fontFamily: S.font, display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          marginBottom: 18, transition: "opacity 0.2s", opacity: loading ? 0.7 : 1,
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707s.102-1.167.282-1.707V4.961H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
          <div style={{ flex: 1, height: 1, background: "#1a1a2a" }} />
          <span style={{ color: "#333", fontSize: 12 }}>or</span>
          <div style={{ flex: 1, height: 1, background: "#1a1a2a" }} />
        </div>

        {/* Email Form */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {isSignUp && (
            <input
              type="text" placeholder="Your name (optional)" value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              onFocus={e => e.target.style.border = "1px solid #f59e0b55"}
              onBlur={e => e.target.style.border = "1px solid #1e1e30"}
            />
          )}
          <input
            type="email" placeholder="Email address" value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
            onFocus={e => e.target.style.border = "1px solid #f59e0b55"}
            onBlur={e => e.target.style.border = "1px solid #1e1e30"}
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleEmail()}
            style={inputStyle}
            onFocus={e => e.target.style.border = "1px solid #f59e0b55"}
            onBlur={e => e.target.style.border = "1px solid #1e1e30"}
          />
        </div>

        {error && (
          <div style={{
            marginTop: 12, padding: "10px 14px", background: "#ef444415",
            border: "1px solid #ef444433", borderRadius: 10,
            color: "#ef4444", fontSize: 12, lineHeight: 1.5,
          }}>{error}</div>
        )}

        <button onClick={handleEmail} disabled={loading} style={{
          width: "100%", marginTop: 14,
          background: loading ? "#151520" : "linear-gradient(135deg, #f59e0b, #ef4444)",
          color: loading ? "#333" : "#000",
          border: "none", borderRadius: 12, padding: "13px",
          fontSize: 14, fontWeight: "bold", cursor: loading ? "not-allowed" : "pointer",
          fontFamily: S.font, transition: "all 0.2s",
        }}>
          {loading ? "Please wait..." : isSignUp ? "Create Account →" : "Sign In →"}
        </button>

        <div style={{ textAlign: "center", marginTop: 18 }}>
          <span style={{ color: S.muted, fontSize: 13 }}>
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
          </span>
          <button onClick={onSwitch} style={{
            background: "none", border: "none", color: S.gold,
            fontSize: 13, cursor: "pointer", fontFamily: S.font, padding: 0,
          }}>
            {isSignUp ? "Sign in" : "Sign up free"}
          </button>
        </div>

        <button onClick={onClose} style={{
          position: "absolute", display: "block", margin: "12px auto 0",
          width: "100%", background: "none", border: "none",
          color: "#333", fontSize: 12, cursor: "pointer", fontFamily: S.font,
        }}>Close</button>
      </div>
      <style>{`@keyframes authPop { from { opacity:0; transform:scale(0.96) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
    </div>
  );
}

const inputStyle = {
  width: "100%", background: "#080812", border: "1px solid #1e1e30",
  borderRadius: 12, padding: "13px 14px", color: "#e8e2d4", fontSize: 14,
  outline: "none", fontFamily: S.font, boxSizing: "border-box", transition: "border 0.2s",
};

// ─── LANDING ─────────────────────────────────────────────────────
function Landing({ user, onStart, onFree, onSignIn, onSignOut, onApp }) {
  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: S.font, color: S.text }}>
      {/* Nav */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "18px 32px", borderBottom: "1px solid #111118",
        position: "sticky", top: 0, background: "#09090f", zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: 15, color: "#000",
          }}>$</div>
          <span style={{ fontSize: 15, fontWeight: "bold", color: "#fff", letterSpacing: "0.04em" }}>AI HUSTLE STUDIO</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user ? (
            <>
              <span style={{ color: S.muted, fontSize: 13 }}>
                {user.displayName || user.email?.split("@")[0]}
              </span>
              <button onClick={onApp} style={navBtnStyle("#f59e0b")}>Open App →</button>
              <button onClick={onSignOut} style={navBtnStyle("#333")}>Sign Out</button>
            </>
          ) : (
            <>
              <button onClick={onSignIn} style={navBtnStyle("#555")}>Sign In</button>
              <button onClick={onStart} style={navBtnStyle("#f59e0b")}>Get Started →</button>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: "0 auto", padding: "70px 24px 80px", textAlign: "center" }}>
        <span style={{
          display: "inline-block", border: "1px solid #f59e0b44", color: "#f59e0b",
          fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase",
          padding: "5px 16px", borderRadius: 30, background: "#f59e0b0a", marginBottom: 40,
        }}>AI-Powered · Income Generating · Stripe Payments</span>

        <h1 style={{ fontSize: "clamp(36px,6vw,68px)", fontWeight: "normal", lineHeight: 1.15, marginBottom: 24 }}>
          The AI that works<br />
          <span style={{ background: "linear-gradient(90deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            while you sleep
          </span>
        </h1>

        <p style={{ color: "#888", fontSize: 17, lineHeight: 1.7, maxWidth: 500, margin: "0 auto 48px" }}>
          Six AI-powered income tools. Real Stripe payments. Start free, scale to $99/mo. Built to generate revenue from day one.
        </p>

        <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={onStart} style={{
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            color: "#000", border: "none", borderRadius: 12,
            padding: "16px 36px", fontSize: 16, cursor: "pointer",
            fontFamily: S.font, fontWeight: "bold", letterSpacing: "0.04em",
            boxShadow: "0 8px 32px rgba(245,158,11,0.25)",
          }}>View Pricing & Subscribe →</button>
          <button onClick={onFree} style={{
            background: "transparent", color: "#777",
            border: "1px solid #2a2a3a", borderRadius: 12,
            padding: "16px 28px", fontSize: 15, cursor: "pointer", fontFamily: S.font,
          }}>Try Free (5 generations)</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 18, marginTop: 72 }}>
          {[
            { icon: "💳", title: "Stripe Payments", desc: "Secure recurring billing" },
            { icon: "⚡", title: "Instant output", desc: "Results in under 10 seconds" },
            { icon: "🔒", title: "No lock-in", desc: "Cancel anytime" },
            { icon: "💸", title: "Pays for itself", desc: "One client = months of sub" },
          ].map(f => (
            <div key={f.title} style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 16, padding: "22px 18px" }}>
              <div style={{ fontSize: 26, marginBottom: 10 }}>{f.icon}</div>
              <div style={{ fontWeight: "bold", color: S.text, marginBottom: 6, fontSize: 14 }}>{f.title}</div>
              <div style={{ color: "#555", fontSize: 12 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function navBtnStyle(color) {
  return {
    background: "transparent", border: `1px solid ${color}44`, color,
    borderRadius: 8, padding: "7px 16px", fontSize: 12, cursor: "pointer",
    fontFamily: S.font, fontWeight: "bold",
  };
}

// ─── PRICING PAGE ────────────────────────────────────────────────
function PricingPage({ plans, onSelect, onBack, checkoutLoading, user, onSignIn }) {
  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: S.font, color: S.text, padding: "48px 20px 80px" }}>
      <div style={{ maxWidth: 1020, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 36 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: 13, cursor: "pointer", fontFamily: S.font }}>← Back</button>
          {!user && (
            <button onClick={onSignIn} style={navBtnStyle("#f59e0b")}>Sign In</button>
          )}
        </div>

        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <h1 style={{ fontSize: "clamp(28px,4vw,44px)", fontWeight: "normal", marginBottom: 12 }}>Simple, honest pricing</h1>
          <p style={{ color: "#666", fontSize: 15 }}>Payments powered by Stripe · Cancel anytime · No hidden fees</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 20 }}>
          {plans.map(plan => <PlanCard key={plan.id} plan={plan} onSelect={onSelect} checkoutLoading={checkoutLoading} />)}
        </div>

        <div style={{ marginTop: 40, background: S.card, border: `1px solid ${S.border}`, borderRadius: 16, padding: "20px 28px", textAlign: "center" }}>
          <p style={{ color: "#555", fontSize: 13, margin: 0 }}>
            🔒 Payments are processed securely by <strong style={{ color: S.gold }}>Stripe</strong>.
            We never store your card details.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ plan, onSelect, checkoutLoading }) {
  const [hover, setHover] = useState(false);
  const isLoading = checkoutLoading === plan.id;
  const isPopular = plan.badge === "MOST POPULAR";
  const isBest = plan.badge === "BEST VALUE";

  return (
    <div
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "#13131f" : S.card,
        border: `1px solid ${hover || isPopular ? plan.color + "55" : S.border}`,
        borderRadius: 20, padding: "28px 22px", position: "relative",
        transition: "all 0.2s", transform: hover ? "translateY(-4px)" : "none",
        boxShadow: isPopular ? `0 0 40px ${plan.color}18` : "none",
      }}
    >
      {plan.badge && (
        <div style={{
          position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(90deg, ${plan.color}, ${plan.accent})`,
          color: "#000", fontSize: 10, fontWeight: "bold",
          letterSpacing: "0.12em", padding: "4px 14px", borderRadius: 20, whiteSpace: "nowrap",
        }}>{plan.badge}</div>
      )}
      <div style={{ color: plan.color, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 10 }}>{plan.name}</div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ fontSize: 38, fontWeight: "bold", color: "#fff" }}>{plan.priceLabel}</span>
        <span style={{ color: "#555", fontSize: 14 }}>{plan.period}</span>
      </div>
      <div style={{ color: "#555", fontSize: 12, marginBottom: 22 }}>{plan.tagline}</div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 12, color: plan.color, fontWeight: "bold", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${S.border}` }}>
          {plan.gens === Infinity ? "Unlimited" : plan.gens} generations · {plan.tools} tools
        </div>
        {plan.features.map(f => (
          <div key={f} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
            <span style={{ color: plan.color, fontSize: 12 }}>✓</span>
            <span style={{ color: "#aaa", fontSize: 12 }}>{f}</span>
          </div>
        ))}
        {plan.locked.map(f => (
          <div key={f} style={{ display: "flex", gap: 8, marginBottom: 7 }}>
            <span style={{ color: "#2a2a3a", fontSize: 12 }}>✗</span>
            <span style={{ color: "#333", fontSize: 12 }}>{f}</span>
          </div>
        ))}
      </div>
      <button onClick={() => onSelect(plan.id)} disabled={isLoading} style={{
        width: "100%",
        background: isLoading ? "#1a1a2a" : (isPopular || isBest) ? `linear-gradient(135deg, ${plan.color}, ${plan.accent})` : "transparent",
        color: isLoading ? "#444" : (isPopular || isBest) ? "#000" : plan.color,
        border: `1px solid ${plan.color}55`, borderRadius: 10,
        padding: "12px", fontSize: 13, fontWeight: "bold",
        cursor: isLoading ? "not-allowed" : "pointer",
        fontFamily: S.font, letterSpacing: "0.04em", transition: "all 0.2s",
      }}>
        {isLoading ? "Redirecting to Stripe..." : plan.id === "free" ? plan.cta : `💳 ${plan.cta}`}
      </button>
    </div>
  );
}

// ─── APP SHELL ───────────────────────────────────────────────────
function AppShell({ plan, gensLeft, onPricing, user, onSignOut, children }) {
  return (
    <div style={{ minHeight: "100vh", background: S.bg, fontFamily: S.font, color: S.text }}>
      <div style={{
        borderBottom: `1px solid #141420`, padding: "14px 28px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#09090f", position: "sticky", top: 0, zIndex: 50,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 7,
            background: "linear-gradient(135deg, #f59e0b, #ef4444)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: 15, color: "#000",
          }}>$</div>
          <span style={{ fontSize: 15, fontWeight: "bold", color: "#fff", letterSpacing: "0.04em" }}>AI HUSTLE STUDIO</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 12, color: "#555" }}>
            <span style={{ color: plan.color }}>{gensLeft}</span>
            {plan.gens !== Infinity && <span> gens left</span>}
          </div>
          <div style={{
            fontSize: 10, padding: "3px 10px", borderRadius: 20,
            border: `1px solid ${plan.color}44`, color: plan.color,
            textTransform: "uppercase", letterSpacing: "0.1em",
          }}>{plan.name}</div>
          <button onClick={onPricing} style={{
            background: "linear-gradient(90deg,#f59e0b,#ef4444)", color: "#000",
            border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 11,
            cursor: "pointer", fontFamily: S.font, fontWeight: "bold",
          }}>💳 Upgrade</button>
          {user && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {user.photoURL ? (
                <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: "50%", border: `1px solid ${S.border}` }} />
              ) : (
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: "linear-gradient(135deg, #f59e0b, #ef4444)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: "bold", color: "#000",
                }}>
                  {(user.displayName || user.email || "U")[0].toUpperCase()}
                </div>
              )}
              <button onClick={onSignOut} style={{
                background: "none", border: "none", color: "#444",
                fontSize: 11, cursor: "pointer", fontFamily: S.font,
              }}>Sign Out</button>
            </div>
          )}
        </div>
      </div>
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 20px" }}>{children}</div>
    </div>
  );
}

// ─── TOOL GRID ───────────────────────────────────────────────────
function ToolGrid({ tools, currentPlan, canUseTool, onSelect }) {
  return (
    <div>
      <h2 style={{ fontWeight: "normal", fontSize: 26, marginBottom: 6, color: "#fff" }}>Your Tools</h2>
      <p style={{ color: "#555", marginBottom: 28, fontSize: 13 }}>Pick a tool and start generating.</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(255px,1fr))", gap: 16 }}>
        {tools.map(tool => {
          const unlocked = canUseTool(tool);
          return (
            <div key={tool.id} onClick={() => onSelect(tool)}
              style={{
                background: S.card, border: `1px solid ${unlocked ? S.border : "#111118"}`,
                borderRadius: 16, padding: "24px 20px", cursor: "pointer",
                opacity: unlocked ? 1 : 0.5, position: "relative", transition: "all 0.2s",
              }}
              onMouseEnter={e => { if (unlocked) { e.currentTarget.style.border = `1px solid ${tool.tagColor}44`; e.currentTarget.style.transform = "translateY(-3px)"; }}}
              onMouseLeave={e => { e.currentTarget.style.border = `1px solid ${unlocked ? S.border : "#111118"}`; e.currentTarget.style.transform = "none"; }}
            >
              {!unlocked && <div style={{ position: "absolute", top: 14, right: 14, fontSize: 14 }}>🔒</div>}
              <div style={{ fontSize: 28, marginBottom: 10 }}>{tool.icon}</div>
              <div style={{
                display: "inline-block", fontSize: 10, textTransform: "uppercase",
                letterSpacing: "0.1em", color: tool.tagColor,
                background: tool.tagColor + "15", border: `1px solid ${tool.tagColor}30`,
                padding: "2px 8px", borderRadius: 20, marginBottom: 8,
              }}>{tool.tag}</div>
              <div style={{ fontWeight: "bold", color: "#fff", fontSize: 15, marginBottom: 6 }}>{tool.label}</div>
              <p style={{ color: "#555", fontSize: 12, lineHeight: 1.6, margin: 0 }}>{tool.pitch}</p>
              {!unlocked && <div style={{ marginTop: 10, fontSize: 11, color: tool.tagColor }}>Requires Starter plan</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── TOOL VIEW ───────────────────────────────────────────────────
function ToolView({ tool, input, setInput, output, loading, onGenerate, onBack, plan, gensLeft }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard?.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#555", fontSize: 12, cursor: "pointer", marginBottom: 24, fontFamily: S.font }}>← All Tools</button>
      <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 20, padding: "28px", marginBottom: 18 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
          <span style={{ fontSize: 30 }}>{tool.icon}</span>
          <div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: tool.tagColor, marginBottom: 4 }}>{tool.tag}</div>
            <h2 style={{ margin: 0, fontSize: 20, color: "#fff", fontWeight: "bold" }}>{tool.label}</h2>
          </div>
        </div>
        <textarea
          value={input} onChange={e => setInput(e.target.value)}
          placeholder={tool.placeholder} rows={4}
          style={{ ...inputStyle, resize: "vertical", lineHeight: 1.7 }}
          onFocus={e => e.target.style.border = `1px solid ${tool.tagColor}55`}
          onBlur={e => e.target.style.border = "1px solid #1e1e30"}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 12, alignItems: "center" }}>
          <button onClick={onGenerate} disabled={loading || !input.trim()} style={{
            flex: 1,
            background: loading || !input.trim() ? "#151520" : "linear-gradient(135deg, #f59e0b, #ef4444)",
            color: loading || !input.trim() ? "#333" : "#000",
            border: "none", borderRadius: 10, padding: "13px",
            fontSize: 14, fontWeight: "bold", cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            fontFamily: S.font, transition: "all 0.2s",
          }}>{loading ? "✦ Generating..." : "✦ Generate"}</button>
          <div style={{ fontSize: 11, color: "#444" }}>{plan.gens === Infinity ? "∞" : gensLeft} left</div>
        </div>
      </div>
      {output && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 20, padding: "26px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: tool.tagColor }}>✦ Result</div>
            <button onClick={handleCopy} style={{
              background: "none", border: `1px solid ${S.border}`, color: copied ? tool.tagColor : "#555",
              borderRadius: 8, padding: "5px 14px", fontSize: 11, cursor: "pointer", fontFamily: S.font,
            }}>{copied ? "✓ Copied!" : "Copy"}</button>
          </div>
          <div style={{ color: "#ccc8bc", fontSize: 14, lineHeight: 1.85, whiteSpace: "pre-wrap" }}>{output}</div>
        </div>
      )}
    </div>
  );
}

// ─── UPGRADE MODAL ───────────────────────────────────────────────
function UpgradeModal({ reason, plans, currentPlan, onSelect, onClose, checkoutLoading }) {
  const upgradePlans = plans.filter(p => planIndex(p.id) > planIndex(currentPlan));
  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div style={{
        background: S.card, border: "1px solid #f59e0b33",
        borderRadius: 24, padding: "32px 28px", maxWidth: 580, width: "100%",
      }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⚡</div>
          <h2 style={{ margin: "0 0 8px", color: "#fff", fontSize: 20, fontWeight: "normal" }}>Upgrade Your Plan</h2>
          <p style={{ color: "#666", fontSize: 13, margin: 0 }}>{reason}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px,1fr))", gap: 12 }}>
          {upgradePlans.map(plan => (
            <div key={plan.id} onClick={() => onSelect(plan.id)} style={{
              background: "#13131e", border: `1px solid ${plan.color}44`,
              borderRadius: 14, padding: "18px 14px", textAlign: "center", cursor: "pointer",
            }}>
              {plan.badge && <div style={{ fontSize: 9, color: plan.color, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>{plan.badge}</div>}
              <div style={{ fontSize: 20, fontWeight: "bold", color: "#fff" }}>{plan.priceLabel}</div>
              <div style={{ fontSize: 10, color: "#444" }}>{plan.period}</div>
              <div style={{ color: plan.color, fontWeight: "bold", fontSize: 13, marginTop: 6 }}>{plan.name}</div>
              <div style={{ color: "#444", fontSize: 10, marginTop: 4 }}>{plan.gens === Infinity ? "Unlimited" : plan.gens} gens</div>
              {checkoutLoading === plan.id && <div style={{ color: plan.color, fontSize: 10, marginTop: 4 }}>Redirecting...</div>}
            </div>
          ))}
        </div>
        <button onClick={onClose} style={{
          display: "block", width: "100%", background: "none",
          border: `1px solid ${S.border}`, color: "#444", borderRadius: 10,
          padding: "10px", marginTop: 14, fontSize: 12, cursor: "pointer", fontFamily: S.font,
        }}>Maybe later</button>
      </div>
    </div>
  );
}

// ─── SETUP GUIDE ─────────────────────────────────────────────────
function SetupGuide() {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ marginTop: 40, border: `1px solid ${S.border}`, borderRadius: 16, overflow: "hidden" }}>
      <div onClick={() => setOpen(!open)} style={{
        padding: "16px 20px", cursor: "pointer",
        display: "flex", justifyContent: "space-between", alignItems: "center", background: S.card,
      }}>
        <span style={{ fontSize: 13, color: S.gold, fontWeight: "bold" }}>⚙️ Stripe Setup Guide (click to expand)</span>
        <span style={{ color: "#444", fontSize: 12 }}>{open ? "▲" : "▼"}</span>
      </div>
      {open && (
        <div style={{ padding: "20px", background: "#0a0a12", fontSize: 13, color: "#777", lineHeight: 1.8 }}>
          <div style={{ color: S.text, fontWeight: "bold", marginBottom: 12 }}>3 steps to activate real payments:</div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: S.gold, marginBottom: 6 }}>Step 1 — Create Payment Links in Stripe</div>
            Go to <strong style={{ color: "#aaa" }}>Stripe Dashboard → Payment Links → Create Link</strong><br />
            Create one for each plan: Starter ($19/mo), Pro ($49/mo), Unlimited ($99/mo)
          </div>
          <div style={{ marginBottom: 16 }}>
            <div style={{ color: S.gold, marginBottom: 6 }}>Step 2 — Add your keys to the app code</div>
            In the code, find <code style={{ background: "#1a1a2a", padding: "2px 6px", borderRadius: 4 }}>STRIPE_CONFIG</code> at the top and replace the placeholder values.
          </div>
          <div>
            <div style={{ color: S.gold, marginBottom: 6 }}>Step 3 — Deploy your app</div>
            Host on <strong style={{ color: "#aaa" }}>Vercel</strong> and update the <code style={{ background: "#1a1a2a", padding: "2px 6px", borderRadius: 4 }}>successUrl</code> to your live domain.
          </div>
        </div>
      )}
    </div>
  );
}
