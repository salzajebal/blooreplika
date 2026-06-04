import { Home, ShoppingBag, MessageSquare, User, Camera, X, LogIn, Search } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";

export function BottomNav() {
  const [location, setLocation] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showGuestMenu, setShowGuestMenu] = useState(false);

  useEffect(() => {
    const check = () => setIsLoggedIn(!!localStorage.getItem("memberToken"));
    check();
    window.addEventListener("storage", check);
    const iv = setInterval(check, 1000);
    return () => { window.removeEventListener("storage", check); clearInterval(iv); };
  }, []);

  const isMyActive = location === "/profile" || location === "/login" || location === "/orders";

  return (
    <>
      {/* 비로그인 마이 메뉴 시트 */}
      {showGuestMenu && (
        <div className="md:hidden fixed inset-0 z-[60]" onClick={() => setShowGuestMenu(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[640px] bg-white rounded-t-2xl px-5 pt-5 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#111111]">마이</h3>
              <button onClick={() => setShowGuestMenu(false)}>
                <X className="w-5 h-5 text-[#999]" />
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => { setShowGuestMenu(false); setLocation("/login"); }}
                className="w-full flex items-center gap-3 bg-[#FF6100] text-white rounded-xl px-4 py-4 font-semibold"
                data-testid="guest-menu-login"
              >
                <LogIn className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-semibold text-sm">로그인 / 회원가입</p>
                  <p className="text-xs text-white/80 font-normal mt-0.5">회원이면 주문 내역을 바로 확인할 수 있어요</p>
                </div>
              </button>
              <button
                onClick={() => { setShowGuestMenu(false); setLocation("/orders"); }}
                className="w-full flex items-center gap-3 bg-[#f5f5f5] text-[#111111] rounded-xl px-4 py-4"
                data-testid="guest-menu-order-inquiry"
              >
                <Search className="w-5 h-5 text-[#FF6100]" />
                <div className="text-left">
                  <p className="font-semibold text-sm">주문 조회 (비회원)</p>
                  <p className="text-xs text-[#666666] font-normal mt-0.5">주문번호 + 연락처로 주문 현황을 확인해요</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        data-testid="bottom-nav"
      >
        <div className="flex items-stretch justify-around">

          {/* 퀄리티 체크● */}
          <Link
            href="/inspection"
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] transition-colors touch-manipulation ${
              location === "/inspection" ? "text-[#FF6100]" : "text-gray-500"
            }`}
            data-testid="bottom-nav-inspection"
          >
            <div className="relative">
              <Camera className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
            </div>
            <span className="text-[10px] font-medium leading-tight text-center">퀄리티 체크</span>
          </Link>

          {/* 마이페이지 */}
          {isLoggedIn ? (
            <Link
              href="/profile"
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] transition-colors touch-manipulation ${
                isMyActive ? "text-[#FF6100]" : "text-gray-500"
              }`}
              data-testid="bottom-nav-profile"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">마이페이지</span>
            </Link>
          ) : (
            <button
              onClick={() => setShowGuestMenu(true)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] transition-colors touch-manipulation ${
                isMyActive ? "text-[#FF6100]" : "text-gray-500"
              }`}
              data-testid="bottom-nav-profile"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium leading-tight">마이페이지</span>
            </button>
          )}

          {/* HOME */}
          <Link
            href="/"
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] transition-colors touch-manipulation ${
              location === "/" ? "text-[#FF6100]" : "text-gray-500"
            }`}
            data-testid="bottom-nav-home"
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">HOME</span>
          </Link>

          {/* 상담하기 */}
          <button
            onClick={() => { (window as any).ChannelIO?.('showMessenger'); }}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] text-gray-500 transition-colors touch-manipulation"
            data-testid="bottom-nav-support"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">상담하기</span>
          </button>

          {/* 장바구니 */}
          <Link
            href="/cart"
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[52px] transition-colors touch-manipulation ${
              location === "/cart" ? "text-[#FF6100]" : "text-gray-500"
            }`}
            data-testid="bottom-nav-cart"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-tight">장바구니</span>
          </Link>

        </div>
      </nav>
    </>
  );
}
