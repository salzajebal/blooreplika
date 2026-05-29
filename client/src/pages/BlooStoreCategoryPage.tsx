import { useState, useMemo, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { ChevronDown, ChevronRight, Menu, X, Loader2 } from "lucide-react";

// ─── Bloostore1 image proxy ────────────────────────────────────────────────────
function proxyImg(url: string) {
  if (!url) return "";
  if (url.includes("imweb.me") || url.includes("bloostore")) {
    return `/api/bloostore-image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

function cdnImg(path: string) {
  return proxyImg(`https://cdn.imweb.me/${path}`);
}

function formatPrice(price: number) {
  return price > 0 ? `${price.toLocaleString()}원` : "가격문의";
}

// ─── Page configurations (parsed from bloostore1) ─────────────────────────────

interface IconItem {
  label: string;
  filter?: { category?: string; search?: string; brandName?: string };
}

interface PillItem {
  label: string;
  filter?: { search?: string; brandName?: string; sort?: string };
}

interface PageConfig {
  pageId: string;
  name: string;
  gender: "남성" | "여성";
  category: string;
  // For pages spanning multiple DB categories (e.g. 패션잡화 = wallets+jewelry+belts)
  categories?: string[];
  // Desktop image map (parsed from bloostore1 CDN)
  iconImageDesktop: string;
  iconImageMobile: string;
  // Named icons (derived from image map links + nav map)
  icons: IconItem[];
  // Subcategory pill filters
  pills: PillItem[];
}

const PAGE_CONFIGS: Record<string, PageConfig> = {
  // 남성 의류 — https://bloostore1.co.kr/httpstheblooshop1496458051
  "httpstheblooshop1496458051": {
    pageId: "httpstheblooshop1496458051",
    name: "남성 의류",
    gender: "남성",
    category: "clothing",
    // Desktop image map (data-widget-parent-is-mobile="N") — 10 clothing category circles
    iconImageDesktop: "thumbnail/20240603/5606757df3c27.jpg",
    iconImageMobile: "thumbnail/20240603/25347114edc67.jpg",
    icons: [
      { label: "티셔츠",       filter: { category: "clothing", search: "티셔츠" } },
      { label: "셔츠",         filter: { category: "clothing", search: "셔츠" } },
      { label: "맨투맨",       filter: { category: "clothing", search: "맨투맨" } },
      { label: "후드/후드집업", filter: { category: "clothing", search: "후드" } },
      { label: "팬츠",         filter: { category: "clothing", search: "팬츠" } },
      { label: "니트",         filter: { category: "clothing", search: "니트" } },
      { label: "가디건",       filter: { category: "clothing", search: "가디건" } },
      { label: "자켓",         filter: { category: "clothing", search: "자켓" } },
      { label: "패딩/베스트",  filter: { category: "clothing", search: "패딩" } },
      { label: "코트",         filter: { category: "clothing", search: "코트" } },
    ],
    pills: [
      { label: "전체보기" },
      { label: "실시간 랭킹",  filter: { sort: "popular" } },
      { label: "반팔티",        filter: { search: "반팔" } },
      { label: "피케,카라티",   filter: { search: "피케" } },
      { label: "반팔 셔츠",    filter: { search: "반팔 셔츠" } },
      { label: "니트 반팔",    filter: { search: "니트" } },
      { label: "민소매 티셔츠", filter: { search: "민소매" } },
    ],
  },

  // 남성 신발 — https://bloostore1.co.kr/220
  "220": {
    pageId: "220",
    name: "남성 신발",
    gender: "남성",
    category: "shoes",
    // Desktop image map — 14 brand circles
    iconImageDesktop: "thumbnail/20240603/1001becca943b.jpg",
    iconImageMobile: "thumbnail/20240603/76b893861b53a.jpg",
    icons: [
      { label: "에르메스",        filter: { category: "shoes", brandName: "에르메스" } },
      { label: "디올",            filter: { category: "shoes", brandName: "디올" } },
      { label: "구찌",            filter: { category: "shoes", brandName: "구찌" } },
      { label: "발렌시아가",      filter: { category: "shoes", brandName: "발렌시아가" } },
      { label: "루이비통",        filter: { category: "shoes", brandName: "루이비통" } },
      { label: "나이키",          filter: { category: "shoes", brandName: "나이키" } },
      { label: "뉴발란스",        filter: { category: "shoes", brandName: "뉴발란스" } },
      { label: "프라다",          filter: { category: "shoes", brandName: "프라다" } },
      { label: "릭오웬스",        filter: { category: "shoes", brandName: "릭오웬스" } },
      { label: "미하라 야스히로", filter: { category: "shoes", brandName: "미하라" } },
      { label: "버버리",          filter: { category: "shoes", brandName: "버버리" } },
      { label: "이지부스트",      filter: { category: "shoes", brandName: "이지부스트" } },
      { label: "펜디",            filter: { category: "shoes", brandName: "펜디" } },
      { label: "로로피아나",      filter: { category: "shoes", brandName: "로로피아나" } },
    ],
    pills: [
      { label: "전체보기" },
      { label: "스니커즈", filter: { search: "스니커즈" } },
      { label: "슬리퍼",   filter: { search: "슬리퍼" } },
      { label: "샌들",     filter: { search: "샌들" } },
      { label: "로퍼",     filter: { search: "로퍼" } },
      { label: "부츠",     filter: { search: "부츠" } },
    ],
  },

  // 남성 가방 — https://bloostore1.co.kr/1212
  "1212": {
    pageId: "1212",
    name: "남성 가방",
    gender: "남성",
    category: "bags",
    // Desktop image map — 10 brand circles
    iconImageDesktop: "thumbnail/20231210/d5ca3dba4ba69.jpg",
    iconImageMobile: "thumbnail/20231210/2f8d220e61d51.jpg",
    icons: [
      { label: "Louis Vuitton",  filter: { category: "bags", brandName: "루이비통" } },
      { label: "Dior",           filter: { category: "bags", brandName: "디올" } },
      { label: "GUCCI",          filter: { category: "bags", brandName: "구찌" } },
      { label: "PRADA",          filter: { category: "bags", brandName: "프라다" } },
      { label: "Balenciaga",     filter: { category: "bags", brandName: "발렌시아가" } },
      { label: "Bottega Veneta", filter: { category: "bags", brandName: "보테가" } },
      { label: "GOYARD",         filter: { category: "bags", brandName: "고야드" } },
      { label: "Burberry",       filter: { category: "bags", brandName: "버버리" } },
      { label: "LOEWE",          filter: { category: "bags", brandName: "로에베" } },
      { label: "CELINE",         filter: { category: "bags", brandName: "셀린느" } },
    ],
    pills: [
      { label: "전체보기" },
      { label: "클러치/파우치", filter: { search: "클러치" } },
      { label: "크로스백",      filter: { search: "크로스" } },
      { label: "토트백",        filter: { search: "토트" } },
      { label: "브리프케이스",  filter: { search: "브리프" } },
      { label: "백팩",          filter: { search: "백팩" } },
      { label: "숄더백",        filter: { search: "숄더" } },
    ],
  },

  // 남성 패션잡화 — https://bloostore1.co.kr/26
  "26": {
    pageId: "26",
    name: "남성 패션잡화",
    gender: "남성",
    category: "accessories",
    categories: ["wallets", "jewelry", "belts", "accessories"],
    // Desktop image map — 8 accessory category circles
    iconImageDesktop: "thumbnail/20231211/b8512dc2d816c.jpg",
    iconImageMobile: "thumbnail/20240116/26132c6c33b65.jpg",
    icons: [
      { label: "지갑",          filter: { category: "accessories", search: "지갑" } },
      { label: "모자",          filter: { category: "accessories", search: "모자" } },
      { label: "벨트",          filter: { category: "accessories", search: "벨트" } },
      { label: "머플러",        filter: { category: "accessories", search: "스카프" } },
      { label: "팔찌",          filter: { category: "accessories", search: "팔찌" } },
      { label: "목걸이",        filter: { category: "accessories", search: "목걸이" } },
      { label: "반지",          filter: { category: "accessories", search: "반지" } },
      { label: "키링",          filter: { category: "accessories", search: "키링" } },
    ],
    pills: [
      { label: "전체보기" },
      { label: "루이비통",    filter: { brandName: "루이비통" } },
      { label: "디올",        filter: { brandName: "디올" } },
      { label: "고야드",      filter: { brandName: "고야드" } },
      { label: "보테가베네타", filter: { brandName: "보테가" } },
      { label: "구찌",        filter: { brandName: "구찌" } },
      { label: "버버리",      filter: { brandName: "버버리" } },
    ],
  },

  // 여성 의류 — https://bloostore1.co.kr/497
  "497": {
    pageId: "497",
    name: "여성 의류",
    gender: "여성",
    category: "clothing",
    // Desktop image map — 10 clothing category circles
    iconImageDesktop: "thumbnail/20231211/0d1f0d2a1191d.jpg",
    iconImageMobile: "thumbnail/20231211/87864cabc00b9.jpg",
    icons: [
      { label: "티셔츠",      filter: { category: "clothing", search: "티셔츠" } },
      { label: "셔츠",        filter: { category: "clothing", search: "셔츠" } },
      { label: "맨투맨",      filter: { category: "clothing", search: "맨투맨" } },
      { label: "후드/집업",   filter: { category: "clothing", search: "후드" } },
      { label: "팬츠",        filter: { category: "clothing", search: "팬츠" } },
      { label: "니트/가디건", filter: { category: "clothing", search: "니트" } },
      { label: "치마/원피스", filter: { category: "clothing", search: "원피스" } },
      { label: "자켓",        filter: { category: "clothing", search: "자켓" } },
      { label: "패딩/베스트", filter: { category: "clothing", search: "패딩" } },
      { label: "코트",        filter: { category: "clothing", search: "코트" } },
    ],
    pills: [
      { label: "전체보기" },
      { label: "실시간 랭킹", filter: { sort: "popular" } },
      { label: "반팔티",      filter: { search: "반팔" } },
      { label: "원피스",      filter: { search: "원피스" } },
      { label: "블라우스",    filter: { search: "블라우스" } },
      { label: "니트",        filter: { search: "니트" } },
      { label: "치마",        filter: { search: "치마" } },
    ],
  },

  // 여성 가방 — https://bloostore1.co.kr/1447
  "1447": {
    pageId: "1447",
    name: "여성 가방",
    gender: "여성",
    category: "bags",
    // Desktop image map — 15 brand circles
    iconImageDesktop: "thumbnail/20240221/fdd55ebed05f2.jpg",
    iconImageMobile: "thumbnail/20240221/1981c89bcddfe.jpg",
    icons: [
      { label: "Hermes",         filter: { category: "bags", brandName: "에르메스" } },
      { label: "Louis Vuitton",  filter: { category: "bags", brandName: "루이비통" } },
      { label: "Dior",           filter: { category: "bags", brandName: "디올" } },
      { label: "GUCCI",          filter: { category: "bags", brandName: "구찌" } },
      { label: "PRADA",          filter: { category: "bags", brandName: "프라다" } },
      { label: "Balenciaga",     filter: { category: "bags", brandName: "발렌시아가" } },
      { label: "Bottega Veneta", filter: { category: "bags", brandName: "보테가" } },
      { label: "Goyard",         filter: { category: "bags", brandName: "고야드" } },
      { label: "Burberry",       filter: { category: "bags", brandName: "버버리" } },
      { label: "LOEWE",          filter: { category: "bags", brandName: "로에베" } },
      { label: "CELINE",         filter: { category: "bags", brandName: "셀린느" } },
      { label: "Chanel",         filter: { category: "bags", brandName: "샤넬" } },
      { label: "Saint Laurent",  filter: { category: "bags", brandName: "생로랑" } },
      { label: "FENDI",          filter: { category: "bags", brandName: "펜디" } },
      { label: "miu miu",        filter: { category: "bags", brandName: "미우미우" } },
    ],
    pills: [
      { label: "전체보기" },
      { label: "숄더백",   filter: { search: "숄더" } },
      { label: "크로스백", filter: { search: "크로스" } },
      { label: "토트백",   filter: { search: "토트" } },
      { label: "클러치",   filter: { search: "클러치" } },
      { label: "백팩",     filter: { search: "백팩" } },
    ],
  },

  // 여성 신발 — https://bloostore1.co.kr/656
  "656": {
    pageId: "656",
    name: "여성 신발",
    gender: "여성",
    category: "shoes",
    // Desktop image map — 14 brand circles
    iconImageDesktop: "thumbnail/20240603/f67fd8626336f.jpg",
    iconImageMobile: "thumbnail/20240603/b138c3b2e1a2d.jpg",
    icons: [
      { label: "샤넬",            filter: { category: "shoes", brandName: "샤넬" } },
      { label: "에르메스",        filter: { category: "shoes", brandName: "에르메스" } },
      { label: "디올",            filter: { category: "shoes", brandName: "디올" } },
      { label: "구찌",            filter: { category: "shoes", brandName: "구찌" } },
      { label: "발렌시아가",      filter: { category: "shoes", brandName: "발렌시아가" } },
      { label: "루이비통",        filter: { category: "shoes", brandName: "루이비통" } },
      { label: "나이키",          filter: { category: "shoes", brandName: "나이키" } },
      { label: "뉴발란스",        filter: { category: "shoes", brandName: "뉴발란스" } },
      { label: "프라다",          filter: { category: "shoes", brandName: "프라다" } },
      { label: "릭오웬스",        filter: { category: "shoes", brandName: "릭오웬스" } },
      { label: "미하라 야스히로", filter: { category: "shoes", brandName: "미하라" } },
      { label: "버버리",          filter: { category: "shoes", brandName: "버버리" } },
      { label: "이지부스트",      filter: { category: "shoes", brandName: "이지부스트" } },
      { label: "펜디",            filter: { category: "shoes", brandName: "펜디" } },
    ],
    pills: [
      { label: "전체보기" },
      { label: "스니커즈", filter: { search: "스니커즈" } },
      { label: "힐",       filter: { search: "힐" } },
      { label: "플랫",     filter: { search: "플랫" } },
      { label: "샌들",     filter: { search: "샌들" } },
      { label: "부츠",     filter: { search: "부츠" } },
      { label: "로퍼",     filter: { search: "로퍼" } },
    ],
  },

  // 여성 패션잡화 — https://bloostore1.co.kr/716
  "716": {
    pageId: "716",
    name: "여성 패션잡화",
    gender: "여성",
    category: "accessories",
    categories: ["wallets", "jewelry", "belts", "accessories"],
    // Desktop image map — 8 accessory category circles
    iconImageDesktop: "thumbnail/20231212/bd099fb6b9a5e.jpg",
    iconImageMobile: "thumbnail/20240115/8e926bbd9078e.jpg",
    icons: [
      { label: "지갑",          filter: { category: "accessories", search: "지갑" } },
      { label: "모자",          filter: { category: "accessories", search: "모자" } },
      { label: "벨트",          filter: { category: "accessories", search: "벨트" } },
      { label: "스카프/머플러", filter: { category: "accessories", search: "스카프" } },
      { label: "팔찌",          filter: { category: "accessories", search: "팔찌" } },
      { label: "목걸이",        filter: { category: "accessories", search: "목걸이" } },
      { label: "반지",          filter: { category: "accessories", search: "반지" } },
      { label: "키링",          filter: { category: "accessories", search: "키링" } },
    ],
    pills: [
      { label: "전체보기" },
      { label: "루이비통",    filter: { brandName: "루이비통" } },
      { label: "샤넬",        filter: { brandName: "샤넬" } },
      { label: "디올",        filter: { brandName: "디올" } },
      { label: "구찌",        filter: { brandName: "구찌" } },
      { label: "에르메스",    filter: { brandName: "에르메스" } },
      { label: "보테가베네타", filter: { brandName: "보테가" } },
    ],
  },
};

// ─── Types ─────────────────────────────────────────────────────────────────────
interface Brand { id: string; name: string; slug: string; }
interface Product {
  id: string; name: string; price: number; imageUrl: string;
  categoryId: string; brandId?: string;
}

interface ActiveFilter {
  category?: string;
  search?: string;
  brandName?: string;
  brandId?: string;
  sort?: string;
  label?: string;
}

// ─── Sidebar data ──────────────────────────────────────────────────────────────

const SIDEBAR_NAV = [
  { label: "남성 의류",    path: "/httpstheblooshop1496458051", gender: "남성", cat: "clothing" },
  { label: "남성 신발",    path: "/220",  gender: "남성", cat: "shoes" },
  { label: "남성 가방",    path: "/1212", gender: "남성", cat: "bags" },
  { label: "남성 패션 잡화", path: "/26", gender: "남성", cat: "accessories" },
  { label: "여성 의류",    path: "/497",  gender: "여성", cat: "clothing" },
  { label: "여성 가방",    path: "/1447", gender: "여성", cat: "bags" },
  { label: "여성 신발",    path: "/656",  gender: "여성", cat: "shoes" },
  { label: "여성 패션 잡화", path: "/716", gender: "여성", cat: "accessories" },
];

// ─── Icon Row Component ────────────────────────────────────────────────────────

function IconImageRow({
  imageUrl,
  icons,
  onIconClick,
  activeLabel,
}: {
  imageUrl: string;
  icons: IconItem[];
  onIconClick: (icon: IconItem) => void;
  activeLabel?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const DISPLAY_HEIGHT = 130;

  return (
    <div className="mb-2">
      <div
        ref={scrollRef}
        className="overflow-x-auto overflow-y-hidden select-none"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x",
        } as React.CSSProperties}
      >
        <div style={{ display: "flex", height: `${DISPLAY_HEIGHT}px`, position: "relative" }}>
          <img
            ref={imgRef}
            src={proxyImg(`https://cdn.imweb.me/${imageUrl}`)}
            alt="카테고리 아이콘"
            onLoad={() => setImgLoaded(true)}
            style={{
              height: `${DISPLAY_HEIGHT}px`,
              width: "auto",
              objectFit: "contain",
              display: "block",
              maxWidth: "none",
              flexShrink: 0,
              pointerEvents: "none",
            }}
          />
          {imgLoaded && imgRef.current && icons.map((icon, i) => {
            const imgW = imgRef.current!.naturalWidth;
            const imgH = imgRef.current!.naturalHeight;
            const scale = DISPLAY_HEIGHT / imgH;
            const renderedW = imgW * scale;
            const iconW = renderedW / icons.length;
            return (
              <div
                key={icon.label}
                onClick={() => onIconClick(icon)}
                style={{
                  position: "absolute",
                  left: `${i * iconW}px`,
                  top: 0,
                  width: `${iconW}px`,
                  height: `${DISPLAY_HEIGHT}px`,
                  cursor: "pointer",
                  background: activeLabel === icon.label ? "rgba(59,130,246,0.12)" : "transparent",
                  borderRadius: "50%",
                }}
                title={icon.label}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Pill Filter Row ───────────────────────────────────────────────────────────

function PillFilterRow({
  pills,
  activePill,
  onPillClick,
}: {
  pills: PillItem[];
  activePill: string;
  onPillClick: (pill: PillItem) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mouse drag-scroll
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    didDrag.current = false;
    startX.current = e.clientX;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const walk = e.clientX - startX.current;
    if (Math.abs(walk) > 4) didDrag.current = true;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };
  const onMouseUp = () => { isDragging.current = false; };

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1 mb-4 cursor-grab active:cursor-grabbing -mx-3 md:mx-0 px-3 md:px-0"
      style={{
        scrollbarWidth: "none",
        msOverflowStyle: "none",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-x",
      } as React.CSSProperties}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {pills.map((pill) => (
        <button
          key={pill.label}
          data-testid={`pill-${pill.label}`}
          className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${
            activePill === pill.label
              ? "bg-black text-white border-black"
              : "bg-white text-gray-700 border-gray-300 hover:border-gray-500 hover:bg-gray-50"
          }`}
          onClick={() => { if (!didDrag.current) onPillClick(pill); }}
        >
          {pill.label}
        </button>
      ))}
      {/* Dot indicator (bloostore1 style) */}
      <div className="flex-shrink-0 flex items-center gap-1 px-2 self-end pb-1">
        <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
        <div className="w-1.5 h-1.5 rounded-full bg-gray-300" />
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function BlooStoreCategoryPage({ pageId }: { pageId: string }) {
  const config = PAGE_CONFIGS[pageId];
  const [location, setLocation] = useLocation();
  const [filter, setFilter] = useState<ActiveFilter>({});
  const [activePill, setActivePill] = useState("전체보기");
  const [activeIconLabel, setActiveIconLabel] = useState<string | undefined>(undefined);
  const [openL2, setOpenL2] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const PAGE_SIZE = 60;
  const isWomen = config?.gender === "여성";

  // ── Brands ──
  const { data: brandsData } = useQuery<{ success: boolean; data: Brand[] }>({
    queryKey: ["/api/brands"],
    queryFn: () => fetch("/api/brands").then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  const brandNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    brandsData?.data?.forEach(b => { map[b.name] = b.id; });
    return map;
  }, [brandsData]);

  // ── Resolve brandId from brandName ──
  const resolvedFilter = useMemo(() => {
    const f: Record<string, string> = {};
    if (filter.category) f.category = filter.category;
    if (filter.search) f.search = filter.search;
    if (filter.sort) f.sort = filter.sort;
    if (filter.brandName) {
      // Try to find exact brand match
      const exactId = brandNameMap[filter.brandName];
      if (exactId) {
        f.brandId = exactId;
      } else {
        // Fuzzy search in brand names
        const match = Object.entries(brandNameMap).find(([name]) =>
          name.includes(filter.brandName!) || filter.brandName!.includes(name)
        );
        if (match) f.brandId = match[1];
        else f.search = filter.brandName;
      }
    }
    return f;
  }, [filter, brandNameMap]);

  // ── Products ──
  const params = useMemo(() => {
    const p = new URLSearchParams();
    if (config) {
      p.set("gender", config.gender);
      // Use categories (multi) if available and no specific icon filter is selected
      if (!resolvedFilter.category && config.categories && config.categories.length > 0 && !resolvedFilter.brandId && !resolvedFilter.search) {
        p.set("categories", config.categories.join(","));
      } else if (!resolvedFilter.category && config.category) {
        p.set("category", config.category);
      }
    }
    p.set("limit", String(PAGE_SIZE));
    p.set("offset", String(page * PAGE_SIZE));
    Object.entries(resolvedFilter).forEach(([k, v]) => { if (v) p.set(k, v); });
    return p.toString();
  }, [config, resolvedFilter, page]);

  const { data: productsData, isLoading } = useQuery<{ success: boolean; data: Product[]; total: number }>({
    queryKey: ["/api/products/bloocat", pageId, resolvedFilter, page],
    queryFn: () => fetch(`/api/products?${params}`).then(r => r.json()),
    staleTime: 30 * 1000,
    enabled: !!config,
  });

  const products = productsData?.data ?? [];
  const total = productsData?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  // ── URL params → filter on mount/location change ──
  const didInit = useRef(false);
  useEffect(() => {
    if (!config) return;
    const search = window.location.search;
    const p = new URLSearchParams(search);
    const subname = p.get("subname");
    const brand = p.get("brand");
    if (subname) {
      // Find matching icon
      const icon = config.icons.find(i => i.filter?.search === subname || i.label === subname);
      if (icon?.filter) {
        setFilter({ ...icon.filter });
        setActiveIconLabel(icon.label);
      } else {
        setFilter({ search: subname });
      }
    } else if (brand) {
      const icon = config.icons.find(i => i.filter?.brandName === brand || i.label === brand);
      if (icon?.filter) {
        setFilter({ ...icon.filter });
        setActiveIconLabel(icon.label);
      } else {
        setFilter({ brandName: brand });
      }
    }
    didInit.current = true;
  }, [pageId]); // eslint-disable-line

  function selectAll() {
    setFilter({});
    setActivePill("전체보기");
    setActiveIconLabel(undefined);
    setPage(0);
    setLocation(`/${pageId}`);
  }

  function handleIconClick(icon: IconItem) {
    if (!icon.filter) {
      selectAll();
      return;
    }
    setFilter({ ...icon.filter });
    setActiveIconLabel(icon.label);
    setActivePill("전체보기");
    setPage(0);
    // Update URL to reflect selected icon (bloostore1 style)
    if (icon.filter.brandName) {
      setLocation(`/${pageId}?brand=${encodeURIComponent(icon.filter.brandName)}`);
    } else if (icon.filter.search) {
      setLocation(`/${pageId}?subname=${encodeURIComponent(icon.filter.search)}`);
    }
  }

  function handlePillClick(pill: PillItem) {
    setActivePill(pill.label);
    if (!pill.filter) {
      // Reset to page default (keep active icon filter if any)
      setFilter(activeIconLabel
        ? (config?.icons.find(i => i.label === activeIconLabel)?.filter ?? {})
        : {});
    } else {
      const base = activeIconLabel
        ? (config?.icons.find(i => i.label === activeIconLabel)?.filter ?? {})
        : {};
      setFilter({ ...base, ...pill.filter });
    }
    setPage(0);
  }

  if (!config) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="flex items-center justify-center py-40 text-gray-400">페이지를 찾을 수 없습니다.</div>
      </div>
    );
  }

  // ── Sidebar ──
  const sidebarContent = (
    <nav className="text-[13px] text-gray-800 w-full">
      <Link href="/inspection">
        <div className="py-2 px-3 font-medium cursor-pointer hover:text-black flex items-center gap-1">
          실시간 검수 사진 <span className="text-green-600 font-bold">✓</span>
        </div>
      </Link>
      <div className="border-t border-gray-100 my-1" />

      {/* 남성 */}
      <div>
        <div className={`py-2 px-3 cursor-pointer font-semibold ${config.gender === "남성" ? "text-black" : "text-gray-500 hover:text-black"}`}>
          남성
        </div>
        {(config.gender === "남성" || openL2 === "남성_all") && (
          <div className="ml-3 border-l border-gray-200">
            {SIDEBAR_NAV.filter(n => n.gender === "남성").map(nav => (
              <Link key={nav.path} href={nav.path}>
                <div className={`py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between text-[12.5px] ${
                  pageId === nav.path.slice(1) && config.gender === "남성"
                    ? "font-bold border-l-2 border-black -ml-px pl-3"
                    : "text-gray-600"
                }`}>
                  {nav.label}
                </div>
              </Link>
            ))}
          </div>
        )}
        {config.gender !== "남성" && (
          <button
            className="ml-3 px-3 text-[11px] text-gray-400 hover:text-gray-600"
            onClick={() => setOpenL2(o => o === "남성_all" ? null : "남성_all")}
          >
            {openL2 === "남성_all" ? "▲ 접기" : "▼ 펼치기"}
          </button>
        )}
      </div>

      {/* 여성 */}
      <div>
        <div className={`py-2 px-3 cursor-pointer font-semibold ${config.gender === "여성" ? "text-black" : "text-gray-500 hover:text-black"}`}>
          여성
        </div>
        {(config.gender === "여성" || openL2 === "여성_all") && (
          <div className="ml-3 border-l border-gray-200">
            {SIDEBAR_NAV.filter(n => n.gender === "여성").map(nav => (
              <Link key={nav.path} href={nav.path}>
                <div className={`py-1.5 px-3 cursor-pointer hover:text-black flex items-center justify-between text-[12.5px] ${
                  pageId === nav.path.slice(1) && config.gender === "여성"
                    ? "font-bold border-l-2 border-black -ml-px pl-3"
                    : "text-gray-600"
                }`}>
                  {nav.label}
                </div>
              </Link>
            ))}
          </div>
        )}
        {config.gender !== "여성" && (
          <button
            className="ml-3 px-3 text-[11px] text-gray-400 hover:text-gray-600"
            onClick={() => setOpenL2(o => o === "여성_all" ? null : "여성_all")}
          >
            {openL2 === "여성_all" ? "▲ 접기" : "▼ 펼치기"}
          </button>
        )}
      </div>

      <div className="border-t border-gray-100 my-1" />
      <Link href="/products/watches">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">시계관</div>
      </Link>
      <Link href="/events">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">기획전</div>
      </Link>
      <Link href="/notices">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">커뮤니티</div>
      </Link>
      <Link href="/products?same_day=true">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">오늘출발</div>
      </Link>
      <Link href="/choice">
        <div className="py-2 px-3 cursor-pointer text-gray-500 hover:text-black">썸머</div>
      </Link>
    </nav>
  );

  return (
    <div className="min-h-screen bg-white" data-testid={`bloo-category-page-${pageId}`}>
      <Header />

      <div className="max-w-[1300px] mx-auto px-3 md:px-6 py-4">
        {/* 모바일 토글 */}
        <div className="flex md:hidden items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">
            {config.name} {filter.label ? `> ${filter.label}` : ""}
          </div>
          <button
            data-testid="button-toggle-sidebar"
            onClick={() => setSidebarOpen(v => !v)}
            className="flex items-center gap-1 text-xs border border-gray-300 rounded px-2.5 py-1.5 text-gray-600 hover:bg-gray-50"
          >
            {sidebarOpen ? <X className="w-3.5 h-3.5" /> : <Menu className="w-3.5 h-3.5" />}
            카테고리
          </button>
        </div>

        {sidebarOpen && (
          <div className="md:hidden border border-gray-200 rounded-lg mb-4 bg-white overflow-hidden">
            {sidebarContent}
          </div>
        )}

        {/* 2-panel 레이아웃 */}
        <div className="flex gap-8">
          {/* 사이드바 (데스크톱) */}
          <aside className="hidden md:block w-[200px] flex-shrink-0 border-r border-gray-100 pr-4 pt-1">
            {sidebarContent}
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0">
            {/* 경로 표시 */}
            <div className="hidden md:flex items-center gap-1 text-xs text-gray-400 mb-3">
              <span className="font-medium text-gray-700">{config.name}</span>
              {filter.label && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <span>{filter.label}</span>
                </>
              )}
              <span className="ml-auto text-gray-400">{total.toLocaleString()}개 상품</span>
            </div>

            {/* ── 브랜드/카테고리 아이콘 이미지 스트립 (클릭 가능) ── */}
            <div className="-mx-3 md:mx-0 mb-1">
              <IconImageRow
                imageUrl={config.iconImageDesktop}
                icons={config.icons}
                onIconClick={handleIconClick}
                activeLabel={activeIconLabel}
              />
            </div>

            {/* ── 카테고리 필터 pills ── */}
            <PillFilterRow
              pills={config.pills}
              activePill={activePill}
              onPillClick={handlePillClick}
            />

            {/* 로딩 */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            )}

            {/* 상품 없음 */}
            {!isLoading && products.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-sm">해당 상품이 없습니다.</p>
                <button onClick={selectAll} className="mt-3 text-xs underline text-gray-500">
                  전체 상품 보기
                </button>
              </div>
            )}

            {/* 상품 그리드 */}
            {!isLoading && products.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {products.map(product => {
                  const imgSrc = imgErrors[product.id]
                    ? product.imageUrl
                    : proxyImg(product.imageUrl);
                  return (
                    <Link key={product.id} href={`/product/${product.id}`}>
                      <div
                        data-testid={`product-card-${product.id}`}
                        className="group cursor-pointer"
                      >
                        <div
                          className="w-full bg-gray-100 overflow-hidden rounded-sm"
                          style={{ aspectRatio: "1/1" }}
                        >
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                            onError={() =>
                              setImgErrors(prev => ({ ...prev, [product.id]: true }))
                            }
                          />
                        </div>
                        <div className="mt-1.5 px-0.5">
                          <p className="text-[12px] md:text-[13px] text-gray-800 leading-tight line-clamp-2 break-keep">
                            {product.name}
                          </p>
                          <p className="text-[13px] md:text-[14px] font-semibold text-gray-900 mt-1">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8 mb-4">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  이전
                </button>
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  const pageNum = page < 4
                    ? i
                    : page > totalPages - 4
                    ? totalPages - 7 + i
                    : page - 3 + i;
                  if (pageNum < 0 || pageNum >= totalPages) return null;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-8 h-8 text-sm rounded ${
                        pageNum === page
                          ? "bg-black text-white"
                          : "border border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  );
                })}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-40"
                >
                  다음
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
