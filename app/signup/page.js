"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      // Create account
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      // Auto sign-in after signup
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      });

      if (result?.error) {
        // Account created but auto-login failed, redirect to login
        router.push("/login");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Left Side — Green branding panel */}
      <div className="login-left">
        <h2 className="login-left-title">
          Start your
          <br />
          financial journey
          <br />
          today.
        </h2>
        <p className="login-left-desc">
          Join thousands of users who track their expenses, set smart budgets,
          and get AI-powered insights with FinDost.
        </p>
        <div className="login-left-features">
          <div className="login-left-feature">
            <span>✅</span> Free forever — no hidden charges
          </div>
          <div className="login-left-feature">
            <span>⚡</span> Set up in under 60 seconds
          </div>
          <div className="login-left-feature">
            <span>🤖</span> FinBot AI answers your money questions
          </div>
          <div className="login-left-feature">
            <span>📊</span> Beautiful charts and spending insights
          </div>
          <div className="login-left-feature">
            <span>🔒</span> Bank-grade encryption for your data
          </div>
        </div>
      </div>

      {/* Right Side — Signup form */}
      <div className="login-right">
        <div className="login-card">
          <div className="login-icon">₹</div>
          <h1 className="login-title">Create your account</h1>
          <p className="login-subtitle">
            Get started with FinDost for free
          </p>

          {/* Google Sign Up */}
          <button
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="google-btn"
            id="google-signup-btn"
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
            Sign up with Google
          </button>

          <div className="login-divider">or sign up with email</div>

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

          {/* Signup Form */}
          <form onSubmit={handleSignup}>
            <div style={{ marginBottom: "14px", textAlign: "left" }}>
              <label className="form-label" htmlFor="signup-name">
                Full name
              </label>
              <input
                id="signup-name"
                type="text"
                className="input-field"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div style={{ marginBottom: "14px", textAlign: "left" }}>
              <label className="form-label" htmlFor="signup-email">
                Email address
              </label>
              <input
                id="signup-email"
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

            <div style={{ marginBottom: "14px", textAlign: "left" }}>
              <label className="form-label" htmlFor="signup-password">
                Password
              </label>
              <input
                id="signup-password"
                type="password"
                className="input-field"
                placeholder="Min 6 characters"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
                minLength={6}
              />
            </div>

            <div style={{ marginBottom: "20px", textAlign: "left" }}>
              <label className="form-label" htmlFor="signup-confirm">
                Confirm password
              </label>
              <input
                id="signup-confirm"
                type="password"
                className="input-field"
                placeholder="Re-enter password"
                value={formData.confirmPassword}
                onChange={(e) =>
                  setFormData({ ...formData, confirmPassword: e.target.value })
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
                  <span className="spinner" /> Creating account...
                </>
              ) : (
                "Create Account"
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
            Already have an account?{" "}
            <Link
              href="/login"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign in
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
