import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { PriceBoard } from "@/components/home/PriceBoard";
import { ProductGrid } from "@/components/home/ProductGrid";
import { HomePopup } from "@/components/home/HomePopup";
import { Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useKakaoLink } from "@/hooks/use-kakao-link";

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.15.53-.5 1.92-.57 2.22-.1.38.14.38.29.27.12-.08 1.85-1.22 2.6-1.72.72.11 1.47.17 2.18.17 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
    </svg>
  );
}

export default function Home() {
  const { openKakaoChat } = useKakaoLink();
  const handleKakaoClick = () => {
    openKakaoChat();
  };

  return (
    <div className="min-h-screen-safe bg-white font-sans overflow-x-hidden">
      <HomePopup />
      <Header />
      
      <main>
        <Hero />
        
        <div className="container-custom py-4 sm:py-6 md:py-8">
          <PriceBoard />
        </div>

        <div className="container-custom grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8">
          <div 
            className="bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 p-4 sm:p-6 md:p-8 h-36 sm:h-40 md:h-48 flex flex-col justify-center items-start hover:shadow-lg transition-all cursor-pointer border border-amber-200 rounded-lg sm:rounded-xl relative overflow-hidden group touch-manipulation" 
            onClick={handleKakaoClick}
          >
            <span className="text-amber-700 font-medium text-xs sm:text-sm mb-1 sm:mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              GOLD BAR
            </span>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">순금 골드바</h3>
            <p className="text-amber-800 text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">900,000원<span className="text-xs sm:text-sm md:text-base font-normal text-stone-600">/돈</span></p>
            <span className="text-amber-700 text-xs sm:text-sm flex items-center gap-1 font-medium">
              <KakaoIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              카카오톡 문의
            </span>
          </div>
          <div 
            className="bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 p-4 sm:p-6 md:p-8 h-36 sm:h-40 md:h-48 flex flex-col justify-center items-start hover:shadow-lg transition-all cursor-pointer border border-gray-200 rounded-lg sm:rounded-xl relative overflow-hidden group touch-manipulation" 
            onClick={handleKakaoClick}
          >
            <span className="text-gray-600 font-medium text-xs sm:text-sm mb-1 sm:mb-2 flex items-center gap-1">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              SILVER BAR
            </span>
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">순은 실버바</h3>
            <p className="text-gray-800 text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">14,540원<span className="text-xs sm:text-sm md:text-base font-normal text-stone-600">/돈</span></p>
            <span className="text-gray-600 text-xs sm:text-sm flex items-center gap-1 font-medium">
              <KakaoIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              카카오톡 문의
            </span>
          </div>
        </div>

        <div className="container-custom mb-8 sm:mb-12 md:mb-16">
          <div className="bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 rounded-lg sm:rounded-xl p-4 sm:p-6 md:p-8 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-3 sm:mb-4">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                <span className="text-amber-400 font-medium text-sm sm:text-base">한국금거래소 소비자가격</span>
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
              </div>
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 sm:mb-3 break-keep">
                한국골드금거래소 실시간 시세
              </h3>
              <p className="text-stone-300 text-sm sm:text-base mb-4 sm:mb-6 break-keep">
                고객님의 성원에 감사드리며, 금 · 은 상품을 안내해 드립니다.
              </p>
              <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6">
                <div className="bg-stone-900/50 border border-stone-600 rounded-lg px-4 sm:px-6 py-3 sm:py-4">
                  <p className="text-amber-400 text-xs sm:text-sm mb-0.5 sm:mb-1">순금 (1돈)</p>
                  <p className="text-xl sm:text-2xl font-bold">900,000<span className="text-sm sm:text-base font-normal text-stone-400">원</span></p>
                </div>
                <div className="bg-stone-900/50 border border-stone-600 rounded-lg px-4 sm:px-6 py-3 sm:py-4">
                  <p className="text-gray-400 text-xs sm:text-sm mb-0.5 sm:mb-1">순은 (1돈)</p>
                  <p className="text-xl sm:text-2xl font-bold">14,540<span className="text-sm sm:text-base font-normal text-stone-400">원</span></p>
                </div>
              </div>
              <button 
                onClick={handleKakaoClick}
                className="inline-flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-medium transition-colors text-sm sm:text-base touch-manipulation"
              >
                <KakaoIcon className="w-4 h-4 sm:w-5 sm:h-5" />
                카카오톡으로 문의하기
              </button>
              <p className="text-stone-500 text-xs sm:text-sm mt-3 sm:mt-4">* VAT 포함 / 별도 문의를 통해 안내받으실 수 있습니다.</p>
            </div>
          </div>
        </div>
        
        <div className="container-custom">
          <ProductGrid />
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
