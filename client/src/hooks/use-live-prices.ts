import { useState, useEffect } from "react";

interface PriceData {
  buyPrice: string;
  sellPrice: string;
  trend: string;
  change: string;
}

interface PriceResponse {
  gold: PriceData;
  silver: PriceData;
  platinum: PriceData;
}

export function useLivePrices() {
  const [prices, setPrices] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();
        if (data.success) {
          setPrices(data.data);
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  const parseWeight = (weight: string): number => {
    const match = weight.match(/([\d.]+)\s*g/i);
    if (match) {
      return parseFloat(match[1]);
    }
    const ctMatch = weight.match(/([\d.]+)\s*ct/i);
    if (ctMatch) {
      return 0;
    }
    return 0;
  };

  const calculateProductPrice = (
    category: string,
    weight: string
  ): string | null => {
    if (!prices) return null;

    const weightInGrams = parseWeight(weight);
    if (weightInGrams === 0) return null;

    const dons = weightInGrams / 3.75;

    let pricePerDon = 0;

    if (category === "gold_bar" || category === "jewelry" || category === "baby_ring" || category === "gift_gold" || category === "corporate") {
      const goldPrice = parseInt(prices.gold.buyPrice.replace(/,/g, ""), 10);
      pricePerDon = goldPrice;
    } else if (category === "silver_bar") {
      const silverPrice = parseInt(prices.silver.buyPrice.replace(/,/g, ""), 10);
      pricePerDon = silverPrice;
    } else if (category === "platinum") {
      const platinumPrice = parseInt(prices.platinum.buyPrice.replace(/,/g, ""), 10);
      pricePerDon = platinumPrice;
    } else {
      return null;
    }

    const totalPrice = Math.round(pricePerDon * dons);
    return totalPrice.toLocaleString();
  };

  return {
    prices,
    loading,
    calculateProductPrice,
  };
}
