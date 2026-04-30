import { useNavigate } from "react-router-dom";
import { useOrderStore } from "@/store/orderStore";
import { addOnItems } from "@/data/menuData";
import logo from "@/assets/butcher-burgers-logo.png";

const AddOnsPage = () => {
  const navigate = useNavigate();
  const { addToCart, cart } = useOrderStore();

  const hasBaseProduct = cart.some(
    (c) => c.menuItem.category !== "dryck-tillbehor"
  );

  if (!hasBaseProduct) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 px-6">
        <img src={logo} alt="Butcher Burgers" className="h-16 w-auto" />
        <p className="font-body text-foreground text-center text-lg">
          Du måste välja minst en basprodukt (hamburgare) innan du kan lägga till
          tillval.
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

  const steps = [
    { label: "1. Välj måltid", done: true },
    { label: "2. Välj tillbehör", done: false },
    { label: "3. Välj dryck", done: false },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card shadow-sm">
        <button onClick={() => navigate("/meny")} className="hover:opacity-80">
          <img src={logo} alt="Butcher Burgers" className="h-12 w-auto" />
        </button>
        <h1 className="font-heading text-xl font-bold text-foreground">
          Komplettera din måltid
        </h1>
      </div>

      {/* Steps indicator */}
      <div className="flex gap-4 px-6 py-4">
        {steps.map((step, i) => (
          <div
            key={i}
            className={`flex-1 py-3 rounded-xl text-center font-body text-sm font-medium ${
              step.done
                ? "bg-tertiary text-tertiary-foreground"
                : i === 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {step.label}
          </div>
        ))}
      </div>

      {/* Add-on items grid */}
      <div className="flex-1 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {addOnItems.map((item) => {
            const inCart = cart.find((c) => c.menuItem.id === item.id);
            return (
              <button
                key={item.id}
                onClick={() => addToCart(item)}
                className={`bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-[1.02] text-left ${
                  inCart ? "ring-2 ring-tertiary" : ""
                }`}
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={512}
                    height={512}
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-heading font-bold text-foreground text-base">
                    {item.name}
                  </h3>
                  <p className="font-body text-muted-foreground text-xs mt-1">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-heading font-bold text-lg text-foreground">
                      {item.price} kr
                    </span>
                    {inCart && (
                      <span className="bg-tertiary text-tertiary-foreground text-xs font-bold px-2 py-1 rounded">
                        {inCart.quantity}x
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex justify-between px-6 py-4 bg-card shadow-inner">
        <button
          onClick={() => navigate("/meny")}
          className="font-body text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Tillbaka till meny
        </button>
        <button
          onClick={() => navigate("/oversikt")}
          className="bg-tertiary text-tertiary-foreground font-heading font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Till översikt →
        </button>
      </div>
    </div>
  );
};

export default AddOnsPage;
