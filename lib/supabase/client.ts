import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";

/**
 * Klient Supabase do użycia w komponentach klienckich
 * ("use client" – formularze, widoki, subskrypcja push).
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Brak NEXT_PUBLIC_SUPABASE_URL lub NEXT_PUBLIC_SUPABASE_ANON_KEY – uzupełnij zmienne środowiskowe (patrz .env.example)."
    );
  }

  return createBrowserClient<Database>(url, anonKey);
}
