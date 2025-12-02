import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";

export interface WishlistItem {
  id: number;
  name: string;
  price: string;
  imageUrl: string | null;
  weight?: string | null;
  purity?: string | null;
}

interface WishlistContextType {
  items: WishlistItem[];
  count: number;
  addItem: (item: WishlistItem) => void;
  removeItem: (id: number) => void;
  toggleItem: (item: WishlistItem) => void;
  isInWishlist: (id: number) => boolean;
  clearWishlist: () => void;
}

const WISHLIST_KEY = "kaggold_wishlist";

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

  const saveToStorage = useCallback((newItems: WishlistItem[]) => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(newItems));
    setItems(newItems);
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

  const removeItem = useCallback((id: number) => {
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

  const isInWishlist = useCallback((id: number) => {
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
      clearWishlist,
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
