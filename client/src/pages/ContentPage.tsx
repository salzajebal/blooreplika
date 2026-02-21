import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getProxiedImageUrl } from "@/lib/imageProxy";

const sectionConfig: Record<string, { title: string; breadcrumb: string }> = {
  best: { title: "베스트", breadcrumb: "베스트" },
  live: { title: "라이브", breadcrumb: "라이브" },
  monthly_benefit: { title: "이달의 혜택", breadcrumb: "이달의 혜택" },
};

const sideMenuItems = [
  { name: "공지사항", path: "/notices" },
  { name: "FAQ", path: "/faq" },
  { name: "칼럼", path: "/comparison" },
  { name: "이벤트", path: "/events" },
  { name: "사용후기", path: "/reviews" },
];

function ProductCard({ product }: { product: any }) {
  return (
    <Link
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
      <div className="p-3">
        <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed mb-1">{product.name}</p>
        <div className="flex items-center gap-2">
          {product.discountPercent > 0 && (
            <span className="text-xs text-red-500 font-bold">{product.discountPercent}%</span>
          )}
          <span className="text-sm font-bold text-gray-900">{product.price?.toLocaleString()}원</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">{product.originalPrice?.toLocaleString()}</span>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function ContentPage({ sectionType }: { sectionType: string }) {
  const [location] = useLocation();
  const config = sectionConfig[sectionType] || { title: sectionType, breadcrumb: sectionType };

  const { data: items = [] } = useQuery({
    queryKey: ['/api/content-sections', sectionType],
    queryFn: async () => {
      const res = await fetch(`/api/content-sections?sectionType=${sectionType}`);
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
            <h1 className="text-lg font-bold text-gray-800">{config.title}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-black">홈</Link>
              <span>&gt;</span>
              <span>쇼핑몰</span>
              <span>&gt;</span>
              <span>{config.breadcrumb}</span>
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
              {items.length === 0 ? (
                <div className="text-center py-16 text-gray-400">
                  <p className="text-lg mb-2">등록된 콘텐츠가 없습니다.</p>
                  <p className="text-sm">관리자가 콘텐츠를 등록하면 여기에 표시됩니다.</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {items.map((item: any) => (
                    <div key={item.id} data-testid={`content-section-${item.id}`}>
                      {item.imageUrl && (
                        <a
                          href={item.linkUrl || "#"}
                          target={item.linkUrl ? "_blank" : undefined}
                          rel="noopener noreferrer"
                          className="block mb-4"
                        >
                          <div className="aspect-[21/9] bg-gray-100 overflow-hidden rounded-lg">
                            <img
                              src={getProxiedImageUrl(item.imageUrl)}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                            />
                          </div>
                        </a>
                      )}
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                      {item.description && (
                        <p className="text-sm text-gray-500 mb-4">{item.description}</p>
                      )}
                      {item.products && item.products.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {item.products.map((product: any) => (
                            <ProductCard key={product.id} product={product} />
                          ))}
                        </div>
                      )}
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
