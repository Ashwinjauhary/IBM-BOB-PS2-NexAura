"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";
import MatchCard from "@/components/MatchCard";
import type { Item, Match } from "@/lib/types";
import { Loader2, Bell, Package } from "lucide-react";

interface MatchWithItems extends Match {
  lost_item: Item;
  found_item: Item;
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMatches() {
      try {
        const supabase = createBrowserClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Fetch matches where the user is either the lost or found reporter
        const { data: userItems } = await supabase
          .from("items")
          .select("id")
          .eq("user_id", user.id);

        if (!userItems || userItems.length === 0) {
          setLoading(false);
          return;
        }

        const itemIds = userItems.map((i) => i.id);

        // Get matches involving user's items
        const { data: lostMatches } = await supabase
          .from("matches")
          .select("*")
          .in("lost_item_id", itemIds)
          .order("confidence_score", { ascending: false });

        const { data: foundMatches } = await supabase
          .from("matches")
          .select("*")
          .in("found_item_id", itemIds)
          .order("confidence_score", { ascending: false });

        // Combine and deduplicate
        const allMatches = [...(lostMatches || []), ...(foundMatches || [])];
        const unique = allMatches.filter(
          (m, i, arr) => arr.findIndex((x) => x.id === m.id) === i
        );

        // Fetch item details for each match
        const enriched: MatchWithItems[] = [];
        for (const match of unique) {
          const { data: lostItem } = await supabase
            .from("items")
            .select("*")
            .eq("id", match.lost_item_id)
            .single();
          const { data: foundItem } = await supabase
            .from("items")
            .select("*")
            .eq("id", match.found_item_id)
            .single();

          if (lostItem && foundItem) {
            enriched.push({
              ...match,
              lost_item: lostItem as Item,
              found_item: foundItem as Item,
            });
          }
        }

        // Sort by score
        enriched.sort((a, b) => b.confidence_score - a.confidence_score);
        setMatches(enriched);
      } catch (err) {
        console.error("Failed to fetch matches:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchMatches();

    // Subscribe to realtime match updates
    const supabase = createBrowserClient();
    const channel = supabase
      .channel("matches-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "matches" },
        () => {
          // Refetch on any change
          fetchMatches();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const suggestedMatches = matches.filter((m) => m.status === "suggested");
  const confirmedMatches = matches.filter((m) => m.status === "confirmed");
  const rejectedMatches = matches.filter((m) => m.status === "rejected");

  return (
    <div className="page-container" style={{ maxWidth: 700 }}>
      <div className="page-header animate-fade-in-up">
        <h1 className="page-title">Your Matches</h1>
        <p className="page-subtitle">
          {matches.length > 0
            ? `${suggestedMatches.length} pending, ${confirmedMatches.length} confirmed`
            : "No matches yet. Report an item to get started."}
        </p>
      </div>

      {!userId && (
        <div
          className="glass-card"
          style={{
            padding: 48,
            textAlign: "center",
          }}
        >
          <Bell size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>
            Sign in to view matches
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            You need to be signed in to view your match history.
          </p>
        </div>
      )}

      {userId && matches.length === 0 && (
        <div
          className="glass-card"
          style={{
            padding: 48,
            textAlign: "center",
          }}
        >
          <Package size={48} color="var(--text-muted)" style={{ marginBottom: 16 }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>
            No matches yet
          </h3>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Report a lost or found item to start getting matches.
          </p>
        </div>
      )}

      {/* Suggested Matches */}
      {suggestedMatches.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--accent-amber)",
            }}
          >
            Pending Review ({suggestedMatches.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {suggestedMatches.map((match, index) => (
              <MatchCard
                key={match.id}
                matchId={match.id}
                foundItem={match.found_item}
                confidenceScore={match.confidence_score}
                onConfirm={handleConfirmMatch}
                onReject={handleRejectMatch}
                animationDelay={index}
              />
            ))}
          </div>
        </section>
      )}

      {/* Confirmed Matches */}
      {confirmedMatches.length > 0 && (
        <section style={{ marginBottom: 32 }}>
          <h2
            style={{
              fontSize: "1.1rem",
              fontWeight: 600,
              marginBottom: 16,
              color: "var(--accent-emerald)",
            }}
          >
            Confirmed ({confirmedMatches.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {confirmedMatches.map((match, index) => (
              <MatchCard
                key={match.id}
                matchId={match.id}
                foundItem={match.found_item}
                confidenceScore={match.confidence_score}
                onConfirm={handleConfirmMatch}
                onReject={handleRejectMatch}
                animationDelay={index}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
