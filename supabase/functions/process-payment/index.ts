import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { paymentMethod, cart, orderType, subtotal, tax, total } = body;

    // Validate input
    if (!paymentMethod || !cart || !orderType || !subtotal || !tax || !total) {
      return new Response(
        JSON.stringify({ error: "Saknade fält i förfrågan" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["kort", "swish"].includes(paymentMethod)) {
      return new Response(
        JSON.stringify({ error: "Ogiltig betalningsmetod" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Verify transaction (simulate payment gateway verification)
    const transactionVerified = verifyTransaction(paymentMethod, total);
    if (!transactionVerified) {
      return new Response(
        JSON.stringify({ error: "Betalningen misslyckades", status: "failed" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Generate unique order number
    const { data: orderNumData, error: orderNumError } = await supabase
      .rpc("get_next_order_number");

    if (orderNumError) {
      throw new Error(`Ordernummerfel: ${orderNumError.message}`);
    }

    const orderNumber = orderNumData as number;

    // 3. Create encrypted reference for the transaction
    const encryptedRef = generateEncryptedRef(paymentMethod, orderNumber, total);

    // 4. Save transaction to database
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .insert({
        order_number: orderNumber,
        payment_method: paymentMethod,
        amount: total,
        tax: tax,
        subtotal: subtotal,
        status: "confirmed",
        encrypted_ref: encryptedRef,
      })
      .select()
      .single();

    if (txError) {
      throw new Error(`Transaktionsfel: ${txError.message}`);
    }

    // 5. Payment confirmed - send order to KDS
    // MFFO-208: Om ordern inte innehåller några items som ska tillagas
    // (endast drycker/items utan prep) hoppas KDS-steget över och
    // ordern går direkt till "klara från köket" i luckdisplayen (status "done").
    const NON_PREP_IDS = new Set(["9", "10", "11"]); // cola, juice, milkshake
    const hasPrepItem = Array.isArray(cart) && cart.some((it: any) => {
      if (it?.isPrep === true) return true;
      if (NON_PREP_IDS.has(String(it?.id))) return false;
      if (it?.category && it.category !== "dryck-tillbehor") return true;
      // Default: om vi inte vet, anta prep så vi inte missar köksordrar
      return !(it?.category === "dryck-tillbehor");
    });
    const initialStatus = hasPrepItem ? "pending" : "done";

    const { error: orderError } = await supabase
      .from("orders")
      .insert({
        transaction_id: transaction.id,
        order_number: orderNumber,
        order_type: orderType,
        items: cart,
        status: initialStatus,
      });

    if (orderError) {
      throw new Error(`Orderfel: ${orderError.message}`);
    }

    // 6. Return success with order number
    return new Response(
      JSON.stringify({
        success: true,
        orderNumber: orderNumber,
        transactionId: transaction.id,
        encryptedRef: encryptedRef,
        status: "confirmed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment processing error:", error);
    const message = error instanceof Error ? error.message : "Okänt fel";
    return new Response(
      JSON.stringify({ error: message, status: "failed" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// Simulate payment verification
function verifyTransaction(method: string, amount: number): boolean {
  // In production, this would call Stripe/Swish API
  // For now, simulate successful verification
  return method !== "" && amount > 0;
}

// Generate encrypted reference for each transaction
function generateEncryptedRef(method: string, orderNumber: number, amount: number): string {
  const timestamp = Date.now();
  const raw = `${method}-${orderNumber}-${amount}-${timestamp}`;
  // Simple base64 encoding as placeholder for real encryption
  return btoa(raw);
}
