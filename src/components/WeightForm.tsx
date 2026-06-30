import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WeightUnit } from "@/lib/types";

interface WeightFormProps {
  unit: WeightUnit;
  onSubmit: (data: { date: string; weight: number }) => void;
  pending?: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);

export function WeightForm({ unit, onSubmit, pending }: WeightFormProps) {
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = parseFloat(weight);
    if (!date || Number.isNaN(value) || value <= 0) return;
    onSubmit({ date, weight: value });
    setWeight("");
    setDate(today());
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
      <div className="space-y-1.5">
        <Label htmlFor="entry-date">Date</Label>
        <Input id="entry-date" type="date" max={today()} value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="entry-weight">Weight ({unit})</Label>
        <Input
          id="entry-weight"
          type="number"
          step="0.1"
          min="0"
          inputMode="decimal"
          placeholder={`e.g. ${unit === "kg" ? "74.5" : "164.2"}`}
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending} className="h-10 gap-1.5">
        <Plus className="h-4 w-4" />
        Log
      </Button>
    </form>
  );
}