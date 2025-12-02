import { useState, useEffect } from "react";
import { X, MessageCircle, Headphones, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const POPUP_STORAGE_KEY = "home_popup_dismissed_until";

export function HomePopup() {
  const [isOpen, setIsOpen] = useState(false);
  const [dontShowFor24h, setDontShowFor24h] = useState(false);

  useEffect(() => {
    const dismissedUntil = localStorage.getItem(POPUP_STORAGE_KEY);
    if (dismissedUntil) {
      const dismissedTime = parseInt(dismissedUntil);
      if (Date.now() < dismissedTime) {
        return;
      }
    }
    const timer = setTimeout(() => setIsOpen(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    if (dontShowFor24h) {
      const until = Date.now() + 24 * 60 * 60 * 1000;
      localStorage.setItem(POPUP_STORAGE_KEY, until.toString());
    }
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="relative bg-gradient-to-b from-purple-50 via-white to-purple-50 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-300"
        data-testid="home-popup"
      >
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400"></div>
        
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 transition-colors z-10"
          data-testid="button-close-popup"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8 text-center">
          <div className="mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-purple-800 leading-tight mb-2">
              인력부족으로
            </h2>
            <h2 className="text-xl md:text-2xl font-bold text-purple-800 leading-tight">
              2주간 <span className="text-pink-600">실시간채팅</span> 상담만 가능합니다
            </h2>
          </div>

          <div className="relative my-8">
            <div className="flex justify-center items-end gap-4">
              <div className="relative">
                <div className="w-32 h-44 bg-gradient-to-b from-gray-800 to-gray-900 rounded-2xl shadow-xl flex items-center justify-center overflow-hidden border-4 border-gray-700">
                  <div className="absolute top-2 w-16 h-1 bg-gray-600 rounded-full"></div>
                  <div className="text-white text-2xl font-mono">12:31</div>
                </div>
                
                <div className="absolute -left-4 -top-4 w-24 h-28">
                  <div className="relative">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full mx-auto flex items-center justify-center shadow-lg">
                      <Headphones className="w-8 h-8 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center">
                      <MessageCircle className="w-3 h-3 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded-full flex items-center justify-center shadow-lg border-2 border-amber-300">
                  <span className="text-3xl">🤔</span>
                </div>
                <div className="absolute -top-2 right-0 bg-white rounded-lg px-2 py-1 shadow-md border border-gray-200">
                  <span className="text-lg">❓</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center gap-2 text-purple-700 font-medium">
              <Clock className="w-5 h-5" />
              <span>상담시간: 평일 09:00 ~ 18:00</span>
            </div>
            <p className="text-sm text-purple-600 mt-1">
              카카오톡 실시간 채팅으로 문의해주세요
            </p>
          </div>

          <Button
            onClick={handleClose}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-6 rounded-xl shadow-lg transition-all hover:shadow-xl"
            data-testid="button-confirm-popup"
          >
            확인했습니다
          </Button>
        </div>

        <div className="bg-gray-100 px-6 py-4 flex items-center justify-between border-t border-gray-200">
          <div className="flex items-center gap-2">
            <Checkbox
              id="dontShow24h"
              checked={dontShowFor24h}
              onCheckedChange={(checked) => setDontShowFor24h(checked as boolean)}
              data-testid="checkbox-dont-show-24h"
            />
            <label 
              htmlFor="dontShow24h" 
              className="text-sm text-gray-600 cursor-pointer"
            >
              24시간 동안 다시 열람하지 않습니다.
            </label>
          </div>
          <button
            onClick={handleClose}
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            data-testid="button-close-text"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
