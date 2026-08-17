"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleCredentialLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="login-container">
      {/* Left Side — Green branding panel */}
      <div className="login-left">
        <h2 className="login-left-title">
          Your finances,
          <br />
          finally under
          <br />
          control.
        </h2>
        <p className="login-left-desc">
          Track expenses, set budgets, and chat with FinBot — your AI-powered
          finance companion built for India.
        </p>
        <div className="login-left-features">
          <div className="login-left-feature">
            <span>📊</span> Smart dashboard with Indian formatting
          </div>
          <div className="login-left-feature">
            <span>🤖</span> AI chatbot that knows your spending
          </div>
          <div className="login-left-feature">
            <span>📸</span> Scan receipts to add expenses instantly
          </div>
          <div className="login-left-feature">
            <span>🎯</span> Budget alerts before you overspend
          </div>
          <div className="login-left-feature">
            <span>🔒</span> Your data is encrypted and private
          </div>
        </div>
      </div>

      {/* Right Side — Login form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-icon">₹</div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-subtitle">Sign in to your FinDost account</p>

          {/* Google Sign In */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="google-btn"
            id="google-login-btn"
          >
            <svg
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: 20, height: 20 }}
            >
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>

          <div className="login-divider">or sign in with email</div>

          {/* Error message */}
          {error && (
            <div
              style={{
                padding: "10px 14px",
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "var(--radius-md)",
                color: "#dc2626",
                fontSize: "0.8rem",
                marginBottom: "16px",
                textAlign: "left",
              }}
            >
              {error}
            </div>
          )}

          {/* Email/Password Form */}
          <form onSubmit={handleCredentialLogin}>
            <div style={{ marginBottom: "14px", textAlign: "left" }}>
              <label className="form-label" htmlFor="login-email">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                className="input-field"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
              style={{ width: "100%", justifyContent: "center" }}
            >
              {isLoading ? (
                <>
                  <span className="spinner" /> Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p
            style={{
              marginTop: "24px",
              fontSize: "0.85rem",
              color: "var(--text-tertiary)",
            }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Create one
            </Link>
          </p>

          <div style={{ marginTop: "20px" }}>
            <Link
              href="/"
              style={{
                color: "var(--text-muted)",
                textDecoration: "none",
                fontSize: "0.8rem",
                fontWeight: 500,
              }}
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
