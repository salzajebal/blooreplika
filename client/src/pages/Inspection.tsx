import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Header } from "@/components/layout/Header";
import { Loader2, ChevronDown } from "lucide-react";

const CATEGORIES = [
  { label: "의류", href: "/products/clothing" },
  { label: "가방", href: "/products/bags" },
  { label: "신발", href: "/products/shoes" },
  { label: "액세서리", href: "/products/accessories" },
  { label: "시계", href: "/412" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "등록순" },
  { value: "like", label: "인기순" },
  { value: "min_price", label: "낮은가격순" },
  { value: "max_price", label: "높은가격순" },
  { value: "comment", label: "상품평 많은순" },
  { value: "abc", label: "이름순" },
  { value: "descabc", label: "이름역순" },
];

const PAGE_SIZE = 20;

const STATIC_ITEMS = [
  { id: "s1", productName: "5월 28일 정호* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/630163ab2ee71.jpg" },
  { id: "s2", productName: "5월 28일 김경* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/d57a54b0ed363.jpg" },
  { id: "s3", productName: "5월 28일 최진* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/f9ddfdad97885.jpg" },
  { id: "s4", productName: "5월 28일 오세* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/fc5deee1b9124.jpg" },
  { id: "s5", productName: "5월 27일 나인* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/7362cb2727c3f.jpg" },
  { id: "s6", productName: "5월 27일 박가* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/7b3d47b6063e1.jpg" },
  { id: "s7", productName: "5월 27일 박루* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/7625bfb4fde44.jpg" },
  { id: "s8", productName: "5월 27일 양홍* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/bc0220ce73a92.jpg" },
  { id: "s9", productName: "5월 27일 양성* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/9c1ececa90699.jpg" },
  { id: "s10", productName: "5월 27일 이인* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/caa99d73bb2ae.jpg" },
  { id: "s11", productName: "5월 27일 석근* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/248dc094a8b0f.jpg" },
  { id: "s12", productName: "5월 27일 김현* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/d8d563c1c5e0d.jpg" },
  { id: "s13", productName: "5월 27일 위태* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/10d0c2a0422be.jpg" },
  { id: "s14", productName: "5월 27일 곽미* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/26adeac0d1ef6.jpg" },
  { id: "s15", productName: "5월 26일 원세* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/637c900188dfe.jpg" },
  { id: "s16", productName: "5월 26일 김말* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/aed8575a7a403.jpg" },
  { id: "s17", productName: "5월 26일 구민* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/15a2653af9aa9.jpg" },
  { id: "s18", productName: "5월 26일 노정* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/b4ced95337b41.jpg" },
  { id: "s19", productName: "5월 26일 정고* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/e1bc9cbc0519c.jpg" },
  { id: "s20", productName: "5월 26일 김경* 제품 검수", imageUrl: "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/9e0f8f00c23a5.jpg" },
];

function proxyUrl(raw: string) {
  return `/api/bloostore-image-proxy?url=${encodeURIComponent(raw)}`;
}

function getCdnUrl(path: string) {
  return proxyUrl(`https://cdn.imweb.me/thumbnail/${path}`);
}

interface InspectionItem {
  id: string;
  productName: string;
  imageUrl: string;
  sortOrder?: number;
}

export default function Inspection() {
  const [sort, setSort] = useState("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const { data: apiData, isLoading } = useQuery<{ success: boolean; data: InspectionItem[] }>({
    queryKey: ["/api/inspections", "bloostore"],
    queryFn: async () => {
      const res = await fetch("/api/inspections?category=bloostore");
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
  });

  const dbItems: InspectionItem[] = apiData?.data && apiData.data.length > 0
    ? apiData.data
    : STATIC_ITEMS;

  const sortedItems = [...dbItems].sort((a, b) => {
    if (sort === "abc") return a.productName.localeCompare(b.productName);
    if (sort === "descabc") return b.productName.localeCompare(a.productName);
    return 0;
  });

  const visibleItems = sortedItems.slice(0, visibleCount);
  const hasMore = visibleCount < sortedItems.length;
  const remaining = sortedItems.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + PAGE_SIZE);
  };

  return (
    <div className="min-h-screen bg-white" data-testid="inspection-page">
      <Header />

      <div className="w-full">
        {/* ── 데스크톱 히어로 배너 ── */}
        <div className="hidden md:block w-full">
          <img
            src={getCdnUrl("20240108/cce63a1a894f5.jpg")}
            alt="실시간 검수"
            className="w-full h-auto block"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.imweb.me/thumbnail/20240108/cce63a1a894f5.jpg"; }}
          />
        </div>

        {/* ── 모바일 히어로 배너 ── */}
        <div className="block md:hidden w-full">
          <img
            src={getCdnUrl("20260423/79e840dba168f.jpg")}
            alt="실시간 검수"
            className="w-full h-auto block"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.imweb.me/thumbnail/20260423/79e840dba168f.jpg"; }}
          />
        </div>

        {/* ── 데스크톱 카테고리 이미지맵 ── */}
        <div className="hidden md:block w-full relative">
          <img
            src={getCdnUrl("20240314/b79ab49edc10e.jpg")}
            alt="카테고리"
            className="w-full h-auto block"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.imweb.me/thumbnail/20240314/b79ab49edc10e.jpg"; }}
          />
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.label}
              href={cat.href}
              style={{ position: "absolute", top: 0, left: `${i * 20}%`, width: "20%", height: "100%", display: "block" }}
              aria-label={cat.label}
            />
          ))}
        </div>

        {/* ── 모바일 카테고리 이미지맵 ── */}
        <div className="block md:hidden w-full relative">
          <img
            src={getCdnUrl("20240314/c24d89d590764.jpg")}
            alt="카테고리"
            className="w-full h-auto block"
            onError={(e) => { (e.target as HTMLImageElement).src = "https://cdn.imweb.me/thumbnail/20240314/c24d89d590764.jpg"; }}
          />
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.label}
              href={cat.href}
              style={{ position: "absolute", top: 0, left: `${i * 20}%`, width: "20%", height: "100%", display: "block" }}
              aria-label={cat.label}
            />
          ))}
        </div>

        {/* ── 정렬 + 상품 그리드 ── */}
        <div className="mx-auto px-3 md:px-4" style={{ maxWidth: "1200px" }}>
          {/* 정렬 + 총 건수 */}
          <div className="flex items-center justify-between py-2 md:py-3">
            <span className="text-xs text-gray-500">
              총 <span className="font-semibold text-gray-800">{sortedItems.length}</span>개
            </span>
            <select
              value={sort}
              onChange={(e) => { setSort(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="text-xs md:text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none"
              title="정렬 바꾸기"
              data-testid="sort-select"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* 로딩 상태 */}
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          )}

          {/* 4열 상품 그리드 */}
          {!isLoading && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                {visibleItems.map((item) => {
                  const rawUrl = item.imageUrl.includes('?') ? item.imageUrl : `${item.imageUrl}?w=800`;
                  const proxied = proxyUrl(rawUrl);
                  const fallback = rawUrl;
                  const hasErr = !!imgErrors[item.id];
                  return (
                    <div
                      key={item.id}
                      data-testid={`inspection-item-${item.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="w-full bg-gray-100 overflow-hidden" style={{ aspectRatio: "1/1" }}>
                        <img
                          src={hasErr ? fallback : proxied}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                          onError={() => setImgErrors((prev) => ({ ...prev, [item.id]: true }))}
                        />
                      </div>
                      <p className="text-xs md:text-sm text-gray-700 mt-1 leading-tight line-clamp-2 px-0.5">
                        {item.productName}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 더보기 버튼 */}
              {hasMore && (
                <div className="flex flex-col items-center py-8 gap-2">
                  <p className="text-xs text-gray-400">
                    {visibleCount}개 표시 중 / 총 {sortedItems.length}개
                  </p>
                  <button
                    onClick={handleLoadMore}
                    data-testid="button-load-more"
                    className="flex items-center gap-2 px-8 py-3 border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
                  >
                    <ChevronDown className="w-4 h-4" />
                    더보기 ({Math.min(PAGE_SIZE, remaining)}개 더 보기)
                  </button>
                </div>
              )}

              {/* 전체 로드 완료 */}
              {!hasMore && sortedItems.length > PAGE_SIZE && (
                <div className="flex justify-center py-8">
                  <p className="text-xs text-gray-400">총 {sortedItems.length}개 전체 표시됨</p>
                </div>
              )}

              <div className="pb-20 md:pb-10" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
