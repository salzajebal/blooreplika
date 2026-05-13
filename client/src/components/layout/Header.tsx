import { Search, Menu, X, ShoppingBag, User, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect } from "react";

const NAV_TABS = [
  { label: "메인", path: "/" },
  { label: "SHOP", path: "/products", badge: false },
  { label: "기획전", path: "/events", badge: false },
  { label: "랭킹", path: "/ranking", badge: true },
  { label: "STYLE", path: "/magazine", badge: true },
  { label: "리뷰", path: "/reviews", badge: false },
  { label: "국내배송", path: "/products/sameday", badge: false },
  { label: "브랜드", path: "/brands", badge: false },
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
  const [bannerVisible, setBannerVisible] = useState(true);

  useEffect(() => {
    const check = () => setMemberName(localStorage.getItem("memberName"));
    check();
    window.addEventListener("storage", check);
    const iv = setInterval(check, 1000);
    return () => { window.removeEventListener("storage", check); clearInterval(iv); };
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

  const isActive = (path: string, label: string) => {
    if (label === "메인") return location === "/";
    if (label === "SHOP") return location.startsWith("/products") && !location.startsWith("/products/sameday");
    if (label === "국내배송") return location.startsWith("/products/sameday");
    return location === path || location.startsWith(path + "/") || location.startsWith(path + "?");
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm max-w-[640px] mx-auto" style={{ left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
        {/* Top app banner */}
        {bannerVisible && (
          <div className="bg-[#1a1a2e] text-white text-xs flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center flex-shrink-0">
                <span className="text-[#1a1a2e] font-black text-[11px]">V</span>
              </div>
              <span className="text-[11px]">앱설치하고 <span className="text-[#FF6100] font-bold">1만원 적립금</span> 받자!</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="bg-[#FF6100] text-white text-[11px] px-3 py-1 rounded-md font-bold whitespace-nowrap">앱설치</button>
              <button onClick={() => setBannerVisible(false)} className="text-white/60 hover:text-white p-0.5" aria-label="닫기">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Search bar row */}
        <div className="px-3 py-2 bg-white border-b border-gray-100">
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="flex-1 flex items-center bg-gray-100 rounded-full px-3 py-2 gap-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품과 브랜드를 검색해보세요."
                className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                data-testid="header-search-input"
              />
            </form>
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 text-gray-600 hover:text-gray-900 touch-manipulation"
              aria-label="메뉴"
              data-testid="header-menu-btn"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab navigation */}
        <nav className="bg-white border-b border-gray-200 overflow-x-auto scrollbar-hide" data-testid="header-tabs">
          <div className="flex">
            {NAV_TABS.map((tab) => {
              const active = isActive(tab.path, tab.label);
              return (
                <Link
                  key={tab.label}
                  href={tab.path}
                  className={`flex-shrink-0 px-4 py-3 text-sm font-medium relative whitespace-nowrap transition-colors ${
                    active
                      ? "text-black border-b-2 border-black"
                      : "text-gray-500 hover:text-gray-800"
                  }`}
                  data-testid={`nav-tab-${tab.label}`}
                >
                  {tab.label}
                  {tab.badge && (
                    <span className="absolute top-2.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                  )}
                </Link>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Invisible spacer to push content below fixed header */}
      <div style={{ height: bannerVisible ? '128px' : '92px' }} className="flex-shrink-0" />

      {/* Side drawer overlay */}
      {menuOpen && (
        <div className="fixed inset-0 z-[200]" data-testid="side-menu-overlay">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
              <span className="font-bold text-base text-gray-900">velour</span>
              <button onClick={() => setMenuOpen(false)} className="p-1 text-gray-500 hover:text-gray-900" data-testid="side-menu-close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Member area */}
              <div className="px-4 py-4 border-b border-gray-100">
                {memberName ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{memberName}님, 안녕하세요!</p>
                      <Link href="/profile" onClick={() => setMenuOpen(false)} className="text-xs text-[#FF6100] font-medium mt-0.5 block">
                        마이페이지 보기 →
                      </Link>
                    </div>
                    <Link href="/cart" onClick={() => setMenuOpen(false)} className="relative p-2">
                      <ShoppingBag className="w-5 h-5 text-gray-600" />
                      {count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#FF6100] text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                          {count}
                        </span>
                      )}
                    </Link>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Link
                      href="/login"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 py-2.5 border border-gray-200 text-sm text-center rounded-lg font-medium text-gray-700 hover:bg-gray-50"
                    >
                      로그인
                    </Link>
                    <Link
                      href="/signup"
                      onClick={() => setMenuOpen(false)}
                      className="flex-1 py-2.5 bg-black text-white text-sm text-center rounded-lg font-medium hover:bg-gray-800"
                    >
                      회원가입
                    </Link>
                  </div>
                )}
              </div>

              {/* Main nav */}
              <div className="px-2 py-2 border-b border-gray-100">
                {NAV_TABS.map((tab) => (
                  <Link
                    key={tab.label}
                    href={tab.path}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-black"
                    data-testid={`side-nav-${tab.label}`}
                  >
                    <span>{tab.label}</span>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                  </Link>
                ))}
              </div>

              {/* Extra links */}
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
                  찜 / 장바구니
                  {count > 0 && <span className="ml-2 text-[#FF6100] font-bold text-xs">({count})</span>}
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
