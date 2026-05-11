import { Home, Menu, ShoppingBag, Eye, User } from "lucide-react";
import { Link, useLocation } from "wouter";

const navItems = [
  { label: "HOME", path: "/", icon: Home },
  { label: "메뉴", path: "/products", icon: Menu },
  { label: "SHOP", path: "/products", icon: ShoppingBag },
  { label: "최근 본 상품", path: "/cart", icon: Eye },
  { label: "마이페이지", path: "/profile", icon: User },
];

export function BottomNav() {
  const [location] = useLocation();

  const isActive = (path: string, label: string) => {
    if (label === "HOME") return location === "/";
    if (label === "SHOP" || label === "메뉴") return location.startsWith("/products");
    return location === path || location.startsWith(path + "/");
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} data-testid="bottom-nav">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const active = isActive(item.path, item.label);
          const IconComponent = item.icon;
          return (
            <Link
              key={item.label}
              href={item.path}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-xs ${active ? 'text-black font-semibold' : 'text-gray-400'}`}
              data-testid={`bottom-nav-${item.label}`}
            >
              <IconComponent className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
