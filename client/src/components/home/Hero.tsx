import heroBg from "@assets/generated_images/luxurious_gold_bars_background_for_website_hero_section.png";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowUp, ArrowDown, Minus, TrendingUp, Clock, RefreshCw, Gift, Sparkles, Star, PartyPopper } from "lucide-react";
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
    setLocation("/products/gold_bar");
  };

  return (
    <section className="relative w-full min-h-[600px] overflow-hidden bg-gradient-to-br from-amber-950 via-amber-900 to-yellow-900">
      <div className="absolute inset-0">
        <img 
          src={heroBg} 
          alt="Gold Bars Background" 
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-950/90 via-amber-900/70 to-transparent"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-yellow-500/20 via-transparent to-transparent"></div>
      </div>

      <div className="absolute top-4 left-4 w-32 h-32 opacity-20">
        <Sparkles className="w-full h-full text-yellow-400 animate-pulse" />
      </div>
      <div className="absolute bottom-8 right-8 w-24 h-24 opacity-20">
        <Star className="w-full h-full text-yellow-400 animate-pulse" />
      </div>
      <div className="absolute top-1/4 right-1/4 w-16 h-16 opacity-30">
        <PartyPopper className="w-full h-full text-yellow-300 animate-bounce" />
      </div>

      <div className="container-custom relative h-full flex flex-col justify-center py-12">
        <div className="max-w-3xl animate-in fade-in slide-in-from-left-8 duration-1000">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 py-2 px-4 bg-gradient-to-r from-red-600 to-red-500 text-white text-sm font-bold tracking-wide rounded-full shadow-lg animate-pulse">
              <Gift className="w-4 h-4" />
              2주년 기념 특별 이벤트
            </span>
            <span className="inline-block py-1 px-3 border-2 border-yellow-400 text-yellow-400 text-xs font-bold tracking-widest uppercase rounded-full">
              Limited Time
            </span>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-4">
            <span className="text-yellow-400">창립 2주년</span> 기념
            <br />
            <span className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 bg-clip-text text-transparent">
              파격 특가 판매!
            </span>
          </h1>
          
          <p className="text-yellow-100/90 text-lg mb-8 max-w-xl leading-relaxed">
            한국공인금거래소 창립 2주년을 맞아
            <br />
            <span className="text-white font-bold">금 · 은 최저가 특별 판매</span>를 진행합니다!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="relative bg-gradient-to-br from-yellow-500/30 to-amber-600/30 backdrop-blur-sm border-2 border-yellow-400/50 rounded-xl p-6 overflow-hidden group hover:border-yellow-400 transition-all">
              <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                EVENT
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-amber-900 text-lg font-bold shadow-lg">Au</span>
                <div>
                  <p className="text-yellow-200 text-sm">순금 Gold / 1돈</p>
                  <p className="text-white font-bold text-lg">24K 999.9</p>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">750,000</span>
                <span className="text-yellow-300 text-xl font-bold mb-1">원</span>
              </div>
              <p className="text-yellow-300/80 text-sm mt-2">VAT 별도 / 돈당 기준</p>
            </div>

            <div className="relative bg-gradient-to-br from-gray-400/30 to-slate-500/30 backdrop-blur-sm border-2 border-gray-300/50 rounded-xl p-6 overflow-hidden group hover:border-gray-300 transition-all">
              <div className="absolute top-0 right-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                EVENT
              </div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-12 h-12 bg-gradient-to-br from-gray-300 to-slate-400 rounded-full flex items-center justify-center text-slate-700 text-lg font-bold shadow-lg">Ag</span>
                <div>
                  <p className="text-gray-300 text-sm">실버 Silver / 1돈</p>
                  <p className="text-white font-bold text-lg">999.9</p>
                </div>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl md:text-5xl font-black text-white drop-shadow-lg">10,150</span>
                <span className="text-gray-300 text-xl font-bold mb-1">원</span>
              </div>
              <p className="text-gray-300/80 text-sm mt-2">VAT 별도 / 돈당 기준</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-amber-900 font-bold border-none rounded-full px-10 h-14 text-base shadow-xl shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all"
              onClick={handleBuyClick}
              data-testid="button-buy-gold"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              이벤트 상품 구매하기
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-amber-900 rounded-full px-10 h-14 text-base font-bold"
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

          <div className="mt-8 flex items-center gap-6 text-yellow-200/70 text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              이벤트 진행중
            </span>
            <span>기간: 재고 소진시까지</span>
          </div>
        </div>
      </div>
    </section>
  );
}
