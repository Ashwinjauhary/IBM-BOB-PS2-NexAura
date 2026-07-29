"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createBrowserClient } from "@/lib/supabase";
import ItemCard from "@/components/ItemCard";
import type { Item } from "@/lib/types";
import {
  Search,
  MapPin,
  Sparkles,
  ArrowRight,
  Package,
  Eye,
} from "lucide-react";

export default function HomePage() {
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, matched: 0, open: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const supabase = createBrowserClient();

        // Fetch recent items
        const { data: items } = await supabase
          .from("items")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(12);

        setRecentItems((items as Item[]) || []);

        // Fetch stats
        const { count: total } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true });
        const { count: matched } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true })
          .eq("status", "matched");
        const { count: open } = await supabase
          .from("items")
          .select("*", { count: "exact", head: true })
          .eq("status", "open");

        setStats({
          total: total || 0,
          matched: matched || 0,
          open: open || 0,
        });
      } catch (err) {
        console.error("Failed to fetch data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  return (
    <div className="page-container">
      {/* Hero Section */}
      <section
        style={{
          textAlign: "center",
          padding: "48px 0 40px",
        }}
        className="animate-fade-in-up"
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 16px",
            borderRadius: "var(--radius-full)",
            background: "var(--accent-blue-glow)",
            border: "1px solid rgba(59, 130, 246, 0.2)",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: "var(--accent-blue)",
            marginBottom: 20,
          }}
        >
          <Sparkles size={14} />
          AI-Powered Campus Lost & Found
        </div>

        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            marginBottom: 16,
            background: "linear-gradient(135deg, #f5f5f7 0%, #a1a1aa 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Lost something?
          <br />
          Find it with AI.
        </h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "var(--text-secondary)",
            maxWidth: 500,
            margin: "0 auto 32px",
            lineHeight: 1.6,
          }}
        >
          Report lost or found items on campus. Our AI instantly matches and
          notifies both parties.
        </p>

        {/* Two equal-weight CTAs */}
        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/report/lost"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 32px",
              borderRadius: "var(--radius-lg)",
              background: "var(--gradient-primary)",
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
              transition: "all 0.2s ease",
              boxShadow: "var(--shadow-glow-blue)",
            }}
          >
            <Search size={20} />
            Report Lost Item
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/report/found"
            style={{
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "16px 32px",
              borderRadius: "var(--radius-lg)",
              background: "var(--accent-emerald)",
              color: "white",
              fontWeight: 600,
              fontSize: "1rem",
              transition: "all 0.2s ease",
              boxShadow: "var(--shadow-glow-emerald)",
            }}
          >
            <Eye size={20} />
            Report Found Item
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          marginBottom: 40,
        }}
        className="animate-fade-in-up animate-fade-in-up-delay-1"
      >
        {[
          {
            label: "Total Reports",
            value: stats.total,
            icon: Package,
            color: "var(--accent-blue)",
          },
          {
            label: "Successfully Matched",
            value: stats.matched,
            icon: Sparkles,
            color: "var(--accent-emerald)",
          },
          {
            label: "Currently Open",
            value: stats.open,
            icon: MapPin,
            color: "var(--accent-amber)",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="glass-card"
            style={{
              padding: 20,
              textAlign: "center",
            }}
          >
            <stat.icon
              size={24}
              color={stat.color}
              style={{ marginBottom: 8 }}
            />
            <p
              style={{
                fontSize: "1.8rem",
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                color: stat.color,
              }}
            >
              {loading ? "—" : stat.value}
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              {stat.label}
            </p>
          </div>
        ))}
      </section>

      {/* Recent Activity */}
      <section className="animate-fade-in-up animate-fade-in-up-delay-2">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2
            style={{
              fontSize: "1.3rem",
              fontWeight: 700,
              letterSpacing: "-0.02em",
            }}
          >
            Recent Activity
          </h2>
        </div>

        {loading ? (
          <div className="card-grid">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="skeleton-shimmer"
                style={{ height: 280 }}
              />
            ))}
          </div>
        ) : recentItems.length > 0 ? (
          <div className="card-grid">
            {recentItems.map((item, index) => (
              <ItemCard key={item.id} item={item} animationDelay={index} />
            ))}
          </div>
        ) : (
          <div
            className="glass-card"
            style={{
              padding: 48,
              textAlign: "center",
            }}
          >
            <Package
              size={48}
              color="var(--text-muted)"
              style={{ marginBottom: 16 }}
            />
            <h3
              style={{
                fontSize: "1.1rem",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              No reports yet
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.9rem",
                marginBottom: 20,
              }}
            >
              Be the first to report a lost or found item on campus.
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link href="/report/lost" className="btn-primary" style={{ textDecoration: "none" }}>
                Report Lost
              </Link>
              <Link href="/report/found" className="btn-secondary" style={{ textDecoration: "none" }}>
                Report Found
              </Link>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
