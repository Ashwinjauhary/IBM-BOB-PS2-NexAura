"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PhotoUpload from "@/components/PhotoUpload";
import { createBrowserClient } from "@/lib/supabase";
import { Loader2, Sparkles, ArrowLeft, AlertTriangle } from "lucide-react";

export default function ReportFoundPage() {
  const router = useRouter();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aiLabels, setAiLabels] = useState<Record<string, string> | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [form, setForm] = useState({
    category: "",
    color: "",
    brand: "",
    material: "",
    location: "",
    occurredAt: "",
  });

  useEffect(() => {
    const supabase = createBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth?redirect=/report/found");
      } else {
        setIsAuthenticated(true);
      }
    });
  }, [router]);

  // Photo uploaded → run AI analysis ONLY (do NOT submit the item yet)
  const handlePhotoUploaded = async (url: string) => {
    setImageUrl(url);
    setAiLoading(true);
    setAiError(null);

    try {
      // Call a lightweight AI-only endpoint via the found route
      // We send minimal data and analyzeOnly flag
      const res = await fetch("/api/items/found", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: url, analyzeOnly: true }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.aiTagging?.success && data.aiTagging?.labels) {
          const labels = data.aiTagging.labels;
          setAiLabels(labels);
          // Pre-fill form fields from AI (only if user hasn't filled them)
          setForm((prev) => ({
            ...prev,
            category: prev.category || labels.category || "",
            color: prev.color || labels.color || "",
            brand:
              prev.brand ||
              (labels.brand !== "unknown" ? labels.brand : "") ||
              "",
            material: prev.material || labels.material || "",
          }));
        } else {
          setAiError(
            data.aiTagging?.message || "AI tagging unavailable. Fill fields manually."
          );
        }
        // AI analysis is complete, user can now finish the form.
        return;
      } else {
        setAiError("AI tagging unavailable. Fill fields manually.");
      }
    } catch (err) {
      console.error("AI analysis failed:", err);
      setAiError("AI tagging unavailable. Fill fields manually.");
    } finally {
      setAiLoading(false);
    }
  };

  // Fallback manual submit (only used if AI analysis failed / user needs to correct)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;

    setSubmitting(true);

    try {
      const supabase = createBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/items/found", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}),
        },
        body: JSON.stringify({
          imageUrl,
          ...form,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit");
      }

      const data = await res.json();
      router.push(`/items/${data.item.id}?new=true`);
    } catch (err) {
      console.error("Submit failed:", err);
      setUploadError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
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
        <h1 className="page-title">Report a Found Item</h1>
        <p className="page-subtitle">
          Upload a photo and our AI will automatically identify the item.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Photo Upload */}
        <div
          className="animate-fade-in-up animate-fade-in-up-delay-1"
          style={{ marginBottom: 24 }}
        >
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              fontWeight: 600,
              marginBottom: 8,
              color: "var(--text-secondary)",
            }}
          >
            Photo of the item *
          </label>
          <PhotoUpload
            onUploadComplete={handlePhotoUploaded}
            onUploadError={(err) => setUploadError(err)}
          />
          {uploadError && (
            <p
              style={{
                color: "var(--accent-red)",
                fontSize: "0.8rem",
                marginTop: 8,
              }}
            >
              {uploadError}
            </p>
          )}
        </div>

        {/* AI Analysis Status */}
        {aiLoading && (
          <div
            className="glass-card"
            style={{
              padding: 20,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "1px solid rgba(139, 92, 246, 0.3)",
              background: "var(--accent-purple-glow)",
            }}
          >
            <Loader2
              size={20}
              color="var(--accent-purple)"
              className="animate-spin"
            />
            <div>
              <p style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Analyzing photo with AI...
              </p>
              <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                Identifying category, color, brand, and features
              </p>
            </div>
          </div>
        )}

        {aiError && (
          <div
            className="glass-card"
            style={{
              padding: 16,
              marginBottom: 24,
              display: "flex",
              alignItems: "center",
              gap: 12,
              border: "1px solid rgba(245, 158, 11, 0.3)",
              background: "var(--accent-amber-glow)",
            }}
          >
            <AlertTriangle size={20} color="var(--accent-amber)" />
            <p style={{ fontSize: "0.85rem", color: "var(--accent-amber)" }}>
              {aiError}
            </p>
          </div>
        )}

        {aiLabels && (
          <div
            className="glass-card"
            style={{
              padding: 16,
              marginBottom: 24,
              border: "1px solid rgba(16, 185, 129, 0.3)",
              background: "var(--accent-emerald-glow)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 8,
              }}
            >
              <Sparkles size={16} color="var(--accent-emerald)" />
              <p style={{ fontWeight: 600, fontSize: "0.85rem", color: "var(--accent-emerald)" }}>
                AI Analysis Complete
              </p>
            </div>
            <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
              Fields below have been pre-filled. You can edit them if needed.
            </p>
          </div>
        )}

        {/* Form Fields */}
        <div
          className="animate-fade-in-up animate-fade-in-up-delay-2"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: 8,
                color: "var(--text-secondary)",
              }}
            >
              Category
              {aiLabels?.category && (
                <span className="badge badge-ai" style={{ fontSize: "0.6rem" }}>
                  <Sparkles size={8} /> AI
                </span>
              )}
            </label>
            <select
              className="input-field"
              value={form.category}
              onChange={(e) =>
                setForm({ ...form, category: e.target.value })
              }
            >
              <option value="">Select category</option>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "var(--text-secondary)",
                }}
              >
                Color
                {aiLabels?.color && (
                  <span className="badge badge-ai" style={{ fontSize: "0.6rem" }}>
                    <Sparkles size={8} /> AI
                  </span>
                )}
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="e.g. black, blue"
                value={form.color}
                onChange={(e) =>
                  setForm({ ...form, color: e.target.value })
                }
              />
            </div>
            <div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  marginBottom: 8,
                  color: "var(--text-secondary)",
                }}
              >
                Brand
                {aiLabels?.brand && aiLabels.brand !== "unknown" && (
                  <span className="badge badge-ai" style={{ fontSize: "0.6rem" }}>
                    <Sparkles size={8} /> AI
                  </span>
                )}
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Optional"
                value={form.brand}
                onChange={(e) =>
                  setForm({ ...form, brand: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: "0.85rem",
                fontWeight: 600,
                marginBottom: 8,
                color: "var(--text-secondary)",
              }}
            >
              Material
              {aiLabels?.material && (
                <span className="badge badge-ai" style={{ fontSize: "0.6rem" }}>
                  <Sparkles size={8} /> AI
                </span>
              )}
            </label>
            <input
              className="input-field"
              type="text"
              placeholder="e.g. leather, plastic"
              value={form.material}
              onChange={(e) =>
                setForm({ ...form, material: e.target.value })
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
              Where did you find it?
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
              When did you find it?
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

        {/* Submit button — always visible when there's an image and AI didn't auto-redirect */}
        {imageUrl && !aiLoading && (
          <div style={{ marginTop: 24 }}>
            <button
              type="submit"
              className="btn-primary"
              disabled={submitting}
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
                  Submitting...
                </>
              ) : (
                "Submit Found Item"
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
