import { Search, User, ShoppingBag, Menu, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const noticeTexts = [
  "청담동에디션의 정품 제품은 NFC 연속...",
  "10월 배송 일정 안내! 자세한 내용은 공지사항 확인",
  "카카오톡 사칭 주의! 공식 채널 확인 필수",
  "월간 베스트 리뷰 이벤트 오픈!",
  "청담동에디션 25년 5월 카톡 후기 모음!",
];

const mainNavItems = [
  { name: '소개글', path: '/about' },
  { name: '공지사항', path: '/notices' },
  { name: '1:1 비교', path: '/comparison' },
  { name: '베스트리뷰', path: '/reviews' },
  { name: '블로그', path: '/blog' },
  { name: '청담동초이스', path: '/choice' },
  { name: '아우터', path: '/products/outer' },
  { name: '패딩', path: '/products/padding' },
  { name: '상의', path: '/products/tops' },
  { name: '하의', path: '/products/bottoms' },
  { name: '신발', path: '/products/shoes' },
  { name: '악세사리', path: '/products/accessories' },
  { name: '지갑', path: '/products/wallets' },
  { name: '가방', path: '/products/bags' },
  { name: '시계', path: '/products/watches' },
  { name: '정품', path: '/products/genuine' },
  { name: '커뮤니티', path: '/comparison' },
];

export function Header() {
  const [location, setLocation] = useLocation();
  const { count } = useWishlist();
  const { toast } = useToast();
  const [memberName, setMemberName] = useState<string | null>(null);
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [totalPoints] = useState<number>(7584087);
  const [todayPoints] = useState<number>(6521);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [noticeIndex, setNoticeIndex] = useState(0);

  // Auto-scroll notice ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setNoticeIndex((prev) => (prev + 1) % noticeTexts.length);
    }, 3000);
    return () => clearInterval(interval);
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
    }
  };

  return (
    <header className="w-full sticky top-0 z-50 bg-white">
      <div className="hidden md:block bg-[#333] text-white text-xs">
        <div className="max-w-[1200px] mx-auto px-4 h-8 flex items-center justify-between">
          <div className="relative overflow-hidden h-4 w-[300px]">
            <div 
              className="absolute inset-0 transition-transform duration-500 ease-in-out flex items-center"
              style={{ transform: `translateY(-${noticeIndex * 100}%)` }}
            >
              {noticeTexts.map((text, idx) => (
                <span key={idx} className="text-gray-400 text-[11px] whitespace-nowrap absolute w-full" style={{ top: `${idx * 100}%` }}>
                  {text}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center divide-x divide-gray-600">
            {memberName ? (
              <>
                <span className="px-3 text-yellow-400">{memberName}님</span>
                <button onClick={handleLogout} className="px-3 hover:text-yellow-300" data-testid="button-logout">로그아웃</button>
              </>
            ) : (
              <>
                <Link href="/login" className="px-3 hover:text-yellow-300" data-testid="link-login">로그인</Link>
                <Link href="/signup" className="px-3 hover:text-yellow-300" data-testid="link-signup">회원가입</Link>
              </>
            )}
            <Link href="/cart" className="px-3 hover:text-yellow-300">장바구니</Link>
            <Link href="/orders" className="px-3 hover:text-yellow-300">주문조회</Link>
            <Link href="/profile" className="px-3 hover:text-yellow-300">마이쇼핑</Link>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 py-5">
          <div className="grid grid-cols-3 items-center">
            <div className="md:hidden">
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-10 h-10" data-testid="button-mobile-menu">
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] overflow-y-auto p-0">
                  <div className="bg-[#333] text-white p-4 flex items-center justify-between">
                    <span className="font-bold">메뉴</span>
                    <SheetClose asChild>
                      <Button variant="ghost" size="icon" className="text-white hover:text-yellow-300">
                        <X className="w-5 h-5" />
                      </Button>
                    </SheetClose>
                  </div>
                  <nav className="p-4">
                    {memberName ? (
                      <div className="pb-4 border-b mb-4">
                        <div className="font-semibold">{memberName}님</div>
                        <span className="text-sm text-gray-500">{pointBalance.toLocaleString()}P</span>
                      </div>
                    ) : (
                      <div className="flex gap-4 pb-4 border-b mb-4">
                        <Link href="/login" className="text-sm" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                        <Link href="/signup" className="text-sm" onClick={() => setMobileMenuOpen(false)}>회원가입</Link>
                      </div>
                    )}
                    <form onSubmit={handleSearch} className="mb-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="검색" 
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                    </form>
                    {mainNavItems.map((item) => (
                      <Link 
                        key={item.name}
                        href={item.path} 
                        className="py-2.5 block text-sm text-gray-700 border-b border-gray-100"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                    ))}
                    {memberName && (
                      <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="mt-4 text-sm text-gray-500">
                        로그아웃
                      </button>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
            <div className="hidden md:block"></div>

            <Link href="/" className="flex items-center justify-self-center" data-testid="link-home">
              <img src="/images/logo.gif" alt="청담동에디션" className="h-16 md:h-20" />
            </Link>

            <div className="hidden md:flex items-center justify-end gap-5">
              <Link href="/profile" className="text-gray-500 hover:text-black">
                <User className="w-6 h-6" />
              </Link>
              <Link href="/cart" className="relative text-gray-500 hover:text-black" data-testid="button-cart">
                <ShoppingBag className="w-6 h-6" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
              
              <form onSubmit={handleSearch} className="flex items-center">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="검색" 
                  className="w-[160px] border border-gray-300 px-3 py-2 text-sm focus:outline-none"
                  data-testid="input-search"
                />
                <button type="submit" className="bg-gray-100 border border-gray-300 border-l-0 px-3 py-2 hover:bg-gray-200">
                  <Search className="w-5 h-5 text-gray-500" />
                </button>
              </form>

              <div className="text-xs text-gray-500 whitespace-nowrap">
                오늘 <span className="text-red-500 font-semibold">{todayPoints.toLocaleString()}</span> · 전체 <span className="font-semibold">{totalPoints.toLocaleString()}</span>
              </div>
            </div>

            <div className="md:hidden flex items-center justify-end">
              <Link href="/cart" className="relative text-gray-600" data-testid="button-cart-mobile">
                <ShoppingBag className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-[9px] w-4 h-4 flex items-center justify-center rounded-full">
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
          <ul className="flex items-center justify-center">
            {mainNavItems.map((item, index) => (
              <li key={item.name} className="flex items-center">
                <Link 
                  href={item.path} 
                  className={`px-3 py-3 text-sm text-gray-600 hover:text-black transition-colors whitespace-nowrap ${location === item.path ? 'text-black font-medium' : ''}`}
                  data-testid={`nav-${item.name}`}
                >
                  {item.name}
                </Link>
                {index < mainNavItems.length - 1 && (
                  <span className="text-gray-300 text-xs">|</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
