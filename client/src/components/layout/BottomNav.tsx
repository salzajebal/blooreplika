import { Home, ShoppingBag, TrendingUp, MessageSquare, User, X, LogIn, Search } from "lucide-react";
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

  const navItems = [
    { label: "홈", path: "/", icon: Home },
    { label: "SHOP", path: "/products", icon: ShoppingBag },
    { label: "랭킹", path: "/ranking", icon: TrendingUp },
    { label: "리뷰", path: "/reviews", icon: MessageSquare },
  ];

  const isActive = (path: string, label: string) => {
    if (label === "홈") return location === "/";
    if (label === "SHOP") return location.startsWith("/products") || location.startsWith("/search");
    return location === path || location.startsWith(path + "/");
  };

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
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 max-w-[640px] mx-auto"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          left: "50%",
          transform: "translateX(-50%)",
          width: "100%",
        }}
        data-testid="bottom-nav"
      >
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const active = isActive(item.path, item.label);
            const IconComponent = item.icon;
            return (
              <Link
                key={item.label}
                href={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-2.5 min-h-[52px] min-w-[52px] transition-colors touch-manipulation ${
                  active ? "text-[#FF6100]" : "text-gray-400"
                }`}
                data-testid={`bottom-nav-${item.label}`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* 마이 버튼 — 로그인 여부에 따라 다르게 */}
          {isLoggedIn ? (
            <Link
              href="/profile"
              className={`flex flex-col items-center gap-0.5 px-3 py-2.5 min-h-[52px] min-w-[52px] transition-colors touch-manipulation ${
                isMyActive ? "text-[#FF6100]" : "text-gray-400"
              }`}
              data-testid="bottom-nav-마이"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">마이</span>
            </Link>
          ) : (
            <button
              onClick={() => setShowGuestMenu(true)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2.5 min-h-[52px] min-w-[52px] transition-colors touch-manipulation ${
                isMyActive ? "text-[#FF6100]" : "text-gray-400"
              }`}
              data-testid="bottom-nav-마이"
            >
              <User className="w-5 h-5" />
              <span className="text-[10px] font-medium">마이</span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}
