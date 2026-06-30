import { format } from "date-fns";
import { CalendarCheck, TrendingDown, TrendingUp, Sparkles } from "lucide-react";
import type { Analytics, Prediction } from "@/lib/analytics";
import type { WeightUnit } from "@/lib/types";
import { toDisplay } from "@/lib/analytics";

interface PredictionCardProps {
  prediction: Prediction;
  analytics: Analytics;
  unit: WeightUnit;
}

export function PredictionCard({ prediction, analytics, unit }: PredictionCardProps) {
  const rate = analytics.ratePerWeek;
  const losing = rate != null && rate < 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: "var(--gradient-indigo)" }} />
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Sparkles className="h-4 w-4 text-indigo" />
        Predicted Goal Date
      </div>

      {prediction.status === "ok" && prediction.goalDate ? (
        <>
          <p className="mt-3 text-3xl font-bold tracking-tight text-foreground">
            {format(prediction.goalDate, "MMM d, yyyy")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            About {prediction.daysRemaining} days away at your current pace.
          </p>
        </>
      ) : prediction.status === "reached" ? (
        <>
          <p className="mt-3 flex items-center gap-2 text-2xl font-bold tracking-tight text-emerald">
            <CalendarCheck className="h-6 w-6" /> Target reached
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{prediction.message}</p>
        </>
      ) : (
        <>
          <p className="mt-3 text-lg font-semibold text-foreground">Not enough trend yet</p>
          <p className="mt-1 text-sm text-muted-foreground">{prediction.message}</p>
        </>
      )}

      {rate != null ? (
        <div className="mt-5 flex items-center gap-2 border-t border-border pt-4 text-sm">
          {losing ? (
            <TrendingDown className="h-4 w-4 text-emerald" />
          ) : (
            <TrendingUp className="h-4 w-4 text-indigo" />
          )}
          <span className="text-muted-foreground">Avg rate</span>
          <span className="ml-auto font-semibold tabular-nums text-foreground">
            {rate > 0 ? "+" : "−"}
            {toDisplay(Math.abs(rate), unit).toFixed(2)} {unit}/week
          </span>
        </div>
      ) : null}
    </div>
  );
}