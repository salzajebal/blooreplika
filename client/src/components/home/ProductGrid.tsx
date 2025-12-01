import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Product, Category } from "@shared/schema";

const DEFAULT_CATEGORIES = [
  { id: "gold_bar", name: "골드바" },
  { id: "silver_bar", name: "실버바" },
  { id: "baby_ring", name: "돌반지/돌팔찌" },
  { id: "jewelry", name: "순금제품" },
  { id: "diamond", name: "다이아몬드" },
  { id: "corporate", name: "기업선물" },
  { id: "gift_gold", name: "순금기념품" },
  { id: "event", name: "이벤트" },
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=500&h=500&fit=crop";

export function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

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
    <section className="py-16">
      {/* Category Tabs */}
      <div className="mb-10">
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button 
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-6 py-3 rounded-full text-sm font-bold transition-all border",
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
                "px-6 py-3 rounded-full text-sm font-bold transition-all border",
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

      {/* Header for selected category */}
      <div className="flex justify-between items-end mb-8 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {activeCategory === "all" ? "전체 상품" : DEFAULT_CATEGORIES.find(c => c.id === activeCategory)?.name}
          </h2>
          <p className="text-gray-500 text-sm">
            한국공인금거래소가 보증하는 정품 {activeCategory === "all" ? "귀금속" : DEFAULT_CATEGORIES.find(c => c.id === activeCategory)?.name} 모음
          </p>
        </div>
        <div className="text-sm text-gray-500">
          총 <span className="font-bold text-primary" data-testid="text-product-count">{filteredProducts.length}</span>개의 상품이 있습니다.
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="text-gray-500">상품을 불러오는 중...</div>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div 
              key={product.id} 
              className="group bg-white border border-gray-100 hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative flex flex-col"
              data-testid={`card-product-${product.id}`}
            >
              {/* Image Container */}
              <div className="aspect-square bg-gray-50 p-8 relative overflow-hidden">
                <img 
                  src={product.imageUrl || DEFAULT_IMAGE} 
                  alt={product.name} 
                  className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                
                {/* Badges */}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isBest && (
                    <span className="bg-gray-900 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider inline-block text-center">
                      Best
                    </span>
                  )}
                  {product.isNew && (
                    <span className="bg-red-600 text-white text-[10px] px-2 py-1 font-bold uppercase tracking-wider inline-block text-center">
                      New
                    </span>
                  )}
                </div>
                
                {/* Hover Actions */}
                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex gap-2 justify-center bg-white/90 backdrop-blur-sm border-t border-gray-100">
                  <Button size="icon" variant="outline" className="h-9 w-9 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="outline" className="h-9 w-9 rounded-full hover:bg-primary hover:text-white hover:border-primary transition-colors">
                    <ShoppingCart className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-4 text-center flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{product.purity} / {product.weight}</div>
                  <h3 className="font-bold text-gray-900 mb-3 group-hover:text-primary transition-colors line-clamp-2 h-10 flex items-center justify-center text-sm">
                    {product.name}
                  </h3>
                </div>
                
                <div className="pt-3 border-t border-dashed border-gray-100 w-full">
                  <div className="flex justify-center items-baseline gap-1">
                    <span className="text-lg font-bold text-primary">{product.price}</span>
                    <span className="text-xs text-gray-500">원</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center bg-gray-50 border border-dashed border-gray-200 rounded-lg">
          <p className="text-gray-500 mb-4">해당 카테고리에 등록된 상품이 없습니다.</p>
          <p className="text-sm text-gray-400">관리자 페이지에서 상품을 추가해주세요.</p>
          <a href="/admin" className="inline-block mt-4 text-primary hover:underline text-sm">
            관리자 페이지 바로가기 →
          </a>
        </div>
      )}
      
      {/* Pagination (Visual only) */}
      {filteredProducts.length > 0 && (
        <div className="mt-12 flex justify-center gap-2">
          <Button variant="outline" size="icon" className="w-8 h-8" disabled>
            &lt;
          </Button>
          <Button variant="default" size="icon" className="w-8 h-8 bg-primary hover:bg-primary/90 text-white border-none">
            1
          </Button>
          <Button variant="outline" size="icon" className="w-8 h-8 hover:bg-gray-50">
            2
          </Button>
          <Button variant="outline" size="icon" className="w-8 h-8 hover:bg-gray-50">
            3
          </Button>
          <Button variant="outline" size="icon" className="w-8 h-8 hover:bg-gray-50">
            &gt;
          </Button>
        </div>
      )}
    </section>
  );
}
