import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { FCMTokenRequestSchema } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = FCMTokenRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { fcmToken } = parsed.data;
    const supabase = createServerClient();

    // Get user from auth header
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Upsert FCM token into profiles
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        fcm_token: fcmToken,
      });

    if (upsertErr) {
      console.error("FCM token save error:", upsertErr);
      return NextResponse.json(
        { error: "Failed to save notification token" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("POST /api/notifications/register error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
