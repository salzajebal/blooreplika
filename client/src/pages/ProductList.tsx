import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Heart, Package, Star, Grid, List, ChevronDown, Filter, X, ChevronLeft, ChevronRight, Search, Check } from "lucide-react";
import { useRoute, Link, useLocation, useSearch } from "wouter";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSale } from "@/hooks/use-global-sale";
import { cn, decodeHtml } from "@/lib/utils";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

function LazyProductImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="absolute inset-0 bg-gray-200">
      {!loaded && <div className="absolute inset-0 bg-gray-200 animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; setLoaded(true); }}
      />
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="bg-white border border-gray-200 animate-pulse">
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
  { id: "new-arrivals",  name: "신상품",     slug: "new-arrivals" },
  { id: "new",           name: "신상품",     slug: "new" },
  { id: "men",           name: "남성",       slug: "men" },
  { id: "women",         name: "여성",       slug: "women" },
  { id: "clothing",      name: "의류",       slug: "clothing" },
  { id: "bags",          name: "가방",       slug: "bags" },
  { id: "wallets",       name: "지갑",       slug: "wallets" },
  { id: "shoes",         name: "신발",       slug: "shoes" },
  { id: "golf",          name: "골프",       slug: "golf" },
  { id: "jewelry",       name: "쥬얼리/잡화", slug: "jewelry" },
  { id: "sunglasses",    name: "선글라스",   slug: "sunglasses" },
  { id: "belts",         name: "벨트",       slug: "belts" },
  { id: "watches",       name: "시계",       slug: "watches" },
  { id: "accessories",   name: "잡화",       slug: "accessories" },
  { id: "sale",          name: "할인상품",   slug: "sale" },
  { id: "discount",      name: "할인상품",   slug: "discount" },
  { id: "best",          name: "베스트상품", slug: "best" },
  { id: "sameday",       name: "당일배송",   slug: "sameday" },
];

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

type FilterDropdownType = "category" | "brand" | "gender" | null;

export default function ProductList() {
  const [match, params] = useRoute("/products/:category");
  const [location, navigate] = useLocation();
  const categorySlug = match ? params.category : "all";
  const [brands, setBrands] = useState<any[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [brandSearch, setBrandSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [openDropdown, setOpenDropdown] = useState<FilterDropdownType>(null);
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { salePercent, calculateSalePrice, hasSale } = useGlobalSale();
  const isInitialMount = useRef(true);
  const isBrandInitial = useRef(true);
  const isRestoringScroll = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevEffectiveCategoryRef = useRef<string>("all");

  const categoryInfo = CATEGORIES.find(c => c.slug === categorySlug);
  
  const searchString = useSearch();

  const { searchQuery, subcategoryId, urlBrand, activeTab, monthParam, genderParam, subnameParam, filterCategoryParam } = useMemo(() => {
    const params = new URLSearchParams(searchString);
    return {
      searchQuery: params.get("q"),
      subcategoryId: params.get("sub"),
      urlBrand: params.get("brand"),
      activeTab: params.get("tab") || "all",
      monthParam: params.get("month") || undefined,
      genderParam: params.get("gender") || undefined,
      subnameParam: params.get("subname") || undefined,
      filterCategoryParam: params.get("cat") || undefined,
    };
  }, [searchString]);

  const isGenderCategory = categorySlug === "men" || categorySlug === "women";
  const genderFromCategory = categorySlug === "men" ? "남성" : categorySlug === "women" ? "여성" : null;

  const MEN_TABS = [
    { id: "all",      name: "전체보기",    categorySlug: null },
    { id: "clothing", name: "남성의류",    categorySlug: "clothing" },
    { id: "bags",     name: "남성가방",    categorySlug: "bags" },
    { id: "wallets",  name: "지갑",        categorySlug: "wallets" },
    { id: "shoes",    name: "신발",        categorySlug: "shoes" },
    { id: "jewelry",  name: "쥬얼리/잡화", categorySlug: "jewelry" },
  ];

  const WOMEN_TABS = [
    { id: "all",      name: "전체보기",    categorySlug: null },
    { id: "clothing", name: "여성의류",    categorySlug: "clothing" },
    { id: "bags",     name: "여성가방",    categorySlug: "bags" },
    { id: "shoes",    name: "신발",        categorySlug: "shoes" },
    { id: "watches",  name: "패션시계",    categorySlug: "watches" },
    { id: "jewelry",  name: "쥬얼리/잡화", categorySlug: "jewelry" },
  ];

  const GENDER_TABS = categorySlug === "women" ? WOMEN_TABS : MEN_TABS;

  const tabCategorySlug = isGenderCategory
    ? (GENDER_TABS.find(t => t.id === activeTab)?.categorySlug ?? null)
    : null;
  const effectiveCategorySlug = isGenderCategory
    ? (tabCategorySlug || "all")
    : categorySlug;

  useEffect(() => {
    const handleClickOutside = (e: PointerEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("pointerdown", handleClickOutside);
  }, []);

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

  const fetchProducts = async (page: number, query?: string, brandIdFilter?: string | null, genderFilter?: string | null, subcatFilter?: string | null) => {
    const offset = (page - 1) * ITEMS_PER_PAGE;
    const categoryParam = effectiveCategorySlug && effectiveCategorySlug !== "all" ? `&categoryId=${effectiveCategorySlug}` : "";
    const subcategoryParam = subcatFilter ? `&subcategoryId=${subcatFilter}` : (subcategoryId ? `&subcategoryId=${subcategoryId}` : "");
    const searchParam = query ? `&search=${encodeURIComponent(query)}` : "";
    const brandParam = brandIdFilter ? `&brandId=${encodeURIComponent(brandIdFilter)}` : "";
    const effectiveGender = genderFilter !== undefined && genderFilter !== null ? genderFilter : (genderParam || genderFromCategory);
    const genderQP = effectiveGender ? `&gender=${encodeURIComponent(effectiveGender)}` : "";
    const monthQP = monthParam ? `&month=${encodeURIComponent(monthParam)}` : "";
    const subnameQP = subnameParam ? `&subname=${encodeURIComponent(subnameParam)}` : "";
    const filterCatQP = filterCategoryParam ? `&filterCategory=${encodeURIComponent(filterCategoryParam)}` : "";
    const res = await fetch(`/api/products?limit=${ITEMS_PER_PAGE}&offset=${offset}${categoryParam}${subcategoryParam}${searchParam}${brandParam}${genderQP}${monthQP}${subnameQP}${filterCatQP}`);
    const data = await res.json();
    return data;
  };

  const { data: productsData, isLoading: loading, isFetching, isPlaceholderData } = useQuery({
    queryKey: ['products', effectiveCategorySlug, subcategoryId, currentPage, searchQuery, selectedBrand, selectedGender || genderParam || genderFromCategory, selectedSubcategory, monthParam, subnameParam, filterCategoryParam],
    queryFn: () => fetchProducts(currentPage, searchQuery || undefined, selectedBrand, selectedGender, selectedSubcategory),
    placeholderData: (previousData) => previousData,
    staleTime: 30000,
  });

  const brandsCategoryParam = isGenderCategory ? categorySlug : effectiveCategorySlug;
  const { data: brandsData } = useQuery({
    queryKey: ['brands', brandsCategoryParam],
    queryFn: async () => {
      const categoryParam = brandsCategoryParam && brandsCategoryParam !== "all" ? `?categoryId=${brandsCategoryParam}` : "";
      const res = await fetch(`/api/brands${categoryParam}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000,
  });

  const effectiveGenderForSubcat = selectedGender || genderParam || genderFromCategory;
  const { data: subcategoriesData } = useQuery({
    queryKey: ['subcategories', effectiveCategorySlug, effectiveGenderForSubcat],
    queryFn: async () => {
      if (!effectiveCategorySlug || effectiveCategorySlug === "all") {
        return [];
      }
      const subcatGenderQP = effectiveGenderForSubcat ? `&gender=${encodeURIComponent(effectiveGenderForSubcat)}` : "";
      const res = await fetch(`/api/subcategories?categoryId=${effectiveCategorySlug}${subcatGenderQP}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 60000,
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
        queryKey: ['products', effectiveCategorySlug, subcategoryId, currentPage + 1, searchQuery, selectedBrand, selectedGender || genderFromCategory, selectedSubcategory],
        queryFn: () => fetchProducts(currentPage + 1, searchQuery || undefined, selectedBrand, selectedGender, selectedSubcategory),
        staleTime: 30000,
      });
    }
  }, [currentPage, totalPages, categorySlug, subcategoryId, searchQuery, selectedBrand, selectedGender, selectedSubcategory, queryClient]);

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
    setSelectedBrand(urlBrand || null);
  }, [urlBrand]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      sessionStorage.setItem("productListCategory", categorySlug || "");
      return;
    }
    setCurrentPage(1);
    setSelectedBrand(null);
    if (!isGenderCategory) {
      setSelectedGender(null);
    }
    setSelectedSubcategory(null);
    // URL의 subname 파라미터도 초기화 (카테고리 변경 시 이전 소분류 필터 제거)
    const base = location.split('?')[0];
    const p = new URLSearchParams(searchString);
    let changed = false;
    if (p.has('subname')) { p.delete('subname'); changed = true; }
    if (p.has('brand')) { p.delete('brand'); changed = true; }
    if (changed) navigate(`${base}${p.toString() ? '?' + p.toString() : ''}`);
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
  }, [selectedBrand, selectedGender, selectedSubcategory]);

  // 젠더 탭 전환 시 소분류 선택 초기화 (tabs: all→bags→clothing 등)
  useEffect(() => {
    if (prevEffectiveCategoryRef.current !== effectiveCategorySlug) {
      prevEffectiveCategoryRef.current = effectiveCategorySlug;
      setSelectedSubcategory(null);
      // subname URL 파라미터도 초기화 (카테고리 전환 시 이전 소분류 필터 제거)
      const base = location.split('?')[0];
      const p = new URLSearchParams(searchString);
      if (p.has('subname')) {
        p.delete('subname');
        navigate(`${base}${p.toString() ? '?' + p.toString() : ''}`);
      }
    }
  }, [effectiveCategorySlug]);

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
        if (isGenderCategory) {
          // 젠더 페이지: bagstyle.site 베스트 랭킹순위 (sourceIdx = 0이 1위)
          result.sort((a, b) => ((a as any).sourceIdx ?? 999) - ((b as any).sourceIdx ?? 999));
        } else {
          result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        }
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

  const subcategories = subcategoriesData || [];

  // 골프 남성(701xxx) ↔ 여성(702xxx) 서브카테고리 매핑
  const GOLF_MEN_TO_WOMEN: Record<string, string | null> = {
    '7010':   '7020',
    '701010': '702010', '701020': '702020', '701030': '702030',
    '701040': '702040', '701070': '702050', '701090': '7020b0',
    '701080': '702080', '701060': '702060',
  };
  const GOLF_WOMEN_TO_MEN: Record<string, string | null> = {
    '7020':   '7010',
    '702010': '701010', '702020': '701020', '702030': '701030',
    '702040': '701040', '702050': '701070', '7020b0': '701090',
    '702080': '701080', '702060': '701060',
    '702090': null, '7020a0': null, // 원피스/스커트 - 남성 없음
  };
  const isGolfGenderSub = (sub: string | null | undefined) =>
    !!sub && (sub.startsWith('701') || sub.startsWith('702') || sub === '7010' || sub === '7020');

  // 골프 sub 코드로부터 성별 표시 파생
  const golfSubGender = isGolfGenderSub(subcategoryId)
    ? (subcategoryId!.startsWith('701') ? '남성' : '여성')
    : null;

  const activeFiltersCount = (selectedBrand ? 1 : 0) + (selectedGender ? 1 : 0) + (golfSubGender && !selectedGender ? 1 : 0);
  const selectedBrandName = brands.find((b: any) => b.id === selectedBrand)?.name;
  const selectedSubcatName = subcategories.find((s: any) => s.id === selectedSubcategory)?.name;

  const GENDER_OPTIONS = [
    { value: null, label: "전체" },
    { value: "남성", label: "남성" },
    { value: "여성", label: "여성" },
  ];

  const toggleDropdown = useCallback((type: FilterDropdownType) => {
    setOpenDropdown(prev => prev === type ? null : type);
    setBrandSearch("");
  }, []);

  // 카테고리 소분류 드롭다운: 젠더 전체탭 or 소분류 없으면 숨김
  const showSubcatFilter = !(isGenderCategory && effectiveCategorySlug === "all");

  const FilterDropdownButtons = () => (
    <div className="flex items-center gap-2 flex-wrap" ref={dropdownRef} data-testid="filter-dropdown-buttons">
      {showSubcatFilter && subcategories.length > 0 && (() => {
        const dedupedSubcats = subcategories.filter(
          (sub: any, _idx: number, arr: any[]) => {
            const baseItem = sub.name.split('/')[0].trim();
            return arr.findIndex((s: any) => {
              const baseS = s.name.split('/')[0].trim();
              return baseS === baseItem || s.name.includes(baseItem) || sub.name.includes(baseS);
            }) === arr.indexOf(sub);
          }
        );
        const clearSubname = () => {
          const base = location.split('?')[0];
          const p = new URLSearchParams(searchString);
          p.delete('subname');
          navigate(`${base}${p.toString() ? '?' + p.toString() : ''}`);
          setOpenDropdown(null);
        };
        const setSubname = (name: string) => {
          const base = location.split('?')[0];
          const p = new URLSearchParams(searchString);
          p.set('subname', name);
          navigate(`${base}?${p.toString()}`);
          setOpenDropdown(null);
        };
        return (
          <div className="relative">
            <button
              onClick={() => toggleDropdown("category")}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-sm rounded-full border transition-colors",
                subnameParam
                  ? "bg-black text-white border-black"
                  : openDropdown === "category"
                    ? "border-black text-black"
                    : "border-gray-300 text-gray-600 hover:border-gray-500"
              )}
              data-testid="button-filter-category"
            >
              소분류
              {subnameParam && <span className="font-medium">: {subnameParam}</span>}
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openDropdown === "category" && "rotate-180")} />
            </button>

            {openDropdown === "category" && (
              <div
                className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-[200] min-w-[200px] max-h-[60vh] overflow-y-auto scroll-smooth"
                style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", scrollbarColor: "#ccc transparent", touchAction: "pan-y" }}
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
              >
                <button
                  onClick={clearSubname}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between",
                    !subnameParam && "font-bold text-black"
                  )}
                  data-testid="button-subcat-all"
                >
                  전체
                  {!subnameParam && <Check className="w-4 h-4" />}
                </button>
                {dedupedSubcats.map((sub: any) => (
                  <button
                    key={sub.slug || sub.id}
                    onClick={() => setSubname(sub.name)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between",
                      subnameParam === sub.name && "font-bold text-black"
                    )}
                    data-testid={`button-subcat-${sub.slug || sub.id}`}
                  >
                    {sub.name}
                    {subnameParam === sub.name && <Check className="w-4 h-4" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      <div className="relative">
        <button
          onClick={() => toggleDropdown("brand")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm rounded-full border transition-colors",
            selectedBrand
              ? "bg-black text-white border-black"
              : openDropdown === "brand"
                ? "border-black text-black"
                : "border-gray-300 text-gray-600 hover:border-gray-500"
          )}
          data-testid="button-filter-brand"
        >
          브랜드
          {selectedBrandName && <span className="font-medium">: {selectedBrandName}</span>}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openDropdown === "brand" && "rotate-180")} />
        </button>

        {openDropdown === "brand" && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[260px] max-h-[400px] overflow-hidden flex flex-col">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="브랜드 검색..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-1 focus:ring-black"
                  data-testid="input-brand-search"
                  autoFocus
                />
              </div>
            </div>
            <div
              className="overflow-y-auto max-h-[320px] scroll-smooth"
              style={{ overscrollBehavior: "contain", WebkitOverflowScrolling: "touch", scrollbarWidth: "thin", scrollbarColor: "#ccc transparent", touchAction: "pan-y" }}
              onTouchStart={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              {!brandSearch && (
                <button
                  onClick={() => { setSelectedBrand(null); setOpenDropdown(null); setBrandSearch(""); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between",
                    !selectedBrand && "font-bold text-black"
                  )}
                  data-testid="button-brand-all"
                >
                  전체
                  {!selectedBrand && <Check className="w-4 h-4" />}
                </button>
              )}
              {brandsWithProducts.map((brand: any) => (
                <button
                  key={brand.id}
                  onClick={() => { setSelectedBrand(brand.id); setOpenDropdown(null); setBrandSearch(""); }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between",
                    selectedBrand === brand.id && "font-bold text-black"
                  )}
                  data-testid={`button-brand-${brand.id}`}
                >
                  <span className="flex items-center gap-1">
                    {brand.name}
                    {brand.productCount > 0 && <span className="text-xs text-gray-400">({brand.productCount})</span>}
                  </span>
                  {selectedBrand === brand.id && <Check className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => toggleDropdown("gender")}
          className={cn(
            "flex items-center gap-1.5 px-4 py-2 text-sm rounded-full border transition-colors",
            (selectedGender || genderFromCategory || golfSubGender)
              ? "bg-black text-white border-black"
              : openDropdown === "gender"
                ? "border-black text-black"
                : "border-gray-300 text-gray-600 hover:border-gray-500"
          )}
          data-testid="button-filter-gender"
        >
          성별
          {(selectedGender || genderFromCategory || golfSubGender) && <span className="font-medium">: {selectedGender || genderFromCategory || golfSubGender}</span>}
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openDropdown === "gender" && "rotate-180")} />
        </button>

        {openDropdown === "gender" && (
          <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[140px]">
            {GENDER_OPTIONS.map(opt => {
              const effectiveGenderVal = selectedGender !== null ? selectedGender : (golfSubGender || genderFromCategory);
              const isActive = effectiveGenderVal === opt.value;
              return (
                <button
                  key={opt.label}
                  onClick={() => {
                    if (opt.value === null && isGenderCategory) {
                      navigate("/products");
                    } else if (isGolfGenderSub(subcategoryId)) {
                      // 골프 성별 전용 sub: URL의 sub 코드를 매핑하여 이동
                      const currentPath = location.split('?')[0];
                      const currentParams = new URLSearchParams(searchString);
                      if (opt.value === '여성') {
                        const mapped = GOLF_MEN_TO_WOMEN[subcategoryId!];
                        if (mapped !== undefined && mapped !== null) {
                          currentParams.set('sub', mapped);
                        } else {
                          currentParams.delete('sub');
                        }
                      } else if (opt.value === '남성') {
                        const mapped = GOLF_WOMEN_TO_MEN[subcategoryId!];
                        if (mapped !== undefined && mapped !== null) {
                          currentParams.set('sub', mapped);
                        } else {
                          currentParams.delete('sub');
                        }
                      } else {
                        // 전체: 현재 섹션 prefix로 이동 (701xxx→7010, 702xxx→7020)
                        if (subcategoryId!.startsWith('701')) currentParams.set('sub', '7010');
                        else if (subcategoryId!.startsWith('702')) currentParams.set('sub', '7020');
                        else currentParams.delete('sub');
                      }
                      navigate(`${currentPath}${currentParams.toString() ? '?' + currentParams.toString() : ''}`);
                    } else {
                      setSelectedGender(opt.value);
                      if (subcategoryId) {
                        const currentPath = location.split('?')[0];
                        const currentParams = new URLSearchParams(searchString);
                        currentParams.delete('sub');
                        const newQuery = currentParams.toString();
                        navigate(`${currentPath}${newQuery ? '?' + newQuery : ''}`);
                      }
                    }
                    setOpenDropdown(null);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center justify-between",
                    isActive && "font-bold text-black"
                  )}
                  data-testid={`button-gender-${opt.label}`}
                >
                  {opt.label}
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {(activeFiltersCount > 0 || subnameParam) && (
        <button
          onClick={() => {
            setSelectedBrand(null);
            setSelectedGender(null);
            setSelectedSubcategory(null);
            if (isGenderCategory) {
              navigate("/products");
            } else {
              const currentPath = location.split('?')[0];
              const currentParams = new URLSearchParams(searchString);
              currentParams.delete('subname');
              if (golfSubGender && subcategoryId) {
                currentParams.delete('sub');
              }
              navigate(`${currentPath}${currentParams.toString() ? '?' + currentParams.toString() : ''}`);
            }
          }}
          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-black transition-colors"
          data-testid="button-clear-filters"
        >
          <X className="w-3.5 h-3.5" />
          필터 초기화
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Page title */}
        <div className="mb-5">
          {isGenderCategory ? (
            <>
              <h1 className="text-xl font-bold" data-testid="text-category-title">
                {categorySlug === "men" ? "남성" : "여성"}
              </h1>
              <p className="text-gray-400 text-xs mt-1">※ 베스트상품 랭킹순위</p>
            </>
          ) : categorySlug === "sameday" ? (
            <h1 className="text-xl font-bold text-blue-600" data-testid="text-category-title">당일배송</h1>
          ) : categorySlug === "discount" || categorySlug === "sale" ? (
            <h1 className="text-xl font-bold text-red-500" data-testid="text-category-title">할인상품</h1>
          ) : categorySlug === "best" ? (
            <h1 className="text-xl font-bold text-amber-600" data-testid="text-category-title">베스트상품</h1>
          ) : categorySlug === "new" || categorySlug === "new-arrivals" ? (
            <h1 className="text-xl font-bold" data-testid="text-category-title">
              신상품 {monthParam ? `— ${monthParam.replace('-', '년')}월` : ""}
            </h1>
          ) : searchQuery ? (
            <h1 className="text-xl font-bold" data-testid="text-category-title">"{searchQuery}" 검색 결과</h1>
          ) : (
            <h1 className="text-xl font-bold" data-testid="text-category-title">
              {categoryInfo?.name || "전체 상품"}
              {genderParam ? ` — ${genderParam}` : ""}
            </h1>
          )}
        </div>

        {/* Simple filter bar */}
        <div className="mb-4">
          <div className="flex items-center gap-2 pb-3 border-b flex-wrap">
            <FilterDropdownButtons />
          </div>

          {/* Active filter chips */}
          {(selectedBrandName || selectedGender || subnameParam || golfSubGender) && (
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {subnameParam && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-sm px-3 py-1.5 rounded-full">
                  소분류: {subnameParam}
                  <button
                    onClick={() => {
                      const base = location.split('?')[0];
                      const p = new URLSearchParams(searchString);
                      p.delete('subname');
                      navigate(`${base}${p.toString() ? '?' + p.toString() : ''}`);
                    }}
                    className="hover:text-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {selectedBrandName && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-sm px-3 py-1.5 rounded-full">
                  브랜드: {selectedBrandName}
                  <button onClick={() => setSelectedBrand(null)} className="hover:text-black">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {selectedGender && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-sm px-3 py-1.5 rounded-full">
                  성별: {selectedGender}
                  <button onClick={() => setSelectedGender(null)} className="hover:text-black">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {golfSubGender && !selectedGender && (
                <span className="inline-flex items-center gap-1.5 bg-gray-100 text-sm px-3 py-1.5 rounded-full">
                  성별: {golfSubGender}
                  <button
                    onClick={() => {
                      const currentPath = location.split('?')[0];
                      const currentParams = new URLSearchParams(searchString);
                      currentParams.delete('sub');
                      navigate(`${currentPath}${currentParams.toString() ? '?' + currentParams.toString() : ''}`);
                    }}
                    className="hover:text-black"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        <div>
          <div>

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
                      "group bg-white border border-gray-200 hover:shadow-md transition-all rounded-lg overflow-hidden",
                      viewMode === "list" && "flex gap-4 p-4"
                    )}
                    data-testid={`card-product-${product.id}`}
                  >
                    <div className={cn(
                      "bg-gray-50 relative overflow-hidden",
                      viewMode === "grid" ? "aspect-square rounded-lg" : "w-32 h-32 flex-shrink-0"
                    )}>
                      <LazyProductImage
                        src={getProxiedImageUrl(product.imageUrl)}
                        alt={product.name}
                      />
                      
                      {product.isSoldOut && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                          <span className="text-white text-xs font-bold px-3 py-1 bg-black/60">SOLD OUT</span>
                        </div>
                      )}
                      
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {(product.viewCount ?? 0) > 0 && (
                          <span className="bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-medium">
                            조회 {(product.viewCount ?? 0).toLocaleString()}
                          </span>
                        )}
                        {product.isNew && (
                          <span className="bg-red-500 text-white text-[10px] px-2.5 py-1 font-bold">NEW</span>
                        )}
                      </div>
                      
                      <button 
                        onClick={(e) => handleWishlistToggle(e, product)}
                        className={cn(
                          "absolute top-2 right-2 w-9 h-9 bg-white flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-all rounded-sm",
                          isInWishlist(String(product.id)) && "opacity-100"
                        )}
                        data-testid={`button-wishlist-${product.id}`}
                      >
                        <Heart className={cn("w-4.5 h-4.5", isInWishlist(String(product.id)) ? "fill-red-500 text-red-500" : "text-gray-400")} />
                      </button>
                    </div>
                    
                    
                    <div className={cn(
                      viewMode === "grid" ? "p-4" : "flex-1 flex flex-col justify-center"
                    )}>
                      <p className="text-xs text-gray-500 mb-1 font-medium tracking-wide">
                        {brands.find(b => b.id === product.brandId)?.name?.toUpperCase() || ""}
                      </p>
                      <h3 className={cn(
                        "font-medium text-sm md:text-base mb-2.5 group-hover:text-gray-600 transition-colors",
                        viewMode === "grid" && "line-clamp-2"
                      )}>
                        {decodeHtml(product.name)}
                      </h3>
                      <div>
                        {hasSale ? (
                          <>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-gray-400 line-through">
                                {Number(product.price).toLocaleString()}원
                              </span>
                              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 font-bold">
                                {salePercent}%
                              </span>
                            </div>
                            <span className="text-base md:text-lg font-extrabold text-red-500" data-testid={`price-product-${product.id}`}>
                              {calculateSalePrice(Number(product.price)).toLocaleString()}원
                            </span>
                            <p className="text-xs text-gray-400 mt-1">즉시구매가</p>
                          </>
                        ) : (
                          <>
                            <span className="text-base md:text-lg font-extrabold text-gray-900" data-testid={`price-product-${product.id}`}>
                              {Number(product.price).toLocaleString()}원
                            </span>
                            <p className="text-xs text-gray-400 mt-1">즉시구매가</p>
                          </>
                        )}
                      </div>
                      {product.viewCount && product.viewCount > 0 && (
                        <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                          <span>조회 {product.viewCount}</span>
                        </div>
                      )}
                      {(product.reviewCount || 0) > 0 && (
                        <div className="flex items-center gap-1 mt-1.5 text-sm text-gray-500">
                          <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
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
                    className="h-9 w-9 rounded-none"
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
                        className={cn(
                          "h-9 w-9 p-0 rounded-none text-sm",
                          currentPage === page && "bg-black text-white hover:bg-gray-800"
                        )}
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
                    className="h-9 w-9 rounded-none"
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
