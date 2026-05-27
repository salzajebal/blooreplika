import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#f8f8f8] text-gray-500 border-t border-gray-200 mt-auto">
      <div className="max-w-[1280px] mx-auto px-5 py-10">
        <div className="flex flex-wrap gap-5 text-[13px] mb-6 border-b border-gray-200 pb-6">
          <Link href="/notices" className="hover:text-gray-800 transition-colors font-semibold text-gray-700" data-testid="footer-notices">공지사항</Link>
          <Link href="/faq" className="hover:text-gray-700 transition-colors" data-testid="footer-faq">자주묻는질문</Link>
          <Link href="/orders" className="hover:text-gray-700 transition-colors" data-testid="footer-orders">주문조회</Link>
          <Link href="/support" className="hover:text-gray-700 transition-colors font-semibold text-gray-700" data-testid="footer-support">1:1 문의</Link>
          <Link href="/guide" className="hover:text-gray-700 transition-colors" data-testid="footer-guide">이용안내</Link>
        </div>
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          <div>
            <p className="font-black text-[22px] text-[#060133] mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>VELOUR</p>
            <div className="text-[12px] text-gray-400 space-y-1">
              <p>고객센터 운영시간: 10:00 - 20:00 (점심 12:00 - 13:00)</p>
              <p>일요일 및 공휴일 휴무</p>
            </div>
          </div>
          <div className="text-[12px] text-gray-400 space-y-1 md:text-right">
            <p>통신판매업 신고번호: 0000-서울강남-0000</p>
            <p>사업자등록번호: 000-00-00000</p>
            <p className="mt-2 text-gray-300">ⓒ 2025 VELOUR. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
