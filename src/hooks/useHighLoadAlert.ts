import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * MFFO-59: Returnerar true om fler än `threshold` ordrar inkommit
 * inom de senaste `windowMinutes` minuterna.
 *
 * Default: X = 5 ordrar / Y = 1 minut.
 *
 * Notisen är aktiv tills det finns färre ordrar med status 'done'
 * (klara från köket) än tröskeln, eller tills en order flyttas
 * till 'ready' ("Visa för gäst") — då nollställer luckan trycket.
 *
 * Vi följer payload-tider och lyssnar via realtime + polling.
 */
export function useHighLoadAlert(threshold = 5, windowMinutes = 1) {
  const [active, setActive] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .gte("created_at", since);

      if (cancelled) return;
      const triggered = (count ?? 0) >= threshold;

      if (triggered) {
        setActive(true);
      } else {
        // Avaktivera om ingen "done"-order väntar på lucka
        const { count: doneCount } = await supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("status", "done");
        if (cancelled) return;
        if ((doneCount ?? 0) === 0) setActive(false);
      }
    };

    check();
    const id = setInterval(() => setTick((n) => n + 1), 15000);

    const channel = supabase
      .channel("high-load-alert")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => check()
      )
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(id);
      supabase.removeChannel(channel);
    };
    // tick triggar check via interval
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, windowMinutes, tick]);

  return active;
}
