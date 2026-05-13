import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Trash2, Heart, ShoppingBag, ArrowRight, ShoppingCart } from "lucide-react";
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
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
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
    setItemOptions((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId] || { size: "", color: "" }, [field]: value },
    }));
  };

  const handleCheckout = () => {
    const itemsWithOptions = items.map((item) => ({
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
    toast({ title: "삭제 완료", description: `${name}이(가) 찜 목록에서 삭제되었습니다.` });
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-[640px] w-full mx-auto px-4 pb-32 md:pb-10">
        {/* Page title */}
        <div className="flex items-center justify-between py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#FF6100]" />
            <h1 className="text-base font-bold text-gray-900" data-testid="text-cart-title">
              찜 목록 / 장바구니
            </h1>
            {items.length > 0 && (
              <span className="text-xs text-gray-400 font-medium">{items.length}개</span>
            )}
          </div>
          {items.length > 0 && (
            <button
              onClick={() => { clearWishlist(); toast({ title: "전체 삭제 완료" }); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              data-testid="button-clear-cart"
            >
              전체 삭제
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <Heart className="w-9 h-9 text-gray-200" />
            </div>
            <p className="text-gray-700 font-medium mb-1">찜한 상품이 없습니다</p>
            <p className="text-gray-400 text-sm mb-8">
              하트 아이콘을 눌러 마음에 드는 상품을 담아보세요
            </p>
            <Link href="/products">
              <button className="flex items-center gap-2 px-7 py-3 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-colors">
                SHOP NOW
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          </div>
        ) : (
          <>
            {/* Item list */}
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 py-4"
                  data-testid={`cart-item-${item.id}`}
                >
                  {/* Thumbnail */}
                  <Link href={`/product/${item.id}`} className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                      <img
                        src={getProxiedImageUrl(item.imageUrl) || DEFAULT_IMAGE}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                      />
                    </div>
                  </Link>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <Link href={`/product/${item.id}`}>
                        <h3 className="text-sm font-medium text-gray-800 hover:text-black line-clamp-2 leading-snug">
                          {item.name}
                        </h3>
                      </Link>
                      <button
                        onClick={() => handleRemove(item.id, item.name)}
                        className="text-gray-300 hover:text-gray-500 flex-shrink-0 transition-colors mt-0.5"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-base font-bold text-gray-900 mb-2">
                      {item.price.toLocaleString()}원
                    </p>

                    {/* Options */}
                    {productOptionsMap[item.id]?.categoryId !== "watches" && (
                      <div className="flex gap-2 mb-2.5">
                        {(productOptionsMap[item.id]?.sizes?.length ?? 0) > 0 ? (
                          <select
                            value={itemOptions[item.id]?.size || ""}
                            onChange={(e) => updateItemOption(item.id, "size", e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 bg-white text-gray-600 rounded-lg focus:outline-none focus:border-gray-400"
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
                            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
                            data-testid={`input-size-${item.id}`}
                          />
                        )}
                        {(productOptionsMap[item.id]?.colors?.length ?? 0) > 0 ? (
                          <select
                            value={itemOptions[item.id]?.color || ""}
                            onChange={(e) => updateItemOption(item.id, "color", e.target.value)}
                            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 bg-white text-gray-600 rounded-lg focus:outline-none focus:border-gray-400"
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
                            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
                            data-testid={`input-color-${item.id}`}
                          />
                        )}
                      </div>
                    )}

                    {/* Individual buy button */}
                    <button
                      className="flex items-center gap-1.5 px-4 py-2 bg-black text-white text-xs font-semibold rounded-lg hover:bg-gray-800 transition-colors"
                      onClick={() => {
                        const params = new URLSearchParams();
                        if (itemOptions[item.id]?.size) params.append("size", itemOptions[item.id].size);
                        if (itemOptions[item.id]?.color) params.append("color", itemOptions[item.id].color);
                        const qs = params.toString();
                        setLocation(`/order/${item.id}${qs ? "?" + qs : ""}`);
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

            {/* Total + Bulk checkout */}
            <div className="fixed bottom-14 md:bottom-0 left-0 right-0 z-40 max-w-[640px] mx-auto bg-white border-t border-gray-200"
              style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
              <div className="px-4 py-3 flex items-center justify-between border-b border-gray-100">
                <span className="text-sm text-gray-500">
                  총 <span className="font-bold text-gray-900">{items.length}</span>개 합계
                </span>
                <span className="text-lg font-bold text-gray-900">
                  {totalPrice.toLocaleString()}원
                </span>
              </div>
              <div className="px-4 py-3">
                <button
                  className="w-full bg-[#FF6100] hover:bg-orange-600 text-white py-4 text-sm font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                  onClick={handleCheckout}
                  data-testid="button-checkout"
                >
                  <ShoppingBag className="w-4 h-4" />
                  전체 구매하기 ({items.length}개)
                </button>
              </div>
            </div>
          </>
        )}
      </main>

      <div className="max-w-[640px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
}
