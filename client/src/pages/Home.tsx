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
    <div className="fixed right-5 bottom-20 md:bottom-8 z-40">
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

  return (
    <section
      className="relative w-full overflow-hidden aspect-[390/220] md:aspect-[1902/465]"
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
          <button onClick={() => setCurrent((p) => (p === 0 ? displayList.length - 1 : p - 1))} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow z-10 hidden md:flex" aria-label="이전">
            <ChevronLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button onClick={() => setCurrent((p) => (p + 1) % displayList.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow z-10 hidden md:flex" aria-label="다음">
            <ChevronRight className="w-5 h-5 text-gray-700" />
          </button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {displayList.map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === current ? "w-5 bg-white" : "w-1.5 bg-white/60"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// Category Cards — 5×2 개별 카드, bloostore CDN 프록시 이미지
// ─────────────────────────────────────────────────────────────
const CDN_BASE = "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/";
const catImg = (hash: string, ext = "jpg") =>
  `/api/bloostore-image-proxy?url=${encodeURIComponent(`${CDN_BASE}${hash}.${ext}?w=400`)}`;

const CATEGORY_CARDS = [
  // Row 1 — 남성
  { label: "남성 의류", href: "/httpstheblooshop1496458051", img: catImg("884a5738a744e") },        // 셀린느 리브드 울 스웨터 그레이
  { label: "남성 가방", href: "/1212",                        img: catImg("11cd85e03aa22") },        // 고야드 메신저 백
  { label: "남성 신발", href: "/220",                         img: catImg("7c4747cfdb79e", "gif") }, // 디올 B27 화이트 스니커즈
  { label: "남성 잡화", href: "/26",                          img: catImg("f0695e555b82f") },        // 에르메스 클릭아슈 골드 팔찌
  { label: "시계관",    href: "/412",                         img: catImg("5fde45956e083", "gif") }, // 롤렉스 블루
  // Row 2 — 여성
  { label: "여성 의류", href: "/497",                         img: catImg("9ecfbe7689c3b") },        // 미우미우 패딩 자켓
  { label: "여성 가방", href: "/1447",                        img: catImg("96aba31c1694e") },        // 샤넬 25 미디엄 블랙
  { label: "여성 신발", href: "/656",                         img: catImg("47c5dffd03e6b") },        // 디올 B30 화이트 스니커즈
  { label: "여성 잡화", href: "/716",                         img: catImg("4c876d4dbbd9d") },        // 에르메스 팔찌 오렌지
  { label: "캐리어",    href: "/products?search=%EC%BA%90%EB%A6%AC%EC%96%B4", img: "/bloo/cat_women_5th2.jpg" },
];

function CategoryGrid() {
  return (
    <section className="bg-white pt-3 pb-4 border-b border-gray-100" data-testid="category-grid">
      <div className="w-full max-w-[1250px] mx-auto px-2 md:px-4">
        <div className="grid grid-cols-5 gap-1.5 md:gap-3">
          {CATEGORY_CARDS.map((cat, idx) => (
            <Link
              key={idx}
              href={cat.href}
              className="flex flex-col items-center gap-1"
              data-testid={`cat-card-${idx}`}
              aria-label={cat.label}
            >
              <div className="w-full aspect-square rounded-2xl overflow-hidden bg-[#d8e8f8]">
                <img
                  src={cat.img}
                  alt={cat.label}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <span className="text-[10px] md:text-[13px] text-gray-800 text-center leading-tight font-medium break-keep">
                {cat.label}
              </span>
            </Link>
          ))}
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
    href: "/products?brandName=%EB%AF%B8%EC%9A%B0%EB%AF%B8%EC%9A%B0",
    product: null,
  },
  {
    id: "new2",
    brand: "BVLGARI",
    photo: BP("https://cdn.imweb.me/thumbnail/20240404/b3fb45dfb10e9.jpg"),
    href: "/products?brandName=%EB%B6%88%EA%B0%80%EB%A6%AC",
    product: null,
  },
  {
    id: "new3",
    brand: "DIOR",
    photo: BP("https://cdn.imweb.me/thumbnail/20240404/514ae7ccc23c6.jpg"),
    href: "/products?brandName=%EB%94%94%EC%98%AC",
    product: null,
  },
  {
    id: 755,
    brand: "DIOR",
    photo: BP("https://cdn.imweb.me/thumbnail/20240119/f4e30050baf84.jpg"),
    href: "/products?brandName=%EB%94%94%EC%98%AC",
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
    href: "/products?brandName=%EC%97%90%EB%A5%B4%EB%A9%94%EC%8A%A4",
    product: null,
  },
  {
    id: 147,
    brand: "GUCCI",
    photo: BP("https://cdn.imweb.me/thumbnail/20240119/ae2ab38846f74.jpg"),
    href: "/products?brandName=%EA%B5%AC%EC%B0%8C",
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
    href: "/products?brandName=%EC%85%80%EB%A6%B0%EB%8A%90",
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
    href: "/products?brandName=%EB%A3%A8%EC%9D%B4%EB%B9%84%ED%86%B5",
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
    href: "/products?brandName=%EB%94%94%EC%98%AC",
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
    href: "/products?brandName=%EC%85%80%EB%A6%B0%EB%8A%90",
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
  const [visible, setVisible] = useState(() => window.innerWidth < 640 ? 2 : 4);
  useEffect(() => {
    const handler = () => setVisible(window.innerWidth < 640 ? 2 : 4);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
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
                  </div>
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

function WideBanner({ imageUrl, title, subtitle, buttonText, href = "/products", objectPos = "50% 50%", height, overlayDark = true }: WideBannerProps) {
  return (
    <div className="relative w-full" data-testid="wide-banner">
      <img src={imageUrl} alt={title || ""} className="w-full block" style={{ display: "block" }} />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
              {products.slice(0, 5).map((p: any, i: number) => <ProductCard key={p.id} product={p} rank={i + 1} />)}
            </div>
            <MoreBtn />
            {products.length > 5 && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
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
        <div className="max-w-[1100px] mx-auto px-5 py-10 flex flex-col items-start">
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
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3">
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
    <Link href="/notices" data-testid="review-event-banner" className="block w-full">
      <img
        src={BP("https://cdn.imweb.me/thumbnail/20231214/72c7ff6bcbc3c.jpg")}
        alt="커뮤니티"
        className="w-full block"
        style={{ display: "block" }}
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
          <div className="text-sm text-gray-500 space-y-1">
            <p>문의시간 10:00 ~ 18:00 (주말 및 공휴일 포함)</p>
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
      <main className="pb-16 md:pb-0">
        {/* 1. Main banner slider */}
        <MainBannerSlider />

        {/* 2. Category grid */}
        <CategoryGrid />

        {/* 3. Celebrity's dress */}
        <CelebritySection />

        {/* 4. 이벤트 배너 */}
        <WideBanner
          imageUrl={BP("https://cdn.imweb.me/thumbnail/20231208/b2d53f96c38ee.jpg")}
          href="/inspection"
          objectPos="50% 50%"
        />

        {/* 5. 가방 배너 */}
        <WideBanner
          imageUrl={BP("https://cdn.imweb.me/thumbnail/20231208/979730d743454.jpg")}
          href="/products/bags"
          objectPos="50% 50%"
        />
        <RankedProductsSection
          title="Luxury Bag Collection"
          subtitle="BEST 가방 랭킹"
          apiUrl="/api/products?limit=5&isBest=true&category=bags"
          moreLink="/products/bags"
          testId="bag-section"
        />

        {/* 7. Inspection section */}
        <InspectionSection />

        {/* 8. 쥬얼리 배너 */}
        <WideBanner
          imageUrl={BP("https://cdn.imweb.me/thumbnail/20231208/719e6eec8251b.jpg")}
          href="/products/jewelry"
          objectPos="50% 50%"
        />
        <RankedProductsSection
          title="Luxury Jewelry"
          subtitle="인기 럭셔리 쥬얼리"
          apiUrl="/api/products?limit=5&isBest=true&category=jewelry"
          moreLink="/products/jewelry"
          testId="jewelry-section"
        />

        {/* 9. 시계관 배너 */}
        <WideBanner
          imageUrl={BP("https://cdn.imweb.me/thumbnail/20231208/5159c1204eb09.jpg")}
          href="/products/watches"
          objectPos="50% 50%"
        />

        {/* 10. Bright and Luxury watches */}
        <RankedProductsSection
          title="Bright and Luxury"
          subtitle="실시간 시계 순위"
          apiUrl="/api/products?limit=5&isBest=true&category=watches"
          moreLink="/products/watches"
          testId="watch-section"
        />

        {/* 11. 커뮤니티 리뷰 배너 */}
        <ReviewEventBanner />

        {/* 12. Reviews */}
        <ReviewsSection />

        {/* 13. Customer support */}
        <CustomerSupportSection />
      </main>

      <FloatingButtons />
    </div>
  );
}
