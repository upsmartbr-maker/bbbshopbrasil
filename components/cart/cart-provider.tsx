"use client";

import * as React from "react";
import {
  calculateEstimatedShipping,
  FREE_SHIPPING_THRESHOLD,
  type CartItem,
} from "@/types/cart";

const STORAGE_KEY = "bbb_cart_v1";
const CEP_STORAGE_KEY = "bbb_cart_cep_v1";

export interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  freeShippingRemaining: number;
  cep: string;
  isOpen: boolean;
  hydrated: boolean;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  setCep: (cep: string) => void;
  clear: () => void;
  open: () => void;
  close: () => void;
}

const CartContext = React.createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<CartItem[]>([]);
  const [cep, setCepState] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setItems(parsed);
      }
      const savedCep = localStorage.getItem(CEP_STORAGE_KEY);
      if (savedCep) setCepState(savedCep);
    } catch {
      /* storage indisponível */
    }
    setHydrated(true);
  }, []);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, hydrated]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CEP_STORAGE_KEY, cep);
    } catch {
      /* ignore */
    }
  }, [cep, hydrated]);

  const addItem = React.useCallback<CartContextValue["addItem"]>((item, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  }, []);

  const setQuantity = React.useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => (i.productId === productId ? { ...i, quantity } : i))
    );
  }, []);

  const removeItem = React.useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const setCep = React.useCallback((nextCep: string) => {
    const digits = nextCep.replace(/\D/g, "").slice(0, 8);
    const formatted =
      digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
    setCepState(formatted);
  }, []);

  const value = React.useMemo<CartContextValue>(() => {
    const count = items.reduce((n, i) => n + i.quantity, 0);
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const shipping = calculateEstimatedShipping(subtotal, cep);
    const total = subtotal + shipping;
    const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

    return {
      items,
      count,
      subtotal,
      shipping,
      total,
      freeShippingRemaining,
      cep,
      isOpen,
      hydrated,
      addItem,
      setQuantity,
      removeItem,
      setCep,
      clear: () => setItems([]),
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
    };
  }, [items, cep, isOpen, hydrated, addItem, setQuantity, removeItem, setCep]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = React.useContext(CartContext);
  if (!ctx) throw new Error("useCart deve ser usado dentro de <CartProvider>.");
  return ctx;
}
