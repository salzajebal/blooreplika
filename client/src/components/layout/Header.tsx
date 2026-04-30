import { Search, User, ShoppingBag, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

// ─── Subcategory data (hardcoded for performance) ────────────────────────────
const CLOTHING_MEN = [
  { name: "자켓/점퍼", sub: "b01010" }, { name: "패딩/털", sub: "b01020" },
  { name: "가죽옷", sub: "b01030" }, { name: "코트/정장", sub: "b01040" },
  { name: "후드티/집업", sub: "b01050" }, { name: "셔츠/남방", sub: "b01060" },
  { name: "베스트/조끼", sub: "b01070" }, { name: "니트/스웨터", sub: "b01080" },
  { name: "가디건", sub: "b01090" }, { name: "반팔티/폴로티", sub: "b010a0" },
  { name: "긴팔티/맨투맨", sub: "b010b0" }, { name: "운동복/추리닝", sub: "b010c0" },
  { name: "팬츠/청바지", sub: "b010d0" }, { name: "반바지", sub: "b010e0" },
  { name: "세트", sub: "b010f0" },
];
const CLOTHING_WOMEN = [
  { name: "자켓/점퍼", sub: "c01010" }, { name: "패딩/털", sub: "c01020" },
  { name: "코트", sub: "c01030" }, { name: "후드티", sub: "c01040" },
  { name: "셔츠/남방", sub: "c01050" }, { name: "조끼", sub: "c01060" },
  { name: "가죽옷", sub: "c01070" }, { name: "니트/스웨터", sub: "c01080" },
  { name: "가디건", sub: "c01090" }, { name: "반팔티/폴로", sub: "c010a0" },
  { name: "긴팔티/맨투맨", sub: "c010b0" }, { name: "운동복/추리닝", sub: "c010c0" },
  { name: "팬츠/청바지", sub: "c010d0" }, { name: "반바지/스커트", sub: "c010e0" },
  { name: "원피스", sub: "c010f0" }, { name: "수영복", sub: "c010g0" },
];
const BAGS_MEN = [
  { name: "토트백", sub: "b02010" }, { name: "크로스백", sub: "b02020" },
  { name: "숄더백", sub: "b02030" }, { name: "백팩", sub: "b02040" },
  { name: "서류가방", sub: "b02050" }, { name: "파우치/클러치", sub: "b02060" },
  { name: "여행가방", sub: "b02070" }, { name: "캐리어", sub: "b02080" },
  { name: "벨트백/새들/슬링", sub: "b02090" }, { name: "기타", sub: "b020a0" },
];
const BAGS_WOMEN = [
  { name: "숄더백", sub: "c02010" }, { name: "토트백", sub: "c02020" },
  { name: "클러치백", sub: "c02030" }, { name: "백팩", sub: "c02040" },
  { name: "파우치", sub: "c02050" }, { name: "크로스백", sub: "c02060" },
  { name: "메신져백", sub: "c02070" }, { name: "여행가방", sub: "c02080" },
  { name: "캐리어", sub: "c02090" }, { name: "벨트백/새들/슬링", sub: "c020a0" },
  { name: "미니백", sub: "c020b0" }, { name: "기타", sub: "c020c0" },
];
const WALLETS_MEN = [
  { name: "장지갑/소지갑", sub: "b04010" }, { name: "카드지갑", sub: "b04020" },
  { name: "동전지갑", sub: "b04030" },
];
const WALLETS_WOMEN = [
  { name: "장지갑/소지갑", sub: "c03010" }, { name: "카드지갑", sub: "c03020" },
  { name: "동전지갑", sub: "c03030" },
];
const SHOES_MEN = [
  { name: "스니커즈", sub: "b0b010" }, { name: "운동화", sub: "b0b020" },
  { name: "정장구두", sub: "b0b030" }, { name: "샌들/슬리퍼", sub: "b0b040" },
  { name: "부츠/워커", sub: "b0b050" }, { name: "로퍼/슬립온", sub: "b0b060" },
];
const SHOES_WOMEN = [
  { name: "스니커즈", sub: "c05010" }, { name: "운동화", sub: "c05020" },
  { name: "정장구두", sub: "g030" },   { name: "샌들/슬리퍼", sub: "c05030" },
  { name: "펌프스/힐", sub: "c05040" }, { name: "부츠/워커", sub: "c05050" },
  { name: "단화/플랫", sub: "c05060" }, { name: "로퍼/슬립온", sub: "c05070" },
];
const JEWELRY_MEN = [
  { name: "목걸이", sub: "b08010" }, { name: "팔찌", sub: "b08020" },
  { name: "반지", sub: "b08030" }, { name: "백참/브로치", sub: "b08040" },
  { name: "만년필/볼펜", sub: "b08050" }, { name: "장갑", sub: "b08060" },
  { name: "라이터/듀퐁", sub: "b08080" }, { name: "스카프/머플러", sub: "b08090" },
  { name: "넥타이", sub: "b080a0" }, { name: "모자", sub: "b080b0" },
  { name: "우산", sub: "b080c0" }, { name: "커프스", sub: "b080d0" },
  { name: "키홀더", sub: "b080e0" }, { name: "기타", sub: "b080f0" },
];
const JEWELRY_WOMEN = [
  { name: "목걸이", sub: "f0a0" }, { name: "귀걸이", sub: "f0d0" },
  { name: "팔찌", sub: "f0b0" }, { name: "반지", sub: "f0c0" },
  { name: "백참/브로치", sub: "f090" }, { name: "스카프/머플러", sub: "f030" },
  { name: "모자", sub: "f070" }, { name: "키홀더", sub: "f0e0" },
  { name: "만년필/볼펜", sub: "f050" }, { name: "장갑", sub: "f080" },
  { name: "우산", sub: "f0f0" }, { name: "기타", sub: "f0h0" },
];
const SUNGLASSES_ALL = [
  { name: "선글라스", sub: "b0a010" }, { name: "안경테", sub: "b0a020" },
];
const BELTS_ALL = [
  { name: "가죽벨트", sub: "b07010" }, { name: "메쉬벨트", sub: "b07020" },
];

// Golf subcategories (2-level: L1 = section, L2 = items)
const GOLF_L1 = [
  {
    id: "golf-men-clothing", name: "남성의류",
    path: "/products/golf",
    query: "?sub=7010",
    items: [
      { name: "자켓/점퍼", sub: "701010" }, { name: "반팔티", sub: "701020" },
      { name: "긴팔티", sub: "701030" }, { name: "긴바지", sub: "701040" },
      { name: "반바지", sub: "701070" }, { name: "니트/스웨터", sub: "701090" },
      { name: "패딩/아우터", sub: "701080" }, { name: "조끼", sub: "701060" },
    ],
  },
  {
    id: "golf-women-clothing", name: "여성의류",
    path: "/products/golf",
    query: "?sub=7020",
    items: [
      { name: "자켓/점퍼", sub: "702010" }, { name: "반팔티", sub: "702020" },
      { name: "긴팔티", sub: "702030" }, { name: "긴바지", sub: "702040" },
      { name: "반바지", sub: "702050" }, { name: "원피스", sub: "702090" },
      { name: "스커트", sub: "7020a0" }, { name: "니트/스웨터", sub: "7020b0" },
      { name: "패딩아우터", sub: "702080" }, { name: "조끼", sub: "702060" },
    ],
  },
  {
    id: "golf-bags", name: "골프가방",
    path: "/products/golf",
    query: "?sub=7040",
    items: [
      { name: "캐디백", sub: "704010" }, { name: "보스턴백", sub: "704020" },
      { name: "토트백", sub: "704030" }, { name: "클러치백", sub: "704040" },
    ],
  },
  {
    id: "golf-shoes", name: "골프신발",
    path: "/products/golf",
    query: "?sub=7030",
    items: [
      { name: "골프화", sub: "703010" }, { name: "스니커즈", sub: "703020" },
    ],
  },
];

// 당일배송 / 할인상품 / 베스트상품 quick links
const SAMEDAY_LINKS = [
  { name: "전체", path: "/products/sameday" },
  { name: "의류", path: "/products/sameday?cat=clothing" },
  { name: "가방/백", path: "/products/sameday?cat=bags" },
  { name: "클러치/지갑", path: "/products/sameday?cat=wallets" },
  { name: "신발", path: "/products/sameday?cat=shoes" },
  { name: "잡화/소품", path: "/products/sameday?cat=jewelry" },
];
const DISCOUNT_LINKS = [
  { name: "전체", path: "/products/discount" },
  { name: "가방/백", path: "/products/discount?cat=bags" },
  { name: "의류", path: "/products/discount?cat=clothing" },
  { name: "지갑", path: "/products/discount?cat=wallets" },
  { name: "신발", path: "/products/discount?cat=shoes" },
  { name: "벨트", path: "/products/discount?cat=belts" },
  { name: "잡화/소품", path: "/products/discount?cat=jewelry" },
];
const BEST_LINKS = [
  { name: "전체", path: "/products/best" },
  { name: "남성의류", path: "/products/best?cat=clothing&gender=남성" },
  { name: "남성가방", path: "/products/best?cat=bags&gender=남성" },
  { name: "여성의류", path: "/products/best?cat=clothing&gender=여성" },
  { name: "여성가방", path: "/products/best?cat=bags&gender=여성" },
  { name: "신발", path: "/products/best?cat=shoes" },
  { name: "지갑", path: "/products/best?cat=wallets" },
  { name: "골프", path: "/products/best?cat=golf" },
  { name: "쥬얼리/잡화", path: "/products/best?cat=jewelry" },
  { name: "벨트", path: "/products/best?cat=belts" },
];

// Gender mega-menu category structure
const GENDER_CATS = [
  { id: "clothing", name: "의류", path: "/products/clothing", menSubcats: CLOTHING_MEN, womenSubcats: CLOTHING_WOMEN },
  { id: "bags", name: "가방", path: "/products/bags", menSubcats: BAGS_MEN, womenSubcats: BAGS_WOMEN },
  { id: "wallets", name: "지갑", path: "/products/wallets", menSubcats: WALLETS_MEN, womenSubcats: WALLETS_WOMEN },
  { id: "shoes", name: "신발", path: "/products/shoes", menSubcats: SHOES_MEN, womenSubcats: SHOES_WOMEN },
  { id: "watches", name: "시계", path: "/products/watches", menSubcats: [], womenSubcats: [] },
  { id: "jewelry", name: "쥬얼리/잡화", path: "/products/jewelry", menSubcats: JEWELRY_MEN, womenSubcats: JEWELRY_WOMEN },
  { id: "sunglasses", name: "선글라스", path: "/products/sunglasses", menSubcats: SUNGLASSES_ALL, womenSubcats: SUNGLASSES_ALL },
  { id: "belts", name: "벨트", path: "/products/belts", menSubcats: BELTS_ALL, womenSubcats: BELTS_ALL },
];

// Combined (men+women deduped) subcategory items for category dropdowns
// Deduplicates by base name (before '/') and substring containment to handle
// near-duplicates like "코트/정장" vs "코트", "후드티/집업" vs "후드티", "베스트/조끼" vs "조끼"
function combineSubcats(men: { name: string; sub: string }[], women: { name: string; sub: string }[]): { name: string; sub: string }[] {
  const result: { name: string; sub: string }[] = [];
  for (const item of [...men, ...women]) {
    const baseItem = item.name.split('/')[0].trim();
    const isDup = result.some(existing => {
      const baseExisting = existing.name.split('/')[0].trim();
      return baseExisting === baseItem
        || existing.name.includes(baseItem)
        || item.name.includes(baseExisting);
    });
    if (!isDup) result.push(item);
  }
  return result;
}

// Category dropdowns (shows combined men+women names, links to sub by caId)
const CATEGORY_SUBCATS: Record<string, { label: string; path: string; items: { name: string; sub: string }[] }> = {
  clothing: { label: "의류", path: "/products/clothing", items: combineSubcats(CLOTHING_MEN, CLOTHING_WOMEN) },
  bags: { label: "가방", path: "/products/bags", items: combineSubcats(BAGS_MEN, BAGS_WOMEN) },
  wallets: { label: "지갑", path: "/products/wallets", items: combineSubcats([...WALLETS_MEN, ...WALLETS_WOMEN], []) },
  shoes: { label: "신발", path: "/products/shoes", items: combineSubcats(SHOES_MEN, SHOES_WOMEN) },
  jewelry: { label: "쥬얼리/잡화", path: "/products/jewelry", items: combineSubcats(JEWELRY_MEN, JEWELRY_WOMEN) },
};

// Generate month list (current month + 13 months back)
function generateMonths(): { label: string; value: string }[] {
  const months: { label: string; value: string }[] = [];
  const now = new Date();
  months.push({ label: "이번달의 신상", value: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}` });
  for (let i = 1; i <= 13; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const shortY = String(y).slice(2);
    months.push({ label: `${shortY}년${m}월`, value: `${y}-${String(m).padStart(2, "0")}` });
  }
  return months;
}
const MONTHS = generateMonths();

const sideMenuLinks = [
  { name: "이달의 혜택", path: "/benefits" },
  { name: "매거진", path: "/magazine" },
  { name: "velour 랩스", path: "https://xn--oi2bw61awb384c.kr/labs", external: true },
  { name: "실시간 검수", path: "/inspection" },
  { name: "구매 후기", path: "/reviews" },
  { name: "공지사항", path: "/notices" },
  { name: "고객센터", path: "/support" },
];

const popularSearches = ["샤넬", "루이비통", "디올", "에르메스", "셀린느", "롤렉스", "자켓", "숄더백", "까르띠에", "후드"];

// ─── Main Nav item types ──────────────────────────────────────────────────────
type NavKey = "신상품" | "브랜드" | "성별" | "의류" | "가방" | "지갑" | "신발" | "시계" | "골프" | "쥬얼리" | "당일배송" | "할인상품" | "베스트상품";

const SIMPLE_NAV = [
  { key: "신상품" as NavKey, label: "신상품", path: "/products/new" },
  { key: "브랜드" as NavKey, label: "브랜드", path: "/brands" },
  { key: "성별" as NavKey, label: "성별", path: "/products/men" },
  { key: "의류" as NavKey, label: "의류", path: "/products/clothing" },
  { key: "가방" as NavKey, label: "가방", path: "/products/bags" },
  { key: "지갑" as NavKey, label: "지갑", path: "/products/wallets" },
  { key: "신발" as NavKey, label: "신발", path: "/products/shoes" },
  { key: "시계" as NavKey, label: "시계", path: "/products/watches" },
  { key: "골프" as NavKey, label: "골프", path: "/products/golf" },
  { key: "쥬얼리" as NavKey, label: "쥬얼리/잡화", path: "/products/jewelry" },
  { key: "당일배송" as NavKey, label: "당일배송", path: "/products/sameday" },
  { key: "할인상품" as NavKey, label: "할인상품", path: "/products/discount" },
  { key: "베스트상품" as NavKey, label: "베스트상품", path: "/products/best" },
];

export function Header() {
  const [location, setLocation] = useLocation();
  const { count } = useWishlist();
  const { toast } = useToast();
  const [memberName, setMemberName] = useState<string | null>(null);
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  // Desktop dropdown state
  const [navOpen, setNavOpen] = useState<string | null>(null);
  const [genderL2, setGenderL2] = useState<"남성" | "여성" | null>(null);
  const [genderL3, setGenderL3] = useState<string | null>(null);
  const [golfL2, setGolfL2] = useState<string | null>(null);
  const navTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genderL2Timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genderL3Timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const golfL2Timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mobile accordion state
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [mobileGenderExpanded, setMobileGenderExpanded] = useState<"남성" | "여성" | null>(null);
  const [mobileGenderCatExpanded, setMobileGenderCatExpanded] = useState<string | null>(null);

  // Brands from API
  const { data: brandsData } = useQuery({
    queryKey: ["brands-nav"],
    queryFn: async () => {
      const res = await fetch("/api/brands?limit=200");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000,
  });
  const brands: any[] = brandsData || [];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const check = () => setMemberName(localStorage.getItem("memberName"));
    check();
    window.addEventListener("storage", check);
    const iv = setInterval(check, 1000);
    return () => { window.removeEventListener("storage", check); clearInterval(iv); };
  }, []);

  useEffect(() => {
    if (!memberName) return;
    const fetch_ = async () => {
      const token = localStorage.getItem("memberToken");
      if (!token) return;
      try {
        const res = await fetch("/api/members/me", { headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (data.success) setPointBalance(data.data.pointBalance || 0);
      } catch {}
    };
    fetch_();
    const iv = setInterval(fetch_, 30000);
    return () => clearInterval(iv);
  }, [memberName]);

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberName");
    localStorage.removeItem("memberEmail");
    localStorage.removeItem("memberId");
    setMemberName(null);
    toast({ title: "로그아웃", description: "성공적으로 로그아웃되었습니다." });
    setLocation("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setMobileMenuOpen(false);
    }
  };

  // Desktop hover helpers (with tiny delay to prevent flicker)
  const openNav = useCallback((key: string) => {
    if (navTimeout.current) clearTimeout(navTimeout.current);
    setNavOpen(key);
    if (key !== "성별") { setGenderL2(null); setGenderL3(null); }
  }, []);

  const closeNav = useCallback(() => {
    navTimeout.current = setTimeout(() => {
      setNavOpen(null);
      setGenderL2(null);
      setGenderL3(null);
      setGolfL2(null);
    }, 300);
  }, []);

  const keepNavOpen = useCallback(() => {
    if (navTimeout.current) clearTimeout(navTimeout.current);
  }, []);

  const openGenderL2 = useCallback((g: "남성" | "여성") => {
    if (genderL2Timeout.current) clearTimeout(genderL2Timeout.current);
    setGenderL2(g);
    setGenderL3(null);
  }, []);

  const closeGenderL2 = useCallback(() => {
    genderL2Timeout.current = setTimeout(() => setGenderL2(null), 300);
  }, []);

  const keepGenderL2 = useCallback(() => {
    if (genderL2Timeout.current) clearTimeout(genderL2Timeout.current);
  }, []);

  const openGenderL3 = useCallback((catId: string) => {
    if (genderL3Timeout.current) clearTimeout(genderL3Timeout.current);
    setGenderL3(catId);
  }, []);

  const closeGenderL3 = useCallback(() => {
    genderL3Timeout.current = setTimeout(() => setGenderL3(null), 300);
  }, []);

  const keepGenderL3 = useCallback(() => {
    if (genderL3Timeout.current) clearTimeout(genderL3Timeout.current);
  }, []);

  const openGolfL2 = useCallback((id: string) => {
    if (golfL2Timeout.current) clearTimeout(golfL2Timeout.current);
    setGolfL2(id);
  }, []);

  const closeGolfL2 = useCallback(() => {
    golfL2Timeout.current = setTimeout(() => setGolfL2(null), 300);
  }, []);

  const keepGolfL2 = useCallback(() => {
    if (golfL2Timeout.current) clearTimeout(golfL2Timeout.current);
  }, []);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setMobileExpanded(null);
    setMobileGenderExpanded(null);
    setMobileGenderCatExpanded(null);
  };

  const isActive = (path: string) => location === path || location.startsWith(path + "?") || location.startsWith(path + "/");

  // Special labels for certain items
  const getNavLabel = (label: string) => {
    if (label === "당일배송") return { label, cls: "text-blue-600" };
    if (label === "할인상품") return { label, cls: "text-red-500" };
    if (label === "베스트상품") return { label, cls: "text-amber-600" };
    return { label, cls: "" };
  };

  // ── Dropdown Panels ──────────────────────────────────────────────────────────
  const DropdownPanel = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div
      className={`absolute top-full left-1/2 -translate-x-1/2 bg-white border border-gray-200 shadow-xl z-[200] rounded-b-md ${className}`}
      onMouseEnter={keepNavOpen}
      onMouseLeave={closeNav}
    >
      {children}
    </div>
  );

  // Months dropdown
  const MonthsDropdown = () => (
    <DropdownPanel className="min-w-[160px]">
      {MONTHS.map((m) => (
        <Link
          key={m.value}
          href={`/products/new?month=${m.value}`}
          className="block px-5 py-2.5 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-black whitespace-nowrap"
          onClick={() => setNavOpen(null)}
          data-testid={`nav-month-${m.value}`}
        >
          {m.label}
        </Link>
      ))}
    </DropdownPanel>
  );

  // Brands dropdown
  const BrandsDropdown = () => (
    <DropdownPanel className="w-[600px] max-h-[480px] overflow-y-auto p-4">
      <div className="columns-4 gap-2">
        <Link
          href="/brands"
          className="block py-1.5 px-2 text-[13px] font-semibold text-black hover:underline mb-2"
          onClick={() => setNavOpen(null)}
        >
          전체 브랜드
        </Link>
        {brands.map((b: any) => (
          <Link
            key={b.id}
            href={`/brands?brand=${b.id}`}
            className="block py-1.5 px-2 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50 rounded truncate"
            onClick={() => setNavOpen(null)}
            data-testid={`nav-brand-${b.id}`}
          >
            {b.name}
          </Link>
        ))}
      </div>
    </DropdownPanel>
  );

  // Gender mega-menu (3-level)
  const GenderDropdown = () => {
    const selectedCat = GENDER_CATS.find((c) => c.id === genderL3);
    const l3subcats = genderL2 === "남성" ? selectedCat?.menSubcats : selectedCat?.womenSubcats;
    return (
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 flex z-[200] shadow-xl border border-gray-200 bg-white rounded-b-md"
        onMouseEnter={keepNavOpen}
        onMouseLeave={closeNav}
      >
        {/* Column 1: 남성/여성 */}
        <div className="border-r border-gray-100 min-w-[100px]">
          {(["남성", "여성"] as const).map((g) => (
            <div
              key={g}
              className={`flex items-center justify-between px-5 py-3 text-[13px] cursor-pointer transition-colors ${genderL2 === g ? "bg-gray-50 font-semibold text-black" : "text-gray-700 hover:bg-gray-50 hover:text-black"}`}
              onMouseEnter={() => openGenderL2(g)}
              onMouseLeave={closeGenderL2}
              onClick={() => setLocation(g === "남성" ? "/products/men" : "/products/women")}
            >
              <span>{g}</span>
              <ChevronRight className="w-3 h-3 ml-2 opacity-40" />
            </div>
          ))}
        </div>

        {/* Column 2: categories */}
        {genderL2 && (
          <div
            className="border-r border-gray-100 min-w-[130px]"
            onMouseEnter={keepGenderL2}
            onMouseLeave={closeGenderL2}
          >
            {GENDER_CATS.map((cat) => (
              <div
                key={cat.id}
                className={`flex items-center justify-between px-5 py-3 text-[13px] cursor-pointer transition-colors ${genderL3 === cat.id ? "bg-gray-50 font-semibold text-black" : "text-gray-700 hover:bg-gray-50 hover:text-black"}`}
                onMouseEnter={() => openGenderL3(cat.id)}
                onMouseLeave={closeGenderL3}
                onClick={() => {
                  const gender = genderL2 === "남성" ? "남성" : "여성";
                  setLocation(`${cat.path}?gender=${encodeURIComponent(gender)}`);
                  setNavOpen(null);
                }}
              >
                <span>{cat.name}</span>
                {((genderL2 === "남성" ? cat.menSubcats : cat.womenSubcats).length > 0) && (
                  <ChevronRight className="w-3 h-3 ml-2 opacity-40" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Column 3: subcategories */}
        {genderL3 && l3subcats && l3subcats.length > 0 && (
          <div
            className="min-w-[140px] max-h-[320px] overflow-y-auto"
            onMouseEnter={keepGenderL3}
            onMouseLeave={closeGenderL3}
          >
            <Link
              href={`${selectedCat?.path}?gender=${encodeURIComponent(genderL2 === "남성" ? "남성" : "여성")}`}
              className="block px-5 py-3 text-[13px] text-gray-500 hover:text-black hover:bg-gray-50 border-b border-gray-100 font-medium"
              onClick={() => setNavOpen(null)}
            >
              전체보기
            </Link>
            {l3subcats.map((sub) => (
              <Link
                key={sub.sub}
                href={`${selectedCat?.path}?sub=${sub.sub}&gender=${encodeURIComponent(genderL2 === "남성" ? "남성" : "여성")}`}
                className="block px-5 py-3 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50"
                onClick={() => setNavOpen(null)}
                data-testid={`nav-gender-sub-${sub.sub}`}
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Simple category subcats dropdown
  const CategoryDropdown = ({ catKey }: { catKey: string }) => {
    const cat = CATEGORY_SUBCATS[catKey];
    if (!cat) return null;
    return (
      <DropdownPanel className="min-w-[150px]">
        <Link
          href={cat.path}
          className="block px-5 py-3 text-[13px] font-medium text-black border-b border-gray-100 hover:bg-gray-50"
          onClick={() => setNavOpen(null)}
        >
          전체보기
        </Link>
        {cat.items.map((sub) => (
          <Link
            key={sub.sub}
            href={`${cat.path}?subname=${encodeURIComponent(sub.name)}`}
            className="block px-5 py-2.5 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50 whitespace-nowrap"
            onClick={() => setNavOpen(null)}
            data-testid={`nav-sub-${sub.sub}`}
          >
            {sub.name}
          </Link>
        ))}
      </DropdownPanel>
    );
  };

  // Golf mega-menu (2-level hover)
  const GolfDropdown = () => {
    const selectedSection = GOLF_L1.find((s) => s.id === golfL2);
    return (
      <div
        className="absolute top-full left-1/2 -translate-x-1/2 flex z-[200] shadow-xl border border-gray-200 bg-white rounded-b-md"
        onMouseEnter={keepNavOpen}
        onMouseLeave={closeNav}
      >
        {/* Column 1: golf sections */}
        <div className="border-r border-gray-100 min-w-[120px]">
          <Link
            href="/products/golf"
            className="block px-5 py-3 text-[13px] font-medium text-black border-b border-gray-100 hover:bg-gray-50"
            onClick={() => setNavOpen(null)}
          >
            전체보기
          </Link>
          {GOLF_L1.map((section) => (
            <div
              key={section.id}
              className={`flex items-center justify-between px-5 py-3 text-[13px] cursor-pointer transition-colors ${golfL2 === section.id ? "bg-gray-50 font-semibold text-black" : "text-gray-700 hover:bg-gray-50 hover:text-black"}`}
              onMouseEnter={() => openGolfL2(section.id)}
              onMouseLeave={closeGolfL2}
              onClick={() => { setLocation(`${section.path}${section.query}`); setNavOpen(null); }}
            >
              <span>{section.name}</span>
              {section.items.length > 0 && <ChevronRight className="w-3 h-3 ml-2 opacity-40" />}
            </div>
          ))}
        </div>

        {/* Column 2: section items */}
        {golfL2 && selectedSection && selectedSection.items.length > 0 && (
          <div
            className="min-w-[130px]"
            onMouseEnter={keepGolfL2}
            onMouseLeave={closeGolfL2}
          >
            <Link
              href={`${selectedSection.path}${selectedSection.query}`}
              className="block px-5 py-3 text-[13px] font-medium text-gray-500 border-b border-gray-100 hover:text-black hover:bg-gray-50"
              onClick={() => setNavOpen(null)}
            >
              전체보기
            </Link>
            {selectedSection.items.map((item) => (
              <Link
                key={item.sub}
                href={`${selectedSection.path}?sub=${item.sub}`}
                className="block px-5 py-3 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50"
                onClick={() => setNavOpen(null)}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Quick-link dropdown (당일배송 / 할인상품 / 베스트상품 / 시계)
  const QuickLinksDropdown = ({ links }: { links: { name: string; path: string }[] }) => (
    <DropdownPanel className="min-w-[140px]">
      {links.map((link) => (
        <Link
          key={link.path}
          href={link.path}
          className="block px-5 py-2.5 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50 whitespace-nowrap"
          onClick={() => setNavOpen(null)}
        >
          {link.name}
        </Link>
      ))}
    </DropdownPanel>
  );

  // Sunglasses/Belts simple dropdown
  const SimpleSubDropdown = ({ items, path }: { items: { name: string; sub: string }[]; path: string }) => (
    <DropdownPanel className="min-w-[140px]">
      <Link href={path} className="block px-5 py-3 text-[13px] font-medium text-black border-b border-gray-100 hover:bg-gray-50" onClick={() => setNavOpen(null)}>전체보기</Link>
      {items.map((sub) => (
        <Link key={sub.sub} href={`${path}?sub=${sub.sub}`} className="block px-5 py-2.5 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50 whitespace-nowrap" onClick={() => setNavOpen(null)}>{sub.name}</Link>
      ))}
    </DropdownPanel>
  );

  // Jewelry + Sunglasses + Belts merged dropdown
  const JewelryMergedDropdown = () => {
    const cat = CATEGORY_SUBCATS["jewelry"];
    if (!cat) return null;
    return (
      <DropdownPanel className="w-[520px]">
        <div className="flex divide-x divide-gray-100">
          {/* 좌측: 쥬얼리/잡화 전체 + 2열 그리드 */}
          <div className="flex-1 py-2 min-w-0">
            <Link
              href={cat.path}
              className="block px-4 py-2.5 text-[13px] font-semibold text-black border-b border-gray-100 hover:bg-gray-50"
              onClick={() => setNavOpen(null)}
            >
              쥬얼리/잡화 전체
            </Link>
            <div className="grid grid-cols-2 px-2 py-1">
              {cat.items.map((sub) => (
                <Link
                  key={sub.sub}
                  href={`${cat.path}?subname=${encodeURIComponent(sub.name)}`}
                  className="block px-3 py-2 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50 whitespace-nowrap rounded"
                  onClick={() => setNavOpen(null)}
                >
                  {sub.name}
                </Link>
              ))}
            </div>
          </div>
          {/* 우측: 선글라스 + 벨트 */}
          <div className="w-[150px] flex-shrink-0 py-2">
            <div>
              <span className="block px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">선글라스</span>
              <Link href="/products/sunglasses" className="block px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:text-black hover:bg-gray-50 whitespace-nowrap" onClick={() => setNavOpen(null)}>전체보기</Link>
              {SUNGLASSES_ALL.map((sub) => (
                <Link key={sub.sub} href={`/products/sunglasses?sub=${sub.sub}`} className="block px-4 py-2.5 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50 whitespace-nowrap" onClick={() => setNavOpen(null)}>{sub.name}</Link>
              ))}
            </div>
            <div className="border-t border-gray-100 mt-1 pt-1">
              <span className="block px-4 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-b border-gray-100">벨트</span>
              <Link href="/products/belts" className="block px-4 py-2.5 text-[13px] font-medium text-gray-700 hover:text-black hover:bg-gray-50 whitespace-nowrap" onClick={() => setNavOpen(null)}>전체보기</Link>
              {BELTS_ALL.map((sub) => (
                <Link key={sub.sub} href={`/products/belts?sub=${sub.sub}`} className="block px-4 py-2.5 text-[13px] text-gray-700 hover:text-black hover:bg-gray-50 whitespace-nowrap" onClick={() => setNavOpen(null)}>{sub.name}</Link>
              ))}
            </div>
          </div>
        </div>
      </DropdownPanel>
    );
  };

  // ── Mobile accordion helpers ─────────────────────────────────────────────────
  const MobileAccordion = ({ title, isOpen, onToggle, href, children, special }: { title: string; isOpen: boolean; onToggle: () => void; href?: string; children?: React.ReactNode; special?: string }) => (
    <div>
      <div className={`flex items-center border-b border-gray-50 ${special === "blue" ? "text-blue-600" : special === "red" ? "text-red-500" : special === "amber" ? "text-amber-600" : ""}`}>
        {href ? (
          <Link href={href} className="flex-1 px-4 py-3.5 text-sm font-medium" onClick={closeMobileMenu}>{title}</Link>
        ) : (
          <button className="flex-1 text-left px-4 py-3.5 text-sm font-medium" onClick={onToggle}>{title}</button>
        )}
        {children && (
          <button onClick={onToggle} className="px-4 py-3.5 text-gray-400 hover:text-black">
            <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {children && isOpen && <div className="bg-gray-50">{children}</div>}
    </div>
  );

  return (
    <>
      <header className={`w-full sticky top-0 z-50 bg-white transition-shadow ${scrolled ? "shadow-sm" : ""}`}>
        {/* Announcement bar */}
        {announcementVisible && (
          <div className="bg-black text-white text-center text-sm py-3 px-4 relative">
            <span className="tracking-wide">회원가입하고 첫 구매 전상품 15% 할인 !</span>
            <button
              onClick={() => setAnnouncementVisible(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white text-xs"
              data-testid="button-dismiss-announcement"
            >
              취소
            </button>
          </div>
        )}

        {/* Top utility bar (desktop only) */}
        <div className="hidden md:block bg-[#f8f8f8] border-b border-gray-100">
          <div className="max-w-[1200px] mx-auto px-4 h-9 flex items-center justify-end text-[13px] text-gray-500 gap-3">
            {memberName ? (
              <>
                <span className="text-gray-800 font-medium">{memberName}님</span>
                <span className="text-gray-300">|</span>
                <span className="text-gray-500">{pointBalance.toLocaleString()}P</span>
                <span className="text-gray-300">|</span>
                <button onClick={handleLogout} className="hover:text-black" data-testid="button-logout">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-black" data-testid="link-login">로그인</Link>
                <span className="text-gray-300">|</span>
                <Link href="/signup" className="hover:text-black" data-testid="link-signup">회원가입</Link>
              </>
            )}
            <span className="text-gray-300">|</span>
            <Link href="/orders" className="hover:text-black">주문조회</Link>
            <span className="text-gray-300">|</span>
            <Link href="/profile" className="hover:text-black">마이페이지</Link>
          </div>
        </div>

        {/* Main header row */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-5">
            <div className="flex items-center justify-between">
              {/* Left: hamburger + logo */}
              <div className="flex items-center gap-3">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="w-10 h-10 p-0" data-testid="button-mobile-menu">
                      <Menu className="w-6 h-6 text-gray-800" />
                    </Button>
                  </SheetTrigger>

                  <SheetContent side="left" className="w-[320px] overflow-y-auto p-0" hideCloseButton>
                    {/* Sheet header */}
                    <div className="bg-black text-white p-4 flex items-center justify-between">
                      <Link href="/" onClick={closeMobileMenu}>
                        <span className="text-white font-bold text-xl tracking-widest" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.15em" }}>velour</span>
                      </Link>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:text-gray-300 p-0">
                          <X className="w-5 h-5" />
                        </Button>
                      </SheetClose>
                    </div>

                    {/* Member info */}
                    <div className="p-4 border-b bg-gray-50">
                      {memberName ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm">{memberName}님</div>
                            <span className="text-xs text-gray-500">{pointBalance.toLocaleString()}P</span>
                          </div>
                          <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="text-xs text-gray-400 hover:text-black">로그아웃</button>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <Link href="/login" className="text-sm font-medium hover:text-black" onClick={closeMobileMenu}>로그인</Link>
                          <Link href="/signup" className="text-sm text-gray-500 hover:text-black" onClick={closeMobileMenu}>회원가입</Link>
                        </div>
                      )}
                    </div>

                    {/* Search */}
                    <div className="p-4 border-b">
                      <form onSubmit={handleSearch}>
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                          <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="검색어를 입력해주세요"
                            className="flex-1 px-3 py-2.5 text-sm focus:outline-none"
                          />
                          <button type="submit" className="px-3 bg-black text-white">
                            <Search className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* Category accordion */}
                    <div className="border-b">
                      <div className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">카테고리</div>
                      <nav>
                        {/* 신상품 */}
                        <MobileAccordion
                          title="신상품"
                          isOpen={mobileExpanded === "신상품"}
                          onToggle={() => setMobileExpanded(mobileExpanded === "신상품" ? null : "신상품")}
                        >
                          {MONTHS.slice(0, 8).map((m) => (
                            <Link key={m.value} href={`/products/new?month=${m.value}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{m.label}</Link>
                          ))}
                        </MobileAccordion>

                        {/* 브랜드 */}
                        <MobileAccordion
                          title="브랜드"
                          isOpen={mobileExpanded === "브랜드"}
                          onToggle={() => setMobileExpanded(mobileExpanded === "브랜드" ? null : "브랜드")}
                        >
                          <Link href="/brands" className="block px-8 py-2.5 text-[13px] font-semibold text-black hover:bg-gray-100" onClick={closeMobileMenu}>전체 브랜드</Link>
                          {brands.slice(0, 30).map((b: any) => (
                            <Link key={b.id} href={`/brands?brand=${b.id}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{b.name}</Link>
                          ))}
                          {brands.length > 30 && (
                            <Link href="/brands" className="block px-8 py-2.5 text-[13px] text-blue-500 hover:bg-gray-100" onClick={closeMobileMenu}>전체 브랜드 보기 ({brands.length})</Link>
                          )}
                        </MobileAccordion>

                        {/* 성별 (3-level accordion) */}
                        <MobileAccordion
                          title="성별"
                          isOpen={mobileExpanded === "성별"}
                          onToggle={() => { setMobileExpanded(mobileExpanded === "성별" ? null : "성별"); setMobileGenderExpanded(null); setMobileGenderCatExpanded(null); }}
                        >
                          {(["남성", "여성"] as const).map((g) => (
                            <div key={g}>
                              <div className="flex items-center border-b border-gray-100">
                                <Link
                                  href={g === "남성" ? "/products/men" : "/products/women"}
                                  className="flex-1 px-8 py-2.5 text-[13px] text-gray-700"
                                  onClick={closeMobileMenu}
                                >{g}</Link>
                                <button
                                  onClick={() => { setMobileGenderExpanded(mobileGenderExpanded === g ? null : g); setMobileGenderCatExpanded(null); }}
                                  className="px-4 py-2.5 text-gray-400"
                                >
                                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobileGenderExpanded === g ? "rotate-180" : ""}`} />
                                </button>
                              </div>
                              {mobileGenderExpanded === g && (
                                <div className="bg-gray-100">
                                  {GENDER_CATS.map((cat) => {
                                    const subcats = g === "남성" ? cat.menSubcats : cat.womenSubcats;
                                    return (
                                      <div key={cat.id}>
                                        <div className="flex items-center border-b border-gray-200">
                                          <Link
                                            href={`${cat.path}?gender=${encodeURIComponent(g)}`}
                                            className="flex-1 px-10 py-2.5 text-[13px] text-gray-600"
                                            onClick={closeMobileMenu}
                                          >{cat.name}</Link>
                                          {subcats.length > 0 && (
                                            <button
                                              onClick={() => setMobileGenderCatExpanded(mobileGenderCatExpanded === `${g}-${cat.id}` ? null : `${g}-${cat.id}`)}
                                              className="px-4 py-2.5 text-gray-400"
                                            >
                                              <ChevronDown className={`w-3 h-3 transition-transform ${mobileGenderCatExpanded === `${g}-${cat.id}` ? "rotate-180" : ""}`} />
                                            </button>
                                          )}
                                        </div>
                                        {mobileGenderCatExpanded === `${g}-${cat.id}` && (
                                          <div className="bg-white">
                                            {subcats.map((sub) => (
                                              <Link key={sub.sub} href={`${cat.path}?sub=${sub.sub}&gender=${encodeURIComponent(g)}`} className="block px-12 py-2 text-[12px] text-gray-500 hover:text-black border-b border-gray-50" onClick={closeMobileMenu}>{sub.name}</Link>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </MobileAccordion>

                        {/* 의류 */}
                        <MobileAccordion title="의류" isOpen={mobileExpanded === "의류"} onToggle={() => setMobileExpanded(mobileExpanded === "의류" ? null : "의류")}>
                          <Link href="/products/clothing" className="block px-8 py-2.5 text-[13px] font-medium text-black hover:bg-gray-100" onClick={closeMobileMenu}>전체보기</Link>
                          {CLOTHING_MEN.map((s) => <Link key={s.sub} href={`/products/clothing?sub=${s.sub}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{s.name}</Link>)}
                        </MobileAccordion>

                        {/* 가방 */}
                        <MobileAccordion title="가방" isOpen={mobileExpanded === "가방"} onToggle={() => setMobileExpanded(mobileExpanded === "가방" ? null : "가방")}>
                          <Link href="/products/bags" className="block px-8 py-2.5 text-[13px] font-medium text-black hover:bg-gray-100" onClick={closeMobileMenu}>전체보기</Link>
                          {BAGS_MEN.map((s) => <Link key={s.sub} href={`/products/bags?sub=${s.sub}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{s.name}</Link>)}
                        </MobileAccordion>

                        {/* 지갑 */}
                        <MobileAccordion title="지갑" isOpen={mobileExpanded === "지갑"} onToggle={() => setMobileExpanded(mobileExpanded === "지갑" ? null : "지갑")}>
                          <Link href="/products/wallets" className="block px-8 py-2.5 text-[13px] font-medium text-black hover:bg-gray-100" onClick={closeMobileMenu}>전체보기</Link>
                          {WALLETS_MEN.map((s) => <Link key={s.sub} href={`/products/wallets?sub=${s.sub}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{s.name}</Link>)}
                        </MobileAccordion>

                        {/* 신발 */}
                        <MobileAccordion title="신발" isOpen={mobileExpanded === "신발"} onToggle={() => setMobileExpanded(mobileExpanded === "신발" ? null : "신발")}>
                          <Link href="/products/shoes" className="block px-8 py-2.5 text-[13px] font-medium text-black hover:bg-gray-100" onClick={closeMobileMenu}>전체보기</Link>
                          {SHOES_MEN.map((s) => <Link key={s.sub} href={`/products/shoes?sub=${s.sub}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{s.name}</Link>)}
                        </MobileAccordion>

                        {/* 시계 */}
                        <MobileAccordion title="시계" isOpen={mobileExpanded === "시계"} onToggle={() => setMobileExpanded(mobileExpanded === "시계" ? null : "시계")}>
                          <Link href="/products/watches" className="block px-8 py-2.5 text-[13px] font-medium text-black hover:bg-gray-100" onClick={closeMobileMenu}>전체 시계</Link>
                          {brands.slice(0, 20).map((b: any) => (
                            <Link key={b.id} href={`/products/watches?brand=${b.id}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{b.name}</Link>
                          ))}
                        </MobileAccordion>

                        {/* 골프 */}
                        <MobileAccordion title="골프" isOpen={mobileExpanded === "골프"} onToggle={() => setMobileExpanded(mobileExpanded === "골프" ? null : "골프")}>
                          <Link href="/products/golf" className="block px-8 py-2.5 text-[13px] font-medium text-black hover:bg-gray-100" onClick={closeMobileMenu}>전체보기</Link>
                          {GOLF_L1.map((section) => (
                            <div key={section.id}>
                              <Link href={`${section.path}${section.query}`} className="block px-8 py-2.5 text-[13px] font-medium text-gray-700 hover:bg-gray-100" onClick={closeMobileMenu}>{section.name}</Link>
                              {section.items.map((item) => (
                                <Link key={item.sub} href={`${section.path}?sub=${item.sub}`} className="block px-10 py-2 text-[12px] text-gray-500 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{item.name}</Link>
                              ))}
                            </div>
                          ))}
                        </MobileAccordion>

                        {/* 쥬얼리 + 선글라스 + 벨트 */}
                        <MobileAccordion title="쥬얼리/잡화" isOpen={mobileExpanded === "쥬얼리"} onToggle={() => setMobileExpanded(mobileExpanded === "쥬얼리" ? null : "쥬얼리")}>
                          <Link href="/products/jewelry" className="block px-8 py-2.5 text-[13px] font-medium text-black hover:bg-gray-100" onClick={closeMobileMenu}>쥬얼리/잡화 전체</Link>
                          {JEWELRY_MEN.map((s) => <Link key={s.sub} href={`/products/jewelry?sub=${s.sub}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{s.name}</Link>)}
                          <div className="px-8 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100 mt-1">선글라스</div>
                          <Link href="/products/sunglasses" className="block px-8 py-2.5 text-[13px] font-medium text-gray-700 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>전체보기</Link>
                          {SUNGLASSES_ALL.map((s) => <Link key={s.sub} href={`/products/sunglasses?sub=${s.sub}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{s.name}</Link>)}
                          <div className="px-8 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wide border-t border-gray-100 mt-1">벨트</div>
                          <Link href="/products/belts" className="block px-8 py-2.5 text-[13px] font-medium text-gray-700 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>전체보기</Link>
                          {BELTS_ALL.map((s) => <Link key={s.sub} href={`/products/belts?sub=${s.sub}`} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{s.name}</Link>)}
                        </MobileAccordion>

                        {/* 당일배송 */}
                        <MobileAccordion title="당일배송" isOpen={mobileExpanded === "당일배송"} onToggle={() => setMobileExpanded(mobileExpanded === "당일배송" ? null : "당일배송")} special="blue">
                          {SAMEDAY_LINKS.map((link) => (
                            <Link key={link.path} href={link.path} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{link.name}</Link>
                          ))}
                        </MobileAccordion>

                        {/* 할인상품 */}
                        <MobileAccordion title="할인상품" isOpen={mobileExpanded === "할인상품"} onToggle={() => setMobileExpanded(mobileExpanded === "할인상품" ? null : "할인상품")} special="red">
                          {DISCOUNT_LINKS.map((link) => (
                            <Link key={link.path} href={link.path} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{link.name}</Link>
                          ))}
                        </MobileAccordion>

                        {/* 베스트상품 */}
                        <MobileAccordion title="베스트상품" isOpen={mobileExpanded === "베스트상품"} onToggle={() => setMobileExpanded(mobileExpanded === "베스트상품" ? null : "베스트상품")} special="amber">
                          {BEST_LINKS.map((link) => (
                            <Link key={link.path} href={link.path} className="block px-8 py-2.5 text-[13px] text-gray-600 hover:text-black hover:bg-gray-100" onClick={closeMobileMenu}>{link.name}</Link>
                          ))}
                        </MobileAccordion>
                      </nav>
                    </div>

                    {/* More links */}
                    <div className="p-4">
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">더보기</div>
                      {sideMenuLinks.map((item) =>
                        item.external ? (
                          <a key={item.name} href={item.path} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between py-2.5 text-sm text-gray-600 hover:text-black" onClick={closeMobileMenu}>
                            <span>{item.name}</span><ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                          </a>
                        ) : (
                          <Link key={item.name} href={item.path} className="flex items-center justify-between py-2.5 text-sm text-gray-600 hover:text-black" onClick={closeMobileMenu}>
                            <span>{item.name}</span><ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                          </Link>
                        )
                      )}
                    </div>
                  </SheetContent>
                </Sheet>

                <Link href="/" className="flex items-center" data-testid="link-home">
                  <span className="font-bold text-xl md:text-2xl tracking-widest text-black" style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.15em" }}>velour</span>
                </Link>
              </div>

              {/* Right: icons */}
              <div className="flex flex-col items-end md:flex-row md:items-center gap-0 md:gap-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 text-gray-700 hover:text-black" data-testid="button-search-toggle">
                    <Search className="w-5 h-5" />
                  </button>
                  <Link href="/profile" className="hidden md:block p-2 text-gray-700 hover:text-black" data-testid="link-profile">
                    <User className="w-5 h-5" />
                  </Link>
                  <Link href="/cart" className="relative p-2 text-gray-700 hover:text-black hidden md:block" data-testid="button-cart">
                    <ShoppingBag className="w-5 h-5" />
                    {count > 0 && (
                      <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                        {count > 9 ? "9+" : count}
                      </span>
                    )}
                  </Link>
                </div>
                {/* Mobile quick links */}
                <div className="md:hidden flex items-center gap-1 text-[11px] text-black pb-1 pr-2">
                  {memberName ? (
                    <Link href="/profile" className="hover:opacity-70" data-testid="mobile-link-profile">마이페이지</Link>
                  ) : (
                    <>
                      <Link href="/login" className="hover:opacity-70" data-testid="mobile-link-login">로그인</Link>
                      <span className="text-gray-300">|</span>
                      <Link href="/signup" className="hover:opacity-70" data-testid="mobile-link-signup">회원가입</Link>
                      <span className="text-gray-300">|</span>
                    </>
                  )}
                  <Link href="/cart" className="hover:opacity-70 flex items-center gap-0.5" data-testid="mobile-link-cart">
                    장바구니
                    {count > 0 && <span className="bg-black text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">{count > 9 ? "9+" : count}</span>}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Desktop mega nav ────────────────────────────────────────────────── */}
        <nav className="hidden md:block bg-white border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto px-4">
            <ul className="flex items-center justify-center gap-0">
              {SIMPLE_NAV.map((item, idx) => {
                const hasDropdown = !!item.key;
                const { cls: specialCls } = getNavLabel(item.label);
                const active = isActive(item.path);
                return (
                  <li
                    key={idx}
                    className="relative"
                    onMouseEnter={() => { if (item.key) openNav(item.key); else closeNav(); }}
                    onMouseLeave={closeNav}
                  >
                    <Link
                      href={item.path}
                      className={`flex items-center gap-0.5 px-3 lg:px-4 py-3.5 text-[13px] transition-colors whitespace-nowrap ${specialCls || (active ? "text-black font-semibold" : "text-gray-600 hover:text-black hover:font-medium")}`}
                      data-testid={`nav-${item.label}`}
                    >
                      {item.label}
                      {hasDropdown && <ChevronDown className="w-3 h-3 ml-0.5 opacity-40" />}
                    </Link>

                    {/* Dropdown panels */}
                    {item.key === "신상품" && navOpen === "신상품" && <MonthsDropdown />}
                    {item.key === "브랜드" && navOpen === "브랜드" && <BrandsDropdown />}
                    {item.key === "성별" && navOpen === "성별" && <GenderDropdown />}
                    {item.key === "의류" && navOpen === "의류" && <CategoryDropdown catKey="clothing" />}
                    {item.key === "가방" && navOpen === "가방" && <CategoryDropdown catKey="bags" />}
                    {item.key === "지갑" && navOpen === "지갑" && <CategoryDropdown catKey="wallets" />}
                    {item.key === "신발" && navOpen === "신발" && <CategoryDropdown catKey="shoes" />}
                    {item.key === "시계" && navOpen === "시계" && <QuickLinksDropdown links={[{ name: "전체 시계", path: "/products/watches" }, ...brands.filter((b: any) => b.productCount > 0).slice(0, 20).map((b: any) => ({ name: b.name, path: `/products/watches?brand=${b.id}` }))]} />}
                    {item.key === "골프" && navOpen === "골프" && <GolfDropdown />}
                    {item.key === "쥬얼리" && navOpen === "쥬얼리" && <JewelryMergedDropdown />}
                    {item.key === "당일배송" && navOpen === "당일배송" && <QuickLinksDropdown links={SAMEDAY_LINKS} />}
                    {item.key === "할인상품" && navOpen === "할인상품" && <QuickLinksDropdown links={DISCOUNT_LINKS} />}
                    {item.key === "베스트상품" && navOpen === "베스트상품" && <QuickLinksDropdown links={BEST_LINKS} />}
                  </li>
                );
              })}
            </ul>
          </div>
        </nav>

        {/* ── Mobile horizontal scroll nav ────────────────────────────────────── */}
        <div className="md:hidden bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="flex items-center px-2 py-2 gap-0 min-w-max">
            {SIMPLE_NAV.map((item, idx) => {
              const { cls: specialCls } = getNavLabel(item.label);
              return (
                <Link
                  key={idx}
                  href={item.path}
                  className={`px-3 py-1.5 text-[12px] whitespace-nowrap ${specialCls || (isActive(item.path) ? "text-black font-semibold" : "text-gray-600 hover:text-black")}`}
                  data-testid={`nav-mobile-${item.label}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── Search overlay ──────────────────────────────────────────────────── */}
        {searchOpen && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
            <div className="max-w-[600px] mx-auto px-4 py-6">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex border-b-2 border-black">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="검색어를 입력해주세요"
                    className="flex-1 py-3 text-base focus:outline-none bg-transparent"
                    autoFocus
                    data-testid="input-search"
                  />
                  <button type="submit" className="px-3">
                    <Search className="w-5 h-5 text-gray-800" />
                  </button>
                </div>
              </form>
              <div>
                <p className="text-xs text-gray-400 mb-3 font-medium">인기 검색어</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-0">
                  {popularSearches.map((term, i) => (
                    <button
                      key={term}
                      onClick={() => { setLocation(`/search?q=${encodeURIComponent(term)}`); setSearchOpen(false); }}
                      className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-black text-left border-b border-gray-50"
                      data-testid={`search-popular-${i}`}
                    >
                      <span className="text-sm text-red-500 font-bold w-5 text-center">{i + 1}</span>
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={() => setSearchOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {searchOpen && <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSearchOpen(false)} />}
    </>
  );
}
