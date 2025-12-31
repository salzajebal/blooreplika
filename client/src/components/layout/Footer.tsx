import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#333] text-gray-400 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h3 className="text-white font-bold text-lg mb-2">청담동에디션</h3>
          <p className="text-sm text-gray-500">프리미엄 명품 레플리카 전문 쇼핑몰</p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 text-sm mb-6">
          <Link href="/" className="hover:text-white">홈</Link>
          <span className="text-gray-600">|</span>
          <Link href="/about" className="hover:text-white">소개글</Link>
          <span className="text-gray-600">|</span>
          <Link href="/notices" className="hover:text-white">공지사항</Link>
          <span className="text-gray-600">|</span>
          <Link href="/reviews" className="hover:text-white">후기</Link>
          <span className="text-gray-600">|</span>
          <Link href="/support" className="hover:text-white">고객센터</Link>
          <span className="text-gray-600">|</span>
          <a href="#" className="hover:text-white">이용약관</a>
          <span className="text-gray-600">|</span>
          <a href="#" className="hover:text-white">개인정보처리방침</a>
        </div>

        <div className="text-center text-xs text-gray-500 space-y-1 mb-6">
          <p>상호: 청담동에디션 | 대표: 홍길동</p>
          <p>사업자등록번호: 000-00-00000 | 통신판매번호: 2025-서울강남-0000</p>
          <p>주소: 서울특별시 강남구 청담동</p>
          <p>고객센터: 카카오톡 문의</p>
        </div>

        <div className="text-center text-xs text-gray-600 pt-4 border-t border-gray-700">
          <p>Copyright &copy; 2025 청담동에디션. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
