import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const POPUP_STORAGE_KEY = "home_popup_dismissed_until";

export function HomePopup() {
  const [dontShowFor24h, setDontShowFor24h] = useState(false);
  const [shouldShow, setShouldShow] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const dismissedUntil = localStorage.getItem(POPUP_STORAGE_KEY);
      if (dismissedUntil) {
        const dismissedTime = parseInt(dismissedUntil, 10);
        if (!isNaN(dismissedTime) && Date.now() < dismissedTime) {
          setShouldShow(false);
          return;
        }
      }
    } catch (e) {
      console.log("localStorage not available");
    }
    
    setShouldShow(true);
  }, []);

  const handleClose = () => {
    if (dontShowFor24h) {
      try {
        const until = Date.now() + 24 * 60 * 60 * 1000;
        localStorage.setItem(POPUP_STORAGE_KEY, until.toString());
      } catch (e) {
        console.log("localStorage not available");
      }
    }
    setShouldShow(false);
  };

  if (shouldShow !== true) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm safe-area-inset">
      <div 
        className="relative bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-[95vw] sm:max-w-sm w-full overflow-hidden"
        data-testid="home-popup"
      >
        <div className="absolute top-0 left-0 right-0 h-24 sm:h-32 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600"></div>
        
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/40 transition-colors z-10 touch-manipulation flex items-center justify-center"
          data-testid="button-close-popup"
          aria-label="닫기"
        >
          <span className="text-white text-xl font-light leading-none">×</span>
        </button>

        <div className="relative pt-4 sm:pt-6 pb-1 sm:pb-2 px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-white/90 backdrop-blur rounded-full px-3 sm:px-4 py-1 sm:py-1.5 shadow-lg mb-3 sm:mb-4">
            <span className="text-amber-500 text-sm">✨</span>
            <span className="text-xs sm:text-sm font-bold text-amber-700">공지사항</span>
          </div>
        </div>

        <div className="relative px-4 sm:px-8 pt-2 sm:pt-4 pb-4 sm:pb-8 text-center">
          <div className="w-14 h-14 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center">
            <span className="text-white text-2xl sm:text-3xl">💬</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
            상담 안내
          </h2>
          
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl sm:rounded-2xl p-3 sm:p-5 mb-3 sm:mb-4 border border-amber-100">
            <p className="text-gray-700 leading-relaxed text-xs sm:text-[15px] break-keep">
              <span className="font-semibold text-amber-700">카카오톡 상담</span> 이용 중<br/>
              간혹 <span className="font-bold text-gray-900">오류가 발생</span>할 수 있습니다.<br/><br/>
              이 경우, 화면 <span className="font-bold text-amber-600">우측 하단</span>에 있는<br/>
              <span className="text-base sm:text-lg font-bold text-gray-900">실시간 채팅 상담</span>을<br/>
              이용해 주시기 바랍니다.
            </p>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4 sm:mb-6 border border-red-200">
            <p className="text-red-700 leading-relaxed text-xs sm:text-[14px] font-medium break-keep">
              <span className="font-bold">📞 전화상담 안내</span><br/>
              <span className="text-red-600">2주간 전화상담이 불가합니다.</span><br/>
              <span className="text-gray-600 text-[11px] sm:text-[13px]">카카오톡 또는 실시간 채팅을 이용해 주세요.</span>
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 bg-gray-100 rounded-lg sm:rounded-xl px-3 sm:px-4 py-2 sm:py-3 mb-4 sm:mb-6">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-black text-xs sm:text-sm">💬</span>
            </div>
            <span className="text-xs sm:text-sm text-gray-600">우측 하단 채팅 버튼을 클릭하세요</span>
          </div>

          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold py-4 sm:py-6 rounded-lg sm:rounded-xl shadow-lg transition-all hover:shadow-xl text-sm sm:text-base touch-manipulation"
            data-testid="button-confirm-popup"
          >
            확인
          </Button>
        </div>

        <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dontShow24h"
              checked={dontShowFor24h}
              onCheckedChange={(checked) => setDontShowFor24h(checked as boolean)}
              className="border-gray-300 w-4 h-4"
              data-testid="checkbox-dont-show-24h"
            />
            <label 
              htmlFor="dontShow24h" 
              className="text-xs sm:text-sm text-gray-500 cursor-pointer select-none"
            >
              24시간 동안 다시 열람하지 않습니다.
            </label>
          </div>
          <button
            onClick={handleClose}
            className="text-xs sm:text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors touch-manipulation"
            data-testid="button-close-text"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
