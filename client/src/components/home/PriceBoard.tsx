import { ArrowUp, ArrowDown, Minus, RotateCw, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
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

export function PriceBoard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [prices, setPrices] = useState<PriceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const { openKakaoChat } = useKakaoLink();

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
    }, 30000);
    
    return () => {
      clearInterval(timer);
      clearInterval(priceTimer);
    };
  }, []);

  const renderTrend = (trend: string, change: string) => {
    if (trend === "up") {
      return (
        <div className="mt-3 sm:mt-4 flex justify-center items-center gap-1 text-red-500 text-[10px] sm:text-xs font-medium">
          <ArrowUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="hidden xs:inline">전일대비</span> {change}원 상승
        </div>
      );
    } else if (trend === "down") {
      return (
        <div className="mt-3 sm:mt-4 flex justify-center items-center gap-1 text-blue-500 text-[10px] sm:text-xs font-medium">
          <ArrowDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          <span className="hidden xs:inline">전일대비</span> {change}원 하락
        </div>
      );
    } else {
      return (
        <div className="mt-3 sm:mt-4 flex justify-center items-center gap-1 text-gray-500 text-[10px] sm:text-xs font-medium">
          <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
          변동 없음
        </div>
      );
    }
  };

  const handleKakaoClick = () => {
    openKakaoChat();
  };

  return (
    <div className="bg-white shadow-lg border border-stone-200 rounded-lg sm:rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-stone-800 via-stone-700 to-stone-800 text-white p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <h3 className="font-medium text-sm sm:text-base flex items-center gap-1.5 sm:gap-2">
          한국금거래소 실시간 시세
        </h3>
        <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-sm text-stone-300">
           <RotateCw className="w-2.5 h-2.5 sm:w-3 sm:h-3 animate-spin-slow" />
           <span>{format(currentTime, "yyyy.MM.dd HH:mm:ss", { locale: ko })} 기준</span>
           <button 
             onClick={fetchPrices}
             className="ml-1 sm:ml-2 p-1 hover:bg-stone-600 rounded-full transition-colors touch-manipulation"
             title="시세 새로고침"
           >
             <RefreshCw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
           </button>
        </div>
      </div>
      
      {loading ? (
        <div className="p-8 sm:p-12 text-center text-gray-500 text-sm">시세 정보를 불러오는 중...</div>
      ) : prices ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-100">
          <div className="p-4 sm:p-6 text-center group hover:bg-amber-50/30 transition-colors relative overflow-hidden">
            <div className="text-[10px] sm:text-sm text-amber-700 mb-1 uppercase tracking-wider font-medium">Gold / 3.75g (1돈)</div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-[10px] sm:text-sm font-bold">Au</span>
              순금
            </div>
            
            <div className="space-y-2 sm:space-y-3 px-2 sm:px-4">
              <div className="flex justify-between items-center border-b border-amber-100 pb-2">
                <span className="text-[10px] sm:text-sm text-amber-700 font-medium">살 때 (VAT포함)</span>
                <span className="font-bold text-red-600 text-sm sm:text-lg tracking-tight">{prices.gold.buyPrice}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-sm text-amber-700 font-medium">팔 때</span>
                <span className="font-bold text-blue-600 text-sm sm:text-lg tracking-tight">{prices.gold.sellPrice}원</span>
              </div>
            </div>
            
            {renderTrend(prices.gold.trend, prices.gold.change)}
          </div>

          <div className="p-4 sm:p-6 text-center group hover:bg-gray-50/50 transition-colors relative overflow-hidden">
            <div className="text-[10px] sm:text-sm text-gray-600 mb-1 uppercase tracking-wider font-medium">Silver / 3.75g (1돈)</div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-sm font-bold">Ag</span>
              실버
            </div>
            
            <div className="space-y-2 sm:space-y-3 px-2 sm:px-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-[10px] sm:text-sm text-gray-500 font-medium">살 때 (VAT포함)</span>
                <span className="font-bold text-red-600 text-sm sm:text-lg tracking-tight">{prices.silver.buyPrice}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-sm text-gray-500 font-medium">팔 때</span>
                <span className="font-bold text-blue-600 text-sm sm:text-lg tracking-tight">{prices.silver.sellPrice}원</span>
              </div>
            </div>

            {renderTrend(prices.silver.trend, prices.silver.change)}
          </div>

          <div className="p-4 sm:p-6 text-center group hover:bg-gray-50/50 transition-colors">
            <div className="text-[10px] sm:text-sm text-gray-500 mb-1 uppercase tracking-wider font-medium">Platinum / 3.75g (1돈)</div>
            <div className="text-lg sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center justify-center gap-1.5 sm:gap-2">
              <span className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-slate-400 to-zinc-500 rounded-full flex items-center justify-center text-white text-[10px] sm:text-sm font-bold">Pt</span>
              백금
            </div>
            
            <div className="space-y-2 sm:space-y-3 px-2 sm:px-4">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                <span className="text-[10px] sm:text-sm text-gray-500 font-medium">살 때 (VAT별도)</span>
                <span className="font-bold text-red-600 text-sm sm:text-lg tracking-tight">{prices.platinum.buyPrice}원</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] sm:text-sm text-gray-500 font-medium">팔 때</span>
                <span className="font-bold text-blue-600 text-sm sm:text-lg tracking-tight">{prices.platinum.sellPrice}원</span>
              </div>
            </div>

            {renderTrend(prices.platinum.trend, prices.platinum.change)}
          </div>
        </div>
      ) : (
        <div className="p-8 sm:p-12 text-center text-gray-500 text-sm">시세 정보를 불러올 수 없습니다.</div>
      )}
      
      <div className="bg-stone-50 px-3 sm:px-4 py-3 sm:py-4 border-t border-stone-100">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-3">
          <p className="text-xs sm:text-sm text-stone-600 text-center sm:text-left break-keep">
            구매 및 판매 관련 문의는 카카오톡으로 연락해 주세요.
          </p>
          <button 
            onClick={handleKakaoClick}
            className="flex items-center gap-1.5 sm:gap-2 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors touch-manipulation flex-shrink-0"
          >
            <KakaoIcon className="w-3 h-3 sm:w-4 sm:h-4" />
            카카오톡 문의
          </button>
        </div>
        <p className="text-[9px] sm:text-[11px] text-gray-400 mt-2 text-center">
          * 상기 시세는 VAT 별도 가격이며, 실제 거래 시 차이가 있을 수 있습니다.
        </p>
      </div>
    </div>
  );
}
