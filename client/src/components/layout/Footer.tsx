import { Link } from "wouter";
import { Instagram, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-12 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-1 md:col-span-2">
            <div className="mb-4">
              <span className="text-[10px] tracking-[0.3em] text-gray-500 font-light block">CHEONGDAM-DONG</span>
              <h3 className="text-white font-serif text-xl" style={{ fontFamily: "'Playfair Display', serif" }}>청담동에디션</h3>
            </div>
            <p className="text-sm leading-relaxed mb-6 max-w-md">
              최상급 퀄리티의 명품 레플리카를 합리적인 가격에 만나보세요.
              고객 만족을 최우선으로 생각하는 프리미엄 쇼핑몰입니다.
            </p>
            <div className="text-xs space-y-1 text-gray-500">
              <p><span className="text-gray-400">상호:</span> 청담동에디션</p>
              <p><span className="text-gray-400">사업자등록번호:</span> 000-00-00000</p>
              <p><span className="text-gray-400">통신판매번호:</span> 2025-서울강남-0000</p>
              <p><span className="text-gray-400">대표:</span> 홍길동</p>
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm">카테고리</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products/outer" className="hover:text-white transition-colors">아우터</Link></li>
              <li><Link href="/products/padding" className="hover:text-white transition-colors">패딩</Link></li>
              <li><Link href="/products/tops" className="hover:text-white transition-colors">상의</Link></li>
              <li><Link href="/products/bottoms" className="hover:text-white transition-colors">하의</Link></li>
              <li><Link href="/products/shoes" className="hover:text-white transition-colors">신발</Link></li>
              <li><Link href="/products/bags" className="hover:text-white transition-colors">가방</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-4 text-sm">고객센터</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/notices" className="hover:text-white transition-colors">공지사항</Link></li>
              <li><Link href="/reviews" className="hover:text-white transition-colors">고객후기</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors">1:1 문의</Link></li>
              <li><a href="#" className="hover:text-white transition-colors">이용약관</a></li>
              <li><a href="#" className="hover:text-white transition-colors">개인정보처리방침</a></li>
            </ul>
            <div className="flex gap-3 mt-6">
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 text-xs text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
          <p>Copyright &copy; 2025 청담동에디션. All rights reserved.</p>
          <div className="flex gap-4 text-gray-600">
            <span>Escrow</span>
            <span>SSL</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
