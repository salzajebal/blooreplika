import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Heart, Package, Star, ChevronDown, X, ChevronLeft, ChevronRight, Search, Check, SlidersHorizontal } from "lucide-react";
import { useRoute, Link, useLocation, useSearch } from "wouter";
import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Product } from "@shared/schema";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSale } from "@/hooks/use-global-sale";
import { cn, decodeHtml } from "@/lib/utils";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";

function LazyProductImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="absolute inset-0 bg-gray-100">
      {!loaded && <div className="absolute inset-0 bg-gray-100 animate-pulse" />}
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
    <div className="bg-white animate-pulse border-b border-r border-gray-100">
      <div className="aspect-square bg-gray-100" />
      <div className="p-3">
        <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
        <div className="h-3 bg-gray-100 rounded w-full mb-1.5" />
        <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
        <div className="h-4 bg-gray-100 rounded w-24" />
      </div>
    </div>
  );
}

const SHOP_CATEGORY_TABS = [
  { id: "all", name: "전체", slug: null },
  { id: "clothing", name: "상의", slug: "clothing" },
  { id: "bags", name: "가방", slug: "bags" },
  { id: "shoes", name: "신발", slug: "shoes" },
  { id: "wallets", name: "지갑", slug: "wallets" },
  { id: "watches", name: "시계", slug: "watches" },
  { id: "jewelry", name: "패션잡화", slug: "jewelry" },
  { id: "golf", name: "골프", slug: "golf" },
];

const CATEGORIES = [
  { id: "new-arrivals", name: "신상품", slug: "new-arrivals" },
  { id: "new", name: "신상품", slug: "new" },
  { id: "men", name: "남성", slug: "men" },
  { id: "women", name: "여성", slug: "women" },
  { id: "clothing", name: "의류", slug: "clothing" },
  { id: "bags", name: "가방", slug: "bags" },
  { id: "wallets", name: "지갑", slug: "wallets" },
  { id: "shoes", name: "신발", slug: "shoes" },
  { id: "golf", name: "골프", slug: "golf" },
  { id: "jewelry", name: "쥬얼리/잡화", slug: "jewelry" },
  { id: "sunglasses", name: "선글라스", slug: "sunglasses" },
  { id: "belts", name: "벨트", slug: "belts" },
  { id: "watches", name: "시계", slug: "watches" },
  { id: "accessories", name: "잡화", slug: "accessories" },
  { id: "sale", name: "할인상품", slug: "sale" },
  { id: "discount", name: "할인상품", slug: "discount" },
  { id: "best", name: "베스트상품", slug: "best" },
  { id: "sameday", name: "당일배송", slug: "sameday" },
];

type SortOption = "newest" | "price_asc" | "price_desc" | "popular";

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
  const [openDropdown, setOpenDropdown] = useState<"brand" | "gender" | "subcat" | "sort" | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const { toggleItem, isInWishlist } = useWishlist();
  const { toast } = useToast();
  const { salePercent, calculateSalePrice, hasSale } = useGlobalSale();
  const isInitialMount = useRef(true);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const prevEffectiveCategoryRef = useRef<string>("all");

  const categoryInfo = CATEGORIES.find((c) => c.slug === categorySlug);
  const searchString = useSearch();

  const { searchQuery, subcategoryId, urlBrand, activeTab, monthParam, genderParam, subnameParam, filterCategoryParam } = useMemo(() => {
    const p = new URLSearchParams(searchString);
    return {
      searchQuery: p.get("q"),
      subcategoryId: p.get("sub"),
      urlBrand: p.get("brand"),
      activeTab: p.get("tab") || "all",
      monthParam: p.get("month") || undefined,
      genderParam: p.get("gender") || undefined,
      subnameParam: p.get("subname") || undefined,
      filterCategoryParam: p.get("cat") || undefined,
    };
  }, [searchString]);

  const isGenderCategory = categorySlug === "men" || categorySlug === "women";
  const genderFromCategory = categorySlug === "men" ? "남성" : categorySlug === "women" ? "여성" : null;
  const isBrandsPage = location === "/brands" || location.startsWith("/brands");

  const MEN_TABS = [
    { id: "all", name: "전체보기", categorySlug: null },
    { id: "clothing", name: "남성의류", categorySlug: "clothing" },
    { id: "bags", name: "남성가방", categorySlug: "bags" },
    { id: "wallets", name: "지갑", categorySlug: "wallets" },
    { id: "shoes", name: "신발", categorySlug: "shoes" },
    { id: "jewelry", name: "쥬얼리/잡화", categorySlug: "jewelry" },
  ];
  const WOMEN_TABS = [
    { id: "all", name: "전체보기", categorySlug: null },
    { id: "clothing", name: "여성의류", categorySlug: "clothing" },
    { id: "bags", name: "여성가방", categorySlug: "bags" },
    { id: "shoes", name: "신발", categorySlug: "shoes" },
    { id: "watches", name: "패션시계", categorySlug: "watches" },
    { id: "jewelry", name: "쥬얼리/잡화", categorySlug: "jewelry" },
  ];
  const GENDER_TABS = categorySlug === "women" ? WOMEN_TABS : MEN_TABS;
  const tabCategorySlug = isGenderCategory ? (GENDER_TABS.find((t) => t.id === activeTab)?.categorySlug ?? null) : null;
  const effectiveCategorySlug = isGenderCategory ? (tabCategorySlug || "all") : categorySlug;

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
    let finalPrice = Number(product.price);
    if (product.discountPercent && product.discountPercent > 0) {
      finalPrice = Math.round(finalPrice * (100 - product.discountPercent) / 100 / 1000) * 1000;
    } else if (hasSale) {
      finalPrice = calculateSalePrice(finalPrice);
    }
    toggleItem({ id: productId, name: product.name, price: finalPrice, imageUrl: product.imageUrl || undefined });
    toast({
      title: wasInWishlist ? "찜 목록에서 삭제" : "찜 목록에 추가",
      description: wasInWishlist ? `${product.name}이(가) 삭제되었습니다.` : `${product.name}이(가) 추가되었습니다.`,
    });
  };

  const savedListPage = parseInt(sessionStorage.getItem("productListPage") || "1");
  const savedListCategory = sessionStorage.getItem("productListCategory") || "";
  const [currentPage, setCurrentPage] = useState(savedListCategory === categorySlug ? savedListPage : 1);
  const ITEMS_PER_PAGE = 20;
  const queryClient = useQueryClient();

  const fetchProducts = async (page: number, query?: string, brandIdFilter?: string | null, genderFilter?: string | null, subcatFilter?: string | null) => {
    const offset = (page - 1) * ITEMS_PER_PAGE;
    const categoryParam = effectiveCategorySlug && effectiveCategorySlug !== "all" ? `&categoryId=${effectiveCategorySlug}` : "";
    const subcategoryParam = subcatFilter ? `&subcategoryId=${subcatFilter}` : subcategoryId ? `&subcategoryId=${subcategoryId}` : "";
    const searchParam = query ? `&search=${encodeURIComponent(query)}` : "";
    const brandParam = brandIdFilter ? `&brandId=${encodeURIComponent(brandIdFilter)}` : "";
    const effectiveGender = genderFilter !== undefined && genderFilter !== null ? genderFilter : genderParam || genderFromCategory;
    const genderQP = effectiveGender ? `&gender=${encodeURIComponent(effectiveGender)}` : "";
    const monthQP = monthParam ? `&month=${encodeURIComponent(monthParam)}` : "";
    const subnameQP = subnameParam ? `&subname=${encodeURIComponent(subnameParam)}` : "";
    const filterCatQP = filterCategoryParam ? `&filterCategory=${encodeURIComponent(filterCategoryParam)}` : "";
    const res = await fetch(`/api/products?limit=${ITEMS_PER_PAGE}&offset=${offset}${categoryParam}${subcategoryParam}${searchParam}${brandParam}${genderQP}${monthQP}${subnameQP}${filterCatQP}`);
    const data = await res.json();
    return data;
  };

  const { data: productsData, isLoading: loading, isFetching } = useQuery({
    queryKey: ["products", effectiveCategorySlug, subcategoryId, currentPage, searchQuery, selectedBrand, selectedGender || genderParam || genderFromCategory, selectedSubcategory, monthParam, subnameParam, filterCategoryParam],
    queryFn: () => fetchProducts(currentPage, searchQuery || undefined, selectedBrand, selectedGender, selectedSubcategory),
    placeholderData: (prev) => prev,
    staleTime: 30000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["brands", isGenderCategory ? categorySlug : effectiveCategorySlug],
    queryFn: async () => {
      const catParam = (isGenderCategory ? categorySlug : effectiveCategorySlug) && (isGenderCategory ? categorySlug : effectiveCategorySlug) !== "all" ? `?categoryId=${isGenderCategory ? categorySlug : effectiveCategorySlug}` : "";
      const res = await fetch(`/api/brands${catParam}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000,
  });

  const { data: subcategoriesData } = useQuery({
    queryKey: ["subcategories", effectiveCategorySlug, selectedGender || genderParam || genderFromCategory],
    queryFn: async () => {
      if (!effectiveCategorySlug || effectiveCategorySlug === "all") return [];
      const g = selectedGender || genderParam || genderFromCategory;
      const gQP = g ? `&gender=${encodeURIComponent(g)}` : "";
      const res = await fetch(`/api/subcategories?categoryId=${effectiveCategorySlug}${gQP}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 60000,
  });

  const products: Product[] = productsData?.success ? productsData.data : [];
  const total = productsData?.total || 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const showLoadingOverlay = isFetching && products.length > 0;

  useEffect(() => { if (brandsData) setBrands(brandsData); }, [brandsData]);

  useEffect(() => {
    if (currentPage < totalPages) {
      queryClient.prefetchQuery({
        queryKey: ["products", effectiveCategorySlug, subcategoryId, currentPage + 1, searchQuery, selectedBrand, selectedGender || genderFromCategory, selectedSubcategory],
        queryFn: () => fetchProducts(currentPage + 1, searchQuery || undefined, selectedBrand, selectedGender, selectedSubcategory),
        staleTime: 30000,
      });
    }
  }, [currentPage, totalPages]);

  useEffect(() => { setSelectedBrand(urlBrand || null); }, [urlBrand]);

  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; sessionStorage.setItem("productListCategory", categorySlug || ""); return; }
    setCurrentPage(1);
    setSelectedBrand(null);
    if (!isGenderCategory) setSelectedGender(null);
    setSelectedSubcategory(null);
    const base = location.split("?")[0];
    const p = new URLSearchParams(searchString);
    let changed = false;
    if (p.has("subname")) { p.delete("subname"); changed = true; }
    if (p.has("brand")) { p.delete("brand"); changed = true; }
    if (changed) navigate(`${base}${p.toString() ? "?" + p.toString() : ""}`);
    sessionStorage.setItem("productListPage", "1");
    sessionStorage.setItem("productListScroll", "0");
    sessionStorage.setItem("productListCategory", categorySlug || "");
  }, [categorySlug, subcategoryId, searchQuery]);

  useEffect(() => {
    if (prevEffectiveCategoryRef.current !== effectiveCategorySlug) {
      prevEffectiveCategoryRef.current = effectiveCategorySlug;
      setSelectedSubcategory(null);
      const base = location.split("?")[0];
      const p = new URLSearchParams(searchString);
      if (p.has("subname")) { p.delete("subname"); navigate(`${base}${p.toString() ? "?" + p.toString() : ""}`); }
    }
  }, [effectiveCategorySlug]);

  useEffect(() => { sessionStorage.setItem("productListPage", String(currentPage)); }, [currentPage]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) { setCurrentPage(page); window.scrollTo({ top: 0, behavior: "smooth" }); }
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) { for (let i = 1; i <= totalPages; i++) pages.push(i); }
    else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const brandsWithProducts = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase();
    return brands.filter((b: any) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  const filteredProducts = useMemo(() => {
    let result = [...products];
    switch (sortBy) {
      case "newest":
        if (isGenderCategory) result.sort((a, b) => ((a as any).sourceIdx ?? 999) - ((b as any).sourceIdx ?? 999));
        else result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case "price_asc": result.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case "price_desc": result.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case "popular": result.sort((a, b) => ((b as any).viewCount || 0) - ((a as any).viewCount || 0)); break;
    }
    return result;
  }, [products, sortBy]);

  const subcategories = subcategoriesData || [];
  const selectedBrandName = brands.find((b: any) => b.id === selectedBrand)?.name;
  const hasActiveFilters = !!(selectedBrand || selectedGender || subnameParam);

  const clearAllFilters = () => {
    setSelectedBrand(null);
    setSelectedGender(null);
    setSelectedSubcategory(null);
    const base = location.split("?")[0];
    const p = new URLSearchParams(searchString);
    p.delete("subname");
    navigate(`${base}${p.toString() ? "?" + p.toString() : ""}`);
  };

  const getPageTitle = () => {
    if (isBrandsPage) return "브랜드";
    if (searchQuery) return `"${searchQuery}" 검색결과`;
    if (categorySlug === "sameday") return "당일배송";
    if (categorySlug === "discount" || categorySlug === "sale") return "할인상품";
    if (categorySlug === "best") return "베스트상품";
    if (categorySlug === "new" || categorySlug === "new-arrivals") return `신상품${monthParam ? ` — ${monthParam.replace("-", "년")}월` : ""}`;
    if (isGenderCategory) return categorySlug === "men" ? "남성" : "여성";
    return categoryInfo?.name || "전체 상품";
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 max-w-[640px] w-full mx-auto pb-24 md:pb-8">
        {/* SHOP Category tabs */}
        {!isBrandsPage && !searchQuery && (
          <div className="bg-white border-b border-gray-100 sticky top-0 z-30">
            <div className="flex overflow-x-auto scrollbar-hide">
              {SHOP_CATEGORY_TABS.map((tab) => {
                const isActive =
                  (tab.slug === null && (categorySlug === "all" || !match)) ||
                  (tab.slug !== null && categorySlug === tab.slug);
                return (
                  <Link
                    key={tab.id}
                    href={tab.slug ? `/products/${tab.slug}` : "/products"}
                    className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                      isActive ? "border-black text-black" : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                    data-testid={`shop-tab-${tab.id}`}
                  >
                    {tab.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Gender tabs for men/women pages */}
        {isGenderCategory && (
          <div className="bg-white border-b border-gray-100 px-4 py-2">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {GENDER_TABS.map((tab) => (
                <Link
                  key={tab.id}
                  href={`/products/${categorySlug}${tab.id !== "all" ? `?tab=${tab.id}` : ""}`}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    activeTab === tab.id ? "bg-black text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                  data-testid={`gender-tab-${tab.id}`}
                >
                  {tab.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Brands page header */}
        {isBrandsPage && (
          <div className="px-4 py-4 border-b border-gray-100">
            <h1 className="text-lg font-bold text-gray-900" data-testid="text-category-title">브랜드</h1>
          </div>
        )}

        {/* Filter bar */}
        <div className="sticky top-[92px] bg-white border-b border-gray-100 z-20" ref={dropdownRef}>
          <div className="flex items-center gap-0 overflow-x-auto scrollbar-hide px-3 py-2">
            {/* Filter button */}
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-full text-xs text-gray-600 hover:border-gray-400 mr-2 flex-shrink-0"
              data-testid="button-filter-open"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              필터
              {hasActiveFilters && <span className="w-1.5 h-1.5 bg-[#FF6100] rounded-full" />}
            </button>

            {/* Active filter chips */}
            {selectedBrandName && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs rounded-full mr-2 flex-shrink-0">
                {selectedBrandName}
                <button onClick={() => setSelectedBrand(null)} className="ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}
            {selectedGender && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs rounded-full mr-2 flex-shrink-0">
                {selectedGender}
                <button onClick={() => setSelectedGender(null)} className="ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}
            {subnameParam && (
              <span className="flex items-center gap-1 px-3 py-1.5 bg-black text-white text-xs rounded-full mr-2 flex-shrink-0">
                {subnameParam}
                <button onClick={() => { const b = location.split("?")[0]; const p = new URLSearchParams(searchString); p.delete("subname"); navigate(`${b}${p.toString() ? "?" + p : ""}`); }} className="ml-0.5"><X className="w-3 h-3" /></button>
              </span>
            )}

            {/* Sort dropdown */}
            <div className="relative ml-auto flex-shrink-0">
              <button
                onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                className="flex items-center gap-1 text-xs text-gray-500 px-2 py-1.5 whitespace-nowrap"
                data-testid="button-sort"
              >
                {sortBy === "newest" ? "신상품순" : sortBy === "price_asc" ? "낮은가격순" : sortBy === "price_desc" ? "높은가격순" : "인기순"}
                <ChevronDown className={`w-3 h-3 transition-transform ${openDropdown === "sort" ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === "sort" && (
                <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-lg z-50 min-w-[120px] py-1">
                  {[
                    { value: "newest", label: "신상품순" },
                    { value: "popular", label: "인기순" },
                    { value: "price_asc", label: "낮은가격순" },
                    { value: "price_desc", label: "높은가격순" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setSortBy(opt.value as SortOption); setOpenDropdown(null); }}
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50 ${sortBy === opt.value ? "font-bold text-black" : "text-gray-600"}`}
                      data-testid={`button-sort-${opt.value}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Product count */}
          <div className="px-4 pb-2 text-xs text-gray-400">
            총 <span className="font-bold text-gray-700" data-testid="text-product-count">{total.toLocaleString()}</span>개의 상품
          </div>
        </div>

        {/* Product grid */}
        <div>
          {loading && !products.length ? (
            <div className="grid grid-cols-2 gap-px bg-gray-100">
              {Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)}
            </div>
          ) : filteredProducts.length > 0 ? (
            <>
              {showLoadingOverlay && (
                <div className="flex items-center justify-center py-3">
                  <div className="animate-spin w-4 h-4 border-2 border-[#FF6100] border-t-transparent rounded-full mr-2" />
                  <span className="text-xs text-gray-400">불러오는 중...</span>
                </div>
              )}
              <div className={cn("grid grid-cols-2 gap-px bg-gray-100", showLoadingOverlay && "opacity-60 pointer-events-none")}>
                {filteredProducts.map((product) => {
                  const discountPct = product.discountPercent && product.discountPercent > 0 ? product.discountPercent : hasSale ? salePercent : 0;
                  const salePrice = discountPct > 0
                    ? (product.discountPercent && product.discountPercent > 0
                        ? Math.round(Number(product.price) * (100 - product.discountPercent) / 100 / 1000) * 1000
                        : calculateSalePrice(Number(product.price)))
                    : null;
                  const brandName = brands.find((b: any) => b.id === product.brandId)?.name || "";

                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="group relative bg-white block"
                      data-testid={`card-product-${product.id}`}
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-gray-50 overflow-hidden">
                        <LazyProductImage src={getProxiedImageUrl(product.imageUrl)} alt={product.name} />

                        {product.isSoldOut && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-20">
                            <span className="text-gray-500 text-xs font-bold px-3 py-1 border border-gray-300 rounded">SOLD OUT</span>
                          </div>
                        )}

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex gap-1 z-10">
                          {product.isNew && (
                            <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">NEW</span>
                          )}
                          {product.isBest && (
                            <span className="bg-[#FF6100] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">인기</span>
                          )}
                          {discountPct > 0 && (
                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">{discountPct}%</span>
                          )}
                        </div>

                        {/* Wishlist */}
                        <button
                          onClick={(e) => handleWishlistToggle(e, product)}
                          className="absolute bottom-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow-sm hover:bg-white transition-colors"
                          data-testid={`button-wishlist-${product.id}`}
                        >
                          <Heart className={cn("w-3.5 h-3.5", isInWishlist(String(product.id)) ? "fill-red-500 text-red-500" : "text-gray-400")} />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="p-3 bg-white">
                        <p className="text-[11px] text-[#FF6100] font-bold uppercase tracking-wide truncate mb-0.5">
                          {brandName}
                        </p>
                        <h3 className="text-xs text-gray-700 line-clamp-2 leading-snug mb-1.5">
                          {decodeHtml(product.name)}
                        </h3>
                        {salePrice ? (
                          <>
                            <p className="text-[10px] text-gray-400 line-through">매장가 {Number(product.price).toLocaleString()}원대</p>
                            <p className="text-sm font-bold text-gray-900" data-testid={`price-product-${product.id}`}>
                              즉시구매가 {salePrice.toLocaleString()}원
                            </p>
                          </>
                        ) : (
                          <p className="text-sm font-bold text-gray-900" data-testid={`price-product-${product.id}`}>
                            즉시구매가 {Number(product.price).toLocaleString()}원
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 py-6 px-4">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded disabled:opacity-30 hover:border-gray-400"
                    data-testid="button-prev-page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {getPageNumbers().map((page, idx) =>
                    typeof page === "number" ? (
                      <button
                        key={idx}
                        onClick={() => goToPage(page)}
                        className={`w-8 h-8 text-sm rounded transition-colors ${
                          currentPage === page ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
                        }`}
                        data-testid={`button-page-${page}`}
                      >
                        {page}
                      </button>
                    ) : (
                      <span key={idx} className="px-1 text-gray-300">...</span>
                    )
                  )}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded disabled:opacity-30 hover:border-gray-400"
                    data-testid="button-next-page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center">
              <Package className="w-14 h-14 mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 text-sm mb-1">상품이 없습니다.</p>
              <p className="text-xs text-gray-300">
                {searchQuery ? "다른 검색어로 검색해보세요." : "다른 카테고리를 확인해보세요."}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Filter Drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-[150]">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFilterDrawerOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-w-[640px] mx-auto bg-white rounded-t-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 flex-shrink-0">
              <h3 className="font-bold text-gray-900">필터</h3>
              <button onClick={() => setFilterDrawerOpen(false)} className="p-1 text-gray-400 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Brand filter */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">브랜드</p>
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="브랜드 검색..."
                    value={brandSearch}
                    onChange={(e) => setBrandSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400"
                    data-testid="input-brand-search"
                  />
                </div>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  <button
                    onClick={() => setSelectedBrand(null)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!selectedBrand ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                    data-testid="button-brand-all"
                  >
                    전체
                  </button>
                  {brandsWithProducts.slice(0, 50).map((brand: any) => (
                    <button
                      key={brand.id}
                      onClick={() => setSelectedBrand(brand.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${selectedBrand === brand.id ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                      data-testid={`button-brand-${brand.id}`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Gender filter */}
              <div>
                <p className="text-sm font-bold text-gray-900 mb-3">성별</p>
                <div className="flex gap-2">
                  {[{ value: null, label: "전체" }, { value: "남성", label: "남성" }, { value: "여성", label: "여성" }].map((opt) => (
                    <button
                      key={opt.label}
                      onClick={() => setSelectedGender(opt.value)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${selectedGender === opt.value ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                      data-testid={`button-gender-${opt.label}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subcategory filter */}
              {subcategories.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-gray-900 mb-3">소분류</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { const b = location.split("?")[0]; const p = new URLSearchParams(searchString); p.delete("subname"); navigate(`${b}${p.toString() ? "?" + p : ""}`); }}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${!subnameParam ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                    >
                      전체
                    </button>
                    {subcategories.map((sub: any) => (
                      <button
                        key={sub.slug || sub.id}
                        onClick={() => { const b = location.split("?")[0]; const p = new URLSearchParams(searchString); p.set("subname", sub.name); navigate(`${b}?${p.toString()}`); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${subnameParam === sub.name ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="px-4 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
              <button
                onClick={() => { clearAllFilters(); setFilterDrawerOpen(false); }}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50"
                data-testid="button-clear-filters"
              >
                초기화
              </button>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="flex-1 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800"
              >
                적용하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-[640px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
}
