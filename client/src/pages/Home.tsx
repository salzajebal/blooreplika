import { Header } from "@/components/layout/Header";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ArrowUp, Star } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef } from "react";

// ─────────────────────────────────────────────────────────────
// Floating scroll-to-top
// ─────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// Main Banner Slider
// ─────────────────────────────────────────────────────────────
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
    { imageUrl: "/bloo/banner_review_event.jpg", linkUrl: "/reviews",              title: "", pos: "50% 50%" },
    { imageUrl: "/bloo/banner_app.jpg",          linkUrl: "/products",             title: "", pos: "50% 50%" },
    { imageUrl: "/bloo/banner_carrier.jpg",      linkUrl: "/products",             title: "", pos: "50% 50%" },
    { imageUrl: "/bloo/banner_acc.jpg",          linkUrl: "/products/accessories", title: "", pos: "50% 50%" },
    { imageUrl: "/bloo/banner_xmas.jpg",         linkUrl: "/products",             title: "", pos: "50% 50%" },
  ];

  const displayList = (banners && banners.length > 0) ? banners : STATIC_BANNERS;

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
      <img
        src={curBanner.imageUrl}
        alt=""
        aria-hidden="true"
        style={{ display: "block", width: "100%", height: "auto", visibility: "hidden" }}
      />
      {displayList.map((b: any, i: number) => (
        <Link
          key={i}
          href={b.linkUrl || "/products"}
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: i === current ? 1 : 0, transition: "opacity 0.6s ease-in-out", pointerEvents: i === current ? "auto" : "none", display: "block", overflow: "hidden" }}
          aria-label={b.title || `배너 ${i + 1}`}
        >
          <img
            src={b.imageUrl}
            alt={b.title || `배너 ${i + 1}`}
            style={{ display: "block", width: "100%", height: "100%", objectFit: "cover", objectPosition: b.pos || "50% 50%" }}
          />
        </Link>
      ))}
      {displayList.length > 1 && (
        <>
          <button onClick={() => setCurrent((p) => (p === 0 ? displayList.length - 1 : p - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow z-10" aria-label="이전">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button onClick={() => setCurrent((p) => (p + 1) % displayList.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow z-10" aria-label="다음">
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {displayList.map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-6 bg-white" : "w-1.5 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Category Image Map — bloostore1.co.kr 파싱 (1800×600 이미지)
// 2행 × 5열 카테고리 카드 (남성의류 ~ 캐리어)
// ─────────────────────────────────────────────────────────────

// 각 cell: 이미지 내 위치(%) + 이동 URL
// 원본 1800×600 분석 결과 기반 (display 1250px 환산)
const CAT_CARD_ROWS: { label: string; href: string; left: number; top: number; width: number; height: number }[][] = [
  // Row 1
  [
    { label: "남성의류",   href: "/httpstheblooshop1496458051",   left:  2.1, top: 3,  width: 11.0, height: 45 },
    { label: "시계관",    href: "/products/watches",              left: 13.2, top: 3,  width: 11.0, height: 45 },
    { label: "여성",      href: "/537",                           left: 24.8, top: 3,  width: 10.6, height: 45 },
    { label: "남성신발",   href: "/220",                          left: 36.2, top: 3,  width: 10.4, height: 45 },
    { label: "시계",      href: "/products/watches",              left: 47.6, top: 3,  width: 10.7, height: 45 },
  ],
  // Row 2
  [
    { label: "골프",      href: "/products/golf",                 left:  1.9, top: 51, width: 11.0, height: 45 },
    { label: "패션잡화",   href: "/26",                           left: 13.2, top: 51, width: 10.8, height: 45 },
    { label: "여성가방",   href: "/1447",                         left: 24.6, top: 51, width: 10.6, height: 45 },
    { label: "캐리어",    href: "/products?search=%EC%BA%90%EB%A6%AC%EC%96%B4", left: 36.0, top: 51, width: 10.6, height: 45 },
    { label: "",          href: "",                                left: 47.4, top: 51, width: 10.6, height: 45 },
  ],
];

function CategoryGrid() {
  return (
    <section className="bg-white py-0 border-b border-gray-100" data-testid="category-grid">
      <div className="w-full max-w-[1250px] mx-auto">
        <div className="relative w-full" style={{ paddingBottom: "33.33%" }}>
          <img
            src="/bloo/categories/cat_cards_1800x600.jpg"
            alt="카테고리"
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
          {CAT_CARD_ROWS.flat().map((cell, idx) =>
            cell.href ? (
              <Link
                key={idx}
                href={cell.href}
                data-testid={`cat-card-${idx}`}
                aria-label={cell.label}
                style={{
                  position: "absolute",
                  left: `${cell.left}%`,
                  top: `${cell.top}%`,
                  width: `${cell.width}%`,
                  height: `${cell.height}%`,
                  cursor: "pointer",
                }}
              />
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Celebrity's dress — bloostore1.co.kr gallery2 파싱 (10개 항목)
// 순서: 3개 신규(20240404) + 7개 기존(20240119)
// ─────────────────────────────────────────────────────────────
const BP = (url: string) => `/api/bloostore-image-proxy?url=${encodeURIComponent(url)}`;
const CELEBS_DATA = [
  {
    id: "new1",
    brand: "MIU MIU",
    photo: BP("https://cdn.imweb.me/thumbnail/20240404/4bab66d882d51.jpg"),
    href: "/products?brand=Miu+Miu",
    product: null,
  },
  {
    id: "new2",
    brand: "BVLGARI",
    photo: BP("https://cdn.imweb.me/thumbnail/20240404/b3fb45dfb10e9.jpg"),
    href: "/products?brand=Bvlgari",
    product: null,
  },
  {
    id: "new3",
    brand: "DIOR",
    photo: BP("https://cdn.imweb.me/thumbnail/20240404/514ae7ccc23c6.jpg"),
    href: "/products?brand=Dior",
    product: null,
  },
  {
    id: 755,
    brand: "DIOR",
    photo: BP("https://cdn.imweb.me/thumbnail/20240119/f4e30050baf84.jpg"),
    href: "/products?brand=Dior",
    product: {
      name: "디올 Hit the road 미니 백 블랙",
      price: 345000,
      image: BP("https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/3d5a8e626aa0e.jpg?w=800"),
    },
  },
  {
    id: "no5",
    brand: "HERMÈS",
    photo: BP("https://cdn.imweb.me/thumbnail/20240119/1682c785bcd96.jpg"),
    href: "/products?brand=Hermes",
    product: null,
  },
  {
    id: 147,
    brand: "GUCCI",
    photo: BP("https://cdn.imweb.me/thumbnail/20240119/ae2ab38846f74.jpg"),
    href: "/products?brand=Gucci",
    product: {
      name: "구찌 오피디아 GG 스몰 벨트백",
      price: 325000,
      image: BP("https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/afa4652b5f337.jpg?w=800"),
    },
  },
  {
    id: 819,
    brand: "CELINE",
    photo: BP("https://cdn.imweb.me/thumbnail/20240119/290bb5a1ff8c6.jpg"),
    href: "/products?brand=Celine",
    product: {
      name: "셀린느 화이트 레터링 로고 후드 스웨트",
      price: 195000,
      image: BP("https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/5656c7a997074.png?w=800"),
    },
  },
  {
    id: 836,
    brand: "LOUIS VUITTON",
    photo: BP("https://cdn.imweb.me/thumbnail/20240119/76fe623fa90e4.jpg"),
    href: "/products?brand=Louis+Vuitton",
    product: {
      name: "루이비통 키폴 반둘리에 55 M41414",
      price: 496000,
      image: BP("https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/9b7be9f289df8.jpg?w=800"),
    },
  },
  {
    id: 868,
    brand: "DIOR",
    photo: BP("https://cdn.imweb.me/thumbnail/20240119/5d8d0741241f5.jpg"),
    href: "/products?brand=Dior",
    product: {
      name: "디올 B27 하이탑 스니커즈 화이트",
      price: 259000,
      image: BP("https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/7c4747cfdb79e.gif?w=800"),
    },
  },
  {
    id: 771,
    brand: "CELINE",
    photo: BP("https://cdn.imweb.me/thumbnail/20240119/68c3d85ce45bc.jpg"),
    href: "/products?brand=Celine",
    product: {
      name: "셀린느 유니언 워시 데님 트러커 자켓",
      price: 259000,
      image: BP("https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/8a0b32c249e74.jpg?w=800"),
    },
  },
];

function CelebritySection() {
  const [current, setCurrent] = useState(0);
  const touchX = useRef(0);
  const visible = 4;
  const total = CELEBS_DATA.length;
  const maxStart = Math.max(0, total - visible);
  const canPrev = current > 0;
  const canNext = current < maxStart;

  return (
    <section className="bg-white py-10 border-b border-gray-100" data-testid="celebrity-section">
      <div className="max-w-[1250px] mx-auto px-5">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>
            Celebrity's dress
          </h2>
          <p className="text-sm text-gray-400 mt-1">#브랜드 엠버서더</p>
        </div>

        <div className="relative">
          {canPrev && (
            <button
              onClick={() => setCurrent(c => c - 1)}
              className="absolute -left-5 top-[40%] z-10 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:shadow-md"
              aria-label="이전"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
          )}
          <div
            className="overflow-hidden"
            onTouchStart={(e) => { touchX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              const diff = touchX.current - e.changedTouches[0].clientX;
              if (diff > 50 && canNext) setCurrent(c => c + 1);
              else if (diff < -50 && canPrev) setCurrent(c => c - 1);
            }}
          >
            <div
              className="flex gap-[5px] transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(calc(-${current * (100 / visible)}% - ${current * 5 / visible}px))` }}
            >
              {CELEBS_DATA.map((celeb) => (
                <Link
                  key={String(celeb.id)}
                  href={celeb.href}
                  className="flex-shrink-0 group block border border-gray-100 overflow-hidden"
                  style={{ width: `calc(${100 / visible}% - 4px)` }}
                  data-testid={`celeb-card-${celeb.id}`}
                >
                  <div className="relative overflow-hidden bg-gray-100" style={{ aspectRatio: "3/4" }}>
                    <img
                      src={celeb.photo}
                      alt={celeb.brand}
                      className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    {celeb.brand && (
                      <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-0.5 text-[9px] font-bold text-gray-900 tracking-widest">
                        {celeb.brand}
                      </div>
                    )}
                  </div>
                  {celeb.product ? (
                    <div className="flex items-center gap-2 p-2 bg-white border-t border-gray-100">
                      <img
                        src={celeb.product.image}
                        alt={celeb.product.name}
                        className="w-12 h-12 object-cover flex-shrink-0 bg-gray-50"
                        loading="lazy"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] text-gray-400 font-medium tracking-wider uppercase mb-0.5">{celeb.brand}</p>
                        <p className="text-[11px] text-gray-800 leading-tight line-clamp-2 group-hover:text-black">{celeb.product.name}</p>
                        <p className="text-[12px] font-semibold text-gray-900 mt-0.5">{celeb.product.price.toLocaleString()}원</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  ) : (
                    <div className="px-2 py-2 bg-white border-t border-gray-100">
                      <p className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">{celeb.brand}</p>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
          {canNext && (
            <button
              onClick={() => setCurrent(c => c + 1)}
              className="absolute -right-5 top-[40%] z-10 w-9 h-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow hover:shadow-md"
              aria-label="다음"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>

        <div className="flex justify-center gap-2 mt-5">
          {Array.from({ length: maxStart + 1 }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-1.5 rounded-full transition-all ${i === current ? "w-6 bg-gray-800" : "w-1.5 bg-gray-300"}`}
            />
          ))}
        </div>

        <div className="flex justify-center mt-8">
          <Link
            href="/celeb"
            className="px-16 py-3 bg-black text-white text-sm font-medium tracking-wide hover:bg-gray-800 transition-colors"
            data-testid="celeb-more-btn"
          >
            보러가기
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Mid-page wide promotional banner
// ─────────────────────────────────────────────────────────────
interface WideBannerProps {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  href?: string;
  objectPos?: string;
  height?: string;
  overlayDark?: boolean;
}

function WideBanner({ imageUrl, title, subtitle, buttonText, href = "/products", objectPos = "50% 50%", height = "clamp(200px, 28vw, 340px)", overlayDark = true }: WideBannerProps) {
  return (
    <div className="relative w-full overflow-hidden" style={{ height }} data-testid="wide-banner">
      <img src={imageUrl} alt={title || ""} className="w-full h-full object-cover" style={{ objectPosition: objectPos }} />
      {(title || subtitle || buttonText) && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center text-center px-4 ${overlayDark ? "bg-black/20" : ""}`}>
          {subtitle && <p className="text-white text-sm font-medium mb-1 drop-shadow-lg">{subtitle}</p>}
          {title && <p className="text-white text-3xl md:text-4xl font-black drop-shadow-lg leading-tight mb-3">{title}</p>}
          {buttonText && (
            <Link href={href} className="mt-2 px-8 py-2.5 bg-black text-white text-sm font-medium rounded-sm hover:bg-gray-800 transition-colors drop-shadow">
              {buttonText}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Ranked product section (Most Popular / Luxury Bag / etc.)
// ─────────────────────────────────────────────────────────────
interface RankedSectionProps {
  title: string;
  subtitle: string;
  apiUrl: string;
  moreLink: string;
  testId?: string;
}

function RankedProductsSection({ title, subtitle, apiUrl, moreLink, testId = "ranked-section" }: RankedSectionProps) {
  const { data: productsData, isLoading } = useQuery({
    queryKey: [apiUrl],
    queryFn: async () => {
      const res = await fetch(apiUrl);
      const d = await res.json();
      return d.success ? d.data : [];
    },
    staleTime: 60000,
  });

  const products: any[] = productsData || [];

  const ProductCard = ({ product, rank }: { product: any; rank: number }) => (
    <Link href={`/product/${product.id}`} className="group" data-testid={`${testId}-product-${product.id}`}>
      <div className="relative bg-[#f4f4f4] rounded-lg overflow-hidden aspect-square mb-2">
        <span className="absolute top-2 left-2 text-[11px] font-bold text-gray-500 z-10">
          {String(rank).padStart(2, "0")}
        </span>
        <img
          src={getProxiedImageUrl(product.imageUrl, "medium")}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
          loading="lazy"
        />
      </div>
      <p className="text-[12px] text-gray-500 truncate">{product.brandName || ""}</p>
      <p className="text-[13px] text-gray-800 line-clamp-2 leading-snug">{product.name}</p>
      <p className="text-[13px] font-bold text-gray-900 mt-0.5">{Number(product.price).toLocaleString()}원</p>
    </Link>
  );

  const MoreBtn = () => (
    <div className="flex justify-center my-5">
      <Link href={moreLink} className="px-16 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
        보러가기
      </Link>
    </div>
  );

  return (
    <section className="bg-white py-10 border-b border-gray-100" data-testid={testId}>
      <div className="max-w-[1100px] mx-auto px-5">
        <div className="mb-5">
          <h2 className="text-xl font-bold text-gray-900" style={{ fontFamily: "'Playfair Display', serif" }}>{title}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{subtitle}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-gray-100 rounded-lg mb-2" />
                <div className="h-3 bg-gray-100 rounded w-3/4 mb-1" />
                <div className="h-4 bg-gray-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="py-16 text-center text-gray-300 text-sm">어드민에서 상품을 설정해주세요.</div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-4">
              {products.slice(0, 5).map((p: any, i: number) => <ProductCard key={p.id} product={p} rank={i + 1} />)}
            </div>
            <MoreBtn />
            {products.length > 5 && (
              <>
                <div className="grid grid-cols-5 gap-4">
                  {products.slice(5, 10).map((p: any, i: number) => <ProductCard key={p.id} product={p} rank={i + 1} />)}
                </div>
                <MoreBtn />
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Inspection section — 차별화된 검수 시스템
// ─────────────────────────────────────────────────────────────
function InspectionSection() {
  const { data: reviewsData } = useQuery({
    queryKey: ["/api/reviews/inspection"],
    queryFn: async () => {
      const res = await fetch("/api/reviews?limit=6&photoOnly=true");
      const d = await res.json();
      return d.success ? d.data : [];
    },
    staleTime: 120000,
  });

  const reviews: any[] = reviewsData || [];

  const today = new Date();
  const dateLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;

  return (
    <section className="border-b border-gray-100" data-testid="inspection-section">
      <div
        className="w-full relative overflow-hidden"
        style={{ background: "#2e2d28", minHeight: "220px" }}
      >
        <div className="max-w-[1100px] mx-auto px-5 py-10 flex flex-col md:flex-row items-center gap-8">
          <div className="flex-shrink-0 flex flex-col items-center justify-center gap-3">
            <div className="w-32 h-32 rounded-2xl overflow-hidden border-4 border-white/20 shadow-xl">
              <img src="/bloo/banner1.jpg" alt="검수" className="w-full h-full object-cover" style={{ objectPosition: "50% 70%" }} />
            </div>
            <div className="bg-white rounded-lg px-4 py-2 flex items-center gap-2 shadow-md">
              <span className="text-green-500 text-lg">✓</span>
              <span className="text-[14px] font-bold text-gray-800">검수합격</span>
            </div>
          </div>
          <div className="text-white">
            <h2 className="text-2xl font-bold mb-3">차별화된 검수 시스템</h2>
            <p className="text-gray-300 text-sm leading-relaxed">
              블루는 전 상품 6단계 검수 및 품질 검증에<br />
              합격된 상품만 발송합니다.<br />
              발송전 검수 합격 사진을 확인하세요！
            </p>
          </div>
        </div>
      </div>

      {reviews.length > 0 && (
        <div className="bg-white py-6 border-b border-gray-100">
          <div className="max-w-[1100px] mx-auto px-5">
            <div className="grid grid-cols-6 gap-3">
              {reviews.slice(0, 6).map((r: any, i: number) => {
                const img = r.imageUrls?.[0] || r.imageUrl;
                return (
                  <Link key={r.id} href="/inspection" className="group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                      {img ? (
                        <img src={img} alt="검수사진" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-xs">사진</div>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">{dateLabel} 검수 사진</p>
                    <p className="text-[12px] text-gray-700 line-clamp-1">{dateLabel} {r.authorName?.slice(0, 2) || "고객"}* 제품 검수</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-green-500 text-[11px]">✓</span>
                      <span className="text-[11px] text-green-600 font-medium">검수합격</span>
                    </div>
                  </Link>
                );
              })}
            </div>
            <div className="flex justify-center mt-6">
              <Link href="/inspection" className="px-16 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
                보러가기
              </Link>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Review Event Banner — Daily & Weekly (full image)
// ─────────────────────────────────────────────────────────────
function ReviewEventBanner() {
  return (
    <Link href="/reviews" data-testid="review-event-banner" className="block w-full">
      <img
        src="/bloo/banner_review_event.jpg"
        alt="Daily & Weekly REVIEW EVENT"
        className="w-full object-cover"
        style={{ display: "block", maxHeight: "clamp(160px, 22vw, 290px)", objectFit: "cover", objectPosition: "50% 50%" }}
        loading="lazy"
      />
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────
// Reviews section — BLOO 3-col style
// ─────────────────────────────────────────────────────────────
function ReviewsSection() {
  const [page, setPage] = useState(1);
  const perPage = 6;

  const { data: reviewsData } = useQuery({
    queryKey: ["/api/reviews/home-v2", page],
    queryFn: async () => {
      const res = await fetch(`/api/reviews?limit=${perPage * 3}&offset=${(page - 1) * perPage}`);
      const d = await res.json();
      return d;
    },
    staleTime: 60000,
  });

  const reviews: any[] = reviewsData?.data || [];
  const total: number = reviewsData?.total || 0;
  const totalPages = Math.ceil(total / perPage);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    } catch { return ""; }
  };

  return (
    <section className="bg-white border-b border-gray-100 py-10" data-testid="reviews-section">
      <div className="max-w-[1100px] mx-auto px-5">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          상품 후기 {total > 0 && <span className="font-normal text-gray-500">({total.toLocaleString()})</span>}
        </h2>

        {reviews.length === 0 ? (
          <div className="py-16 text-center text-gray-300 text-sm">첫 번째 리뷰를 남겨보세요!</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {reviews.slice(0, perPage).map((review: any) => {
                const thumb = review.imageUrls?.[0] || review.imageUrl;
                return (
                  <Link key={review.id} href="/reviews" className="group block" data-testid={`review-card-${review.id}`}>
                    <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square mb-3">
                      {thumb ? (
                        <img src={thumb} alt="후기" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Star className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <p className="text-[14px] text-gray-800 line-clamp-2 leading-snug font-medium mb-2">{review.content || review.title}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden">
                        <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white text-[10px] font-bold">
                          {(review.authorName || "익")[0]}
                        </div>
                      </div>
                      <div>
                        <p className="text-[12px] text-gray-600">{review.authorName}</p>
                        <p className="text-[11px] text-gray-400">{formatDate(review.displayDate || review.createdAt)}</p>
                      </div>
                    </div>
                    {review.productName && (
                      <p className="text-[11px] text-gray-400 truncate mb-1">· {review.productName}</p>
                    )}
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3 h-3 ${s <= (review.rating || 5) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-8">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                {Array.from({ length: Math.min(totalPages, 9) }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setPage(i + 1)}
                    className={`w-8 h-8 flex items-center justify-center text-sm rounded transition-colors ${page === i + 1 ? "text-gray-900 font-bold" : "text-gray-400 hover:text-gray-700"}`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-800 disabled:opacity-30">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex justify-center mt-6">
              <Link href="/reviews" className="px-16 py-3 bg-black text-white text-sm font-medium rounded-full hover:bg-gray-800 transition-colors">
                리뷰 더보기
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Customer Support Section
// ─────────────────────────────────────────────────────────────
function CustomerSupportSection() {
  return (
    <section className="bg-white border-b border-gray-100 py-12" data-testid="customer-support-section">
      <div className="max-w-[1100px] mx-auto px-5 flex flex-col md:flex-row justify-between gap-8">
        <div>
          <h3 className="text-base font-bold text-gray-800 mb-4">고객지원</h3>
          <div className="space-y-2.5">
            <Link href="/notices" className="block text-sm text-gray-500 hover:text-gray-800 transition-colors">공지사항</Link>
            <Link href="/inspection" className="block text-sm text-gray-500 hover:text-gray-800 transition-colors">실시간 검수</Link>
            <Link href="/reviews" className="block text-sm text-gray-500 hover:text-gray-800 transition-colors">실시간 리뷰</Link>
            <Link href="/faq" className="block text-sm text-gray-500 hover:text-gray-800 transition-colors">자주묻는 질문</Link>
          </div>
        </div>
        <div className="flex flex-col justify-center">
          <p className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">고객센터 010 - 5960 - 9854</p>
          <div className="text-sm text-gray-500 space-y-1">
            <p>문의시간 10:00 ~ 24:00 (주말 및 공휴일 포함)</p>
            <p>점심시간 12:00 ~ 13:00</p>
            <p className="mt-2 text-gray-400">1:1문의하기는 카카오톡 상담을 통해서만 가능합니다.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Main Home Page
// ─────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        {/* 1. Main banner slider */}
        <MainBannerSlider />

        {/* 2. Category grid */}
        <CategoryGrid />

        {/* 2.5 Carrier Collection wide banner */}
        <WideBanner
          imageUrl="/bloo/banner_carrier.jpg"
          href="/products"
          objectPos="50% 50%"
          height="clamp(160px, 22vw, 290px)"
        />

        {/* 3. Celebrity's dress */}
        <CelebritySection />

        {/* 4. Winter Outer / Most Popular */}
        <WideBanner
          imageUrl="/bloo/banner_xmas2.jpg"
          href="/products"
          objectPos="50% 50%"
          height="clamp(160px, 22vw, 290px)"
        />
        <RankedProductsSection
          title="Most Popular"
          subtitle="아우터 인기 순위"
          apiUrl="/api/products?limit=10&isBest=true"
          moreLink="/products"
          testId="most-popular-section"
        />

        {/* 5. Luxury Bag Collection */}
        <WideBanner
          imageUrl="/bloo/banner4.jpg"
          href="/products/bags"
          objectPos="50% 50%"
          height="clamp(160px, 22vw, 290px)"
        />
        <RankedProductsSection
          title="Luxury Bag Collection"
          subtitle="BEST 가방 랭킹"
          apiUrl="/api/products?limit=10&category=%EA%B0%80%EB%B0%A9"
          moreLink="/products/bags"
          testId="luxury-bag-section"
        />

        {/* 6. Inspection section */}
        <InspectionSection />

        {/* 7. 인기 럭셔리 액세서리 */}
        <WideBanner
          imageUrl="/bloo/banner_acc.jpg"
          href="/products/accessories"
          objectPos="50% 50%"
          height="clamp(180px, 24vw, 310px)"
        />
        <RankedProductsSection
          title="인기 럭셔리 액세서리"
          subtitle="포인트가 되어줄 Best Acc"
          apiUrl="/api/products?limit=10&category=%EC%9E%A1%ED%99%94"
          moreLink="/products/accessories"
          testId="accessory-section"
        />

        {/* 8. HIGH END WATCH banner */}
        <WideBanner
          imageUrl="/bloo/banner5.jpg"
          title={"HIGH END WATCH"}
          objectPos="50% 50%"
          height="clamp(200px, 30vw, 380px)"
          overlayDark={false}
        />

        {/* 9. Bright and Luxury watches */}
        <RankedProductsSection
          title="Bright and Luxury"
          subtitle="실시간 시계 순위"
          apiUrl="/api/products?limit=10&category=%EC%8B%9C%EA%B3%84"
          moreLink="/products/watches"
          testId="watch-section"
        />

        {/* 10. Review event banner */}
        <ReviewEventBanner />

        {/* 11. Reviews */}
        <ReviewsSection />

        {/* 11.5 App download banner */}
        <WideBanner
          imageUrl="/bloo/banner_app.jpg"
          href="/products"
          objectPos="50% 50%"
          height="clamp(160px, 22vw, 290px)"
        />

        {/* 12. Customer support */}
        <CustomerSupportSection />
      </main>

      <FloatingButtons />
    </div>
  );
}
