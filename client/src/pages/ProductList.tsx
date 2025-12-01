import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart } from "lucide-react";
import { useRoute } from "wouter";
import { useState, useEffect } from "react";
import type { Product } from "@shared/schema";

const DEFAULT_CATEGORIES = [
  { id: "gold_bar", name: "골드바", description: "한국공인금거래소가 보증하는 최고 품질의 순금 바" },
  { id: "silver_bar", name: "실버바", description: "투자 가치가 높은 고순도 실버바 컬렉션" },
  { id: "baby_ring", name: "돌반지/돌팔찌", description: "소중한 아이의 첫 생일을 축하하는 순금 선물" },
  { id: "jewelry", name: "순금제품", description: "품격 있는 디자인의 고순도 순금 주얼리" },
  { id: "diamond", name: "다이아몬드", description: "영원히 변치 않는 가치, 최상급 다이아몬드" },
  { id: "corporate", name: "기업선물", description: "임직원 및 VIP를 위한 품격 있는 기업 전용 선물" },
  { id: "gift_gold", name: "순금기념품", description: "특별한 날을 기념하는 소장가치 높은 순금 기념품" },
  { id: "event", name: "이벤트", description: "한국공인금거래소의 특별한 혜택과 기획 상품" },
];

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=500&h=500&fit=crop";

export default function ProductList() {
  const [match, params] = useRoute("/products/:category");
  const categoryId = match ? params.category : "all";
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  const categoryInfo = DEFAULT_CATEGORIES.find(c => c.id === categoryId) || { name: "전체 상품 목록", description: "한국공인금거래소가 보증하는 최고의 품질" };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const url = categoryId === "all" 
          ? "/api/products" 
          : `/api/products?category=${categoryId}`;
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
    
    setLoading(true);
    fetchProducts();
  }, [categoryId]);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      
      <main className="container-custom py-12">
        {/* Category Title Banner */}
        <div className="bg-gray-50 p-8 mb-12 text-center border-b border-gray-100">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="text-category-title">{categoryInfo.name}</h1>
          <p className="text-gray-500">
             {categoryId === "all" ? "한국공인금거래소가 보증하는 최고의 품질" : `한국공인금거래소의 고품격 ${categoryInfo.name} 컬렉션`}
          </p>
        </div>
        
        {/* Filter Bar (Simplified) */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100">
          <div className="text-sm text-gray-500">
            총 <span className="font-bold text-primary" data-testid="text-product-count">{products.length}</span>개의 상품이 있습니다.
          </div>
          <div className="flex gap-2 text-sm">
            <select className="border border-gray-200 rounded-none px-3 py-1.5 focus:outline-none focus:border-primary">
              <option>신상품순</option>
              <option>낮은가격순</option>
              <option>높은가격순</option>
              <option>인기상품순</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-gray-500">상품을 불러오는 중...</p>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {products.map((product) => (
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
      </main>
      
      <Footer />
    </div>
  );
}
