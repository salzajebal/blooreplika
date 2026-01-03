import { useState, useEffect } from "react";

let cachedSalePercent: number | null = null;
let fetchPromise: Promise<number> | null = null;

export function useGlobalSale() {
  const [salePercent, setSalePercent] = useState<number>(cachedSalePercent ?? 0);
  const [loading, setLoading] = useState(cachedSalePercent === null);

  useEffect(() => {
    if (cachedSalePercent !== null) {
      setSalePercent(cachedSalePercent);
      setLoading(false);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch("/api/settings/global_sale_percent")
        .then(res => res.json())
        .then(data => {
          const percent = data.success && data.data ? parseInt(data.data.value) || 0 : 0;
          cachedSalePercent = percent;
          return percent;
        })
        .catch(() => {
          cachedSalePercent = 0;
          return 0;
        });
    }

    fetchPromise.then(percent => {
      setSalePercent(percent);
      setLoading(false);
    });
  }, []);

  const calculateSalePrice = (originalPrice: number): number => {
    if (salePercent <= 0) return originalPrice;
    return Math.floor(originalPrice * (1 - salePercent / 100));
  };

  const hasSale = salePercent > 0;

  return { salePercent, loading, calculateSalePrice, hasSale };
}

export function invalidateGlobalSaleCache() {
  cachedSalePercent = null;
  fetchPromise = null;
}
