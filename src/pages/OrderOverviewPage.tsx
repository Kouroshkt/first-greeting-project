import { useNavigate } from "react-router-dom";
import { useOrderStore, cartLineKey } from "@/store/orderStore";
import logo from "@/assets/butcher-burgers-logo.png";

const OrderOverviewPage = () => {
  const navigate = useNavigate();
  const { cart, updateQuantity, removeFromCart, getSubtotal, getTax, getTotal, orderType } =
    useOrderStore();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
        <img src={logo} alt="Butcher Burgers" className="h-16 w-auto" />
        <p className="font-body text-foreground text-center text-lg">
          Din varukorg är tom.
        </p>
        <button
          onClick={() => navigate("/meny")}
          className="bg-primary text-primary-foreground font-heading font-bold px-8 py-3 rounded-xl"
        >
          Gå till menyn
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card shadow-sm">
        <button onClick={() => navigate("/meny")} className="hover:opacity-80">
          <img src={logo} alt="Butcher Burgers" className="h-12 w-auto" />
        </button>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Din beställning
        </h1>
      </div>

      {/* Order type badge */}
      <div className="px-6 py-3">
        <span className="inline-block bg-secondary text-secondary-foreground font-body text-sm font-medium px-4 py-2 rounded-lg">
          {orderType === "dine-in" ? "🍽️ Äta här" : "🛍️ Ta med"}
        </span>
      </div>

      {/* Cart items */}
      <div className="flex-1 px-6 py-2 space-y-3 overflow-y-auto">
        {cart.map((item) => {
          const lineKey = cartLineKey(item.menuItem.id, item.customizations);
          const hasCustom =
            (item.customizations?.added.length ?? 0) > 0 ||
            (item.customizations?.removed.length ?? 0) > 0;
          return (
          <div
            key={lineKey}
            className="bg-card rounded-2xl p-4 shadow-sm flex items-center gap-4"
          >
            <img
              src={item.menuItem.image}
              alt={item.menuItem.name}
              className="w-20 h-20 rounded-xl object-cover"
              loading="lazy"
              width={512}
              height={512}
            />
            <div className="flex-1">
              <h3 className="font-heading font-bold text-foreground">
                {item.menuItem.name}
              </h3>
              <p className="font-body text-muted-foreground text-xs">
                {item.menuItem.description}
              </p>
              {hasCustom && (
                <div className="mt-2 space-y-0.5">
                  {item.customizations?.added.map((a) => (
                    <p
                      key={`add-${a}`}
                      className="font-body text-xs text-tertiary"
                    >
                      + {a}
                    </p>
                  ))}
                  {item.customizations?.removed.map((r) => (
                    <p
                      key={`rem-${r}`}
                      className="font-body text-xs text-destructive"
                    >
                      − {r}
                    </p>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-1 mt-1">
                {item.menuItem.allergens.map((a) => (
                  <span
                    key={a}
                    className="text-[10px] font-body bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded"
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="font-heading font-bold text-foreground">
                {item.menuItem.price * item.quantity} kr
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateQuantity(lineKey, item.quantity - 1)
                  }
                  className="w-8 h-8 rounded-full bg-muted text-foreground font-bold flex items-center justify-center hover:bg-primary transition-colors"
                >
                  −
                </button>
                <span className="font-body font-medium text-foreground w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() =>
                    updateQuantity(lineKey, item.quantity + 1)
                  }
                  className="w-8 h-8 rounded-full bg-muted text-foreground font-bold flex items-center justify-center hover:bg-primary transition-colors"
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeFromCart(lineKey)}
                className="text-xs font-body text-destructive hover:underline"
              >
                Ta bort
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-card shadow-inner space-y-2">
        <div className="flex justify-between font-body text-muted-foreground">
          <span>Subtotal</span>
          <span>{getSubtotal().toFixed(2)} kr</span>
        </div>
        <div className="flex justify-between font-body text-muted-foreground">
          <span>Moms (8%)</span>
          <span>{getTax().toFixed(2)} kr</span>
        </div>
        <div className="flex justify-between font-heading font-bold text-lg text-foreground border-t border-border pt-2">
          <span>Totalt</span>
          <span>{getTotal().toFixed(2)} kr</span>
        </div>

        <div className="flex justify-between pt-4 gap-4">
          <button
            onClick={() => navigate("/tillval")}
            className="flex-1 bg-secondary text-secondary-foreground font-heading font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            + Tillval
          </button>
          <button
            onClick={() => navigate("/betalning")}
            className="flex-1 bg-tertiary text-tertiary-foreground font-heading font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
          >
            Betala →
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderOverviewPage;
