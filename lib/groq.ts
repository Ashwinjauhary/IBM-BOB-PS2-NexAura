import Groq from "groq-sdk";
import { VisionResponseSchema, TextExtractionSchema } from "./types";
import type { VisionResponse, TextExtraction } from "./types";

// ─── Client initialization ─────────────────────────────────────────────────

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// ─── System prompts (exact spec) ────────────────────────────────────────────

const VISION_SYSTEM_PROMPT = `You are an object-identification assistant for a campus lost & found system.
Given a photo of a found item, extract ONLY visible, verifiable attributes.
Do not guess an exact product model — only broad category and brand if a logo
is clearly visible. If uncertain about any field, say "unknown" and lower confidence.

Respond ONLY with valid JSON matching this schema, no extra text:
{
  "category": string,
  "color": string,
  "brand": string,
  "material": string,
  "distinguishing_features": string,
  "short_description": string,
  "confidence": "high" | "medium" | "low"
}`;

const TEXT_EXTRACTION_SYSTEM_PROMPT = `You extract structured search attributes from a free-text description of a lost item.
Respond ONLY with valid JSON, no extra text:
{
  "category": string,
  "color": string,
  "brand": string,
  "keywords": string[],
  "location_hint": string
}`;

// ─── Vision tagging (found item photo) ──────────────────────────────────────

export async function analyzeFoundItemImage(
  imageUrl: string
): Promise<{ data: VisionResponse | null; error: string | null }> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        { role: "system", content: VISION_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Identify this found item." },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return { data: null, error: "Empty response from vision model" };
    }

    const parsed = JSON.parse(raw);
    const validated = VisionResponseSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("Vision response validation failed:", validated.error);
      return { data: null, error: "AI response did not match expected schema" };
    }

    return { data: validated.data, error: null };
  } catch (err) {
    console.error("Groq vision call failed:", err);
    return {
      data: null,
      error: "AI tagging unavailable. Please fill fields manually.",
    };
  }
}

// ─── Text extraction (lost item description) ────────────────────────────────

// Simple stopwords for fallback keyword extraction
const STOPWORDS = new Set([
  "i", "my", "me", "a", "an", "the", "is", "was", "it", "in", "on", "at",
  "to", "for", "of", "with", "and", "or", "but", "not", "have", "had",
  "has", "this", "that", "there", "from", "by", "be", "been", "being",
  "some", "any", "no", "do", "did", "does", "will", "would", "could",
  "should", "may", "might", "can", "just", "very", "really", "about",
  "near", "around", "also", "like", "think", "lost", "found", "left",
  "yesterday", "today", "morning", "evening", "afternoon", "ago",
]);

function fallbackKeywordExtraction(description: string): TextExtraction {
  const words = description
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  // Deduplicate
  const unique = [...new Set(words)];

  return {
    category: "unknown",
    color: "unknown",
    brand: "unknown",
    keywords: unique.slice(0, 8),
    location_hint: "unknown",
  };
}

export async function extractLostItemKeywords(
  description: string
): Promise<{ data: TextExtraction; error: string | null }> {
  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: TEXT_EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: description },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) {
      return {
        data: fallbackKeywordExtraction(description),
        error: "Empty response from text model — using fallback extraction",
      };
    }

    const parsed = JSON.parse(raw);
    const validated = TextExtractionSchema.safeParse(parsed);

    if (!validated.success) {
      console.error("Text extraction validation failed:", validated.error);
      return {
        data: fallbackKeywordExtraction(description),
        error: "AI response did not match schema — using fallback extraction",
      };
    }

    return { data: validated.data, error: null };
  } catch (err) {
    console.error("Groq text extraction failed:", err);
    return {
      data: fallbackKeywordExtraction(description),
      error: "AI extraction unavailable — using fallback keyword split",
    };
  }
}
