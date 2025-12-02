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
    <div className="min-h-screen bg-white font-sans">
      <HomePopup />
      <Header />
      
      <main>
        <Hero />
        
        <div className="container-custom py-8">
          <PriceBoard />
        </div>

        <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-amber-50 p-8 h-48 flex flex-col justify-center items-start hover:shadow-lg transition-all cursor-pointer border border-amber-200 rounded-xl relative overflow-hidden group" onClick={handleKakaoClick}>
            <div className="absolute top-3 right-3 bg-amber-600 text-white text-xs font-medium px-2 py-0.5 rounded">
              2주년 특별가
            </div>
            <span className="text-amber-700 font-medium text-sm mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              GOLD BAR
            </span>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">순금 골드바</h3>
            <p className="text-amber-800 text-2xl font-bold mb-2">750,000원<span className="text-base font-normal text-stone-600">/돈</span></p>
            <span className="text-amber-700 text-sm flex items-center gap-1 font-medium">
              <KakaoIcon className="w-4 h-4" />
              카카오톡 문의
            </span>
          </div>
          <div className="bg-gradient-to-br from-gray-50 via-slate-50 to-gray-50 p-8 h-48 flex flex-col justify-center items-start hover:shadow-lg transition-all cursor-pointer border border-gray-200 rounded-xl relative overflow-hidden group" onClick={handleKakaoClick}>
            <div className="absolute top-3 right-3 bg-gray-600 text-white text-xs font-medium px-2 py-0.5 rounded">
              2주년 특별가
            </div>
            <span className="text-gray-600 font-medium text-sm mb-2 flex items-center gap-1">
              <Sparkles className="w-4 h-4" />
              SILVER BAR
            </span>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">순은 실버바</h3>
            <p className="text-gray-800 text-2xl font-bold mb-2">10,150원<span className="text-base font-normal text-stone-600">/돈</span></p>
            <span className="text-gray-600 text-sm flex items-center gap-1 font-medium">
              <KakaoIcon className="w-4 h-4" />
              카카오톡 문의
            </span>
          </div>
        </div>

        <div className="container-custom mb-16">
          <div className="bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 rounded-xl p-8 text-white text-center relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <span className="text-amber-400 font-medium text-base">창립 2주년 기념</span>
                <Sparkles className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-3">
                한국골드금거래소 특별가 안내
              </h3>
              <p className="text-stone-300 mb-6">
                고객님의 성원에 감사드리며, 특별한 가격으로 안내해 드립니다.
              </p>
              <div className="flex flex-wrap justify-center gap-6 mb-6">
                <div className="bg-stone-900/50 border border-stone-600 rounded-lg px-6 py-4">
                  <p className="text-amber-400 text-sm mb-1">순금 (1돈)</p>
                  <p className="text-2xl font-bold">750,000<span className="text-base font-normal text-stone-400">원</span></p>
                </div>
                <div className="bg-stone-900/50 border border-stone-600 rounded-lg px-6 py-4">
                  <p className="text-gray-400 text-sm mb-1">순은 (1돈)</p>
                  <p className="text-2xl font-bold">10,150<span className="text-base font-normal text-stone-400">원</span></p>
                </div>
              </div>
              <button 
                onClick={handleKakaoClick}
                className="inline-flex items-center gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <KakaoIcon className="w-5 h-5" />
                카카오톡으로 문의하기
              </button>
              <p className="text-stone-500 text-sm mt-4">* VAT 별도 / 별도 문의를 통해 안내받으실 수 있습니다.</p>
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
