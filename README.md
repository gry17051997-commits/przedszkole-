# Przedszkole Pickup

Aplikacja webowa do zarządzania odbiorem i zaprowadzaniem dziecka do przedszkola / zajęć dodatkowych. Rodzice wpisują plan tygodnia dziecka, członkowie rodziny deklarują swoją dostępność, a algorytm dopasowuje najlepszą osobę do każdego odbioru i zaprowadzenia — z powiadomieniem push.

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS**
- **Supabase** — baza danych (Postgres) + auth (magic link e-mail)
- **Web Push (PWA)** — powiadomienia „Dzisiaj odbierasz dziecko o 15:30"
- **Vercel** — hosting

## Role użytkowników

| Rola | Kto | Uprawnienia |
| --- | --- | --- |
| `parent` | Tata, Zuza | wpisuje plan dziecka (`child_schedule`), zatwierdza przypisania (`assignments`) |
| `family` | babcia, dziadek, prababcia, ciocia Weronika | deklaruje dostępność (`availability`) |

## Szybki start

1. **Instalacja**

   ```bash
   bun install
   ```

2. **Supabase**
   - Utwórz projekt na [supabase.com](https://supabase.com).
   - Wklej zawartość `supabase/schema.sql` w **SQL Editor** i uruchom go.
   - Skopiuj `Project URL` i `anon key` z **Project Settings → API**.

3. **Zmienne środowiskowe** — utwórz plik `.env.example` skopiowany poniżej jako `.env.local` (nie commituj go):

   ```bash
   # Supabase – Dashboard → Project Settings → API
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

   # Tylko po stronie serwera (akcje administracyjne, nie używać w kodzie klienta)
   SUPABASE_SERVICE_ROLE_KEY=

   # Web Push – wygeneruj klucze: npx web-push generate-vapid-keys
   NEXT_PUBLIC_VAPID_PUBLIC_KEY=
   VAPID_PRIVATE_KEY=
   VAPID_SUBJECT=mailto:twoj-adres@example.com
   ```

4. **Tryb deweloperski**

   ```bash
   bun run dev
   ```

5. **Deploy na Vercel** — podłącz repozytorium, dodaj te same zmienne w **Project Settings → Environment Variables**, włącz **Enable PWA** (next-pwa / service worker) zgodnie z krokami z roadmapy.

## Struktura projektu

```
app/
  (auth)/login/page.tsx      # logowanie magic linkiem (Supabase Auth)
  (app)/                     # chroniona część aplikacji (kolejne kroki)
    layout.tsx
    dashboard/page.tsx
    availability/page.tsx
    schedule/page.tsx
    assignments/page.tsx
  api/push/subscribe/route.ts # zapis subskrypcji push
  layout.tsx                  # layout globalny
  globals.css                 # style Tailwind
components/                   # AvailabilityForm, AvailabilityGrid, ChildScheduleForm, CandidateList, ui/
lib/
  matching.ts                 # algorytm findCandidates
  supabase/client.ts          # klient przeglądarkowy
  supabase/server.ts          # klient serwerowy (App Router)
  types.ts                    # typy tabel
supabase/schema.sql           # pełny schemat + RLS
public/manifest.json          # manifest PWA
public/sw.js                  # service worker
```

## Model danych

- `profiles` — konta (`role`: `parent` | `family`)
- `availability` — okna czasowe tygodniowe: `week_start` (poniedziałek), `day_of_week` (0–6, 0 = poniedziałek), `start_time`, `end_time`, `can_dropoff`, `can_pickup`
- `child_schedule` — plan dziecka na konkretną datę: `date`, `start_time`, `end_time`, `location`
- `assignments` — wyznaczenie osoby do dropoff/pickup, flaga `notified`
- `push_subscriptions` — subskrypcje Web Push (endpoint, p256dh, auth)

### Algorytm dopasowania (`lib/matching.ts`)

- **DROPOFF** → osoby z `can_dropoff = true`, których okno pokrywa `start_time` planu.
- **PICKUP** → osoby z `can_pickup = true`, których okno pokrywa `end_time` planu.
- Kandydaci posortowani po długości okna (dłuższe okno = wyżej).

## RLS (podsumowanie)

- Wszyscy zalogowani **czytają** `profiles` i `availability`.
- Tylko `parent` **dodaje/edytuje** `child_schedule` i `assignments`.
- Każdy zarządza **wyłącznie własną** `availability` i `push_subscriptions`.

## Roadmapa

- [x] 1. Pliki konfiguracyjne + schemat SQL + typy + matching + klienty Supabase + layout + strona logowania
- [ ] 2. UI dostępności (lista + przełącznik na kalendarz tygodniowy)
- [ ] 3. Formularz planu dziecka (`child_schedule`)
- [ ] 4. Widok kandydatów + ręczne zatwierdzenie przez rodzica
- [ ] 5. Web Push: service worker, zapis subskrypcji, powiadomienia
- [ ] 6. Dashboard z podsumowaniem dnia
