// lib/auth.ts
// Auth helpers for Supabase email/password authentication.
// Email verification is OFF — users can sign in immediately.

import { createBrowserClient } from "./supabase";

export async function signUp(email: string, password: string, fullName: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  // Upsert profile row
  if (data.user) {
    await supabase.from("profiles").upsert({
      id: data.user.id,
      full_name: fullName,
    });
  }

  return { user: data.user, error: null };
}

export async function signIn(email: string, password: string) {
  const supabase = createBrowserClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
}

export async function signOut() {
  const supabase = createBrowserClient();
  await supabase.auth.signOut();
}

export async function getSession() {
  const supabase = createBrowserClient();
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getUser() {
  const supabase = createBrowserClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
}
