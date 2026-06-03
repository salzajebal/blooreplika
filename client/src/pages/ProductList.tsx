import { Header } from "@/components/layout/Header";
import { Heart, Package, ChevronDown, X, Search, SlidersHorizontal, ShoppingBag } from "lucide-react";
import { useRoute, Link, useLocation, useSearch } from "wouter";
import { useState, useEffect, useMemo, useRef } from "react";
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
    <div className="absolute inset-0 bg-[#eaecf8]">
      {!loaded && <div className="absolute inset-0 bg-[#eaecf8] animate-pulse" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        onLoad={() => setLoaded(true)}
        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; setLoaded(true); }}
      />
    </div>
  );
}

const BLOO_CDN_BRAND_ICONS: Record<string, string> = {
  "Louis Vuitton": "/bloo/brands/men_lv.jpg",
  "루이비통": "/bloo/brands/men_lv.jpg",
  "LV": "/bloo/brands/men_lv.jpg",
  "Dior": "/bloo/brands/men_dior.jpg",
  "Christian Dior": "/bloo/brands/men_dior.jpg",
  "디올": "/bloo/brands/men_dior.jpg",
  "Gucci": "/bloo/brands/men_gucci.jpg",
  "GUCCI": "/bloo/brands/men_gucci.jpg",
  "구찌": "/bloo/brands/men_gucci.jpg",
  "PRADA": "/bloo/brands/men_prada.jpg",
  "Prada": "/bloo/brands/men_prada.jpg",
  "프라다": "/bloo/brands/men_prada.jpg",
  "Balenciaga": "/bloo/brands/men_balenciaga.jpg",
  "발렌시아가": "/bloo/brands/men_balenciaga.jpg",
  "BOTTEGA VENETA": "/bloo/brands/men_bottega.jpg",
  "Bottega Veneta": "/bloo/brands/men_bottega.jpg",
  "보테가 베네타": "/bloo/brands/men_bottega.jpg",
  "GOYARD": "/bloo/brands/men_goyard.jpg",
  "Goyard": "/bloo/brands/men_goyard.jpg",
  "고야드": "/bloo/brands/men_goyard.jpg",
  "HERMES": "/bloo/brands/women_hermes.jpg",
  "Hermes": "/bloo/brands/women_hermes.jpg",
  "에르메스": "/bloo/brands/women_hermes.jpg",
  "Hermès": "/bloo/brands/women_hermes.jpg",
};

function getBrandCdnIcon(brandName: string): string | null {
  return BLOO_CDN_BRAND_ICONS[brandName] ?? null;
}

function BrandIconRow({
  brands,
  selectedBrand,
  onSelect,
  gender,
  topBrandsImageMap,
}: {
  brands: any[];
  selectedBrand: string | null;
  onSelect: (id: string) => void;
  gender: "men" | "women";
  topBrandsImageMap?: Record<string, string>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const startX = useRef(0);
  const scrollLeftRef = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    didDrag.current = false;
    startX.current = e.clientX;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const walk = e.clientX - startX.current;
    if (Math.abs(walk) > 4) didDrag.current = true;
    scrollRef.current.scrollLeft = scrollLeftRef.current - walk;
  };
  const onMouseUp = () => { isDragging.current = false; };
  const WOMEN_BRAND_ICONS: Record<string, string> = {
    "HERMES": "/bloo/brands/women_hermes.jpg",
    "Hermes": "/bloo/brands/women_hermes.jpg",
    "에르메스": "/bloo/brands/women_hermes.jpg",
    "Hermès": "/bloo/brands/women_hermes.jpg",
    "Louis Vuitton": "/bloo/brands/women_lv.jpg",
    "루이비통": "/bloo/brands/women_lv.jpg",
    "LV": "/bloo/brands/women_lv.jpg",
    "Dior": "/bloo/brands/women_dior.jpg",
    "Christian Dior": "/bloo/brands/women_dior.jpg",
    "디올": "/bloo/brands/women_dior.jpg",
    "Gucci": "/bloo/brands/women_gucci.jpg",
    "GUCCI": "/bloo/brands/women_gucci.jpg",
    "구찌": "/bloo/brands/women_gucci.jpg",
    "PRADA": "/bloo/brands/women_prada.jpg",
    "Prada": "/bloo/brands/women_prada.jpg",
    "프라다": "/bloo/brands/women_prada.jpg",
    "Balenciaga": "/bloo/brands/women_balenciaga.jpg",
    "발렌시아가": "/bloo/brands/women_balenciaga.jpg",
    "BOTTEGA VENETA": "/bloo/brands/women_bottega.jpg",
    "Bottega Veneta": "/bloo/brands/women_bottega.jpg",
    "보테가 베네타": "/bloo/brands/women_bottega.jpg",
    "GOYARD": "/bloo/brands/men_goyard.jpg",
    "Goyard": "/bloo/brands/men_goyard.jpg",
    "고야드": "/bloo/brands/men_goyard.jpg",
  };

  const iconMap = gender === "women" ? WOMEN_BRAND_ICONS : BLOO_CDN_BRAND_ICONS;

  return (
    <div
      ref={scrollRef}
      className="flex gap-4 overflow-x-auto scrollbar-hide px-4 lg:px-6 py-4 border-b border-gray-100 cursor-grab active:cursor-grabbing"
      style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {brands.slice(0, 20).map((brand: any) => {
        const staticIcon = iconMap[brand.name] ?? getBrandCdnIcon(brand.name);
        const dbImage = topBrandsImageMap?.[brand.id];
        const iconSrc = dbImage
          ? (dbImage.includes("cdn.imweb.me")
              ? `/api/bloostore-image-proxy?url=${encodeURIComponent(dbImage)}`
              : dbImage)
          : staticIcon;
        const isSelected = selectedBrand === brand.id;
        return (
          <button
            key={brand.id}
            onClick={() => { if (!didDrag.current) onSelect(brand.id); }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
            data-testid={`brand-logo-${brand.id}`}
          >
            <div className={cn(
              "w-[68px] h-[68px] rounded-full border-2 flex items-center justify-center bg-gray-50 overflow-hidden transition-all",
              isSelected
                ? "border-gray-800 shadow-md"
                : "border-gray-200 group-hover:border-gray-500"
            )}>
              {iconSrc ? (
                <img
                  src={iconSrc}
                  alt={brand.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const el = e.target as HTMLImageElement;
                    el.style.display = "none";
                    const fb = el.parentElement?.querySelector(".brand-fb") as HTMLElement;
                    if (fb) fb.style.display = "flex";
                  }}
                />
              ) : null}
              <span
                className="brand-fb text-[8px] font-bold text-gray-700 text-center leading-tight px-1 break-all"
                style={{ display: iconSrc ? "none" : "flex", alignItems: "center", justifyContent: "center", width: "100%", height: "100%" }}
              >
                {brand.name.length > 10 ? brand.name.slice(0, 9) + "…" : brand.name}
              </span>
            </div>
            <span className={cn(
              "text-[10px] text-center leading-tight max-w-[72px] break-words whitespace-pre-wrap",
              isSelected ? "font-bold text-gray-900" : "text-gray-500 group-hover:text-gray-800"
            )}>
              {brand.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

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

const BRAND_ENGLISH_NAMES: Record<string, string> = {
  louisvuitton: "Louis Vuitton",
  gucci: "GUCCI",
  hermes: "Hermes",
  prada: "PRADA",
  dior: "Dior",
  balenciaga: "Balenciaga",
  bottegaveneta: "Bottega Veneta",
  goyard: "GOYARD",
  burberry: "Burberry",
  loewe: "LOEWE",
  celine: "CELINE",
  chanel: "Chanel",
  saintlaurent: "Saint Laurent",
  fendi: "FENDI",
  miumiu: "miu miu",
  rolex: "Rolex",
  versace: "Versace",
  thombrowne: "Thom Browne",
  givenchy: "Givenchy",
  maxmara: "Max Mara",
  goldengoose: "Golden Goose",
  alexandermcqueen: "Alexander McQueen",
  moncler: "Moncler",
  offwhite: "Off-White",
  chromehearts: "Chrome Hearts",
  stoneisland: "Stone Island",
  kenzo: "KENZO",
  ami: "AMI",
  acnestudios: "Acne Studios",
  maisonmargiela: "Maison Margiela",
  lanvin: "LANVIN",
  balmain: "BALMAIN",
  valentino: "Valentino",
  dolcegabbana: "Dolce&Gabbana",
  tods: "Tod's",
  loropiana: "Loro Piana",
  nike: "Nike",
  adidas: "Adidas",
  newbalance: "New Balance",
  salomon: "Salomon",
  asics: "ASICS",
  jordan: "Jordan",
  converse: "Converse",
  vans: "Vans",
  reebok: "Reebok",
  puma: "PUMA",
  ugg: "UGG",
  miharayasuhiro: "Maison MIHARA YASUHIRO",
  yeezy: "Yeezy",
  jilsander: "Jil Sander",
  isseymiyake: "Issey Miyake",
  commedesgarcons: "Comme des Garçons",
  cartier: "Cartier",
  tiffany: "Tiffany & Co.",
  bvlgari: "Bvlgari",
  omega: "OMEGA",
  iwc: "IWC",
  patekphilippe: "Patek Philippe",
  audemarspiguet: "Audemars Piguet",
  tagheuer: "TAG Heuer",
  breitling: "Breitling",
  hublot: "Hublot",
};

function getBrandDisplayName(brand: any): string {
  if (brand.slug && BRAND_ENGLISH_NAMES[brand.slug]) {
    return BRAND_ENGLISH_NAMES[brand.slug];
  }
  return brand.name;
}

const SIDEBAR_CATEGORIES = [
  {
    id: "men",
    label: "남성",
    path: "/products/men",
    subs: [
      { id: "clothing", label: "남성 의류", path: "/products/men?tab=clothing", hasBrands: true },
      { id: "shoes", label: "남성 신발", path: "/products/men?tab=shoes", hasBrands: true },
      { id: "bags", label: "남성 가방", path: "/products/men?tab=bags", hasBrands: true },
      { id: "wallets", label: "지갑", path: "/products/men?tab=wallets", hasBrands: true },
      { id: "jewelry", label: "남성 패션 잡화", path: "/products/men?tab=jewelry", hasBrands: true },
    ],
  },
  {
    id: "women",
    label: "여성",
    path: "/products/women",
    subs: [
      { id: "clothing", label: "여성 의류", path: "/products/women?tab=clothing", hasBrands: true },
      { id: "bags", label: "여성 가방", path: "/products/women?tab=bags", hasBrands: true },
      { id: "shoes", label: "여성 신발", path: "/products/women?tab=shoes", hasBrands: true },
      { id: "jewelry", label: "여성 패션 잡화", path: "/products/women?tab=jewelry", hasBrands: true },
    ],
  },
  { id: "watches", label: "시계관", path: "/products/watches", subs: [] },
  { id: "events", label: "기획전", path: "/events", subs: [] },
  {
    id: "community",
    label: "커뮤니티",
    path: "#",
    subs: [
      { id: "sameday", label: "오늘출발", path: "/products/sameday", hasBrands: false },
      { id: "blog", label: "썸머", path: "/blog", hasBrands: false },
    ],
  },
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

  const { data: productsData, isLoading: loading } = useQuery({
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

  // Sidebar-specific brands: filtered by active subcategory tab (e.g. bags, shoes, clothing)
  const sidebarTabCategory = isGenderCategory && activeTab !== "all" ? activeTab : null;
  const { data: sidebarBrandsData } = useQuery({
    queryKey: ["sidebar-brands", sidebarTabCategory],
    queryFn: async () => {
      if (!sidebarTabCategory) return [];
      const res = await fetch(`/api/brands?categoryId=${sidebarTabCategory}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000,
    enabled: !!sidebarTabCategory,
  });

  const sidebarBrands = sidebarTabCategory && sidebarBrandsData
    ? sidebarBrandsData.filter((b: any) => b.productCount > 0)
    : brands.filter((b: any) => b.productCount > 0);

  const { data: topBrandsData } = useQuery({
    queryKey: ["brands-top-images", isGenderCategory ? categorySlug : ""],
    queryFn: async () => {
      if (!isGenderCategory) return [];
      const res = await fetch(`/api/brands/top?limit=50`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000,
    enabled: isGenderCategory,
  });

  const topBrandsImageMap: Record<string, string> = useMemo(() => {
    if (!topBrandsData) return {};
    return topBrandsData.reduce((acc: Record<string, string>, b: any) => {
      if (b.representativeImage) acc[b.id] = b.representativeImage;
      return acc;
    }, {});
  }, [topBrandsData]);

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

  const brandsWithProducts = useMemo(() => {
    if (!brandSearch.trim()) return brands;
    const q = brandSearch.toLowerCase();
    return brands.filter((b: any) => b.name.toLowerCase().includes(q));
  }, [brands, brandSearch]);

  // ── Accumulated products for "더보기" behavior ──
  const [accumulatedProducts, setAccumulatedProducts] = useState<Product[]>([]);
  const filterKeyRef = useRef("");
  const filterKey = `${effectiveCategorySlug}|${selectedBrand}|${selectedGender}|${subnameParam}|${searchQuery}|${genderParam}|${sortBy}`;

  useEffect(() => {
    const filterChanged = filterKeyRef.current !== filterKey;
    if (filterChanged) {
      filterKeyRef.current = filterKey;
      setAccumulatedProducts(filteredProducts);
    } else if (currentPage === 1) {
      setAccumulatedProducts(filteredProducts);
    } else {
      setAccumulatedProducts(prev => {
        const ids = new Set(prev.map(p => p.id));
        const newOnes = filteredProducts.filter(p => !ids.has(p.id));
        return newOnes.length > 0 ? [...prev, ...newOnes] : prev;
      });
    }
  }, [filteredProducts, filterKey]);

  const displayProducts = accumulatedProducts;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      {/* ── Main layout ── */}
      <div className="flex flex-1" style={{ paddingTop: "101px" }}>

        {/* ── LEFT SIDEBAR (desktop only) ── */}
        <aside
          className="hidden lg:block flex-shrink-0 border-r border-gray-100 py-4"
          style={{ width: "200px", position: "sticky", top: "101px", maxHeight: "calc(100vh - 101px)", overflowY: "auto", alignSelf: "flex-start" }}
        >
          {/* 실시간 검수 사진 */}
          <Link href="/inspection" className="flex items-center gap-1 text-[13px] text-gray-700 mb-4 pl-4 hover:text-green-600 transition-colors">
            실시간 검수 사진
            <span className="text-green-500 font-bold">✓</span>
          </Link>

          {/* Category tree */}
          {SIDEBAR_CATEGORIES.map(cat => {
            const isActive = categorySlug === cat.id || (cat.id === "watches" && categorySlug === "watches");
            const hasActiveSub = isActive && cat.subs && cat.subs.some((s: any) => activeTab === s.id);
            return (
              <div key={cat.id} className="mb-0">
                <Link
                  href={cat.path}
                  className={cn(
                    "block text-[14px] py-1.5 pl-4 border-l-2 transition-colors",
                    isActive
                      ? "border-gray-800 font-bold text-gray-900"
                      : "border-transparent text-gray-500 hover:text-gray-900"
                  )}
                >
                  {cat.label}
                </Link>

                {/* Sub-categories (only show when parent is active) */}
                {isActive && cat.subs && cat.subs.length > 0 && (
                  <div className="mb-1">
                    {cat.subs.map((sub: any) => {
                      const subIsActive = activeTab === sub.id || (activeTab === "all" && sub.id === "clothing" && false);
                      const subBrands = brands.filter((b: any) => b.productCount > 0).slice(0, 20);
                      return (
                        <div key={sub.id}>
                          <Link
                            href={sub.path}
                            className={cn(
                              "block text-[13px] py-1 pl-7 border-l-2 transition-colors",
                              subIsActive
                                ? "border-gray-800 font-bold text-gray-900"
                                : "border-transparent text-gray-500 hover:text-gray-800"
                            )}
                          >
                            {sub.label}
                          </Link>

                          {/* Brand list — shown when this subcategory is active */}
                          {subIsActive && sidebarBrands.length > 0 && (
                            <div className="pb-1">
                              {sidebarBrands.slice(0, 20).map((brand: any) => {
                                const isSelectedBrand = selectedBrand === brand.id;
                                return (
                                  <button
                                    key={brand.id}
                                    onClick={() => setSelectedBrand(selectedBrand === brand.id ? null : brand.id)}
                                    className={cn(
                                      "block text-[12px] py-[3px] text-left w-full transition-colors border-l-2 pl-10",
                                      isSelectedBrand
                                        ? "border-gray-800 font-bold text-gray-900"
                                        : "border-transparent text-gray-400 hover:text-gray-700"
                                    )}
                                    data-testid={`sidebar-brand-${brand.id}`}
                                  >
                                    {getBrandDisplayName(brand)}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 pb-20 lg:pb-8">

          {/* Brand logos row (gender pages only) — BLOO style circular icons */}
          {isGenderCategory && brands.length > 0 && (
            <BrandIconRow
              brands={brands}
              selectedBrand={selectedBrand}
              onSelect={(id) => setSelectedBrand(selectedBrand === id ? null : id)}
              gender={categorySlug as "men" | "women"}
              topBrandsImageMap={topBrandsImageMap}
            />
          )}

          {/* Subcategory tabs + sort row */}
          <div className="px-4 lg:px-6 border-b border-gray-100" ref={dropdownRef}>
            {subcategories.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3">
                <button
                  onClick={() => { const b = location.split("?")[0]; const p = new URLSearchParams(searchString); p.delete("subname"); navigate(`${b}${p.toString() ? "?" + p : ""}`); }}
                  className={cn(
                    "flex-shrink-0 px-4 py-1.5 text-[13px] rounded-full font-medium transition-colors border",
                    !subnameParam ? "bg-black text-white border-black" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                  )}
                >
                  전체보기
                </button>
                {subcategories.map((sub: any) => (
                  <button
                    key={sub.slug || sub.id}
                    onClick={() => { const b = location.split("?")[0]; const p = new URLSearchParams(searchString); p.set("subname", sub.name); navigate(`${b}?${p.toString()}`); }}
                    className={cn(
                      "flex-shrink-0 px-4 py-1.5 text-[13px] rounded-full font-medium transition-colors border whitespace-nowrap",
                      subnameParam === sub.name ? "bg-black text-white border-black" : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
                    )}
                  >
                    {sub.name}
                  </button>
                ))}
              </div>
            )}

            {/* Sort + count */}
            <div className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-gray-400">
                  총 <span className="font-bold text-gray-700" data-testid="text-product-count">{total.toLocaleString()}</span>개
                </span>
                {selectedBrandName && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-black text-white text-[11px] rounded-full">
                    {selectedBrandName}
                    <button onClick={() => setSelectedBrand(null)} className="ml-0.5"><X className="w-3 h-3" /></button>
                  </span>
                )}
                {subnameParam && (
                  <span className="flex items-center gap-1 px-2.5 py-1 bg-black text-white text-[11px] rounded-full">
                    {subnameParam}
                    <button onClick={() => { const b = location.split("?")[0]; const p = new URLSearchParams(searchString); p.delete("subname"); navigate(`${b}${p.toString() ? "?" + p : ""}`); }} className="ml-0.5"><X className="w-3 h-3" /></button>
                  </span>
                )}
              </div>

              {/* Sort dropdown */}
              <div className="relative ml-auto flex-shrink-0">
                <button
                  onClick={() => setOpenDropdown(openDropdown === "sort" ? null : "sort")}
                  className="flex items-center gap-1 text-[13px] text-gray-500 px-2 py-1 hover:text-gray-800 transition-colors"
                  data-testid="button-sort"
                >
                  {sortBy === "newest" ? "등록순" : sortBy === "price_asc" ? "낮은가격순" : sortBy === "price_desc" ? "높은가격순" : "인기순"}
                  <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", openDropdown === "sort" ? "rotate-180" : "")} />
                </button>
                {openDropdown === "sort" && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 shadow-lg rounded-lg z-50 min-w-[120px] py-1">
                    {[
                      { value: "newest", label: "등록순" },
                      { value: "popular", label: "인기순" },
                      { value: "price_asc", label: "낮은가격순" },
                      { value: "price_desc", label: "높은가격순" },
                    ].map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSortBy(opt.value as SortOption); setOpenDropdown(null); }}
                        className={cn("w-full text-left px-4 py-2.5 text-xs hover:bg-gray-50", sortBy === opt.value ? "font-bold text-black" : "text-gray-600")}
                        data-testid={`button-sort-${opt.value}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Product Grid ── */}
          <div className="px-3 lg:px-5 pt-3">
            {loading && displayProducts.length === 0 ? (
              /* Skeleton */
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-[#eaecf8] aspect-square rounded mb-2" />
                    <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : displayProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3">
                {displayProducts.map((product: any) => {
                  const discountPct = product.discountPercent && product.discountPercent > 0
                    ? product.discountPercent
                    : hasSale ? salePercent : 0;
                  const salePrice = discountPct > 0
                    ? (product.discountPercent && product.discountPercent > 0
                        ? Math.round(Number(product.price) * (100 - product.discountPercent) / 100 / 1000) * 1000
                        : calculateSalePrice(Number(product.price)))
                    : null;

                  return (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="group block"
                      data-testid={`card-product-${product.id}`}
                    >
                      {/* Image area */}
                      <div className="relative bg-[#eaecf8] overflow-hidden aspect-square">
                        <LazyProductImage src={getProxiedImageUrl(product.imageUrl)} alt={product.name} />

                        {product.isSoldOut && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                            <span className="text-white text-[11px] font-bold tracking-widest border border-white/60 px-3 py-1">SOLD OUT</span>
                          </div>
                        )}

                        {/* Discount badge */}
                        {discountPct > 0 && (
                          <span className="absolute top-2 left-2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
                            -{discountPct}%
                          </span>
                        )}

                        {/* NEW badge */}
                        {product.isNew && !discountPct && (
                          <span className="absolute top-2 left-2 bg-black text-white text-[9px] font-bold px-1.5 py-0.5 rounded z-10">
                            NEW
                          </span>
                        )}

                        {/* Wishlist */}
                        <button
                          onClick={(e) => handleWishlistToggle(e, product)}
                          className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center shadow-sm"
                          data-testid={`button-wishlist-${product.id}`}
                        >
                          <Heart className={cn("w-3 h-3", isInWishlist(String(product.id)) ? "fill-red-500 text-red-500" : "text-gray-400")} />
                        </button>
                      </div>

                      {/* Info */}
                      <div className="pt-2 pb-1">
                        <p className="text-[12px] text-gray-700 line-clamp-2 leading-snug mb-1.5">
                          {decodeHtml(product.name)}
                        </p>
                        {salePrice ? (
                          <div>
                            <p className="text-[11px] text-gray-300 line-through leading-none mb-0.5">
                              {Number(product.price).toLocaleString()}원
                            </p>
                            <p className="text-[13px] font-bold text-gray-900 leading-none" data-testid={`price-product-${product.id}`}>
                              {salePrice.toLocaleString()}<span className="text-[10px] font-normal text-gray-400 ml-0.5">원</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-[13px] font-bold text-gray-900 leading-none" data-testid={`price-product-${product.id}`}>
                            {Number(product.price).toLocaleString()}<span className="text-[10px] font-normal text-gray-400 ml-0.5">원</span>
                          </p>
                        )}
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          className="mt-1.5 block"
                        >
                          <ShoppingBag className="w-4 h-4 text-gray-300 hover:text-gray-600 transition-colors" />
                        </button>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="py-20 text-center">
                <Package className="w-14 h-14 mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm mb-1">상품이 없습니다.</p>
                <p className="text-xs text-gray-300">
                  {searchQuery ? "다른 검색어로 검색해보세요." : "다른 카테고리를 확인해보세요."}
                </p>
              </div>
            )}

            {/* ── 더보기 button ── */}
            {currentPage < totalPages && (
              <div className="flex justify-center mt-8 mb-6">
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={loading}
                  className="px-20 py-3 border border-gray-300 text-[13px] text-gray-600 hover:border-gray-600 hover:text-gray-900 transition-colors disabled:opacity-50"
                  data-testid="button-load-more"
                >
                  {loading ? "불러오는 중..." : "더보기"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Mobile filter button */}
      <button
        onClick={() => setFilterDrawerOpen(true)}
        className="fixed bottom-20 right-4 z-40 bg-black text-white rounded-full px-4 py-2.5 text-sm flex items-center gap-2 shadow-lg lg:hidden"
        data-testid="button-filter-open"
      >
        <SlidersHorizontal className="w-3.5 h-3.5" />
        필터
        {hasActiveFilters && <span className="w-2 h-2 bg-orange-400 rounded-full" />}
      </button>

      {/* ── Filter Drawer ── */}
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
                        onClick={() => { const b = location.split("?")[0]; const p = new URLSearchParams(searchString); p.set("subname", sub.name); navigate(`${b}?${p.toString()}`); setFilterDrawerOpen(false); }}
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
    </div>
  );
}
