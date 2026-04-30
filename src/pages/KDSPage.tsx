import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import KdsOrderCard from "@/components/kds/KdsOrderCard";
import { isPrepItem } from "@/data/menuData";

type OrderStatus = "pending" | "preparing" | "done";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  allergens?: string[];
  isPrep?: boolean;
  category?: string;
  customizations?: { added: string[]; removed: string[] };
}

interface KDSOrder {
  id: string;
  order_number: number;
  order_type: string;
  items: OrderItem[];
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  isNew?: boolean;
  // manual sort key: lower = higher priority. Initialised from created_at.
  sortKey: number;
}

const KDSPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<KDSOrder[]>([]);
  const [confirmingDone, setConfirmingDone] = useState<string | null>(null);

  // MFFO-206: Härleda allergener från tillval (kopplas till MFFO-47).
  // - Tillval "Glutenfritt bröd" => gluten-allergi
  // - Borttaget "Sås" => laktos-allergi
  const deriveAllergensFromCustomizations = (
    base: string[] | undefined,
    customizations?: { added?: string[]; removed?: string[] }
  ): string[] => {
    const set = new Set<string>(base ?? []);
    const added = customizations?.added ?? [];
    const removed = customizations?.removed ?? [];
    if (added.some((a) => a.toLowerCase().includes("glutenfri"))) {
      set.add("Gluten");
    }
    if (removed.some((r) => r.toLowerCase() === "sås")) {
      set.add("Laktos");
    }
    return Array.from(set);
  };

  // Map raw cart item shape ({menuItem, quantity}) into KDS item shape.
  const normalizeItems = (rawItems: unknown): OrderItem[] => {
    if (!Array.isArray(rawItems)) return [];
    return rawItems.map((entry: any) => {
      // Cart items from kiosk: { menuItem: {...}, quantity, customizations? }
      if (entry && entry.menuItem) {
        return {
          id: entry.menuItem.id,
          name: entry.menuItem.name,
          price: entry.menuItem.price,
          quantity: entry.quantity,
          allergens: deriveAllergensFromCustomizations(
            entry.menuItem.allergens,
            entry.customizations
          ),
          isPrep: entry.menuItem.isPrep,
          category: entry.menuItem.category,
          customizations: entry.customizations,
        };
      }
      // Already flattened
      return {
        id: entry.id,
        name: entry.name,
        price: entry.price,
        quantity: entry.quantity,
        allergens: deriveAllergensFromCustomizations(
          entry.allergens,
          entry.customizations
        ),
        isPrep: entry.isPrep,
        category: entry.category,
        customizations: entry.customizations,
      };
    });
  };

  // Filter to only prep items for KDS view (MFFO-190)
  const filterPrepItems = (items: OrderItem[]): OrderItem[] =>
    items.filter((it) => isPrepItem(it));

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .in("status", ["pending", "preparing"])
      .order("created_at", { ascending: true });

    if (!error && data) {
      setOrders(
        data
          .map((o) => {
            const allItems = normalizeItems(o.items);
            const prepItems = filterPrepItems(allItems);
            return {
              ...o,
              items: prepItems,
              status: o.status as OrderStatus,
              isNew: false,
              sortKey: new Date(o.created_at).getTime(),
            };
          })
          // Skip orders that have no prep items at all (drinks-only order shouldn't show in KDS)
          .filter((o) => o.items.length > 0)
      );
    }
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("kds-orders")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          const newOrder = payload.new as any;
          if (newOrder.status === "done" || newOrder.status === "ready" || newOrder.status === "picked_up") return;
          const allItems = normalizeItems(newOrder.items);
          const prepItems = filterPrepItems(allItems);
          if (prepItems.length === 0) return; // drinks-only — skip KDS
          setOrders((prev) => [
            ...prev,
            {
              ...newOrder,
              items: prepItems,
              status: newOrder.status as OrderStatus,
              isNew: true,
              sortKey: new Date(newOrder.created_at).getTime(),
            },
          ]);
          setTimeout(() => {
            setOrders((prev) =>
              prev.map((o) =>
                o.id === newOrder.id ? { ...o, isNew: false } : o
              )
            );
          }, 5000);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as any;
          // Remove from KDS when done (MFFO-178)
          if (updated.status === "done" || updated.status === "ready" || updated.status === "picked_up") {
            setOrders((prev) => prev.filter((o) => o.id !== updated.id));
            return;
          }
          setOrders((prev) =>
            prev.map((o) =>
              o.id === updated.id
                ? {
                    ...o,
                    status: updated.status as OrderStatus,
                    updated_at: updated.updated_at,
                  }
                : o
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    if (newStatus === "done") {
      if (confirmingDone !== orderId) {
        setConfirmingDone(orderId);
        return;
      }
      setConfirmingDone(null);
    }

    await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);
  };

  // Manual reorder (MFFO-46): swap sortKey with neighbor + log
  const moveOrder = async (orderId: string, direction: "up" | "down") => {
    setOrders((prev) => {
      const sorted = [...prev].sort((a, b) => a.sortKey - b.sortKey);
      const idx = sorted.findIndex((o) => o.id === orderId);
      if (idx === -1) return prev;
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith < 0 || swapWith >= sorted.length) return prev;
      const a = sorted[idx];
      const b = sorted[swapWith];
      const tmp = a.sortKey;
      a.sortKey = b.sortKey;
      b.sortKey = tmp;
      return sorted.map((o) => ({ ...o }));
    });

    const order = orders.find((o) => o.id === orderId);
    if (order) {
      // Log to DB (fire and forget)
      await supabase.from("priority_logs").insert({
        order_id: orderId,
        order_number: order.order_number,
        direction,
      });
    }
  };

  // Sort by manual sortKey (which mirrors waiting time by default — longest waits first)
  const sortedOrders = [...orders].sort((a, b) => a.sortKey - b.sortKey);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white">← Tillbaka</button>
          <h1 className="text-2xl font-bold">🍳 Köksdisplay (KDS)</h1>
        </div>
        <span className="text-sm text-gray-400">
          Aktiva: {sortedOrders.length}
        </span>
      </div>

      {/* Orders grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedOrders.map((order, idx) => (
          <KdsOrderCard
            key={order.id}
            order={order}
            confirmingDone={confirmingDone}
            onStatusChange={updateStatus}
            onCancelConfirm={() => setConfirmingDone(null)}
            onMoveUp={(id) => moveOrder(id, "up")}
            onMoveDown={(id) => moveOrder(id, "down")}
            canMoveUp={idx > 0}
            canMoveDown={idx < sortedOrders.length - 1}
          />
        ))}
      </div>

      {sortedOrders.length === 0 && (
        <div className="text-center text-gray-500 mt-20 text-xl">
          Inga aktiva ordrar just nu
        </div>
      )}
    </div>
  );
};

export default KDSPage;
