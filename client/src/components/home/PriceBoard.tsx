import { ArrowUp, ArrowDown, Minus, RotateCw } from "lucide-react";
import { PRICE_DATA } from "@/lib/mockData";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function PriceBoard() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-white shadow-lg border border-gray-100 p-0 overflow-hidden">
      <div className="bg-gray-900 text-white p-4 flex flex-col md:flex-row justify-between items-center gap-2">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          실시간 시세정보
        </h3>
        <div className="flex items-center gap-2 text-sm text-gray-300">
           <RotateCw className="w-3 h-3 animate-spin-slow" />
           <span>{format(currentTime, "yyyy.MM.dd HH:mm:ss", { locale: ko })} 기준</span>
           <span className="text-[10px] bg-gray-800 px-2 py-0.5 rounded-full ml-1">한국금거래소 기준</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Gold */}
        <div className="p-6 text-center group hover:bg-gray-50 transition-colors relative">
          <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-medium">Gold / 3.75g (1돈)</div>
          <div className="text-3xl font-bold text-gray-900 mb-6">순금</div>
          
          <div className="space-y-4 px-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500 font-medium">살 때 (VAT별도)</span>
              <span className="font-bold text-red-600 text-xl tracking-tight">{PRICE_DATA.gold.buy}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">팔 때</span>
              <span className="font-bold text-blue-600 text-xl tracking-tight">{PRICE_DATA.gold.sell}원</span>
            </div>
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center items-center gap-1 text-red-500 text-sm font-medium bg-red-50 mx-4 py-2 rounded-sm">
            <ArrowUp className="w-4 h-4" />
            전일대비 {PRICE_DATA.gold.change}원 상승
          </div>
        </div>

        {/* Silver */}
        <div className="p-6 text-center group hover:bg-gray-50 transition-colors">
          <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-medium">Silver / 3.75g (1돈)</div>
          <div className="text-3xl font-bold text-gray-900 mb-6">실버</div>
          
          <div className="space-y-4 px-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500 font-medium">살 때 (VAT별도)</span>
              <span className="font-bold text-red-600 text-xl tracking-tight">{PRICE_DATA.silver.buy}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">팔 때</span>
              <span className="font-bold text-blue-600 text-xl tracking-tight">{PRICE_DATA.silver.sell}원</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center items-center gap-1 text-blue-500 text-sm font-medium bg-blue-50 mx-4 py-2 rounded-sm">
            <ArrowDown className="w-4 h-4" />
            전일대비 {PRICE_DATA.silver.change}원 하락
          </div>
        </div>

        {/* Platinum */}
        <div className="p-6 text-center group hover:bg-gray-50 transition-colors">
          <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider font-medium">Platinum / 3.75g (1돈)</div>
          <div className="text-3xl font-bold text-gray-900 mb-6">백금</div>
          
          <div className="space-y-4 px-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="text-sm text-gray-500 font-medium">살 때 (VAT별도)</span>
              <span className="font-bold text-red-600 text-xl tracking-tight">{PRICE_DATA.platinum.buy}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 font-medium">팔 때</span>
              <span className="font-bold text-blue-600 text-xl tracking-tight">{PRICE_DATA.platinum.sell}원</span>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center items-center gap-1 text-gray-500 text-sm font-medium bg-gray-100 mx-4 py-2 rounded-sm">
            <Minus className="w-4 h-4" />
            변동 없음
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 text-center border-t border-gray-100">
        <a href="#" className="text-xs text-gray-500 hover:text-primary underline decoration-gray-300 underline-offset-4">
          * 상기 시세는 VAT 별도 가격이며, 실제 거래 시 차이가 있을 수 있습니다.
        </a>
      </div>
    </div>
  );
}
