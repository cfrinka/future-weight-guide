import { format, parseISO } from "date-fns";
import { Trash2, ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WeightEntry, WeightUnit } from "@/lib/types";
import { toDisplay } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface EntriesTableProps {
  entries: WeightEntry[];
  unit: WeightUnit;
  onDelete: (id: string) => void;
}

export function EntriesTable({ entries, unit, onDelete }: EntriesTableProps) {
  // newest first, with delta vs the previous (older) entry
  const ordered = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  if (ordered.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No entries yet.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-secondary/60 hover:bg-secondary/60">
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Weight</TableHead>
            <TableHead className="text-right">Change</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordered.map((entry, i) => {
            const prev = ordered[i + 1];
            const delta = prev ? entry.weight - prev.weight : 0;
            const deltaDisplay = toDisplay(Math.abs(delta), unit);
            return (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{format(parseISO(entry.date), "MMM d, yyyy")}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {toDisplay(entry.weight, unit).toFixed(1)} {unit}
                </TableCell>
                <TableCell className="text-right">
                  {prev ? (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
                        delta < 0 ? "text-emerald" : delta > 0 ? "text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {delta < 0 ? <ArrowDown className="h-3 w-3" /> : delta > 0 ? <ArrowUp className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {deltaDisplay.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(entry.id)}
                    aria-label="Delete entry"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}