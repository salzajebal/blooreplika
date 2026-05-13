import { Home, ShoppingBag, TrendingUp, MessageSquare, User } from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { label: "홈", path: "/", icon: Home },
  { label: "SHOP", path: "/products", icon: ShoppingBag },
  { label: "랭킹", path: "/ranking", icon: TrendingUp },
  { label: "리뷰", path: "/reviews", icon: MessageSquare },
  { label: "마이", path: "/profile", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string, label: string) => {
    if (label === "홈") return location === "/";
    if (label === "SHOP") return location.startsWith("/products") || location.startsWith("/search");
    return location === path || location.startsWith(path + "/");
  };

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
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
              className={`flex flex-col items-center gap-1 px-3 py-2.5 min-h-[44px] min-w-[44px] transition-colors touch-manipulation ${
                active ? "text-[#FF6100]" : "text-gray-400"
              }`}
              data-testid={`bottom-nav-${item.label}`}
            >
              <IconComponent className="w-6 h-6" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
