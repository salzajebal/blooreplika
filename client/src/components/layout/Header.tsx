import { Search, User, Heart, Menu, Sparkles, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export function Header() {
  const [location, setLocation] = useLocation();
  const { count } = useWishlist();
  const { toast } = useToast();
  const [memberName, setMemberName] = useState<string | null>(null);
  const [pointBalance, setPointBalance] = useState<number>(0);

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
      const memberData = localStorage.getItem("kaggold_member");
      if (!memberData) return;
      
      try {
        const parsed = JSON.parse(memberData);
        const res = await fetch("/api/members/me", {
          headers: { Authorization: `Bearer ${parsed.token}` },
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
    toast({
      title: "로그아웃",
      description: "성공적으로 로그아웃되었습니다.",
    });
    setLocation("/");
  };

  const navItems = [
    { name: '금시세조회', path: '/gold-price' },
    { name: '골드바', path: '/products/gold_bar' },
    { name: '실버바', path: '/products/silver_bar' },
    { name: '돌선물', path: '/products/baby_ring' },
    { name: '순금기념품', path: '/products/jewelry' },
    { name: '순금주얼리', path: '/products/pure_jewelry' },
    { name: '후기', path: '/reviews', hasIcon: true }
  ];

  return (
    <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 text-white py-2.5 relative overflow-hidden">
        <div className="container-custom flex justify-center items-center gap-4 relative">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="font-medium tracking-wide text-sm md:text-base flex items-center gap-2">
            창립 2주년 기념 특별가
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-amber-200 text-sm">
            |
            <span className="font-semibold text-white ml-2">금 750,000원</span>
            <span className="text-amber-300">/돈</span>
            <span className="mx-2">·</span>
            <span className="font-semibold text-white">은 10,150원</span>
            <span className="text-amber-300">/돈</span>
          </span>
          <span className="hidden lg:inline text-amber-300 text-xs ml-2">
            (별도문의)
          </span>
          <Sparkles className="w-4 h-4 text-amber-300" />
        </div>
      </div>

      <div className="bg-[#f8f8f8] border-b border-gray-100 py-2 hidden md:block">
        <div className="container-custom flex justify-between items-center text-xs text-gray-500">
          <div className="flex gap-4">
            <Link href="/notices">공지사항</Link>
            <Link href="/reviews">고객후기</Link>
          </div>
          <div className="flex gap-4 items-center">
            {memberName ? (
              <>
                <Link href="/profile" className="text-amber-700 font-semibold flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {memberName}님
                </Link>
                <Link href="/profile" className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-bold text-xs" data-testid="header-point-balance">
                  {pointBalance.toLocaleString()}P
                </Link>
                <Link href="/deposit" className="text-amber-600 hover:text-amber-700">입금신청</Link>
                <button onClick={handleLogout} className="flex items-center gap-1 hover:text-gray-700">
                  <LogOut className="w-3 h-3" />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login">로그인</Link>
                <Link href="/signup">회원가입</Link>
              </>
            )}
            <Link href="/cart">장바구니</Link>
            <Link href="/support">고객센터</Link>
            <Link href="/admin" className="text-primary font-medium">관리자</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-custom py-6 flex items-center justify-between">
        {/* Premium Logo */}
        <Link href="/" className="flex items-center gap-3 group cursor-pointer">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"></div>
            <div className="absolute inset-[2px] bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 rounded-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl font-serif font-bold text-amber-900 drop-shadow-sm" style={{textShadow: '0 1px 2px rgba(255,255,255,0.5)'}}>金</span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full opacity-80"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-gray-900 leading-none">한국골드금거래소</span>
            <span className="text-[10px] text-amber-600 font-medium tracking-widest uppercase mt-1">KOREA AUTHORIZED GOLD EXCHANGE</span>
          </div>
        </Link>

        {/* Desktop Nav - Centered if possible, but here simplified */}
        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="검색어를 입력해주세요" 
              className="w-full border border-gray-300 rounded-none px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Button size="icon" variant="ghost" className="absolute right-0 top-0 h-full text-gray-500 hover:text-primary">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Icons */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="relative" data-testid="button-profile">
              <User className="w-6 h-6" />
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative" data-testid="button-cart">
              <Heart className="w-6 h-6" />
              {count > 0 && (
                <span className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full" data-testid="text-cart-count">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {memberName && (
                  <div className="pb-4 border-b">
                    <div className="text-lg font-bold text-amber-700 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      {memberName}님
                    </div>
                    <Link href="/profile" className="mt-2 inline-block bg-amber-100 text-amber-800 px-3 py-1 rounded font-bold text-sm" data-testid="mobile-point-balance">
                      보유 포인트: {pointBalance.toLocaleString()}P
                    </Link>
                  </div>
                )}
                <Link href="/" className="text-lg font-medium">홈</Link>
                {navItems.map((item) => (
                  <Link key={item.name} href={item.path} className="text-lg font-medium hover:text-primary">
                    {item.name}
                  </Link>
                ))}
                <Link href="/notices" className="text-lg font-medium hover:text-primary">공지사항</Link>
                <Link href="/reviews" className="text-lg font-medium hover:text-primary">고객후기</Link>
                <Link href="/support" className="text-lg font-medium hover:text-primary">고객센터</Link>
                {memberName ? (
                  <>
                    <Link href="/deposit" className="text-lg font-medium text-amber-600 mt-4 pt-4 border-t">입금신청</Link>
                    <Link href="/profile" className="text-lg font-medium hover:text-primary">마이페이지</Link>
                    <button onClick={handleLogout} className="text-lg font-medium text-gray-500 text-left flex items-center gap-2">
                      <LogOut className="w-5 h-5" />
                      로그아웃
                    </button>
                  </>
                ) : (
                  <Link href="/login" className="text-lg font-medium text-gray-500 mt-4 pt-4 border-t">로그인</Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="border-t border-gray-100 hidden md:block bg-white shadow-sm">
        <div className="container-custom">
          <ul className="flex items-center gap-8 h-14">
            <li>
              <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 hover:text-primary transition-colors h-14 border-b-2 border-transparent hover:border-primary">
                <Menu className="w-5 h-5" />
                전체카테고리
              </Link>
            </li>
            {navItems.map((item) => (
              <li key={item.name}>
                <Link href={item.path} className={cn(
                  "text-gray-700 font-medium hover:text-primary transition-colors text-sm h-14 flex items-center border-b-2 border-transparent hover:border-primary px-1",
                  location === item.path && "text-primary border-primary",
                  item.hasIcon && "gap-1"
                )}>
                  {item.hasIcon && <Sparkles className="w-4 h-4 text-amber-500" />}
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
