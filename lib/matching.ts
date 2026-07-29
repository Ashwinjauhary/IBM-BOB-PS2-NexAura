// lib/matching.ts
// Simple, explainable confidence-score matching between a lost item and a
// found item. Deliberately kept rule-based (not a black-box embedding-only
// score) so judges can see exactly *why* a match was suggested — this is
// itself a good talking point in the demo.

type MatchItem = {
  id: string;
  category?: string | null;
  color?: string | null;
  brand?: string | null;
  location?: string | null;
  description?: string | null;
  extracted_keywords?: string[] | null; // from lost item
  extracted_category?: string | null;
  extracted_color?: string | null;
  extracted_brand?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ai_labels?: Record<string, any> | null; // from found item (Groq vision output)
  ai_description?: string | null;
};

export function computeConfidenceScore(lost: MatchItem, found: MatchItem): number {
  let score = 0;

  // Resolve category — lost item may have extracted_category, found item may have ai_labels
  const lostCategory = (
    lost.extracted_category ?? lost.category ?? ""
  ).toLowerCase();
  const foundCategory = (
    found.category ??
    (found.ai_labels as Record<string, string> | null)?.category ??
    ""
  ).toLowerCase();

  // Resolve color
  const lostColor = (
    lost.extracted_color ?? lost.color ?? ""
  ).toLowerCase();
  const foundColor = (
    found.color ??
    (found.ai_labels as Record<string, string> | null)?.color ??
    ""
  ).toLowerCase();

  // Resolve brand
  const lostBrand = (
    lost.extracted_brand ?? lost.brand ?? ""
  ).toLowerCase();
  const foundBrand = (
    found.brand ??
    (found.ai_labels as Record<string, string> | null)?.brand ??
    ""
  ).toLowerCase();

  // Category match — strongest single signal
  if (lostCategory && foundCategory && lostCategory === foundCategory) {
    score += 40;
  }

  // Color match
  if (lostColor && foundColor && lostColor === foundColor) {
    score += 20;
  }

  // Brand match (only counts if both sides are confident, i.e. not "unknown")
  if (
    lostBrand &&
    foundBrand &&
    lostBrand !== "unknown" &&
    foundBrand !== "unknown" &&
    lostBrand === foundBrand
  ) {
    score += 15;
  }

  // Keyword overlap against the found item's AI description/features
  const labels = found.ai_labels as Record<string, string> | null;
  const foundText = [
    labels?.short_description,
    labels?.distinguishing_features,
    found.ai_description,
    found.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  const keywords = lost.extracted_keywords ?? [];
  const keywordHits = keywords.filter((k) =>
    foundText.includes(k.toLowerCase())
  ).length;
  score += Math.min(keywordHits * 5, 15); // cap contribution at 15

  // Location proximity (exact/substring match for hackathon simplicity —
  // swap for geo-distance if you add coordinates later)
  if (lost.location && found.location) {
    const a = lost.location.toLowerCase();
    const b = found.location.toLowerCase();
    if (a === b) score += 10;
    else if (a.includes(b) || b.includes(a)) score += 5;
  }

  return Math.min(score, 100);
}

// Threshold above which a match is surfaced to the user automatically
export const AUTO_SUGGEST_THRESHOLD = 40;
// Threshold above which both parties get an FCM push without manual confirm
export const AUTO_NOTIFY_THRESHOLD = 70;
