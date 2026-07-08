// =================================================================
// ORBI LIFE — Auth (Supabase Auth — özel şifre/cookie sistemi YOK)
// Server Components ve Server Actions'da kullanılır.
// =================================================================
"use server";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";

export type SessionUser = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  role: string;
  genius_level: number;
  total_reservations: number;
};

async function createSupabaseServerClient() {
  // Next.js 16'da cookies() bir Promise döner — await edilmesi zorunlu.
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* Server component'ten çağrıldığında set çalışmaz, görmezden gel */ }
        },
      },
    }
  );
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  try {
    const sb = await createSupabaseServerClient();
    const { data: { user } } = await sb.auth.getUser();
    if (!user) return null;

    const { data: profile } = await sb
      .from("profiles")
      .select("full_name, phone, role, genius_level, total_reservations")
      .eq("id", user.id)
      .single();

    if (!profile) return null;

    return {
      id: user.id,
      email: user.email ?? "",
      full_name: profile.full_name,
      phone: profile.phone,
      role: profile.role,
      genius_level: profile.genius_level,
      total_reservations: profile.total_reservations,
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") return null;
  return user;
}
