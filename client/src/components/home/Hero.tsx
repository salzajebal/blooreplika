import heroBg from "@assets/generated_images/luxurious_gold_bars_background_for_website_hero_section.png";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowUp, ArrowDown, Minus, TrendingUp, Clock, RefreshCw } from "lucide-react";
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
      {/* Header */}
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
          {/* Gold */}
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

          {/* Silver */}
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

          {/* Platinum */}
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

      {/* Footer Notice */}
      <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-500 space-y-1">
        <p>• 상기 시세는 한국공인금거래소 기준이며, 실제 거래 시 차이가 있을 수 있습니다.</p>
        <p>• 살 때 가격은 VAT(부가세) 별도이며, 대량 거래 시 별도 문의바랍니다.</p>
        <p>• 국제 금 시세 변동에 따라 실시간으로 변경될 수 있습니다.</p>
      </div>
    </div>
  );
}

export function Hero() {
  const [, setLocation] = useLocation();

  const handleBuyClick = () => {
    setLocation("/signup");
  };

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
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white border-none rounded-none px-8 h-14 text-base"
              onClick={handleBuyClick}
              data-testid="button-buy-gold"
            >
              골드바 구매하기
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white text-white hover:bg-white hover:text-black rounded-none px-8 h-14 text-base"
                  data-testid="button-check-price"
                >
                  시세 조회하기
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
        </div>
      </div>
    </section>
  );
}
