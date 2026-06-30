import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Activity,
  CloudOff,
  Flag,
  LineChart as LineChartIcon,
  Target,
  Weight,
} from "lucide-react";
import { isFirebaseConfigured } from "@/lib/firebase";
import { addEntry, deleteEntry, getEntries, getProfile, updateProfile } from "@/lib/weight-service";
import { computeAnalytics, formatWeight, predictGoalDate, toDisplay, toKg } from "@/lib/analytics";
import type { Profile, WeightEntry, WeightUnit } from "@/lib/types";
import { MetricCard } from "@/components/MetricCard";
import { WeightForm } from "@/components/WeightForm";
import { WeightChart } from "@/components/WeightChart";
import { EntriesTable } from "@/components/EntriesTable";
import { PredictionCard } from "@/components/PredictionCard";
import { TargetDialog } from "@/components/TargetDialog";
import { format } from "date-fns";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pulse — Weight Tracker & Goal Forecast" },
      {
        name: "description",
        content:
          "Track your weight, visualize progress against your target, and forecast your goal date with trend-based predictive analytics.",
      },
      { property: "og:title", content: "Pulse — Weight Tracker & Goal Forecast" },
      {
        property: "og:description",
        content: "Log weigh-ins, see your trend, and get a predicted goal date.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const queryClient = useQueryClient();

  const { data: entries = [], isLoading: entriesLoading } = useQuery({
    queryKey: ["entries"],
    queryFn: getEntries,
  });
  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: getProfile });

  const unit: WeightUnit = profile?.unit ?? "kg";
  const targetKg = profile?.targetWeight ?? null;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["entries"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
  };

  const addMutation = useMutation({
    mutationFn: (data: { date: string; weight: number }) =>
      addEntry({ date: data.date, weight: toKg(data.weight, unit) }),
    onSuccess: () => {
      toast.success("Weigh-in logged");
      invalidate();
    },
    onError: () => toast.error("Could not save entry"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEntry(id),
    onSuccess: () => {
      toast.success("Entry deleted");
      invalidate();
    },
  });

  const saveProfile = useMutation({
    mutationFn: (patch: Partial<Profile>) => updateProfile(patch),
    onSuccess: () => {
      toast.success("Goal updated");
      invalidate();
    },
  });

  const analytics = computeAnalytics(entries as WeightEntry[]);
  const prediction = predictGoalDate(analytics, targetKg);

  const currentWeight = analytics.currentWeight;
  const totalChange = analytics.totalChange;

  const safeProfile: Profile = profile ?? { targetWeight: null, unit: "kg" };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
        {/* Header */}
        <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 sm:flex sm:flex-wrap sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-primary-foreground"
              style={{ background: "var(--gradient-indigo)" }}
            >
              <Activity className="h-5 w-5" strokeWidth={2.4} />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                Pulse
              </h1>
              <p className="truncate text-sm text-muted-foreground">Weight tracking & goal forecast</p>
            </div>
          </div>
          <TargetDialog profile={safeProfile} onSave={(patch) => saveProfile.mutate(patch)} />
        </header>

        {!isFirebaseConfigured ? (
          <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 py-2.5 text-xs text-muted-foreground">
            <CloudOff className="h-3.5 w-3.5 shrink-0" />
            Demo mode — data is saved locally in your browser. Add Firebase keys to sync to the cloud.
          </div>
        ) : null}

        {/* Metrics */}
        <section className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <MetricCard
            label="Current weight"
            value={currentWeight != null ? formatWeight(currentWeight, unit) : "—"}
            icon={Weight}
            accent="indigo"
          />
          <MetricCard
            label="Target weight"
            value={targetKg != null ? formatWeight(targetKg, unit) : "Not set"}
            icon={Target}
            accent="emerald"
          />
          <MetricCard
            label="Total progress"
            value={
              totalChange != null
                ? `${totalChange > 0 ? "+" : "−"}${toDisplay(Math.abs(totalChange), unit).toFixed(1)} ${unit}`
                : "—"
            }
            hint={totalChange != null ? "since first entry" : undefined}
            icon={Flag}
            accent="slate"
          />
          <MetricCard
            label="Est. achievement"
            value={prediction.goalDate && prediction.status === "ok" ? format(prediction.goalDate, "MMM d, yyyy") : prediction.status === "reached" ? "Reached" : "—"}
            icon={LineChartIcon}
            accent="indigo"
          />
        </section>

        {/* Chart + Prediction */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold tracking-tight text-foreground">Progress</h2>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-chart-actual" /> Weight
                </span>
                {targetKg != null ? (
                  <span className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-chart-target" /> Target
                  </span>
                ) : null}
              </div>
            </div>
            <div className="mt-4">
              {entriesLoading ? (
                <div className="grid h-72 place-items-center text-sm text-muted-foreground">Loading…</div>
              ) : (
                <WeightChart entries={analytics.sorted} targetKg={targetKg} unit={unit} />
              )}
            </div>
          </div>
          <PredictionCard prediction={prediction} analytics={analytics} unit={unit} />
        </section>

        {/* Entry form + table */}
        <section className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-1">
            <h2 className="text-base font-bold tracking-tight text-foreground">Log a weigh-in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Defaults to today's date.</p>
            <div className="mt-4">
              <WeightForm unit={unit} pending={addMutation.isPending} onSubmit={(d) => addMutation.mutate(d)} />
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
            <h2 className="text-base font-bold tracking-tight text-foreground">History</h2>
            <p className="mt-1 text-sm text-muted-foreground">{entries.length} entries</p>
            <div className="mt-4">
              <EntriesTable entries={entries as WeightEntry[]} unit={unit} onDelete={(id) => deleteMutation.mutate(id)} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
