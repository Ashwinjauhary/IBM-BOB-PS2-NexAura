// lib/database.types.ts
// Manual database type definitions for Supabase client.
// Without running `supabase gen types`, we define these manually to match schema.sql.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          fcm_token: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          fcm_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          fcm_token?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      items: {
        Row: {
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
          ai_labels: Json | null;
          ai_description: string | null;
          ai_confidence: string | null;
          extracted_keywords: string[] | null;
          extracted_category: string | null;
          extracted_color: string | null;
          extracted_brand: string | null;
          embedding: unknown | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type: string;
          status?: string;
          category?: string | null;
          color?: string | null;
          brand?: string | null;
          material?: string | null;
          description?: string | null;
          location?: string | null;
          occurred_at?: string | null;
          image_url?: string | null;
          ai_labels?: Json | null;
          ai_description?: string | null;
          ai_confidence?: string | null;
          extracted_keywords?: string[] | null;
          extracted_category?: string | null;
          extracted_color?: string | null;
          extracted_brand?: string | null;
          embedding?: unknown | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          type?: string;
          status?: string;
          category?: string | null;
          color?: string | null;
          brand?: string | null;
          material?: string | null;
          description?: string | null;
          location?: string | null;
          occurred_at?: string | null;
          image_url?: string | null;
          ai_labels?: Json | null;
          ai_description?: string | null;
          ai_confidence?: string | null;
          extracted_keywords?: string[] | null;
          extracted_category?: string | null;
          extracted_color?: string | null;
          extracted_brand?: string | null;
          embedding?: unknown | null;
          created_at?: string;
        };
        Relationships: [];
      };
      matches: {
        Row: {
          id: string;
          lost_item_id: string;
          found_item_id: string;
          confidence_score: number;
          status: string;
          notified: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          lost_item_id: string;
          found_item_id: string;
          confidence_score: number;
          status?: string;
          notified?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          lost_item_id?: string;
          found_item_id?: string;
          confidence_score?: number;
          status?: string;
          notified?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
