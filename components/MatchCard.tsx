"use client";

import { useState } from "react";
import { MapPin, Clock, Sparkles, Check, X, Loader2 } from "lucide-react";
import ConfidenceBadge from "./ConfidenceBadge";
import type { Item } from "@/lib/types";

interface MatchCardProps {
  matchId: string;
  foundItem: Item;
  confidenceScore: number;
  onConfirm: (matchId: string) => Promise<void>;
  onReject: (matchId: string) => Promise<void>;
  animationDelay?: number;
}

export default function MatchCard({
  matchId,
  foundItem,
  confidenceScore,
  onConfirm,
  onReject,
  animationDelay = 0,
}: MatchCardProps) {
  const [status, setStatus] = useState<
    "idle" | "confirming" | "rejecting" | "confirmed" | "rejected"
  >("idle");

  const handleConfirm = async () => {
    setStatus("confirming");
    try {
      await onConfirm(matchId);
      setStatus("confirmed");
    } catch {
      setStatus("idle");
    }
  };

  const handleReject = async () => {
    setStatus("rejecting");
    try {
      await onReject(matchId);
      setStatus("rejected");
    } catch {
      setStatus("idle");
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (status === "confirmed") {
    return (
      <div
        className="glass-card animate-fade-in-up"
        style={{
          padding: 24,
          textAlign: "center",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          background: "var(--accent-emerald-glow)",
          animationDelay: `${animationDelay * 0.1}s`,
        }}
      >
        <Check
          size={32}
          color="var(--accent-emerald)"
          style={{ marginBottom: 8 }}
        />
        <p style={{ fontWeight: 600, color: "var(--accent-emerald)" }}>
          Match Confirmed!
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: 4 }}>
          Both parties will be notified.
        </p>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div
        className="glass-card animate-fade-in-up"
        style={{
          padding: 24,
          textAlign: "center",
          opacity: 0.5,
          animationDelay: `${animationDelay * 0.1}s`,
        }}
      >
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
          Match dismissed
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass-card animate-fade-in-up"
      style={{
        overflow: "hidden",
        animationDelay: `${animationDelay * 0.1}s`,
      }}
    >
      <div style={{ display: "flex", gap: 0 }}>
        {/* Image */}
        {foundItem.image_url && (
          <div
            style={{
              width: 140,
              minHeight: 140,
              flexShrink: 0,
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={foundItem.image_url}
              alt={foundItem.ai_description || foundItem.category || "Found item"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        )}

        {/* Content */}
        <div style={{ flex: 1, padding: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <div>
              <h3
                style={{
                  fontWeight: 600,
                  fontSize: "1rem",
                  textTransform: "capitalize",
                  marginBottom: 4,
                }}
              >
                {foundItem.category || "Unknown Item"}
              </h3>
              {foundItem.ai_description && (
                <p
                  style={{
                    fontSize: "0.82rem",
                    color: "var(--text-secondary)",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {foundItem.ai_description}
                </p>
              )}
            </div>
          </div>

          {/* AI labels */}
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginBottom: 10,
            }}
          >
            {foundItem.ai_labels && (
              <span className="badge badge-ai" style={{ fontSize: "0.65rem" }}>
                <Sparkles size={10} /> AI Tagged
              </span>
            )}
            {foundItem.color && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--bg-secondary)",
                  fontSize: "0.7rem",
                  color: "var(--text-secondary)",
                  textTransform: "capitalize",
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: foundItem.color.toLowerCase(),
                    border: "1px solid var(--border-default)",
                  }}
                />
                {foundItem.color}
              </span>
            )}
            {foundItem.brand && foundItem.brand !== "unknown" && (
              <span
                style={{
                  padding: "2px 8px",
                  borderRadius: "var(--radius-full)",
                  background: "var(--bg-secondary)",
                  fontSize: "0.7rem",
                  color: "var(--text-secondary)",
                }}
              >
                {foundItem.brand}
              </span>
            )}
          </div>

          {/* Confidence */}
          <div style={{ marginBottom: 12 }}>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginBottom: 4,
                fontWeight: 500,
              }}
            >
              Match Confidence
            </p>
            <ConfidenceBadge score={confidenceScore} size="md" />
          </div>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginBottom: 12,
            }}
          >
            {foundItem.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} />
                <span>{foundItem.location}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} />
              <span>{timeAgo(foundItem.created_at)}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              className="btn-success"
              onClick={handleConfirm}
              disabled={status !== "idle"}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: 6,
                flex: 1,
                justifyContent: "center",
                opacity: status !== "idle" ? 0.5 : 1,
              }}
            >
              {status === "confirming" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              This is mine
            </button>
            <button
              className="btn-danger"
              onClick={handleReject}
              disabled={status !== "idle"}
              style={{
                padding: "8px 16px",
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: 6,
                opacity: status !== "idle" ? 0.5 : 1,
              }}
            >
              {status === "rejecting" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <X size={14} />
              )}
              No
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
