# AI Hustle Studio

> AI-powered reseller platform — sell smarter, grow faster, create freely.

A fully functional single-page marketing website + interactive app demo for the AI Hustle Studio platform. Built with vanilla HTML, CSS, and JavaScript — no build step required.

---

## 🚀 Live Demo

Deploy instantly via [GitHub Pages](#deploying-to-github-pages) or [Vercel](#deploying-to-vercel).

---

## ✨ Features

- **Sign In / Sign Up modals** with form validation and Google OAuth hook
- **7-Day Free Trial flow** with plan selector (Free → Max)
- **Live AI tool demos** — Pricing Advisor, Cold Email Writer, Product Description, Description Writer (powered by Claude API)
- **Billing toggle** — monthly / annual pricing switch
- **Mobile-responsive** with hamburger nav drawer
- **Animated scroll reveals**, color swatch selector, tab switching, and media mockup

---

## 📁 Project Structure

```
ai-hustle-studio/
├── index.html          # Main site (all HTML, CSS, JS in one file)
├── .env.example        # Environment variable template
├── .gitignore
├── README.md
└── .github/
    └── workflows/
        └── deploy.yml  # GitHub Pages auto-deploy workflow
```

---

## 🔧 Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/ai-hustle-studio.git
cd ai-hustle-studio
```

### 2. Configure environment variables

The site uses the Anthropic API for live AI tool demos. You need to provide your API key.

```bash
cp .env.example .env.local
# Edit .env.local and add your key
```

> ⚠️ **Important:** The current demo calls the Anthropic API directly from the browser. For production, proxy requests through a backend so your API key is never exposed client-side. See [Backend Proxy Setup](#backend-proxy-setup) below.

### 3. Open locally

No build step needed — just open `index.html` in your browser:

```bash
open index.html
# or serve with any static server:
npx serve .
```

---

## 🌐 Deploying to GitHub Pages

### Automatic (recommended)

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml` that auto-deploys to GitHub Pages on every push to `main`.

1. Push this repo to GitHub
2. Go to **Settings → Pages**
3. Set Source to **GitHub Actions**
4. Add your `ANTHROPIC_API_KEY` secret:
   - **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `ANTHROPIC_API_KEY`

Every push to `main` will deploy automatically.

### Manual

1. Go to **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. Save — your site will be live at `https://YOUR_USERNAME.github.io/ai-hustle-studio/`

---

## ▲ Deploying to Vercel

```bash
npm i -g vercel
vercel
```

Add `ANTHROPIC_API_KEY` in your Vercel project's Environment Variables dashboard.

---

## 🔑 Backend Proxy Setup

For production, never expose your Anthropic API key in client-side code. Replace the direct fetch in `index.html` with a call to your own backend endpoint:

```js
// Instead of calling api.anthropic.com directly:
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ tool: toolName, input: userInput })
});
```

Your backend (Node/Express, Next.js API route, Vercel serverless function, etc.) then calls Anthropic with the key stored securely in an environment variable.

---

## 🔌 Wiring Up Authentication

The Sign In and Sign Up forms are UI-complete. To connect real auth:

1. **Supabase (recommended for quick setup)**
   ```bash
   npm install @supabase/supabase-js
   ```
   Replace `handleSignIn()` and `handleTrialSignup()` in `index.html` with Supabase auth calls.

2. **Firebase Auth** — swap the handlers for `signInWithEmailAndPassword` / `createUserWithEmailAndPassword`.

3. **Google OAuth** — fill in your Google Client ID in the `handleGoogleAuth()` function.

---

## 📋 Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key for AI tool demos |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `SUPABASE_URL` | Supabase project URL (optional) |
| `SUPABASE_ANON_KEY` | Supabase anon/public key (optional) |

---

## 📄 License

MIT — free to use, modify, and deploy.
