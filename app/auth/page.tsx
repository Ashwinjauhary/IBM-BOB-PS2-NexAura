"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import { Mail, Lock, User, Loader2, Sparkles, ArrowRight } from "lucide-react";

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
  });

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        router.push(redirectTo);
      }
    });
  }, [router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createBrowserClient();

    try {
      if (mode === "signup") {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.fullName },
          },
        });

        if (signUpErr) {
          setError(signUpErr.message);
          return;
        }

        // Upsert profile
        if (data.user) {
          await supabase.from("profiles").upsert({
            id: data.user.id,
            full_name: form.fullName,
          });
        }

        // Request notification permission after signup
        try {
          const { requestNotificationPermission } = await import(
            "@/lib/firebase-client"
          );
          const fcmToken = await requestNotificationPermission();
          if (fcmToken && data.session) {
            await fetch("/api/notifications/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${data.session.access_token}`,
              },
              body: JSON.stringify({ fcmToken }),
            });
          }
        } catch (fcmErr) {
          console.warn("FCM setup skipped:", fcmErr);
        }

        router.push(redirectTo);
      } else {
        const { data, error: signInErr } =
          await supabase.auth.signInWithPassword({
            email: form.email,
            password: form.password,
          });

        if (signInErr) {
          setError(signInErr.message);
          return;
        }

        // Request notification permission on sign in
        try {
          const { requestNotificationPermission } = await import(
            "@/lib/firebase-client"
          );
          const fcmToken = await requestNotificationPermission();
          if (fcmToken && data.session) {
            await fetch("/api/notifications/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${data.session.access_token}`,
              },
              body: JSON.stringify({ fcmToken }),
            });
          }
        } catch (fcmErr) {
          console.warn("FCM setup skipped:", fcmErr);
        }

        router.push(redirectTo);
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="page-container"
      style={{
        maxWidth: 440,
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <div className="animate-fade-in-up" style={{ textAlign: "center", marginBottom: 32 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--radius-lg)",
            background: "var(--gradient-primary)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            fontSize: 24,
          }}
        >
          🔍
        </div>
        <h1
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            marginBottom: 8,
          }}
        >
          {mode === "signin" ? "Welcome back" : "Create an account"}
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          {mode === "signin"
            ? "Sign in to report and track lost & found items."
            : "Join to start reporting and matching lost items."}
        </p>
      </div>

      <div
        className="glass-card animate-fade-in-up animate-fade-in-up-delay-1"
        style={{ padding: 24 }}
      >
        {/* Mode Toggle */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 4,
            padding: 4,
            borderRadius: "var(--radius-md)",
            background: "var(--bg-secondary)",
            marginBottom: 24,
          }}
        >
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              style={{
                padding: "10px 16px",
                borderRadius: "var(--radius-sm)",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.85rem",
                transition: "all 0.2s ease",
                background: mode === m ? "var(--bg-card)" : "transparent",
                color:
                  mode === m
                    ? "var(--text-primary)"
                    : "var(--text-muted)",
                boxShadow: mode === m ? "var(--shadow-sm)" : "none",
              }}
            >
              {m === "signin" ? "Sign In" : "Sign Up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {mode === "signup" && (
              <div>
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--text-secondary)",
                  }}
                >
                  <User size={14} />
                  Full Name
                </label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="Your full name"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm({ ...form, fullName: e.target.value })
                  }
                  required
                />
              </div>
            )}

            <div>
              <label
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--text-secondary)",
                }}
              >
                <Mail size={14} />
                Email
              </label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: 8,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  color: "var(--text-secondary)",
                }}
              >
                <Lock size={14} />
                Password
              </label>
              <input
                className="input-field"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
                minLength={6}
              />
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: 16,
                padding: "10px 14px",
                borderRadius: "var(--radius-md)",
                background: "var(--accent-red-glow)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                fontSize: "0.85rem",
                color: "var(--accent-red)",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{
              width: "100%",
              marginTop: 24,
              padding: "14px 24px",
              fontSize: "0.95rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {mode === "signin" ? "Sign In" : "Create Account"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>
      </div>

      <div
        className="animate-fade-in-up animate-fade-in-up-delay-2"
        style={{
          marginTop: 24,
          textAlign: "center",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          fontSize: "0.8rem",
          color: "var(--text-muted)",
        }}
      >
        <Sparkles size={12} />
        Powered by AI matching technology
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}
