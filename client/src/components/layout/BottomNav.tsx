import { Home, ShoppingBag, TrendingUp, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";

export function BottomNav() {
  const [location] = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

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
    { label: "마이", path: isLoggedIn ? "/profile" : "/login", icon: User },
  ];

  const isActive = (path: string, label: string) => {
    if (label === "홈") return location === "/";
    if (label === "SHOP") return location.startsWith("/products") || location.startsWith("/search");
    if (label === "마이") return location === "/profile" || location === "/login";
    return location === path || location.startsWith(path + "/");
  };

  return (
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
      </div>
    </nav>
  );
}
