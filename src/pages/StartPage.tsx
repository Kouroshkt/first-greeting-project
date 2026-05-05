import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrderStore, type Concept } from "@/store/orderStore";
import { CONCEPTS } from "@/data/menuRegistry";
import dineInImg from "@/assets/dine-in.png";
import takeAwayImg from "@/assets/take-away.png";

const StartPage = () => {
  const navigate = useNavigate();
  const setOrderType = useOrderStore((s) => s.setOrderType);
  const setConcept = useOrderStore((s) => s.setConcept);
  const clearCart = useOrderStore((s) => s.clearCart);

  // Steg 1: välj koncept (BB eller FS), steg 2: välj ordertyp
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);

  const handleConceptChoice = (concept: Concept) => {
    clearCart();
    setConcept(concept);
    setSelectedConcept(concept);
  };

  const handleOrderTypeChoice = (type: "dine-in" | "take-away") => {
    setOrderType(type);
    navigate("/meny");
  };

  // ---- Steg 1: Restaurangval ----
  if (!selectedConcept) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-between py-12 px-6">
        <div className="flex-1 flex flex-col items-center justify-center gap-8">
          <h1 className="font-heading text-3xl font-bold text-foreground text-center">
            Välj restaurang
          </h1>

          <div className="flex flex-col sm:flex-row gap-8">
            {(Object.values(CONCEPTS)).map((c) => (
              <button
                key={c.id}
                onClick={() => handleConceptChoice(c.id)}
                className="flex flex-col items-center gap-4 bg-card rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 w-64"
                aria-label={`Välj ${c.name}`}
              >
                <img
                  src={c.logo}
                  alt={`${c.name} logotyp`}
                  className="w-40 h-40 object-contain"
                  width={800}
                  height={512}
                />
                <span className="font-heading text-xl font-bold text-foreground">
                  {c.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo navigation */}
        <div className="flex gap-3 mb-6 flex-wrap justify-center">
          <button
            onClick={() => navigate("/kds")}
            className="px-4 py-2 bg-card rounded-lg shadow text-sm font-body font-medium text-foreground hover:shadow-md"
          >
            🍳 KDS
          </button>
          <button
            onClick={() => navigate("/status")}
            className="px-4 py-2 bg-card rounded-lg shadow text-sm font-body font-medium text-foreground hover:shadow-md"
          >
            📺 Gästdisplay
          </button>
          <button
            onClick={() => navigate("/lucka")}
            className="px-4 py-2 bg-card rounded-lg shadow text-sm font-body font-medium text-foreground hover:shadow-md"
          >
            📋 Luckdisplay
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="px-4 py-2 bg-card rounded-lg shadow text-sm font-body font-medium text-foreground hover:shadow-md"
          >
            📊 Admin
          </button>
        </div>
      </div>
    );
  }

  // ---- Steg 2: Äta här / Ta med ----
  const concept = CONCEPTS[selectedConcept];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between py-12 px-6">
      <div className="flex-1 flex items-center justify-center">
        <img
          src={concept.logo}
          alt={`${concept.name} logotyp`}
          className="w-64 h-auto"
          width={800}
          height={512}
        />
      </div>

      <div className="flex gap-8 mb-12">
        <button
          onClick={() => handleOrderTypeChoice("dine-in")}
          className="flex flex-col items-center gap-4 bg-primary rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 w-56"
        >
          <img
            src={dineInImg}
            alt="Äta här - bord och stol"
            className="w-32 h-32 object-contain"
            loading="lazy"
            width={512}
            height={512}
          />
          <span className="font-heading text-2xl font-bold text-primary-foreground">
            Äta här
          </span>
        </button>

        <button
          onClick={() => handleOrderTypeChoice("take-away")}
          className="flex flex-col items-center gap-4 bg-primary rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all hover:scale-105 w-56"
        >
          <img
            src={takeAwayImg}
            alt="Ta med - takeaway-påse"
            className="w-32 h-32 object-contain"
            loading="lazy"
            width={512}
            height={512}
          />
          <span className="font-heading text-2xl font-bold text-primary-foreground">
            Ta med
          </span>
        </button>
      </div>

      <button
        onClick={() => setSelectedConcept(null)}
        className="mb-6 text-sm font-body text-muted-foreground hover:text-foreground"
      >
        ← Byt restaurang
      </button>

      <div className="flex gap-6">
        <button className="flex flex-col items-center gap-2 p-3 rounded-full bg-card shadow-md hover:shadow-lg transition-shadow">
          <span className="text-3xl">🇸🇪</span>
          <span className="text-sm font-body font-medium text-foreground">SE</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-3 rounded-full bg-card shadow-md hover:shadow-lg transition-shadow">
          <span className="text-3xl">🇬🇧</span>
          <span className="text-sm font-body font-medium text-foreground">EN</span>
        </button>
      </div>
    </div>
  );
};

export default StartPage;
