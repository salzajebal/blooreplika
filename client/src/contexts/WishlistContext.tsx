import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  imageUrl?: string | null;
  sourceIdx?: number | null;
}

interface WishlistContextType {
  items: WishlistItem[];
  count: number;
  addItem: (item: WishlistItem) => void;
  removeItem: (id: string) => void;
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (id: string) => boolean;
  clearWishlist: () => void;
}

const WISHLIST_KEY = "cdamdong_wishlist";

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(WISHLIST_KEY);
    if (stored) {
      try {
        setItems(JSON.parse(stored));
      } catch {
        setItems([]);
      }
    }
  }, []);

  const addItem = useCallback((item: WishlistItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) return prev;
      const newItems = [...prev, item];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => {
      const newItems = prev.filter(i => i.id !== id);
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const toggleItem = useCallback((item: WishlistItem) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      const newItems = exists ? prev.filter(i => i.id !== item.id) : [...prev, item];
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(newItems));
      return newItems;
    });
  }, []);

  const isInWishlist = useCallback((id: string) => {
    return items.some(i => i.id === id);
  }, [items]);

  const clearWishlist = useCallback(() => {
    localStorage.removeItem(WISHLIST_KEY);
    setItems([]);
  }, []);

  return (
    <WishlistContext.Provider value={{
      items,
      count: items.length,
      addItem,
      removeItem,
      toggleItem,
      isInWishlist,
      clearWishlist
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
