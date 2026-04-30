import { useNavigate } from "react-router-dom";
import { useOrderStore } from "@/store/orderStore";
import logo from "@/assets/butcher-burgers-logo.png";
import dineInImg from "@/assets/dine-in.png";
import takeAwayImg from "@/assets/take-away.png";

const StartPage = () => {
  const navigate = useNavigate();
  const setOrderType = useOrderStore((s) => s.setOrderType);

  const handleChoice = (type: "dine-in" | "take-away") => {
    setOrderType(type);
    navigate("/meny");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-between py-12 px-6">
      {/* Logo */}
      <div className="flex-1 flex items-center justify-center">
        <img
          src={logo}
          alt="Butcher Burgers logotyp"
          className="w-64 h-auto"
          width={800}
          height={512}
        />
      </div>

      {/* Order Type Buttons */}
      <div className="flex gap-8 mb-12">
        <button
          onClick={() => handleChoice("dine-in")}
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
          onClick={() => handleChoice("take-away")}
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

      {/* Demo navigation - all views on one screen */}
      <div className="flex gap-3 mb-6">
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

      {/* Language Selector */}
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
