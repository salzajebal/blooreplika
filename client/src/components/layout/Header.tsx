import { Search, User, ShoppingCart, Menu, Phone } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

export function Header() {
  return (
    <header className="w-full border-b border-gray-200 bg-white sticky top-0 z-50">
      {/* Top Utility Bar */}
      <div className="bg-[#f8f8f8] border-b border-gray-100 py-2 hidden md:block">
        <div className="container-custom flex justify-between items-center text-xs text-gray-500">
          <div className="flex gap-4">
            <span>즐겨찾기</span>
            <span>한국공인금거래소란?</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login">로그인</Link>
            <Link href="/signup">회원가입</Link>
            <Link href="/cart">장바구니</Link>
            <Link href="/support">고객센터</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container-custom py-6 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center text-white font-serif font-bold text-xl group-hover:bg-primary/90 transition-colors">
            K
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-gray-900 leading-none">한국공인금거래소</span>
            <span className="text-[10px] text-primary font-medium tracking-widest uppercase mt-1">Korea Authorized Gold Exchange</span>
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
          <div className="flex flex-col items-end mr-4">
            <span className="text-xs text-gray-500">고객만족센터</span>
            <span className="text-lg font-bold text-primary flex items-center gap-1">
              <Phone className="w-4 h-4" /> 1544-0000
            </span>
          </div>
          <Button variant="ghost" size="icon" className="relative">
            <User className="w-6 h-6" />
          </Button>
          <Button variant="ghost" size="icon" className="relative">
            <ShoppingCart className="w-6 h-6" />
            <span className="absolute top-0 right-0 bg-primary text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">0</span>
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
                <Link href="/products" className="text-lg font-medium">골드바</Link>
                <Link href="/products" className="text-lg font-medium">실버바</Link>
                <Link href="/products" className="text-lg font-medium">돌반지</Link>
                <Link href="/login" className="text-lg font-medium text-gray-500">로그인</Link>
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
            {['금시세조회', '골드바', '실버바', '순금제품', '다이아몬드', '기업선물', '이벤트'].map((item) => (
              <li key={item}>
                <Link href="#" className="text-gray-700 font-medium hover:text-primary transition-colors text-sm h-14 flex items-center">
                  {item}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
