// ------------------------------------------------------------
// Typy TypeScript dla wszystkich tabel bazy (Supabase)
// ------------------------------------------------------------

/** 0 = poniedziałek … 6 = niedziela */
export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Role = "parent" | "family";

export type AssignmentType = "dropoff" | "pickup";

/** profiles – konta użytkowników */
export interface Profile {
  id: string;
  display_name: string;
  role: Role;
  created_at: string;
}

/** availability – tygodniowe okna czasowe członków rodziny */
export interface Availability {
  id: string;
  user_id: string;
  /** poniedziałek tygodnia, którego dotyczy deklaracja (YYYY-MM-DD) */
  week_start: string;
  day_of_week: DayOfWeek;
  start_time: string; // "HH:MM" (time without timezone)
  end_time: string; // "HH:MM"
  can_dropoff: boolean;
  can_pickup: boolean;
  created_at: string;
}

/** child_schedule – plan dziecka na konkretną datę */
export interface ChildSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // "HH:MM"
  end_time: string; // "HH:MM"
  location: string;
  created_by: string;
  created_at: string;
}

/** assignments – wyznaczenie osoby do odbioru / zaprowadzenia */
export interface Assignment {
  id: string;
  child_schedule_id: string;
  assigned_user_id: string;
  type: AssignmentType;
  notified: boolean;
  created_at: string;
}

/** push_subscriptions – subskrypcje Web Push */
export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

/** Kandydat zwrócony przez algorytm dopasowania */
export interface MatchingCandidate {
  userId: string;
  availabilityId: string;
  /** profil osoby, jeśli został dołączony przez wywołującego */
  profile?: Pick<Profile, "id" | "display_name" | "role"> | null;
  /** pokrywane okno czasowe */
  windowStart: string;
  windowEnd: string;
  /** długość okna w minutach – im dłuższe, tym wyżej na liście */
  windowMinutes: number;
}

/** Parametry wejściowe findCandidates */
export interface MatchingInput {
  schedule: ChildSchedule;
  availability: Availability[];
  type: AssignmentType;
}

// ------------------------------------------------------------
// Schemat bazy dla klientów Supabase (generyczne typy)
// ------------------------------------------------------------
type RowWithInsert<T> = {
  Row: T;
  Insert: Omit<T, "id" | "created_at"> & { id?: string; created_at?: string };
  Update: Partial<T>;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: { id: string; display_name: string; role?: Role; created_at?: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      availability: RowWithInsert<Availability>;
      child_schedule: RowWithInsert<ChildSchedule>;
      assignments: RowWithInsert<Assignment>;
      push_subscriptions: RowWithInsert<PushSubscription>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      role: Role;
      assignment_type: AssignmentType;
    };
    CompositeTypes: Record<string, never>;
  };
}
