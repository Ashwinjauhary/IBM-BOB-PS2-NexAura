import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { sendPushNotification } from "@/lib/firebase-admin";
import { MatchNotifyRequestSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = MatchNotifyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { matchId } = parsed.data;
    const supabase = createServerClient();

    // Fetch the match
    const { data: match, error: matchErr } = await supabase
      .from("matches")
      .select("*")
      .eq("id", matchId)
      .single();

    if (matchErr || !match) {
      return NextResponse.json(
        { error: "Match not found" },
        { status: 404 }
      );
    }

    // Fetch both items separately (avoids join type issues)
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

    // Fetch profiles for both users
    const lostProfile = lostItem?.user_id
      ? (await supabase.from("profiles").select("*").eq("id", lostItem.user_id).single()).data
      : null;

    const foundProfile = foundItem?.user_id
      ? (await supabase.from("profiles").select("*").eq("id", foundItem.user_id).single()).data
      : null;

    const itemName =
      foundItem?.category ||
      foundItem?.ai_description ||
      lostItem?.category ||
      "an item";

    const notifications: Array<{ target: string; success: boolean; error: string | null }> = [];

    // Notify lost item reporter
    if (lostProfile?.fcm_token) {
      const result = await sendPushNotification(lostProfile.fcm_token, {
        title: "Match Found! 🎉",
        body: `Good news! A match was found for your lost ${itemName}.`,
        itemId: lostItem?.id,
      });
      notifications.push({ target: "lost_reporter", ...result });
    }

    // Notify found item reporter
    if (foundProfile?.fcm_token) {
      const result = await sendPushNotification(foundProfile.fcm_token, {
        title: "Someone's looking for this!",
        body: `Your found ${itemName} may belong to someone. Check the match.`,
        itemId: foundItem?.id,
      });
      notifications.push({ target: "found_reporter", ...result });
    }

    // Mark match as notified
    await supabase
      .from("matches")
      .update({ notified: true })
      .eq("id", matchId);

    return NextResponse.json({
      success: true,
      notifications,
    });
  } catch (err) {
    console.error("POST /api/match/notify error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
