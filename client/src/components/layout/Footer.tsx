import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#f5f5f5] text-gray-500 mt-auto pb-20 md:pb-0 border-t border-gray-200">
      <div className="max-w-[640px] mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-4 text-xs mb-6 border-b border-gray-200 pb-4">
          <Link href="/notices" className="hover:text-gray-700 transition-colors font-medium" data-testid="footer-notices">공지사항</Link>
          <Link href="/faq" className="hover:text-gray-700 transition-colors" data-testid="footer-faq">자주묻는질문</Link>
          <Link href="/orders" className="hover:text-gray-700 transition-colors" data-testid="footer-orders">주문조회</Link>
          <Link href="/support" className="hover:text-gray-700 transition-colors" data-testid="footer-support">1:1 문의</Link>
          <Link href="/guide" className="hover:text-gray-700 transition-colors" data-testid="footer-guide">이용안내</Link>
        </div>
        <div className="text-xs text-gray-400 space-y-1.5">
          <p className="font-bold text-gray-700 text-sm">velour</p>
          <p>고객센터 운영시간: 10:00 - 20:00</p>
          <p>점심 12:00 - 13:00 / 일요일 휴무</p>
          <p className="mt-3 text-gray-300">ⓒ 2025 velour. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
