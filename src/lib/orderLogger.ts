import { supabase } from "@/integrations/supabase/client";

/**
 * MFFO-67: Spårningstjänst för orderhändelser.
 *
 * Anropas tyst i bakgrunden vid:
 *  - skapande av order (kiosk/kassa) — i process-payment edge function
 *  - statusbyten i KDS (kök) och LDS (lucka)
 *
 * Användaren märker inget. Datat används av admin-vyn (MFFO-212/55).
 *
 * NOTE: Tabellen `order_logs` skapas via supabase/manual-migrations/20260430_order_logs.sql.
 */

export type OrderLogSource = "kiosk" | "kassa" | "kok" | "lucka" | "system";
export type OrderLogEvent =
  | "created"
  | "status_changed"
  | "updated"
  | "delivered";

interface LogStatusChangeArgs {
  orderId: string;
  orderNumber: number;
  fromStatus: string;
  toStatus: string;
  source: OrderLogSource;
  createdAt?: string; // ISO – behövs för duration vid leverans
}

const DELIVERED_STATUSES = new Set(["picked_up", "ready"]);

export async function logStatusChange({
  orderId,
  orderNumber,
  fromStatus,
  toStatus,
  source,
  createdAt,
}: LogStatusChangeArgs): Promise<void> {
  const isDelivered = DELIVERED_STATUSES.has(toStatus);
  const durationMs =
    isDelivered && createdAt
      ? Date.now() - new Date(createdAt).getTime()
      : null;

  // Tyst i bakgrunden — failar inte UI om något går fel
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from("order_logs").insert({
      order_id: orderId,
      order_number: orderNumber,
      event_type: isDelivered ? "delivered" : "status_changed",
      source,
      from_status: fromStatus,
      to_status: toStatus,
      changes: { from: fromStatus, to: toStatus },
      duration_ms: durationMs,
    });
  } catch (err) {
    // Tyst loggning — påverka inte användarens flöde
    console.warn("[orderLogger] kunde inte logga status-byte", err);
  }
}
