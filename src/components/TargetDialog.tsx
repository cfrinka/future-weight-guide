import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group";
import type { Profile, WeightUnit } from "@/lib/types";
import { toDisplay, toKg } from "@/lib/analytics";

interface TargetDialogProps {
  profile: Profile;
  onSave: (patch: Partial<Profile>) => void;
}

export function TargetDialog({ profile, onSave }: TargetDialogProps) {
  const [open, setOpen] = useState(false);
  const [unit, setUnit] = useState<WeightUnit>(profile.unit);
  const [target, setTarget] = useState("");

  useEffect(() => {
    if (open) {
      setUnit(profile.unit);
      setTarget(profile.targetWeight != null ? toDisplay(profile.targetWeight, profile.unit).toFixed(1) : "");
    }
  }, [open, profile]);

  function handleSave() {
    const parsed = parseFloat(target);
    onSave({
      unit,
      targetWeight: Number.isNaN(parsed) || parsed <= 0 ? null : toKg(parsed, unit),
    });
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Settings2 className="h-4 w-4" />
          Goal settings
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Goal settings</DialogTitle>
          <DialogDescription>Set your target weight and preferred unit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Unit</Label>
            <ToggleGroup
              type="single"
              value={unit}
              onValueChange={(v) => v && setUnit(v as WeightUnit)}
              className="justify-start gap-2"
            >
              <ToggleGroupItem value="kg" className="rounded-lg border border-border px-5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                kg
              </ToggleGroupItem>
              <ToggleGroupItem value="lbs" className="rounded-lg border border-border px-5 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">
                lbs
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="space-y-2">
            <Label htmlFor="target-weight">Target weight ({unit})</Label>
            <Input
              id="target-weight"
              type="number"
              step="0.1"
              min="0"
              inputMode="decimal"
              placeholder={unit === "kg" ? "e.g. 72" : "e.g. 158"}
              value={target}
              onChange={(e) => setTarget(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}