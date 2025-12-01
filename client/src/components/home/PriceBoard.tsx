import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { PRICE_DATA } from "@/lib/mockData";

export function PriceBoard() {
  return (
    <div className="bg-white shadow-lg border border-gray-100 p-0 overflow-hidden">
      <div className="bg-gray-900 text-white p-4 flex justify-between items-center">
        <h3 className="font-bold text-lg flex items-center gap-2">
          <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
          실시간 시세정보
        </h3>
        <span className="text-xs text-gray-400">2025.12.01 14:30 기준</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
        {/* Gold */}
        <div className="p-6 text-center group hover:bg-gray-50 transition-colors">
          <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Gold / 3.75g</div>
          <div className="text-2xl font-bold text-gray-900 mb-4">순금</div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-sm text-gray-500">살 때</span>
              <span className="font-bold text-red-600 text-lg">{PRICE_DATA.gold.buy}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">팔 때</span>
              <span className="font-bold text-blue-600 text-lg">{PRICE_DATA.gold.sell}원</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center items-center gap-1 text-red-500 text-sm font-medium">
            <ArrowUp className="w-4 h-4" />
            {PRICE_DATA.gold.change}원
          </div>
        </div>

        {/* Silver */}
        <div className="p-6 text-center group hover:bg-gray-50 transition-colors">
          <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Silver / 3.75g</div>
          <div className="text-2xl font-bold text-gray-900 mb-4">실버</div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-sm text-gray-500">살 때</span>
              <span className="font-bold text-red-600 text-lg">{PRICE_DATA.silver.buy}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">팔 때</span>
              <span className="font-bold text-blue-600 text-lg">{PRICE_DATA.silver.sell}원</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center items-center gap-1 text-blue-500 text-sm font-medium">
            <ArrowDown className="w-4 h-4" />
            {PRICE_DATA.silver.change}원
          </div>
        </div>

        {/* Platinum */}
        <div className="p-6 text-center group hover:bg-gray-50 transition-colors">
          <div className="text-sm text-gray-500 mb-1 uppercase tracking-wider">Platinum / 3.75g</div>
          <div className="text-2xl font-bold text-gray-900 mb-4">백금</div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-2">
              <span className="text-sm text-gray-500">살 때</span>
              <span className="font-bold text-red-600 text-lg">{PRICE_DATA.platinum.buy}원</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">팔 때</span>
              <span className="font-bold text-blue-600 text-lg">{PRICE_DATA.platinum.sell}원</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-center items-center gap-1 text-gray-500 text-sm font-medium">
            <Minus className="w-4 h-4" />
            {PRICE_DATA.platinum.change}원
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 px-4 py-3 text-center border-t border-gray-100">
        <a href="#" className="text-xs text-gray-500 hover:text-primary underline decoration-gray-300 underline-offset-4">
          전체 시세 보기 &gt;
        </a>
      </div>
    </div>
  );
}
