import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Star, ArrowUp, Trophy } from "lucide-react";
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

const CATEGORY_STRIP_ITEMS = [
  {
    label: "남성",
    path: "/products?gender=%EB%82%A8%EC%84%B1",
    image: "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=300&q=80",
  },
  {
    label: "여성",
    path: "/products?gender=%EC%97%AC%EC%84%B1",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&q=80",
  },
  {
    label: "SHOP",
    path: "/products",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&q=80",
  },
  {
    label: "랭킹",
    path: "/ranking",
    image: null,
    gradient: "linear-gradient(160deg, #7b4f00 0%, #c9860a 45%, #f5c842 100%)",
    rankingCard: true,
  },
  {
    label: "리뷰",
    path: "/reviews",
    image: null,
    gradient: "linear-gradient(135deg, #FF6100 0%, #ff9a3c 40%, #e91e8c 100%)",
  },
];

function CategoryStripSection() {
  return (
    <section className="bg-white border-b border-gray-100 py-4" data-testid="category-strip-section">
      <div className="flex justify-around px-2">
        {CATEGORY_STRIP_ITEMS.map((item: any, idx) => (
          <Link
            key={idx}
            href={item.path}
            className="flex flex-col items-center gap-2 touch-manipulation"
            data-testid={`category-strip-${idx}`}
          >
            <div
              className="relative rounded-full overflow-hidden"
              style={{
                width: 60,
                height: 60,
                border: "2px solid #e8e8e8",
              }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt={item.label}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div
                  className="absolute inset-0"
                  style={{ background: item.gradient }}
                />
              )}
              {item.label === "리뷰" && (
                <>
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Star className="w-5 h-5 fill-white text-white drop-shadow" />
                  </div>
                </>
              )}
              {item.rankingCard && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl drop-shadow-lg">🏆</span>
                </div>
              )}
            </div>
            <span className="text-[11px] font-semibold text-[#111] tracking-tight">{item.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

// 브랜드 이름 → ID 매핑 헬퍼
function findBrandId(brands: any[], keywords: string[]): string | null {
  for (const kw of keywords) {
    const found = brands.find((b: any) =>
      b.name?.toLowerCase().replace(/\s/g, "").includes(kw.toLowerCase().replace(/\s/g, ""))
    );
    if (found) return found.id;
  }
  return null;
}

function RankingSection() {
  const [tab, setTab] = useState<"남성" | "여성">("남성");

  const { data: rankingData, isLoading } = useQuery({
    queryKey: ["/api/ranking-items", tab],
    queryFn: async () => {
      const res = await fetch(`/api/ranking-items?gender=${encodeURIComponent(tab)}`);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 60000,
  });

  const items: any[] = rankingData || [];
  const hasData = items.length > 0;

  return (
    <section className="bg-white border-b border-gray-100" data-testid="ranking-section">
      <div className="px-4 py-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FF6100]" />
            <h2 className="text-base font-bold text-gray-900">실시간 랭킹 TOP 10</h2>
          </div>
          <Link href="/ranking" className="text-xs text-gray-400 hover:text-gray-600 font-medium">
            더 보기
          </Link>
        </div>

        {/* 남성 / 여성 탭 */}
        <div className="flex border-b border-gray-100 mb-4 -mx-4 px-4">
          {(["남성", "여성"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setTab(g)}
              className={`flex-1 pb-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === g
                  ? "border-black text-black"
                  : "border-transparent text-gray-300 hover:text-gray-500"
              }`}
              data-testid={`home-ranking-tab-${g}`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* 상품 리스트 */}
        <div>
          {isLoading ? (
            <div className="space-y-0">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 animate-pulse">
                  <div className="w-6 h-5 bg-gray-100 rounded flex-shrink-0" />
                  <div className="w-14 h-14 bg-gray-100 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 bg-gray-100 rounded w-16" />
                    <div className="h-3 bg-gray-100 rounded w-full" />
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : !hasData ? (
            <div className="py-8 text-center text-gray-300 text-sm">
              어드민에서 랭킹 상품을 설정해주세요.
            </div>
          ) : (
            items.map((item: any, idx: number) => {
              const product = item.product;
              if (!product) return null;
              return (
                <Link
                  key={item.id}
                  href={`/product/${product.id}`}
                  className="flex items-center gap-3 py-3 border-b border-gray-50 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                  data-testid={`ranking-product-${product.id}`}
                >
                  <span className={`text-base font-black w-6 text-center flex-shrink-0 ${
                    idx === 0 ? "text-[#FF6100]" : idx < 3 ? "text-gray-500" : "text-gray-200"
                  }`}>
                    {item.rank}
                  </span>
                  <div className="w-14 h-14 flex-shrink-0 bg-gray-50 overflow-hidden rounded border border-gray-100">
                    <img
                      src={getProxiedImageUrl(product.imageUrl, "thumb")}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                      loading="lazy"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-700 line-clamp-2 leading-snug">{product.name}</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {Number(product.price).toLocaleString()}원
                    </p>
                  </div>
                  {idx === 0 && (
                    <span className="flex-shrink-0 bg-[#FF6100] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                      1위
                    </span>
                  )}
                </Link>
              );
            })
          )}
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
        <CategoryStripSection />
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
