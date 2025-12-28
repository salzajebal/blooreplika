import { Search, User, Heart, ShoppingBag, Menu, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

const categories = [
  { name: '아우터', path: '/products/outer', slug: 'outer' },
  { name: '패딩', path: '/products/padding', slug: 'padding' },
  { name: '상의', path: '/products/tops', slug: 'tops' },
  { name: '하의', path: '/products/bottoms', slug: 'bottoms' },
  { name: '신발', path: '/products/shoes', slug: 'shoes' },
  { name: '악세사리', path: '/products/accessories', slug: 'accessories' },
  { name: '지갑', path: '/products/wallets', slug: 'wallets' },
  { name: '가방', path: '/products/bags', slug: 'bags' },
  { name: '시계', path: '/products/watches', slug: 'watches' },
  { name: '정품', path: '/products/genuine', slug: 'genuine' },
];

const navItems = [
  { name: '후기', path: '/reviews' },
  { name: '공지사항', path: '/notices' },
  { name: '고객센터', path: '/support' },
];

export function Header() {
  const [location, setLocation] = useLocation();
  const { count } = useWishlist();
  const { toast } = useToast();
  const [memberName, setMemberName] = useState<string | null>(null);
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");

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
    toast({
      title: "로그아웃",
      description: "성공적으로 로그아웃되었습니다.",
    });
    setLocation("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="w-full bg-white sticky top-0 z-50">
      <div className="bg-black text-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center text-xs">
          <div className="flex gap-4 items-center">
            <span className="hidden md:inline">CHEONGDAM-DONG EDITION</span>
          </div>
          <div className="flex gap-3 md:gap-4 items-center">
            {memberName ? (
              <>
                <Link href="/profile" className="hover:underline flex items-center gap-1" data-testid="link-profile-name">
                  {memberName}님
                </Link>
                <span className="bg-white/20 px-2 py-0.5 rounded text-[10px]" data-testid="header-point-balance">
                  {pointBalance.toLocaleString()}P
                </span>
                <button onClick={handleLogout} className="hover:underline" data-testid="button-logout">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:underline" data-testid="link-login">로그인</Link>
                <Link href="/signup" className="hover:underline" data-testid="link-signup">회원가입</Link>
              </>
            )}
            <Link href="/cart" className="hover:underline hidden md:inline" data-testid="link-cart">장바구니</Link>
            <Link href="/support" className="hover:underline hidden md:inline" data-testid="link-support">고객센터</Link>
          </div>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="flex-shrink-0" data-testid="link-home">
            <div className="flex flex-col items-center">
              <span className="text-[10px] md:text-xs tracking-[0.3em] text-gray-500 font-light">CHEONGDAM-DONG</span>
              <h1 className="text-lg md:text-xl font-serif font-semibold tracking-wider text-black" style={{ fontFamily: "'Playfair Display', serif" }}>
                청담동에디션
              </h1>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-lg mx-8">
            <div className="relative w-full">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력해주세요" 
                className="w-full border border-gray-300 rounded-full px-5 py-2.5 text-sm focus:outline-none focus:border-black transition-colors"
                data-testid="input-search"
              />
              <Button 
                type="submit"
                size="icon" 
                variant="ghost" 
                className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
                data-testid="button-search"
              >
                <Search className="w-5 h-5" />
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-2 md:gap-4">
            <Link href="/profile" className="hidden md:flex">
              <Button variant="ghost" size="icon" className="relative w-10 h-10" data-testid="button-profile">
                <User className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/wishlist" className="hidden md:flex">
              <Button variant="ghost" size="icon" className="relative w-10 h-10" data-testid="button-wishlist">
                <Heart className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-black text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full" data-testid="text-wishlist-count">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Button>
            </Link>
            <Link href="/cart" className="hidden md:flex">
              <Button variant="ghost" size="icon" className="relative w-10 h-10" data-testid="button-cart">
                <ShoppingBag className="w-5 h-5" />
              </Button>
            </Link>
            
            <div className="md:hidden flex items-center gap-1">
              <Link href="/wishlist" className="relative p-2" data-testid="mobile-wishlist">
                <Heart className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute top-0 right-0 bg-black text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full">
                    {count > 9 ? "9+" : count}
                  </span>
                )}
              </Link>
              <Link href="/cart" className="p-2" data-testid="mobile-cart">
                <ShoppingBag className="w-5 h-5" />
              </Link>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-9 h-9" data-testid="button-mobile-menu">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] overflow-y-auto">
                  <nav className="flex flex-col gap-2 mt-8">
                    {memberName && (
                      <div className="pb-4 border-b mb-2">
                        <div className="font-semibold flex items-center gap-2">
                          <User className="w-4 h-4" />
                          {memberName}님
                        </div>
                        <span className="text-sm text-gray-500 mt-1 block">
                          보유 포인트: {pointBalance.toLocaleString()}P
                        </span>
                      </div>
                    )}
                    
                    <form onSubmit={handleSearch} className="mb-4">
                      <div className="relative">
                        <input 
                          type="text" 
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="검색어를 입력해주세요" 
                          className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-black"
                          data-testid="mobile-input-search"
                        />
                        <Button 
                          type="submit"
                          size="icon" 
                          variant="ghost" 
                          className="absolute right-0 top-1/2 -translate-y-1/2"
                        >
                          <Search className="w-4 h-4" />
                        </Button>
                      </div>
                    </form>
                    
                    <div className="font-semibold text-sm text-gray-500 uppercase mb-2">카테고리</div>
                    {categories.map((cat) => (
                      <Link key={cat.slug} href={cat.path} className="py-2 text-base font-medium hover:text-gray-600 transition-colors">
                        {cat.name}
                      </Link>
                    ))}
                    
                    <div className="border-t my-4"></div>
                    
                    {navItems.map((item) => (
                      <Link key={item.name} href={item.path} className="py-2 text-base font-medium hover:text-gray-600 transition-colors">
                        {item.name}
                      </Link>
                    ))}
                    
                    <div className="border-t my-4"></div>
                    
                    {memberName ? (
                      <>
                        <Link href="/profile" className="py-2 text-base font-medium">마이페이지</Link>
                        <button onClick={handleLogout} className="py-2 text-base font-medium text-left flex items-center gap-2 text-gray-500">
                          <LogOut className="w-4 h-4" />
                          로그아웃
                        </button>
                      </>
                    ) : (
                      <>
                        <Link href="/login" className="py-2 text-base font-medium">로그인</Link>
                        <Link href="/signup" className="py-2 text-base font-medium">회원가입</Link>
                      </>
                    )}
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      <nav className="border-b border-gray-100 hidden md:block bg-white">
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center gap-6 lg:gap-10 h-12">
            {categories.map((cat) => (
              <li key={cat.slug}>
                <Link 
                  href={cat.path} 
                  className={cn(
                    "text-sm font-medium text-gray-700 hover:text-black transition-colors h-12 flex items-center border-b-2 border-transparent hover:border-black",
                    location.startsWith(cat.path) && "text-black border-black"
                  )}
                  data-testid={`nav-${cat.slug}`}
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li className="border-l border-gray-200 h-4"></li>
            {navItems.map((item) => (
              <li key={item.name}>
                <Link 
                  href={item.path} 
                  className={cn(
                    "text-sm font-medium text-gray-500 hover:text-black transition-colors h-12 flex items-center",
                    location === item.path && "text-black"
                  )}
                  data-testid={`nav-${item.name}`}
                >
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
