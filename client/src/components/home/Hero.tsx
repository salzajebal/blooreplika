import heroBg from "@assets/generated_images/luxurious_gold_bars_background_for_website_hero_section.png";
import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative w-full h-[500px] overflow-hidden bg-black">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Gold Bars Background" 
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="container-custom relative h-full flex flex-col justify-center">
        <div className="max-w-2xl animate-in fade-in slide-in-from-left-8 duration-1000">
          <span className="inline-block py-1 px-3 border border-primary text-primary text-xs font-bold tracking-widest uppercase mb-6">
            Korea Authorized Gold Exchange
          </span>
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
            변하지 않는 가치, <br />
            <span className="text-gold-400">한국공인금거래소</span>
          </h1>
          <p className="text-gray-300 text-lg mb-8 max-w-lg leading-relaxed">
            투명하고 정직한 거래, 대한민국 대표 금거래소에서<br />
            당신의 소중한 자산을 안전하게 지키세요.
          </p>
          <div className="flex gap-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-white border-none rounded-none px-8 h-14 text-base">
              골드바 구매하기
            </Button>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-black rounded-none px-8 h-14 text-base">
              시세 조회하기
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
