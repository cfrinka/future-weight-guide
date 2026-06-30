import type { WeightEntry, WeightUnit } from "./types";

export const KG_TO_LBS = 2.2046226218;

export function toDisplay(kg: number, unit: WeightUnit): number {
  return unit === "kg" ? kg : kg * KG_TO_LBS;
}

export function toKg(value: number, unit: WeightUnit): number {
  return unit === "kg" ? value : value / KG_TO_LBS;
}

export function formatWeight(kg: number, unit: WeightUnit, digits = 1): string {
  return `${toDisplay(kg, unit).toFixed(digits)} ${unit}`;
}

const DAY = 1000 * 60 * 60 * 24;

function daysBetween(a: string, b: string): number {
  return (new Date(b).getTime() - new Date(a).getTime()) / DAY;
}

export interface Analytics {
  sorted: WeightEntry[];
  currentWeight: number | null;
  startWeight: number | null;
  /** kg per day. Negative = losing. */
  ratePerDay: number | null;
  ratePerWeek: number | null;
  /** kg changed since first entry */
  totalChange: number | null;
  windowDays: number;
}

/**
 * Average rate of change using a linear least-squares fit over the most
 * recent `windowDays` (defaults to 30). Falls back to all data when fewer
 * points are available.
 */
export function computeAnalytics(entries: WeightEntry[], windowDays = 30): Analytics {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));

  if (sorted.length === 0) {
    return {
      sorted,
      currentWeight: null,
      startWeight: null,
      ratePerDay: null,
      ratePerWeek: null,
      totalChange: null,
      windowDays,
    };
  }

  const currentWeight = sorted[sorted.length - 1].weight;
  const startWeight = sorted[0].weight;
  const totalChange = currentWeight - startWeight;

  const latestDate = sorted[sorted.length - 1].date;
  const windowed = sorted.filter((e) => daysBetween(e.date, latestDate) <= windowDays);
  const points = windowed.length >= 2 ? windowed : sorted;

  let ratePerDay: number | null = null;
  if (points.length >= 2) {
    const base = points[0].date;
    const xs = points.map((p) => daysBetween(base, p.date));
    const ys = points.map((p) => p.weight);
    const n = xs.length;
    const sumX = xs.reduce((s, x) => s + x, 0);
    const sumY = ys.reduce((s, y) => s + y, 0);
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0);
    const sumXX = xs.reduce((s, x) => s + x * x, 0);
    const denom = n * sumXX - sumX * sumX;
    if (denom !== 0) ratePerDay = (n * sumXY - sumX * sumY) / denom;
  }

  return {
    sorted,
    currentWeight,
    startWeight,
    totalChange,
    ratePerDay,
    ratePerWeek: ratePerDay === null ? null : ratePerDay * 7,
    windowDays,
  };
}

export type PredictionStatus = "ok" | "no-target" | "no-data" | "reached" | "diverging";

export interface Prediction {
  status: PredictionStatus;
  daysRemaining: number | null;
  goalDate: Date | null;
  message: string;
}

/**
 * Estimate the date the target weight will be reached given the current
 * trend. Handles "already reached", "moving away", and "maintaining".
 */
export function predictGoalDate(analytics: Analytics, targetKg: number | null): Prediction {
  const { currentWeight, ratePerDay } = analytics;

  if (targetKg === null) {
    return { status: "no-target", daysRemaining: null, goalDate: null, message: "Set a target weight to unlock your predicted goal date." };
  }
  if (currentWeight === null || ratePerDay === null) {
    return { status: "no-data", daysRemaining: null, goalDate: null, message: "Log at least two weigh-ins to project your goal date." };
  }

  const remaining = currentWeight - targetKg; // >0 need to lose, <0 need to gain
  if (Math.abs(remaining) < 0.1) {
    return { status: "reached", daysRemaining: 0, goalDate: new Date(), message: "You've reached your target weight. Nicely done!" };
  }

  const needToLose = remaining > 0;
  const losing = ratePerDay < 0;
  const movingTowardGoal = needToLose === losing && Math.abs(ratePerDay) > 1e-4;

  if (!movingTowardGoal) {
    return {
      status: "diverging",
      daysRemaining: null,
      goalDate: null,
      message: "Maintain current momentum or adjust target to calculate prediction.",
    };
  }

  const daysRemaining = Math.ceil(Math.abs(remaining) / Math.abs(ratePerDay));
  const goalDate = new Date();
  goalDate.setDate(goalDate.getDate() + daysRemaining);

  return { status: "ok", daysRemaining, goalDate, message: "On track to reach your target." };
}