import heroBg from "@assets/generated_images/luxurious_gold_bars_background_for_website_hero_section.png";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowUp, ArrowDown, Minus, TrendingUp, Clock, RefreshCw, Sparkles } from "lucide-react";
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
    if (trend === "up") return <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />;
    if (trend === "down") return <ArrowDown className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />;
    return <Minus className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />;
  };

  const renderTrendText = (trend: string, change: string) => {
    if (trend === "up") return <span className="text-red-500 font-bold text-xs sm:text-sm">+{change}원 ▲</span>;
    if (trend === "down") return <span className="text-blue-500 font-bold text-xs sm:text-sm">-{change}원 ▼</span>;
    return <span className="text-gray-500 text-xs sm:text-sm">변동없음</span>;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 pb-3 sm:pb-4 border-b border-gray-200">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
          <span>{format(currentTime, "yyyy년 MM월 dd일 HH:mm:ss", { locale: ko })}</span>
        </div>
        <button 
          onClick={fetchPrices}
          className="flex items-center gap-1 text-xs sm:text-sm text-primary hover:underline self-end sm:self-auto"
        >
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="py-8 sm:py-12 text-center text-gray-500 text-sm">시세 정보를 불러오는 중...</div>
      ) : prices ? (
        <div className="space-y-3 sm:space-y-4">
          <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 sm:p-5 rounded-lg border border-yellow-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3 sm:mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs sm:text-sm">Au</span>
                  순금 (Gold)
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">24K / 999.9 / 3.75g (1돈) 기준</p>
              </div>
              <div className="flex items-center gap-1">
                {renderTrendIcon(prices.gold.trend)}
                {renderTrendText(prices.gold.trend, prices.gold.change)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-md border border-yellow-100">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">살 때 (Buy)</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{prices.gold.buyPrice}<span className="text-xs sm:text-sm font-normal text-gray-500">원</span></p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">VAT 별도</p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-md border border-yellow-100">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">팔 때 (Sell)</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{prices.gold.sellPrice}<span className="text-xs sm:text-sm font-normal text-gray-500">원</span></p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1">순금 기준</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-4 sm:p-5 rounded-lg border border-gray-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3 sm:mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs sm:text-sm">Ag</span>
                  실버 (Silver)
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">999.9 / 3.75g (1돈) 기준</p>
              </div>
              <div className="flex items-center gap-1">
                {renderTrendIcon(prices.silver.trend)}
                {renderTrendText(prices.silver.trend, prices.silver.change)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-md border border-gray-100">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">살 때 (Buy)</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{prices.silver.buyPrice}<span className="text-xs sm:text-sm font-normal text-gray-500">원</span></p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-md border border-gray-100">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">팔 때 (Sell)</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{prices.silver.sellPrice}<span className="text-xs sm:text-sm font-normal text-gray-500">원</span></p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-slate-50 to-zinc-50 p-4 sm:p-5 rounded-lg border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0 mb-3 sm:mb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="w-7 h-7 sm:w-8 sm:h-8 bg-slate-600 rounded-full flex items-center justify-center text-white text-xs sm:text-sm">Pt</span>
                  백금 (Platinum)
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">999.9 / 3.75g (1돈) 기준</p>
              </div>
              <div className="flex items-center gap-1">
                {renderTrendIcon(prices.platinum.trend)}
                {renderTrendText(prices.platinum.trend, prices.platinum.change)}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              <div className="bg-white p-3 sm:p-4 rounded-md border border-slate-100">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">살 때 (Buy)</p>
                <p className="text-lg sm:text-2xl font-bold text-red-600">{prices.platinum.buyPrice}<span className="text-xs sm:text-sm font-normal text-gray-500">원</span></p>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-md border border-slate-100">
                <p className="text-xs sm:text-sm text-gray-500 mb-1">팔 때 (Sell)</p>
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{prices.platinum.sellPrice}<span className="text-xs sm:text-sm font-normal text-gray-500">원</span></p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-8 sm:py-12 text-center text-gray-500 text-sm">시세 정보를 불러올 수 없습니다.</div>
      )}

      <div className="bg-gray-50 p-3 sm:p-4 rounded-lg text-[10px] sm:text-xs text-gray-500 space-y-1">
        <p>• 상기 시세는 한국골드금거래소 기준이며, 실제 거래 시 차이가 있을 수 있습니다.</p>
        <p>• 살 때 가격은 VAT(부가세) 별도이며, 대량 거래 시 별도 문의바랍니다.</p>
        <p>• 국제 금 시세 변동에 따라 실시간으로 변경될 수 있습니다.</p>
      </div>
    </div>
  );
}

export function Hero() {
  const [, setLocation] = useLocation();
  const { openKakaoChat, showConfirmDialog, confirmAndOpenKakao, closeConfirmDialog } = useKakaoLink();
  const [livePrices, setLivePrices] = useState<PriceResponse | null>(null);

  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const res = await fetch("/api/prices");
        const data = await res.json();
        if (data.success) {
          setLivePrices(data.data);
        }
      } catch (error) {
        console.error("Error fetching live prices:", error);
      }
    };

    fetchLivePrices();
    const interval = setInterval(fetchLivePrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const handleKakaoClick = () => {
    openKakaoChat();
  };

  return (
    <>
    <Dialog open={showConfirmDialog} onOpenChange={(open) => !open && closeConfirmDialog()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-600" />
            </div>
            <DialogTitle className="text-lg font-bold">카카오톡 상담 안내</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p className="text-gray-700 font-medium">
              카카오톡 상담은 <span className="text-amber-600 font-bold">결제 및 재고 안내</span>를 위한 상담입니다.
            </p>
            <p className="text-gray-600">
              구입 전 충분한 고민 후 상담을 부탁드립니다.
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 mt-4">
          <Button variant="outline" onClick={closeConfirmDialog} className="flex-1">
            취소
          </Button>
          <Button 
            onClick={confirmAndOpenKakao}
            className="flex-1 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E]"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    <section className="relative w-full min-h-[420px] sm:min-h-[480px] md:min-h-[550px] overflow-hidden bg-gradient-to-br from-stone-900 via-amber-950 to-stone-900">
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Gold Bars Background" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/60 to-transparent"></div>
      </div>

      <div className="container-custom relative h-full py-8 sm:py-12 md:py-16">
        <div className="max-w-3xl animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="inline-flex items-center gap-1.5 sm:gap-2 py-1.5 sm:py-2 px-3 sm:px-4 bg-amber-700/80 text-amber-100 text-xs sm:text-sm font-medium tracking-wide rounded-full">
              <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
              창립 2주년 기념
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 sm:mb-4 break-keep">
            한국골드금거래소
            <br />
            <span className="text-amber-400">실시간 시세 안내</span>
          </h1>
          
          <p className="text-stone-300 text-sm sm:text-base md:text-lg mb-6 sm:mb-8 md:mb-10 max-w-xl leading-relaxed break-keep">
            고객님의 성원에 감사드리며, 창립 2주년을 맞아
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            금 · 은 상품을 안내해 드립니다.
          </p>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5 mb-6 sm:mb-8 md:mb-10">
            <div className="bg-stone-800/60 backdrop-blur-sm border border-amber-700/30 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 hover:border-amber-600/50 transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-stone-900 text-xs sm:text-sm md:text-base font-bold shadow-lg">Au</span>
                <div>
                  <p className="text-amber-400/80 text-[10px] sm:text-xs md:text-sm">순금 Gold / 1돈</p>
                  <p className="text-white font-medium text-xs sm:text-sm md:text-base">24K 999.9</p>
                </div>
              </div>
              <div className="flex items-end gap-1 sm:gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white" data-testid="price-gold-live">
                  {livePrices?.gold?.buyPrice || "750,000"}
                </span>
                <span className="text-amber-400 text-sm sm:text-base md:text-lg font-medium mb-0.5 sm:mb-1">원</span>
                {livePrices?.gold?.trend && (
                  <span className={`text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 ${livePrices.gold.trend === "up" ? "text-red-400" : livePrices.gold.trend === "down" ? "text-blue-400" : "text-gray-400"}`}>
                    {livePrices.gold.trend === "up" ? "▲" : livePrices.gold.trend === "down" ? "▼" : ""}
                  </span>
                )}
              </div>
              <p className="text-stone-400 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">VAT 별도 / 돈당 기준</p>
            </div>

            <div className="bg-stone-800/60 backdrop-blur-sm border border-gray-500/30 rounded-lg sm:rounded-xl p-4 sm:p-5 md:p-6 hover:border-gray-400/50 transition-all">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <span className="w-8 h-8 sm:w-10 sm:h-10 md:w-11 md:h-11 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-stone-800 text-xs sm:text-sm md:text-base font-bold shadow-lg">Ag</span>
                <div>
                  <p className="text-gray-400 text-[10px] sm:text-xs md:text-sm">실버 Silver / 1돈</p>
                  <p className="text-white font-medium text-xs sm:text-sm md:text-base">999.9</p>
                </div>
              </div>
              <div className="flex items-end gap-1 sm:gap-2">
                <span className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-white" data-testid="price-silver-live">
                  {livePrices?.silver?.buyPrice || "10,150"}
                </span>
                <span className="text-gray-400 text-sm sm:text-base md:text-lg font-medium mb-0.5 sm:mb-1">원</span>
                {livePrices?.silver?.trend && (
                  <span className={`text-xs sm:text-sm font-bold mb-0.5 sm:mb-1 ${livePrices.silver.trend === "up" ? "text-red-400" : livePrices.silver.trend === "down" ? "text-blue-400" : "text-gray-400"}`}>
                    {livePrices.silver.trend === "up" ? "▲" : livePrices.silver.trend === "down" ? "▼" : ""}
                  </span>
                )}
              </div>
              <p className="text-stone-400 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2">VAT 별도 / 돈당 기준</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Button 
              size="lg" 
              className="bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-medium border-none rounded-lg px-5 sm:px-6 md:px-8 h-11 sm:h-12 md:h-14 text-sm sm:text-base shadow-lg w-full sm:w-auto"
              onClick={handleKakaoClick}
              data-testid="button-kakao-inquiry"
            >
              <KakaoIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              카카오톡 문의하기
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border border-stone-500 text-stone-300 hover:bg-stone-700 hover:text-white rounded-lg px-5 sm:px-6 md:px-8 h-11 sm:h-12 md:h-14 text-sm sm:text-base w-full sm:w-auto"
                  data-testid="button-check-price"
                >
                  실시간 시세 조회
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-lg md:max-w-2xl max-h-[85vh] overflow-y-auto mx-2">
                <DialogHeader>
                  <DialogTitle className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    실시간 귀금속 시세
                  </DialogTitle>
                </DialogHeader>
                <PriceModal />
              </DialogContent>
            </Dialog>
          </div>

          <p className="mt-5 sm:mt-6 md:mt-8 text-stone-500 text-xs sm:text-sm">
            * 시세는 실시간으로 변동되며, 최종 가격은 주문 시점 기준으로 적용됩니다.
          </p>
        </div>
      </div>
    </section>
    </>
  );
}
