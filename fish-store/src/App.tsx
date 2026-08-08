import { useState } from "react";
import { CartProvider } from "./hooks/useCart";
import { Header } from "./components/Header";
import { CategoryNav } from "./components/CategoryNav";
import { Hero } from "./components/Hero";
import { ProductGrid } from "./components/ProductGrid";
import { Footer } from "./components/Footer";
import { CartDrawer } from "./components/cart/CartDrawer";
import { CheckoutPage } from "./components/checkout/CheckoutPage";

type View = "store" | "checkout";

export default function App() {
  const [view, setView] = useState<View>("store");

  return (
    <CartProvider>
      <div className="min-h-screen bg-[var(--page)]">
        {view === "store" ? (
          <>
            <Header />
            <CategoryNav />
            <main>
              <Hero />
              <ProductGrid />
            </main>
            <Footer />
          </>
        ) : (
          <CheckoutPage onBack={() => setView("store")} />
        )}
        <CartDrawer onCheckout={() => setView("checkout")} />
      </div>
    </CartProvider>
  );
}
