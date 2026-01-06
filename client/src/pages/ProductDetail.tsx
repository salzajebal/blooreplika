import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ChevronRight, Truck, Shield, ShoppingBag, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSale } from "@/hooks/use-global-sale";
import { useWishlist } from "@/contexts/WishlistContext";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import type { Product, Brand, Review } from "@shared/schema";

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { toggleItem, isInWishlist } = useWishlist();
  const { salePercent, calculateSalePrice, hasSale } = useGlobalSale();
  const [product, setProduct] = useState<Product | null>(null);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string>("");

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

    const fetchReviews = async () => {
      try {
        const res = await fetch(`/api/reviews?productId=${id}`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.data.slice(0, 5));
        }
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    if (id) {
      fetchProduct();
      fetchReviews();
    }
  }, [id]);

  const parseOptions = (optionsString?: string | null): string[] => {
    if (!optionsString) return [];
    try {
      const parsed = JSON.parse(optionsString);
      if (Array.isArray(parsed)) return parsed;
      return [];
    } catch {
      return optionsString.split(",").map(o => o.trim()).filter(Boolean);
    }
  };

  const handleAddToCart = () => {
    if (product?.isSoldOut) {
      toast({
        title: "품절 상품",
        description: "해당 상품은 현재 품절되었습니다.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "장바구니에 담았습니다",
      description: `${product?.name} ${quantity}개가 장바구니에 추가되었습니다.${selectedOption ? ` (옵션: ${selectedOption})` : ''}`,
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
    setLocation(`/order/${id}?quantity=${quantity}${selectedOption ? `&option=${encodeURIComponent(selectedOption)}` : ''}`);
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    toggleItem({
      id: String(product.id),
      name: product.name,
      price: Number(product.price),
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
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">상품을 찾을 수 없습니다</h1>
            <Link href="/products" className="text-primary hover:underline">
              상품 목록으로 돌아가기
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const options = parseOptions(product.options);
  const isWishlisted = isInWishlist(String(product.id));
  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const getOptionLabelAndDefaults = () => {
    const category = product.categoryId?.toLowerCase() || "";
    const name = product.name?.toLowerCase() || "";
    
    if (category.includes("bag") || category.includes("가방") || name.includes("백") || name.includes("가방")) {
      return { label: "색상", defaults: [] };
    }
    if (category.includes("wallet") || category.includes("지갑") || name.includes("지갑")) {
      return { label: "색상", defaults: [] };
    }
    if (category.includes("shoe") || category.includes("신발") || name.includes("신발") || name.includes("스니커즈") || name.includes("슬리퍼") || name.includes("부츠") || name.includes("로퍼")) {
      return { label: "사이즈", defaults: ["220", "225", "230", "235", "240", "245", "250", "255", "260", "265", "270", "275", "280"] };
    }
    if (category.includes("watch") || category.includes("시계") || name.includes("시계")) {
      return { label: "옵션", defaults: [] };
    }
    if (category.includes("accessory") || category.includes("악세") || name.includes("귀걸이") || name.includes("목걸이") || name.includes("반지") || name.includes("팔찌") || name.includes("브로치")) {
      return { label: "옵션", defaults: [] };
    }
    if (category.includes("outer") || category.includes("아우터") || category.includes("패딩") || category.includes("top") || category.includes("상의") || category.includes("bottom") || category.includes("하의") || name.includes("자켓") || name.includes("코트") || name.includes("패딩") || name.includes("니트") || name.includes("셔츠") || name.includes("티셔츠") || name.includes("바지") || name.includes("스커트")) {
      return { label: "사이즈", defaults: ["XS", "S", "M", "L", "XL", "XXL"] };
    }
    return { label: "옵션", defaults: [] };
  };

  const { label: optionLabel, defaults: defaultOptions } = getOptionLabelAndDefaults();
  const hasOptions = options.length > 0 || defaultOptions.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      
      <main className="flex-1 pb-28 lg:pb-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
          <nav className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-gray-500 mb-4 sm:mb-8 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-primary shrink-0">홈</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <Link href="/products" className="hover:text-primary shrink-0">상품</Link>
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" />
            <span className="text-gray-900 truncate">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-6 lg:gap-12">
            <div className="space-y-3 sm:space-y-4">
              <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 max-w-md mx-auto lg:max-w-none relative">
                {product.isSoldOut && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                    <span className="text-white text-2xl font-bold">SOLD OUT</span>
                  </div>
                )}
                <img
                  src={getProxiedImageUrl(
                    product.imageUrls && product.imageUrls.length > 0
                      ? product.imageUrls[selectedImageIndex] || product.imageUrls[0]
                      : product.imageUrl
                  )}
                  alt={product.name}
                  className="w-full h-full object-contain p-4 sm:p-8"
                  data-testid="img-product-main"
                  onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                />
              </div>
              <div className="flex gap-2 justify-center flex-wrap px-2">
                {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl]).map((url, index) => (
                  <div 
                    key={index} 
                    className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded border overflow-hidden cursor-pointer transition-colors shrink-0 ${
                      selectedImageIndex === index ? 'border-primary border-2' : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                    data-testid={`img-thumbnail-${index}`}
                  >
                    <img
                      src={getProxiedImageUrl(url)}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain p-1 sm:p-2"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 px-1">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 break-keep" data-testid="text-product-name">
                  {product.name}
                </h1>
                <div className="flex items-center gap-2 mb-4">
                  <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded">해외배송</span>
                  <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded">하이엔드급</span>
                  {product.isSoldOut && (
                    <span className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded">SOLD OUT</span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm text-gray-700 mb-3">
                  청담동 에디션만의 특별한 고객 등급혜택<br/>
                  <span className="text-xs text-gray-500">구매실적에 따라 다양한 혜택을 드립니다.</span>
                </p>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-300">
                      <th className="text-left py-2 text-gray-600 font-medium">등급</th>
                      <th className="text-left py-2 text-gray-600 font-medium">혜택</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-200">
                      <td className="py-2">
                        <span className="inline-flex items-center">
                          <span className="bg-purple-600 text-white text-[10px] px-1 rounded mr-1 font-bold">V</span>
                          <span className="text-purple-600 font-bold">VVIP</span>
                        </span>
                      </td>
                      <td className="py-2 text-gray-700">3% 할인</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2">
                        <span className="inline-flex items-center">
                          <span className="bg-red-500 text-white text-[10px] px-1 rounded mr-1 font-bold">V</span>
                          <span className="text-red-500 font-bold">VIP</span>
                        </span>
                      </td>
                      <td className="py-2 text-gray-700">2% 할인</td>
                    </tr>
                    <tr className="border-b border-gray-200">
                      <td className="py-2">
                        <span className="inline-flex items-center">
                          <span className="bg-amber-500 text-white text-[10px] px-1 rounded mr-1 font-bold">G</span>
                          <span className="text-amber-600 font-bold">GOLD</span>
                        </span>
                      </td>
                      <td className="py-2 text-gray-700">1% 할인</td>
                    </tr>
                    <tr>
                      <td className="py-2">
                        <span className="inline-flex items-center">
                          <span className="bg-gray-400 text-white text-[10px] px-1 rounded mr-1 font-bold">S</span>
                          <span className="text-gray-500 font-bold">SILVER</span>
                        </span>
                      </td>
                      <td className="py-2 text-gray-700">0% 할인</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-gray-500 w-24">판매가격</span>
                  {hasSale ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400 line-through">{Number(product.price).toLocaleString()}원</span>
                      <span className="font-bold text-red-500 text-lg" data-testid="price-product-detail">{calculateSalePrice(Number(product.price)).toLocaleString()}원</span>
                      <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded font-bold">{salePercent}% OFF</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                        <span className="text-gray-400 line-through">{Number(product.originalPrice).toLocaleString()}원</span>
                      )}
                      <span className="font-bold text-gray-900" data-testid="price-product-detail">{Number(product.price).toLocaleString()}원</span>
                    </div>
                  )}
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24">포인트</span>
                  <span className="text-gray-700">{Math.floor(Number(product.price) * 0.03).toLocaleString()}점</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24">배송비결제</span>
                  <span className="text-gray-700">무료배송</span>
                </div>
                <div className="flex">
                  <span className="text-gray-500 w-24">최대구매수량</span>
                  <span className="text-gray-700">3 개</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-gray-900 mb-3">배송정보</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <Shield className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">무료 검수 제공</p>
                      <p className="text-xs text-gray-500">프리미엄 검수 무료 제공! (의류 제외)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                      <Truck className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">배송기간</p>
                      <p className="text-xs text-gray-500">최소 2주 ~ 최대 4주 소요(일부 품목 제외)</p>
                    </div>
                  </div>
                </div>
              </div>

              {hasOptions && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="font-bold text-gray-900 mb-3">선택옵션</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600 mb-1 block">{optionLabel}</label>
                      <select 
                        className="w-full border border-gray-300 rounded px-3 py-2.5 text-sm focus:outline-none focus:border-gray-500"
                        value={selectedOption}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        data-testid="select-option"
                      >
                        <option value="">선택</option>
                        {options.length > 0 ? (
                          options.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))
                        ) : (
                          defaultOptions.map((option, index) => (
                            <option key={index} value={option}>{option}</option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2 pt-2">
                <Button
                  size="lg"
                  className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold"
                  onClick={handleBuyNow}
                  disabled={!!product.isSoldOut}
                  data-testid="button-buy-now"
                >
                  바로구매
                </Button>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 border-gray-300 text-gray-700 font-medium"
                    onClick={handleAddToCart}
                    disabled={!!product.isSoldOut}
                    data-testid="button-add-cart"
                  >
                    장바구니
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className={`h-12 border-gray-300 font-medium ${isWishlisted ? 'text-red-500 border-red-300' : 'text-gray-700'}`}
                    onClick={handleWishlistToggle}
                    data-testid="button-wishlist"
                  >
                    <Heart className={`w-4 h-4 mr-1 ${isWishlisted ? 'fill-current' : ''}`} />
                    위시리스트
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-16 border-t border-gray-200 pt-8 sm:pt-12">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-primary inline-block">
              상품 상세 정보
            </h2>
            
            {product.detailContent && (
              <div className="text-gray-700 mb-6 text-center" data-testid="content-detail">
                {product.detailContent}
              </div>
            )}
            
            {product.detailImageUrls && product.detailImageUrls.length > 0 ? (
              <div className="space-y-4 mb-8 sm:mb-12">
                {product.detailImageUrls.map((imgUrl, index) => (
                  <div key={index} className="flex justify-center">
                    <img
                      src={getProxiedImageUrl(imgUrl)}
                      alt={`${product.name} 상세 설명 이미지 ${index + 1}`}
                      className="max-w-full rounded-lg shadow-sm"
                      style={{ maxHeight: 'none' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      data-testid={`img-detail-${index}`}
                    />
                  </div>
                ))}
              </div>
            ) : product.imageUrls && product.imageUrls.length > 1 ? (
              <div className="space-y-4 mb-8 sm:mb-12">
                {product.imageUrls.slice(1).map((imgUrl, index) => (
                  <div key={index} className="flex justify-center">
                    <img
                      src={getProxiedImageUrl(imgUrl)}
                      alt={`${product.name} 상세 이미지 ${index + 1}`}
                      className="max-w-full rounded-lg shadow-sm"
                      style={{ maxHeight: 'none' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      data-testid={`img-detail-fallback-${index}`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-center py-8 mb-8 sm:mb-12">
                상품 상세 이미지가 없습니다.
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">배송 및 교환/반품 안내</h3>
              <p className="text-sm text-gray-600 text-center py-4">
                상세페이지를 참조해 주세요.
              </p>
            </div>
          </div>

          {reviews.length > 0 && (
            <div className="mt-8 sm:mt-16 border-t border-gray-200 pt-8 sm:pt-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 pb-3 sm:pb-4 border-b-2 border-primary inline-block">
                  고객 리뷰
                </h2>
                <Link href="/reviews" className="text-sm text-primary hover:underline">
                  전체보기
                </Link>
              </div>
              
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border border-gray-100 rounded-lg p-4" data-testid={`review-${review.id}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < (review.rating || 5) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{review.authorName}</span>
                      <span className="text-xs text-gray-400">
                        {review.displayDate ? new Date(review.displayDate).toLocaleDateString('ko-KR') : ''}
                      </span>
                    </div>
                    {review.title && (
                      <h4 className="font-medium text-gray-900 mb-1">{review.title}</h4>
                    )}
                    <p className="text-sm text-gray-600">{review.content}</p>
                    {review.imageUrls && review.imageUrls.length > 0 && (
                      <div className="flex gap-2 mt-3">
                        {review.imageUrls.slice(0, 3).map((url, i) => (
                          <img 
                            key={i} 
                            src={url} 
                            alt={`리뷰 이미지 ${i + 1}`}
                            className="w-16 h-16 object-cover rounded"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex gap-2 sm:gap-3 max-w-lg mx-auto p-3 sm:p-4">
              <Button
                variant="outline"
                size="icon"
                className={`h-11 sm:h-12 w-11 sm:w-12 ${isWishlisted ? 'text-red-500 border-red-200' : ''}`}
                onClick={handleWishlistToggle}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </Button>
              <Button
                variant="outline"
                className="h-11 sm:h-12 text-sm"
                onClick={handleAddToCart}
                disabled={!!product.isSoldOut}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                장바구니
              </Button>
              <Button
                className="flex-1 h-11 sm:h-12 text-sm bg-primary hover:bg-primary/90"
                onClick={handleBuyNow}
                disabled={!!product.isSoldOut}
              >
                <ShoppingBag className="w-4 h-4 mr-1.5 sm:mr-2" />
                바로 구매
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
