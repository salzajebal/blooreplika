import { Search, User, ShoppingBag, Menu, X, ChevronDown, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

const topNavItems = [
  { name: '청담동', path: '/' },
  { name: '소개글', path: '/about' },
  { name: '공지사항', path: '/notices' },
  { name: '1:1 비교', path: '/reviews' },
  { name: '베스트리뷰', path: '/reviews' },
];

const categories = [
  { 
    name: '아우터', 
    path: '/products/outer', 
    slug: 'outer',
    subcategories: [
      { name: '여성용', path: '/products/outer?sub=women' },
      { name: '남성용', path: '/products/outer?sub=men' },
    ]
  },
  { 
    name: '패딩', 
    path: '/products/padding', 
    slug: 'padding',
    subcategories: [
      { name: '여성용', path: '/products/padding?sub=women' },
      { name: '남성용', path: '/products/padding?sub=men' },
    ]
  },
  { 
    name: '상의', 
    path: '/products/tops', 
    slug: 'tops',
    subcategories: [
      { name: '여성용', path: '/products/tops?sub=women' },
      { name: '남성용', path: '/products/tops?sub=men' },
    ]
  },
  { 
    name: '하의', 
    path: '/products/bottoms', 
    slug: 'bottoms',
    subcategories: [
      { name: '여성용', path: '/products/bottoms?sub=women' },
      { name: '남성용', path: '/products/bottoms?sub=men' },
    ]
  },
  { 
    name: '신발', 
    path: '/products/shoes', 
    slug: 'shoes',
    subcategories: [
      { name: '여성용', path: '/products/shoes?sub=women' },
      { name: '남성용', path: '/products/shoes?sub=men' },
    ]
  },
  { 
    name: '악세사리', 
    path: '/products/accessories', 
    slug: 'accessories',
    subcategories: [
      { name: '귀걸이', path: '/products/accessories?sub=earrings' },
      { name: '반지', path: '/products/accessories?sub=rings' },
      { name: '목걸이', path: '/products/accessories?sub=necklaces' },
      { name: '팔찌', path: '/products/accessories?sub=bracelets' },
    ]
  },
  { 
    name: '지갑', 
    path: '/products/wallets', 
    slug: 'wallets',
    subcategories: [
      { name: '구찌', path: '/products/wallets?brand=gucci' },
      { name: '루이비통', path: '/products/wallets?brand=lv' },
      { name: '샤넬', path: '/products/wallets?brand=chanel' },
    ]
  },
  { 
    name: '가방', 
    path: '/products/bags', 
    slug: 'bags',
    subcategories: [
      { name: '샤넬', path: '/products/bags?brand=chanel' },
      { name: '루이비통', path: '/products/bags?brand=lv' },
      { name: '에르메스', path: '/products/bags?brand=hermes' },
      { name: '디올', path: '/products/bags?brand=dior' },
    ]
  },
  { 
    name: '시계', 
    path: '/products/watches', 
    slug: 'watches',
    subcategories: [
      { name: '로렉스', path: '/products/watches?brand=rolex' },
      { name: '오메가', path: '/products/watches?brand=omega' },
      { name: '까르띠에', path: '/products/watches?brand=cartier' },
    ]
  },
  { name: '정품', path: '/products/genuine', slug: 'genuine', subcategories: [] },
  { 
    name: '커뮤니티', 
    path: '/reviews', 
    slug: 'community',
    subcategories: [
      { name: '공지사항', path: '/notices' },
      { name: '사용후기', path: '/reviews' },
    ]
  },
];

export function Header() {
  const [location, setLocation] = useLocation();
  const { count } = useWishlist();
  const { toast } = useToast();
  const [memberName, setMemberName] = useState<string | null>(null);
  const [pointBalance, setPointBalance] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const handleDropdownMouseEnter = (slug: string) => {
    setActiveDropdown(slug);
  };

  const handleDropdownMouseLeave = () => {
    setActiveDropdown(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, slug: string, hasSubmenu: boolean) => {
    if (e.key === 'Escape') {
      setActiveDropdown(null);
      return;
    }
    if (hasSubmenu && (e.key === 'ArrowDown' || e.key === ' ')) {
      e.preventDefault();
      setActiveDropdown(activeDropdown === slug ? null : slug);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
      <nav className="hidden md:block border-b border-gray-200 bg-[#333]">
        <div className="container mx-auto px-4">
          <ul className="flex items-center gap-0">
            {topNavItems.map((item, index) => (
              <li key={item.name}>
                <Link 
                  href={item.path}
                  className={`px-4 py-2.5 text-sm text-white hover:text-yellow-300 transition-colors inline-block ${index === 0 ? 'font-bold' : ''}`}
                  data-testid={`topnav-${item.name}`}
                >
                  {item.name}
                </Link>
              </li>
            ))}
            <li className="ml-auto flex items-center gap-4 text-sm text-white">
              {memberName ? (
                <>
                  <Link href="/profile" className="hover:text-yellow-300" data-testid="link-profile-name">
                    {memberName}님
                  </Link>
                  <span className="text-yellow-300 text-xs">{pointBalance.toLocaleString()}P</span>
                  <button onClick={handleLogout} className="hover:text-yellow-300" data-testid="button-logout">
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-yellow-300" data-testid="link-login">로그인</Link>
                  <Link href="/signup" className="hover:text-yellow-300" data-testid="link-signup">회원가입</Link>
                </>
              )}
              <Link href="/cart" className="hover:text-yellow-300" data-testid="link-cart">장바구니</Link>
            </li>
          </ul>
        </div>
      </nav>

      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="w-10 h-10" data-testid="button-mobile-menu">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] overflow-y-auto p-0">
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
                      <Link href="/login" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>로그인</Link>
                      <Link href="/signup" className="text-sm text-gray-700" onClick={() => setMobileMenuOpen(false)}>회원가입</Link>
                    </div>
                  )}
                  
                  <form onSubmit={handleSearch} className="mb-4">
                    <div className="relative">
                      <input 
                        type="text" 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="검색어를 입력해주세요" 
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        data-testid="mobile-input-search"
                      />
                      <Button type="submit" size="icon" variant="ghost" className="absolute right-0 top-0">
                        <Search className="w-4 h-4" />
                      </Button>
                    </div>
                  </form>
                  
                  {categories.map((cat) => (
                    <div key={cat.slug} className="border-b">
                      <div className="flex items-center justify-between">
                        <Link 
                          href={cat.path} 
                          className="py-3 block font-medium text-gray-800 flex-1"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {cat.name}
                        </Link>
                        {cat.subcategories && cat.subcategories.length > 0 && (
                          <button 
                            onClick={() => setMobileExpandedCat(mobileExpandedCat === cat.slug ? null : cat.slug)}
                            className="p-2 text-gray-500"
                            aria-label={`${cat.name} 하위 메뉴 ${mobileExpandedCat === cat.slug ? '닫기' : '열기'}`}
                            data-testid={`mobile-toggle-${cat.slug}`}
                          >
                            <ChevronRight className={`w-4 h-4 transition-transform ${mobileExpandedCat === cat.slug ? 'rotate-90' : ''}`} />
                          </button>
                        )}
                      </div>
                      {cat.subcategories && cat.subcategories.length > 0 && mobileExpandedCat === cat.slug && (
                        <div className="pl-4 pb-2">
                          {cat.subcategories.map((sub) => (
                            <Link 
                              key={sub.name}
                              href={sub.path}
                              className="block py-2 text-sm text-gray-600 hover:text-black"
                              onClick={() => setMobileMenuOpen(false)}
                              data-testid={`mobile-subnav-${cat.slug}-${sub.name}`}
                            >
                              {sub.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {memberName && (
                    <button 
                      onClick={() => { handleLogout(); setMobileMenuOpen(false); }} 
                      className="mt-4 text-sm text-gray-500"
                    >
                      로그아웃
                    </button>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          <Link href="/" className="flex-shrink-0" data-testid="link-home">
            <div className="text-center">
              <h1 className="text-xl md:text-2xl font-bold text-[#333] tracking-tight">
                청담동에디션
              </h1>
            </div>
          </Link>

          <form onSubmit={handleSearch} className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="검색어를 입력해주세요" 
                className="w-full border-2 border-[#333] px-4 py-2 text-sm focus:outline-none"
                data-testid="input-search"
              />
              <Button 
                type="submit"
                size="icon" 
                className="absolute right-0 top-0 h-full bg-[#333] hover:bg-[#555] rounded-none px-4"
                data-testid="button-search"
              >
                <Search className="w-5 h-5 text-white" />
              </Button>
            </div>
          </form>

          <div className="flex items-center gap-3">
            <Link href="/profile" className="hidden md:flex flex-col items-center text-gray-600 hover:text-black">
              <User className="w-6 h-6" />
              <span className="text-[10px] mt-1">마이페이지</span>
            </Link>
            <Link href="/cart" className="flex flex-col items-center text-gray-600 hover:text-black relative" data-testid="button-cart">
              <ShoppingBag className="w-6 h-6" />
              <span className="text-[10px] mt-1 hidden md:block">장바구니</span>
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      <nav className="border-b border-gray-200 hidden md:block bg-white relative" ref={dropdownRef}>
        <div className="container mx-auto px-4">
          <ul className="flex items-center justify-center gap-0">
            {categories.map((cat) => (
              <li 
                key={cat.slug} 
                className="relative"
                onMouseEnter={() => handleDropdownMouseEnter(cat.slug)}
                onMouseLeave={handleDropdownMouseLeave}
              >
                <Link 
                  href={cat.path} 
                  className="px-4 py-3 text-sm font-medium text-gray-800 hover:text-black transition-colors flex items-center gap-1 h-12"
                  data-testid={`nav-${cat.slug}`}
                  onKeyDown={(e) => handleKeyDown(e, cat.slug, !!(cat.subcategories && cat.subcategories.length > 0))}
                  aria-haspopup={cat.subcategories && cat.subcategories.length > 0 ? "true" : undefined}
                  aria-expanded={activeDropdown === cat.slug ? "true" : undefined}
                >
                  {cat.name}
                  {cat.subcategories && cat.subcategories.length > 0 && (
                    <ChevronDown className="w-3 h-3" aria-hidden="true" />
                  )}
                </Link>
                
                {cat.subcategories && cat.subcategories.length > 0 && activeDropdown === cat.slug && (
                  <div 
                    className="absolute top-full left-0 bg-white border border-gray-200 shadow-lg min-w-[150px] z-50"
                    role="menu"
                    aria-label={`${cat.name} 하위 메뉴`}
                  >
                    {cat.subcategories.map((sub) => (
                      <Link 
                        key={sub.name}
                        href={sub.path}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-black"
                        role="menuitem"
                        onClick={() => setActiveDropdown(null)}
                        data-testid={`subnav-${cat.slug}-${sub.name}`}
                      >
                        {sub.name}
                      </Link>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
