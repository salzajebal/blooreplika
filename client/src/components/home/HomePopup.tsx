import { useState, useEffect } from "react";
import { X, MessageCircle, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const POPUP_STORAGE_KEY = "home_popup_dismissed_until";

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.15.53-.5 1.92-.57 2.22-.1.38.14.38.29.27.12-.08 1.85-1.22 2.6-1.72.72.11 1.47.17 2.18.17 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
    </svg>
  );
}

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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative bg-white rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden animate-in zoom-in-95 duration-300"
        data-testid="home-popup"
      >
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600"></div>
        <div className="absolute top-0 left-0 right-0 h-32 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30"></div>
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 transition-colors z-10"
          data-testid="button-close-popup"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="relative pt-6 pb-2 px-6 text-center">
          <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-full px-4 py-1.5 shadow-lg mb-4">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-bold text-amber-700">공지사항</span>
          </div>
        </div>

        <div className="relative px-8 pt-4 pb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl shadow-xl flex items-center justify-center transform rotate-3 hover:rotate-0 transition-transform">
            <MessageCircle className="w-10 h-10 text-white" />
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">
            안내 말씀드립니다
          </h2>
          
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 mb-6 border border-amber-100">
            <p className="text-gray-700 leading-relaxed">
              <span className="font-semibold text-amber-700">인력 부족</span>으로 인해<br/>
              <span className="text-lg font-bold text-gray-900">2주간 실시간 채팅 상담</span>만<br/>
              가능한 점 양해 부탁드립니다.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="flex items-center gap-2 bg-yellow-400 text-gray-900 px-4 py-2.5 rounded-xl font-semibold shadow-md">
              <KakaoIcon className="w-5 h-5" />
              <span>카카오톡 문의</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-4">
            <Clock className="w-4 h-4" />
            <span>상담시간 평일 09:00 ~ 18:00</span>
          </div>

          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-gray-800 to-gray-900 hover:from-gray-900 hover:to-black text-white font-semibold py-6 rounded-xl shadow-lg transition-all hover:shadow-xl text-base"
            data-testid="button-confirm-popup"
          >
            확인
          </Button>
        </div>

        <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dontShow24h"
              checked={dontShowFor24h}
              onCheckedChange={(checked) => setDontShowFor24h(checked as boolean)}
              className="border-gray-300"
              data-testid="checkbox-dont-show-24h"
            />
            <label 
              htmlFor="dontShow24h" 
              className="text-sm text-gray-500 cursor-pointer select-none"
            >
              24시간 동안 다시 열람하지 않습니다.
            </label>
          </div>
          <button
            onClick={handleClose}
            className="text-sm text-gray-400 hover:text-gray-600 font-medium transition-colors"
            data-testid="button-close-text"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
