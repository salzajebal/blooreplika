import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Star, ArrowUp, Trophy, ShoppingBag, Flame, Tag, Package, MessageSquare, Shirt, Watch, Gem, Calendar } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef } from "react";

function FloatingButtons() {
  const [showScrollTop, setShowScrollTop] = useState(false);
  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  if (!showScrollTop) return null;
  return (
    <div className="fixed right-4 bottom-24 z-40">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-11 h-11 bg-white border border-gray-200 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-800 hover:border-gray-400 transition-all"
        data-testid="floating-scroll-top"
        aria-label="맨 위로"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}

function MainBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const touchStartX = useRef(0);

  const { data: banners } = useQuery({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await fetch("/api/banners");
      const data = await res.json();
      return data.success ? data.data : [];
    },
  });

  const bannerList = banners && banners.length > 0 ? banners : [];

  useEffect(() => {
    if (bannerList.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerList.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerList.length]);

  if (bannerList.length === 0) {
    return (
      <section className="w-full bg-gradient-to-br from-gray-100 to-gray-200 aspect-[4/3] flex items-end">
        <div className="p-6">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">velour</p>
          <h2 className="text-2xl font-bold text-gray-700">럭셔리 브랜드 컬렉션</h2>
          <p className="text-sm text-gray-500 mt-1">가장 빠른 신상품</p>
        </div>
      </section>
    );
  }

  return (
    <section className="relative w-full overflow-hidden" data-testid="main-banner">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
        onTouchEnd={(e) => {
          const diff = touchStartX.current - e.changedTouches[0].clientX;
          if (Math.abs(diff) > 50) {
            if (diff > 0) setCurrentSlide((p) => (p + 1) % bannerList.length);
            else setCurrentSlide((p) => (p === 0 ? bannerList.length - 1 : p - 1));
          }
        }}
      >
        {bannerList.map((banner: any, index: number) => (
          <div key={index} className="w-full flex-shrink-0 relative">
            <Link href={banner.linkUrl || "/products"} className="block w-full">
              <img
                src={banner.imageUrl}
                alt={banner.title || `배너 ${index + 1}`}
                className="w-full h-auto block"
                loading="eager"
              />
              {(banner.title || banner.subtitle) && (
                <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black/60 to-transparent">
                  {banner.subtitle && (
                    <p className="text-xs text-white/80 uppercase tracking-widest mb-1">{banner.subtitle}</p>
                  )}
                  {banner.title && (
                    <h2 className="text-xl font-bold text-white">{banner.title}</h2>
                  )}
                  <p className="text-sm text-white/70 mt-0.5">가장 빠른 신상품</p>
                </div>
              )}
            </Link>
          </div>
        ))}
      </div>

      {bannerList.length > 1 && (
        <>
          <button
            onClick={() => setCurrentSlide((p) => (p === 0 ? bannerList.length - 1 : p - 1))}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow z-10"
            aria-label="이전"
          >
            <ChevronLeft className="w-4 h-4 text-gray-700" />
          </button>
          <button
            onClick={() => setCurrentSlide((p) => (p + 1) % bannerList.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow z-10"
            aria-label="다음"
          >
            <ChevronRight className="w-4 h-4 text-gray-700" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {bannerList.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentSlide ? "bg-white w-4" : "bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

const QUICK_MENU_ITEMS = [
  { label: "SHOP", path: "/products", icon: ShoppingBag, color: "#111111" },
  { label: "랭킹", path: "/ranking", icon: Trophy, color: "#FF6100" },
  { label: "기획전", path: "/events", icon: Flame, color: "#FF6100" },
  { label: "브랜드", path: "/brands", icon: Tag, color: "#111111" },
  { label: "할인상품", path: "/products/discount", icon: Package, color: "#e53e3e" },
  { label: "리뷰", path: "/reviews", icon: MessageSquare, color: "#111111", badge: "리뷰" },
  { label: "신상품", path: "/products/new", icon: Star, color: "#FF6100" },
  { label: "시계", path: "/products/watches", icon: Watch, color: "#111111" },
  { label: "쥬얼리", path: "/products/jewelry", icon: Gem, color: "#111111" },
  { label: "이벤트", path: "/events", icon: Calendar, color: "#8B5CF6" },
];

function QuickMenuSection() {
  const { data: quickMenuData } = useQuery({
    queryKey: ["/api/quick-menu"],
    queryFn: async () => {
      const res = await fetch("/api/quick-menu");
      const data = await res.json();
      return data.success && data.data?.length > 0 ? data.data : null;
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = quickMenuData
    ? quickMenuData.slice(0, 10).map((item: any) => ({
        label: item.name,
        path: item.linkUrl || "/products",
        imageUrl: item.imageUrl,
      }))
    : null;

  return (
    <section className="bg-white py-4 border-b border-gray-100" data-testid="quick-menu-section">
      <div className="grid grid-cols-5 gap-0">
        {(items || QUICK_MENU_ITEMS).map((item: any, idx: number) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={idx}
              href={item.path}
              className="flex flex-col items-center gap-1.5 py-3 px-1 hover:bg-gray-50 transition-colors touch-manipulation"
              data-testid={`quick-menu-${idx}`}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center relative">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl.startsWith("/objects/") ? item.imageUrl : item.imageUrl}
                    alt={item.label}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                    loading="lazy"
                  />
                ) : IconComponent ? (
                  <IconComponent className="w-6 h-6" style={{ color: item.color || "#111111" }} />
                ) : (
                  <span className="text-xl">🛍️</span>
                )}
                {item.badge && (
                  <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full leading-none">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-gray-600 font-medium text-center leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function RankingSection() {
  const [genderFilter, setGenderFilter] = useState<"전체" | "남성" | "여성">("전체");
  const [ageFilter, setAgeFilter] = useState<"20대" | "30대" | "40대">("20대");

  const { data: productsData } = useQuery({
    queryKey: ["/api/products/ranking", genderFilter, ageFilter],
    queryFn: async () => {
      let url = "/api/products?limit=10&sort=popular";
      if (genderFilter !== "전체") url += `&gender=${encodeURIComponent(genderFilter)}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 60000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["/api/brands"],
    queryFn: async () => {
      const res = await fetch("/api/brands?limit=200");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000,
  });

  const getBrandName = (brandId: string) => {
    const brand = (brandsData || []).find((b: any) => b.id === brandId);
    return brand?.name?.toUpperCase() || "";
  };

  const products: any[] = productsData || [];

  return (
    <section className="bg-white border-b border-gray-100" data-testid="ranking-section">
      <div className="px-4 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900">실시간 전체 랭킹 TOP 10</h2>
            <span className="text-lg">🏆</span>
          </div>
          <Link href="/ranking" className="text-xs text-gray-400 hover:text-gray-600 font-medium">
            더 보기
          </Link>
        </div>

        {/* Gender filter */}
        <div className="flex gap-2 mb-3">
          {(["전체", "남성", "여성"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setGenderFilter(g)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                genderFilter === g
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {g === "전체" ? "남성 랭킹" : g === "남성" ? "여성 랭킹" : "20대"}
            </button>
          ))}
          {(["20대", "30대", "40대"] as const).map((a) => (
            <button
              key={a}
              onClick={() => setAgeFilter(a)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                ageFilter === a
                  ? "bg-[#FF6100] text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {a}
            </button>
          ))}
        </div>

        {/* Product list */}
        <div className="space-y-0">
          {products.slice(0, 10).map((product: any, idx: number) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="flex items-center gap-3 py-3 border-b border-gray-50 hover:bg-gray-50 -mx-4 px-4 transition-colors"
              data-testid={`ranking-product-${product.id}`}
            >
              <span className={`text-base font-black w-6 text-center flex-shrink-0 ${idx < 3 ? "text-[#FF6100]" : "text-gray-300"}`}>
                {idx + 1}
              </span>
              <div className="w-14 h-14 flex-shrink-0 bg-gray-100 overflow-hidden rounded">
                <img
                  src={getProxiedImageUrl(product.imageUrl, "thumb")}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                  loading="lazy"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#FF6100] font-bold uppercase tracking-wide truncate">
                  {getBrandName(product.brandId)}
                </p>
                <p className="text-xs text-gray-700 line-clamp-2 leading-snug mt-0.5">{product.name}</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {Number(product.price).toLocaleString()}원
                </p>
              </div>
              {product.isNew && (
                <span className="flex-shrink-0 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TopBrandSection() {
  const { data: topBrandsData } = useQuery({
    queryKey: ["/api/brands/top"],
    queryFn: async () => {
      const res = await fetch("/api/brands/top?limit=12");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const brands: any[] = topBrandsData || [];
  if (brands.length === 0) return null;

  return (
    <section className="bg-white border-b border-gray-100 py-5" data-testid="top-brand-section">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">🔥 인기 브랜드</h2>
        <Link href="/brands" className="text-xs text-gray-400 hover:text-gray-600 font-medium">더 보기</Link>
      </div>
      <div className="grid grid-cols-4 gap-3 px-4">
        {brands.slice(0, 8).map((brand: any) => (
          <Link
            key={brand.id}
            href={`/products?brand=${encodeURIComponent(brand.id)}`}
            className="flex flex-col items-center group"
            data-testid={`top-brand-${brand.id}`}
          >
            <div className="w-full aspect-square bg-gray-50 border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center p-2 group-hover:border-[#FF6100] transition-colors">
              {brand.representativeImage ? (
                <img
                  src={getProxiedImageUrl(brand.representativeImage, "thumb")}
                  alt={brand.name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                  loading="lazy"
                />
              ) : (
                <span className="text-[9px] text-gray-400 text-center font-medium leading-tight">{brand.name}</span>
              )}
            </div>
            <span className="text-[10px] text-gray-500 mt-1.5 text-center font-medium truncate w-full group-hover:text-[#FF6100] transition-colors">
              {brand.name}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function NewProductsSection() {
  const { data: productsData } = useQuery({
    queryKey: ["/api/products/new-home"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=6&categoryId=new");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["/api/brands"],
    queryFn: async () => {
      const res = await fetch("/api/brands?limit=200");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000,
  });

  const products: any[] = productsData || [];
  if (products.length === 0) return null;

  const getBrandName = (brandId: string) => {
    const brand = (brandsData || []).find((b: any) => b.id === brandId);
    return brand?.name?.toUpperCase() || "";
  };

  return (
    <section className="bg-white border-b border-gray-100 py-5" data-testid="new-products-section">
      <div className="px-4 mb-3 flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">✨ 신상품</h2>
        <Link href="/products/new" className="text-xs text-gray-400 hover:text-gray-600 font-medium">더 보기</Link>
      </div>
      <div className="grid grid-cols-2 gap-px bg-gray-100">
        {products.slice(0, 6).map((product: any) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="bg-white group block"
            data-testid={`new-product-${product.id}`}
          >
            <div className="relative aspect-square bg-gray-50 overflow-hidden">
              <img
                src={getProxiedImageUrl(product.imageUrl, "medium")}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                loading="lazy"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                {product.isNew && (
                  <span className="bg-black text-white text-[10px] font-bold px-1.5 py-0.5">NEW</span>
                )}
                {product.isBest && (
                  <span className="bg-[#FF6100] text-white text-[10px] font-bold px-1.5 py-0.5">인기</span>
                )}
              </div>
            </div>
            <div className="p-3">
              <p className="text-[11px] text-[#FF6100] font-bold uppercase tracking-wide truncate">
                {getBrandName(product.brandId)}
              </p>
              <p className="text-xs text-gray-700 line-clamp-2 leading-snug mt-0.5">{product.name}</p>
              {product.discountPercent > 0 && (
                <p className="text-[10px] text-gray-400 line-through mt-1">
                  매장가 {Number(product.price).toLocaleString()}원대
                </p>
              )}
              <p className="text-sm font-bold text-gray-900 mt-0.5">
                즉시구매가 {Number(product.price).toLocaleString()}원
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ReviewsSection() {
  const { data: reviewsData } = useQuery({
    queryKey: ["/api/reviews/home"],
    queryFn: async () => {
      const res = await fetch("/api/reviews?limit=6&photoOnly=true");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 120000,
  });

  const reviews: any[] = reviewsData || [];
  if (reviews.length === 0) return null;

  const maskName = (name: string) => {
    if (!name) return "익명";
    if (name.length <= 2) return name[0] + "*";
    return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
  };

  return (
    <section className="bg-white border-b border-gray-100 py-5" data-testid="home-reviews-section">
      <div className="px-4 mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-gray-900">고객 리뷰</h2>
          <p className="text-[11px] text-gray-400 mt-0.5">실제 구매 고객의 솔직한 후기</p>
        </div>
        <Link href="/reviews" className="text-xs text-gray-400 hover:text-gray-600 font-medium">더 보기</Link>
      </div>
      <div className="flex gap-3 overflow-x-auto px-4 scrollbar-hide pb-1">
        {reviews.map((review: any, idx: number) => {
          const thumb = review.imageUrls?.[0] || review.imageUrl || review.productImageUrl;
          return (
            <Link
              key={review.id}
              href="/reviews"
              className="flex-shrink-0 w-40 group"
              data-testid={`home-review-${review.id}`}
            >
              <div className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden mb-2">
                {thumb ? (
                  <img
                    src={thumb}
                    alt="후기"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Star className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2">
                  <span className="text-3xl font-black text-white/90 leading-none drop-shadow">{idx + 1}</span>
                </div>
              </div>
              <div className="flex items-center gap-0.5 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`w-2.5 h-2.5 ${s <= (review.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-gray-700 line-clamp-2 leading-snug font-medium">
                {review.content || review.title}
              </p>
              <p className="text-[10px] text-gray-400 mt-1">{maskName(review.authorName)}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

function DynamicSections() {
  const { data: sections } = useQuery({
    queryKey: ["/api/content-sections", "homepage_product"],
    queryFn: async () => {
      const res = await fetch("/api/content-sections?sectionType=homepage_product");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["/api/brands"],
    queryFn: async () => {
      const res = await fetch("/api/brands?limit=200");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000,
  });

  const getBrandName = (brandId: string) => {
    const brand = (brandsData || []).find((b: any) => b.id === brandId);
    return brand?.name?.toUpperCase() || "";
  };

  if (!sections || sections.length === 0) return null;

  return (
    <>
      {sections.map((section: any) => {
        const moreLink = section.linkUrl || (section.categorySlug ? `/products/${section.categorySlug}` : "/products");
        return (
          <section key={section.id} className="bg-white border-b border-gray-100" data-testid={`section-${section.id}`}>
            {section.imageUrl && (
              <Link href={moreLink}>
                <img src={section.imageUrl} alt={section.title} className="w-full object-cover" />
              </Link>
            )}
            {section.products && section.products.length > 0 && (
              <div className="py-5">
                <div className="px-4 mb-3 flex items-center justify-between">
                  <h2 className="text-base font-bold text-gray-900">{section.title}</h2>
                  <Link href={moreLink} className="text-xs text-gray-400 hover:text-gray-600 font-medium">더 보기</Link>
                </div>
                <div className="grid grid-cols-2 gap-px bg-gray-100">
                  {section.products.slice(0, 4).map((product: any) => (
                    <Link
                      key={product.id}
                      href={`/product/${product.id}`}
                      className="bg-white group block"
                      data-testid={`section-product-${product.id}`}
                    >
                      <div className="aspect-square bg-gray-50 overflow-hidden relative">
                        <img
                          src={getProxiedImageUrl(product.imageUrl, "medium")}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                        {product.discountPercent > 0 && (
                          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                            {product.discountPercent}%
                          </span>
                        )}
                      </div>
                      <div className="p-3">
                        <p className="text-[11px] text-[#FF6100] font-bold uppercase truncate">{getBrandName(product.brandId)}</p>
                        <p className="text-xs text-gray-700 line-clamp-2 leading-snug mt-0.5">{product.name}</p>
                        <p className="text-sm font-bold text-gray-900 mt-0.5">{Number(product.price).toLocaleString()}원</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <Header />
      <main className="flex-1 max-w-[640px] w-full mx-auto bg-white">
        <MainBannerSlider />
        <QuickMenuSection />
        <RankingSection />
        <TopBrandSection />
        <NewProductsSection />
        <ReviewsSection />
        <DynamicSections />
      </main>
      <div className="max-w-[640px] w-full mx-auto">
        <Footer />
      </div>
      <FloatingButtons />
    </div>
  );
}
