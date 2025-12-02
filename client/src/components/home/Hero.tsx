import heroBg from "@assets/generated_images/luxurious_gold_bars_background_for_website_hero_section.png";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { ArrowUp, ArrowDown, Minus, TrendingUp, Clock, RefreshCw, Sparkles, Shield, ChevronLeft, ChevronRight } from "lucide-react";
import { useKakaoLink } from "@/hooks/use-kakao-link";

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.15.53-.5 1.92-.57 2.22-.1.38.14.38.29.27.12-.08 1.85-1.22 2.6-1.72.72.11 1.47.17 2.18.17 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
    </svg>
  );
}
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface PriceData {
  buyPrice: string;
  sellPrice: string;
  trend: string;
  change: string;
}

interface PriceResponse {
  gold: PriceData;
  silver: PriceData;
  platinum: PriceData;
}

function PriceModal() {
  const [prices, setPrices] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const fetchPrices = async () => {
    try {
      const res = await fetch("/api/prices");
      const data = await res.json();
      if (data.success) {
        setPrices(data.data);
      }
    } catch (error) {
      console.error("Error fetching prices:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const renderTrendIcon = (trend: string) => {
    if (trend === "up") return <ArrowUp className="w-5 h-5 text-red-500" />;
    if (trend === "down") return <ArrowDown className="w-5 h-5 text-blue-500" />;
    return <Minus className="w-5 h-5 text-gray-500" />;
  };

  const renderTrendText = (trend: string, change: string) => {
    if (trend === "up") return <span className="text-red-500 font-bold">+{change}원 ▲</span>;
    if (trend === "down") return <span className="text-blue-500 font-bold">-{change}원 ▼</span>;
    return <span className="text-gray-500">변동없음</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{format(currentTime, "yyyy년 MM월 dd일 HH:mm:ss", { locale: ko })}</span>
        </div>
        <button 
          onClick={fetchPrices}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <RefreshCw className="w-4 h-4" />
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-500">시세 정보를 불러오는 중...</div>
      ) : prices ? (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-5 rounded-lg border border-yellow-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm">Au</span>
                  순금 (Gold)
                </h3>
                <p className="text-sm text-gray-500 mt-1">24K / 999.9 / 3.75g (1돈) 기준</p>
              </div>
              <div className="flex items-center gap-1">
                {renderTrendIcon(prices.gold.trend)}
                {renderTrendText(prices.gold.trend, prices.gold.change)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border border-yellow-100">
                <p className="text-sm text-gray-500 mb-1">살 때 (Buy)</p>
                <p className="text-2xl font-bold text-red-600">{prices.gold.buyPrice}<span className="text-sm font-normal text-gray-500">원</span></p>
                <p className="text-xs text-gray-400 mt-1">VAT 별도</p>
              </div>
              <div className="bg-white p-4 rounded-md border border-yellow-100">
                <p className="text-sm text-gray-500 mb-1">팔 때 (Sell)</p>
                <p className="text-2xl font-bold text-blue-600">{prices.gold.sellPrice}<span className="text-sm font-normal text-gray-500">원</span></p>
                <p className="text-xs text-gray-400 mt-1">순금 기준</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-5 rounded-lg border border-gray-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-sm">Ag</span>
                  실버 (Silver)
                </h3>
                <p className="text-sm text-gray-500 mt-1">999.9 / 3.75g (1돈) 기준</p>
              </div>
              <div className="flex items-center gap-1">
                {renderTrendIcon(prices.silver.trend)}
                {renderTrendText(prices.silver.trend, prices.silver.change)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">살 때 (Buy)</p>
                <p className="text-2xl font-bold text-red-600">{prices.silver.buyPrice}<span className="text-sm font-normal text-gray-500">원</span></p>
              </div>
              <div className="bg-white p-4 rounded-md border border-gray-100">
                <p className="text-sm text-gray-500 mb-1">팔 때 (Sell)</p>
                <p className="text-2xl font-bold text-blue-600">{prices.silver.sellPrice}<span className="text-sm font-normal text-gray-500">원</span></p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-zinc-50 p-5 rounded-lg border border-slate-200">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-sm">Pt</span>
                  백금 (Platinum)
                </h3>
                <p className="text-sm text-gray-500 mt-1">999.9 / 3.75g (1돈) 기준</p>
              </div>
              <div className="flex items-center gap-1">
                {renderTrendIcon(prices.platinum.trend)}
                {renderTrendText(prices.platinum.trend, prices.platinum.change)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-md border border-slate-100">
                <p className="text-sm text-gray-500 mb-1">살 때 (Buy)</p>
                <p className="text-2xl font-bold text-red-600">{prices.platinum.buyPrice}<span className="text-sm font-normal text-gray-500">원</span></p>
              </div>
              <div className="bg-white p-4 rounded-md border border-slate-100">
                <p className="text-sm text-gray-500 mb-1">팔 때 (Sell)</p>
                <p className="text-2xl font-bold text-blue-600">{prices.platinum.sellPrice}<span className="text-sm font-normal text-gray-500">원</span></p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-gray-500">시세 정보를 불러올 수 없습니다.</div>
      )}

      <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500 space-y-1">
        <p>• 상기 시세는 한국골드금거래소 기준이며, 실제 거래 시 차이가 있을 수 있습니다.</p>
        <p>• 살 때 가격은 VAT(부가세) 별도이며, 대량 거래 시 별도 문의바랍니다.</p>
        <p>• 국제 금 시세 변동에 따라 실시간으로 변경될 수 있습니다.</p>
      </div>
    </div>
  );
}

export function Hero() {
  const [, setLocation] = useLocation();
  const { openKakaoChat } = useKakaoLink();
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = 2;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(timer);
  }, [nextSlide]);

  const handleKakaoClick = () => {
    openKakaoChat();
  };

  return (
    <section className="relative w-full min-h-[550px] overflow-hidden bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900">
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Gold Bars Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/60 to-transparent"></div>
      </div>

      <div className="container-custom relative h-full py-16">
        <div className="relative overflow-hidden">
          <div 
            className="flex transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            <div className="w-full flex-shrink-0">
              <div className="max-w-3xl animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-flex items-center gap-2 py-2 px-4 bg-amber-700/80 text-amber-100 text-sm font-medium tracking-wide rounded-full">
                    <Sparkles className="w-4 h-4" />
                    창립 2주년 기념
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                  한국골드금거래소
                  <br />
                  <span className="text-amber-400">2주년 특별가 안내</span>
                </h1>
                
                <p className="text-stone-300 text-lg mb-10 max-w-xl leading-relaxed">
                  고객님의 성원에 감사드리며, 창립 2주년을 맞아
                  <br />
                  특별한 가격으로 금 · 은 상품을 안내해 드립니다.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                  <div className="bg-stone-800/60 backdrop-blur-sm border border-amber-700/30 rounded-xl p-6 hover:border-amber-600/50 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-11 h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-stone-900 text-base font-bold shadow-lg">Au</span>
                      <div>
                        <p className="text-amber-400/80 text-sm">순금 Gold / 1돈</p>
                        <p className="text-white font-medium">24K 999.9</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-white">750,000</span>
                      <span className="text-amber-400 text-lg font-medium mb-1">원</span>
                    </div>
                    <p className="text-stone-400 text-sm mt-2">VAT 별도 / 돈당 기준</p>
                  </div>

                  <div className="bg-stone-800/60 backdrop-blur-sm border border-gray-500/30 rounded-xl p-6 hover:border-gray-400/50 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="w-11 h-11 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-stone-800 text-base font-bold shadow-lg">Ag</span>
                      <div>
                        <p className="text-gray-400 text-sm">실버 Silver / 1돈</p>
                        <p className="text-white font-medium">999.9</p>
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-bold text-white">10,150</span>
                      <span className="text-gray-400 text-lg font-medium mb-1">원</span>
                    </div>
                    <p className="text-stone-400 text-sm mt-2">VAT 별도 / 돈당 기준</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <Button 
                    size="lg" 
                    className="bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium border-none rounded-lg px-8 h-14 text-base shadow-lg"
                    onClick={handleKakaoClick}
                    data-testid="button-kakao-inquiry"
                  >
                    <KakaoIcon className="w-5 h-5 mr-2" />
                    카카오톡 문의하기
                  </Button>
                  
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="border border-stone-500 text-stone-300 hover:bg-stone-700 hover:text-white rounded-lg px-8 h-14 text-base"
                        data-testid="button-check-price"
                      >
                        실시간 시세 조회
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                          <TrendingUp className="w-6 h-6 text-primary" />
                          실시간 귀금속 시세
                        </DialogTitle>
                      </DialogHeader>
                      <PriceModal />
                    </DialogContent>
                  </Dialog>
                </div>

                <p className="mt-8 text-stone-500 text-sm">
                  * 이벤트 특별가는 별도 문의를 통해 안내받으실 수 있습니다.
                </p>
              </div>
            </div>

            <div className="w-full flex-shrink-0">
              <div className="max-w-3xl">
                <div className="flex items-center gap-3 mb-6">
                  <span className="inline-flex items-center gap-2 py-2 px-4 bg-amber-700/80 text-amber-100 text-sm font-medium tracking-wide rounded-full">
                    <Shield className="w-4 h-4" />
                    신뢰와 전통
                  </span>
                </div>
                
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-6">
                  한국골드금거래소가
                  <br />
                  <span className="text-amber-400">저렴히 판매할 수 있는 이유</span>
                </h1>
                
                <div className="bg-stone-800/60 backdrop-blur-sm border border-amber-700/30 rounded-xl p-6 md:p-8 mb-8">
                  <p className="text-stone-200 text-base md:text-lg leading-relaxed mb-6">
                    저희 한국골드금거래소는 <span className="text-amber-400 font-bold">1884년</span>부터 가족 대대로 귀금속 주얼리를 취급하던 기업입니다.
                  </p>
                  
                  <p className="text-stone-300 text-base leading-relaxed mb-6">
                    금을 취급하는 정말 많은 업체가 있지만 대부분 당일매입 후 당일 판매를 합니다. 하지만 금은 한정적인 자산이며 현시점, 금값은 최근 폭등하였습니다.
                  </p>
                  
                  <p className="text-stone-300 text-base leading-relaxed mb-6">
                    매번 그랬듯 한국골드금거래소는 <span className="text-amber-400 font-semibold">싸게 판매를 원칙</span>으로 하여 항상 매번 <span className="text-amber-400 font-semibold">최소 판매 6개월 전부터 10kg 이상 현물을 매입</span>합니다. 당시 매입시세는 지금보다 훨씬 낮은 가치겠죠.
                  </p>
                  
                  <p className="text-stone-200 text-base leading-relaxed">
                    그렇기 때문에 현재 금값이 치솟아도, 세공비, 인건비 포함하여 시세보다 저렴하게 판매할 수 있는 최고 장점의 <span className="text-amber-400 font-bold">"이유"</span>입니다.
                  </p>
                </div>

                <div className="bg-gradient-to-r from-red-900/40 to-amber-900/40 backdrop-blur-sm border border-red-500/30 rounded-xl p-5 md:p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Shield className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">10배 배상 보장</h3>
                      <p className="text-stone-300 text-base leading-relaxed">
                        저희 물건이 가품일시 이유불문 <span className="text-red-400 font-bold">10배 배상</span>을 자신있게 약속드립니다.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={prevSlide}
            className="w-10 h-10 rounded-full bg-stone-700/50 hover:bg-stone-600/50 flex items-center justify-center text-white transition-colors"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          
          <div className="flex gap-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  currentSlide === index 
                    ? 'bg-amber-500 w-8' 
                    : 'bg-stone-600 hover:bg-stone-500'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="w-10 h-10 rounded-full bg-stone-700/50 hover:bg-stone-600/50 flex items-center justify-center text-white transition-colors"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
