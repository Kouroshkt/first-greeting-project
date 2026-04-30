import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderStore } from "@/store/orderStore";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/butcher-burgers-logo.png";

type PaymentMethod = "kort" | "swish" | null;

const PaymentPage = () => {
  const navigate = useNavigate();
  const { cart, getSubtotal, getTax, getTotal, orderType, clearCart } =
    useOrderStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [wantReceipt, setWantReceipt] = useState(true);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);

  if (cart.length === 0 && !isDone) {
    navigate("/meny");
    return null;
  }

  const handlePay = async () => {
    if (!paymentMethod) return;
    setIsPaying(true);
    setPaymentError(null);

    try {
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          paymentMethod,
          cart: cart.map((item) => ({
            id: item.menuItem.id,
            name: item.menuItem.name,
            price: item.menuItem.price,
            quantity: item.quantity,
            // MFFO-208: behövs för att backend ska kunna avgöra om ordern har prep-items
            category: item.menuItem.category,
            isPrep: item.menuItem.isPrep,
            allergens: item.menuItem.allergens,
            customizations: item.customizations,
          })),
          orderType,
          subtotal: getSubtotal(),
          tax: getTax(),
          total: getTotal(),
        },
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || "Betalningen misslyckades");

      setOrderNumber(data.orderNumber);
      setIsDone(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Något gick fel";
      setPaymentError(message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleNewOrder = () => {
    clearCart();
    navigate("/");
  };

  if (isDone) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-8 px-6">
        <img src={logo} alt="Butcher Burgers" className="h-16 w-auto" />
        <div className="text-center space-y-4">
          <div className="text-6xl">✅</div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            Betalning genomförd!
          </h1>
          {orderNumber && (
            <div className="bg-primary/20 rounded-2xl px-8 py-4">
              <p className="font-body text-muted-foreground text-sm">Ditt ordernummer</p>
              <p className="font-heading text-5xl font-bold text-foreground">
                #{orderNumber}
              </p>
            </div>
          )}
          <p className="font-body text-muted-foreground text-lg">
            {orderType === "dine-in"
              ? "Din beställning förbereds. Vänligen ta plats."
              : "Din beställning förbereds. Hämta vid disken."}
          </p>
          {wantReceipt && (
            <div className="bg-card rounded-2xl p-6 shadow-md text-left max-w-sm mx-auto">
              <h2 className="font-heading font-bold text-foreground mb-3">
                Kvitto
              </h2>
              {orderNumber && (
                <p className="font-body text-sm text-muted-foreground mb-2">
                  Ordernummer: #{orderNumber}
                </p>
              )}
              {cart.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="flex justify-between font-body text-sm text-foreground py-1"
                >
                  <span>
                    {item.quantity}x {item.menuItem.name}
                  </span>
                  <span>{item.menuItem.price * item.quantity} kr</span>
                </div>
              ))}
              <div className="border-t border-border mt-2 pt-2">
                <div className="flex justify-between font-body text-sm text-muted-foreground">
                  <span>Moms (8%)</span>
                  <span>{getTax().toFixed(2)} kr</span>
                </div>
                <div className="flex justify-between font-heading font-bold text-foreground mt-1">
                  <span>Totalt</span>
                  <span>{getTotal().toFixed(2)} kr</span>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          onClick={handleNewOrder}
          className="bg-primary text-primary-foreground font-heading font-bold px-10 py-4 rounded-xl text-lg hover:opacity-90 transition-opacity"
        >
          Ny beställning
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card shadow-sm">
        <button
          onClick={() => navigate("/oversikt")}
          className="hover:opacity-80"
        >
          <img src={logo} alt="Butcher Burgers" className="h-12 w-auto" />
        </button>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Betalning
        </h1>
      </div>

      {/* Order summary */}
      <div className="px-6 py-4">
        <div className="bg-card rounded-2xl p-6 shadow-md">
          <h2 className="font-heading font-bold text-foreground mb-4">
            Ordersammanfattning
          </h2>
          {cart.map((item) => (
            <div
              key={item.menuItem.id}
              className="flex justify-between font-body text-foreground py-2 border-b border-border last:border-0"
            >
              <span>
                {item.quantity}x {item.menuItem.name}
              </span>
              <span className="font-medium">
                {item.menuItem.price * item.quantity} kr
              </span>
            </div>
          ))}
          <div className="mt-4 pt-2 border-t border-border">
            <div className="flex justify-between font-body text-muted-foreground text-sm">
              <span>Subtotal</span>
              <span>{getSubtotal().toFixed(2)} kr</span>
            </div>
            <div className="flex justify-between font-body text-muted-foreground text-sm">
              <span>Moms (8%)</span>
              <span>{getTax().toFixed(2)} kr</span>
            </div>
            <div className="flex justify-between font-heading font-bold text-xl text-foreground mt-2">
              <span>Totalt</span>
              <span>{getTotal().toFixed(2)} kr</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payment method */}
      <div className="px-6 py-4 flex-1">
        <h2 className="font-heading font-bold text-foreground mb-4">
          Välj betalningsmetod
        </h2>
        <div className="flex gap-4">
          <button
            onClick={() => setPaymentMethod("kort")}
            className={`flex-1 flex flex-col items-center gap-3 py-8 rounded-2xl font-heading font-bold text-lg transition-all ${
              paymentMethod === "kort"
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "bg-card text-foreground shadow-md hover:shadow-lg"
            }`}
          >
            <span className="text-4xl">💳</span>
            Kort
          </button>
          <button
            onClick={() => setPaymentMethod("swish")}
            className={`flex-1 flex flex-col items-center gap-3 py-8 rounded-2xl font-heading font-bold text-lg transition-all ${
              paymentMethod === "swish"
                ? "bg-primary text-primary-foreground shadow-lg scale-105"
                : "bg-card text-foreground shadow-md hover:shadow-lg"
            }`}
          >
            <span className="text-4xl">📱</span>
            Swish
          </button>
        </div>

        {/* Receipt toggle */}
        <div className="mt-6 flex items-center gap-3">
          <button
            onClick={() => setWantReceipt(!wantReceipt)}
            className={`w-12 h-7 rounded-full transition-colors relative ${
              wantReceipt ? "bg-tertiary" : "bg-muted"
            }`}
          >
            <span
              className={`absolute top-0.5 w-6 h-6 rounded-full bg-card shadow transition-transform ${
                wantReceipt ? "left-5" : "left-0.5"
              }`}
            />
          </button>
          <span className="font-body text-foreground">
            {wantReceipt ? "Visa kvitto" : "Inget kvitto"} 🌱
          </span>
        </div>

        {paymentError && (
          <div className="mt-4 bg-destructive/10 text-destructive font-body text-sm p-4 rounded-xl">
            {paymentError}
          </div>
        )}
      </div>

      {/* Bottom */}
      <div className="flex justify-between px-6 py-4 bg-card shadow-inner gap-4">
        <button
          onClick={() => navigate("/oversikt")}
          className="font-body text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Tillbaka
        </button>
        <button
          onClick={handlePay}
          disabled={!paymentMethod || isPaying}
          className={`flex-1 font-heading font-bold py-4 rounded-xl text-lg transition-all ${
            paymentMethod && !isPaying
              ? "bg-tertiary text-tertiary-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          {isPaying ? "Bearbetar..." : `Betala ${getTotal().toFixed(2)} kr`}
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
