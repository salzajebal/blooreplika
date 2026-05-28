import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ChevronLeft, ChevronRight, Truck, ShoppingBag, Star, Package, AlertTriangle, MessageCircle, Search, Smartphone, Pencil, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSale } from "@/hooks/use-global-sale";
import { useWishlist } from "@/contexts/WishlistContext";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import type { Product, Brand, Review } from "@shared/schema";
import { decodeHtml } from "@/lib/utils";
import { ReviewWriteForm } from "@/pages/Reviews";

// Global variable to store the deferred install prompt
let deferredPrompt: any = null;

// Listen for the beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}


export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { addItem, toggleItem, isInWishlist } = useWishlist();
  const { salePercent, calculateSalePrice, hasSale } = useGlobalSale();
  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailBanners, setDetailBanners] = useState<{ banner1: string | null; banner2: string | null }>({ banner1: null, banner2: null });
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedOption, setSelectedOption] = useState<string>("");
  const [kakaoLink, setKakaoLink] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"detail" | "review" | "shipping">("detail");
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);
  const REVIEWS_PER_PAGE = 10;
  const touchStartX = useRef<number>(0);

  const fetchProductReviews = async (page = 1, append = false) => {
    try {
      const offset = (page - 1) * REVIEWS_PER_PAGE;
      const res = await fetch(`/api/reviews?limit=${REVIEWS_PER_PAGE}&offset=${offset}`);
      const data = await res.json();
      if (data.success) {
        setReviews(prev => append ? [...prev, ...data.data] : data.data);
        setReviewTotal(data.total || 0);
        setReviewPage(page);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const loadMoreReviews = async () => {
    setLoadingMoreReviews(true);
    await fetchProductReviews(reviewPage + 1, true);
    setLoadingMoreReviews(false);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
          if (data.data.brandId) {
            const brandRes = await fetch(`/api/brands/${data.data.brandId}`);
            const brandData = await brandRes.json();
            if (brandData.success) {
              setBrand(brandData.data);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
      fetchProductReviews();
    }
    fetch("/api/product-detail-banners")
      .then(r => r.json())
      .then(d => { if (d.success) setDetailBanners(d.data); })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    const fetchKakaoLink = async () => {
      try {
        const res = await fetch("/api/settings/kakaoTalkLink");
        const data = await res.json();
        if (data.success && data.data?.value) {
          setKakaoLink(data.data.value);
        }
      } catch (error) {
        console.error("Error fetching kakao link:", error);
      }
    };
    fetchKakaoLink();
  }, []);

  const parseProductOptions = (optionsString?: string | null): { colors: string[]; sizes: string[]; extras: { label: string; values: string[] }[] } => {
    if (!optionsString) return { colors: [], sizes: [], extras: [] };
    try {
      const parsed = JSON.parse(optionsString);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          colors: Array.isArray(parsed.colors) ? parsed.colors : [],
          sizes: Array.isArray(parsed.sizes) ? parsed.sizes : [],
          extras: Array.isArray(parsed.extras) ? parsed.extras : [],
        };
      }
      if (Array.isArray(parsed)) {
        return { colors: [], sizes: parsed, extras: [] };
      }
      return { colors: [], sizes: [], extras: [] };
    } catch {
      const items = optionsString.split(",").map(o => o.trim()).filter(Boolean);
      return { colors: [], sizes: items, extras: [] };
    }
  };

  const [selectedExtras, setSelectedExtras] = useState<Record<string, string>>({});

  const getSelectedOptionDesc = (): string => {
    const parts: string[] = [];
    if (selectedColor) parts.push(`컬러:${selectedColor}`);
    if (selectedSize) parts.push(`사이즈:${selectedSize}`);
    Object.entries(selectedExtras).forEach(([label, value]) => {
      if (value) parts.push(`${label}:${value}`);
    });
    if (parts.length > 0) return parts.join(' / ');
    return selectedOption || '기본';
  };

  const validateOptionSelection = (): boolean => {
    const { colors, sizes, extras } = parseProductOptions(product?.options);
    if (colors.length > 0 && !selectedColor) {
      toast({ title: "컬러를 선택해주세요.", variant: "destructive" });
      return false;
    }
    if (sizes.length > 0 && !selectedSize) {
      toast({ title: "사이즈를 선택해주세요.", variant: "destructive" });
      return false;
    }
    for (const extra of extras) {
      if (!selectedExtras[extra.label]) {
        toast({ title: `${extra.label}을(를) 선택해주세요.`, variant: "destructive" });
        return false;
      }
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (product.isSoldOut) {
      toast({
        title: "품절 상품",
        description: "해당 상품은 현재 품절되었습니다.",
        variant: "destructive",
      });
      return;
    }
    if (!validateOptionSelection()) return;
    let finalPrice = Number(product.price);
    if (product.discountPercent && product.discountPercent > 0) {
      finalPrice = Math.round(finalPrice * (100 - product.discountPercent) / 100 / 1000) * 1000;
    } else if (hasSale) {
      finalPrice = calculateSalePrice(finalPrice);
    }
    addItem({
      id: String(product.id),
      name: product.name,
      price: finalPrice,
      imageUrl: product.imageUrl,
    });
    toast({
      title: "장바구니에 담았습니다",
      description: `${product.name} > ${getSelectedOptionDesc()} ${quantity}개가 장바구니에 추가되었습니다.`,
    });
  };

  const handleBuyNow = () => {
    if (product?.isSoldOut) {
      toast({
        title: "품절 상품",
        description: "해당 상품은 현재 품절되었습니다.",
        variant: "destructive",
      });
      return;
    }
    if (!validateOptionSelection()) return;
    const optionParts: string[] = [];
    if (selectedColor) optionParts.push(`컬러:${selectedColor}`);
    if (selectedSize) optionParts.push(`사이즈:${selectedSize}`);
    Object.entries(selectedExtras).forEach(([label, value]) => {
      if (value) optionParts.push(`${label}:${value}`);
    });
    if (!selectedColor && !selectedSize && Object.keys(selectedExtras).length === 0 && selectedOption) optionParts.push(selectedOption);
    const optionStr = optionParts.join(' / ');
    setLocation(`/order/${id}?quantity=${quantity}${optionStr ? `&option=${encodeURIComponent(optionStr)}` : ''}`);
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    // Use discounted price if product has discount or global sale is active
    let finalPrice = Number(product.price);
    if (product.discountPercent && product.discountPercent > 0) {
      finalPrice = Math.round(finalPrice * (100 - product.discountPercent) / 100 / 1000) * 1000;
    } else if (hasSale) {
      finalPrice = calculateSalePrice(finalPrice);
    }
    toggleItem({
      id: String(product.id),
      name: product.name,
      price: finalPrice,
      imageUrl: product.imageUrl,
    });
    toast({
      title: isInWishlist(String(product.id)) ? "찜 목록에서 제거되었습니다" : "찜 목록에 추가되었습니다",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-gray-500">상품 정보를 불러오는 중...</div>
        </main>

      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#f0f0f0] mb-4">상품을 찾을 수 없습니다</h1>
            <Link href="/products" className="text-primary hover:underline">
              상품 목록으로 돌아가기
            </Link>
          </div>
        </main>

      </div>
    );
  }

  const { colors: productColors, sizes: productSizes, extras: productExtras } = parseProductOptions(product.options);
  const isWishlisted = isInWishlist(String(product.id));
  const discountPercent = (product.discountPercent && product.discountPercent > 0)
    ? product.discountPercent
    : (product.originalPrice && product.originalPrice > product.price
      ? Math.round((1 - product.price / product.originalPrice) * 100)
      : 0);
  const finalPrice = discountPercent > 0 && product.discountPercent && product.discountPercent > 0
    ? Math.round(product.price * (100 - discountPercent) / 100 / 1000) * 1000
    : product.price;

  const hasColorOptions = productColors.length > 0;
  const hasSizeOptions = productSizes.length > 0;
  const hasExtraOptions = productExtras.length > 0;
  const hasAnyOptions = hasColorOptions || hasSizeOptions || hasExtraOptions;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />
      
      <main className="flex-1 pb-20">
        <div className="max-w-[640px] mx-auto px-3 sm:px-4 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-3 overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link href="/" className="hover:text-gray-600 shrink-0">홈</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link href="/products" className="hover:text-gray-600 shrink-0">상품</Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-gray-500 truncate">{decodeHtml(product.name)}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-4 lg:gap-10">
            <div className="space-y-3">
              {(() => {
                const BLOOSTORE_COMMON_IMAGES = [
                  '91dc0b3052412', 'e4211aabdece9', '362326a168295', 'cfe01887db836', '939f0df3a3d23'
                ];
                const rawImages = product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl];
                const images = product.categoryId === 'watches'
                  ? rawImages.filter(url => !BLOOSTORE_COMMON_IMAGES.some(id => url.includes(id)))
                  : rawImages;
                return (
                  <>
                    <div
                      className="relative overflow-hidden border border-gray-100 bg-gray-50"
                      style={{ touchAction: 'pan-y' }}
                      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                      onTouchEnd={(e) => {
                        const delta = touchStartX.current - e.changedTouches[0].clientX;
                        if (delta > 50 && selectedImageIndex < images.length - 1) {
                          setSelectedImageIndex(selectedImageIndex + 1);
                        } else if (delta < -50 && selectedImageIndex > 0) {
                          setSelectedImageIndex(selectedImageIndex - 1);
                        }
                      }}
                    >
                      {product.isSoldOut && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                          <span className="text-white text-2xl font-bold">SOLD OUT</span>
                        </div>
                      )}
                      <div
                        className="flex transition-transform duration-300 ease-in-out"
                        style={{ transform: `translateX(-${selectedImageIndex * 100}%)` }}
                      >
                        {images.map((url, index) => (
                          <div key={index} className="w-full flex-shrink-0 aspect-square bg-[#1a1a1a]">
                            <img
                              src={getProxiedImageUrl(url, "large")}
                              alt={`${product.name} ${index + 1}`}
                              className="w-full h-full object-contain p-2 sm:p-6"
                              data-testid={index === 0 ? "img-product-main" : `img-product-${index}`}
                              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                            />
                          </div>
                        ))}
                      </div>
                      {images.length > 1 && (
                        <>
                          <button
                            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center text-gray-700 border border-gray-200 disabled:opacity-30 touch-manipulation"
                            onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                            disabled={selectedImageIndex === 0}
                            data-testid="btn-carousel-prev"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-white/90 hover:bg-white shadow-md rounded-full flex items-center justify-center text-gray-700 border border-gray-200 disabled:opacity-30 touch-manipulation"
                            onClick={() => setSelectedImageIndex(Math.min(images.length - 1, selectedImageIndex + 1))}
                            disabled={selectedImageIndex === images.length - 1}
                            data-testid="btn-carousel-next"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                    {images.length > 1 && (
                      <div className="flex flex-col items-center gap-2" data-testid="carousel-dots">
                        <div className="flex justify-center gap-1.5">
                          {images.map((_, index) => (
                            <button
                              key={index}
                              className={`rounded-full transition-all duration-200 ${
                                selectedImageIndex === index ? 'bg-[#FF6100] w-4 h-1.5' : 'bg-gray-200 w-1.5 h-1.5'
                              }`}
                              onClick={() => setSelectedImageIndex(index)}
                              data-testid={`dot-indicator-${index}`}
                            />
                          ))}
                        </div>
                        <p className="text-xs text-gray-400">{selectedImageIndex + 1} / {images.length}</p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            <div className="space-y-4 px-1">
              <div>
                <h1 className="text-base sm:text-lg font-bold text-gray-900 mb-2 break-keep" data-testid="text-product-name">
                  {decodeHtml(product.name)}
                </h1>
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded">국내배송</span>
                  <span className="bg-orange-50 text-orange-600 text-xs px-2 py-0.5 rounded">하이엔드급</span>
                  {product.isSoldOut && (
                    <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded">SOLD OUT</span>
                  )}
                </div>
              </div>

              <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                <div className="flex items-center">
                  <span className="text-gray-400 w-24">판매가격</span>
                  {hasSale ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400 line-through">{Number(product.price).toLocaleString()}원</span>
                      <span className="font-bold text-[#FF6100] text-lg" data-testid="price-product-detail">{calculateSalePrice(Number(product.price)).toLocaleString()}원</span>
                      <span className="text-xs bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold">{salePercent}% OFF</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 text-lg" data-testid="price-product-detail">{Number(product.price).toLocaleString()}원</span>
                    </div>
                  )}
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-24">포인트</span>
                  <span className="text-gray-600">{Math.floor(finalPrice * 0.03).toLocaleString()}점</span>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-24">배송비결제</span>
                  <span className="text-gray-600">무료배송</span>
                </div>
                <div className="flex">
                  <span className="text-gray-400 w-24">최대구매수량</span>
                  <span className="text-gray-600">3 개</span>
                </div>
              </div>

              {hasAnyOptions && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs text-gray-400 mb-3 font-medium">선택옵션</h3>

                  {hasColorOptions && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">컬러</label>
                      <select
                        value={selectedColor}
                        onChange={(e) => setSelectedColor(e.target.value)}
                        className="w-full h-10 px-3 border border-gray-200 bg-white text-gray-700 text-sm rounded-lg focus:outline-none focus:border-gray-400"
                        data-testid="select-color"
                      >
                        <option value="">선택</option>
                        {productColors.map((color) => (
                          <option key={color} value={color}>{color}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {hasSizeOptions && (
                    <div className="mb-3">
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">사이즈</label>
                      <select
                        value={selectedSize}
                        onChange={(e) => setSelectedSize(e.target.value)}
                        className="w-full h-10 px-3 border border-gray-200 bg-white text-gray-700 text-sm rounded-lg focus:outline-none focus:border-gray-400"
                        data-testid="select-size"
                      >
                        <option value="">선택</option>
                        {productSizes.map((size) => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {productExtras.map((extra) => (
                    <div key={extra.label} className="mb-3">
                      <label className="block text-sm font-medium text-gray-600 mb-1.5">{extra.label}</label>
                      <select
                        value={selectedExtras[extra.label] || ""}
                        onChange={(e) => setSelectedExtras(prev => ({ ...prev, [extra.label]: e.target.value }))}
                        className="w-full h-10 px-3 border border-gray-200 bg-white text-gray-700 text-sm rounded-lg focus:outline-none focus:border-gray-400"
                        data-testid={`select-extra-${extra.label}`}
                      >
                        <option value="">선택</option>
                        {extra.values.map((val) => (
                          <option key={val} value={val}>{val}</option>
                        ))}
                      </select>
                    </div>
                  ))}

                  {(selectedColor || selectedSize || Object.values(selectedExtras).some(Boolean)) && (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">
                          {[
                            selectedColor && `컬러:${selectedColor}`,
                            selectedSize && `사이즈:${selectedSize}`,
                            ...Object.entries(selectedExtras).filter(([, v]) => v).map(([k, v]) => `${k}:${v}`)
                          ].filter(Boolean).join(' / ')}
                        </span>
                        <span className="font-bold text-gray-900">+0원</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-100 pt-4">
                <h3 className="font-bold text-gray-900 mb-3 text-sm">배송정보</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center shrink-0">
                      <Search className="w-5 h-5 text-[#FF6100]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">무료 검수 제공</p>
                      <p className="text-xs text-gray-400">프리미엄 검수 무료 제공! (의류 제외)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-[#FF6100]" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">교환/환불 7일내 신청시 무료</p>
                      <p className="text-xs text-gray-400">상품 수령 후 7일 이내 교환/환불 무료 지원</p>
                    </div>
                  </div>
                </div>
              </div>


              {kakaoLink && (
                <div className="pt-2">
                  <a
                    href={kakaoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    data-testid="link-kakao-chat"
                  >
                    <Button
                      variant="outline"
                      size="lg"
                      className="w-full h-12 bg-[#FEE500] hover:bg-[#FDD800] border-[#FEE500] text-[#3C1E1E] font-bold"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      카카오톡 상담하기
                    </Button>
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 sm:mt-10">
            <div className="border-t border-gray-100">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("detail")}
                className={`flex-1 py-3.5 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === "detail" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                data-testid="tab-detail"
              >
                상품상세
              </button>
              <button
                onClick={() => setActiveTab("review")}
                className={`flex-1 py-3.5 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === "review" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                data-testid="tab-review"
              >
                구매후기 ({reviewTotal})
              </button>
              <button
                onClick={() => setActiveTab("shipping")}
                className={`flex-1 py-3.5 text-sm font-medium text-center border-b-2 transition-colors ${activeTab === "shipping" ? "border-black text-black" : "border-transparent text-gray-400 hover:text-gray-600"}`}
                data-testid="tab-shipping"
              >
                배송/교환
              </button>
            </div>
          </div>
          </div>

          {activeTab === "detail" && (
            <div className="pt-8 sm:pt-12">
              {product.detailContent && product.detailContent !== "프리미엄 명품 제품입니다." && (
                <div 
                  className="text-gray-700 mb-6 text-center detail-html-content" 
                  data-testid="content-detail"
                  ref={(el) => {
                    if (!el) return;
                    const imgs = el.querySelectorAll('img');
                    imgs.forEach(img => {
                      img.onerror = () => { img.style.display = 'none'; };
                      img.onload = () => {
                        if (img.naturalWidth <= 400 && img.naturalHeight <= 300) {
                          img.style.display = 'none';
                        }
                      };
                    });
                  }}
                  dangerouslySetInnerHTML={{ 
                    __html: product.detailContent
                      .replace(/src="\/styleis\/data\//g, 'src="https://bagstyle.site/styleis/data/')
                      .replace(/src='\/styleis\/data\//g, "src='https://bagstyle.site/styleis/data/")
                      .replace(/src="\/data\//g, 'src="https://bagstyle.site/data/')
                      .replace(/src='\/data\//g, "src='https://bagstyle.site/data/")
                      .replace(/src="(https?:\/\/bagstyle\.site\/(?:styleis\/)?data\/[^"]+)"/g, (_match: string, url: string) => 
                        `src="${getProxiedImageUrl(url, 'large')}" style="max-width:100%;height:auto;"`
                      )
                      .replace(/src='(https?:\/\/bagstyle\.site\/(?:styleis\/)?data\/[^']+)'/g, (_match: string, url: string) => 
                        `src='${getProxiedImageUrl(url, 'large')}' style='max-width:100%;height:auto;'`
                      )
                  }}
                />
              )}
              
              {product.detailImageUrls && product.detailImageUrls.length > 0 ? (
                <div className="space-y-4 mb-8 sm:mb-12">
                  {product.detailImageUrls
                    .filter(imgUrl => {
                      const lowerUrl = imgUrl.toLowerCase();
                      const excludePatterns = [
                        'shipping', 'delivery', 'info_banner', 'notice',
                        'haewoe', 'gyohwan', 'geomsu', 'unsong',
                        '국내배송', '교환', '환불', '검수', '운송장', '배송안내',
                        'cdamdong.co.kr/data/file/sj_note'
                      ];
                      if (excludePatterns.some(pattern => lowerUrl.includes(pattern))) return false;
                      if (product.categoryId === 'watches') {
                        const BLOOSTORE_COMMON = ['91dc0b3052412', 'e4211aabdece9', '362326a168295', 'cfe01887db836', '939f0df3a3d23'];
                        if (BLOOSTORE_COMMON.some(id => lowerUrl.includes(id))) return false;
                      }
                      return true;
                    })
                    .map((imgUrl, index) => (
                    <div key={index} className="flex justify-center">
                      <img
                        src={getProxiedImageUrl(imgUrl, "large")}
                        alt={`${product.name} 상세 설명 이미지 ${index + 1}`}
                        className="max-w-full rounded-lg shadow-sm"
                        style={{ maxHeight: 'none' }}
                        onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none'; }}
                        onLoad={(e) => {
                          const img = e.target as HTMLImageElement;
                          if (img.naturalWidth <= 400 && img.naturalHeight <= 300) {
                            img.parentElement!.style.display = 'none';
                          }
                        }}
                        data-testid={`img-detail-${index}`}
                      />
                    </div>
                  ))}
                </div>
              ) : product.imageUrls && product.imageUrls.length > 1 ? (
                <div className="space-y-4 mb-8 sm:mb-12">
                  {product.imageUrls.slice(1)
                    .filter(imgUrl => {
                      if (product.categoryId === 'watches') {
                        const BLOOSTORE_COMMON = ['91dc0b3052412', 'e4211aabdece9', '362326a168295', 'cfe01887db836', '939f0df3a3d23'];
                        return !BLOOSTORE_COMMON.some(id => imgUrl.includes(id));
                      }
                      return true;
                    })
                    .map((imgUrl, index) => (
                    <div key={index} className="flex justify-center">
                      <img
                        src={getProxiedImageUrl(imgUrl, "large")}
                        alt={`${product.name} 상세 이미지 ${index + 1}`}
                        className="max-w-full rounded-lg shadow-sm"
                        style={{ maxHeight: 'none' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        data-testid={`img-detail-fallback-${index}`}
                      />
                    </div>
                  ))}
                </div>
              ) : product.imageUrl ? (
                <div className="space-y-4 mb-8 sm:mb-12">
                  <div className="flex justify-center">
                    <img
                      src={getProxiedImageUrl(product.imageUrl, "large")}
                      alt={`${product.name} 상품 이미지`}
                      className="max-w-full rounded-lg shadow-sm"
                      style={{ maxHeight: 'none' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      data-testid="img-detail-main"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-center py-8 mb-8 sm:mb-12">
                  상품 상세 이미지가 없습니다.
                </div>
              )}
            </div>
          )}

          {activeTab === "review" && (
            <div className="pt-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">구매후기 {reviewTotal}건</span>
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 rounded-full text-gray-600 hover:border-gray-400 transition-colors"
                  data-testid="btn-write-review-product"
                >
                  <Pencil className="w-3 h-3" />
                  후기 작성
                </button>
              </div>

              {showReviewForm && product && (
                <div className="mb-4">
                  <ReviewWriteForm
                    productId={product.id?.toString()}
                    productName={product.name}
                    onClose={() => setShowReviewForm(false)}
                    onSuccess={() => { setShowReviewForm(false); fetchProductReviews(1, false); }}
                  />
                </div>
              )}

              {reviews.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {reviews.map((review) => {
                    const photoList = (review.imageUrls && review.imageUrls.length > 0)
                      ? review.imageUrls
                      : review.imageUrl ? [review.imageUrl] : [];
                    const hasPhoto = photoList.length > 0;
                    return (
                      <div key={review.id} className="py-4" data-testid={`review-${review.id}`}>
                        <div className="flex gap-3">
                          <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                            {hasPhoto ? (
                              <img
                                src={photoList[0].startsWith("/objects/") || photoList[0].startsWith("/api/") ? photoList[0] : getProxiedImageUrl(photoList[0], "thumb")}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-200">
                                <Image className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} className={`w-3 h-3 ${i < (review.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                                ))}
                              </div>
                              <span className="text-xs font-medium text-gray-600">{review.authorName}</span>
                              <span className="text-xs text-gray-400">{review.displayDate ? new Date(review.displayDate).toLocaleDateString('ko-KR') : ''}</span>
                            </div>
                            {review.title && (
                              <p className="text-sm font-semibold text-gray-800 mb-0.5">{review.title}</p>
                            )}
                            {review.content && (
                              <p className="text-sm text-gray-600 leading-relaxed">{review.content}</p>
                            )}
                          </div>
                        </div>
                        {photoList.length > 1 && (
                          <div className="flex gap-2 mt-3 pl-[68px] flex-wrap">
                            {photoList.slice(1).map((url, idx) => (
                              <div key={idx} className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
                                <img
                                  src={url.startsWith("/objects/") || url.startsWith("/api/") ? url : getProxiedImageUrl(url, "thumb")}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {reviews.length < reviewTotal && (
                    <div className="text-center pt-4 pb-2">
                      <button
                        onClick={loadMoreReviews}
                        disabled={loadingMoreReviews}
                        className="w-full py-3 text-sm text-gray-400 border border-gray-100 rounded-xl hover:bg-gray-50 hover:text-gray-600 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                        data-testid="btn-load-more-reviews"
                      >
                        {loadingMoreReviews && (
                          <span className="inline-block w-4 h-4 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin" />
                        )}
                        후기 더보기 ({reviewTotal - reviews.length}개 더)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-400 text-center py-10 text-sm">
                  아직 작성된 후기가 없습니다. 첫 번째 후기를 남겨주세요!
                </div>
              )}
            </div>
          )}

          {activeTab === "shipping" && (
            <div className="pt-6">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">배송 및 교환/반품 안내</h3>
                <div className="grid md:grid-cols-2 gap-5 text-xs text-gray-500">
                  <div>
                    <h4 className="font-semibold text-[#FF6100] mb-2">배송 안내</h4>
                    <ul className="space-y-1.5">
                      <li>• 배송비: 전 상품 무료 배송</li>
                      <li>• 배송 기간: 결제 확인 후 1~3일 이내</li>
                      <li>• 배송사: CJ대한통운</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#FF6100] mb-2">교환/반품 안내</h4>
                    <ul className="space-y-1.5">
                      <li>• 상품 수령 후 7일 이내 교환/반품 가능</li>
                      <li>• 단순 변심 시 왕복 배송비 고객 부담</li>
                      <li>• 제품 하자 시 무료 교환 및 반품</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="fixed bottom-14 md:bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[45] max-w-[640px] mx-auto" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', left: '50%', transform: 'translateX(-50%)', width: '100%' }}>
            <div className="flex gap-0">
              <button
                onClick={handleAddToCart}
                disabled={!!product.isSoldOut}
                className="flex-1 h-14 text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 disabled:bg-gray-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                data-testid="button-add-cart-bottom"
              >
                장바구니
              </button>
              <button
                onClick={handleBuyNow}
                disabled={!!product.isSoldOut}
                className="flex-1 h-14 text-sm font-bold text-white bg-[#FF6100] hover:bg-orange-600 active:bg-orange-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                data-testid="button-buy-now-bottom"
              >
                구매하기
              </button>
            </div>
          </div>
        </div>
      </main>


    </div>
  );
}
