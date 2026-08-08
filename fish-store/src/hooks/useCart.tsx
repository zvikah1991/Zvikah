import { createContext, use, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartLine } from "../types";
import { products } from "../data/products";
import { readStorage, writeStorage } from "../lib/storage";

const CART_STORAGE_KEY = "yossi-fish:cart";

export interface CartItemView {
  productId: string;
  quantity: number;
  name: string;
  price: number;
  unit: string;
  lineTotal: number;
}

interface CartContextValue {
  lines: CartLine[];
  items: CartItemView[];
  itemCount: number;
  subtotal: number;
  addItem: (productId: string, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => readStorage(CART_STORAGE_KEY, []));
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    writeStorage(CART_STORAGE_KEY, lines);
  }, [lines]);

  const addItem = useCallback((productId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((line) => line.productId === productId);
      if (existing) {
        return prev.map((line) =>
          line.productId === productId ? { ...line, quantity: line.quantity + quantity } : line,
        );
      }
      return [...prev, { productId, quantity }];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((productId: string) => {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((line) => line.productId !== productId);
      return prev.map((line) => (line.productId === productId ? { ...line, quantity } : line));
    });
  }, []);

  const clear = useCallback(() => setLines([]), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const items = useMemo<CartItemView[]>(() => {
    return lines
      .map((line): CartItemView | null => {
        const product = products.find((p) => p.id === line.productId);
        if (!product) return null;
        return {
          productId: product.id,
          quantity: line.quantity,
          name: product.name,
          price: product.price,
          unit: product.unit,
          lineTotal: product.price * line.quantity,
        };
      })
      .filter((item): item is CartItemView => item !== null);
  }, [lines]);

  const itemCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.lineTotal, 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({ lines, items, itemCount, subtotal, addItem, removeItem, setQuantity, clear, isOpen, open, close }),
    [lines, items, itemCount, subtotal, addItem, removeItem, setQuantity, clear, isOpen, open, close],
  );

  return <CartContext value={value}>{children}</CartContext>;
}

export function useCart(): CartContextValue {
  const ctx = use(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
