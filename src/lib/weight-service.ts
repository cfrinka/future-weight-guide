import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "./firebase";
import type { Profile, WeightEntry } from "./types";

const ENTRIES_KEY = "wt:entries";
const PROFILE_KEY = "wt:profile";

// A single demo user scope. Swap for real auth uid when wiring auth.
const USER_ID = "demo-user";

const DEFAULT_PROFILE: Profile = { targetWeight: null, unit: "kg" };

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/* -------------------------------------------------------------------------- */
/*  localStorage fallback                                                      */
/* -------------------------------------------------------------------------- */

function readLocal<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function seedIfEmpty(): WeightEntry[] {
  const existing = readLocal<WeightEntry[] | null>(ENTRIES_KEY, null);
  if (existing && existing.length) return existing;

  const today = new Date();
  const seed: WeightEntry[] = [];
  let w = 84.5;
  for (let i = 56; i >= 0; i -= 4) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    w -= 0.6 + Math.random() * 0.5;
    seed.push({
      id: uid(),
      date: d.toISOString().slice(0, 10),
      weight: Math.round(w * 10) / 10,
      createdAt: d.getTime(),
    });
  }
  writeLocal(ENTRIES_KEY, seed);
  const profile = readLocal<Profile | null>(PROFILE_KEY, null);
  if (!profile) writeLocal(PROFILE_KEY, { targetWeight: 72, unit: "kg" } satisfies Profile);
  return seed;
}

/* -------------------------------------------------------------------------- */
/*  Public API                                                                 */
/* -------------------------------------------------------------------------- */

export async function getEntries(): Promise<WeightEntry[]> {
  if (isFirebaseConfigured && db) {
    const q = query(collection(db, "users", USER_ID, "entries"), orderBy("date", "asc"));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WeightEntry, "id">) }));
  }
  return [...seedIfEmpty()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function addEntry(input: { date: string; weight: number }): Promise<WeightEntry> {
  const entry: WeightEntry = {
    id: uid(),
    date: input.date,
    weight: input.weight,
    createdAt: Date.now(),
  };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "users", USER_ID, "entries", entry.id), {
      date: entry.date,
      weight: entry.weight,
      createdAt: entry.createdAt,
    });
    return entry;
  }

  const entries = readLocal<WeightEntry[]>(ENTRIES_KEY, []);
  writeLocal(ENTRIES_KEY, [...entries, entry]);
  return entry;
}

export async function deleteEntry(id: string): Promise<void> {
  if (isFirebaseConfigured && db) {
    await deleteDoc(doc(db, "users", USER_ID, "entries", id));
    return;
  }
  const entries = readLocal<WeightEntry[]>(ENTRIES_KEY, []);
  writeLocal(
    ENTRIES_KEY,
    entries.filter((e) => e.id !== id),
  );
}

export async function getProfile(): Promise<Profile> {
  if (isFirebaseConfigured && db) {
    const snap = await getDoc(doc(db, "users", USER_ID));
    return snap.exists() ? { ...DEFAULT_PROFILE, ...(snap.data() as Profile) } : DEFAULT_PROFILE;
  }
  seedIfEmpty();
  return readLocal<Profile>(PROFILE_KEY, DEFAULT_PROFILE);
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const current = await getProfile();
  const next: Profile = { ...current, ...patch };

  if (isFirebaseConfigured && db) {
    await setDoc(doc(db, "users", USER_ID), next, { merge: true });
    return next;
  }
  writeLocal(PROFILE_KEY, next);
  return next;
}