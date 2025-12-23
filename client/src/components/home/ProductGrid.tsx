import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useLivePrices } from "@/hooks/use-live-prices";

const DEFAULT_CATEGORIES = [
  { id: "gold_bar", name: "골드바" },
  { id: "silver_bar", name: "실버바" },
  { id: "baby_ring", name: "돌선물" },
  { id: "jewelry", name: "순금기념품" },
  { id: "pure_jewelry", name: "순금주얼리" },
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=500&h=500&fit=crop";

export function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { calculateProductPrice } = useLivePrices();

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = isInWishlist(product.id);
    toggleItem({
      id: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl,
      weight: product.weight,
      purity: product.purity,
    });
    toast({
      title: wasInWishlist ? "찜 목록에서 삭제" : "찜 목록에 추가",
      description: wasInWishlist 
        ? `${product.name}이(가) 삭제되었습니다.` 
        : `${product.name}이(가) 찜 목록에 추가되었습니다.`,
    });
  };

  const fetchProducts = async () => {
    try {
      const url = activeCategory === "all" 
        ? "/api/products" 
        : `/api/products?category=${activeCategory}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [activeCategory]);

  const filteredProducts = products;

  return (
    <section className="py-8 sm:py-12 md:py-16">
      <div className="mb-6 sm:mb-8 md:mb-10">
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 px-1">
          <button 
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full text-xs sm:text-sm font-bold transition-all border touch-manipulation",
              activeCategory === "all" 
                ? "bg-primary text-white border-primary shadow-md" 
                : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
            )}
            data-testid="button-category-all"
          >
            전체보기
          </button>
          {DEFAULT_CATEGORIES.map((cat) => (
            <button 
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-full text-xs sm:text-sm font-bold transition-all border touch-manipulation",
                activeCategory === cat.id 
                  ? "bg-primary text-white border-primary shadow-md" 
                  : "bg-white text-gray-600 border-gray-200 hover:border-primary hover:text-primary"
              )}
              data-testid={`button-category-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-2 sm:gap-4 mb-6 sm:mb-8 pb-3 sm:pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">
            {activeCategory === "all" ? "전체 상품" : DEFAULT_CATEGORIES.find(c => c.id === activeCategory)?.name}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm break-keep">
            한국골드금거래소가 보증하는 정품 {activeCategory === "all" ? "귀금속" : DEFAULT_CATEGORIES.find(c => c.id === activeCategory)?.name} 모음
          </p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          총 <span className="font-bold text-primary" data-testid="text-product-count">{filteredProducts.length}</span>개의 상품
        </div>
      </div>

      {loading ? (
        <div className="py-12 sm:py-20 text-center">
          <div className="text-gray-500 text-sm">상품을 불러오는 중...</div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.id}`}
              className="group bg-white border border-gray-100 hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative flex flex-col cursor-pointer rounded-lg overflow-hidden"
              data-testid={`card-product-${product.id}`}
            >
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img 
                  src={product.imageUrl || DEFAULT_IMAGE} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                
                <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 flex flex-col gap-0.5 sm:gap-1">
                  {product.isBest && (
                    <span className="bg-gray-900 text-white text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold uppercase tracking-wider inline-block text-center">
                      Best
                    </span>
                  )}
                  {product.isNew && (
                    <span className="bg-red-600 text-white text-[8px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 sm:py-1 font-bold uppercase tracking-wider inline-block text-center">
                      New
                    </span>
                  )}
                </div>
                
                <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-1.5 sm:gap-2 justify-center bg-white/90 backdrop-blur-sm border-t border-gray-100">
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className={cn(
                      "h-7 w-7 sm:h-9 sm:w-9 rounded-full transition-colors",
                      isInWishlist(product.id) 
                        ? "bg-primary text-white border-primary" 
                        : "hover:bg-primary hover:text-white hover:border-primary"
                    )} 
                    onClick={(e) => handleWishlistToggle(e, product)}
                    data-testid={`button-wishlist-${product.id}`}
                  >
                    <Heart className={cn("w-3 h-3 sm:w-4 sm:h-4", isInWishlist(product.id) && "fill-current")} />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-7 w-7 sm:h-9 sm:w-9 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors" 
                    onClick={(e) => {
                      e.preventDefault();
                      handleWishlistToggle(e, product);
                    }}
                    data-testid={`button-cart-${product.id}`}
                  >
                    <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="p-2 sm:p-3 md:p-4 text-center flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1">{product.purity} / {product.weight}</div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 h-8 sm:h-10 flex items-center justify-center text-xs sm:text-sm">
                    {product.name}
                  </h3>
                </div>
                
                <div className="pt-2 sm:pt-3 border-t border-dashed border-gray-100 w-full mt-1 sm:mt-2">
                  <div className="flex justify-center items-baseline gap-0.5 sm:gap-1">
                    <span className="text-sm sm:text-base md:text-lg font-bold text-primary" data-testid={`price-product-${product.id}`}>
                      {product.price && product.price !== "시세 적용" && product.price !== "0" 
                        ? product.price 
                        : (calculateProductPrice(product.category, product.weight) || product.price)}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500">원</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-12 sm:py-20 text-center bg-gray-50 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-3 sm:mb-4 text-sm">해당 카테고리에 등록된 상품이 없습니다.</p>
          <p className="text-xs sm:text-sm text-gray-400">관리자 페이지에서 상품을 추가해주세요.</p>
          <a href="/admin" className="inline-block mt-3 sm:mt-4 text-primary hover:underline text-xs sm:text-sm">
            관리자 페이지 바로가기 →
          </a>
        </div>
      )}
      
    </section>
  );
}
