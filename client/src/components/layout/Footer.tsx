import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#1a1a1a] text-gray-400 mt-auto pb-20 md:pb-0">
      <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-16">
        <div className="mb-10 flex flex-col md:flex-row md:justify-between md:items-start gap-8">
          <div>
            <h3 className="text-white text-2xl font-black tracking-[0.15em] mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>LIKE IT</h3>
            <div className="text-sm leading-loose text-gray-500">
              <p>상호명: 라이크잇 | 대표: 홍길동</p>
              <p>사업자등록번호: 123-45-67890 | 통신판매업신고: 제2024-서울강남-12345호</p>
              <p>주소: 서울특별시 강남구 테헤란로 123, 4층</p>
              <p>이메일: support@likeit.co.kr</p>
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-white text-sm font-semibold mb-2">고객센터</p>
            <p className="text-xl md:text-2xl text-white font-bold mb-1">1588-1234</p>
            <div className="text-xs text-gray-500 leading-relaxed">
              <p>평일 10:00 - 18:00 (점심 12:00 - 13:00)</p>
              <p>토/일/공휴일 휴무</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 md:gap-8 text-sm mb-10">
          <Link href="/notices" className="hover:text-white transition-colors" data-testid="footer-notices">공지사항</Link>
          <Link href="/faq" className="hover:text-white transition-colors" data-testid="footer-faq">자주묻는질문</Link>
          <Link href="/orders" className="hover:text-white transition-colors" data-testid="footer-orders">주문조회</Link>
          <Link href="/support" className="hover:text-white transition-colors" data-testid="footer-support">1:1 문의</Link>
          <Link href="/guide" className="hover:text-white transition-colors" data-testid="footer-guide">이용안내</Link>
        </div>

        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs md:text-sm">
            <Link href="/about" className="hover:text-white transition-colors">회사소개</Link>
            <span className="text-gray-700">|</span>
            <Link href="/guide" className="hover:text-white transition-colors">이용약관</Link>
            <span className="text-gray-700">|</span>
            <span className="text-white font-medium">개인정보처리방침</span>
          </div>
          <p className="text-xs md:text-sm text-gray-600">
            &copy; 2024 LIKE IT. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
