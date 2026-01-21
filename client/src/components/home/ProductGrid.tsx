import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Loader2, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSale } from "@/hooks/use-global-sale";

// Generate random deadline hours (1-24) based on product ID
function getRandomDeadline(productId: string): { hours: number; minutes: number } {
  let hash = 0;
  const dateKey = new Date().toDateString();
  const str = productId + dateKey;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  const hours = Math.abs(hash % 24) + 1;
  const minutes = Math.abs((hash >> 4) % 60);
  return { hours, minutes };
}

const DEFAULT_CATEGORIES = [
  { id: "outer", name: "아우터" },
  { id: "padding", name: "패딩" },
  { id: "tops", name: "상의" },
  { id: "bottoms", name: "하의" },
  { id: "bags", name: "가방" },
];

const PRODUCTS_PER_PAGE = 40;

export function ProductGrid() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { salePercent, calculateSalePrice, hasSale } = useGlobalSale();

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = isInWishlist(product.id);
    // Use discounted price if sale is active
    const finalPrice = hasSale ? calculateSalePrice(product.price) : product.price;
    toggleItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      imageUrl: product.imageUrl,
    });
    toast({
      title: wasInWishlist ? "찜 목록에서 삭제" : "찜 목록에 추가",
      description: wasInWishlist 
        ? `${product.name}이(가) 삭제되었습니다.` 
        : `${product.name}이(가) 찜 목록에 추가되었습니다.`,
    });
  };

  const fetchProducts = async (page: number) => {
    setLoading(true);
    try {
      const offset = (page - 1) * PRODUCTS_PER_PAGE;
      const url = activeCategory === "all" 
        ? `/api/products?limit=${PRODUCTS_PER_PAGE}&offset=${offset}` 
        : `/api/products?category=${activeCategory}&limit=${PRODUCTS_PER_PAGE}&offset=${offset}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setTotalCount(data.total ?? data.data.length);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
    fetchProducts(1);
  }, [activeCategory]);

  useEffect(() => {
    fetchProducts(currentPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      pages.push(totalPages);
    }
    
    return pages;
  };

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
            청담동에디션이 엄선한 프리미엄 {activeCategory === "all" ? "럭셔리 패션" : DEFAULT_CATEGORIES.find(c => c.id === activeCategory)?.name} 컬렉션
          </p>
        </div>
        <div className="text-xs sm:text-sm text-gray-500">
          총 <span className="font-bold text-primary" data-testid="text-product-count">{totalCount.toLocaleString()}</span>개
          {totalPages > 1 && (
            <span className="ml-2">
              (페이지 <span className="font-bold">{currentPage}</span> / {totalPages})
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 sm:py-20 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
          <div className="text-gray-500 text-sm">상품을 불러오는 중...</div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.id}`}
              className="group bg-white border border-gray-100 hover:border-primary/50 hover:shadow-lg transition-all duration-300 relative flex flex-col cursor-pointer rounded-lg overflow-hidden"
              data-testid={`card-product-${product.id}`}
            >
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img 
                  src={getProxiedImageUrl(product.imageUrl)} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = DEFAULT_IMAGE;
                  }}
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
              
              {/* Deadline Timer */}
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white text-center py-1.5 px-2">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-[10px] sm:text-xs font-bold">
                    마감임박 {getRandomDeadline(product.id).hours}시간 {getRandomDeadline(product.id).minutes}분 남음
                  </span>
                </div>
              </div>
              
              <div className="p-2 sm:p-3 md:p-4 text-center flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 h-8 sm:h-10 flex items-center justify-center text-xs sm:text-sm">
                    {product.name}
                  </h3>
                </div>
                
                <div className="pt-2 sm:pt-3 border-t border-dashed border-gray-100 w-full mt-1 sm:mt-2">
                  {hasSale ? (
                    <div className="flex flex-col items-center gap-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                          {product.price.toLocaleString()}원
                        </span>
                        <span className="text-[9px] sm:text-[10px] bg-red-500 text-white px-1 py-0.5 rounded font-bold">
                          {salePercent}%
                        </span>
                      </div>
                      <div className="flex justify-center items-baseline gap-0.5 sm:gap-1">
                        <span className="text-sm sm:text-base md:text-lg font-bold text-red-500" data-testid={`price-product-${product.id}`}>
                          {calculateSalePrice(product.price).toLocaleString()}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500">원</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-0.5">
                      {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                        <span className="text-[10px] sm:text-xs text-gray-400 line-through">
                          {Number(product.originalPrice).toLocaleString()}원
                        </span>
                      )}
                      <div className="flex justify-center items-baseline gap-0.5 sm:gap-1">
                        <span className="text-sm sm:text-base md:text-lg font-bold text-primary" data-testid={`price-product-${product.id}`}>
                          {product.price.toLocaleString()}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500">원</span>
                      </div>
                    </div>
                  )}
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
      
      {totalPages > 1 && !loading && (
        <div className="mt-8 flex justify-center items-center gap-1 sm:gap-2">
          <Button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            variant="outline"
            size="icon"
            className="h-9 w-9"
            data-testid="button-prev-page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {getPageNumbers().map((page, index) => (
            typeof page === 'number' ? (
              <Button
                key={index}
                onClick={() => goToPage(page)}
                variant={currentPage === page ? "default" : "outline"}
                className={cn(
                  "h-9 w-9 sm:h-10 sm:w-10",
                  currentPage === page && "bg-primary text-white"
                )}
                data-testid={`button-page-${page}`}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-2 text-gray-400">...</span>
            )
          ))}
          
          <Button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            variant="outline"
            size="icon"
            className="h-9 w-9"
            data-testid="button-next-page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
      
    </section>
  );
}
