import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-[#1E1812] text-[#8B7B6A] mt-auto pb-20 md:pb-0">
      <div className="max-w-[1200px] mx-auto px-4 py-10 md:py-12">
        <div className="mb-8">
          <p className="text-[#EDE8DF] text-sm font-medium mb-2 tracking-widest uppercase" style={{ letterSpacing: "0.12em", fontSize: "11px" }}>고객센터</p>
          <p className="text-lg md:text-xl text-[#EDE8DF] font-light mb-1" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 400 }}>카카오톡으로 문의 바랍니다</p>
          <div className="text-xs text-[#6B5D50] leading-relaxed">
            <p>10:00 - 20:00 (점심 12:00 - 13:00)</p>
            <p>일요일 휴무</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-5 md:gap-8 text-sm">
          <Link href="/notices" className="hover:text-[#EDE8DF] transition-colors" data-testid="footer-notices">공지사항</Link>
          <Link href="/faq" className="hover:text-[#EDE8DF] transition-colors" data-testid="footer-faq">자주묻는질문</Link>
          <Link href="/orders" className="hover:text-[#EDE8DF] transition-colors" data-testid="footer-orders">주문조회</Link>
          <Link href="/support" className="hover:text-[#EDE8DF] transition-colors" data-testid="footer-support">1:1 문의</Link>
          <Link href="/guide" className="hover:text-[#EDE8DF] transition-colors" data-testid="footer-guide">이용안내</Link>
        </div>
      </div>
    </footer>
  );
}
