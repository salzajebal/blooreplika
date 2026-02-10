import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#222] text-gray-400 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          <div className="md:col-span-2">
            <h3 className="text-white text-xl font-black tracking-[0.15em] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>LIKE IT</h3>
            <div className="text-xs leading-relaxed space-y-1">
              <p>상호명: 라이크잇 | 대표: 홍길동</p>
              <p>사업자등록번호: 123-45-67890</p>
              <p>통신판매업신고: 제2024-서울강남-0001호</p>
              <p>주소: 서울특별시 강남구 청담동 123-45</p>
              <p>고객센터: 010-0000-0000 (평일 10:00 ~ 18:00)</p>
              <p>이메일: support@likeit.com</p>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">고객지원</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/notices" className="hover:text-white transition-colors" data-testid="footer-notices">공지사항</Link></li>
              <li><Link href="/faq" className="hover:text-white transition-colors" data-testid="footer-faq">자주묻는질문</Link></li>
              <li><Link href="/orders" className="hover:text-white transition-colors" data-testid="footer-orders">주문조회</Link></li>
              <li><Link href="/support" className="hover:text-white transition-colors" data-testid="footer-support">1:1 문의</Link></li>
              <li><Link href="/guide" className="hover:text-white transition-colors" data-testid="footer-guide">이용안내</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-4">쇼핑 카테고리</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/products/new-arrivals" className="hover:text-white transition-colors">신상품</Link></li>
              <li><Link href="/products/clothing" className="hover:text-white transition-colors">의류</Link></li>
              <li><Link href="/products/bags" className="hover:text-white transition-colors">가방</Link></li>
              <li><Link href="/products/shoes" className="hover:text-white transition-colors">신발</Link></li>
              <li><Link href="/products/watches" className="hover:text-white transition-colors">시계</Link></li>
              <li><Link href="/products/best" className="hover:text-white transition-colors">베스트상품</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-[10px] md:text-xs">
            <Link href="/about" className="hover:text-white transition-colors">회사소개</Link>
            <span className="text-gray-600">|</span>
            <Link href="/guide" className="hover:text-white transition-colors">이용약관</Link>
            <span className="text-gray-600">|</span>
            <span className="text-white font-medium">개인정보처리방침</span>
          </div>
          <p className="text-[10px] md:text-xs text-gray-500">
            &copy; 2024 LIKE IT. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
