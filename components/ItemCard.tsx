"use client";

import Link from "next/link";
import { MapPin, Clock, Sparkles } from "lucide-react";
import type { Item } from "@/lib/types";

interface ItemCardProps {
  item: Item;
  animationDelay?: number;
}

export default function ItemCard({ item, animationDelay = 0 }: ItemCardProps) {
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

  const statusStyles: Record<string, string> = {
    open: "badge-status-open",
    matched: "badge-status-matched",
    claimed: "badge-status-claimed",
    closed: "badge-status-claimed",
  };

  return (
    <Link
      href={`/items/${item.id}`}
      style={{
        textDecoration: "none",
        color: "inherit",
        animationDelay: `${animationDelay * 0.1}s`,
      }}
      className="animate-fade-in-up"
    >
      <div className="glass-card" style={{ overflow: "hidden" }}>
        {/* Image */}
        {item.image_url && (
          <div
            style={{
              position: "relative",
              height: 180,
              overflow: "hidden",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image_url}
              alt={item.ai_description || item.category || "Item photo"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "flex",
                gap: 6,
              }}
            >
              <span className={`badge ${statusStyles[item.status] || ""}`}>
                {item.status}
              </span>
              {item.type === "found" && (
                <span className="badge badge-ai" style={{ fontSize: "0.65rem" }}>
                  <Sparkles size={10} /> Found
                </span>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div style={{ padding: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3
              style={{
                fontWeight: 600,
                fontSize: "1rem",
                textTransform: "capitalize",
              }}
            >
              {item.category || item.ai_description || "Unknown Item"}
            </h3>
            {item.color && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: item.color.toLowerCase(),
                    border: "2px solid var(--border-default)",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-secondary)",
                    textTransform: "capitalize",
                  }}
                >
                  {item.color}
                </span>
              </div>
            )}
          </div>

          {/* Description preview */}
          {(item.ai_description || item.description) && (
            <p
              style={{
                fontSize: "0.85rem",
                color: "var(--text-secondary)",
                marginBottom: 12,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.ai_description || item.description}
            </p>
          )}

          {/* Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: "0.8rem",
              color: "var(--text-muted)",
            }}
          >
            {item.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} />
                <span>{item.location}</span>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={12} />
              <span>{timeAgo(item.created_at)}</span>
            </div>
          </div>

          {/* AI labels indicator */}
          {item.ai_labels && (
            <div style={{ marginTop: 8 }}>
              <span className="badge badge-ai" style={{ fontSize: "0.65rem" }}>
                <Sparkles size={10} /> AI Tagged
              </span>
            </div>
          )}

          {/* Lost item — no image placeholder */}
          {!item.image_url && item.type === "lost" && (
            <div
              style={{
                display: "flex",
                gap: 6,
                marginTop: 8,
                flexWrap: "wrap",
              }}
            >
              {item.extracted_keywords?.slice(0, 4).map((kw) => (
                <span
                  key={kw}
                  style={{
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    background: "var(--bg-secondary)",
                    fontSize: "0.7rem",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
