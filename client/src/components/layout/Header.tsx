import { Search, User, ShoppingBag, Menu, X, Heart, ChevronDown } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const categoryNavItems = [
  { name: '신상품', path: '/products/new-arrivals' },
  { name: '남성', path: '/products/men' },
  { name: '여성', path: '/products/women' },
  { name: '의류', path: '/products/clothing' },
  { name: '가방', path: '/products/bags' },
  { name: '지갑', path: '/products/wallets' },
  { name: '신발', path: '/products/shoes' },
  { name: '골프', path: '/products/golf' },
  { name: '쥬얼리/잡화', path: '/products/jewelry' },
  { name: '시계', path: '/products/watches' },
  { name: '당일배송', path: '/products/sameday' },
  { name: '할인상품', path: '/products/sale' },
  { name: '베스트상품', path: '/products/best' },
];

const menuItems = [
  { name: '소개글', path: '/about' },
  { name: '공지사항', path: '/notices' },
  { name: '1:1 비교', path: '/comparison' },
  { name: '베스트리뷰', path: '/reviews' },
  { name: '블로그', path: '/blog' },
  { name: '검수', path: '/inspection' },
  { name: '라이크잇초이스', path: '/choice' },
  ...categoryNavItems,
  { name: '커뮤니티', path: '/comparison' },
  { name: '상품후기', path: '/reviews' },
];

const popularSearches = ["샤넬", "루이비통", "디올", "에르메스", "셀린느", "롤렉스", "자켓", "숄더백", "까르띠에", "후드"];

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkLoginStatus = () => {
      const name = localStorage.getItem("memberName");
      setMemberName(name);
    };
    checkLoginStatus();
    window.addEventListener("storage", checkLoginStatus);
    const interval = setInterval(checkLoginStatus, 1000);
    return () => {
      window.removeEventListener("storage", checkLoginStatus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const fetchPointBalance = async () => {
      const token = localStorage.getItem("memberToken");
      if (!token) return;
      try {
        const res = await fetch("/api/members/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setPointBalance(data.data.pointBalance || 0);
        }
      } catch (error) {
        console.error("Error fetching point balance:", error);
      }
    };
    if (memberName) {
      fetchPointBalance();
      const interval = setInterval(fetchPointBalance, 30000);
      return () => clearInterval(interval);
    }
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
    }
  };

  const handleQuickSearch = (term: string) => {
    setLocation(`/search?q=${encodeURIComponent(term)}`);
    setSearchOpen(false);
  };

  return (
    <>
      <header className={`w-full sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-sm' : ''}`}>
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

        <div className="hidden md:block bg-[#f8f8f8] border-b border-gray-100">
          <div className="max-w-[1200px] mx-auto px-4 h-9 flex items-center justify-between text-[13px] text-gray-500">
            <div className="flex items-center gap-1">
            </div>
            <div className="flex items-center gap-3">
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
        </div>

        <div className="bg-white border-b border-gray-100">
          <div className="max-w-[1200px] mx-auto px-4 py-4 md:py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden w-10 h-10 p-0" data-testid="button-mobile-menu">
                      <Menu className="w-6 h-6 text-gray-800" />
                    </Button>
                  </SheetTrigger>

                  <SheetContent side="left" className="w-[300px] overflow-y-auto p-0" hideCloseButton>
                    <div className="bg-black text-white p-4 flex items-center justify-between">
                      <Link href="/" className="text-lg font-bold tracking-wider" onClick={() => setMobileMenuOpen(false)} style={{ fontFamily: "'Playfair Display', serif" }}>LIKE IT</Link>
                      <SheetClose asChild>
                        <Button variant="ghost" size="icon" className="text-white hover:text-gray-300 p-0">
                          <X className="w-5 h-5" />
                        </Button>
                      </SheetClose>
                    </div>
                    <div className="p-4 border-b">
                      {memberName ? (
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-sm">{memberName}님</div>
                            <span className="text-xs text-gray-500">{pointBalance.toLocaleString()}P</span>
                          </div>
                          <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="text-xs text-gray-400">
                            로그아웃
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-4">
                          <Link href="/login" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                          <Link href="/signup" className="text-sm text-gray-500" onClick={() => setMobileMenuOpen(false)}>회원가입</Link>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <form onSubmit={handleSearch} className="mb-4">
                        <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="검색어를 입력해주세요" 
                            className="flex-1 px-3 py-2 text-sm focus:outline-none"
                          />
                          <button type="submit" className="px-3 bg-black text-white">
                            <Search className="w-4 h-4" />
                          </button>
                        </div>
                      </form>
                      <nav>
                        {menuItems.map((item) => (
                          <Link 
                            key={`${item.name}-${item.path}`}
                            href={item.path} 
                            className="py-3 block text-sm text-gray-700 border-b border-gray-50 hover:text-black hover:font-medium transition-colors"
                            onClick={() => setMobileMenuOpen(false)}
                          >
                            {item.name}
                          </Link>
                        ))}
                      </nav>
                    </div>
                  </SheetContent>
                </Sheet>
                <Link href="/" className="flex items-center" data-testid="link-home">
                  <span className="text-2xl md:text-3xl font-black tracking-[0.2em] text-black" style={{ fontFamily: "'Playfair Display', serif" }}>LIKE IT</span>
                </Link>
              </div>

              <div className="flex items-center gap-2 md:gap-4">
                <button 
                  onClick={() => setSearchOpen(!searchOpen)} 
                  className="p-2 text-gray-700 hover:text-black transition-colors"
                  data-testid="button-search-toggle"
                >
                  <Search className="w-5 h-5" />
                </button>
                <Link href="/profile" className="hidden md:block p-2 text-gray-700 hover:text-black transition-colors" data-testid="link-profile">
                  <User className="w-5 h-5" />
                </Link>
                <Link href="/cart" className="relative p-2 text-gray-700 hover:text-black transition-colors" data-testid="button-cart">
                  <ShoppingBag className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute top-0 right-0 bg-red-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full font-bold">
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          </div>
        </div>

        <nav className="hidden md:block bg-white border-b border-gray-200">
          <div className="max-w-[1200px] mx-auto px-4">
            <ul className="flex items-center justify-center gap-0">
              {categoryNavItems.map((item, index) => (
                <li key={`${item.name}-${index}`}>
                  <Link 
                    href={item.path} 
                    className={`block px-4 lg:px-5 py-3.5 text-sm text-gray-600 hover:text-black hover:font-medium transition-colors whitespace-nowrap ${location === item.path ? 'text-black font-semibold' : ''}`}
                    data-testid={`nav-${item.name}`}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        <div className="md:hidden bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide">
          <div className="flex items-center px-3 py-2.5 gap-0 min-w-max">
            {categoryNavItems.map((item, index) => (
              <Link 
                key={`${item.name}-m-${index}`}
                href={item.path} 
                className={`px-3 py-1.5 text-[13px] text-gray-600 hover:text-black whitespace-nowrap ${location === item.path ? 'text-black font-semibold' : ''}`}
                data-testid={`nav-mobile-${item.name}`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

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
                      onClick={() => handleQuickSearch(term)}
                      className="flex items-center gap-3 py-2.5 text-sm text-gray-700 hover:text-black transition-colors text-left border-b border-gray-50"
                      data-testid={`search-popular-${i}`}
                    >
                      <span className="text-sm text-red-500 font-bold w-5 text-center">{i + 1}</span>
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => setSearchOpen(false)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-black"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </header>

      {searchOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setSearchOpen(false)} />
      )}
    </>
  );
}
