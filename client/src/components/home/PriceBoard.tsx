import { ArrowUp, ArrowDown, Minus, RotateCw, RefreshCw, MessageCircle, Sparkles } from "lucide-react";
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

  const handleKakaoClick = () => {
    window.open("https://pf.kakao.com/_xnxaxcxj", "_blank");
  };

  return (
    <div className="bg-white shadow-lg border border-stone-200 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 text-white p-4 flex flex-col md:flex-row justify-between items-center gap-2">
        <h3 className="font-medium text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-400" />
          2주년 기념 특별가 안내
        </h3>
        <div className="flex items-center gap-2 text-sm text-stone-300">
           <RotateCw className="w-3 h-3 animate-spin-slow" />
           <span>{format(currentTime, "yyyy.MM.dd HH:mm:ss", { locale: ko })} 기준</span>
           <button 
             onClick={fetchPrices}
             className="ml-2 p-1 hover:bg-stone-600 rounded-full transition-colors"
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
          <div className="p-6 text-center group hover:bg-amber-50/30 transition-colors relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="bg-amber-600 text-white text-[10px] font-medium px-2 py-0.5 rounded">특별가</span>
            </div>
            <div className="text-sm text-amber-700 mb-1 uppercase tracking-wider font-medium">Gold / 3.75g (1돈)</div>
            <div className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-sm font-bold">Au</span>
              순금
            </div>
            
            <div className="space-y-3 px-4">
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-lg p-4">
                <span className="text-sm text-amber-700 font-medium block mb-1">2주년 특별가</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-bold text-2xl text-stone-800">{eventPrices.gold}</span>
                  <span className="text-gray-500 text-sm">원</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>일반가</span>
                <span className="line-through">{prices.gold.buyPrice}원</span>
              </div>
            </div>
            
            {renderTrend(prices.gold.trend, prices.gold.change)}
          </div>

          <div className="p-6 text-center group hover:bg-gray-50/50 transition-colors relative overflow-hidden">
            <div className="absolute top-2 right-2">
              <span className="bg-gray-600 text-white text-[10px] font-medium px-2 py-0.5 rounded">특별가</span>
            </div>
            <div className="text-sm text-gray-600 mb-1 uppercase tracking-wider font-medium">Silver / 3.75g (1돈)</div>
            <div className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-sm font-bold">Ag</span>
              실버
            </div>
            
            <div className="space-y-3 px-4">
              <div className="bg-gradient-to-r from-gray-50 to-slate-50 border border-gray-200 rounded-lg p-4">
                <span className="text-sm text-gray-600 font-medium block mb-1">2주년 특별가</span>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-bold text-2xl text-stone-800">{eventPrices.silver}</span>
                  <span className="text-gray-500 text-sm">원</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-400">
                <span>일반가</span>
                <span className="line-through">{prices.silver.buyPrice}원</span>
              </div>
            </div>

            {renderTrend(prices.silver.trend, prices.silver.change)}
          </div>

          <div className="p-6 text-center group hover:bg-gray-50/50 transition-colors">
            <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-medium">Platinum / 3.75g (1돈)</div>
            <div className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-2">
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
      
      <div className="bg-stone-50 px-4 py-4 border-t border-stone-100">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-stone-600">
            2주년 특별가는 카카오톡을 통해 별도 문의해 주세요.
          </p>
          <button 
            onClick={handleKakaoClick}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            카카오톡 문의
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2 text-center">
          * 상기 시세는 VAT 별도 가격이며, 실제 거래 시 차이가 있을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
