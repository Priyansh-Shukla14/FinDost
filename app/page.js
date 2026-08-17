import Link from "next/link";

export default function LandingPage() {
  return (
    <>
      {/* ============ NAVBAR ============ */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link href="/" className="navbar-logo">
            <div className="navbar-logo-icon">₹</div>
            FinDost
          </Link>
          <div className="navbar-links">
            <a href="#features" className="navbar-link">Features</a>
            <a href="#how-it-works" className="navbar-link">How it Works</a>
            <Link href="/login" className="navbar-link" style={{ fontWeight: 600 }}>
              Log In
            </Link>
            <Link href="/signup" className="btn-primary" style={{ padding: "8px 20px", fontSize: "0.8rem" }}>
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ============ HERO — Full Width, Two Columns ============ */}
      <section className="hero-section">
        <div className="hero-inner">
          {/* Left — Text */}
          <div className="hero-content animate-fade-up">
            <div className="hero-pill">
              <span className="hero-pill-dot">✦</span>
              Built for India · AI-Powered · Free Forever
            </div>

            <h1 className="hero-title">
              Your money<br />
              deserves a<br />
              <span className="accent">smarter friend.</span>
            </h1>

            <p className="hero-desc">
              Track every expense in seconds. Set budgets that actually work.
              Ask FinBot about your spending in plain language — it answers from your real data, not guesses.
            </p>

            <div className="hero-actions">
              <Link href="/login" className="btn-primary btn-primary-lg">
                Start Tracking — It&apos;s Free
              </Link>
              <a href="#features" className="btn-secondary">
                Explore Features
              </a>
            </div>

            <div className="hero-trust">
              <div className="hero-trust-item">
                <span className="hero-trust-check">✓</span> No credit card
              </div>
              <div className="hero-trust-item">
                <span className="hero-trust-check">✓</span> ₹ Rupee native
              </div>
              <div className="hero-trust-item">
                <span className="hero-trust-check">✓</span> Data encrypted
              </div>
            </div>
          </div>

          {/* Right — Chat Preview */}
          <div className="hero-preview animate-fade-up delay-2">
            <div className="hero-chat-card">
              {/* Chat header */}
              <div style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                paddingBottom: "18px",
                borderBottom: "1px solid var(--border-default)",
                marginBottom: "18px",
              }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "12px",
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1rem",
                  color: "white",
                  fontWeight: 800,
                }}>🤖</div>
                <div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)" }}>FinBot</div>
                  <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>AI Finance Assistant</div>
                </div>
                <div style={{
                  marginLeft: "auto",
                  padding: "3px 10px",
                  background: "var(--accent-bg)",
                  color: "var(--accent)",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                }}>Online</div>
              </div>

              {/* Chat Messages */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="chat-bubble user">
                  How much did I spend on food this month?
                </div>
                <div className="chat-bubble bot">
                  You spent <strong style={{ color: "var(--accent)" }}>₹2,340</strong> on Food this month — that&apos;s 78% of your ₹3,000 budget. That&apos;s ₹400 more than last month. Consider reducing Zomato orders! 😄
                </div>
                <div className="chat-bubble user">
                  Which category is my highest spend?
                </div>
                <div className="chat-bubble bot">
                  Your highest spend is <strong style={{ color: "var(--accent)" }}>Shopping at ₹4,200</strong>, followed by Food (₹2,340) and Travel (₹1,800).
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS BAR — Full Width ============ */}
      <div className="stats-bar">
        <div className="stats-bar-inner">
          {[
            { value: "₹0", label: "Free Forever" },
            { value: "10s", label: "Add an Expense" },
            { value: "AI", label: "Powered Insights" },
            { value: "🇮🇳", label: "India First" },
            { value: "256-bit", label: "Encryption" },
          ].map((s) => (
            <div key={s.label} className="stat-item">
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ============ FEATURES — Full Width with Gray Background ============ */}
      <section className="features-section" id="features">
        <div className="features-inner">
          <div className="section-header">
            <div className="section-label">✨ Features</div>
            <h2 className="section-title">
              Everything you need to<br />master your money
            </h2>
            <p className="section-desc">
              Built specifically for Indian users — from chai budgets to 80C tax tracking.
              Powerful yet simple.
            </p>
          </div>

          <div className="features-grid">
            {[
              { icon: "📊", title: "Smart Dashboard", color: "green", desc: "Category breakdowns, monthly trends, and budget health — all in one beautiful view with Indian number formatting (₹1,00,000)." },
              { icon: "🤖", title: "FinBot AI Chat", color: "blue", desc: "Ask about your spending in natural language. FinBot queries your real data through secure function calling — no data guessing." },
              { icon: "📸", title: "Receipt Scanner", color: "purple", desc: "Snap a photo of any bill. AI extracts the amount, date, and merchant instantly — expense created in 2 seconds flat." },
              { icon: "🎯", title: "Budget Alerts", color: "amber", desc: "Get notified the moment you hit 80% of any category budget. No more end-of-month surprises or overspending." },
              { icon: "🔄", title: "Subscription Tracker", color: "blue", desc: "Auto-detect recurring payments like Netflix and Spotify. See your total monthly subscription burn at a glance." },
              { icon: "📋", title: "80C Tax Saver", color: "green", desc: "Track PPF, ELSS, and LIC investments against the ₹1.5L Section 80C limit. Always tax-season ready." },
            ].map((f) => (
              <div key={f.title} className="feature-card">
                <div className={`feature-icon-wrap ${f.color}`}>{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section className="how-section" id="how-it-works">
        <div className="how-inner">
          <div className="section-header">
            <div className="section-label">🚀 How It Works</div>
            <h2 className="section-title">Get started in 3 simple steps</h2>
            <p className="section-desc">
              From sign-up to full financial clarity — it takes less than a minute.
            </p>
          </div>

          <div className="steps-row">
            {[
              { num: "1", icon: "🔐", title: "Sign in with Google", desc: "One click to get started. No new passwords. Your financial data is encrypted and stays completely private." },
              { num: "2", icon: "💸", title: "Add your expenses", desc: "₹20 chai or ₹5,000 EMI — it takes 10 seconds. Or just scan a receipt and let AI do the typing for you." },
              { num: "3", icon: "📊", title: "Get instant insights", desc: "Dashboard charts, budget alerts, and FinBot answers — everything updates automatically in real time." },
            ].map((s) => (
              <div key={s.num} className="step-card">
                <div className="step-number">{s.num}</div>
                <span className="step-icon">{s.icon}</span>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="cta-section">
        <div className="cta-card">
          <h2 className="cta-title">Ready to take control of your finances?</h2>
          <p className="cta-desc">
            Join FinDost — free forever for core features.
            No credit card required. Just sign in and start tracking.
          </p>
          <Link href="/login" className="cta-btn">
            Get Started — It&apos;s Free →
          </Link>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="landing-footer">
        <p>Made with care in India 🇮🇳 &nbsp;·&nbsp; © 2026 FinDost</p>
      </footer>
    </>
  );
}
