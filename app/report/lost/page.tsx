"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import MatchCard from "@/components/MatchCard";
import type { Item } from "@/lib/types";
import { Loader2, ArrowLeft, Search, Sparkles } from "lucide-react";

export default function ReportLostPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [matches, setMatches] = useState<
    Array<{ id: string; found_item_id: string; confidence_score: number; found_item: Item }>
  >([]);
  const [showMatches, setShowMatches] = useState(false);
  const [lostItemId, setLostItemId] = useState<string | null>(null);

  const [form, setForm] = useState({
    description: "",
    location: "",
    occurredAt: "",
    category: "",
    color: "",
    brand: "",
  });

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth?redirect=/report/lost");
      } else {
        setIsAuthenticated(true);
      }
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim()) return;

    setSubmitting(true);
    setShowMatches(false);

    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/items/lost", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error("Failed to submit");

      const data = await res.json();
      setLostItemId(data.item.id);

      if (data.matches && data.matches.length > 0) {
        setMatches(data.matches);
        setShowMatches(true);
      } else {
        setShowMatches(true);
        setMatches([]);
      }
    } catch (err) {
      console.error("Submit failed:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmMatch = async (matchId: string) => {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    await fetch("/api/match/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify({ matchId, action: "confirm" }),
    });
  };

  const handleRejectMatch = async (matchId: string) => {
    const supabase = createBrowserClient();
    const { data: { session } } = await supabase.auth.getSession();

    await fetch("/api/match/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(session?.access_token
          ? { Authorization: `Bearer ${session.access_token}` }
          : {}),
      },
      body: JSON.stringify({ matchId, action: "reject" }),
    });
  };

  if (!isAuthenticated) return null;

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      {!showMatches ? (
        <>
          <div className="page-header animate-fade-in-up">
            <button
              onClick={() => router.back()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.9rem",
                marginBottom: 16,
                padding: 0,
              }}
            >
              <ArrowLeft size={18} />
              Back
            </button>
            <h1 className="page-title">Report a Lost Item</h1>
            <p className="page-subtitle">
              Describe what you lost and we&apos;ll find matches instantly.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div
              className="animate-fade-in-up animate-fade-in-up-delay-1"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 8,
                    display: "block",
                    color: "var(--text-secondary)",
                  }}
                >
                  Describe what you lost *
                </label>
                <textarea
                  className="textarea-field"
                  placeholder="e.g. I lost my black leather wallet with a small keychain attached. It had my student ID inside."
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  required
                  style={{ minHeight: 120 }}
                />
                <p
                  style={{
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    marginTop: 6,
                  }}
                >
                  Include details like color, brand, material, distinguishing
                  features. The more detail, the better the match.
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Category (optional)
                  </label>
                  <select
                    className="input-field"
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                  >
                    <option value="">AI will detect</option>
                    <option value="wallet">Wallet</option>
                    <option value="phone">Phone</option>
                    <option value="keys">Keys</option>
                    <option value="id_card">ID Card</option>
                    <option value="bottle">Bottle</option>
                    <option value="bag">Bag</option>
                    <option value="laptop">Laptop</option>
                    <option value="charger">Charger</option>
                    <option value="headphones">Headphones</option>
                    <option value="glasses">Glasses</option>
                    <option value="clothing">Clothing</option>
                    <option value="book">Book</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      marginBottom: 8,
                      display: "block",
                      color: "var(--text-secondary)",
                    }}
                  >
                    Color (optional)
                  </label>
                  <input
                    className="input-field"
                    type="text"
                    placeholder="AI will detect"
                    value={form.color}
                    onChange={(e) =>
                      setForm({ ...form, color: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 8,
                    display: "block",
                    color: "var(--text-secondary)",
                  }}
                >
                  Where did you lose it?
                </label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="e.g. Library, Cafeteria, Room 204"
                  value={form.location}
                  onChange={(e) =>
                    setForm({ ...form, location: e.target.value })
                  }
                />
              </div>

              <div>
                <label
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    marginBottom: 8,
                    display: "block",
                    color: "var(--text-secondary)",
                  }}
                >
                  When did you lose it?
                </label>
                <input
                  className="input-field"
                  type="datetime-local"
                  value={form.occurredAt}
                  onChange={(e) =>
                    setForm({ ...form, occurredAt: e.target.value })
                  }
                />
              </div>
            </div>

            <div style={{ marginTop: 24 }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !form.description.trim()}
                style={{
                  width: "100%",
                  padding: "14px 24px",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  opacity: submitting ? 0.6 : 1,
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Searching for matches...
                  </>
                ) : (
                  <>
                    <Search size={18} />
                    Submit & Find Matches
                  </>
                )}
              </button>
            </div>
          </form>
        </>
      ) : (
        /* ─── Match Results View ─── */
        <div className="animate-fade-in-up">
          <div className="page-header">
            <button
              onClick={() => {
                setShowMatches(false);
                setMatches([]);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "none",
                color: "var(--text-secondary)",
                cursor: "pointer",
                fontSize: "0.9rem",
                marginBottom: 16,
                padding: 0,
              }}
            >
              <ArrowLeft size={18} />
              Report another
            </button>

            {matches.length > 0 ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 8,
                  }}
                >
                  <Sparkles size={24} color="var(--accent-emerald)" />
                  <h1 className="page-title" style={{ marginBottom: 0 }}>
                    {matches.length} Potential Match{matches.length > 1 ? "es" : ""} Found!
                  </h1>
                </div>
                <p className="page-subtitle">
                  Review the matches below and confirm if any is your item.
                </p>
              </>
            ) : (
              <>
                <h1 className="page-title">No Matches Yet</h1>
                <p className="page-subtitle">
                  Your report has been saved. You&apos;ll get a push notification
                  when a matching found item is reported.
                </p>
              </>
            )}
          </div>

          {/* Match Cards */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {matches.map((match, index) => (
              <MatchCard
                key={match.found_item_id}
                matchId={match.id || match.found_item_id}
                foundItem={match.found_item as Item}
                confidenceScore={match.confidence_score}
                onConfirm={handleConfirmMatch}
                onReject={handleRejectMatch}
                animationDelay={index}
              />
            ))}
          </div>

          {/* View full item detail */}
          {lostItemId && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button
                className="btn-secondary"
                onClick={() => router.push(`/items/${lostItemId}`)}
                style={{ padding: "12px 24px" }}
              >
                View your lost item report
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
