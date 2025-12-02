import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { PriceBoard } from "@/components/home/PriceBoard";
import { ProductGrid } from "@/components/home/ProductGrid";
import { Gift, Sparkles, Star, Crown, PartyPopper } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      
      <main>
        <Hero />
        
        <div className="container-custom py-8">
          <PriceBoard />
        </div>

        <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/products/gold_bar">
            <div className="bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 p-8 h-52 flex flex-col justify-center items-start hover:shadow-xl transition-all cursor-pointer border-2 border-amber-200 rounded-xl relative overflow-hidden group">
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                <Gift className="w-3 h-3" />
                2주년 특가
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Crown className="w-32 h-32 text-amber-600" />
              </div>
              <span className="text-amber-700 font-bold text-sm mb-2 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                GOLD BAR EVENT
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">순금 골드바</h3>
              <p className="text-amber-800 text-3xl font-black mb-2">750,000원<span className="text-lg font-normal">/돈</span></p>
              <span className="text-amber-600 text-sm flex items-center gap-1 font-medium">
                이벤트 상품 보기 &rarr;
              </span>
            </div>
          </Link>
          <Link href="/products/silver_bar">
            <div className="bg-gradient-to-br from-gray-100 via-slate-50 to-gray-100 p-8 h-52 flex flex-col justify-center items-start hover:shadow-xl transition-all cursor-pointer border-2 border-gray-200 rounded-xl relative overflow-hidden group">
              <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse flex items-center gap-1">
                <Gift className="w-3 h-3" />
                2주년 특가
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Star className="w-32 h-32 text-gray-600" />
              </div>
              <span className="text-gray-600 font-bold text-sm mb-2 flex items-center gap-1">
                <Sparkles className="w-4 h-4" />
                SILVER BAR EVENT
              </span>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">순은 실버바</h3>
              <p className="text-gray-800 text-3xl font-black mb-2">10,150원<span className="text-lg font-normal">/돈</span></p>
              <span className="text-gray-600 text-sm flex items-center gap-1 font-medium">
                이벤트 상품 보기 &rarr;
              </span>
            </div>
          </Link>
        </div>

        <div className="container-custom mb-16">
          <div className="bg-gradient-to-r from-red-600 via-red-500 to-amber-500 rounded-2xl p-8 text-white text-center relative overflow-hidden">
            <div className="absolute top-4 left-4">
              <PartyPopper className="w-12 h-12 text-yellow-300/30" />
            </div>
            <div className="absolute bottom-4 right-4">
              <PartyPopper className="w-12 h-12 text-yellow-300/30 transform rotate-90" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Star className="w-6 h-6 text-yellow-300" />
                <span className="text-yellow-300 font-bold text-lg">SPECIAL EVENT</span>
                <Star className="w-6 h-6 text-yellow-300" />
              </div>
              <h3 className="text-3xl md:text-4xl font-black mb-4">
                한국공인금거래소 창립 2주년 기념
              </h3>
              <p className="text-xl text-yellow-100 mb-6">
                고객님께 감사드리며, 파격적인 특별가로 보답합니다!
              </p>
              <div className="flex flex-wrap justify-center gap-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4">
                  <p className="text-yellow-200 text-sm mb-1">순금 (1돈)</p>
                  <p className="text-3xl font-black">750,000<span className="text-lg">원</span></p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-8 py-4">
                  <p className="text-yellow-200 text-sm mb-1">순은 (1돈)</p>
                  <p className="text-3xl font-black">10,150<span className="text-lg">원</span></p>
                </div>
              </div>
              <p className="text-yellow-200 text-sm mt-6">* 이벤트 기간: 재고 소진시까지 | VAT 별도</p>
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
