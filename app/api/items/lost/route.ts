import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { extractLostItemKeywords } from "@/lib/groq";
import { LostItemRequestSchema } from "@/lib/types";
import {
  computeConfidenceScore,
  AUTO_SUGGEST_THRESHOLD,
  AUTO_NOTIFY_THRESHOLD,
} from "@/lib/matching";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = LostItemRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { description, location, occurredAt, category, color, brand } = parsed.data;
    const supabase = createServerClient();

    // Get user from auth header
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // Call Groq text extraction
    const { data: extraction, error: aiError } =
      await extractLostItemKeywords(description);

    if (aiError) {
      console.warn("AI extraction warning:", aiError);
    }

    // Insert lost item
    const { data: item, error: dbError } = await supabase
      .from("items")
      .insert({
        user_id: userId,
        type: "lost",
        status: "open",
        category: category || extraction.category || null,
        color: color || extraction.color || null,
        brand: brand || extraction.brand || null,
        description,
        location: location || (extraction.location_hint !== "unknown" ? extraction.location_hint : null),
        occurred_at: occurredAt || null,
        extracted_keywords: extraction.keywords,
        extracted_category: extraction.category,
        extracted_color: extraction.color,
        extracted_brand: extraction.brand,
      })
      .select()
      .single();

    if (dbError) {
      console.error("DB insert error:", dbError);
      return NextResponse.json(
        { error: "Failed to save item" },
        { status: 500 }
      );
    }

    // ─── Immediately run matching against all open found items ──────────
    const { data: foundItems } = await supabase
      .from("items")
      .select("*")
      .eq("type", "found")
      .eq("status", "open");

    const matches: Array<{
      found_item_id: string;
      confidence_score: number;
      found_item: unknown;
    }> = [];

    if (foundItems && foundItems.length > 0) {
      for (const foundItem of foundItems) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const score = computeConfidenceScore(item as any, foundItem as any);

        if (score >= AUTO_SUGGEST_THRESHOLD) {
          // Insert match into DB
          const { data: matchRow } = await supabase
            .from("matches")
            .upsert(
              {
                lost_item_id: item.id,
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
            found_item_id: foundItem.id,
            confidence_score: score,
            found_item: foundItem,
          });

          // Auto-notify for high-confidence matches
          if (score >= AUTO_NOTIFY_THRESHOLD && matchRow) {
            // Trigger notification asynchronously — don't block the response
            triggerNotification(supabase, matchRow.id).catch((err) =>
              console.error("Auto-notify failed:", err)
            );
          }
        }
      }
    }

    // Sort matches by confidence descending
    matches.sort((a, b) => b.confidence_score - a.confidence_score);

    return NextResponse.json({
      item,
      extraction: {
        success: !aiError,
        data: extraction,
        warning: aiError,
      },
      matches,
      matchCount: matches.length,
    });
  } catch (err) {
    console.error("POST /api/items/lost error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper: trigger notification for a match (fire-and-forget)
async function triggerNotification(
  supabase: ReturnType<typeof createServerClient>,
  matchId: string
) {
  try {
    const { sendPushNotification } = await import("@/lib/firebase-admin");

    const { data: match } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (!match) return;

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

    const lostProfile = lostItem?.user_id
      ? (await supabase.from("profiles").select("*").eq("id", lostItem.user_id).single()).data
      : null;

    const foundProfile = foundItem?.user_id
      ? (await supabase.from("profiles").select("*").eq("id", foundItem.user_id).single()).data
      : null;

    const itemName = foundItem?.category || foundItem?.ai_description || "an item";

    if (lostProfile?.fcm_token) {
      await sendPushNotification(lostProfile.fcm_token, {
        title: "Match Found! 🎉",
        body: `Good news! A match was found for your lost ${itemName}.`,
        itemId: lostItem?.id,
      });
    }

    if (foundProfile?.fcm_token) {
      await sendPushNotification(foundProfile.fcm_token, {
        title: "Someone's looking for this!",
        body: `Your found ${itemName} may belong to someone. Check the match.`,
        itemId: foundItem?.id,
      });
    }

    await supabase
      .from("matches")
      .update({ notified: true })
      .eq("id", matchId);
  } catch (err) {
    console.error("Notification trigger failed:", err);
  }
}

