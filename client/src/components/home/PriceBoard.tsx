import { ArrowUp, ArrowDown, Minus, RotateCw, RefreshCw, Gift, Sparkles, Star } from "lucide-react";
import { useState, useEffect } from "react";
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

export function PriceBoard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prices, setPrices] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const eventPrices = {
    gold: "750,000",
    silver: "10,150"
  };

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
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    const priceTimer = setInterval(() => {
      fetchPrices();
    }, 60000);
    
    return () => {
      clearInterval(timer);
      clearInterval(priceTimer);
    };
  }, []);

  const renderTrend = (trend: string, change: string) => {
    if (trend === "up") {
      return (
        <div className="mt-4 flex justify-center items-center gap-1 text-red-500 text-xs font-medium">
          <ArrowUp className="w-3 h-3" />
          전일대비 {change}원 상승
        </div>
      );
    } else if (trend === "down") {
      return (
        <div className="mt-4 flex justify-center items-center gap-1 text-blue-500 text-xs font-medium">
          <ArrowDown className="w-3 h-3" />
          전일대비 {change}원 하락
        </div>
      );
    } else {
      return (
        <div className="mt-4 flex justify-center items-center gap-1 text-gray-500 text-xs font-medium">
          <Minus className="w-3 h-3" />
          변동 없음
        </div>
      );
    }
  };

  return (
    <div className="bg-white shadow-xl border-2 border-amber-200 rounded-2xl overflow-hidden relative">
      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
        <span className="bg-gradient-to-r from-red-600 to-red-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1">
          <Gift className="w-3 h-3" />
          2주년 특가
        </span>
      </div>
      
      <div className="bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 text-white p-4 flex flex-col md:flex-row justify-between items-center gap-2 pt-6">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-yellow-200 animate-pulse" />
          2주년 이벤트 특별가
          <Star className="w-4 h-4 text-yellow-200" />
        </h3>
        <div className="flex items-center gap-2 text-sm text-yellow-100">
           <RotateCw className="w-3 h-3 animate-spin-slow" />
           <span>{format(currentTime, "yyyy.MM.dd HH:mm:ss", { locale: ko })} 기준</span>
           <button 
             onClick={fetchPrices}
             className="ml-2 p-1 hover:bg-amber-500 rounded-full transition-colors"
             title="시세 새로고침"
           >
             <RefreshCw className="w-3 h-3" />
           </button>
        </div>
      </div>
      
      {loading ? (
        <div className="p-12 text-center text-gray-500">시세 정보를 불러오는 중...</div>
      ) : prices ? (
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          <div className="p-6 text-center group hover:bg-amber-50/50 transition-colors relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">EVENT</span>
            </div>
            <div className="text-sm text-amber-600 mb-1 uppercase tracking-wider font-bold">Gold / 3.75g (1돈)</div>
            <div className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-1">
              <span className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-amber-900 text-sm font-bold">Au</span>
              순금
            </div>
            
            <div className="space-y-3 px-4">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 rounded-lg p-4 relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">특가</span>
                </div>
                <span className="text-sm text-amber-600 font-medium block mb-1">이벤트 특별가</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-black text-3xl text-red-600">{eventPrices.gold}</span>
                  <span className="text-gray-500 text-sm">원</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>기존가</span>
                <span className="line-through">{prices.gold.buyPrice}원</span>
              </div>
            </div>
            
            {renderTrend(prices.gold.trend, prices.gold.change)}
          </div>

          <div className="p-6 text-center group hover:bg-gray-50/50 transition-colors relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">EVENT</span>
            </div>
            <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-bold">Silver / 3.75g (1돈)</div>
            <div className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-1">
              <span className="w-8 h-8 bg-gradient-to-br from-gray-300 to-slate-400 rounded-full flex items-center justify-center text-slate-700 text-sm font-bold">Ag</span>
              실버
            </div>
            
            <div className="space-y-3 px-4">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-2 border-gray-300 rounded-lg p-4 relative">
                <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">특가</span>
                </div>
                <span className="text-sm text-gray-600 font-medium block mb-1">이벤트 특별가</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-black text-3xl text-red-600">{eventPrices.silver}</span>
                  <span className="text-gray-500 text-sm">원</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>기존가</span>
                <span className="line-through">{prices.silver.buyPrice}원</span>
              </div>
            </div>

            {renderTrend(prices.silver.trend, prices.silver.change)}
          </div>

          <div className="p-6 text-center group hover:bg-gray-50/50 transition-colors">
            <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-medium">Platinum / 3.75g (1돈)</div>
            <div className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-1">
              <span className="w-8 h-8 bg-gradient-to-br from-slate-400 to-zinc-500 rounded-full flex items-center justify-center text-white text-sm font-bold">Pt</span>
              백금
            </div>
            
            <div className="space-y-3 px-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-sm text-gray-500 font-medium">살 때 (VAT별도)</span>
                <span className="font-bold text-red-600 text-lg tracking-tight">{prices.platinum.buyPrice}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 font-medium">팔 때</span>
                <span className="font-bold text-blue-600 text-lg tracking-tight">{prices.platinum.sellPrice}원</span>
              </div>
            </div>

            {renderTrend(prices.platinum.trend, prices.platinum.change)}
          </div>
        </div>
      ) : (
        <div className="p-12 text-center text-gray-500">시세 정보를 불러올 수 없습니다.</div>
      )}
      
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 px-4 py-3 text-center border-t border-amber-100">
        <p className="text-xs text-amber-700 font-medium flex items-center justify-center gap-2">
          <Gift className="w-3 h-3" />
          2주년 이벤트 기간 동안 금 · 은 특별가 적용 (재고 소진시까지)
          <Gift className="w-3 h-3" />
        </p>
        <p className="text-[10px] text-gray-500 mt-1">
          * 상기 시세는 VAT 별도 가격이며, 대량 거래 시 별도 문의바랍니다.
        </p>
      </div>
    </div>
  );
}
