import { Header } from "@/components/layout/Header";
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
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      <main>
        <div className="bg-white border-b border-[#e8e8e8] py-4">
          <div className="max-w-[640px] mx-auto px-4">
            <h1 className="text-base font-bold text-[#111111]">기획전</h1>
            <div className="flex items-center gap-2 text-xs text-[#999999] mt-1">
              <Link href="/" className="hover:text-[#FF6100]">홈</Link>
              <span>&gt;</span>
              <span>고객센터</span>
              <span>&gt;</span>
              <span>기획전</span>
            </div>
          </div>
        </div>

        <div className="max-w-[640px] mx-auto px-4 py-5">
          <div className="flex gap-5">
            <aside className="hidden md:block w-40 flex-shrink-0">
              <nav className="border border-[#e8e8e8] rounded-xl overflow-hidden bg-white">
                {sideMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className={`block px-4 py-3 text-sm border-b border-[#e8e8e8] last:border-b-0 ${
                      location === item.path
                        ? 'bg-[#FF6100] text-white font-medium'
                        : 'text-[#666666] hover:bg-[#f8f8f8] hover:text-[#111111]'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0 pb-20 md:pb-8">
              <div className="mb-4">
                <p className="text-sm text-[#999999]">
                  Total : <strong className="text-[#FF6100]">{items.length}</strong> items
                </p>
              </div>

              {items.length === 0 ? (
                <div className="text-center py-16 text-[#999999]">
                  <p className="text-base mb-2">등록된 기획전이 없습니다.</p>
                  <p className="text-sm text-[#cccccc]">관리자가 기획전을 등록하면 여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {items.map((item: any) => (
                    <div key={item.id} data-testid={`event-item-${item.id}`} className="border border-[#e8e8e8] rounded-xl overflow-hidden bg-white shadow-sm">
                      {item.imageUrl && (
                        <a href={item.linkUrl || "#"} target={item.linkUrl ? "_blank" : undefined} rel="noopener noreferrer" className="block">
                          <div className="aspect-[16/9] bg-[#f5f5f5] overflow-hidden">
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
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-600">진행중</span>
                        </div>
                        <h3 className="font-medium text-[#111111] text-sm mb-2">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-[#666666] mb-4">{item.description}</p>
                        )}
                        {item.products && item.products.length > 0 && (
                          <div className="grid grid-cols-2 gap-2.5 mt-4 pt-4 border-t border-[#e8e8e8]">
                            {item.products.map((product: any) => (
                              <Link
                                key={product.id}
                                href={`/product/${product.id}`}
                                className="block border border-[#e8e8e8] hover:border-[#FF6100] transition-colors bg-white rounded-lg overflow-hidden"
                                data-testid={`product-card-${product.id}`}
                              >
                                <div className="aspect-square bg-[#f5f5f5] overflow-hidden">
                                  <img
                                    src={getProxiedImageUrl(product.imageUrl || "")}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                                  />
                                </div>
                                <div className="p-2">
                                  <p className="text-xs text-[#666666] line-clamp-2 mb-0.5">{product.name}</p>
                                  <p className="text-sm font-bold text-[#111111]">{product.price?.toLocaleString()}원</p>
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


    </div>
  );
}
