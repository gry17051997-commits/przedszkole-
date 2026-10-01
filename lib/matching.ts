import type {
  AssignmentType,
  Availability,
  ChildSchedule,
  DayOfWeek,
  MatchingCandidate,
  MatchingInput,
} from "./types";

/** "HH:MM" albo "HH:MM:SS" → minuty od północy */
export function timeToMinutes(time: string): number {
  const [hours = "0", minutes = "0"] = time.split(":");
  return Number(hours) * 60 + Number(minutes);
}

/** Długość okna czasowego w minutach */
export function windowLength(start: string, end: string): number {
  return timeToMinutes(end) - timeToMinutes(start);
}

/**
 * Dzień tygodnia dla daty "YYYY-MM-DD": 0 = poniedziałek … 6 = niedziela.
 * Parsowanie ręczne (bez `new Date(...)`) żeby uniknąć przesunięć strefy czasowej.
 */
export function getDayOfWeek(date: string): DayOfWeek {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number);
  const utcDay = new Date(Date.UTC(year, month - 1, day)).getUTCDay(); // 0 = niedziela
  return ((utcDay + 6) % 7) as DayOfWeek;
}

/** Poniedziałek (YYYY-MM-DD) tygodnia, do którego należy data */
export function mondayOf(date: string): string {
  const [year = 1970, month = 1, day = 1] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  const shift = (d.getUTCDay() + 6) % 7; // 0 dla poniedziałku
  d.setUTCDate(d.getUTCDate() - shift);
  return d.toISOString().slice(0, 10);
}

/**
 * Algorytm dopasowania kandydatów do planu dziecka.
 *
 * - DROPOFF (zaprowadzenie): osoby z `can_dropoff = true`, których okno
 *   czasowe pokrywa `start_time` planu.
 * - PICKUP (odbiór): osoby z `can_pickup = true`, których okno pokrywa
 *   `end_time` planu.
 * - Okno musi należeć do właściwego dnia (`day_of_week`) i tygodnia
 *   (`week_start` = poniedziałek daty planu).
 * - Wyniki sortowane malejąco po długości okna – dłuższe okno = wyżej.
 */
export function findCandidates(
  schedule: ChildSchedule,
  availability: Availability[],
  type: AssignmentType
): MatchingCandidate[] {
  const targetMinutes =
    type === "dropoff"
      ? timeToMinutes(schedule.start_time)
      : timeToMinutes(schedule.end_time);

  const dayOfWeek = getDayOfWeek(schedule.date);
  const weekStart = mondayOf(schedule.date);

  const candidates = availability
    .filter((slot) => {
      const coversCapability = type === "dropoff" ? slot.can_dropoff : slot.can_pickup;
      if (!coversCapability) return false;
      if (slot.day_of_week !== dayOfWeek) return false;
      if (slot.week_start !== weekStart) return false;

      const start = timeToMinutes(slot.start_time);
      const end = timeToMinutes(slot.end_time);
      return start <= targetMinutes && targetMinutes <= end;
    })
    .map<MatchingCandidate>((slot) => ({
      userId: slot.user_id,
      availabilityId: slot.id,
      windowStart: slot.start_time,
      windowEnd: slot.end_time,
      windowMinutes: windowLength(slot.start_time, slot.end_time),
    }));

  candidates.sort((a, b) => {
    if (b.windowMinutes !== a.windowMinutes) {
      return b.windowMinutes - a.windowMinutes; // dłuższe okno wyżej
    }
    return timeToMinutes(a.windowStart) - timeToMinutes(b.windowStart); // stabilnie: wcześniejsze okno wyżej
  });

  return candidates;
}

/** Wariant wywołania tablicą wejściową (wygodny w testach i UI) */
export function findCandidatesFromInput(input: MatchingInput): MatchingCandidate[] {
  return findCandidates(input.schedule, input.availability, input.type);
}
