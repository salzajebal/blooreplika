import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Star, ArrowUp, Trophy } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────
// Floating scroll-to-top button
// ─────────────────────────────────────────
function FloatingButtons() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const h = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed right-5 bottom-8 z-40">
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="w-11 h-11 bg-white border border-gray-300 rounded-full shadow-lg flex items-center justify-center text-gray-500 hover:border-gray-500 hover:text-gray-800 transition-all"
        data-testid="floating-scroll-top"
        aria-label="맨 위로"
      >
        <ArrowUp className="w-5 h-5" />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Hero banner slider
// ─────────────────────────────────────────
function MainBannerSlider() {
  const [current, setCurrent] = useState(0);
  const touchX = useRef(0);

  const { data: banners } = useQuery({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await fetch("/api/banners");
      const d = await res.json();
      return d.success ? d.data : [];
    },
  });

  const STATIC_BANNERS = [
    { imageUrl: "/bloo/banner_xmas.jpg", linkUrl: "/products", title: "", iw: 750, ih: 750 },
    { imageUrl: "/bloo/banner1.jpg",     linkUrl: "/products", title: "", iw: 1024, ih: 1024 },
    { imageUrl: "/bloo/banner2.jpg",     linkUrl: "/products", title: "", iw: 1080, ih: 1080 },
    { imageUrl: "/bloo/banner3.jpg",     linkUrl: "/products", title: "", iw: 750, ih: 750 },
    { imageUrl: "/bloo/banner4.jpg",     linkUrl: "/products", title: "", iw: 750, ih: 750 },
    { imageUrl: "/bloo/banner7.jpg",     linkUrl: "/products", title: "", iw: 750, ih: 750 },
    { imageUrl: "/bloo/banner8.jpg",     linkUrl: "/products", title: "", iw: 750, ih: 750 },
    { imageUrl: "/bloo/banner6.jpg",     linkUrl: "/products", title: "", iw: 840, ih: 430 },
    { imageUrl: "/bloo/banner5.jpg",     linkUrl: "/products", title: "", iw: 1920, ih: 596 },
  ];

  const displayList = (banners && banners.length > 0) ? banners : STATIC_BANNERS;

  const getPaddingBottom = (b: any) => {
    const iw = b?.iw ?? 16;
    const ih = b?.ih ?? 9;
    const ratio = (ih / iw) * 100;
    return `${Math.min(ratio, 85).toFixed(2)}%`;
  };

  useEffect(() => {
    if (displayList.length <= 1) return;
    const t = setInterval(() => setCurrent((p) => (p + 1) % displayList.length), 4000);
    return () => clearInterval(t);
  }, [displayList.length]);

  const curBanner = displayList[current] ?? displayList[0];

  return (
    <section
      className="relative w-full overflow-hidden"
      data-testid="main-banner"
      onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        const diff = touchX.current - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
          if (diff > 0) setCurrent((p) => (p + 1) % displayList.length);
          else setCurrent((p) => (p === 0 ? displayList.length - 1 : p - 1));
        }
      }}
    >
      {/* 현재 슬라이드 비율로 높이 확보 (invisible) */}
      <img
        src={curBanner.imageUrl}
        alt=""
        aria-hidden="true"
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          maxHeight: "clamp(180px, 31vw, 420px)",
          objectFit: "cover",
          visibility: "hidden",
        }}
      />

      {/* 실제 슬라이드 이미지들 (absolute fade) */}
      {displayList.map((b: any, i: number) => (
        <Link
          key={i}
          href={b.linkUrl || "/products"}
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: i === current ? 1 : 0,
            transition: "opacity 0.6s ease-in-out",
            pointerEvents: i === current ? "auto" : "none",
            display: "block",
            overflow: "hidden",
          }}
          aria-label={b.title || `배너 ${i + 1}`}
        >
          <img
            src={b.imageUrl}
            alt={b.title || `배너 ${i + 1}`}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "50% 50%",
            }}
          />
        </Link>
      ))}

      {displayList.length > 1 && (
        <>
          <button
            onClick={() => setCurrent((p) => (p === 0 ? displayList.length - 1 : p - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow z-10"
            aria-label="이전"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={() => setCurrent((p) => (p + 1) % displayList.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow z-10"
            aria-label="다음"
          >
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {displayList.map((_: any, i: number) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ─────────────────────────────────────────
// Category carousel (BLOO style: 7 items, 5 visible, arrows)
// ─────────────────────────────────────────
const ALL_CATEGORIES = [
  {
    label: "남성 의류",
    path: "/products?gender=%EB%82%A8%EC%84%B1&category=%EC%9D%98%EB%A5%98",
    img: "/bloo/cat_m1.jpg",
  },
  {
    label: "남성 가방",
    path: "/products?gender=%EB%82%A8%EC%84%B1&category=%EA%B0%80%EB%B0%A9",
    img: "/bloo/cat_m2.jpg",
  },
  {
    label: "남성 신발",
    path: "/products?gender=%EB%82%A8%EC%84%B1&category=%EC%8B%A0%EB%B0%9C",
    img: "/bloo/cat_m3.jpg",
  },
  {
    label: "남성 패션 잡화",
    path: "/products?gender=%EB%82%A8%EC%84%B1&category=%EC%9E%A1%ED%99%94",
    img: "/bloo/cat_m4.jpg",
  },
  {
    label: "시계관",
    path: "/products/watches",
    img: "/bloo/cat_m5.jpg",
  },
  {
    label: "여성 의류",
    path: "/products?gender=%EC%97%AC%EC%84%B1&category=%EC%9D%98%EB%A5%98",
    img: "/bloo/cat_w1.jpg",
  },
  {
    label: "여성 가방",
    path: "/products?gender=%EC%97%AC%EC%84%B1&category=%EA%B0%80%EB%B0%A9",
    img: "/bloo/cat_w2.jpg",
  },
];

function CategoryCarousel() {
  const [offset, setOffset] = useState(0);
  const visible = 5;
  const max = ALL_CATEGORIES.length - visible;

  const prev = () => setOffset((o) => Math.max(0, o - 1));
  const next = () => setOffset((o) => Math.min(max, o + 1));

  return (
    <section className="bg-white py-6 border-b border-gray-100" data-testid="category-grid">
      <div className="max-w-[1280px] mx-auto px-5 relative">
        {/* Left arrow */}
        {offset > 0 && (
          <button
            onClick={prev}
            className="absolute left-0 top-[calc(50%-28px)] z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="이전"
            data-testid="cat-prev"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
        )}

        {/* Carousel track */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-in-out gap-3"
            style={{ transform: `translateX(calc(-${offset} * (100% / ${visible}) - ${offset} * 12px / ${visible}))` }}
          >
            {ALL_CATEGORIES.map((cat, i) => (
              <Link
                key={i}
                href={cat.path}
                className="flex flex-col items-center group flex-shrink-0"
                style={{ width: `calc((100% - ${(visible - 1) * 12}px) / ${visible})` }}
                data-testid={`cat-item-${i}`}
              >
                <div
                  className="w-full rounded-2xl overflow-hidden"
                  style={{
                    position: "relative",
                    paddingBottom: "100%",
                    backgroundImage: `url(${cat.img})`,
                    backgroundSize: "cover",
                    backgroundPosition: "50% 50%",
                    backgroundRepeat: "no-repeat",
                    backgroundColor: "#dddddd",
                  }}
                />
                <span className="mt-2 text-[13px] font-medium text-gray-800 text-center whitespace-nowrap">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Right arrow */}
        {offset < max && (
          <button
            onClick={next}
            className="absolute right-0 top-[calc(50%-28px)] z-10 w-8 h-8 bg-white border border-gray-200 rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition-colors"
            aria-label="다음"
            data-testid="cat-next"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Celebrity's dress (static + magazine data)
// ─────────────────────────────────────────
const CELEB_PLACEHOLDER = [
  {
    photo: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=400&q=80",
    brand: "Miu Miu",
    product: "미우미우 크로코 미니 숄더백",
    price: "365,000",
    productImg: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=120&q=80",
  },
  {
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
    brand: "BVLGARI",
    product: "불가리 세르펜티 실버 목걸이",
    price: "195,000",
    productImg: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=120&q=80",
  },
  {
    photo: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&q=80",
    brand: "Christian Dior",
    product: "디올 x 테니스 점프 자켓",
    price: "224,000",
    productImg: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=120&q=80",
  },
  {
    photo: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&q=80",
    brand: "GUCCI",
    product: "구찌 다이아나 집업 GG 토트백",
    price: "416,000",
    productImg: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=120&q=80",
  },
  {
    photo: "https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=400&q=80",
    brand: "Louis Vuitton",
    product: "루이비통 모노그램 네버풀 MM",
    price: "520,000",
    productImg: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=120&q=80",
  },
];

function CelebritySection() {
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchX = useRef(0);
  const total = CELEB_PLACEHOLDER.length;
  const visible = 4;

  const canPrev = current > 0;
  const canNext = current < total - visible;

  const scrollTo = (idx: number) => {
    setCurrent(Math.max(0, Math.min(idx, total - visible)));
  };

  return (
    <section className="bg-white py-10 border-b border-gray-100" data-testid="celebrity-section">
      <div className="max-w-[1280px] mx-auto px-5">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Celebrity's dress
          </h2>
          <p className="text-sm text-gray-400 mt-1">#브랜드 앰버서더</p>
        </div>
        <div className="relative">
          {/* Prev button */}
          {canPrev && (
            <button
              onClick={() => scrollTo(current - 1)}
              className="absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:shadow-md transition-shadow"
              aria-label="이전"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          {/* Cards */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-400 ease-in-out gap-3"
              style={{ transform: `translateX(calc(-${current * (100 / visible)}% - ${current * 12 / visible}px))` }}
              onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
              onTouchEnd={(e) => {
                const diff = touchX.current - e.changedTouches[0].clientX;
                if (diff > 50) scrollTo(current + 1);
                else if (diff < -50) scrollTo(current - 1);
              }}
            >
              {CELEB_PLACEHOLDER.map((celeb, i) => (
                <Link
                  key={i}
                  href="/celeb"
                  className="flex-shrink-0 group cursor-pointer"
                  style={{ width: `calc(${100 / visible}% - 9px)` }}
                  data-testid={`celeb-card-${i}`}
                >
                  <div className="relative overflow-hidden rounded-lg bg-gray-100" style={{ aspectRatio: "3/4" }}>
                    <img
                      src={celeb.photo}
                      alt={celeb.brand}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
                      loading="lazy"
                    />
                    {/* Brand badge */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 rounded text-xs font-bold text-gray-800 uppercase tracking-wide">
                      {celeb.brand}
                    </div>
                    {/* Product info overlay at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm p-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={celeb.productImg}
                          alt={celeb.product}
                          className="w-10 h-10 object-cover rounded border border-gray-200 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] text-gray-600 truncate">{celeb.product}</p>
                          <p className="text-[13px] font-bold text-gray-900">{celeb.price}원</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          {/* Next button */}
          {canNext && (
            <button
              onClick={() => scrollTo(current + 1)}
              className="absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:shadow-md transition-shadow"
              aria-label="다음"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        {/* Dot indicators */}
        <div className="flex justify-center gap-1.5 mt-5">
          {Array.from({ length: total - visible + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              className={`h-2 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-gray-800" : "w-2 bg-gray-300"}`}
              aria-label={`${i + 1}번째`}
            />
          ))}
        </div>

        {/* 보러가기 button */}
        <div className="flex justify-center mt-6">
          <Link
            href="/celeb"
            className="px-12 py-3 border border-gray-300 text-sm font-medium text-gray-700 hover:border-gray-800 hover:text-gray-900 transition-colors rounded-sm"
            data-testid="celeb-more-btn"
          >
            보러가기
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Ranking section
// ─────────────────────────────────────────
function RankingSection() {
  const [tab, setTab] = useState<"남성" | "여성">("남성");

  const { data: rankingData, isLoading } = useQuery({
    queryKey: ["/api/ranking-items", tab],
    queryFn: async () => {
      const res = await fetch(`/api/ranking-items?gender=${encodeURIComponent(tab)}`);
      const d = await res.json();
      return d.success ? d.data : [];
    },
    staleTime: 60000,
  });

  const items: any[] = rankingData || [];

  return (
    <section className="bg-white border-b border-gray-100 py-8" data-testid="ranking-section">
      <div className="max-w-[1280px] mx-auto px-5">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#060133]" />
            <h2 className="text-xl font-bold text-gray-900">실시간 랭킹 TOP 10</h2>
          </div>
          <Link href="/ranking" className="text-sm text-gray-400 hover:text-gray-700 font-medium">
            전체보기 →
          </Link>
        </div>

        {/* Tab */}
        <div className="flex gap-0 border-b border-gray-200 mb-5 w-fit">
          {(["남성", "여성"] as const).map((g) => (
            <button
              key={g}
              onClick={() => setTab(g)}
              className={`px-6 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
                tab === g ? "border-[#060133] text-[#060133]" : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
              data-testid={`home-ranking-tab-${g}`}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-lg mb-3" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-1.5" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-300 text-sm">어드민에서 랭킹 상품을 설정해주세요.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {items.slice(0, 10).map((item: any, idx: number) => {
              const product = item.product;
              if (!product) return null;
              return (
                <Link
                  key={item.id}
                  href={`/product/${product.id}`}
                  className="group"
                  data-testid={`ranking-product-${product.id}`}
                >
                  <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2.5 border border-gray-100">
                    <img
                      src={getProxiedImageUrl(product.imageUrl, "medium")}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                      loading="lazy"
                    />
                    <div className={`absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${
                      idx === 0 ? "bg-[#060133] text-white" : idx < 3 ? "bg-gray-800 text-white" : "bg-white/90 text-gray-400 border border-gray-200"
                    }`}>
                      {item.rank}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 truncate">{product.brandName || ""}</p>
                  <p className="text-[13px] text-gray-800 line-clamp-2 leading-snug">{product.name}</p>
                  <p className="text-sm font-bold text-gray-900 mt-1">{Number(product.price).toLocaleString()}원</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// New products section
// ─────────────────────────────────────────
function NewProductsSection() {
  const { data: productsData } = useQuery({
    queryKey: ["/api/products/new-home"],
    queryFn: async () => {
      const res = await fetch("/api/products?limit=10&categoryId=new");
      const d = await res.json();
      return d.success ? d.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["/api/brands"],
    queryFn: async () => {
      const res = await fetch("/api/brands?limit=200");
      const d = await res.json();
      return d.success ? d.data : [];
    },
    staleTime: 600000,
  });

  const products: any[] = productsData || [];
  if (products.length === 0) return null;

  const getBrandName = (brandId: string) => {
    const b = (brandsData || []).find((b: any) => b.id === brandId);
    return b?.name?.toUpperCase() || "";
  };

  return (
    <section className="bg-white border-b border-gray-100 py-8" data-testid="new-products-section">
      <div className="max-w-[1280px] mx-auto px-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">✨ 신상품</h2>
          <Link href="/products/new" className="text-sm text-gray-400 hover:text-gray-700 font-medium">
            전체보기 →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {products.slice(0, 10).map((product: any) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              className="group"
              data-testid={`new-product-${product.id}`}
            >
              <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2.5 border border-gray-100">
                <img
                  src={getProxiedImageUrl(product.imageUrl, "medium")}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                  loading="lazy"
                />
                <div className="absolute top-2 left-2 flex gap-1">
                  {product.isNew && <span className="bg-[#060133] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">NEW</span>}
                  {product.isBest && <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">인기</span>}
                </div>
                {product.discountPercent > 0 && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                    {product.discountPercent}%
                  </div>
                )}
              </div>
              <p className="text-[11px] text-[#060133] font-bold uppercase tracking-wide truncate">{getBrandName(product.brandId)}</p>
              <p className="text-[13px] text-gray-800 line-clamp-2 leading-snug mt-0.5">{product.name}</p>
              <p className="text-sm font-bold text-gray-900 mt-1">
                {Number(product.price).toLocaleString()}원
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Popular brands
// ─────────────────────────────────────────
function TopBrandSection() {
  const { data: topBrandsData } = useQuery({
    queryKey: ["/api/brands/top"],
    queryFn: async () => {
      const res = await fetch("/api/brands/top?limit=12");
      const d = await res.json();
      return d.success ? d.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const brands: any[] = topBrandsData || [];
  if (brands.length === 0) return null;

  return (
    <section className="bg-white border-b border-gray-100 py-8" data-testid="top-brand-section">
      <div className="max-w-[1280px] mx-auto px-5">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900">🔥 인기 브랜드</h2>
          <Link href="/brands" className="text-sm text-gray-400 hover:text-gray-700 font-medium">전체보기 →</Link>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {brands.slice(0, 16).map((brand: any) => (
            <Link
              key={brand.id}
              href={`/products?brand=${encodeURIComponent(brand.id)}`}
              className="flex flex-col items-center group"
              data-testid={`top-brand-${brand.id}`}
            >
              <div className="w-full aspect-square bg-white border border-gray-200 rounded-xl overflow-hidden flex items-center justify-center p-2 group-hover:border-[#060133] group-hover:shadow-sm transition-all">
                {brand.representativeImage ? (
                  <img
                    src={getProxiedImageUrl(brand.representativeImage, "thumb")}
                    alt={brand.name}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    loading="lazy"
                  />
                ) : (
                  <span className="text-[8px] text-gray-400 text-center font-medium leading-tight">{brand.name}</span>
                )}
              </div>
              <span className="text-[10px] text-gray-500 mt-1.5 text-center font-medium truncate w-full group-hover:text-[#060133] transition-colors">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Reviews section
// ─────────────────────────────────────────
function ReviewsSection() {
  const { data: reviewsData } = useQuery({
    queryKey: ["/api/reviews/home"],
    queryFn: async () => {
      const res = await fetch("/api/reviews?limit=8&photoOnly=true");
      const d = await res.json();
      return d.success ? d.data : [];
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
    <section className="bg-white border-b border-gray-100 py-8" data-testid="home-reviews-section">
      <div className="max-w-[1280px] mx-auto px-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold text-gray-900">고객 리뷰</h2>
            <p className="text-sm text-gray-400 mt-0.5">실제 구매 고객의 솔직한 후기</p>
          </div>
          <Link href="/reviews" className="text-sm text-gray-400 hover:text-gray-700 font-medium">전체보기 →</Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3">
          {reviews.map((review: any, idx: number) => {
            const thumb = review.imageUrls?.[0] || review.imageUrl || review.productImageUrl;
            return (
              <Link
                key={review.id}
                href="/reviews"
                className="group"
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
                    <span className="text-2xl font-black text-white/80 leading-none drop-shadow">{idx + 1}</span>
                  </div>
                </div>
                <div className="flex items-center gap-0.5 mb-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className={`w-2.5 h-2.5 ${s <= (review.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <p className="text-[12px] text-gray-700 line-clamp-2 leading-snug font-medium">{review.content || review.title}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{maskName(review.authorName)}</p>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────
// Dynamic CMS sections
// ─────────────────────────────────────────
function DynamicSections() {
  const { data: sections } = useQuery({
    queryKey: ["/api/content-sections", "homepage_product"],
    queryFn: async () => {
      const res = await fetch("/api/content-sections?sectionType=homepage_product");
      const d = await res.json();
      return d.success ? d.data : [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["/api/brands"],
    queryFn: async () => {
      const res = await fetch("/api/brands?limit=200");
      const d = await res.json();
      return d.success ? d.data : [];
    },
    staleTime: 600000,
  });

  const getBrandName = (brandId: string) => {
    const b = (brandsData || []).find((b: any) => b.id === brandId);
    return b?.name?.toUpperCase() || "";
  };

  if (!sections || sections.length === 0) return null;

  return (
    <>
      {sections.map((section: any) => {
        const moreLink = section.linkUrl || (section.categorySlug ? `/products/${section.categorySlug}` : "/products");
        return (
          <section key={section.id} className="bg-white border-b border-gray-100 py-8" data-testid={`section-${section.id}`}>
            <div className="max-w-[1280px] mx-auto px-5">
              {section.imageUrl && (
                <Link href={moreLink}>
                  <img src={section.imageUrl} alt={section.title} className="w-full object-cover rounded-xl mb-5" />
                </Link>
              )}
              {section.products && section.products.length > 0 && (
                <>
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
                    <Link href={moreLink} className="text-sm text-gray-400 hover:text-gray-700 font-medium">전체보기 →</Link>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                    {section.products.slice(0, 10).map((product: any) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        className="group"
                        data-testid={`section-product-${product.id}`}
                      >
                        <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2.5 border border-gray-100">
                          <img
                            src={getProxiedImageUrl(product.imageUrl, "medium")}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                          />
                          {product.discountPercent > 0 && (
                            <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm">
                              {product.discountPercent}%
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#060133] font-bold uppercase truncate">{getBrandName(product.brandId)}</p>
                        <p className="text-[13px] text-gray-800 line-clamp-2 leading-snug mt-0.5">{product.name}</p>
                        <p className="text-sm font-bold text-gray-900 mt-1">{Number(product.price).toLocaleString()}원</p>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })}
    </>
  );
}

// ─────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />
      <main className="bg-white">
        <MainBannerSlider />
        <CategoryCarousel />
        <CelebritySection />
        <RankingSection />
        <NewProductsSection />
        <TopBrandSection />
        <ReviewsSection />
        <DynamicSections />
      </main>
      <Footer />
      <FloatingButtons />
    </div>
  );
}
