import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { X, MessageCircle } from "lucide-react";

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div 
        className="relative bg-white rounded-lg shadow-2xl max-w-xs w-full overflow-hidden"
        data-testid="home-popup"
      >
        <div className="bg-black px-4 py-3 flex items-center justify-between">
          <span className="text-white text-sm font-medium tracking-wide">NOTICE</span>
          <button
            onClick={handleClose}
            className="text-white/70 hover:text-white transition-colors"
            data-testid="button-close-popup"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-6 text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-black rounded-full flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>

          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            상담 안내
          </h2>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
            <p className="text-gray-600 text-sm leading-relaxed break-keep">
              <span className="font-medium text-black">카카오톡 상담</span> 이용 중 오류 발생 시,
              화면 <span className="font-medium text-black">우측 하단</span>의 
              <span className="font-medium text-black"> 실시간 채팅</span>을 이용해 주세요.
            </p>
          </div>

          <Button
            onClick={handleClose}
            className="w-full bg-black hover:bg-gray-800 text-white font-medium py-3 rounded-lg text-sm"
            data-testid="button-confirm-popup"
          >
            확인
          </Button>
        </div>

        <div className="bg-gray-50 px-5 py-3 flex items-center justify-between border-t border-gray-100">
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
              className="text-xs text-gray-500 cursor-pointer select-none"
            >
              24시간 동안 보지 않기
            </label>
          </div>
          <button
            onClick={handleClose}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            data-testid="button-close-text"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
