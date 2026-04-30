import { useEffect, useState, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useHighLoadAlert } from "@/hooks/useHighLoadAlert";

interface CounterItem {
  id: string;
  name: string;
  quantity: number;
  allergens?: string[];
  customizations?: { added: string[]; removed: string[] };
}

interface CounterOrder {
  id: string;
  order_number: number;
  status: string;
  order_type: string;
  created_at: string;
  items: CounterItem[];
}

const normalizeItems = (raw: unknown): CounterItem[] => {
  if (!Array.isArray(raw)) return [];
  return raw.map((entry: any) => {
    if (entry && entry.menuItem) {
      return {
        id: entry.menuItem.id,
        name: entry.menuItem.name,
        quantity: entry.quantity,
        allergens: entry.menuItem.allergens,
        customizations: entry.customizations,
      };
    }
    return {
      id: entry.id,
      name: entry.name,
      quantity: entry.quantity,
      allergens: entry.allergens,
      customizations: entry.customizations,
    };
  });
};

const CounterDisplayPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<CounterOrder[]>([]);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, order_type, created_at, items")
      // MFFO-207: inkludera 'preparing' så att ordern ligger kvar i LDS
      // tills luckpersonalen klickar "Visa för gäst".
      .in("status", ["pending", "preparing", "done", "ready"])
      .order("created_at", { ascending: true });

    if (!error && data) {
      setOrders(
        data.map((o) => ({
          ...o,
          items: normalizeItems(o.items),
        }))
      );
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("counter-display")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // MFFO-59: notis vid hög belastning. Försvinner när "Visa för gäst" klickas.
  const { active: highLoad, dismiss: dismissHighLoad } = useHighLoadAlert(5, 1);

  const markReady = async (orderId: string) => {
    await supabase
      .from("orders")
      .update({ status: "ready" })
      .eq("id", orderId);
    dismissHighLoad();
  };

  const markPickedUp = async (orderId: string) => {
    await supabase
      .from("orders")
      .update({ status: "picked_up" })
      .eq("id", orderId);
  };

  // MFFO-207: pending OCH preparing visas i "nya beställningar"-kolumnen
  // tills luckpersonal manuellt flyttar dem via "Visa för gäst".
  const pendingOrders = orders.filter(
    (o) => o.status === "pending" || o.status === "preparing"
  );
  const doneOrders = orders.filter((o) => o.status === "done");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 p-4">
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white">← Tillbaka</button>
          <h1 className="text-2xl font-bold">📋 Luckdisplay</h1>
          {/* MFFO-59: röd varningstriangel till höger i headern vid hög belastning */}
          <div className="w-16 flex justify-end">
            {highLoad && (
              <AlertTriangle
                className="w-8 h-8 text-red-500"
                fill="currentColor"
                aria-label="Hög belastning – många ordrar"
              />
            )}
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <div className="px-4 py-2 rounded-lg font-bold bg-gray-600 text-white">
            Nya: {pendingOrders.length}
          </div>
          <div className="px-4 py-2 rounded-lg font-bold bg-yellow-500 text-black">
            Klara från kök: {doneOrders.length}
          </div>
          <div className="px-4 py-2 rounded-lg font-bold bg-green-500 text-white">
            Visas för gäst: {readyOrders.length}
          </div>
        </div>
      </div>

      {/* Three columns */}
      <div className="flex-1 grid grid-cols-3 gap-0">
        {/* Pending / new orders */}
        <div className="border-r border-gray-700 p-4">
          <h2 className="text-lg font-bold mb-3 text-center text-gray-300">
            📥 Nya beställningar
          </h2>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <CounterCard key={order.id} order={order}>
                <span className="text-xs text-gray-500">Väntar</span>
              </CounterCard>
            ))}
            {pendingOrders.length === 0 && (
              <p className="text-gray-600 text-center text-sm">Inga nya ordrar</p>
            )}
          </div>
        </div>

        {/* Done from kitchen */}
        <div className="border-r border-gray-700 p-4">
          <h2 className="text-lg font-bold mb-3 text-center text-yellow-400">
            🍳 Klara från köket
          </h2>
          <div className="space-y-3">
            {doneOrders.map((order) => (
              <CounterCard key={order.id} order={order}>
                <button
                  onClick={() => markReady(order.id)}
                  className="px-3 py-1.5 rounded font-bold text-sm bg-green-600 text-white hover:bg-green-500"
                >
                  ✓ Visa för gäst
                </button>
              </CounterCard>
            ))}
            {doneOrders.length === 0 && (
              <p className="text-gray-600 text-center text-sm">Inga ordrar från köket</p>
            )}
          </div>
        </div>

        {/* Shown on guest display */}
        <div className="p-4">
          <h2 className="text-lg font-bold mb-3 text-center text-green-400">
            📺 Visas på gästdisplay
          </h2>
          <div className="space-y-3">
            {readyOrders.map((order) => (
              <CounterCard key={order.id} order={order}>
                <button
                  onClick={() => markPickedUp(order.id)}
                  className="px-3 py-1.5 rounded font-bold text-sm bg-red-600 text-white hover:bg-red-500"
                >
                  ✕ Hämtad
                </button>
              </CounterCard>
            ))}
            {readyOrders.length === 0 && (
              <p className="text-gray-600 text-center text-sm">Inga ordrar visas</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Counter card — same layout as KDS card from sprint 3 but neutral (no priority colors)
// and shows the FULL order (not just prep items). Per MFFO-191.
const CounterCard = ({
  order,
  children,
}: {
  order: CounterOrder;
  children?: ReactNode;
}) => {
  const elapsed = Math.floor(
    (Date.now() - new Date(order.created_at).getTime()) / 60000
  );
  const itemCount = order.items.reduce((s, i) => s + i.quantity, 0);
  return (
    <div className="bg-gray-800 rounded-lg p-3 border-2 border-transparent">
      <div className="flex items-start justify-between mb-2">
        <div>
          <span className="text-xl font-bold">#{order.order_number}</span>
          <span className="ml-2 text-xs text-gray-400">
            {order.order_type === "dine-in" ? "Äta här" : "Ta med"}
          </span>
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>{elapsed} min</div>
          <div>{itemCount} {itemCount === 1 ? "artikel" : "artiklar"}</div>
        </div>
      </div>
      <ul className="text-xs space-y-0.5 mb-2">
        {order.items.map((it, i) => (
          <li key={i}>
            <div className="flex justify-between">
              <span className="font-medium">
                {it.quantity}x {it.name}
              </span>
            </div>
            {it.customizations?.added?.map((c) => (
              <div key={`a-${c}`} className="ml-3 text-green-400">+ {c}</div>
            ))}
            {it.customizations?.removed?.map((c) => (
              <div key={`r-${c}`} className="ml-3 text-red-400">− {c}</div>
            ))}
          </li>
        ))}
      </ul>
      {children && <div className="flex justify-end">{children}</div>}
    </div>
  );
};

export default CounterDisplayPage;
