import { useState } from "react";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";

const HERO_DESKTOP = "https://cdn.imweb.me/thumbnail/20240108/cce63a1a894f5.jpg";
const CAT_DESKTOP = "https://cdn.imweb.me/thumbnail/20240314/b79ab49edc10e.jpg";
const HERO_MOBILE = "https://cdn.imweb.me/thumbnail/20260423/79e840dba168f.jpg";
const CAT_MOBILE = "https://cdn.imweb.me/thumbnail/20240314/c24d89d590764.jpg";

const CATEGORIES = [
  { label: "의류", href: "/products/clothing" },
  { label: "가방", href: "/products/bags" },
  { label: "신발", href: "/products/shoes" },
  { label: "액세서리", href: "/products/accessories" },
  { label: "시계", href: "/products/watches" },
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

const INSPECTION_ITEMS = [
  { idx: 36859, name: "5월 28일 정호* 제품 검수", img: "630163ab2ee71" },
  { idx: 36858, name: "5월 28일 김경* 제품 검수", img: "d57a54b0ed363" },
  { idx: 36857, name: "5월 28일 최진* 제품 검수", img: "f9ddfdad97885" },
  { idx: 36856, name: "5월 28일 오세* 제품 검수", img: "fc5deee1b9124" },
  { idx: 36855, name: "5월 27일 나인* 제품 검수", img: "7362cb2727c3f" },
  { idx: 36854, name: "5월 27일 박가* 제품 검수", img: "7b3d47b6063e1" },
  { idx: 36853, name: "5월 27일 박루* 제품 검수", img: "7625bfb4fde44" },
  { idx: 36852, name: "5월 27일 양홍* 제품 검수", img: "bc0220ce73a92" },
  { idx: 36851, name: "5월 27일 양성* 제품 검수", img: "9c1ececa90699" },
  { idx: 36850, name: "5월 27일 이인* 제품 검수", img: "caa99d73bb2ae" },
  { idx: 36849, name: "5월 27일 석근* 제품 검수", img: "248dc094a8b0f" },
  { idx: 36848, name: "5월 27일 김현* 제품 검수", img: "d8d563c1c5e0d" },
  { idx: 36847, name: "5월 27일 위태* 제품 검수", img: "10d0c2a0422be" },
  { idx: 36846, name: "5월 27일 곽미* 제품 검수", img: "26adeac0d1ef6" },
  { idx: 36845, name: "5월 26일 원세* 제품 검수", img: "637c900188dfe" },
  { idx: 36844, name: "5월 26일 김말* 제품 검수", img: "aed8575a7a403" },
  { idx: 36843, name: "5월 26일 구민* 제품 검수", img: "15a2653af9aa9" },
  { idx: 36842, name: "5월 26일 노정* 제품 검수", img: "b4ced95337b41" },
  { idx: 36841, name: "5월 26일 정고* 제품 검수", img: "e1bc9cbc0519c" },
  { idx: 36840, name: "5월 26일 김경* 제품 검수", img: "9e0f8f00c23a5" },
];

function getImgUrl(hash: string) {
  return `/api/bloostore-image-proxy?url=${encodeURIComponent(
    `https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/${hash}.jpg?w=800`
  )}`;
}

function getCdnUrl(path: string) {
  return `/api/bloostore-image-proxy?url=${encodeURIComponent(
    `https://cdn.imweb.me/thumbnail/${path}`
  )}`;
}

export default function Inspection() {
  const [sort, setSort] = useState("recent");
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const sortedItems = [...INSPECTION_ITEMS].sort((a, b) => {
    if (sort === "abc") return a.name.localeCompare(b.name);
    if (sort === "descabc") return b.name.localeCompare(a.name);
    return 0;
  });

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
            style={{ maxWidth: "100%" }}
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.src = "https://cdn.imweb.me/thumbnail/20240108/cce63a1a894f5.jpg";
            }}
          />
        </div>

        {/* ── 모바일 히어로 배너 ── */}
        <div className="block md:hidden w-full">
          <img
            src={getCdnUrl("20260423/79e840dba168f.jpg")}
            alt="실시간 검수"
            className="w-full h-auto block"
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.src = "https://cdn.imweb.me/thumbnail/20260423/79e840dba168f.jpg";
            }}
          />
        </div>

        {/* ── 데스크톱 카테고리 이미지맵 ── */}
        <div className="hidden md:block w-full relative">
          <img
            src={getCdnUrl("20240314/b79ab49edc10e.jpg")}
            alt="카테고리"
            className="w-full h-auto block"
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.src = "https://cdn.imweb.me/thumbnail/20240314/b79ab49edc10e.jpg";
            }}
          />
          {/* 5개 클릭 영역 오버레이 */}
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.label}
              href={cat.href}
              style={{
                position: "absolute",
                top: 0,
                left: `${i * 20}%`,
                width: "20%",
                height: "100%",
                display: "block",
              }}
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
            onError={(e) => {
              const t = e.target as HTMLImageElement;
              t.src = "https://cdn.imweb.me/thumbnail/20240314/c24d89d590764.jpg";
            }}
          />
          {CATEGORIES.map((cat, i) => (
            <Link
              key={cat.label}
              href={cat.href}
              style={{
                position: "absolute",
                top: 0,
                left: `${i * 20}%`,
                width: "20%",
                height: "100%",
                display: "block",
              }}
              aria-label={cat.label}
            />
          ))}
        </div>

        {/* ── 정렬 + 상품 그리드 ── */}
        <div
          className="mx-auto px-3 md:px-4"
          style={{ maxWidth: "1200px" }}
        >
          {/* 정렬 드롭다운 */}
          <div className="flex justify-end py-2 md:py-3">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs md:text-sm border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none"
              title="정렬 바꾸기"
              data-testid="sort-select"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* 4열 상품 그리드 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 pb-10">
            {sortedItems.map((item, i) => (
              <div
                key={item.idx}
                data-testid={`inspection-item-${item.idx}`}
                className="group cursor-pointer"
              >
                <div
                  className="w-full bg-gray-100 overflow-hidden"
                  style={{ aspectRatio: "1/1" }}
                >
                  <img
                    src={imgErrors[i] ? "https://cdn-optimized.imweb.me/upload/S20230920d5d5cda65981a/" + item.img + ".jpg?w=800" : getImgUrl(item.img)}
                    alt={item.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                    onError={() => setImgErrors((prev) => ({ ...prev, [i]: true }))}
                  />
                </div>
                <p className="text-xs md:text-sm text-gray-700 mt-1 leading-tight line-clamp-2 px-0.5">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
