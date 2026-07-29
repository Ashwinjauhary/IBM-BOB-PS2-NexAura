import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { MatchConfirmRequestSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = MatchConfirmRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { matchId, action } = parsed.data;
    const supabase = createServerClient();

    // Update match status
    const newStatus = action === "confirm" ? "confirmed" : "rejected";

    const { data: match, error: updateErr } = await supabase
      .from("matches")
      .update({ status: newStatus })
      .eq("id", matchId)
      .select()
      .single();

    if (updateErr || !match) {
      return NextResponse.json(
        { error: "Failed to update match" },
        { status: 500 }
      );
    }

    // If confirmed, update both items to 'matched' status
    if (action === "confirm") {
      await supabase
        .from("items")
        .update({ status: "matched" })
        .in("id", [match.lost_item_id, match.found_item_id]);

      // Trigger notification to the other party
      try {
        const origin = request.headers.get("origin") || "";
        await fetch(`${origin}/api/match/notify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ matchId }),
        });
      } catch (notifyErr) {
        console.error("Post-confirm notification failed:", notifyErr);
        // Don't fail the confirm — notification is best-effort
      }
    }

    return NextResponse.json({
      success: true,
      match,
    });
  } catch (err) {
    console.error("POST /api/match/confirm error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
