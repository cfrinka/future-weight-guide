import { format, parseISO } from "date-fns";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WeightEntry, WeightUnit } from "@/lib/types";
import { toDisplay } from "@/lib/analytics";

interface WeightChartProps {
  entries: WeightEntry[];
  targetKg: number | null;
  unit: WeightUnit;
}

function ChartTooltip({ active, payload, unit }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-[var(--shadow-card)]">
      <p className="text-xs font-medium text-muted-foreground">{format(parseISO(point.date), "MMM d, yyyy")}</p>
      <p className="mt-1 text-sm font-semibold text-foreground">
        {point.weight.toFixed(1)} {unit}
      </p>
      {point.target != null ? (
        <p className="text-xs font-medium text-emerald">
          Target {point.target.toFixed(1)} {unit}
        </p>
      ) : null}
    </div>
  );
}

export function WeightChart({ entries, targetKg, unit }: WeightChartProps) {
  const data = entries.map((e) => ({
    date: e.date,
    weight: toDisplay(e.weight, unit),
    target: targetKg != null ? toDisplay(targetKg, unit) : null,
  }));

  if (data.length === 0) {
    return (
      <div className="grid h-72 place-items-center text-sm text-muted-foreground">
        Log your first weigh-in to see your progress chart.
      </div>
    );
  }

  return (
    <div className="h-72 w-full sm:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="weightFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-actual)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--chart-actual)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(d) => format(parseISO(d), "MMM d")}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            domain={["dataMin - 2", "dataMax + 2"]}
            tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            width={48}
            tickFormatter={(v) => `${Math.round(v)}`}
          />
          <Tooltip content={<ChartTooltip unit={unit} />} />
          <Area type="monotone" dataKey="weight" stroke="none" fill="url(#weightFill)" />
          {targetKg != null ? (
            <Line
              type="monotone"
              dataKey="target"
              name="Target"
              stroke="var(--chart-target)"
              strokeWidth={2}
              strokeDasharray="6 6"
              dot={false}
              isAnimationActive={false}
            />
          ) : null}
          <Line
            type="monotone"
            dataKey="weight"
            name="Weight"
            stroke="var(--chart-actual)"
            strokeWidth={2.5}
            dot={{ r: 2.5, fill: "var(--chart-actual)", strokeWidth: 0 }}
            activeDot={{ r: 5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}