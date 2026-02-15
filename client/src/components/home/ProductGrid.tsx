import { Button } from "@/components/ui/button";
import { Heart, Loader2, ChevronLeft, ChevronRight, ShoppingBag, Eye } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { Link } from "wouter";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSale } from "@/hooks/use-global-sale";

const DEFAULT_CATEGORIES = [
  { id: "new-arrivals", name: "신상품" },
  { id: "men", name: "남성" },
  { id: "women", name: "여성" },
  { id: "clothing", name: "의류" },
  { id: "bags", name: "가방" },
  { id: "wallets", name: "지갑" },
  { id: "shoes", name: "신발" },
  { id: "golf", name: "골프" },
  { id: "jewelry", name: "쥬얼리/잡화" },
  { id: "best", name: "베스트상품" },
];

const PRODUCTS_PER_PAGE = 40;

export function ProductGrid() {
  const savedPage = parseInt(sessionStorage.getItem("productGridPage") || "1");
  const savedCategory = sessionStorage.getItem("productGridCategory") || "all";
  const [activeCategory, setActiveCategory] = useState(savedCategory);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(savedPage);
  const isInitialMount = useRef(true);
  const isPageChangeByUser = useRef(false);
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { salePercent, calculateSalePrice, hasSale } = useGlobalSale();

  const totalPages = Math.ceil(totalCount / PRODUCTS_PER_PAGE);

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const wasInWishlist = isInWishlist(product.id);
    const finalPrice = hasSale ? calculateSalePrice(product.price) : product.price;
    toggleItem({
      id: product.id,
      name: product.name,
      price: finalPrice,
      imageUrl: product.imageUrl,
    });
    toast({
      title: wasInWishlist ? "관심상품 삭제" : "관심상품 등록",
      description: wasInWishlist 
        ? `${product.name} 삭제되었습니다.` 
        : `${product.name} 등록되었습니다.`,
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
    if (isInitialMount.current) {
      isInitialMount.current = false;
      sessionStorage.setItem("productGridCategory", activeCategory);
      fetchProducts(currentPage);
      return;
    }
    isPageChangeByUser.current = true;
    setCurrentPage(1);
    sessionStorage.setItem("productGridPage", "1");
    sessionStorage.setItem("productGridCategory", activeCategory);
    fetchProducts(1);
  }, [activeCategory]);

  useEffect(() => {
    if (isInitialMount.current) return;
    sessionStorage.setItem("productGridPage", String(currentPage));
    fetchProducts(currentPage);
    if (isPageChangeByUser.current) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      isPageChangeByUser.current = false;
    }
  }, [currentPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      isPageChangeByUser.current = true;
      setCurrentPage(page);
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <section className="py-8 md:py-12">
      <div className="mb-8">
        <div className="flex flex-wrap justify-center gap-2.5 mb-8 px-1">
          <button 
            onClick={() => setActiveCategory("all")}
            className={cn(
              "px-5 md:px-7 py-2.5 md:py-3 text-sm font-medium transition-all border rounded-full",
              activeCategory === "all" 
                ? "bg-black text-white border-black" 
                : "bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black"
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
                "px-5 md:px-7 py-2.5 md:py-3 text-sm font-medium transition-all border rounded-full",
                activeCategory === cat.id 
                  ? "bg-black text-white border-black" 
                  : "bg-white text-gray-600 border-gray-200 hover:border-black hover:text-black"
              )}
              data-testid={`button-category-${cat.id}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-end mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            {activeCategory === "all" ? "전체 상품" : DEFAULT_CATEGORIES.find(c => c.id === activeCategory)?.name}
          </h2>
        </div>
        <div className="text-sm text-gray-500">
          총 <span className="font-bold text-black" data-testid="text-product-count">{totalCount.toLocaleString()}</span>개
          {totalPages > 1 && (
            <span className="ml-2">
              ({currentPage} / {totalPages})
            </span>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gray-400" />
          <div className="text-gray-500 text-sm">상품을 불러오는 중...</div>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
          {products.map((product) => (
            <Link 
              key={product.id} 
              href={`/product/${product.id}`}
              className="group bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
              data-testid={`card-product-${product.id}`}
            >
              <div className="aspect-square bg-gray-50 relative overflow-hidden">
                <img 
                  src={getProxiedImageUrl(product.imageUrl, "medium")} 
                  alt={product.name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                />
                
                {product.isSoldOut && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <span className="text-white text-sm font-bold px-4 py-1.5 bg-black/60">SOLD OUT</span>
                  </div>
                )}
                <div className="absolute top-2 left-2 flex flex-col gap-1">
                  {product.isBest && (
                    <span className="bg-black text-white text-[10px] px-2.5 py-1 font-bold">BEST</span>
                  )}
                  {product.isNew && (
                    <span className="bg-red-500 text-white text-[10px] px-2.5 py-1 font-bold">NEW</span>
                  )}
                </div>
                
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className={cn(
                      "w-9 h-9 flex items-center justify-center shadow-sm bg-white rounded-sm",
                      isInWishlist(product.id) && "opacity-100"
                    )} 
                    onClick={(e) => handleWishlistToggle(e, product)}
                    data-testid={`button-wishlist-${product.id}`}
                  >
                    <Heart className={cn("w-4.5 h-4.5", isInWishlist(product.id) ? "fill-red-500 text-red-500" : "text-gray-400")} />
                  </button>
                  <button 
                    className="w-9 h-9 bg-white flex items-center justify-center text-gray-400 hover:text-gray-600 shadow-sm rounded-sm"
                    onClick={(e) => {
                      e.preventDefault();
                      handleWishlistToggle(e, product);
                    }}
                    data-testid={`button-cart-${product.id}`}
                  >
                    <ShoppingBag className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-medium">
                  {product.brandId || "BRAND"}
                </p>
                <h3 className="text-sm md:text-base text-gray-800 line-clamp-2 mb-2.5 leading-snug flex-1">
                  {product.name}
                </h3>
                
                <div className="pt-2.5 border-t border-gray-100">
                  {hasSale ? (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-gray-400 line-through">
                          {product.price.toLocaleString()}원
                        </span>
                        <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 font-bold">
                          {salePercent}%
                        </span>
                      </div>
                      <span className="text-base md:text-lg font-extrabold text-red-500" data-testid={`price-product-${product.id}`}>
                        {calculateSalePrice(product.price).toLocaleString()}원
                      </span>
                      <p className="text-xs text-gray-400 mt-1">즉시구매가</p>
                    </div>
                  ) : (
                    <div>
                      {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                        <p className="text-xs text-gray-400 mb-1">
                          매장가 <span className="line-through">{Number(product.originalPrice).toLocaleString()}원</span>
                        </p>
                      )}
                      <span className="text-base md:text-lg font-extrabold text-gray-900" data-testid={`price-product-${product.id}`}>
                        {product.price.toLocaleString()}원
                      </span>
                      <p className="text-xs text-gray-400 mt-1">즉시구매가</p>
                    </div>
                  )}
                </div>
                {(product as any).viewCount > 0 && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>조회 {(product as any).viewCount}</span>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-gray-50">
          <p className="text-gray-500 mb-3 text-sm">해당 카테고리에 등록된 상품이 없습니다.</p>
          <p className="text-xs text-gray-400">관리자 페이지에서 상품을 추가해주세요.</p>
          <a href="/admin" className="inline-block mt-3 text-black hover:underline text-xs font-medium">
            관리자 페이지 바로가기 →
          </a>
        </div>
      )}
      
      {totalPages > 1 && !loading && (
        <div className="mt-8 flex justify-center items-center gap-1">
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
                  "h-9 w-9 text-sm",
                  currentPage === page && "bg-black text-white hover:bg-gray-800"
                )}
                data-testid={`button-page-${page}`}
              >
                {page}
              </Button>
            ) : (
              <span key={index} className="px-1.5 text-gray-400 text-sm">...</span>
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
