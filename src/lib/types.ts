export type WeightUnit = "kg" | "lbs";

export interface WeightEntry {
  id: string;
  /** ISO date string (yyyy-mm-dd) */
  date: string;
  /** Stored in kg internally */
  weight: number;
  createdAt: number;
}

export interface Profile {
  /** Target weight stored in kg internally */
  targetWeight: number | null;
  unit: WeightUnit;
}