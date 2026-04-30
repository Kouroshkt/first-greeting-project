import { AlertTriangle, ChevronDown, ChevronUp } from "lucide-react";

export type OrderStatus = "pending" | "preparing" | "done";

export interface KdsItem {
  id: string;
  name: string;
  quantity: number;
  allergens?: string[];
  isPrep?: boolean;
  category?: string;
  customizations?: { added: string[]; removed: string[] };
}

export interface KdsOrderCardOrder {
  id: string;
  order_number: number;
  items: KdsItem[];
  status: OrderStatus;
  created_at: string;
  isNew?: boolean;
}

const STATUS_NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending: "preparing",
  preparing: "done",
  done: null,
};

interface Props {
  order: KdsOrderCardOrder;
  confirmingDone: string | null;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onCancelConfirm: () => void;
  onMoveUp?: (id: string) => void;
  onMoveDown?: (id: string) => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
}

const KdsOrderCard = ({
  order,
  confirmingDone,
  onStatusChange,
  onCancelConfirm,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: Props) => {
  const nextStatus = STATUS_NEXT[order.status];
  const isConfirming = confirmingDone === order.id;
  const elapsedMin = Math.floor(
    (Date.now() - new Date(order.created_at).getTime()) / 60000
  );

  // Allergen detection — any item with allergens => special-diet order
  const hasAllergen = order.items.some(
    (it) => Array.isArray(it.allergens) && it.allergens.length > 0
  );

  // Priority border by waiting time (MFFO-42)
  // 0–5 min: neutral, 5–8 min: yellow, >8 min: red + FÖRSENAD
  const isWarning = elapsedMin >= 5 && elapsedMin <= 8;
  const isCritical = elapsedMin > 8;

  // Background: white if allergen, red bg if critical, otherwise dark card
  const bgClass = isCritical
    ? "bg-red-100 text-red-950"
    : hasAllergen
    ? "bg-white text-gray-900"
    : "bg-gray-800 text-white";

  const borderClass = isCritical
    ? "border-red-500"
    : isWarning
    ? "border-yellow-400"
    : "border-transparent";

  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  // MFFO-45: en order är en specialbeställning om något item har
  // tillval (added eller removed är ifyllt).
  const isSpecial = order.items.some((it) => {
    const a = it.customizations?.added?.length ?? 0;
    const r = it.customizations?.removed?.length ?? 0;
    return a + r > 0;
  });

  return (
    <div
      className={`relative rounded-lg p-4 ${bgClass} ${
        order.isNew ? "ring-4 ring-yellow-400 animate-pulse" : ""
      }`}
      style={{ border: `5px solid`, borderColor: undefined }}
      data-testid="kds-card"
    >
      {/* 5px priority border overlay */}
      <div
        className={`absolute inset-0 rounded-lg pointer-events-none border-[5px] ${borderClass}`}
      />

      <div className="relative">
        {/* Top row: order# + allergen triangle + move buttons */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold">#{order.order_number}</span>
            {hasAllergen && (
              <AlertTriangle
                className="w-7 h-7"
                fill="rgb(168 85 247)"
                color="rgb(88 28 135)"
                strokeWidth={2}
                aria-label="Specialkost / Allergi"
              />
            )}
            {isCritical && (
              <span className="ml-1 px-2 py-0.5 rounded bg-red-600 text-white text-xs font-extrabold tracking-wide">
                FÖRSENAD
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <button
              onClick={() => onMoveUp?.(order.id)}
              disabled={!canMoveUp}
              aria-label="Flytta upp"
              className="w-8 h-8 rounded bg-black/10 hover:bg-black/20 disabled:opacity-30 flex items-center justify-center"
            >
              <ChevronUp className="w-5 h-5" />
            </button>
            <button
              onClick={() => onMoveDown?.(order.id)}
              disabled={!canMoveDown}
              aria-label="Flytta ner"
              className="w-8 h-8 rounded bg-black/10 hover:bg-black/20 disabled:opacity-30 flex items-center justify-center"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Meta: elapsed minutes + item count */}
        <div className="flex items-center justify-between mb-2 text-sm font-semibold opacity-80">
          <span>{elapsedMin} min</span>
          <span>{itemCount} {itemCount === 1 ? "artikel" : "artiklar"}</span>
        </div>

        {/* Items list with allergen highlight + +/- customizations */}
        <ul className="space-y-1 mb-3 text-sm">
          {order.items.map((item, i) => {
            const itemHasAllergen =
              Array.isArray(item.allergens) && item.allergens.length > 0;
            return (
              <li key={i}>
                <div
                  className={`flex justify-between ${
                    itemHasAllergen ? "font-extrabold" : "font-medium"
                  }`}
                >
                  <span>
                    {item.quantity}x {item.name}
                  </span>
                </div>
                {item.customizations?.added?.map((c) => (
                  <div key={`a-${c}`} className="ml-4 text-xs text-green-700">
                    + {c}
                  </div>
                ))}
                {item.customizations?.removed?.map((c) => (
                  <div key={`r-${c}`} className="ml-4 text-xs text-red-700">
                    − {c}
                  </div>
                ))}
              </li>
            );
          })}
        </ul>

        {/* Action button */}
        {nextStatus && !isConfirming && (
          <button
            onClick={() => onStatusChange(order.id, nextStatus)}
            className={`w-full py-2 rounded font-bold text-sm ${
              nextStatus === "preparing"
                ? "bg-blue-600 text-white"
                : "bg-green-600 text-white"
            }`}
          >
            {nextStatus === "preparing" ? "▶ Påbörja" : "✓ Klar"}
          </button>
        )}

        {isConfirming && (
          <div className="flex gap-2">
            <button
              onClick={() => onStatusChange(order.id, "done")}
              className="flex-1 py-2 rounded font-bold text-sm bg-green-600 text-white"
            >
              ✓ Bekräfta klar
            </button>
            <button
              onClick={onCancelConfirm}
              className="flex-1 py-2 rounded font-bold text-sm bg-gray-600 text-white"
            >
              Avbryt
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default KdsOrderCard;