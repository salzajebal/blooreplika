import { NOTICE_DATA } from "@/lib/mockData";
import { ChevronRight } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 pt-10 sm:pt-12 md:pt-16 pb-6 sm:pb-8 safe-area-bottom">
      <div className="container-custom grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 sm:gap-10 md:gap-12 mb-8 sm:mb-10 md:mb-12">
        <div className="col-span-1">
          <h3 className="text-white font-bold text-lg sm:text-xl mb-4 sm:mb-6">한국골드금거래소</h3>
          <p className="leading-relaxed text-xs sm:text-sm mb-4 sm:mb-6 max-w-md break-keep">
            한국골드금거래소는 투명하고 공정한 귀금속 거래 문화를 선도합니다.
            최고 품질의 골드바와 실버바를 합리적인 가격에 만나보세요.
          </p>
        </div>

        <div>
          <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-base">바로가기</h4>
          <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
            <li><a href="#" className="hover:text-primary transition-colors py-1 inline-block">회사소개</a></li>
            <li><a href="#" className="hover:text-primary transition-colors py-1 inline-block">이용약관</a></li>
            <li><a href="#" className="hover:text-primary transition-colors py-1 inline-block">개인정보처리방침</a></li>
            <li><a href="#" className="hover:text-primary transition-colors py-1 inline-block">이메일무단수집거부</a></li>
          </ul>
        </div>

        <div className="sm:col-span-2 md:col-span-1">
          <h4 className="text-white font-bold mb-4 sm:mb-6 text-sm sm:text-base">공지사항</h4>
          <div className="bg-gray-800 p-3 sm:p-4 rounded-sm">
            <ul className="space-y-1.5 sm:space-y-2">
              {NOTICE_DATA.slice(0, 3).map(notice => (
                <li key={notice.id} className="text-[10px] sm:text-xs truncate hover:text-primary cursor-pointer flex items-center gap-1.5 sm:gap-2 py-0.5">
                  <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-500 flex-shrink-0" />
                  <span className="truncate">{notice.title}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="container-custom pt-6 sm:pt-8 border-t border-gray-800 text-[10px] sm:text-xs text-center md:text-left flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
        <p className="break-keep">Copyright © 2025 Korea Authorized Gold Exchange. All rights reserved.</p>
        <div className="flex gap-3 sm:gap-4">
          <span className="text-gray-600 text-[10px] sm:text-xs">Escrow</span>
          <span className="text-gray-600 text-[10px] sm:text-xs">SSL</span>
        </div>
      </div>
    </footer>
  );
}
