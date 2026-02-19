import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Home, ChevronRight, Loader2 } from "lucide-react";
import { Link } from "wouter";

interface InspectionItem {
  id: string;
  productName: string;
  imageUrl: string;
  category: string;
  brandName: string | null;
  isActive: boolean;
  createdAt: string;
}

interface ShippingPhotoItem {
  id: string;
  imageUrl: string;
  brandName: string;
  category: string;
  customerName: string;
  photoDate: string;
  productId: string | null;
  isActive: boolean;
  createdAt: string;
}

const CATEGORIES = [
  { id: "all", label: "전체보기" },
  { id: "clothing", label: "의류" },
  { id: "bags", label: "가방" },
  { id: "shoes", label: "신발" },
  { id: "acc", label: "ACC" },
];

function getProxiedImageUrl(url: string): string {
  if (!url) return "";
  if (url.includes("pliki.wisacdn.com") || url.includes("bagstyle.site")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}&w=400&q=80`;
  }
  return url;
}

export default function Inspection() {
  const [inspectionCategory, setInspectionCategory] = useState("all");
  const [shippingCategory, setShippingCategory] = useState("all");

  const { data: inspections, isLoading: inspectionsLoading } = useQuery<InspectionItem[]>({
    queryKey: ["/api/inspections", inspectionCategory],
    queryFn: async () => {
      const params = inspectionCategory !== "all" ? `?category=${inspectionCategory}` : "";
      const res = await fetch(`/api/inspections${params}`);
      const json = await res.json();
      return json.data || [];
    },
  });

  const { data: shippingPhotos, isLoading: shippingLoading } = useQuery<ShippingPhotoItem[]>({
    queryKey: ["/api/shipping-photos", shippingCategory],
    queryFn: async () => {
      const params = shippingCategory !== "all" ? `?category=${shippingCategory}` : "";
      const res = await fetch(`/api/shipping-photos${params}`);
      const json = await res.json();
      return json.data || [];
    },
  });

  return (
    <div className="min-h-screen bg-white" data-testid="inspection-page">
      <Header />

      <div className="border-b border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4 py-3">
          <div className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/">
              <Home className="w-3.5 h-3.5" />
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-gray-700">검수</span>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 py-8 md:py-12">
        {/* 실시간 검수 Section */}
        <section className="mb-12 md:mb-16" data-testid="section-inspection">
          <h2 className="text-lg md:text-xl font-bold text-center mb-6 tracking-wide">실시간 검수</h2>

          {/* Category Tabs */}
          <div className="flex justify-center gap-4 md:gap-6 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                data-testid={`inspection-tab-${cat.id}`}
                onClick={() => setInspectionCategory(cat.id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-1 text-xs md:text-sm transition-colors ${
                  inspectionCategory === cat.id
                    ? "text-black font-semibold"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border ${
                  inspectionCategory === cat.id ? "border-black bg-black text-white" : "border-gray-200 bg-gray-50"
                }`}>
                  <CategoryIcon id={cat.id} active={inspectionCategory === cat.id} />
                </div>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {inspectionsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : inspections && inspections.length > 0 ? (
            <div className="overflow-x-auto pb-4 -mx-4 px-4">
              <div className="flex gap-4" style={{ minWidth: "min-content" }}>
                {inspections.map((item) => (
                  <div
                    key={item.id}
                    data-testid={`inspection-item-${item.id}`}
                    className="flex-shrink-0 w-[160px] md:w-[200px]"
                  >
                    <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                      <img
                        src={getProxiedImageUrl(item.imageUrl)}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <p className="text-xs md:text-sm text-gray-700 line-clamp-2 leading-relaxed">
                      {item.productName}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              등록된 검수 내역이 없습니다.
            </div>
          )}
        </section>

        <div className="border-t border-gray-100 mb-12 md:mb-16" />

        {/* 발송 전 실사 Section */}
        <section data-testid="section-shipping-photos">
          <h2 className="text-lg md:text-xl font-bold text-center mb-6 tracking-wide">발송전실사</h2>

          {/* Category Tabs */}
          <div className="flex justify-center gap-4 md:gap-6 mb-8">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                data-testid={`shipping-tab-${cat.id}`}
                onClick={() => setShippingCategory(cat.id)}
                className={`flex flex-col items-center gap-1.5 px-2 py-1 text-xs md:text-sm transition-colors ${
                  shippingCategory === cat.id
                    ? "text-black font-semibold"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center border ${
                  shippingCategory === cat.id ? "border-black bg-black text-white" : "border-gray-200 bg-gray-50"
                }`}>
                  <CategoryIcon id={cat.id} active={shippingCategory === cat.id} />
                </div>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {shippingLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : shippingPhotos && shippingPhotos.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {shippingPhotos.map((photo) => (
                <div
                  key={photo.id}
                  data-testid={`shipping-photo-${photo.id}`}
                  className="group"
                >
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-50 mb-3">
                    <img
                      src={getProxiedImageUrl(photo.imageUrl)}
                      alt={`${photo.brandName} 검수사진`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="inline-block px-2 py-0.5 bg-gray-100 rounded text-[10px] md:text-xs text-gray-600 font-medium">
                      발송전실사
                    </div>
                    <p className="text-sm md:text-base font-semibold text-gray-900">
                      {photo.brandName}
                    </p>
                    <p className="text-xs text-gray-400">
                      {photo.photoDate} {photo.customerName} 고객님 검수사진
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400 text-sm">
              등록된 실사 내역이 없습니다.
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  );
}

function CategoryIcon({ id, active }: { id: string; active: boolean }) {
  const color = active ? "white" : "#9ca3af";
  const size = 20;

  switch (id) {
    case "all":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
        </svg>
      );
    case "clothing":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L2 6v4l4 2v10h12V12l4-2V6l-4-4h-4l-2 3-2-3H6z" />
        </svg>
      );
    case "bags":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 01-8 0" />
        </svg>
      );
    case "shoes":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 18h20v2H2zM4 18V8c0-1.1.9-2 2-2h2l2 4h8l2-4h2v12" />
        </svg>
      );
    case "acc":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      );
    default:
      return null;
  }
}
