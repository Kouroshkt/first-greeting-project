import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderStore } from "@/store/orderStore";
import {
  menuItems,
  categories,
  CUSTOMIZABLE_CATEGORIES,
  type Allergen,
  type MenuItem,
} from "@/data/menuData";
import CustomizationModal from "@/components/CustomizationModal";
import logo from "@/assets/butcher-burgers-logo.png";

const allergenLabels: Allergen[] = ["Gluten", "Laktos", "Vegetariskt"];

const MenuPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>("hamburgare");
  const { addToCart, cart } = useOrderStore();
  const [modalItem, setModalItem] = useState<MenuItem | null>(null);

  const filteredItems = menuItems.filter(
    (item) => item.category === activeCategory
  );

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleItemClick = (item: MenuItem) => {
    if (CUSTOMIZABLE_CATEGORIES.includes(item.category)) {
      setModalItem(item);
    } else {
      addToCart(item);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-card shadow-sm">
        <button onClick={() => navigate("/")} className="hover:opacity-80">
          <img src={logo} alt="Butcher Burgers" className="h-12 w-auto" />
        </button>
        <button
          onClick={() => navigate("/oversikt")}
          className="relative bg-primary text-primary-foreground font-heading font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Varukorg
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-tertiary text-tertiary-foreground text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full">
              {cartCount}
            </span>
          )}
        </button>
      </div>

      {/* Categories */}
      <div className="flex gap-3 px-6 py-4 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-body font-medium text-sm whitespace-nowrap transition-all ${
              activeCategory === cat.id
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-card text-foreground hover:bg-muted"
            }`}
          >
            <span>{cat.emoji}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="flex-1 px-6 py-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all hover:scale-[1.02] text-left"
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
                <p className="font-body text-muted-foreground text-xs mt-1 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="font-heading font-bold text-lg text-foreground">
                    {item.price} kr
                  </span>
                  <div className="flex gap-1">
                    {allergenLabels.map((a) =>
                      item.allergens.includes(a) ? (
                        <span
                          key={a}
                          className="text-[10px] font-body bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded"
                        >
                          {a}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom nav */}
      <div className="flex justify-between px-6 py-4 bg-card shadow-inner">
        <button
          onClick={() => navigate("/")}
          className="font-body text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Tillbaka
        </button>
        <button
          onClick={() => navigate("/oversikt")}
          className="bg-tertiary text-tertiary-foreground font-heading font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Till varukorg →
        </button>
      </div>

      <CustomizationModal
        item={modalItem}
        open={modalItem !== null}
        onOpenChange={(open) => !open && setModalItem(null)}
        onConfirm={(item, customizations) => addToCart(item, customizations)}
      />
    </div>
  );
};

export default MenuPage;
