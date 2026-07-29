import { z } from "zod";

// ─── Groq Vision Response (found item image analysis) ───────────────────────
export const VisionResponseSchema = z.object({
  category: z.string(),
  color: z.string(),
  brand: z.string(),
  material: z.string(),
  distinguishing_features: z.string(),
  short_description: z.string(),
  confidence: z.enum(["high", "medium", "low"]),
});

export type VisionResponse = z.infer<typeof VisionResponseSchema>;

// ─── Groq Text Extraction Response (lost item description parsing) ──────────
export const TextExtractionSchema = z.object({
  category: z.string(),
  color: z.string(),
  brand: z.string(),
  keywords: z.array(z.string()),
  location_hint: z.string(),
});

export type TextExtraction = z.infer<typeof TextExtractionSchema>;

// ─── Database Row Types ─────────────────────────────────────────────────────

export type ItemType = "lost" | "found";
export type ItemStatus = "open" | "matched" | "claimed" | "closed";
export type MatchStatus = "suggested" | "confirmed" | "rejected";

export interface Profile {
  id: string;
  full_name: string | null;
  fcm_token: string | null;
  created_at: string;
}

export interface Item {
  id: string;
  user_id: string | null;
  type: string;
  status: string;
  category: string | null;
  color: string | null;
  brand: string | null;
  material: string | null;
  description: string | null;
  location: string | null;
  occurred_at: string | null;
  image_url: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ai_labels: Record<string, any> | null;
  ai_description: string | null;
  ai_confidence: string | null;
  extracted_keywords: string[] | null;
  extracted_category: string | null;
  extracted_color: string | null;
  extracted_brand: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  lost_item_id: string;
  found_item_id: string;
  confidence_score: number;
  status: string;
  notified: boolean;
  created_at: string;
}

// ─── API Request/Response Schemas ───────────────────────────────────────────

export const FoundItemRequestSchema = z.object({
  imageUrl: z.string().url(),
  category: z.string().optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
  material: z.string().optional(),
  location: z.string().optional(),
  occurredAt: z.string().optional(),
});

export type FoundItemRequest = z.infer<typeof FoundItemRequestSchema>;

export const LostItemRequestSchema = z.object({
  description: z.string().min(1, "Description is required"),
  location: z.string().optional(),
  occurredAt: z.string().optional(),
  category: z.string().optional(),
  color: z.string().optional(),
  brand: z.string().optional(),
});

export type LostItemRequest = z.infer<typeof LostItemRequestSchema>;

export const MatchFindRequestSchema = z.object({
  lostItemId: z.string().uuid(),
});

export const MatchNotifyRequestSchema = z.object({
  matchId: z.string().uuid(),
});

export const MatchConfirmRequestSchema = z.object({
  matchId: z.string().uuid(),
  action: z.enum(["confirm", "reject"]),
});

export const FCMTokenRequestSchema = z.object({
  fcmToken: z.string().min(1),
});

// ─── Match with joined item data (for UI) ───────────────────────────────────

export interface MatchWithItems extends Match {
  lost_item: Item;
  found_item: Item;
}
