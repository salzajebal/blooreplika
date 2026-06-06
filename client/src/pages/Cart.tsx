import { Header } from "@/components/layout/Header";
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
  sourceIdx?: number | null;
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
            opts.sourceIdx = data.data?.sourceIdx ?? null;
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
      sourceIdx: item.sourceIdx ?? productOptionsMap[item.id]?.sourceIdx ?? null,
      selectedSize: itemOptions[item.id]?.size || "",
      selectedColor: itemOptions[item.id]?.color || "",
    }));
    sessionStorage.setItem("cartOrderItems", JSON.stringify(itemsWithOptions));
    sessionStorage.setItem("cartPaymentMethod", "bank");
    setLocation("/order/cart");
  };

  const handleRemove = (id: string, name: string) => {
    removeItem(id);
    toast({ title: "삭제 완료", description: `${name}이(가) 장바구니에서 삭제되었습니다.` });
  };

  const totalPrice = items.reduce((sum, item) => sum + (item.price || 0), 0);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 md:px-6 pb-16">

        {/* 제목 */}
        <div className="shop-tit flex items-center justify-between py-5 border-b border-gray-200">
          <h1 className="text-xl font-medium text-gray-900" data-testid="text-cart-title">
            장바구니{" "}
            <span className="text-xl font-medium text-gray-900">{items.length}</span>
          </h1>
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
          /* 빈 장바구니 */
          <>
            {/* 테이블 헤더 */}
            <div className="hidden md:grid grid-cols-[1fr_80px_120px_120px] border-b border-gray-200 text-xs text-gray-500 py-3 px-2">
              <span>상품 정보</span>
              <span className="text-center">수량</span>
              <span className="text-center">주문금액</span>
              <span className="text-center">배송 정보</span>
            </div>

            <div className="flex flex-col items-center justify-center py-20 text-center">
              {/* 장바구니 아이콘 */}
              <svg
                width="60"
                height="60"
                viewBox="0 0 60 60"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="mb-4 text-gray-300"
              >
                <path
                  d="M7.5 7.5H12.5L20 40H47.5L52.5 20H17.5"
                  stroke="#c8c8c8"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="22.5" cy="47.5" r="3.5" fill="#c8c8c8" />
                <circle cx="42.5" cy="47.5" r="3.5" fill="#c8c8c8" />
              </svg>
              <p className="text-gray-500 text-sm">장바구니가 비어있습니다.</p>
            </div>

            {/* 하단 */}
            <div className="flex justify-center border-t border-gray-200 pt-6">
              <Link href="/products" className="text-sm text-gray-700 underline underline-offset-2 hover:text-black transition-colors" data-testid="link-continue-shopping">
                계속 쇼핑하기
              </Link>
            </div>
          </>
        ) : (
          <>
            {/* 테이블 헤더 - 데스크탑 */}
            <div className="hidden md:grid grid-cols-[1fr_80px_120px_120px] border-b border-gray-200 text-xs text-gray-500 py-3 px-2">
              <span>상품 정보</span>
              <span className="text-center">수량</span>
              <span className="text-center">주문금액</span>
              <span className="text-center">배송 정보</span>
            </div>

            {/* 상품 목록 */}
            <div className="divide-y divide-gray-100">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="md:grid md:grid-cols-[1fr_80px_120px_120px] md:items-center py-5 px-2 flex gap-3"
                  data-testid={`cart-item-${item.id}`}
                >
                  {/* 상품 정보 */}
                  <div className="flex gap-3 items-start min-w-0">
                    <Link href={`/product/${item.id}`} className="flex-shrink-0">
                      <div className="w-[90px] h-[90px] bg-gray-50 overflow-hidden border border-gray-100">
                        <img
                          src={getProxiedImageUrl(item.imageUrl) || DEFAULT_IMAGE}
                          alt={item.name}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                      </div>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.id}`}>
                        <p className="text-sm text-gray-800 hover:text-black line-clamp-2 leading-snug mb-1">
                          {item.name}
                        </p>
                      </Link>
                      <p className="text-sm font-semibold text-gray-900 mb-2 md:hidden">
                        {item.price.toLocaleString()}원
                      </p>

                      {/* 옵션 선택 */}
                      {productOptionsMap[item.id]?.categoryId !== "watches" && (
                        <div className="flex flex-col gap-1.5 mt-1.5">
                          {(productOptionsMap[item.id]?.sizes?.length ?? 0) > 0 ? (
                            <select
                              value={itemOptions[item.id]?.size || ""}
                              onChange={(e) => updateItemOption(item.id, "size", e.target.value)}
                              className="w-full max-w-[160px] px-2 py-1 text-xs border border-gray-200 bg-white text-gray-600 focus:outline-none focus:border-gray-400"
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
                              className="w-full max-w-[160px] px-2 py-1 text-xs border border-gray-200 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                              data-testid={`input-size-${item.id}`}
                            />
                          )}
                          {(productOptionsMap[item.id]?.colors?.length ?? 0) > 0 ? (
                            <select
                              value={itemOptions[item.id]?.color || ""}
                              onChange={(e) => updateItemOption(item.id, "color", e.target.value)}
                              className="w-full max-w-[160px] px-2 py-1 text-xs border border-gray-200 bg-white text-gray-600 focus:outline-none focus:border-gray-400"
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
                              className="w-full max-w-[160px] px-2 py-1 text-xs border border-gray-200 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                              data-testid={`input-color-${item.id}`}
                            />
                          )}
                        </div>
                      )}

                      {/* 개별 구매 버튼 */}
                      <button
                        className="mt-3 px-4 py-1.5 text-xs border border-gray-800 text-gray-800 hover:bg-gray-800 hover:text-white transition-colors"
                        onClick={() => {
                          const params = new URLSearchParams();
                          if (itemOptions[item.id]?.size) params.append("size", itemOptions[item.id].size);
                          if (itemOptions[item.id]?.color) params.append("color", itemOptions[item.id].color);
                          const qs = params.toString();
                          setLocation(`/order/${item.id}${qs ? "?" + qs : ""}`);
                        }}
                        data-testid={`button-buy-${item.id}`}
                      >
                        구매하기
                      </button>

                      {/* 삭제 - 모바일 */}
                      <button
                        onClick={() => handleRemove(item.id, item.name)}
                        className="mt-1 text-xs text-gray-400 hover:text-gray-600 md:hidden"
                        data-testid={`button-remove-${item.id}`}
                      >
                        삭제
                      </button>
                    </div>
                  </div>

                  {/* 수량 - 데스크탑 */}
                  <div className="hidden md:flex flex-col items-center gap-2">
                    <span className="text-sm text-gray-700">1</span>
                    <button
                      onClick={() => handleRemove(item.id, item.name)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      data-testid={`button-remove-desktop-${item.id}`}
                    >
                      삭제
                    </button>
                  </div>

                  {/* 주문금액 - 데스크탑 */}
                  <div className="hidden md:flex flex-col items-center justify-center">
                    <span className="text-sm font-semibold text-gray-900">
                      {item.price.toLocaleString()}원
                    </span>
                  </div>

                  {/* 배송 정보 - 데스크탑 */}
                  <div className="hidden md:flex flex-col items-center justify-center">
                    <span className="text-xs text-gray-500">무료배송</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 합계 */}
            <div className="border-t border-gray-200 mt-2 py-5 flex flex-col items-end gap-1 px-2">
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span>상품 합계</span>
                <span className="font-semibold text-gray-900">{totalPrice.toLocaleString()}원</span>
              </div>
              <div className="flex items-center gap-6 text-sm text-gray-600">
                <span>배송비</span>
                <span className="text-gray-500">무료</span>
              </div>
              <div className="flex items-center gap-6 text-base font-bold text-gray-900 border-t border-gray-200 pt-3 mt-2">
                <span>총 결제금액</span>
                <span>{totalPrice.toLocaleString()}원</span>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="flex flex-col items-center gap-4 pt-2 pb-4">
              <button
                className="w-full md:w-[300px] bg-[#060133] hover:bg-[#0a0255] text-white py-4 text-sm font-medium transition-colors"
                onClick={handleCheckout}
                data-testid="button-checkout"
              >
                주문하기
              </button>
              <Link href="/products" className="text-sm text-gray-600 underline underline-offset-2 hover:text-black transition-colors" data-testid="link-continue-shopping">
                계속 쇼핑하기
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
