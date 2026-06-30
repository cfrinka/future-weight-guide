import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  accent?: "indigo" | "emerald" | "slate";
}

const accentMap = {
  indigo: "bg-indigo/10 text-indigo",
  emerald: "bg-emerald/10 text-emerald",
  slate: "bg-secondary text-secondary-foreground",
} as const;

export function MetricCard({ label, value, hint, icon: Icon, accent = "slate" }: MetricCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] transition-shadow hover:shadow-[var(--shadow-elevated)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", accentMap[accent])}>
          <Icon className="h-4.5 w-4.5" strokeWidth={2.2} />
        </span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}