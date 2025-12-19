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
      const interval = setInterval(fetchPointBalance, 5000);
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
    { name: '후기', path: '/reviews', hasIcon: true },
    { name: '공지사항', path: '/notices', hasIcon: true }
  ];

  return (
    <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="bg-gradient-to-r from-amber-800 via-amber-700 to-amber-800 text-white py-2 sm:py-2.5 relative overflow-hidden">
        <div className="container-custom flex justify-center items-center gap-2 sm:gap-4 relative">
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" />
          <span className="font-medium tracking-wide text-xs sm:text-sm md:text-base flex items-center gap-1 sm:gap-2">
            한국금거래소 실시간 시세
          </span>
          <span className="hidden md:inline-flex items-center gap-1 text-amber-200 text-sm">
            |
            <span className="font-semibold text-white ml-2">금 900,000원</span>
            <span className="text-amber-300">/돈</span>
            <span className="mx-2">·</span>
            <span className="font-semibold text-white">은 14,540원</span>
            <span className="text-amber-300">/돈</span>
          </span>
          <span className="hidden lg:inline text-amber-300 text-xs ml-2">
            (VAT포함)
          </span>
          <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 text-amber-300" />
        </div>
      </div>

      <div className="bg-[#f8f8f8] border-b border-gray-100 py-2 sm:py-2.5 hidden md:block">
        <div className="container-custom flex justify-between items-center text-sm text-gray-600">
          <div className="flex gap-4 items-center">
            <span className="text-xs text-gray-500">한국골드금거래소 대표: 임정재</span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500">사업자등록번호: 754-29-01752</span>
            <span className="text-gray-300">|</span>
            <Link href="/notices" className="hover:text-amber-700 transition-colors">공지사항</Link>
            <Link href="/reviews" className="hover:text-amber-700 transition-colors">고객후기</Link>
          </div>
          <div className="flex gap-5 items-center">
            {memberName ? (
              <>
                <Link href="/profile" className="text-amber-700 font-semibold flex items-center gap-1.5 hover:text-amber-800">
                  <User className="w-4 h-4" />
                  {memberName}님
                </Link>
                <Link href="/profile" className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded font-bold text-sm" data-testid="header-point-balance">
                  {pointBalance.toLocaleString()}P
                </Link>
                <Link href="/withdrawal" className="text-blue-600 hover:text-blue-700 font-medium">출금신청</Link>
                <button onClick={handleLogout} className="flex items-center gap-1.5 hover:text-gray-800 transition-colors">
                  <LogOut className="w-4 h-4" />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-amber-700 transition-colors">로그인</Link>
                <Link href="/signup" className="hover:text-amber-700 transition-colors">회원가입</Link>
              </>
            )}
            <Link href="/cart" className="hover:text-amber-700 transition-colors">장바구니</Link>
            <Link href="/support" className="hover:text-amber-700 transition-colors">고객센터</Link>
          </div>
        </div>
      </div>

      <div className="container-custom py-3 sm:py-4 md:py-6 flex items-center justify-between gap-2">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 group cursor-pointer flex-shrink-0">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 rounded-lg shadow-lg group-hover:shadow-xl transition-shadow"></div>
            <div className="absolute inset-[2px] bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 rounded-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg sm:text-xl md:text-2xl font-serif font-bold text-amber-900 drop-shadow-sm" style={{textShadow: '0 1px 2px rgba(255,255,255,0.5)'}}>金</span>
            </div>
            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 sm:w-2.5 sm:h-2.5 md:w-3 md:h-3 bg-gradient-to-br from-yellow-200 to-amber-300 rounded-full opacity-80"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-sm sm:text-base md:text-lg lg:text-xl font-bold tracking-tight text-gray-900 leading-none whitespace-nowrap">한국골드금거래소</span>
            <span className="text-[8px] sm:text-[9px] md:text-[10px] text-amber-600 font-medium tracking-widest uppercase mt-0.5 sm:mt-1 hidden xs:block">KOREA GOLD EXCHANGE</span>
          </div>
        </Link>

        <div className="hidden lg:flex items-center gap-2 flex-1 max-w-md mx-4 xl:mx-8">
          <div className="relative w-full">
            <input 
              type="text" 
              placeholder="검색어를 입력해주세요" 
              className="w-full border border-gray-300 rounded-none px-4 py-2 sm:py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
            <Button size="icon" variant="ghost" className="absolute right-0 top-0 h-full text-gray-500 hover:text-primary">
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 sm:gap-4">
          <Link href="/profile">
            <Button variant="ghost" size="icon" className="relative w-9 h-9 sm:w-10 sm:h-10" data-testid="button-profile">
              <User className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" size="icon" className="relative w-9 h-9 sm:w-10 sm:h-10" data-testid="button-cart">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 bg-amber-500 text-white text-[9px] sm:text-[10px] w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded-full" data-testid="text-cart-count">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Button>
          </Link>
        </div>

        <div className="md:hidden flex items-center gap-1">
          <Link href="/cart" className="relative p-2">
            <Heart className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-amber-500 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </Link>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="w-9 h-9 touch-manipulation">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] sm:w-[320px] overflow-y-auto">
              <nav className="flex flex-col gap-3 sm:gap-4 mt-6 sm:mt-8">
                {memberName && (
                  <div className="pb-3 sm:pb-4 border-b">
                    <div className="text-base sm:text-lg font-bold text-amber-700 flex items-center">
                      <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      {memberName}님
                    </div>
                    <Link href="/profile" className="mt-2 inline-block bg-amber-100 text-amber-800 px-2.5 sm:px-3 py-1 rounded font-bold text-xs sm:text-sm" data-testid="mobile-point-balance">
                      보유 포인트: {pointBalance.toLocaleString()}P
                    </Link>
                  </div>
                )}
                <Link href="/" className="text-base sm:text-lg font-medium py-1">홈</Link>
                {navItems.map((item) => (
                  <Link key={item.name} href={item.path} className="text-base sm:text-lg font-medium hover:text-primary py-1">
                    {item.name}
                  </Link>
                ))}
                <Link href="/support" className="text-base sm:text-lg font-medium hover:text-primary py-1">고객센터</Link>
                {memberName ? (
                  <>
                    <div className="border-t pt-3 sm:pt-4 mt-2">
                      <Link href="/withdrawal" className="text-base sm:text-lg font-medium text-blue-600 py-1 block">출금신청</Link>
                      <Link href="/profile" className="text-base sm:text-lg font-medium hover:text-primary py-1 block mt-2">마이페이지</Link>
                      <button onClick={handleLogout} className="text-base sm:text-lg font-medium text-gray-500 text-left flex items-center gap-2 py-1 mt-2 w-full">
                        <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        로그아웃
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="border-t pt-3 sm:pt-4 mt-2">
                    <Link href="/login" className="text-base sm:text-lg font-medium text-gray-600 py-1 block">로그인</Link>
                    <Link href="/signup" className="text-base sm:text-lg font-medium text-gray-600 py-1 block mt-2">회원가입</Link>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <nav className="border-t border-gray-100 hidden md:block bg-white shadow-sm">
        <div className="container-custom">
          <ul className="flex items-center gap-4 lg:gap-8 h-12 lg:h-14 overflow-x-auto scrollbar-hide">
            <li className="flex-shrink-0">
              <Link href="/" className="flex items-center gap-1.5 lg:gap-2 font-bold text-gray-900 hover:text-primary transition-colors h-12 lg:h-14 border-b-2 border-transparent hover:border-primary text-sm lg:text-base">
                <Menu className="w-4 h-4 lg:w-5 lg:h-5" />
                전체카테고리
              </Link>
            </li>
            {navItems.map((item) => (
              <li key={item.name} className="flex-shrink-0">
                <Link href={item.path} className={cn(
                  "text-gray-700 font-medium hover:text-primary transition-colors text-xs lg:text-sm h-12 lg:h-14 flex items-center border-b-2 border-transparent hover:border-primary px-0.5 lg:px-1 whitespace-nowrap",
                  location === item.path && "text-primary border-primary",
                  item.hasIcon && "gap-1"
                )}>
                  {item.hasIcon && <Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-amber-500" />}
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
