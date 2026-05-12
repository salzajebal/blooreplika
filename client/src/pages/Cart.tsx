import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, Heart, ArrowRight, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";

interface ProductOptions {
  colors: string[];
  sizes: string[];
  categoryId?: string;
}

const parseProductOptions = (optionsString?: string | null): ProductOptions => {
  if (!optionsString) return { colors: [], sizes: [] };
  try {
    const parsed = JSON.parse(optionsString);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        colors: Array.isArray(parsed.colors) ? parsed.colors : [],
        sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
      };
    }
    return { colors: [], sizes: [] };
  } catch {
    return { colors: [], sizes: [] };
  }
};

export default function Cart() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [itemOptions, setItemOptions] = useState<Record<string, { size: string; color: string }>>({});
  const [productOptionsMap, setProductOptionsMap] = useState<Record<string, ProductOptions>>({});

  useEffect(() => {
    const fetchAllProductOptions = async () => {
      const map: Record<string, ProductOptions> = {};
      for (const item of items) {
        try {
          const res = await fetch(`/api/products/${item.id}`);
          const data = await res.json();
          if (data.success) {
            const opts = parseProductOptions(data.data?.options);
            opts.categoryId = data.data?.categoryId;
            map[item.id] = opts;
          }
        } catch {}
      }
      setProductOptionsMap(map);
    };
    if (items.length > 0) fetchAllProductOptions();
  }, [items.length]);

  const updateItemOption = (itemId: string, field: "size" | "color", value: string) => {
    setItemOptions(prev => ({
      ...prev,
      [itemId]: { ...prev[itemId] || { size: "", color: "" }, [field]: value },
    }));
  };

  const handleCheckout = () => {
    const itemsWithOptions = items.map(item => ({
      ...item,
      selectedSize: itemOptions[item.id]?.size || "",
      selectedColor: itemOptions[item.id]?.color || "",
    }));
    sessionStorage.setItem("cartOrderItems", JSON.stringify(itemsWithOptions));
    sessionStorage.setItem("cartPaymentMethod", "bank");
    setLocation("/order/cart");
  };

  const handleRemove = (id: string, name: string) => {
    removeItem(id);
    toast({
      title: "삭제 완료",
      description: `${name}이(가) 찜 목록에서 삭제되었습니다.`,
    });
  };

  const totalPrice = items.reduce((sum, item) => {
    return sum + (item.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-[#0f0f0f] font-sans">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-14 pb-24 md:pb-14">

        <div className="mb-8 border-b border-[#2a2a2a] pb-4">
          <div className="flex items-center gap-2 mb-1">
            <Heart className="w-4 h-4 text-[#c9a96e]" />
            <h1 className="text-xs tracking-[0.2em] uppercase text-[#888888] font-medium" data-testid="text-cart-title">Wishlist</h1>
          </div>
          <p className="text-2xl font-bold text-white">찜 목록</p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-24 bg-[#1a1a1a] border border-[#2a2a2a]">
            <Heart className="w-10 h-10 text-[#333333] mx-auto mb-4" />
            <p className="text-white font-medium mb-1">찜한 상품이 없습니다</p>
            <p className="text-[#999999] text-sm mb-8">하트 아이콘을 눌러 마음에 드는 상품을 담아보세요</p>
            <Link href="/">
              <Button className="bg-[#c9a96e] hover:bg-[#b8945f] text-black text-xs tracking-widest h-11 px-8 rounded-none">
                SHOP NOW
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-5">
              <p className="text-sm text-[#888888]">
                총 <span className="font-semibold text-white">{items.length}</span>개 상품
              </p>
              <button
                className="text-xs text-[#999999] hover:text-[#888888] underline underline-offset-2 transition-colors"
                onClick={() => {
                  clearWishlist();
                  toast({ title: "전체 삭제 완료", description: "찜 목록이 비워졌습니다." });
                }}
                data-testid="button-clear-cart"
              >
                전체 삭제
              </button>
            </div>

            <div className="space-y-px">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 sm:p-5 bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#3a3a3a] transition-all"
                  data-testid={`cart-item-${item.id}`}
                >
                  <Link href={`/product/${item.id}`} className="flex-shrink-0">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#111111] overflow-hidden">
                      <img
                        src={getProxiedImageUrl(item.imageUrl) || DEFAULT_IMAGE}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                      />
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${item.id}`}>
                        <h3 className="text-sm font-medium text-[#f0f0f0] hover:text-white transition-colors line-clamp-2 leading-snug">
                          {item.name}
                        </h3>
                      </Link>
                      <button
                        onClick={() => handleRemove(item.id, item.name)}
                        className="text-[#444444] hover:text-[#888888] shrink-0 transition-colors mt-0.5"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2 mb-3">
                      <span className="text-base font-bold text-[#c9a96e]">{item.price.toLocaleString()}원</span>
                    </div>

                    {productOptionsMap[item.id]?.categoryId !== 'watches' && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        {(productOptionsMap[item.id]?.sizes?.length ?? 0) > 0 ? (
                          <select
                            value={itemOptions[item.id]?.size || ""}
                            onChange={(e) => updateItemOption(item.id, "size", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-[#333333] bg-[#111111] text-[#aaaaaa] focus:outline-none focus:border-[#c9a96e] appearance-none cursor-pointer"
                            data-testid={`select-size-${item.id}`}
                          >
                            <option value="">사이즈 선택</option>
                            {productOptionsMap[item.id].sizes.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="사이즈"
                            value={itemOptions[item.id]?.size || ""}
                            onChange={(e) => updateItemOption(item.id, "size", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-[#333333] bg-[#111111] text-[#aaaaaa] focus:outline-none focus:border-[#c9a96e] placeholder:text-[#444444]"
                            data-testid={`input-size-${item.id}`}
                          />
                        )}
                        {(productOptionsMap[item.id]?.colors?.length ?? 0) > 0 ? (
                          <select
                            value={itemOptions[item.id]?.color || ""}
                            onChange={(e) => updateItemOption(item.id, "color", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-[#333333] bg-[#111111] text-[#aaaaaa] focus:outline-none focus:border-[#c9a96e] appearance-none cursor-pointer"
                            data-testid={`select-color-${item.id}`}
                          >
                            <option value="">색상 선택</option>
                            {productOptionsMap[item.id].colors.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            placeholder="색상"
                            value={itemOptions[item.id]?.color || ""}
                            onChange={(e) => updateItemOption(item.id, "color", e.target.value)}
                            className="w-full px-3 py-1.5 text-xs border border-[#333333] bg-[#111111] text-[#aaaaaa] focus:outline-none focus:border-[#c9a96e] placeholder:text-[#444444]"
                            data-testid={`input-color-${item.id}`}
                          />
                        )}
                      </div>
                    )}

                    <button
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#c9a96e] hover:bg-[#b8945f] text-black text-xs tracking-wider transition-colors font-semibold"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (itemOptions[item.id]?.size) params.append("size", itemOptions[item.id].size);
                        if (itemOptions[item.id]?.color) params.append("color", itemOptions[item.id].color);
                        const queryString = params.toString();
                        setLocation(`/order/${item.id}${queryString ? "?" + queryString : ""}`);
                      }}
                      data-testid={`button-buy-${item.id}`}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      구매하기
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 bg-[#1a1a1a] border border-[#2a2a2a] p-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs tracking-widest text-[#999999] uppercase">Total</span>
                <span className="text-2xl font-bold text-[#c9a96e]">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>
              <p className="text-xs text-[#999999] mb-5">총 {items.length}개 상품 합계</p>
              <button
                className="w-full bg-[#c9a96e] hover:bg-[#b8955a] text-black h-13 py-4 text-sm tracking-[0.15em] font-semibold transition-colors flex items-center justify-center gap-2"
                onClick={handleCheckout}
                data-testid="button-checkout"
              >
                <ShoppingBag className="w-4 h-4" />
                전체 구매하기 ({items.length}개)
              </button>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
