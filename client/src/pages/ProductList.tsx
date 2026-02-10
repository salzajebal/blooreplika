import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Package, Star, Grid, List, ChevronDown, Filter, X, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRoute, Link, useLocation } from "wouter";
import { useState, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSale } from "@/hooks/use-global-sale";
import { cn } from "@/lib/utils";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";


function ProductSkeleton() {
  return (
    <div className="bg-white border border-gray-100 animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-3">
        <div className="h-3 bg-gray-200 rounded w-16 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-full mb-2" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-5 bg-gray-200 rounded w-24" />
      </div>
    </div>
  );
}

const CATEGORIES = [
  { id: "new-arrivals", name: "신상품", slug: "new-arrivals" },
  { id: "men", name: "남성", slug: "men" },
  { id: "women", name: "여성", slug: "women" },
  { id: "clothing", name: "의류", slug: "clothing" },
  { id: "bags", name: "가방", slug: "bags" },
  { id: "wallets", name: "지갑", slug: "wallets" },
  { id: "shoes", name: "신발", slug: "shoes" },
  { id: "golf", name: "골프", slug: "golf" },
  { id: "jewelry", name: "쥬얼리/잡화", slug: "jewelry" },
  { id: "sameday", name: "당일배송", slug: "sameday" },
  { id: "sale", name: "할인상품", slug: "sale" },
  { id: "best", name: "베스트상품", slug: "best" },
];

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

export default function ProductList() {
  const [match, params] = useRoute("/products/:category");
  const [location] = useLocation();
  const categorySlug = match ? params.category : "all";
  const [brands, setBrands] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { salePercent, calculateSalePrice, hasSale } = useGlobalSale();
  const isInitialMount = useRef(true);
  const isBrandInitial = useRef(true);
  const isRestoringScroll = useRef(false);

  const categoryInfo = CATEGORIES.find(c => c.slug === categorySlug);
  
  // Parse search params - compute synchronously using useMemo
  const { searchQuery, subcategoryId } = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return {
      searchQuery: params.get("q"),
      subcategoryId: params.get("sub")
    };
  }, [location]);

  const handleWishlistToggle = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    const productId = String(product.id);
    const wasInWishlist = isInWishlist(productId);
    // Use discounted price if product has discount or global sale is active
    let finalPrice = Number(product.price);
    if (product.discountPercent && product.discountPercent > 0) {
      finalPrice = Math.round(finalPrice * (100 - product.discountPercent) / 100 / 1000) * 1000;
    } else if (hasSale) {
      finalPrice = calculateSalePrice(finalPrice);
    }
    toggleItem({
      id: productId,
      name: product.name,
      price: finalPrice,
      imageUrl: product.imageUrl || undefined,
    });
    toast({
      title: wasInWishlist ? "찜 목록에서 삭제" : "찜 목록에 추가",
      description: wasInWishlist 
        ? `${product.name}이(가) 삭제되었습니다.` 
        : `${product.name}이(가) 찜 목록에 추가되었습니다.`,
    });
  };

  const savedListPage = parseInt(sessionStorage.getItem("productListPage") || "1");
  const savedListCategory = sessionStorage.getItem("productListCategory") || "";
  const [currentPage, setCurrentPage] = useState(
    savedListCategory === categorySlug ? savedListPage : 1
  );
  const ITEMS_PER_PAGE = 16;
  const queryClient = useQueryClient();

  const fetchProducts = async (page: number, query?: string, brandIdFilter?: string | null) => {
    const offset = (page - 1) * ITEMS_PER_PAGE;
    const categoryParam = categorySlug && categorySlug !== "all" ? `&categoryId=${categorySlug}` : "";
    const subcategoryParam = subcategoryId ? `&subcategoryId=${subcategoryId}` : "";
    const searchParam = query ? `&search=${encodeURIComponent(query)}` : "";
    const brandParam = brandIdFilter ? `&brandId=${encodeURIComponent(brandIdFilter)}` : "";
    const res = await fetch(`/api/products?limit=${ITEMS_PER_PAGE}&offset=${offset}${categoryParam}${subcategoryParam}${searchParam}${brandParam}`);
    const data = await res.json();
    return data;
  };

  const { data: productsData, isLoading: loading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['products', categorySlug, subcategoryId, currentPage, searchQuery, selectedBrand],
    queryFn: () => fetchProducts(currentPage, searchQuery || undefined, selectedBrand),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });

  // Load brands separately with longer cache (10 minutes)
  const { data: brandsData } = useQuery({
    queryKey: ['brands', categorySlug],
    queryFn: async () => {
      const categoryParam = categorySlug && categorySlug !== "all" ? `?categoryId=${categorySlug}` : "";
      const res = await fetch(`/api/brands${categoryParam}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000, // 10 minutes
  });

  const products = productsData?.success ? productsData.data : [];
  const total = productsData?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const showLoadingOverlay = isFetching && products.length > 0;

  useEffect(() => {
    if (brandsData) {
      setBrands(brandsData);
    }
  }, [brandsData]);

  useEffect(() => {
    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ['products', categorySlug, subcategoryId, currentPage + 1, searchQuery, selectedBrand],
        queryFn: () => fetchProducts(currentPage + 1, searchQuery || undefined, selectedBrand),
        staleTime: 30000,
      });
    }
  }, [currentPage, totalPages, categorySlug, subcategoryId, searchQuery, selectedBrand, queryClient]);

  useEffect(() => {
    const savedScroll = sessionStorage.getItem("productListScroll");
    if (savedScroll && savedListCategory === categorySlug) {
      isRestoringScroll.current = true;
    }
    
    const handleScroll = () => {
      if (!isRestoringScroll.current) {
        sessionStorage.setItem("productListScroll", String(window.scrollY));
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!loading && isRestoringScroll.current) {
      const savedScroll = parseInt(sessionStorage.getItem("productListScroll") || "0");
      if (savedScroll > 0) {
        requestAnimationFrame(() => {
          window.scrollTo(0, savedScroll);
          isRestoringScroll.current = false;
        });
      } else {
        isRestoringScroll.current = false;
      }
    }
  }, [loading]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      sessionStorage.setItem("productListCategory", categorySlug || "");
      return;
    }
    setCurrentPage(1);
    setSelectedBrand(null);
    sessionStorage.setItem("productListPage", "1");
    sessionStorage.setItem("productListScroll", "0");
    sessionStorage.setItem("productListCategory", categorySlug || "");
  }, [categorySlug, subcategoryId, searchQuery]);

  useEffect(() => {
    if (isBrandInitial.current) {
      isBrandInitial.current = false;
      return;
    }
    setCurrentPage(1);
    sessionStorage.setItem("productListPage", "1");
  }, [selectedBrand]);

  useEffect(() => {
    sessionStorage.setItem("productListPage", String(currentPage));
  }, [currentPage]);

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

  const brandsWithProducts = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase().trim();
    return brands.filter((b: any) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    
    // Brand and search are now handled server-side, only sort client-side
    
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
  }, [products, sortBy]);

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
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
            <input
              type="text"
              placeholder="브랜드 검색..."
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-black"
              data-testid="input-brand-search"
            />
          </div>
          <ul className="space-y-2 max-h-[400px] overflow-y-auto">
            {!brandSearch && (
              <li>
                <button 
                  onClick={() => setSelectedBrand(null)}
                  className={cn("text-sm hover:text-black transition-colors text-left", !selectedBrand ? "font-bold text-black" : "text-gray-500")}
                  data-testid="button-brand-all"
                >
                  전체
                </button>
              </li>
            )}
            {brandsWithProducts.map(brand => (
              <li key={brand.id}>
                <button 
                  onClick={() => { setSelectedBrand(brand.id); setBrandSearch(""); }}
                  className={cn("text-sm hover:text-black transition-colors text-left flex items-center gap-1", selectedBrand === brand.id ? "font-bold text-black" : "text-gray-500")}
                  data-testid={`button-brand-${brand.id}`}
                >
                  {brand.name}
                  {brand.productCount > 0 && (
                    <span className="text-xs text-gray-400">({brand.productCount})</span>
                  )}
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
          
          {brands.length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-gray-500 mb-2 font-medium">브랜드</p>
              {brands.length > 10 && (
                <div className="relative mb-2">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                  <input
                    type="text"
                    placeholder="브랜드 검색..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full pl-7 pr-2 py-1.5 text-[10px] border rounded focus:outline-none focus:ring-1 focus:ring-black"
                    data-testid="input-brand-search-mobile"
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {!brandSearch && (
                  <button 
                    onClick={() => setSelectedBrand(null)}
                    className={cn(
                      "px-2.5 py-1 text-[10px] rounded-full border transition-colors",
                      !selectedBrand 
                        ? "bg-gray-800 text-white border-gray-800" 
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-800"
                    )}
                    data-testid="button-brand-all-mobile"
                  >
                    전체
                  </button>
                )}
                {brandsWithProducts.slice(0, brandSearch ? 50 : 20).map(brand => (
                  <button 
                    key={brand.id}
                    onClick={() => { setSelectedBrand(brand.id); setBrandSearch(""); }}
                    className={cn(
                      "px-2.5 py-1 text-[10px] rounded-full border transition-colors",
                      selectedBrand === brand.id 
                        ? "bg-gray-800 text-white border-gray-800" 
                        : "bg-white text-gray-600 border-gray-300 hover:border-gray-800"
                    )}
                    data-testid={`button-brand-mobile-${brand.id}`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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

            {loading && !products.length ? (
              <div className={cn(
                "gap-4 md:gap-6",
                viewMode === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4" 
                  : "flex flex-col"
              )}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
              {showLoadingOverlay && (
                <div className="flex items-center justify-center py-2 mb-4">
                  <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                  <span className="text-sm text-gray-500">불러오는 중...</span>
                </div>
              )}
              <div className={cn(
                "gap-4 md:gap-6",
                viewMode === "grid" 
                  ? "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4" 
                  : "flex flex-col",
                showLoadingOverlay && "opacity-60 pointer-events-none"
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
                          loading="lazy"
                          decoding="async"
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
                        {brands.find(b => b.id === product.brandId)?.name?.toUpperCase() || ""}
                      </p>
                      <h3 className={cn(
                        "font-medium text-sm mb-2 group-hover:text-gray-600 transition-colors",
                        viewMode === "grid" && "line-clamp-2"
                      )}>
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        {(product.discountPercent && product.discountPercent > 0) ? (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              {Number(product.price).toLocaleString()}원
                            </span>
                            <span className="font-bold text-red-500" data-testid={`price-product-${product.id}`}>
                              {(Math.round(Number(product.price) * (100 - product.discountPercent) / 100 / 1000) * 1000).toLocaleString()}원
                            </span>
                            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">
                              {product.discountPercent}%
                            </span>
                          </>
                        ) : hasSale ? (
                          <>
                            <span className="text-xs text-gray-400 line-through">
                              {Number(product.price).toLocaleString()}원
                            </span>
                            <span className="font-bold text-red-500" data-testid={`price-product-${product.id}`}>
                              {calculateSalePrice(Number(product.price)).toLocaleString()}원
                            </span>
                            <span className="text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">
                              {salePercent}%
                            </span>
                          </>
                        ) : (
                          <>
                            {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                              <span className="text-xs text-gray-400 line-through">
                                {Number(product.originalPrice).toLocaleString()}원
                              </span>
                            )}
                            <span className="font-bold" data-testid={`price-product-${product.id}`}>
                              {Number(product.price).toLocaleString()}원
                            </span>
                          </>
                        )}
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
