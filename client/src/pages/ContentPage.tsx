import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState } from "react";

const sectionConfig: Record<string, { title: string; breadcrumb: string; heroTitle?: string; heroSubtitle?: string }> = {
  best: { title: "베스트", breadcrumb: "베스트" },
  live: { title: "라이브", breadcrumb: "라이브" },
  monthly_benefit: {
    title: "이달의 혜택",
    breadcrumb: "이달의 혜택",
    heroTitle: "2월 혜택 모음",
    heroSubtitle: "혜택 가볍게 얹고 설레는 새 출발 준비",
  },
};

function ProductCard({ product }: { product: any }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="block group"
      data-testid={`product-card-${product.id}`}
    >
      <div className="aspect-square bg-gray-50 overflow-hidden mb-2">
        <img
          src={getProxiedImageUrl(product.imageUrl || "")}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
        />
      </div>
      <div className="px-1">
        <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed mb-1">{product.name}</p>
        <div className="flex items-center gap-2">
          {product.discountPercent > 0 && (
            <span className="text-xs text-red-500 font-bold">{product.discountPercent}%</span>
          )}
          <span className="text-sm font-bold text-gray-900">{Number(product.price).toLocaleString()}원</span>
        </div>
        {product.originalPrice && product.originalPrice > product.price && (
          <span className="text-[11px] text-gray-400 line-through">{Number(product.originalPrice).toLocaleString()}원</span>
        )}
      </div>
    </Link>
  );
}

export default function ContentPage({ sectionType }: { sectionType: string }) {
  const config = sectionConfig[sectionType] || { title: sectionType, breadcrumb: sectionType };
  const [activeTab, setActiveTab] = useState(0);

  const { data: items = [] } = useQuery({
    queryKey: ['/api/content-sections', sectionType],
    queryFn: async () => {
      const res = await fetch(`/api/content-sections?sectionType=${sectionType}`);
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const { data: heroSettings } = useQuery({
    queryKey: ['/api/settings', `benefit_hero`],
    queryFn: async () => {
      const res = await fetch(`/api/settings/benefit_hero`);
      const data = await res.json();
      return data.success ? data.data : null;
    },
    enabled: sectionType === "monthly_benefit",
  });

  const heroImageUrl = heroSettings?.value || "";
  const activeItem = items[activeTab];

  if (sectionType === "monthly_benefit") {
    return (
      <div className="min-h-screen bg-white">
        <Header />

        <main>
          <div className="relative w-full bg-gradient-to-b from-gray-900 to-gray-800 overflow-hidden">
            {heroImageUrl && heroImageUrl.trim() ? (
              <div className="relative">
                <img
                  src={heroImageUrl}
                  alt={config.heroTitle || config.title}
                  className="w-full object-cover"
                  data-testid="benefit-hero-image"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    const fallback = (e.target as HTMLImageElement).parentElement?.querySelector('.hero-fallback');
                    if (fallback) (fallback as HTMLElement).style.display = 'flex';
                  }}
                />
                <div className="hero-fallback w-full aspect-[16/9] md:aspect-[2.4/1] items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600 hidden">
                  <div className="text-center text-white p-8">
                    <h1 className="text-3xl md:text-5xl font-bold mb-3">{config.heroTitle || config.title}</h1>
                    <p className="text-sm md:text-lg text-white/80">{config.heroSubtitle || ""}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-[16/9] md:aspect-[2.4/1] flex items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-pink-600">
                <div className="text-center text-white p-8">
                  <h1 className="text-3xl md:text-5xl font-bold mb-3" data-testid="benefit-hero-title">
                    {config.heroTitle || config.title}
                  </h1>
                  <p className="text-sm md:text-lg text-white/80" data-testid="benefit-hero-subtitle">
                    {config.heroSubtitle || ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {items.length > 0 && (
            <div className="border-b border-gray-200 bg-white sticky top-0 z-20">
              <div className="max-w-[1200px] mx-auto">
                <div className="grid" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 4)}, 1fr)` }}>
                  {items.map((item: any, index: number) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(index)}
                      className={`py-3 md:py-4 text-xs md:text-sm font-medium text-center transition-all border-b-2 ${
                        index === activeTab
                          ? "border-black text-black bg-white"
                          : "border-transparent text-gray-500 hover:text-gray-700 bg-gray-50 hover:bg-gray-100"
                      }`}
                      data-testid={`benefit-tab-${index}`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeItem ? (
            <div className="animate-in fade-in duration-300" data-testid={`benefit-content-${activeItem.id}`}>
              {activeItem.imageUrl && (
                <div className="w-full">
                  <a
                    href={activeItem.linkUrl || "#"}
                    target={activeItem.linkUrl ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <img
                      src={activeItem.imageUrl}
                      alt={activeItem.title}
                      className="w-full object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  </a>
                </div>
              )}

              {activeItem.description && (
                <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
                  <div className="text-center">
                    <p className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">{activeItem.description}</p>
                  </div>
                </div>
              )}

              {activeItem.products && activeItem.products.length > 0 && (
                <div className="max-w-[1200px] mx-auto px-4 pb-10 md:pb-16">
                  <div className="text-center mb-6 md:mb-8">
                    <p className="text-xs text-pink-500 uppercase tracking-widest font-medium mb-1">BENEFIT</p>
                    <h2 className="text-lg md:text-2xl font-bold text-gray-900">
                      라이크잇의 특별한 혜택
                    </h2>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                    {activeItem.products.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg mb-2">등록된 혜택이 없습니다.</p>
              <p className="text-sm">관리자가 혜택 콘텐츠를 등록하면 여기에 표시됩니다.</p>
            </div>
          ) : null}
        </main>

        <Footer />
      </div>
    );
  }

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
      </main>

      <Footer />
    </div>
  );
}
