import { Search, User, ShoppingCart, Menu, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export function Header() {
  const [location] = useLocation();

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
      {/* Top Utility Bar */}
      <div className="bg-[#f8f8f8] border-b border-gray-100 py-2 hidden md:block">
        <div className="container-custom flex justify-between items-center text-xs text-gray-500">
          <div className="flex gap-4">
            <Link href="/notices">공지사항</Link>
            <Link href="/reviews">고객후기</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/login">로그인</Link>
            <Link href="/signup">회원가입</Link>
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
            <span className="text-xl font-bold tracking-tight text-gray-900 leading-none">한국공인금거래소</span>
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
          <Button variant="ghost" size="icon" className="relative">
            <User className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
          </Button>
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
                <Link href="/" className="text-lg font-medium">홈</Link>
                {navItems.map((item) => (
                  <Link key={item.name} href={item.path} className="text-lg font-medium hover:text-primary">
                    {item.name}
                  </Link>
                ))}
                <Link href="/notices" className="text-lg font-medium hover:text-primary">공지사항</Link>
                <Link href="/reviews" className="text-lg font-medium hover:text-primary">고객후기</Link>
                <Link href="/support" className="text-lg font-medium hover:text-primary">고객센터</Link>
                <Link href="/login" className="text-lg font-medium text-gray-500 mt-4 pt-4 border-t">로그인</Link>
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
