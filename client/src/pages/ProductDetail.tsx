import { useState, useEffect, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { ChevronLeft, ChevronRight, Share2, Heart, Star, Image as ImageIcon, Pencil, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSale } from "@/hooks/use-global-sale";
import { useWishlist } from "@/contexts/WishlistContext";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import type { Product, Review } from "@shared/schema";
import { decodeHtml } from "@/lib/utils";
import { ReviewWriteForm } from "@/pages/Reviews";

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addItem, toggleItem, isInWishlist } = useWishlist();
  const { salePercent, calculateSalePrice, hasSale } = useGlobalSale();

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedExtras, setSelectedExtras] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<"detail" | "review">("detail");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [photoOnly, setPhotoOnly] = useState(false);
  const [reviewTotal, setReviewTotal] = useState(0);
  const touchStartX = useRef<number>(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setProduct(d.data);
          // fetch related products from same category
          const cat = d.data.categoryId;
          if (cat) {
            fetch(`/api/products?limit=6&categories=${cat}`)
              .then(r2 => r2.json())
              .then(d2 => {
                if (d2.success) {
                  setRelatedProducts((d2.data || []).filter((p: Product) => p.id !== d.data.id).slice(0, 4));
                }
              });
          }
        }
      })
      .finally(() => setLoading(false));

    fetch(`/api/reviews?limit=20&offset=0`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setReviews(d.data || []);
          setReviewTotal(d.total || 0);
        }
      });
  }, [id]);

  const parseOptions = (opt?: string | null) => {
    if (!opt) return { colors: [] as string[], sizes: [] as string[], extras: [] as { label: string; values: string[] }[] };
    try {
      const p = JSON.parse(opt);
      if (p && typeof p === "object" && !Array.isArray(p)) {
        return {
          colors: Array.isArray(p.colors) ? p.colors : [],
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          extras: Array.isArray(p.extras) ? p.extras : [],
        };
      }
      if (Array.isArray(p)) return { colors: [], sizes: p, extras: [] };
    } catch {}
    const items = (opt || "").split(",").map(s => s.trim()).filter(Boolean);
    return { colors: [], sizes: items, extras: [] };
  };

  const validateOptions = () => {
    if (!product) return true;
    const { colors, sizes, extras } = parseOptions(product.options);
    if (colors.length > 0 && !selectedColor) {
      toast({ title: "컬러를 선택해주세요.", variant: "destructive" }); return false;
    }
    if (sizes.length > 0 && !selectedSize) {
      toast({ title: "사이즈를 선택해주세요.", variant: "destructive" }); return false;
    }
    for (const e of extras) {
      if (!selectedExtras[e.label]) {
        toast({ title: `${e.label}을(를) 선택해주세요.`, variant: "destructive" }); return false;
      }
    }
    return true;
  };

  const getOptionDesc = () => {
    const parts: string[] = [];
    if (selectedColor) parts.push(`컬러:${selectedColor}`);
    if (selectedSize) parts.push(`사이즈:${selectedSize}`);
    Object.entries(selectedExtras).forEach(([k, v]) => { if (v) parts.push(`${k}:${v}`); });
    return parts.join(" / ") || "기본";
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (product.isSoldOut) { toast({ title: "품절 상품입니다.", variant: "destructive" }); return; }
    if (!validateOptions()) return;
    const opt = getOptionDesc();
    setLocation(`/order/${id}?quantity=1${opt !== "기본" ? `&option=${encodeURIComponent(opt)}` : ""}`);
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.isSoldOut) { toast({ title: "품절 상품입니다.", variant: "destructive" }); return; }
    if (!validateOptions()) return;
    let finalPrice = Number(product.price);
    if (product.discountPercent && product.discountPercent > 0) {
      finalPrice = Math.round(finalPrice * (100 - product.discountPercent) / 100 / 1000) * 1000;
    } else if (hasSale) {
      finalPrice = calculateSalePrice(finalPrice);
    }
    addItem({ id: String(product.id), name: product.name, price: finalPrice, imageUrl: product.imageUrl });
    toast({ title: "장바구니에 담았습니다", description: product.name });
  };

  const handleWishlist = () => {
    if (!product) return;
    let finalPrice = Number(product.price);
    if (hasSale) finalPrice = calculateSalePrice(finalPrice);
    toggleItem({ id: String(product.id), name: product.name, price: finalPrice, imageUrl: product.imageUrl });
    toast({ title: isInWishlist(String(product.id)) ? "찜 목록에서 제거되었습니다" : "찜 목록에 추가되었습니다" });
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: product?.name || "", url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "링크가 복사되었습니다" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center text-gray-400 text-sm">불러오는 중...</main>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 mb-3">상품을 찾을 수 없습니다</p>
            <Link href="/" className="text-sm text-blue-500 underline">홈으로</Link>
          </div>
        </main>
      </div>
    );
  }

  const BLOOSTORE_COMMON = ["91dc0b3052412", "e4211aabdece9", "362326a168295", "cfe01887db836", "939f0df3a3d23"];
  const rawImages = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl];
  const images = product.categoryId === "watches"
    ? rawImages.filter(u => !BLOOSTORE_COMMON.some(id2 => u.includes(id2)))
    : rawImages;

  const { colors: productColors, sizes: productSizes, extras: productExtras } = parseOptions(product.options);
  const hasOptions = productColors.length > 0 || productSizes.length > 0 || productExtras.length > 0;
  const NO_SIZE_CATS = ['bags', 'wallets', 'watches', 'jewelry', 'sunglasses', 'accessories'];
  const categoryNeedsSize = !NO_SIZE_CATS.includes(product.categoryId || '');
  const isWishlisted = isInWishlist(String(product.id));

  const basePrice = Number(product.price);
  const discountPct = (product.discountPercent && product.discountPercent > 0)
    ? product.discountPercent
    : (product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100) : 0);
  const salePrice = hasSale ? calculateSalePrice(basePrice) : (discountPct > 0 ? Math.round(basePrice * (100 - discountPct) / 100) : basePrice);
  const showSale = hasSale || discountPct > 0;
  const couponPrice = Math.round(salePrice * 0.85 / 100) * 100;
  const pointAmt = Math.floor(salePrice * 0.01);

  const filteredReviews = photoOnly
    ? reviews.filter(r => (r.imageUrls && r.imageUrls.length > 0) || r.imageUrl)
    : reviews;

  // Category label for breadcrumb
  const catLabel: Record<string, string> = {
    bags: "가방", clothing: "의류", shoes: "신발", wallets: "지갑",
    accessories: "패션잡화", jewelry: "쥬얼리", watches: "시계", sunglasses: "선글라스",
    belts: "벨트", golf: "골프",
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1 pb-20 md:pb-0">
        {/* Breadcrumb */}
        <div className="max-w-screen-xl mx-auto px-4 pt-3 pb-1">
          <nav className="flex items-center gap-1 text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-600">Home</Link>
            <span className="mx-1">›</span>
            {product.categoryId && (
              <>
                <span>{catLabel[product.categoryId] || product.categoryId}</span>
                <span className="mx-1">›</span>
              </>
            )}
            <span className="text-gray-600 truncate max-w-[200px]">{decodeHtml(product.name)}</span>
          </nav>
        </div>

        {/* Main product layout */}
        <div className="max-w-screen-xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12">

            {/* Left: Image carousel */}
            <div className="md:w-[480px] flex-shrink-0">
              <div
                className="relative bg-white border border-gray-100 overflow-hidden"
                style={{ aspectRatio: "1/1", touchAction: "pan-y" }}
                onTouchStart={e => { touchStartX.current = e.touches[0].clientX; }}
                onTouchEnd={e => {
                  const delta = touchStartX.current - e.changedTouches[0].clientX;
                  if (delta > 50 && selectedImageIndex < images.length - 1) setSelectedImageIndex(i => i + 1);
                  else if (delta < -50 && selectedImageIndex > 0) setSelectedImageIndex(i => i - 1);
                }}
              >
                {product.isSoldOut && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                    <span className="text-white text-2xl font-bold tracking-widest">SOLD OUT</span>
                  </div>
                )}
                <div
                  className="flex h-full transition-transform duration-300"
                  style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
                >
                  {images.map((url, i) => (
                    <div key={i} className="w-full h-full flex-shrink-0 flex items-center justify-center p-4 bg-white">
                      <img
                        src={getProxiedImageUrl(url, "large")}
                        alt={`${product.name} ${i + 1}`}
                        className="w-full h-full object-contain"
                        onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        data-testid={i === 0 ? "img-product-main" : `img-product-${i}`}
                      />
                    </div>
                  ))}
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex(i => Math.max(0, i - 1))}
                      disabled={selectedImageIndex === 0}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center disabled:opacity-30 shadow-sm"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex(i => Math.min(images.length - 1, i + 1))}
                      disabled={selectedImageIndex === images.length - 1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 border border-gray-200 rounded-full flex items-center justify-center disabled:opacity-30 shadow-sm"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-700" />
                    </button>
                  </>
                )}
                {images.length > 1 && (
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={`rounded-full transition-all ${selectedImageIndex === i ? "w-4 h-1.5 bg-gray-700" : "w-1.5 h-1.5 bg-gray-300"}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnail strip */}
              {images.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImageIndex(i)}
                      className={`w-16 h-16 flex-shrink-0 border-2 rounded overflow-hidden transition-all ${selectedImageIndex === i ? "border-gray-800" : "border-gray-100"}`}
                    >
                      <img src={getProxiedImageUrl(url, "thumb")} alt="" className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product info */}
            <div className="flex-1 min-w-0">
              {/* Title + Share */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <h1 className="text-base md:text-lg font-semibold text-gray-900 leading-snug break-keep" data-testid="text-product-name">
                  {decodeHtml(product.name)}
                </h1>
                <button onClick={handleShare} className="flex-shrink-0 mt-0.5 text-gray-400 hover:text-gray-700" aria-label="공유">
                  <Share2 className="w-5 h-5" />
                </button>
              </div>

              {/* Price */}
              <div className="mb-4">
                {showSale ? (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900" data-testid="price-product-detail">
                      {salePrice.toLocaleString()}원
                    </span>
                    <span className="text-sm text-gray-400 line-through">{basePrice.toLocaleString()}원</span>
                    <span className="text-sm font-bold text-red-500">{hasSale ? salePercent : discountPct}%</span>
                  </div>
                ) : (
                  <span className="text-2xl font-bold text-gray-900" data-testid="price-product-detail">
                    {basePrice.toLocaleString()}원
                  </span>
                )}
              </div>

              {/* Coupon section */}
              <div className="flex items-center gap-3 py-3 border-t border-gray-100">
                <span className="text-sm text-gray-500 w-16 shrink-0">쿠폰 사용시</span>
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-sm font-semibold text-gray-800">{couponPrice.toLocaleString()}원</span>
                  <button className="px-2 py-0.5 bg-red-500 text-white text-xs rounded font-medium hover:bg-red-600">
                    쿠폰받기
                  </button>
                </div>
              </div>

              {/* Info rows */}
              <div className="border-t border-gray-100 py-2 space-y-2">
                <div className="flex items-center py-1">
                  <span className="text-sm text-gray-500 w-16 shrink-0">적립</span>
                  <span className="text-sm text-gray-700">{pointAmt.toLocaleString()} 포인트 적립예정</span>
                </div>
                <div className="flex items-center py-1">
                  <span className="text-sm text-gray-500 w-16 shrink-0">배송</span>
                  <span className="text-sm text-gray-700">택배 · 기본 무료</span>
                </div>
              </div>

              {/* Options */}
              <div className="border-t border-gray-100 pt-4 space-y-3">
                {productColors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      컬러 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedColor}
                        onChange={e => setSelectedColor(e.target.value)}
                        className="w-full h-11 pl-3 pr-10 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-500 appearance-none"
                        data-testid="select-color"
                      >
                        <option value="">컬러 (필수)</option>
                        {productColors.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
                {productSizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      사이즈 <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedSize}
                        onChange={e => setSelectedSize(e.target.value)}
                        className="w-full h-11 pl-3 pr-10 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-500 appearance-none"
                        data-testid="select-size"
                      >
                        <option value="">사이즈 (필수)</option>
                        {productSizes.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                )}
                {productExtras.map(ex => (
                  <div key={ex.label}>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {ex.label} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={selectedExtras[ex.label] || ""}
                        onChange={e => setSelectedExtras(prev => ({ ...prev, [ex.label]: e.target.value }))}
                        className="w-full h-11 pl-3 pr-10 border border-gray-300 rounded text-sm text-gray-700 bg-white focus:outline-none focus:border-gray-500 appearance-none"
                        data-testid={`select-extra-${ex.label}`}
                      >
                        <option value="">{ex.label} (필수)</option>
                        {ex.values.map(v => <option key={v} value={v}>{v}</option>)}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                ))}
                {!hasOptions && categoryNeedsSize && (
                  <div className="relative">
                    <select
                      className="w-full h-11 pl-3 pr-10 border border-gray-300 rounded text-sm text-gray-400 bg-white appearance-none"
                      defaultValue=""
                    >
                      <option value="">사이즈 (필수)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleBuyNow}
                  disabled={!!product.isSoldOut}
                  className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                  data-testid="button-buy-now"
                >
                  {product.isSoldOut ? "품절" : "즉시 구매"}
                </button>
                <button
                  onClick={handleAddToCart}
                  disabled={!!product.isSoldOut}
                  className="flex-1 h-12 border border-gray-300 text-gray-700 font-medium text-sm rounded hover:bg-gray-50 disabled:opacity-40 transition-colors"
                  data-testid="button-add-cart"
                >
                  장바구니
                </button>
                <button
                  onClick={handleWishlist}
                  className={`w-12 h-12 border rounded flex items-center justify-center transition-colors ${isWishlisted ? "border-red-300 bg-red-50" : "border-gray-300 hover:bg-gray-50"}`}
                  aria-label="찜하기"
                  data-testid="button-wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? "fill-red-400 text-red-400" : "text-gray-400"}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-10 border-t border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("detail")}
                className={`flex-1 py-3.5 text-sm font-medium text-center transition-colors ${
                  activeTab === "detail" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:text-gray-700 border-b border-gray-200"
                }`}
                data-testid="tab-detail"
              >
                상세정보
              </button>
              <button
                onClick={() => setActiveTab("review")}
                className={`flex-1 py-3.5 text-sm font-medium text-center transition-colors ${
                  activeTab === "review" ? "bg-gray-900 text-white" : "bg-white text-gray-500 hover:text-gray-700 border-b border-gray-200"
                }`}
                data-testid="tab-review"
              >
                구매평 ({reviewTotal})
              </button>
            </div>

            {/* Detail tab */}
            {activeTab === "detail" && (
              <div className="py-8">
                {product.detailContent && product.detailContent !== "프리미엄 명품 제품입니다." && (
                  <div
                    className="text-gray-700 mb-6 detail-html-content"
                    dangerouslySetInnerHTML={{
                      __html: product.detailContent
                        .replace(/src="\/styleis\/data\//g, 'src="https://bagstyle.site/styleis/data/')
                        .replace(/src='\/styleis\/data\//g, "src='https://bagstyle.site/styleis/data/")
                        .replace(/src="\/data\//g, 'src="https://bagstyle.site/data/')
                        .replace(/src='\/data\//g, "src='https://bagstyle.site/data/")
                        .replace(/src="(https?:\/\/bagstyle\.site\/(?:styleis\/)?data\/[^"]+)"/g, (_: string, u: string) =>
                          `src="${getProxiedImageUrl(u, "large")}" style="max-width:100%;height:auto;"`
                        )
                        .replace(/src='(https?:\/\/bagstyle\.site\/(?:styleis\/)?data\/[^']+)'/g, (_: string, u: string) =>
                          `src='${getProxiedImageUrl(u, "large")}' style='max-width:100%;height:auto;'`
                        ),
                    }}
                  />
                )}

                {product.detailImageUrls && product.detailImageUrls.length > 0 ? (
                  <div className="space-y-3">
                    {product.detailImageUrls
                      .filter(u => {
                        const lower = u.toLowerCase();
                        if (["shipping", "delivery", "info_banner", "notice", "haewoe", "gyohwan", "geomsu", "unsong"].some(p => lower.includes(p))) return false;
                        if (product.categoryId === "watches" && BLOOSTORE_COMMON.some(id2 => lower.includes(id2))) return false;
                        return true;
                      })
                      .map((url, i) => (
                        <div key={i} className="flex justify-center">
                          <img
                            src={getProxiedImageUrl(url, "large")}
                            alt={`상세 이미지 ${i + 1}`}
                            className="max-w-full"
                            style={{ maxHeight: "none" }}
                            onError={e => { (e.target as HTMLImageElement).parentElement!.style.display = "none"; }}
                            onLoad={e => {
                              const img = e.target as HTMLImageElement;
                              if (img.naturalWidth <= 400 && img.naturalHeight <= 300) img.parentElement!.style.display = "none";
                            }}
                            data-testid={`img-detail-${i}`}
                          />
                        </div>
                      ))}
                  </div>
                ) : product.imageUrls && product.imageUrls.length > 1 ? (
                  <div className="space-y-3">
                    {product.imageUrls.slice(1).map((url, i) => (
                      <div key={i} className="flex justify-center">
                        <img
                          src={getProxiedImageUrl(url, "large")}
                          alt={`상세 이미지 ${i + 1}`}
                          className="max-w-full"
                          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                          data-testid={`img-detail-fallback-${i}`}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-sm py-8">상세 이미지가 없습니다.</p>
                )}
              </div>
            )}

            {/* Review tab */}
            {activeTab === "review" && (
              <div className="py-6">
                {/* Review header */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">구매평 ({reviewTotal})</h3>
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                      data-testid="btn-write-review"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      구매평 작성
                    </button>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={photoOnly}
                      onChange={e => setPhotoOnly(e.target.checked)}
                      className="w-4 h-4 accent-gray-800"
                    />
                    포토 구매평만 보기
                  </label>
                </div>

                {showReviewForm && product && (
                  <div className="mb-6 p-4 border border-gray-100 rounded-lg bg-gray-50">
                    <ReviewWriteForm
                      productId={product.id?.toString()}
                      productName={product.name}
                      onClose={() => setShowReviewForm(false)}
                      onSuccess={() => {
                        setShowReviewForm(false);
                        fetch(`/api/reviews?limit=20&offset=0`).then(r => r.json()).then(d => {
                          if (d.success) { setReviews(d.data || []); setReviewTotal(d.total || 0); }
                        });
                      }}
                    />
                  </div>
                )}

                {filteredReviews.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {filteredReviews.map(review => {
                      const photos = review.imageUrls?.length ? review.imageUrls : review.imageUrl ? [review.imageUrl] : [];
                      return (
                        <div key={review.id} className="py-4" data-testid={`review-${review.id}`}>
                          <div className="flex gap-3">
                            <div className="w-14 h-14 flex-shrink-0 rounded border border-gray-100 overflow-hidden bg-gray-50">
                              {photos.length > 0 ? (
                                <img
                                  src={photos[0].startsWith("/") ? photos[0] : getProxiedImageUrl(photos[0], "thumb")}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-200">
                                  <ImageIcon className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="flex">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3 h-3 ${i < (review.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
                                  ))}
                                </div>
                                <span className="text-xs font-medium text-gray-700">{review.authorName}</span>
                                <span className="text-xs text-gray-400">
                                  {review.displayDate ? new Date(review.displayDate).toLocaleDateString("ko-KR") : ""}
                                </span>
                              </div>
                              {review.title && <p className="text-sm font-medium text-gray-800 mb-0.5">{review.title}</p>}
                              {review.content && <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>}
                            </div>
                          </div>
                          {photos.length > 1 && (
                            <div className="flex gap-2 mt-2 pl-[68px]">
                              {photos.slice(1).map((u, i) => (
                                <div key={i} className="w-14 h-14 rounded border border-gray-100 overflow-hidden flex-shrink-0">
                                  <img
                                    src={u.startsWith("/") ? u : getProxiedImageUrl(u, "thumb")}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-400 text-sm py-12">등록된 구매평이 없습니다.</p>
                )}
              </div>
            )}
          </div>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="mt-10 pb-10">
              <h3 className="text-base font-semibold text-gray-900 mb-4">다른 고객님이 함께 보신 상품</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {relatedProducts.map(p => {
                  const rpPrice = hasSale ? calculateSalePrice(Number(p.price)) : Number(p.price);
                  return (
                    <Link key={p.id} href={`/product/${p.id}`} className="block group">
                      <div className="aspect-square bg-gray-50 border border-gray-100 rounded overflow-hidden mb-2">
                        <img
                          src={getProxiedImageUrl(p.imageUrl, "thumb")}
                          alt={p.name}
                          className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-2 leading-snug mb-1 break-keep">
                        {decodeHtml(p.name)}
                      </p>
                      <p className="text-sm font-bold text-gray-900">{rpPrice.toLocaleString()}원</p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
