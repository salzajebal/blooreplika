import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Package, Star, Grid, List, ChevronDown, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useRoute, Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const CATEGORIES = [
  { id: "outer", name: "아우터", slug: "outer" },
  { id: "padding", name: "패딩", slug: "padding" },
  { id: "tops", name: "상의", slug: "tops" },
  { id: "bottoms", name: "하의", slug: "bottoms" },
  { id: "shoes", name: "신발", slug: "shoes" },
  { id: "accessories", name: "악세사리", slug: "accessories" },
  { id: "wallets", name: "지갑", slug: "wallets" },
  { id: "bags", name: "가방", slug: "bags" },
  { id: "watches", name: "시계", slug: "watches" },
  { id: "genuine", name: "정품", slug: "genuine" },
];

const extractBrandFromName = (name: string): string => {
  const brandKeywords = [
    "페레가모", "마르니", "마놀로블라닉", "마놀로 블라닉", "어그", "마린세르",
    "지미추", "지미 추", "티파니", "반클리프", "불가리", "크롬하츠", "베르사체",
    "발렌티노", "톰포드", "막스마라", "아크네", "스튜디오", "아미", "메종키츠네",
    "골든구스", "꼼데가르송", "이자벨마랑", "알렉산더맥퀸", "알렉산더 맥퀸",
    "자크뮈스", "보테가", "끌로에", "클로에", "지방시", "오프화이트", "릭오웬스",
    "베트멍", "마르지엘라", "메종마르지엘라", "아미리", "팜엔젤스", "스톤아일랜드",
    "무스너클", "캐나다구스", "파라점퍼스", "듀베티카", "타티아스", "헤르노",
    "막스마라", "아크네스튜디오", "톰브라운", "살로몬", "뉴발란스", "아디다스", "나이키"
  ];
  
  for (const brand of brandKeywords) {
    if (name.toLowerCase().includes(brand.toLowerCase())) {
      return brand.toUpperCase();
    }
  }
  
  const firstWord = name.split(' ')[0];
  if (firstWord && firstWord.length >= 2 && firstWord.length <= 10) {
    return firstWord.toUpperCase();
  }
  
  return "";
};

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

export default function ProductList() {
  const [match, params] = useRoute("/products/:category");
  const [location] = useLocation();
  const categorySlug = match ? params.category : "all";
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();

  const categoryInfo = CATEGORIES.find(c => c.slug === categorySlug);
  const searchParams = new URLSearchParams(location.split("?")[1] || "");
  const searchQuery = searchParams.get("q");

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const productId = String(product.id);
    const wasInWishlist = isInWishlist(productId);
    toggleItem({
      id: productId,
      name: product.name,
      price: Number(product.price),
      imageUrl: product.imageUrl || undefined,
    });
    toast({
      title: wasInWishlist ? "찜 목록에서 삭제" : "찜 목록에 추가",
      description: wasInWishlist 
        ? `${product.name}이(가) 삭제되었습니다.` 
        : `${product.name}이(가) 찜 목록에 추가되었습니다.`,
    });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const ITEMS_PER_PAGE = 60;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useEffect(() => {
    let cancelled = false;
    
    const fetchData = async () => {
      setLoading(true);
      
      try {
        const offset = (currentPage - 1) * ITEMS_PER_PAGE;
        const categoryParam = categorySlug && categorySlug !== "all" ? `&categoryId=${categorySlug}` : "";
        const [productsRes, brandsRes] = await Promise.all([
          fetch(`/api/products?limit=${ITEMS_PER_PAGE}&offset=${offset}${categoryParam}`),
          fetch("/api/brands")
        ]);
        
        if (cancelled) return;
        
        const productsData = await productsRes.json();
        const brandsData = await brandsRes.json();
        
        if (productsData.success) {
          setProducts(productsData.data);
          setTotal(productsData.total || 0);
        }
        if (brandsData.success) {
          setBrands(brandsData.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => { cancelled = true; };
  }, [categorySlug, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [categorySlug]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
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

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Category filtering is now done on the API level
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }
    
    if (selectedBrand) {
      result = result.filter(p => p.brandId === selectedBrand);
    }
    
    switch (sortBy) {
      case "newest":
        result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "price_asc":
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price_desc":
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "popular":
        result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
    }
    
    return result;
  }, [products, searchQuery, selectedBrand, sortBy]);

  const FilterSidebar = () => (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-sm mb-3">카테고리</h3>
        <ul className="space-y-2">
          <li>
            <Link 
              href="/products" 
              className={cn("text-sm hover:text-black transition-colors", !categorySlug || categorySlug === "all" ? "font-bold text-black" : "text-gray-500")}
            >
              전체보기
            </Link>
          </li>
          {CATEGORIES.map(cat => (
            <li key={cat.slug}>
              <Link 
                href={`/products/${cat.slug}`} 
                className={cn("text-sm hover:text-black transition-colors", categorySlug === cat.slug ? "font-bold text-black" : "text-gray-500")}
              >
                {cat.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      
      {brands.length > 0 && (
        <div>
          <h3 className="font-bold text-sm mb-3">브랜드</h3>
          <ul className="space-y-2">
            <li>
              <button 
                onClick={() => setSelectedBrand(null)}
                className={cn("text-sm hover:text-black transition-colors text-left", !selectedBrand ? "font-bold text-black" : "text-gray-500")}
              >
                전체
              </button>
            </li>
            {brands.map(brand => (
              <li key={brand.id}>
                <button 
                  onClick={() => setSelectedBrand(brand.id)}
                  className={cn("text-sm hover:text-black transition-colors text-left", selectedBrand === brand.id ? "font-bold text-black" : "text-gray-500")}
                >
                  {brand.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold" data-testid="text-category-title">
            {searchQuery ? `"${searchQuery}" 검색 결과` : categoryInfo?.name || "전체 상품"}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {searchQuery 
              ? `${filteredProducts.length}개의 상품을 찾았습니다.` 
              : categoryInfo 
                ? `${categoryInfo.name} 카테고리의 최신 상품을 만나보세요.` 
                : "모든 카테고리의 상품을 둘러보세요."
            }
          </p>
        </div>

        <div className="lg:hidden mb-4">
          <div className="flex flex-wrap gap-1.5 border-b pb-3">
            <Link 
              href="/products"
              className={cn(
                "px-2.5 py-1.5 text-xs rounded-full border transition-colors",
                !categorySlug || categorySlug === "all" 
                  ? "bg-black text-white border-black" 
                  : "bg-white text-gray-600 border-gray-300 hover:border-black"
              )}
            >
              전체
            </Link>
            {CATEGORIES.map(cat => (
              <Link 
                key={cat.slug}
                href={`/products/${cat.slug}`}
                className={cn(
                  "px-2.5 py-1.5 text-xs rounded-full border transition-colors",
                  categorySlug === cat.slug 
                    ? "bg-black text-white border-black" 
                    : "bg-white text-gray-600 border-gray-300 hover:border-black"
                )}
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex gap-8">
          <aside className="hidden lg:block w-48 flex-shrink-0">
            <FilterSidebar />
          </aside>

          <div className="flex-1">
            <div className="hidden lg:flex flex-wrap gap-1.5 mb-4">
              <Link 
                href="/products"
                className={cn(
                  "px-3 py-1.5 text-xs rounded-full border transition-colors",
                  !categorySlug || categorySlug === "all" 
                    ? "bg-black text-white border-black" 
                    : "bg-white text-gray-600 border-gray-300 hover:border-black"
                )}
              >
                전체
              </Link>
              {CATEGORIES.map(cat => (
                <Link 
                  key={cat.slug}
                  href={`/products/${cat.slug}`}
                  className={cn(
                    "px-3 py-1.5 text-xs rounded-full border transition-colors",
                    categorySlug === cat.slug 
                      ? "bg-black text-white border-black" 
                      : "bg-white text-gray-600 border-gray-300 hover:border-black"
                  )}
                >
                  {cat.name}
                </Link>
              ))}
            </div>

            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                  총 <span className="font-bold text-black" data-testid="text-product-count">{total.toLocaleString()}</span>개
                  {totalPages > 1 && (
                    <span className="ml-1 text-gray-400">(페이지 {currentPage}/{totalPages})</span>
                  )}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="text-sm border rounded-md px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-black"
                  data-testid="select-sort"
                >
                  <option value="newest">신상품순</option>
                  <option value="price_asc">낮은가격순</option>
                  <option value="price_desc">높은가격순</option>
                  <option value="popular">인기순</option>
                </select>
                
                <div className="hidden sm:flex items-center gap-1 border rounded-md">
                  <button 
                    onClick={() => setViewMode("grid")}
                    className={cn("p-1.5", viewMode === "grid" ? "bg-black text-white" : "text-gray-400")}
                    data-testid="button-view-grid"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode("list")}
                    className={cn("p-1.5", viewMode === "list" ? "bg-black text-white" : "text-gray-400")}
                    data-testid="button-view-list"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {selectedBrand && (
              <div className="mb-4">
                <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1 text-sm">
                  <span>브랜드: {brands.find(b => b.id === selectedBrand)?.name}</span>
                  <button onClick={() => setSelectedBrand(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="py-20 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-gray-500">상품을 불러오는 중...</p>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
              <div className={cn(
                "gap-4 md:gap-6",
                viewMode === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4" 
                  : "flex flex-col"
              )}>
                {filteredProducts.map((product) => (
                  <Link 
                    key={product.id}
                    href={`/product/${product.id}`}
                    className={cn(
                      "group bg-white border border-gray-100 hover:border-gray-300 transition-all",
                      viewMode === "list" && "flex gap-4 p-4"
                    )}
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className={cn(
                      "bg-gray-50 relative overflow-hidden",
                      viewMode === "grid" ? "aspect-square" : "w-32 h-32 flex-shrink-0"
                    )}>
                      {product.imageUrl ? (
                        <img 
                          src={getProxiedImageUrl(product.imageUrl)} 
                          alt={product.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Package className="w-12 h-12" />
                        </div>
                      )}
                      
                      {product.isSoldOut && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-sm">SOLD OUT</span>
                        </div>
                      )}
                      
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.isBest && (
                          <span className="bg-black text-white text-[10px] px-2 py-0.5 font-medium">BEST</span>
                        )}
                        {product.isNew && (
                          <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 font-medium">NEW</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={(e) => handleWishlistToggle(e, product)}
                        className={cn(
                          "absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity",
                          isInWishlist(String(product.id)) && "opacity-100"
                        )}
                        data-testid={`button-wishlist-${product.id}`}
                      >
                        <Heart className={cn("w-4 h-4", isInWishlist(String(product.id)) && "fill-red-500 text-red-500")} />
                      </button>
                    </div>
                    
                    <div className={cn(
                      viewMode === "grid" ? "p-3" : "flex-1 flex flex-col justify-center"
                    )}>
                      <p className="text-[11px] md:text-xs text-gray-500 mb-1 font-medium tracking-wide">
                        {brands.find(b => b.id === product.brandId)?.name?.toUpperCase() || extractBrandFromName(product.name)}
                      </p>
                      <h3 className={cn(
                        "font-medium text-sm mb-2 group-hover:text-gray-600 transition-colors",
                        viewMode === "grid" && "line-clamp-2"
                      )}>
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                          <span className="text-xs text-gray-400 line-through">
                            {Number(product.originalPrice).toLocaleString()}원
                          </span>
                        )}
                        <span className="font-bold" data-testid={`price-product-${product.id}`}>
                          {Number(product.price).toLocaleString()}원
                        </span>
                      </div>
                      {(product.reviewCount || 0) > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          <span>{Number(product.avgRating || 0).toFixed(1)}</span>
                          <span>({product.reviewCount})</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-9 w-9"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {getPageNumbers().map((page, idx) => (
                    typeof page === 'number' ? (
                      <Button
                        key={idx}
                        variant={currentPage === page ? "default" : "outline"}
                        onClick={() => goToPage(page)}
                        className="h-9 w-9 p-0"
                        data-testid={`button-page-${page}`}
                      >
                        {page}
                      </Button>
                    ) : (
                      <span key={idx} className="px-2 text-gray-400">...</span>
                    )
                  ))}
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-9 w-9"
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  
                  <span className="ml-4 text-sm text-gray-500">
                    {total.toLocaleString()}개 상품
                  </span>
                </div>
              )}
            </>
            ) : (
              <div className="py-20 text-center">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-2">상품이 없습니다.</p>
                <p className="text-sm text-gray-400">
                  {searchQuery ? "다른 검색어로 검색해보세요." : "다른 카테고리를 확인해보세요."}
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
