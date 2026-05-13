import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Trophy, TrendingUp, Package } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState } from "react";

const AGE_TABS = ["20대", "30대", "40대"] as const;
const GENDER_OPTIONS = ["전체 성별", "남성", "여성"] as const;

const RANKING_CATEGORIES = [
  { id: "age", label: "연령대별", icon: "👥" },
  { id: "popular", label: "많이 산 상품", icon: "📦" },
  { id: "brands", label: "인기 브랜드", icon: "🏷️" },
];

export default function Ranking() {
  const [gender, setGender] = useState<"전체 성별" | "남성" | "여성">("전체 성별");
  const [activeAge, setActiveAge] = useState<"20대" | "30대" | "40대">("20대");
  const [rankingType, setRankingType] = useState<"age" | "popular" | "brands">("age");

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["/api/products/ranking-page", gender, activeAge, rankingType],
    queryFn: async () => {
      let url = "/api/products?limit=20&sort=popular";
      const g = gender === "남성" ? "남성" : gender === "여성" ? "여성" : null;
      if (g) url += `&gender=${encodeURIComponent(g)}`;
      const res = await fetch(url);
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 60000,
  });

  const { data: brandsData } = useQuery({
    queryKey: ["/api/brands/top-ranking"],
    queryFn: async () => {
      const res = await fetch("/api/brands/top?limit=20");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 300000,
  });

  const { data: allBrandsData } = useQuery({
    queryKey: ["/api/brands"],
    queryFn: async () => {
      const res = await fetch("/api/brands?limit=200");
      const data = await res.json();
      return data.success ? data.data : [];
    },
    staleTime: 600000,
  });

  const getBrandName = (brandId: string) => {
    const brand = (allBrandsData || []).find((b: any) => b.id === brandId);
    return brand?.name?.toUpperCase() || "";
  };

  const products: any[] = productsData || [];
  const topBrands: any[] = brandsData || [];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 max-w-[640px] w-full mx-auto pb-24 md:pb-8">
        {/* Page header */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#FF6100]" />
            랭킹
          </h1>
          {/* Gender dropdown */}
          <div className="relative">
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as any)}
              className="text-sm text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-gray-400 appearance-none pr-7 bg-white"
              data-testid="select-gender-filter"
            >
              {GENDER_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
            <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
          </div>
        </div>

        {/* Ranking type icons */}
        <div className="flex justify-around py-5 border-b border-gray-100 bg-gray-50">
          {RANKING_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setRankingType(cat.id as any)}
              className={`flex flex-col items-center gap-2 transition-colors ${rankingType === cat.id ? "text-[#FF6100]" : "text-gray-400"}`}
              data-testid={`ranking-type-${cat.id}`}
            >
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-colors ${
                rankingType === cat.id ? "border-[#FF6100] bg-orange-50" : "border-gray-200 bg-white"
              }`}>
                {cat.icon}
              </div>
              <span className="text-xs font-medium">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Age tabs (only for age ranking) */}
        {rankingType === "age" && (
          <div className="flex border-b border-gray-100">
            {AGE_TABS.map((age) => (
              <button
                key={age}
                onClick={() => setActiveAge(age)}
                className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
                  activeAge === age ? "border-[#FF6100] text-[#FF6100]" : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
                data-testid={`age-tab-${age}`}
              >
                {age}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        {rankingType === "brands" ? (
          /* Brand ranking */
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-[#FF6100]" />
              <h2 className="text-sm font-bold text-gray-900">인기 브랜드 TOP {topBrands.length}</h2>
            </div>
            <div className="space-y-0">
              {topBrands.map((brand: any, idx: number) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${encodeURIComponent(brand.id)}`}
                  className="flex items-center gap-3 py-4 border-b border-gray-50 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                  data-testid={`ranking-brand-${brand.id}`}
                >
                  <span className={`text-base font-black w-6 text-center flex-shrink-0 ${idx < 3 ? "text-[#FF6100]" : "text-gray-300"}`}>
                    {idx + 1}
                  </span>
                  <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {brand.representativeImage ? (
                      <img
                        src={getProxiedImageUrl(brand.representativeImage, "thumb")}
                        alt={brand.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                      />
                    ) : (
                      <span className="text-[9px] text-gray-400 text-center font-bold px-1">{brand.name}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{brand.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      상품 {(brand.productCount || 0).toLocaleString()}개
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
              {topBrands.length === 0 && (
                <div className="py-16 text-center">
                  <p className="text-gray-300 text-sm">브랜드 정보를 불러오는 중...</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Product ranking */
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-4 h-4 text-[#FF6100]" />
              <h2 className="text-sm font-bold text-gray-900">
                {rankingType === "age" ? `${activeAge} 랭킹` : "많이 산 상품"} TOP {Math.min(products.length, 20)}
              </h2>
              <span className="text-xs text-gray-400 ml-auto">업데이트 중...</span>
            </div>

            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-6 h-4 bg-gray-100 rounded" />
                    <div className="w-14 h-14 bg-gray-100 rounded" />
                    <div className="flex-1">
                      <div className="h-3 bg-gray-100 rounded w-16 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-full mb-1" />
                      <div className="h-4 bg-gray-100 rounded w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-0">
                {products.map((product: any, idx: number) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="flex items-center gap-3 py-4 border-b border-gray-50 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                    data-testid={`ranking-product-${product.id}`}
                  >
                    <span className={`text-lg font-black w-7 text-center flex-shrink-0 ${idx < 3 ? "text-[#FF6100]" : "text-gray-300"}`}>
                      {idx + 1}
                    </span>
                    <div className="w-14 h-14 flex-shrink-0 bg-gray-50 overflow-hidden rounded border border-gray-100">
                      <img
                        src={getProxiedImageUrl(product.imageUrl, "thumb")}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        loading="lazy"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#FF6100] font-bold uppercase tracking-wide truncate">
                        {getBrandName(product.brandId)}
                      </p>
                      <p className="text-xs text-gray-700 line-clamp-2 leading-snug mt-0.5">{product.name}</p>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        {Number(product.price).toLocaleString()}원
                      </p>
                    </div>
                    {product.isNew && (
                      <span className="flex-shrink-0 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded">NEW</span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">랭킹 정보를 불러오는 중입니다.</p>
              </div>
            )}
          </div>
        )}
      </main>
      <div className="max-w-[640px] w-full mx-auto">
        <Footer />
      </div>
    </div>
  );
}
