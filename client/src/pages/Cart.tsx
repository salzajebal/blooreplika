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
    <div className="min-h-screen bg-white font-sans">
      <Header />

      <main className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-cart-title">찜 목록</h1>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">찜한 상품이 없습니다</p>
              <p className="text-gray-400 text-sm mb-6">하트 아이콘을 눌러 마음에 드는 상품을 담아보세요</p>
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90">
                  쇼핑 계속하기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <p className="text-gray-600">
                  총 <span className="font-bold text-primary">{items.length}</span>개의 상품
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    clearWishlist();
                    toast({ title: "전체 삭제 완료", description: "찜 목록이 비워졌습니다." });
                  }}
                  data-testid="button-clear-cart"
                >
                  전체 삭제
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <Link href={`/product/${item.id}`}>
                      <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={getProxiedImageUrl(item.imageUrl) || DEFAULT_IMAGE} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = DEFAULT_IMAGE;
                          }}
                        />
                      </div>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <Link href={`/product/${item.id}`}>
                          <h3 className="font-bold text-gray-900 hover:text-primary transition-colors line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(item.id, item.name)}
                          className="text-gray-400 hover:text-red-500 shrink-0 -mt-1 -mr-2"
                          data-testid={`button-remove-${item.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="mt-1">
                        <span className="text-lg font-bold text-primary">{item.price.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">원</span>
                      </div>
                      {productOptionsMap[item.id]?.categoryId !== 'watches' && (
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {(productOptionsMap[item.id]?.sizes?.length ?? 0) > 0 ? (
                          <select
                            value={itemOptions[item.id]?.size || ""}
                            onChange={(e) => updateItemOption(item.id, "size", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
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
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary"
                            data-testid={`input-size-${item.id}`}
                          />
                        )}
                        {(productOptionsMap[item.id]?.colors?.length ?? 0) > 0 ? (
                          <select
                            value={itemOptions[item.id]?.color || ""}
                            onChange={(e) => updateItemOption(item.id, "color", e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary bg-white"
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
                            className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-primary"
                            data-testid={`input-color-${item.id}`}
                          />
                        )}
                      </div>
                      )}
                      <div className="mt-3">
                        <Button
                          className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold px-6 py-2 h-10 text-sm rounded-lg shadow-sm"
                          onClick={() => {
                            const params = new URLSearchParams();
                            if (itemOptions[item.id]?.size) params.append("size", itemOptions[item.id].size);
                            if (itemOptions[item.id]?.color) params.append("color", itemOptions[item.id].color);
                            const queryString = params.toString();
                            const orderPath = `/order/${item.id}${queryString ? "?" + queryString : ""}`;
                            setLocation(orderPath);
                          }}
                          data-testid={`button-buy-${item.id}`}
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          구매하기
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">총 상품 금액</span>
                  <span className="text-2xl font-bold text-primary">
                    {totalPrice.toLocaleString()}원
                  </span>
                </div>
                <Button 
                  className="w-full bg-gray-900 hover:bg-gray-800 h-14 text-lg font-bold shadow-lg rounded-lg"
                  onClick={handleCheckout}
                  data-testid="button-checkout"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  전체 구매하기 ({items.length}개)
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
