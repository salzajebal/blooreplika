import { Header } from "@/components/layout/Header";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Trophy, TrendingUp, Package } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState } from "react";

const CATEGORY_TABS = [
  { id: "all",      label: "전체",  categoryId: "" },
  { id: "bags",     label: "가방",  categoryId: "bags" },
  { id: "clothing", label: "의류",  categoryId: "clothing" },
  { id: "shoes",    label: "신발",  categoryId: "shoes" },
  { id: "wallets",  label: "지갑",  categoryId: "wallets" },
  { id: "watches",  label: "시계",  categoryId: "watches" },
  { id: "jewelry",  label: "쥬얼리", categoryId: "jewelry" },
  { id: "golf",     label: "골프",  categoryId: "golf" },
] as const;

const GENDER_OPTIONS = ["전체", "여성", "남성"] as const;

export default function Ranking() {
  const [rankingType, setRankingType] = useState<"products" | "brands">("products");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [gender, setGender] = useState<"전체" | "여성" | "남성">("전체");

  const selectedCat = CATEGORY_TABS.find((c) => c.id === activeCategory);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ["/api/products/ranking", activeCategory, gender, rankingType],
    queryFn: async () => {
      if (rankingType === "brands") return [];
      let url = "/api/products?limit=30&isBest=true";
      if (selectedCat?.categoryId) url += `&category=${encodeURIComponent(selectedCat.categoryId)}`;
      if (gender === "남성") url += `&gender=${encodeURIComponent("남성")}`;
      if (gender === "여성") url += `&gender=${encodeURIComponent("여성")}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data.length > 0) return data.data;
      // fallback: just get by category without isBest filter
      let fallbackUrl = "/api/products?limit=30";
      if (selectedCat?.categoryId) fallbackUrl += `&category=${encodeURIComponent(selectedCat.categoryId)}`;
      if (gender === "남성") fallbackUrl += `&gender=${encodeURIComponent("남성")}`;
      if (gender === "여성") fallbackUrl += `&gender=${encodeURIComponent("여성")}`;
      const fb = await fetch(fallbackUrl);
      const fbData = await fb.json();
      return fbData.success ? fbData.data : [];
    },
    staleTime: 60000,
    enabled: rankingType === "products",
  });

  const { data: brandsData } = useQuery({
    queryKey: ["/api/brands/top-ranking"],
    queryFn: async () => {
      const res = await fetch("/api/brands/top?limit=30");
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
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <Header />
      <main className="flex-1 max-w-[640px] w-full mx-auto pb-24 md:pb-8 bg-white">

        {/* Page header */}
        <div className="px-4 py-4 border-b border-gray-100 flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-[#FF6100]" />
            랭킹
          </h1>
          {/* Gender filter — only shown for product ranking */}
          {rankingType === "products" && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-full p-1">
              {GENDER_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGender(g)}
                  className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                    gender === g ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-600"
                  }`}
                  data-testid={`gender-${g}`}
                >
                  {g}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ranking type toggle */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setRankingType("products")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              rankingType === "products" ? "border-black text-black" : "border-transparent text-gray-400"
            }`}
            data-testid="tab-products"
          >
            📦 상품 랭킹
          </button>
          <button
            onClick={() => setRankingType("brands")}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              rankingType === "brands" ? "border-black text-black" : "border-transparent text-gray-400"
            }`}
            data-testid="tab-brands"
          >
            🏷️ 브랜드 랭킹
          </button>
        </div>

        {/* Category tabs — only for product ranking */}
        {rankingType === "products" && (
          <div className="flex overflow-x-auto scrollbar-hide border-b border-gray-100 bg-gray-50">
            {CATEGORY_TABS.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-shrink-0 px-4 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                  activeCategory === cat.id
                    ? "border-[#FF6100] text-[#FF6100] bg-white"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
                data-testid={`cat-tab-${cat.id}`}
              >
                {cat.label}
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
            <div>
              {topBrands.map((brand: any, idx: number) => (
                <Link
                  key={brand.id}
                  href={`/products?brand=${encodeURIComponent(brand.id)}`}
                  className="flex items-center gap-3 py-3.5 border-b border-gray-50 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                  data-testid={`ranking-brand-${brand.id}`}
                >
                  <span className={`text-base font-black w-7 text-center flex-shrink-0 ${idx < 3 ? "text-[#FF6100]" : "text-gray-200"}`}>
                    {idx + 1}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
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
                    <p className="text-xs text-gray-400 mt-0.5">상품 {(brand.productCount || 0).toLocaleString()}개</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                </Link>
              ))}
              {topBrands.length === 0 && (
                <div className="py-16 text-center">
                  <TrendingUp className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">브랜드 정보가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Product ranking */
          <div className="px-4 py-4">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-[#FF6100]" />
              <h2 className="text-sm font-bold text-gray-900">
                {gender !== "전체" ? `${gender} ` : ""}
                {selectedCat?.label !== "전체" ? `${selectedCat?.label} ` : ""}
                베스트 TOP {Math.min(products.length, 30)}
              </h2>
            </div>
            <p className="text-xs text-gray-300 mb-4">인기 상품 기준</p>

            {isLoading ? (
              <div className="space-y-0">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3.5 border-b border-gray-50 animate-pulse">
                    <div className="w-7 h-5 bg-gray-100 rounded flex-shrink-0" />
                    <div className="w-14 h-14 bg-gray-100 rounded flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-2.5 bg-gray-100 rounded w-16" />
                      <div className="h-3 bg-gray-100 rounded w-full" />
                      <div className="h-4 bg-gray-100 rounded w-20" />
                    </div>
                  </div>
                ))}
              </div>
            ) : products.length > 0 ? (
              <div>
                {products.map((product: any, idx: number) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.id}`}
                    className="flex items-center gap-3 py-3.5 border-b border-gray-50 hover:bg-gray-50 -mx-4 px-4 transition-colors"
                    data-testid={`ranking-product-${product.id}`}
                  >
                    {/* Rank number */}
                    <div className="w-7 flex-shrink-0 text-center">
                      {idx < 3 ? (
                        <span className={`text-base font-black ${
                          idx === 0 ? "text-[#FF6100]" : idx === 1 ? "text-gray-500" : "text-yellow-600"
                        }`}>{idx + 1}</span>
                      ) : (
                        <span className="text-sm font-bold text-gray-200">{idx + 1}</span>
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div className="w-14 h-14 flex-shrink-0 bg-gray-50 overflow-hidden rounded border border-gray-100">
                      <img
                        src={getProxiedImageUrl(product.imageUrl, "thumb")}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        loading="lazy"
                      />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#FF6100] font-bold uppercase tracking-wide truncate">
                        {getBrandName(product.brandId)}
                      </p>
                      <p className="text-xs text-gray-700 line-clamp-2 leading-snug mt-0.5">
                        {product.name}
                      </p>
                      <p className="text-sm font-bold text-gray-900 mt-1">
                        {Number(product.price).toLocaleString()}원
                      </p>
                    </div>

                    {idx === 0 && (
                      <span className="flex-shrink-0 bg-[#FF6100] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                        1위
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center">
                <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">해당 카테고리 상품이 없습니다.</p>
                <p className="text-gray-300 text-xs mt-1">다른 카테고리를 선택해 보세요.</p>
              </div>
            )}
          </div>
        )}

      </main>
      <div className="max-w-[640px] w-full mx-auto">

      </div>
    </div>
  );
}
