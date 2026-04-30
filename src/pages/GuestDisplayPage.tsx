import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DisplayOrder {
  id: string;
  order_number: number;
  status: string;
  updated_at: string;
  readyAt?: number; // timestamp when marked ready
}

const READY_DISPLAY_MS = 2 * 60 * 1000; // 2 minutes

const GuestDisplayPage = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<DisplayOrder[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("id, order_number, status, updated_at")
      .in("status", ["preparing", "ready"])
      .order("created_at", { ascending: true });

    if (!error && data) {
      setOrders(
        data.map((o) => ({
          ...o,
          readyAt: o.status === "ready" ? Date.now() : undefined,
        }))
      );
    }
  }, []);

  // Auto-remove ready orders after 2 minutes
  useEffect(() => {
    timerRef.current = setInterval(() => {
      const now = Date.now();
      setOrders((prev) =>
        prev.filter(
          (o) => o.status !== "ready" || !o.readyAt || now - o.readyAt < READY_DISPLAY_MS
        )
      );
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("guest-display")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        (payload) => {
          const updated = payload.new as any;
          if (!updated) {
            fetchOrders();
            return;
          }
          // If status changed to picked_up or completed, remove from list
          if (updated.status === "picked_up" || updated.status === "completed") {
            setOrders((prev) => prev.filter((o) => o.id !== updated.id));
            return;
          }
          // If status is ready, add/update with readyAt timestamp
          if (updated.status === "ready") {
            setOrders((prev) => {
              const exists = prev.find((o) => o.id === updated.id);
              if (exists) {
                return prev.map((o) =>
                  o.id === updated.id
                    ? { ...o, status: "ready", updated_at: updated.updated_at, readyAt: Date.now() }
                    : o
                );
              }
              return [
                ...prev,
                {
                  id: updated.id,
                  order_number: updated.order_number,
                  status: "ready",
                  updated_at: updated.updated_at,
                  readyAt: Date.now(),
                },
              ];
            });
            // Play sound
            try {
              const ctx = new AudioContext();
              const osc = ctx.createOscillator();
              const gain = ctx.createGain();
              osc.connect(gain);
              gain.connect(ctx.destination);
              osc.frequency.value = 880;
              gain.gain.value = 0.3;
              osc.start();
              osc.stop(ctx.currentTime + 0.3);
            } catch {}
            return;
          }
          // For preparing status, add/update
          if (updated.status === "preparing") {
            setOrders((prev) => {
              const exists = prev.find((o) => o.id === updated.id);
              if (exists) {
                return prev.map((o) =>
                  o.id === updated.id ? { ...o, status: "preparing" } : o
                );
              }
              return [
                ...prev,
                {
                  id: updated.id,
                  order_number: updated.order_number,
                  status: "preparing",
                  updated_at: updated.updated_at,
                },
              ];
            });
            return;
          }
          // For other statuses (done, pending), remove from guest display
          setOrders((prev) => prev.filter((o) => o.id !== updated.id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  const preparingOrders = orders.filter((o) => o.status === "preparing");
  const readyOrders = orders.filter((o) => o.status === "ready");

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <div className="flex items-center justify-between py-4 px-6 bg-gray-900">
        <button onClick={() => navigate("/")} className="text-gray-400 hover:text-white">← Tillbaka</button>
        <h1 className="text-3xl font-bold">Orderstatus</h1>
        <div className="w-16" />
      </div>

      <div className="flex-1 flex">
        {/* Tillagas column */}
        <div className="flex-1 bg-gray-900 p-6 border-r border-gray-700">
          <h2 className="text-2xl font-bold text-yellow-400 mb-6 text-center">
            🔥 Tillagas
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {preparingOrders.map((order) => (
              <div
                key={order.id}
                className="bg-yellow-900/40 border-2 border-yellow-500 rounded-xl px-6 py-4 text-center min-w-[120px]"
              >
                <span className="text-5xl font-bold block" style={{ fontSize: "clamp(2rem, 5vw, 5rem)" }}>
                  #{order.order_number}
                </span>
              </div>
            ))}
            {preparingOrders.length === 0 && (
              <p className="text-gray-500 text-lg">Inga ordrar</p>
            )}
          </div>
        </div>

        {/* Klar column */}
        <div className="flex-1 bg-gray-900 p-6">
          <h2 className="text-2xl font-bold text-green-400 mb-6 text-center">
            ✅ Klar att hämta
          </h2>
          <div className="flex flex-wrap gap-4 justify-center">
            {readyOrders.map((order) => (
              <div
                key={order.id}
                className="bg-green-900/40 border-2 border-green-500 rounded-xl px-6 py-4 text-center min-w-[120px] animate-pulse"
              >
                <span className="text-5xl font-bold block" style={{ fontSize: "clamp(2rem, 5vw, 5rem)" }}>
                  #{order.order_number}
                </span>
              </div>
            ))}
            {readyOrders.length === 0 && (
              <p className="text-gray-500 text-lg">Inga klara ordrar</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestDisplayPage;
