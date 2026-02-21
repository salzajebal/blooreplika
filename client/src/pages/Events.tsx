import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getProxiedImageUrl } from "@/lib/imageProxy";

const sideMenuItems = [
  { name: "공지사항", path: "/notices" },
  { name: "FAQ", path: "/faq" },
  { name: "칼럼", path: "/comparison" },
  { name: "이벤트", path: "/events" },
  { name: "사용후기", path: "/reviews" },
];

export default function Events() {
  const [location] = useLocation();

  const { data: items = [] } = useQuery({
    queryKey: ['/api/content-sections', 'exhibition'],
    queryFn: async () => {
      const res = await fetch('/api/content-sections?sectionType=exhibition');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <div className="bg-gray-100 py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-gray-800">기획전</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-black">홈</Link>
              <span>&gt;</span>
              <span>고객센터</span>
              <span>&gt;</span>
              <span>기획전</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex gap-8">
            <aside className="hidden md:block w-48 flex-shrink-0">
              <nav className="border border-gray-200">
                {sideMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className={`block px-4 py-3 text-sm border-b border-gray-200 last:border-b-0 ${
                      location === item.path 
                        ? 'bg-gray-900 text-white font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="flex-1">
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Total : <strong>{items.length}</strong> items
                </p>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-lg mb-2">등록된 기획전이 없습니다.</p>
                  <p className="text-sm">관리자가 기획전을 등록하면 여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {items.map((item: any) => (
                    <div key={item.id} data-testid={`event-item-${item.id}`} className="border border-gray-200 rounded-lg overflow-hidden">
                      {item.imageUrl && (
                        <a
                          href={item.linkUrl || "#"}
                          target={item.linkUrl ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                            <img
                              src={getProxiedImageUrl(item.imageUrl || "")}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                            />
                          </div>
                        </a>
                      )}
                      <div className="p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-700">진행중</span>
                        </div>
                        <h3 className="font-medium text-gray-900 mb-2">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-500 mb-4">{item.description}</p>
                        )}
                        {item.products && item.products.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-100">
                            {item.products.map((product: any) => (
                              <Link
                                key={product.id}
                                href={`/product/${product.id}`}
                                className="block border border-gray-200 hover:border-gray-400 transition-colors"
                                data-testid={`product-card-${product.id}`}
                              >
                                <div className="aspect-square bg-gray-100 overflow-hidden">
                                  <img
                                    src={getProxiedImageUrl(product.imageUrl || "")}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                                  />
                                </div>
                                <div className="p-2">
                                  <p className="text-xs text-gray-800 line-clamp-2 mb-1">{product.name}</p>
                                  <p className="text-sm font-bold text-gray-900">{product.price?.toLocaleString()}원</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
