import { Search, Menu, X, ShoppingBag, User, ChevronRight, MessageCircle, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect } from "react";

const SUB_NAV = [
  { label: "실시간 검수", path: "/inspection", highlight: true },
  { label: "리뷰", path: "/reviews" },
  { label: "샐럽", path: "/choice" },
  { label: "남성", path: "/products?gender=%EB%82%A8%EC%84%B1" },
  { label: "여성", path: "/products?gender=%EC%97%AC%EC%84%B1" },
  { label: "공지사항", path: "/notices" },
];

const SIDE_MENU_EXTRA = [
  { label: "주문조회", path: "/orders" },
  { label: "공지사항", path: "/notices" },
  { label: "자주묻는질문", path: "/faq" },
  { label: "1:1 문의", path: "/support" },
  { label: "이용안내", path: "/guide" },
];

export function Header() {
  const [location, setLocation] = useLocation();
  const { count } = useWishlist();
  const [memberName, setMemberName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("5월 쿠폰 지급, 전 상품 15% 할인!");

  useEffect(() => {
    const check = () => setMemberName(localStorage.getItem("memberName"));
    check();
    window.addEventListener("storage", check);
    const iv = setInterval(check, 1000);
    return () => { window.removeEventListener("storage", check); clearInterval(iv); };
  }, []);

  useEffect(() => {
    fetch("/api/site-settings/announcement").then(r => r.json()).then(d => {
      if (d.success && d.data?.text) setAnnouncementText(d.data.text);
    }).catch(() => {});
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberName");
    localStorage.removeItem("memberEmail");
    localStorage.removeItem("memberId");
    setMemberName(null);
    setMenuOpen(false);
    setLocation("/");
  };

  return (
    <>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
        {/* ── Announcement bar ── */}
        <div className="bg-[#060133] text-white text-center py-2 text-[13px] tracking-wide font-medium">
          {announcementText.split("15%").map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>{part}<span className="text-orange-400 font-bold">15%</span></span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </div>

        {/* ── Main header ── */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1280px] mx-auto px-5 flex items-center gap-4 h-[60px]">
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-1 text-gray-700 hover:text-black touch-manipulation flex-shrink-0"
              aria-label="메뉴"
              data-testid="header-menu-btn"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0 mr-2">
              <img
                src="/bloo/logo.jpg"
                alt="VELOUR"
                className="h-[34px] w-auto object-contain select-none"
                style={{ maxWidth: 140 }}
              />
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-[420px] flex items-center border border-gray-300 rounded-sm overflow-hidden h-[38px]">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제품,브랜드,카테고리 등"
                className="flex-1 px-3 text-sm outline-none text-gray-700 placeholder-gray-400 h-full"
                data-testid="header-search-input"
              />
              <button type="submit" className="w-10 h-full flex items-center justify-center bg-white hover:bg-gray-50 flex-shrink-0 border-l border-gray-300">
                <Search className="w-4 h-4 text-gray-500" />
              </button>
            </form>

            {/* Right icons */}
            <div className="ml-auto flex items-center gap-1">
              <Link
                href={memberName ? "/profile" : "/login"}
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-gray-700 hover:text-black font-medium transition-colors"
                data-testid="header-login-link"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{memberName ? memberName.slice(0, 5) : "로그인"}</span>
              </Link>
              <Link
                href="/profile"
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-gray-700 hover:text-black font-medium transition-colors"
                data-testid="header-my-link"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">my</span>
              </Link>
              <Link
                href="/cart"
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-gray-700 hover:text-black font-medium transition-colors relative"
                data-testid="header-cart-link"
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden sm:inline">cart</span>
                {count > 0 && (
                  <span className="absolute -top-0.5 right-0 w-4 h-4 bg-[#060133] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {count}
                  </span>
                )}
              </Link>
              <Link
                href="/support"
                className="flex items-center gap-1 px-3 py-1.5 text-[13px] text-gray-700 hover:text-black font-medium transition-colors"
                data-testid="header-support-link"
              >
                <MessageCircle className="w-4 h-4" />
                <span className="hidden sm:inline">1:1상담</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── Sub-nav ── */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-[1280px] mx-auto px-5 flex items-center gap-0 overflow-x-auto scrollbar-hide h-[40px]">
            {SUB_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.path}
                className={`flex-shrink-0 flex items-center gap-1 px-3 h-full text-[13px] font-medium transition-colors whitespace-nowrap ${
                  item.highlight
                    ? "text-[#00a050] hover:text-[#008040]"
                    : "text-gray-700 hover:text-black"
                } ${location === item.path || location.startsWith(item.path + "?") ? "border-b-2 border-[#060133]" : ""}`}
                data-testid={`subnav-${item.label}`}
              >
                {item.label}
                {item.highlight && (
                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Spacer: announcement(32) + main header(60) + subnav(40) = 132px */}
      <div style={{ height: "132px" }} className="flex-shrink-0" />

      {/* ── Side drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[200]" data-testid="side-menu-overlay">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100 bg-[#060133]">
              <span className="font-black text-xl text-white" style={{ fontFamily: "'Playfair Display', serif" }}>VELOUR</span>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-white/80 hover:text-white" data-testid="side-menu-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-4 border-b border-gray-100">
                {memberName ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{memberName}님, 안녕하세요!</p>
                      <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-xs text-[#060133] font-medium mt-0.5 block">
                        마이페이지 보기 →
                      </Link>
                    </div>
                    <Link href="/cart" onClick={() => setMenuOpen(false)} className="relative p-2">
                      <ShoppingBag className="w-5 h-5 text-gray-600" />
                      {count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#060133] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {count}
                        </span>
                      )}
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link href="/login" onClick={() => setMenuOpen(false)} className="flex-1 py-2.5 border border-gray-300 text-sm text-center rounded font-medium text-gray-700 hover:bg-gray-50">
                      로그인
                    </Link>
                    <Link href="/signup" onClick={() => setMenuOpen(false)} className="flex-1 py-2.5 bg-[#060133] text-white text-sm text-center rounded font-medium hover:bg-[#0a0240]">
                      회원가입
                    </Link>
                  </div>
                )}
              </div>

              <div className="px-2 py-2 border-b border-gray-100">
                {SUB_NAV.map((item) => (
                  <Link
                    key={item.label}
                    href={item.path}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium hover:bg-gray-50 ${item.highlight ? "text-[#00a050]" : "text-gray-700 hover:text-black"}`}
                    data-testid={`side-subnav-${item.label}`}
                  >
                    <span className="flex items-center gap-1.5">
                      {item.label}
                      {item.highlight && <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />}
                    </span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                ))}
              </div>

              <div className="px-2 py-2">
                {SIDE_MENU_EXTRA.map((item) => (
                  <Link
                    key={item.label}
                    href={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link href="/cart" onClick={() => setMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700">
                  장바구니
                  {count > 0 && <span className="ml-2 text-[#060133] font-bold text-xs">({count})</span>}
                </Link>
                {memberName && (
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-3 py-2.5 rounded-lg text-sm text-red-500 hover:bg-red-50 mt-2"
                    data-testid="side-logout"
                  >
                    로그아웃
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
