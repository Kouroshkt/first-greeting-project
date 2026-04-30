import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * MFFO-59: Notis vid hög belastning.
 *
 * - Triggas (latchas) när antalet ordrar inkomna inom de senaste
 *   `windowMinutes` minuterna är >= `threshold`.
 * - Default: X = 5, Y = 1 (5 ordrar / 1 minut).
 * - Försvinner när luckpersonal klickar "Visa för gäst" → anropa `dismiss()`.
 *
 * Returnerar { active, dismiss }.
 */
export function useHighLoadAlert(threshold = 5, windowMinutes = 1) {
  const [active, setActive] = useState(false);
  const [tick, setTick] = useState(0);
  const dismissedAtRef = useRef<number>(0);

  const dismiss = useCallback(() => {
    dismissedAtRef.current = Date.now();
    setActive(false);
  }, []);

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
        // Trigga endast om belastningen kvarstår efter senaste dismiss
        // (dvs nya ordrar har kommit in efter dismiss-tidpunkten)
        const sinceDismiss = new Date(dismissedAtRef.current).toISOString();
        if (dismissedAtRef.current > 0) {
          const { count: postDismissCount } = await supabase
            .from("orders")
            .select("id", { count: "exact", head: true })
            .gte("created_at", sinceDismiss);
          if (cancelled) return;
          if ((postDismissCount ?? 0) >= threshold) {
            setActive(true);
          }
        } else {
          setActive(true);
        }
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
    // tick triggar polling
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, windowMinutes, tick]);

  return { active, dismiss };
}
