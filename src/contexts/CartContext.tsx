import React, { createContext, useContext, useState, useCallback } from "react";
import { salePrice } from "@/lib/utils";
import type { Product } from "@/types/supabase";

export interface CartItem {
  product: Product;
  quantity: number;
  customization?: {
    text: string;
    color: string;
    font: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, customization?: CartItem["customization"]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
  coupon: string;
  setCoupon: (c: string) => void;
  discount: number;
  applyCoupon: () => void;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);

  const addItem = useCallback((product: Product, quantity = 1, customization?: CartItem["customization"]) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity, customization }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(0);
    setCoupon("");
  }, []);

  const applyCoupon = useCallback(() => {
    if (coupon.toUpperCase() === "ADESIL10") {
      setDiscount(10);
    } else if (coupon.toUpperCase() === "FRETE") {
      setDiscount(15);
    } else {
      setDiscount(0);
    }
  }, [coupon]);

  const total = items.reduce((sum, i) => sum + salePrice(i.product) * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount, coupon, setCoupon, discount, applyCoupon }}
    >
      {children}
    </CartContext.Provider>
  );
};
