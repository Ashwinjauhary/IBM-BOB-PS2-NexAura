import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { analyzeFoundItemImage } from "@/lib/groq";
import { FoundItemRequestSchema } from "@/lib/types";
import { z } from "zod";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // Allow an optional 'analyzeOnly' flag in the body
    const extendedSchema = FoundItemRequestSchema.extend({
      analyzeOnly: z.boolean().optional(),
    });
    
    const parsed = extendedSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { imageUrl, category, color, brand, material, location, occurredAt, analyzeOnly } =
      parsed.data;

    // Get user from auth header
    const supabase = createServerClient();
    const authHeader = request.headers.get("authorization");
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id ?? null;
    }

    // Call Groq vision to analyze the image
    const { data: aiResult, error: aiError } =
      await analyzeFoundItemImage(imageUrl);

    if (aiError) {
      console.warn("AI tagging warning:", aiError);
    }

    // Merge: user-provided fields override AI-detected ones
    const finalCategory = category || aiResult?.category || null;
    const finalColor = color || aiResult?.color || null;
    const finalBrand = brand || aiResult?.brand || null;
    const finalMaterial = material || aiResult?.material || null;

    if (analyzeOnly) {
      return NextResponse.json({
        aiTagging: aiResult
          ? { success: true, labels: aiResult }
          : { success: false, message: aiError },
      });
    }

    // Insert into items table
    const { data: item, error: dbError } = await supabase
      .from("items")
      .insert({
        user_id: userId,
        type: "found",
        status: "open",
        category: finalCategory,
        color: finalColor,
        brand: finalBrand,
        material: finalMaterial,
        location: location || null,
        occurred_at: occurredAt || null,
        image_url: imageUrl,
        ai_labels: aiResult || null,
        ai_description: aiResult?.short_description || null,
        ai_confidence: aiResult?.confidence || null,
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

    return NextResponse.json({
      item,
      aiTagging: aiResult
        ? { success: true, labels: aiResult }
        : { success: false, message: aiError },
    });
  } catch (err) {
    console.error("POST /api/items/found error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
