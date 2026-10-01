"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";

type Status = "idle" | "loading" | "sent" | "error";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    setMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }

      setStatus("sent");
      setMessage(`Wysłaliśmy link do logowania na adres ${email.trim()}.`);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Nie udało się wysłać linku.");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-2xl shadow-lg shadow-brand-600/25">
            🎒
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Przedszkole Pickup
          </h1>
          <p className="mt-2 text-sm text-zinc-500">
            Kto dziś odbiera, a kto zaprowadza? Zaloguj się i bądź na bieżąco.
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-zinc-900">Zaloguj się</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Podaj adres e-mail – wyślemy Ci link bez hasła.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-zinc-700"
              >
                Adres e-mail
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="np. tata@przyklad.pl"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={status === "loading"}
                className="mt-1.5 w-full rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-60"
            >
              {status === "loading" ? "Wysyłanie…" : "Wyślij link do logowania"}
            </button>
          </form>

          {status === "sent" && (
            <p
              role="status"
              className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800"
            >
              {message} Sprawdź skrzynkę – link jest ważny przez kilka minut.
            </p>
          )}

          {status === "error" && (
            <p
              role="alert"
              className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700"
            >
              {message}
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-zinc-400">
          Nie masz konta? Poproś Tatę lub Zuzę o dodanie Cię do rodziny.
        </p>
      </div>
    </main>
  );
}
