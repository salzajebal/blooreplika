import { NOTICE_DATA } from "@/lib/mockData";
import { ChevronRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-16 pb-8">
      <div className="container-custom grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
        {/* Company Info */}
        <div className="col-span-1 md:col-span-1">
          <h3 className="text-white font-bold text-xl mb-6">한국골드금거래소</h3>
          <p className="leading-relaxed text-sm mb-6 max-w-md">
            한국골드금거래소는 투명하고 공정한 귀금속 거래 문화를 선도합니다.
            최고 품질의 골드바와 실버바를 합리적인 가격에 만나보세요.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 className="text-white font-bold mb-6">바로가기</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">회사소개</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">이용약관</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">개인정보처리방침</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">이메일무단수집거부</a></li>
          </ul>
        </div>

        {/* Notice */}
        <div>
          <h4 className="text-white font-bold mb-6">공지사항</h4>
          <div className="bg-gray-800 p-4 rounded-sm">
            <ul className="space-y-2">
              {NOTICE_DATA.slice(0, 3).map(notice => (
                <li key={notice.id} className="text-xs truncate hover:text-primary cursor-pointer flex items-center gap-2">
                  <ChevronRight className="w-3 h-3 text-amber-500" />
                  {notice.title}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="container-custom pt-8 border-t border-gray-800 text-xs text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-4">
        <p>Copyright © 2025 Korea Authorized Gold Exchange. All rights reserved.</p>
        <div className="flex gap-4">
          <img src="https://via.placeholder.com/40x20?text=Escrow" alt="Escrow" className="opacity-50 grayscale hover:grayscale-0 transition-all" />
          <img src="https://via.placeholder.com/40x20?text=SSL" alt="SSL" className="opacity-50 grayscale hover:grayscale-0 transition-all" />
        </div>
      </div>
    </footer>
  );
}
