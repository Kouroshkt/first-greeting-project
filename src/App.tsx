import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import StartPage from "./pages/StartPage";
import MenuPage from "./pages/MenuPage";
import AddOnsPage from "./pages/AddOnsPage";
import OrderOverviewPage from "./pages/OrderOverviewPage";
import PaymentPage from "./pages/PaymentPage";
import KDSPage from "./pages/KDSPage";
import GuestDisplayPage from "./pages/GuestDisplayPage";
import CounterDisplayPage from "./pages/CounterDisplayPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<StartPage />} />
          <Route path="/meny" element={<MenuPage />} />
          <Route path="/tillval" element={<AddOnsPage />} />
          <Route path="/oversikt" element={<OrderOverviewPage />} />
          <Route path="/betalning" element={<PaymentPage />} />
          <Route path="/kds" element={<KDSPage />} />
          <Route path="/status" element={<GuestDisplayPage />} />
          <Route path="/lucka" element={<CounterDisplayPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
