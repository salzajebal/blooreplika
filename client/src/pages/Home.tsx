import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/home/Hero";
import { PriceBoard } from "@/components/home/PriceBoard";
import { ProductGrid } from "@/components/home/ProductGrid";

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      
      <main>
        <Hero />
        
        {/* Price Board Section - Overlapping Hero */}
        <div className="container-custom relative -mt-20 z-10 mb-16">
          <PriceBoard />
        </div>

        {/* Banners */}
        <div className="container-custom grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="bg-[#f5f1e6] p-8 h-48 flex flex-col justify-center items-start hover:shadow-lg transition-shadow cursor-pointer">
            <span className="text-primary font-bold text-sm mb-2">INVESTMENT</span>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">골드바/실버바 투자</h3>
            <span className="text-gray-600 text-sm flex items-center gap-1">
              자세히 보기 &rarr;
            </span>
          </div>
          <div className="bg-[#e6f0f5] p-8 h-48 flex flex-col justify-center items-start hover:shadow-lg transition-shadow cursor-pointer">
            <span className="text-blue-600 font-bold text-sm mb-2">SELLING</span>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">금 최고가 매입</h3>
            <span className="text-gray-600 text-sm flex items-center gap-1">
              시세 확인하기 &rarr;
            </span>
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
