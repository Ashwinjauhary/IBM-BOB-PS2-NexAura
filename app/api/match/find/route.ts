import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { MatchFindRequestSchema } from "@/lib/types";
import {
  computeConfidenceScore,
  AUTO_SUGGEST_THRESHOLD,
} from "@/lib/matching";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = MatchFindRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { lostItemId } = parsed.data;
    const supabase = createServerClient();

    // Fetch the lost item
    const { data: lostItem, error: lostErr } = await supabase
      .from("items")
      .select("*")
      .eq("id", lostItemId)
      .eq("type", "lost")
      .single();

    if (lostErr || !lostItem) {
      return NextResponse.json(
        { error: "Lost item not found" },
        { status: 404 }
      );
    }

    // Fetch all open found items
    const { data: foundItems } = await supabase
      .from("items")
      .select("*")
      .eq("type", "found")
      .eq("status", "open");

    if (!foundItems || foundItems.length === 0) {
      return NextResponse.json({ matches: [], matchCount: 0 });
    }

    // Score each found item against the lost item
    const matches: Array<{
      id: string;
      found_item_id: string;
      confidence_score: number;
      found_item: unknown;
    }> = [];

    for (const foundItem of foundItems) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const score = computeConfidenceScore(lostItem as any, foundItem as any);

      if (score >= AUTO_SUGGEST_THRESHOLD) {
        const { data: matchRow } = await supabase
          .from("matches")
          .upsert(
            {
              lost_item_id: lostItemId,
              found_item_id: foundItem.id,
              confidence_score: score,
              status: "suggested",
              notified: false,
            },
            { onConflict: "lost_item_id,found_item_id" }
          )
          .select()
          .single();

        matches.push({
          id: matchRow?.id ?? "",
          found_item_id: foundItem.id,
          confidence_score: score,
          found_item: foundItem,
        });
      }
    }

    // Sort by confidence descending
    matches.sort((a, b) => b.confidence_score - a.confidence_score);

    return NextResponse.json({ matches, matchCount: matches.length });
  } catch (err) {
    console.error("POST /api/match/find error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
