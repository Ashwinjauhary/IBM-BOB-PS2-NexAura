"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase";
import ConfidenceBadge from "@/components/ConfidenceBadge";
import type { Item, Match } from "@/lib/types";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Sparkles,
  Package,
  Loader2,
  CheckCircle,
  Tag,
} from "lucide-react";
import Link from "next/link";

function ItemDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";
  const [item, setItem] = useState<Item | null>(null);
  const [matches, setMatches] = useState<Array<Match & { found_item?: Item; lost_item?: Item }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchItem() {
      try {
        const supabase = createBrowserClient();
        const itemId = params.id as string;
        const { data } = await supabase
          .from("items")
          .select("*")
          .eq("id", itemId)
          .single();

        if (data) {
          setItem(data as Item);

          // Fetch related matches
          const matchField =
            data.type === "lost" ? "lost_item_id" : "found_item_id";
          const { data: matchData } = await supabase
            .from("matches")
            .select("*")
            .eq(matchField, data.id)
            .order("confidence_score", { ascending: false });

          if (matchData) {
            const enriched = [];
            for (const match of matchData) {
              const otherItemId =
                data.type === "lost" ? match.found_item_id : match.lost_item_id;
              const { data: otherItem } = await supabase
                .from("items")
                .select("*")
                .eq("id", otherItemId)
                .single();

              enriched.push({
                ...match,
                ...(data.type === "lost"
                  ? { found_item: otherItem as Item }
                  : { lost_item: otherItem as Item }),
              });
            }
            setMatches(enriched);
          }
        }
      } catch (err) {
        console.error("Failed to fetch item:", err);
      } finally {
        setLoading(false);
      }
    }

    if (params.id) fetchItem();
  }, [params.id]);

  if (loading) {
    return (
      <div
        className="page-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
        }}
      >
        <Loader2
          size={32}
          color="var(--accent-blue)"
          className="animate-spin"
        />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="page-container" style={{ textAlign: "center", paddingTop: 80 }}>
        <Package size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
        <h2>Item not found</h2>
        <Link href="/" className="btn-primary" style={{ marginTop: 16, textDecoration: "none", display: "inline-block" }}>
          Go Home
        </Link>
      </div>
    );
  }

  const aiLabels = item.ai_labels as Record<string, string> | null;

  const formatDate = (date: string | null) => {
    if (!date) return "Not specified";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      {/* Success banner for new items */}
      {isNew && (
        <div
          className="animate-fade-in-up"
          style={{
            padding: "16px 20px",
            borderRadius: "var(--radius-md)",
            background: "var(--accent-emerald-glow)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 24,
          }}
        >
          <CheckCircle size={20} color="var(--accent-emerald)" />
          <p style={{ fontWeight: 500, color: "var(--accent-emerald)" }}>
            {item.type === "found"
              ? "Found item reported successfully! It's now visible to others."
              : "Lost item reported! We'll notify you when a match is found."}
          </p>
        </div>
      )}

      <div className="page-header animate-fade-in-up">
        <Link
          href="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text-secondary)",
            fontSize: "0.9rem",
            marginBottom: 16,
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={18} />
          Back
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span
            className={`badge ${item.type === "found" ? "badge-status-open" : "badge-status-matched"}`}
          >
            {item.type === "found" ? "Found" : "Lost"}
          </span>
          <span className={`badge badge-status-${item.status === "open" ? "open" : item.status === "matched" ? "matched" : "claimed"}`}>
            {item.status}
          </span>
        </div>

        <h1 className="page-title" style={{ textTransform: "capitalize" }}>
          {item.category || item.ai_description || "Item Detail"}
        </h1>
      </div>

      {/* Image */}
      {item.image_url && (
        <div
          className="animate-fade-in-up animate-fade-in-up-delay-1"
          style={{
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
            marginBottom: 24,
            border: "1px solid var(--border-subtle)",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.image_url}
            alt={item.ai_description || item.category || "Item photo"}
            style={{
              width: "100%",
              maxHeight: 400,
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      )}

      {/* Details Grid */}
      <div
        className="glass-card animate-fade-in-up animate-fade-in-up-delay-2"
        style={{ padding: 20, marginBottom: 24 }}
      >
        <h3
          style={{
            fontSize: "0.9rem",
            fontWeight: 600,
            marginBottom: 16,
            color: "var(--text-secondary)",
          }}
        >
          Item Details
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
          }}
        >
          {[
            { label: "Category", value: item.category, ai: !!aiLabels?.category },
            { label: "Color", value: item.color, ai: !!aiLabels?.color },
            { label: "Brand", value: item.brand, ai: !!aiLabels?.brand },
            { label: "Material", value: item.material, ai: !!aiLabels?.material },
          ].map(
            (field) =>
              field.value && (
                <div key={field.label}>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {field.label}
                    {field.ai && (
                      <span className="badge badge-ai" style={{ fontSize: "0.55rem", padding: "1px 6px" }}>
                        <Sparkles size={7} /> AI
                      </span>
                    )}
                  </p>
                  <p
                    style={{
                      fontSize: "0.95rem",
                      fontWeight: 500,
                      textTransform: "capitalize",
                    }}
                  >
                    {field.value}
                  </p>
                </div>
              )
          )}
        </div>

        {/* Meta info */}
        <div
          style={{
            display: "flex",
            gap: 20,
            marginTop: 16,
            paddingTop: 16,
            borderTop: "1px solid var(--border-subtle)",
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
          }}
        >
          {item.location && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <MapPin size={14} />
              {item.location}
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={14} />
            {formatDate(item.occurred_at || item.created_at)}
          </div>
        </div>
      </div>

      {/* Description */}
      {(item.description || item.ai_description) && (
        <div
          className="glass-card animate-fade-in-up animate-fade-in-up-delay-3"
          style={{ padding: 20, marginBottom: 24 }}
        >
          <h3
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: 12,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            Description
            {item.ai_description && !item.description && (
              <span className="badge badge-ai" style={{ fontSize: "0.6rem" }}>
                <Sparkles size={8} /> AI Generated
              </span>
            )}
          </h3>
          <p style={{ lineHeight: 1.6, color: "var(--text-primary)" }}>
            {item.description || item.ai_description}
          </p>
        </div>
      )}

      {/* AI Features (for found items) */}
      {aiLabels?.distinguishing_features && (
        <div
          className="glass-card"
          style={{ padding: 20, marginBottom: 24 }}
        >
          <h3
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: 12,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Sparkles size={14} color="var(--accent-purple)" />
            AI-Detected Features
          </h3>
          <p style={{ lineHeight: 1.6 }}>{aiLabels.distinguishing_features}</p>
          {item.ai_confidence && (
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginTop: 8,
              }}
            >
              AI Confidence: {item.ai_confidence}
            </p>
          )}
        </div>
      )}

      {/* Keywords (for lost items) */}
      {item.extracted_keywords && item.extracted_keywords.length > 0 && (
        <div
          className="glass-card"
          style={{ padding: 20, marginBottom: 24 }}
        >
          <h3
            style={{
              fontSize: "0.9rem",
              fontWeight: 600,
              marginBottom: 12,
              color: "var(--text-secondary)",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Tag size={14} color="var(--accent-purple)" />
            Extracted Keywords
          </h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {item.extracted_keywords.map((kw) => (
              <span
                key={kw}
                className="badge badge-ai"
                style={{ fontSize: "0.75rem" }}
              >
                {kw}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Related Matches */}
      {matches.length > 0 && (
        <section>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            Related Matches ({matches.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {matches.map((match) => {
              const otherItem =
                item.type === "lost" ? match.found_item : match.lost_item;
              if (!otherItem) return null;

              return (
                <Link
                  key={match.id}
                  href={`/items/${otherItem.id}`}
                  className="glass-card"
                  style={{
                    padding: 16,
                    display: "flex",
                    alignItems: "center",
                    gap: 16,
                    textDecoration: "none",
                    color: "inherit",
                  }}
                >
                  {otherItem.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={otherItem.image_url}
                      alt=""
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: "var(--radius-md)",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <p
                      style={{
                        fontWeight: 600,
                        textTransform: "capitalize",
                        marginBottom: 4,
                      }}
                    >
                      {otherItem.category || "Item"}
                    </p>
                    <ConfidenceBadge
                      score={match.confidence_score}
                      size="sm"
                      showBar={false}
                    />
                  </div>
                  <span
                    className={`badge badge-status-${match.status === "confirmed" ? "claimed" : "open"}`}
                    style={{ fontSize: "0.65rem" }}
                  >
                    {match.status}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default function ItemDetailPage() {
  return (
    <Suspense fallback={null}>
      <ItemDetailContent />
    </Suspense>
  );
}
