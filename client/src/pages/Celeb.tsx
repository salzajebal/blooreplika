import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Header } from "@/components/layout/Header";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CelebProduct {
  id: string;
  name: string;
  price: number;
  imageUrl: string;
  categoryId: string;
}

interface CelebItem {
  bgUrl: string;
  brandName: string;
  brandShort: string;
  brandId: string | null;
  categoryId: string;
  products: CelebProduct[];
}

const BANNER_URL = "https://cdn.imweb.me/thumbnail/20231226/ab7d075b780d7.jpg";

const BRAND_DISPLAY: Record<string, { line1: string; line2?: string }> = {
  Dior:            { line1: "Christian", line2: "Dior" },
  CELINE:          { line1: "CELINE" },
  BALENCIAGA:      { line1: "BALEN-", line2: "CIAGA" },
  GUCCI:           { line1: "GUCCI" },
  "LOUIS VUITTON": { line1: "LOUIS", line2: "VUITTON" },
};

function BrandBadge({ shortName }: { shortName: string }) {
  const display = BRAND_DISPLAY[shortName] || { line1: shortName };
  return (
    <div className="w-12 h-12 rounded-full bg-white shadow-lg border border-gray-100 flex items-center justify-center p-1.5">
      <span
        className="text-[7px] font-bold text-black text-center leading-tight tracking-wide"
        style={{ fontFamily: "'Playfair Display', serif", letterSpacing: "0.02em" }}
      >
        {display.line1}
        {display.line2 && (
          <>
            <br />
            {display.line2}
          </>
        )}
      </span>
    </div>
  );
}

function ProductRow({ product, brandShort }: { product: CelebProduct; brandShort: string }) {
  return (
    <Link href={`/product/${product.id}`}>
      <div className="flex items-center gap-2 py-2 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 transition-colors px-3">
        <div className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
          <span className="text-[5px] font-bold text-gray-700 text-center leading-none uppercase px-0.5">
            {brandShort === "Dior"
              ? "CD"
              : brandShort === "CELINE"
              ? "CE"
              : brandShort === "BALENCIAGA"
              ? "BAL"
              : brandShort === "GUCCI"
              ? "GG"
              : brandShort === "LOUIS VUITTON"
              ? "LV"
              : brandShort.substring(0, 2)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] font-bold text-gray-900 uppercase tracking-wide leading-none mb-0.5">
            {brandShort}
          </div>
          <div className="text-[10px] text-gray-600 leading-tight line-clamp-2 break-keep">
            {product.name}
          </div>
          <div className="text-[11px] font-bold text-gray-900 mt-1">
            {product.price.toLocaleString()}
            <span className="text-[10px] font-normal text-gray-500 ml-0.5">원</span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-14 h-14 object-cover rounded-sm bg-gray-100"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <ChevronRight className="w-3 h-3 text-gray-400" />
        </div>
      </div>
    </Link>
  );
}

function CelebCard({ item }: { item: CelebItem }) {
  const [productIndex, setProductIndex] = useState(0);
  const products = item.products.slice(0, 2);
  const visibleProduct = products[productIndex] || products[0];

  return (
    <div className="bg-white border border-gray-100 overflow-hidden flex flex-col">
      {/* Celeb photo area */}
      <div className="relative" style={{ paddingBottom: "133.3%" }}>
        <div
          className="absolute inset-0 bg-center bg-cover"
          style={{ backgroundImage: `url(${item.bgUrl})` }}
        />
        {/* Brand badge */}
        <div className="absolute top-3 left-3 z-10">
          <BrandBadge shortName={item.brandShort} />
        </div>
        {/* Navigation arrows if multiple products */}
        {products.length > 1 && (
          <>
            <button
              onClick={() => setProductIndex((i) => (i - 1 + products.length) % products.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <button
              onClick={() => setProductIndex((i) => (i + 1) % products.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-white/80 hover:bg-white flex items-center justify-center shadow transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-700" />
            </button>
          </>
        )}
      </div>

      {/* Product info panel */}
      <div className="flex-1 divide-y divide-gray-100">
        {products.length > 0 ? (
          products.map((p) => <ProductRow key={p.id} product={p} brandShort={item.brandShort} />)
        ) : (
          <Link href={item.brandId ? `/brands?brandId=${item.brandId}` : "/products"}>
            <div className="flex items-center gap-2 py-3 px-3 cursor-pointer hover:bg-gray-50">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                <span className="text-[8px] font-bold text-gray-500">{item.brandShort.substring(0, 2)}</span>
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold text-gray-900 uppercase">{item.brandShort}</div>
                <div className="text-[10px] text-gray-500">상품 보러가기</div>
              </div>
              <ChevronRight className="w-3 h-3 text-gray-400" />
            </div>
          </Link>
        )}
      </div>
    </div>
  );
}

export default function Celeb() {
  const { data, isLoading } = useQuery<{ success: boolean; data: CelebItem[] }>({
    queryKey: ["/api/celeb-items"],
    staleTime: 10 * 60 * 1000,
  });

  const items = data?.data || [];

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Banner */}
      <div className="w-full">
        <img
          src={BANNER_URL}
          alt="Celebrity's Dress"
          className="w-full object-cover"
          style={{ maxHeight: "400px", objectPosition: "center" }}
        />
      </div>

      {/* Celeb grid */}
      <div className="max-w-[1280px] mx-auto px-2 py-2 pb-20 md:pb-8">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="bg-gray-100 animate-pulse" style={{ aspectRatio: "3/4" }} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-[5px]">
            {items.map((item, i) => (
              <CelebCard key={i} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
