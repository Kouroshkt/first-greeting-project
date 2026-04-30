import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  BURGER_ADD_OPTIONS,
  BURGER_REMOVE_OPTIONS,
  type MenuItem,
} from "@/data/menuData";
import type { Customizations } from "@/store/orderStore";

interface Props {
  item: MenuItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (item: MenuItem, customizations: Customizations) => void;
}

const CustomizationModal = ({ item, open, onOpenChange, onConfirm }: Props) => {
  const [added, setAdded] = useState<string[]>([]);
  const [removed, setRemoved] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setAdded([]);
      setRemoved([]);
    }
  }, [open, item?.id]);

  const toggle = (
    list: string[],
    setList: (v: string[]) => void,
    value: string,
  ) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  const handleConfirm = () => {
    if (!item) return;
    onConfirm(item, { added, removed });
    onOpenChange(false);
  };

  if (!item) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{item.name}</DialogTitle>
          <DialogDescription className="font-body">
            Anpassa din burgare. Tillvalen ingår i priset.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          <section>
            <h4 className="font-heading font-bold text-sm mb-3 text-foreground">
              Lägg till
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {BURGER_ADD_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={added.includes(opt)}
                    onCheckedChange={() => toggle(added, setAdded, opt)}
                  />
                  <span className="font-body text-sm text-foreground">{opt}</span>
                </label>
              ))}
            </div>
          </section>

          <section>
            <h4 className="font-heading font-bold text-sm mb-3 text-foreground">
              Ta bort
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {BURGER_REMOVE_OPTIONS.map((opt) => (
                <label
                  key={opt}
                  className="flex items-center gap-2 p-2 rounded-lg border border-border cursor-pointer hover:bg-muted/50"
                >
                  <Checkbox
                    checked={removed.includes(opt)}
                    onCheckedChange={() => toggle(removed, setRemoved, opt)}
                  />
                  <span className="font-body text-sm text-foreground">{opt}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        <DialogFooter>
          <button
            onClick={() => onOpenChange(false)}
            className="font-body text-muted-foreground hover:text-foreground px-4 py-2"
          >
            Avbryt
          </button>
          <button
            onClick={handleConfirm}
            className="bg-tertiary text-tertiary-foreground font-heading font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Lägg till i varukorg
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CustomizationModal;
