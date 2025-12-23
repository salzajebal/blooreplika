import { useState, useEffect } from "react";
import { useParams, Link, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, MessageCircle, ChevronRight, Truck, Shield, Award, RotateCcw, ShoppingBag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useKakaoLink } from "@/hooks/use-kakao-link";
import { KakaoConfirmDialog } from "@/components/KakaoConfirmDialog";
import { useLivePrices } from "@/hooks/use-live-prices";
import type { Product } from "@shared/schema";

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.15.53-.5 1.92-.57 2.22-.1.38.14.38.29.27.12-.08 1.85-1.22 2.6-1.72.72.11 1.47.17 2.18.17 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
    </svg>
  );
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&h=800&fit=crop";

const PRODUCT_DETAILS: Record<string, { features: string[]; specs: { label: string; value: string }[]; notice: string }> = {
  gold_bar: {
    features: [
      "LBMA(런던귀금속시장협회) 국제 공인 인증 골드바",
      "한국금거래소 정품 보증서 발급",
      "999.9 순도 보장 (Four Nine Gold)",
      "실시간 국제 금 시세 연동 가격",
      "전문 감정사의 품질 검증 완료",
      "고급 보관 케이스 및 인증서 포함"
    ],
    specs: [
      { label: "순도", value: "999.9‰ (24K)" },
      { label: "인증", value: "LBMA 국제 공인" },
      { label: "보증서", value: "한국금거래소 정품 보증서" },
      { label: "포장", value: "고급 우드 케이스" }
    ],
    notice: "본 상품은 한국금거래소에서 직접 검증한 정품이며, 구매 시 정품 보증서가 함께 발급됩니다. 금 시세는 실시간으로 변동되므로 최종 결제 금액은 주문 시점의 시세가 적용됩니다."
  },
  silver_bar: {
    features: [
      "999.9 순도의 프리미엄 실버바",
      "한국금거래소 정품 보증서 발급",
      "투자 가치가 높은 고순도 은",
      "실시간 국제 은 시세 연동 가격",
      "전문 감정사의 품질 검증 완료",
      "보관 케이스 및 인증서 포함"
    ],
    specs: [
      { label: "순도", value: "999.9‰" },
      { label: "재질", value: "순은 (Fine Silver)" },
      { label: "보증서", value: "한국금거래소 정품 보증서" },
      { label: "포장", value: "전용 보관 케이스" }
    ],
    notice: "실버바는 은 시세 변동에 따라 가격이 변동됩니다. 장기 투자 시 자산 가치 상승 효과를 기대할 수 있습니다."
  },
  baby_ring: {
    features: [
      "99.9% 순금으로 제작된 프리미엄 돌반지",
      "아기 피부에 안전한 무니켈 가공",
      "사이즈 조절 가능한 오픈형 디자인",
      "한국금거래소 정품 보증서 발급",
      "고급 벨벳 케이스 및 쇼핑백 포함",
      "무료 각인 서비스 제공 (이름/생년월일)"
    ],
    specs: [
      { label: "순도", value: "99.9% (24K)" },
      { label: "사이즈", value: "프리사이즈 (조절 가능)" },
      { label: "가공", value: "무니켈 안전 가공" },
      { label: "각인", value: "무료 각인 서비스" }
    ],
    notice: "돌반지는 아기의 첫 번째 생일을 축하하는 소중한 선물입니다. 순금으로 제작되어 피부 자극이 없으며, 아이가 성장해도 소중히 간직할 수 있는 평생 가보가 됩니다."
  },
  gift_gold: {
    features: [
      "99.9% 순금으로 정교하게 제작된 기념품",
      "전통 풍수 의미를 담은 디자인",
      "개업/승진/결혼 등 축하 선물로 적합",
      "한국금거래소 정품 보증서 발급",
      "고급 전시용 케이스 포함",
      "재물운, 건강운, 성공운 기원"
    ],
    specs: [
      { label: "순도", value: "99.9% (24K)" },
      { label: "제작", value: "수작업 정교 조각" },
      { label: "보증서", value: "한국금거래소 정품 보증서" },
      { label: "케이스", value: "고급 전시용 케이스" }
    ],
    notice: "순금 기념품은 재물과 행운을 기원하는 의미를 담고 있어 개업 선물, 승진 축하, 집들이 선물로 인기가 높습니다. 풍수적 의미와 함께 자산 가치도 보존됩니다."
  },
  pure_jewelry: {
    features: [
      "18K/24K 고급 순금 주얼리",
      "세계적인 명품 브랜드 디자인",
      "장인의 섬세한 수작업으로 완성",
      "한국금거래소 정품 보증 및 A/S",
      "고급 브랜드 박스 및 쇼핑백 포함",
      "생활 방수 및 변색 방지 코팅"
    ],
    specs: [
      { label: "순도", value: "18K (750‰) / 24K" },
      { label: "디자인", value: "명품 브랜드 스타일" },
      { label: "A/S", value: "평생 무상 A/S" },
      { label: "보증", value: "정품 보증서 발급" }
    ],
    notice: "명품 주얼리는 고급스러운 디자인과 순금의 가치를 동시에 선사합니다. 특별한 날을 위한 선물 또는 자신을 위한 투자로 적합합니다."
  },
  jewelry: {
    features: [
      "99.9% 순금으로 제작된 주얼리",
      "클래식하고 세련된 디자인",
      "일상에서 착용 가능한 편안함",
      "한국금거래소 정품 보증서 발급",
      "무료 사이즈 조절 서비스",
      "고급 주얼리 케이스 포함"
    ],
    specs: [
      { label: "순도", value: "99.9% (24K)" },
      { label: "체인", value: "순금 체인 포함" },
      { label: "A/S", value: "무료 수선 서비스" },
      { label: "케이스", value: "고급 주얼리 케이스" }
    ],
    notice: "순금 주얼리는 시간이 지나도 변색되지 않으며, 자산 가치를 보존합니다. 결혼 예물, 기념일 선물로 많이 선택됩니다."
  },
  diamond: {
    features: [
      "GIA 국제 공인 다이아몬드 인증",
      "4C(Carat, Cut, Color, Clarity) 최상급",
      "고급 플래티넘/화이트골드 세팅",
      "평생 무상 세척 및 점검 서비스",
      "국제 감정서 및 보증서 발급",
      "프러포즈/웨딩용 고급 패키지"
    ],
    specs: [
      { label: "인증", value: "GIA 국제 인증" },
      { label: "세팅", value: "Pt950 / 18K WG" },
      { label: "보증", value: "국제 감정서 발급" },
      { label: "A/S", value: "평생 무상 관리" }
    ],
    notice: "GIA 인증 다이아몬드는 세계에서 가장 신뢰받는 품질 보증입니다. 프러포즈, 결혼반지로 영원한 사랑을 약속하세요."
  },
  corporate: {
    features: [
      "기업 맞춤형 순금 제품 제작",
      "회사 로고 각인 서비스 제공",
      "대량 주문 시 특별 할인 적용",
      "한국금거래소 정품 보증서 발급",
      "고급 포장 및 배송 서비스",
      "세금계산서 발행 가능"
    ],
    specs: [
      { label: "순도", value: "99.9% (24K)" },
      { label: "각인", value: "로고/텍스트 각인 가능" },
      { label: "대량주문", value: "특별 할인 적용" },
      { label: "세금", value: "세금계산서 발행" }
    ],
    notice: "기업 선물, 우수사원 포상, 창립기념 등 다양한 용도로 활용 가능합니다. 대량 주문 시 별도 견적을 제공해 드립니다."
  },
  event: {
    features: [
      "한정 수량 특별 기획 상품",
      "특별 할인가로 제공",
      "한국금거래소 정품 보증서 발급",
      "시즌 한정 디자인",
      "선착순 조기 마감 가능",
      "추가 사은품 증정"
    ],
    specs: [
      { label: "순도", value: "99.9% (24K)" },
      { label: "한정", value: "시즌 한정 수량" },
      { label: "할인", value: "특별 이벤트가 적용" },
      { label: "사은품", value: "추가 사은품 증정" }
    ],
    notice: "이벤트 상품은 한정 수량으로 진행되며, 조기 품절될 수 있습니다. 특별한 가격으로 순금을 만나보세요."
  }
};

export default function ProductDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { openKakaoChat, showConfirmDialog, confirmAndOpenKakao, closeConfirmDialog } = useKakaoLink();
  const { calculateProductPrice } = useLivePrices();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        if (data.success) {
          setProduct(data.data);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  const handleAddToCart = () => {
    toast({
      title: "장바구니에 담았습니다",
      description: `${product?.name} ${quantity}개가 장바구니에 추가되었습니다.`,
    });
  };

  const handleBuyNow = () => {
    setLocation(`/order/${id}?quantity=${quantity}`);
  };

  const handleInquiry = () => {
    toast({
      title: "1:1 채팅 상담",
      description: "오른쪽 하단의 채팅 버튼을 클릭해주세요.",
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

  const details = PRODUCT_DETAILS[product.category] || PRODUCT_DETAILS.gold_bar;

  return (
    <>
      <KakaoConfirmDialog 
        open={showConfirmDialog} 
        onConfirm={confirmAndOpenKakao} 
        onCancel={closeConfirmDialog} 
      />
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
              <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 max-w-md mx-auto lg:max-w-none">
                <img
                  src={
                    product.imageUrls && product.imageUrls.length > 0
                      ? product.imageUrls[selectedImageIndex] || product.imageUrls[0]
                      : product.imageUrl || DEFAULT_IMAGE
                  }
                  alt={product.name}
                  className="w-full h-full object-contain p-4 sm:p-8"
                />
              </div>
              <div className="flex gap-2 justify-center flex-wrap px-2">
                {(product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls : [product.imageUrl || DEFAULT_IMAGE]).map((url, index) => (
                  <div 
                    key={index} 
                    className={`w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded border overflow-hidden cursor-pointer transition-colors shrink-0 ${
                      selectedImageIndex === index ? 'border-primary border-2' : 'border-gray-200 hover:border-primary'
                    }`}
                    onClick={() => setSelectedImageIndex(index)}
                  >
                    <img
                      src={url || DEFAULT_IMAGE}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-contain p-1 sm:p-2"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 sm:space-y-6 px-1">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-2">
                  {product.isBest && (
                    <span className="bg-gray-900 text-white text-xs px-2 py-1 font-bold">BEST</span>
                  )}
                  {product.isNew && (
                    <span className="bg-red-600 text-white text-xs px-2 py-1 font-bold">NEW</span>
                  )}
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 mb-2 break-keep">{product.name}</h1>
                <p className="text-sm sm:text-base text-gray-600">{product.description}</p>
              </div>

              <div className="border-t border-b border-gray-100 py-4 sm:py-6 text-center lg:text-left">
                <div className="flex items-baseline justify-center lg:justify-start gap-2">
                  <span className="text-2xl sm:text-3xl font-bold text-primary" data-testid="price-product-detail">
                    {product.price && product.price !== "시세 적용" && product.price !== "0" 
                      ? product.price 
                      : (calculateProductPrice(product.category, product.weight) || product.price)}
                  </span>
                  <span className="text-base sm:text-lg text-gray-500">원</span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">VAT 포함 / 무료 배송</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-sm">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                  <span className="text-gray-500">중량</span>
                  <span className="font-medium text-right lg:text-left">{product.weight}</span>
                  <span className="text-gray-500">순도</span>
                  <span className="font-medium text-right lg:text-left">{product.purity}</span>
                  <span className="text-gray-500">보증</span>
                  <span className="font-medium text-primary text-right lg:text-left">한국금거래소 정품 보증</span>
                </div>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-4">
                <span className="text-gray-500 text-sm">수량</span>
                <div className="flex items-center border border-gray-200 rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50"
                    data-testid="button-quantity-minus"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 border-x border-gray-200 min-w-[50px] text-center" data-testid="text-quantity">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-gray-500 hover:bg-gray-50"
                    data-testid="button-quantity-plus"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="hidden lg:flex gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 h-14"
                  onClick={handleAddToCart}
                  data-testid="button-add-cart"
                >
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  장바구니
                </Button>
                <Button
                  size="lg"
                  className="flex-1 h-14 bg-primary hover:bg-primary/90"
                  onClick={handleBuyNow}
                  data-testid="button-buy-now"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
                  주문하기
                </Button>
                <Button
                  size="lg"
                  className="h-14 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E]"
                  onClick={openKakaoChat}
                  data-testid="button-kakao-inquiry"
                >
                  <KakaoIcon className="w-5 h-5 mr-2" />
                  상담
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14"
                  onClick={() => toast({ title: "찜 목록에 추가되었습니다" })}
                  data-testid="button-wishlist"
                >
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              <div className="grid grid-cols-4 gap-2 sm:gap-4 pt-4 border-t border-gray-100">
                <div className="text-center">
                  <Truck className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gold-600 mb-1" />
                  <span className="text-[10px] sm:text-xs text-gray-600">무료배송</span>
                </div>
                <div className="text-center">
                  <Shield className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gold-600 mb-1" />
                  <span className="text-[10px] sm:text-xs text-gray-600">정품보증</span>
                </div>
                <div className="text-center">
                  <Award className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gold-600 mb-1" />
                  <span className="text-[10px] sm:text-xs text-gray-600">품질인증</span>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 mx-auto text-gold-600 mb-1" />
                  <span className="text-[10px] sm:text-xs text-gray-600">교환/반품</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 sm:mt-16 border-t border-gray-200 pt-8 sm:pt-12">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 pb-3 sm:pb-4 border-b-2 border-primary inline-block">
              상품 상세 정보
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
              <div>
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">상품 특징</h3>
                <ul className="space-y-2 sm:space-y-3">
                  {details.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700 text-sm">
                      <span className="text-primary mt-0.5 shrink-0">✓</span>
                      <span className="break-keep">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">상품 스펙</h3>
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <table className="w-full text-sm">
                    <tbody>
                      {details.specs.map((spec, i) => (
                        <tr key={i} className="border-b border-gray-200 last:border-0">
                          <td className="py-2 sm:py-3 text-gray-500 w-20 sm:w-24">{spec.label}</td>
                          <td className="py-2 sm:py-3 font-medium text-gray-900">{spec.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="bg-gold-50 rounded-lg p-4 sm:p-6 mb-8 sm:mb-12">
              <h3 className="font-bold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">안내사항</h3>
              <p className="text-gray-700 leading-relaxed text-sm break-keep">{details.notice}</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 sm:p-6">
              <h3 className="font-bold text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">배송 및 교환/반품 안내</h3>
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6 text-xs sm:text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">배송 안내</h4>
                  <ul className="space-y-1">
                    <li>• 배송비: 전 상품 무료 배송</li>
                    <li>• 배송 기간: 결제 확인 후 1~3일 이내</li>
                    <li>• 배송사: CJ대한통운 (안심 택배)</li>
                    <li>• 고가 상품은 직원 직접 배송 가능</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">교환/반품 안내</h4>
                  <ul className="space-y-1">
                    <li>• 상품 수령 후 7일 이내 교환/반품 가능</li>
                    <li>• 단순 변심 시 왕복 배송비 고객 부담</li>
                    <li>• 제품 하자 시 무료 교환 및 반품</li>
                    <li>• 1:1 채팅 상담 이용 가능</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 lg:hidden z-40" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            <div className="flex gap-2 sm:gap-3 max-w-lg mx-auto p-3 sm:p-4">
              <Button
                variant="outline"
                className="h-11 sm:h-12 text-sm bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] border-[#FEE500]"
                onClick={openKakaoChat}
              >
                <KakaoIcon className="w-4 h-4 mr-1" />
                상담
              </Button>
              <Button
                className="flex-1 h-11 sm:h-12 text-sm bg-primary hover:bg-primary/90"
                onClick={handleBuyNow}
              >
                <ShoppingBag className="w-4 h-4 mr-1.5 sm:mr-2" />
                주문하기
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
      </div>
    </>
  );
}
