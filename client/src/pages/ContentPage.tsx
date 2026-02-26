import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef } from "react";

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

interface ContentBlock {
  type: "banner" | "text" | "buttons" | "coupon" | "divider";
  imageUrl?: string;
  linkUrl?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  bgColor?: string;
  buttons?: { label: string; linkUrl?: string; style?: "filled" | "outline" }[];
  coupons?: { label: string; value: string }[];
}

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

function ScrollRevealWrapper({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className="transition-all duration-700 ease-out"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(30px)",
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

function BannerBlock({ block }: { block: ContentBlock }) {
  const content = (
    <div className="w-full overflow-hidden rounded-lg">
      <img
        src={block.imageUrl || ""}
        alt=""
        className="w-full object-cover hover:scale-[1.02] transition-transform duration-500"
        data-testid="content-block-banner"
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    </div>
  );

  if (block.linkUrl) {
    return (
      <a href={block.linkUrl} target="_blank" rel="noopener noreferrer" className="block">
        {content}
      </a>
    );
  }
  return content;
}

function TextBlock({ block }: { block: ContentBlock }) {
  return (
    <div
      className="w-full py-10 md:py-16 px-4"
      style={{ backgroundColor: block.bgColor || "#f8f8f8" }}
      data-testid="content-block-text"
    >
      <div className="max-w-[800px] mx-auto text-center">
        {block.subheading && (
          <p className="text-xs uppercase tracking-[0.2em] text-gray-500 mb-3 font-medium">
            {block.subheading}
          </p>
        )}
        {block.heading && (
          <h2
            className="text-xl md:text-3xl font-bold text-gray-900 mb-4 leading-snug"
            style={{ fontFamily: "'Playfair Display', 'Noto Serif KR', serif" }}
          >
            {block.heading}
          </h2>
        )}
        {block.body && (
          <p className="text-sm md:text-base text-gray-600 leading-relaxed whitespace-pre-line">
            {block.body}
          </p>
        )}
      </div>
    </div>
  );
}

function ButtonsBlock({ block }: { block: ContentBlock }) {
  if (!block.buttons || block.buttons.length === 0) return null;
  return (
    <div className="w-full py-6 px-4" data-testid="content-block-buttons">
      <div className="max-w-[600px] mx-auto flex flex-wrap items-center justify-center gap-3">
        {block.buttons.map((btn, i) => {
          const isOutline = btn.style === "outline";
          const className = isOutline
            ? "px-6 py-2.5 rounded-full border-2 border-gray-900 text-gray-900 text-sm font-semibold hover:bg-gray-900 hover:text-white transition-all duration-300"
            : "px-6 py-2.5 rounded-full bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg";

          if (btn.linkUrl) {
            return (
              <a
                key={i}
                href={btn.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
                data-testid={`content-block-button-${i}`}
              >
                {btn.label}
              </a>
            );
          }
          return (
            <span key={i} className={className} data-testid={`content-block-button-${i}`}>
              {btn.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function CouponBlock({ block }: { block: ContentBlock }) {
  if (!block.coupons || block.coupons.length === 0) return null;
  return (
    <div className="w-full py-6 px-4" data-testid="content-block-coupon">
      <div className="max-w-[600px] mx-auto flex flex-wrap items-center justify-center gap-3">
        {block.coupons.map((coupon, i) => (
          <div
            key={i}
            className="inline-flex items-center gap-2 px-5 py-2.5 border-2 border-dashed border-gray-400 rounded-full bg-white hover:border-gray-900 hover:shadow-md transition-all duration-300 cursor-default"
            data-testid={`content-block-coupon-${i}`}
          >
            <span className="text-sm font-bold text-gray-900">{coupon.value}</span>
            {coupon.label && (
              <span className="text-xs text-gray-500">{coupon.label}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DividerBlock() {
  return (
    <div className="w-full py-4 px-4" data-testid="content-block-divider">
      <div className="max-w-[800px] mx-auto">
        <hr className="border-gray-200" />
      </div>
    </div>
  );
}

function ContentBlockRenderer({ block, index }: { block: ContentBlock; index: number }) {
  const delay = index * 100;

  switch (block.type) {
    case "banner":
      return (
        <ScrollRevealWrapper delay={delay}>
          <BannerBlock block={block} />
        </ScrollRevealWrapper>
      );
    case "text":
      return (
        <ScrollRevealWrapper delay={delay}>
          <TextBlock block={block} />
        </ScrollRevealWrapper>
      );
    case "buttons":
      return (
        <ScrollRevealWrapper delay={delay}>
          <ButtonsBlock block={block} />
        </ScrollRevealWrapper>
      );
    case "coupon":
      return (
        <ScrollRevealWrapper delay={delay}>
          <CouponBlock block={block} />
        </ScrollRevealWrapper>
      );
    case "divider":
      return (
        <ScrollRevealWrapper delay={delay}>
          <DividerBlock />
        </ScrollRevealWrapper>
      );
    default:
      return null;
  }
}

function ProductCard({ product }: { product: any }) {
  return (
    <Link
      href={`/product/${product.id}`}
      className="block group"
      data-testid={`product-card-${product.id}`}
    >
      <div className="aspect-square bg-gray-50 overflow-hidden mb-2 rounded-lg">
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
          <span className="text-sm font-bold text-gray-900">{Number(product.price).toLocaleString()}원</span>
        </div>
      </div>
    </Link>
  );
}

function parseContentBlocks(raw: string | null | undefined): ContentBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function ContentPage({ sectionType }: { sectionType: string }) {
  const config = sectionConfig[sectionType] || { title: sectionType, breadcrumb: sectionType };
  const [activeTab, setActiveTab] = useState(0);
  const [tabKey, setTabKey] = useState(0);

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

  const handleTabSwitch = (index: number) => {
    setActiveTab(index);
    setTabKey((k) => k + 1);
  };

  if (sectionType === "monthly_benefit") {
    const contentBlocks = activeItem ? parseContentBlocks(activeItem.contentBlocks) : [];

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
              <div className="max-w-[1200px] mx-auto px-2 md:px-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-0">
                  {items.map((item: any, index: number) => (
                    <button
                      key={item.id}
                      onClick={() => handleTabSwitch(index)}
                      className={`relative py-3.5 md:py-4 text-xs md:text-sm text-center transition-all duration-300 ${
                        index === activeTab
                          ? "font-bold text-gray-900 bg-white"
                          : "font-medium text-gray-500 bg-gray-50 hover:text-gray-700 hover:bg-gray-100"
                      }`}
                      data-testid={`benefit-tab-${index}`}
                    >
                      {item.title}
                      {index === activeTab && (
                        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-black" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeItem ? (
            <div
              key={tabKey}
              className="benefit-tab-content"
              data-testid={`benefit-content-${activeItem.id}`}
              style={{ animation: "benefitFadeIn 0.4s ease-out" }}
            >
              {contentBlocks.length > 0 ? (
                <div className="content-blocks-container">
                  {contentBlocks.map((block, index) => (
                    <ContentBlockRenderer key={`${tabKey}-${index}`} block={block} index={index} />
                  ))}
                </div>
              ) : (
                <>
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
                </>
              )}

              {activeItem.products && activeItem.products.length > 0 && (
                <div className="max-w-[1200px] mx-auto px-4 pb-10 md:pb-16">
                  <ScrollRevealWrapper>
                    <div className="text-center mb-6 md:mb-8 pt-8">
                      <p className="text-xs text-pink-500 uppercase tracking-widest font-medium mb-1">BENEFIT</p>
                      <h2
                        className="text-lg md:text-2xl font-bold text-gray-900"
                        style={{ fontFamily: "'Playfair Display', 'Noto Serif KR', serif" }}
                      >
                        라이크잇의 특별한 혜택
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                      {activeItem.products.map((product: any) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </ScrollRevealWrapper>
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

        <style>{`
          @keyframes benefitFadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>
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
