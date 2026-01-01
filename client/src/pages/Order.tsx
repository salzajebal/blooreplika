import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Package, User, MapPin, MessageCircle, CreditCard, Building2 } from "lucide-react";
import { CardPaymentForm, type CouponPaymentData } from "@/components/checkout/CardPaymentForm";
import { cn } from "@/lib/utils";
import type { Product } from "@shared/schema";

type PaymentMethod = "coupon" | "bank" | null;

const KAKAO_LINK = "https://pf.kakao.com/_xixcxgj";

function KakaoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.15.53-.5 1.92-.57 2.22-.1.38.14.38.29.27.12-.08 1.85-1.22 2.6-1.72.72.11 1.47.17 2.18.17 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
    </svg>
  );
}

export default function Order() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [cardPaymentValid, setCardPaymentValid] = useState(false);
  const [couponPaymentData, setCouponPaymentData] = useState<CouponPaymentData | null>(null);
  
  const searchParams = new URLSearchParams(window.location.search);
  const quantityParam = parseInt(searchParams.get("quantity") || "1");
  const [quantity] = useState(quantityParam);

  const [formData, setFormData] = useState({
    memberName: "",
    memberEmail: "",
    memberPhone: "",
    shippingName: "",
    shippingPhone: "",
    shippingZipcode: "",
    shippingAddress: "",
    shippingAddressDetail: "",
    shippingMemo: "",
    sameAsOrderer: true,
    selectedSize: "",
    selectedColor: "",
  });

  useEffect(() => {
    const memberName = localStorage.getItem("memberName") || "";
    const memberEmail = localStorage.getItem("memberEmail") || "";
    
    setFormData(prev => ({
      ...prev,
      memberName,
      memberEmail,
      shippingName: memberName,
    }));
  }, []);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSameAsOrderer = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sameAsOrderer: checked,
      shippingName: checked ? prev.memberName : prev.shippingName,
      shippingPhone: checked ? prev.memberPhone : prev.shippingPhone,
    }));
  };

  useEffect(() => {
    if (formData.sameAsOrderer) {
      setFormData(prev => ({
        ...prev,
        shippingName: prev.memberName,
        shippingPhone: prev.memberPhone,
      }));
    }
  }, [formData.memberName, formData.memberPhone, formData.sameAsOrderer]);

  const calculateTotal = () => {
    if (!product) return "0";
    return (product.price * quantity).toLocaleString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    if (!formData.memberName || !formData.memberEmail || !formData.memberPhone) {
      toast({
        title: "입력 오류",
        description: "주문자 정보를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }
    
    if (!formData.shippingName || !formData.shippingPhone || !formData.shippingAddress) {
      toast({
        title: "입력 오류",
        description: "배송지 정보를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const memberId = localStorage.getItem("memberId");
      const memberToken = localStorage.getItem("memberToken");
      
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(memberToken ? { "Authorization": `Bearer ${memberToken}` } : {}),
        },
        body: JSON.stringify({
          memberId: memberId || null,
          memberName: formData.memberName,
          memberEmail: formData.memberEmail,
          memberPhone: formData.memberPhone,
          shippingName: formData.shippingName,
          shippingPhone: formData.shippingPhone,
          shippingZipcode: formData.shippingZipcode,
          shippingAddress: formData.shippingAddress,
          shippingAddressDetail: formData.shippingAddressDetail,
          shippingMemo: formData.shippingMemo,
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          quantity,
          selectedSize: formData.selectedSize || null,
          selectedColor: formData.selectedColor || null,
          totalAmount: product.price * quantity,
          paymentMethod: paymentMethod || undefined,
          couponPayment: paymentMethod === "coupon" && couponPaymentData ? couponPaymentData : undefined,
        }),
      });

      const data = await res.json();
      
      if (data.success) {
        setOrderNumber(data.data.orderNumber);
        setOrderComplete(true);
      } else {
        throw new Error(data.error || "주문 처리 중 오류가 발생했습니다.");
      }
    } catch (error: any) {
      toast({
        title: "주문 오류",
        description: error.message || "주문 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
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
            <Button onClick={() => setLocation("/products")}>상품 목록으로 돌아가기</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 py-8 sm:py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-white rounded-xl shadow-lg p-6 sm:p-10 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
                주문이 완료되었습니다
              </h1>
              
              <p className="text-gray-600 mb-6">
                주문번호: <span className="font-bold text-primary">{orderNumber}</span>
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 sm:p-6 mb-6">
                <h2 className="font-bold text-amber-900 mb-3 flex items-center justify-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  결제계좌 안내
                </h2>
                <p className="text-amber-800 mb-4">
                  결제계좌 정보는 <strong>카카오톡 상담</strong>을 통해 안내받으실 수 있습니다.
                  <br />
                  아래 버튼을 눌러 카카오톡으로 이동해주세요.
                </p>
                
                <a
                  href={KAKAO_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-bold py-4 px-8 rounded-lg text-lg transition-colors"
                  data-testid="link-kakao-payment"
                >
                  <KakaoIcon className="w-6 h-6" />
                  카카오톡으로 결제계좌 안내받기
                </a>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-bold text-gray-900 mb-3">주문 상품 정보</h3>
                <div className="flex gap-4">
                  <div className="w-20 h-20 bg-white rounded border overflow-hidden shrink-0">
                    <img
                      src={product.imageUrl || "/images/placeholder.png"}
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500">수량: {quantity}개</p>
                    <p className="text-primary font-bold mt-1">{calculateTotal()}원</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/")}
                  className="sm:w-auto"
                >
                  홈으로 돌아가기
                </Button>
                <Button
                  onClick={() => setLocation("/profile")}
                  className="sm:w-auto"
                >
                  주문 내역 확인
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
        
        <main className="flex-1 py-6 sm:py-10">
          <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            주문서 작성
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                주문 상품
              </h2>
              
              <div className="flex gap-4 items-center">
                <div className="w-24 h-24 bg-gray-50 rounded-lg border overflow-hidden shrink-0">
                  <img
                    src={product.imageUrl || "/images/placeholder.png"}
                    alt={product.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900">{product.name}</h3>
                  {product.sku && <p className="text-sm text-gray-500">SKU: {product.sku}</p>}
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm text-gray-500">수량: {quantity}개</span>
                    <span className="font-bold text-primary text-lg">{calculateTotal()}원</span>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 mt-4 pt-4 border-t">
                <div>
                  <Label htmlFor="selectedSize">사이즈 (선택)</Label>
                  <Input
                    id="selectedSize"
                    name="selectedSize"
                    value={formData.selectedSize}
                    onChange={handleInputChange}
                    placeholder="예: M, L, XL, 260, 270 등"
                    data-testid="input-selected-size"
                  />
                </div>
                <div>
                  <Label htmlFor="selectedColor">색상 (선택)</Label>
                  <Input
                    id="selectedColor"
                    name="selectedColor"
                    value={formData.selectedColor}
                    onChange={handleInputChange}
                    placeholder="예: 블랙, 화이트, 네이비 등"
                    data-testid="input-selected-color"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                주문자 정보
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="memberName">이름 *</Label>
                  <Input
                    id="memberName"
                    name="memberName"
                    value={formData.memberName}
                    onChange={handleInputChange}
                    placeholder="홍길동"
                    required
                    data-testid="input-member-name"
                  />
                </div>
                <div>
                  <Label htmlFor="memberPhone">연락처 *</Label>
                  <Input
                    id="memberPhone"
                    name="memberPhone"
                    value={formData.memberPhone}
                    onChange={handleInputChange}
                    placeholder="010-0000-0000"
                    required
                    data-testid="input-member-phone"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="memberEmail">이메일 *</Label>
                  <Input
                    id="memberEmail"
                    name="memberEmail"
                    type="email"
                    value={formData.memberEmail}
                    onChange={handleInputChange}
                    placeholder="example@email.com"
                    required
                    data-testid="input-member-email"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  배송지 정보
                </h2>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sameAsOrderer}
                    onChange={(e) => handleSameAsOrderer(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300"
                  />
                  <span>주문자 정보와 동일</span>
                </label>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="shippingName">받는 분 *</Label>
                  <Input
                    id="shippingName"
                    name="shippingName"
                    value={formData.shippingName}
                    onChange={handleInputChange}
                    placeholder="홍길동"
                    required
                    data-testid="input-shipping-name"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingPhone">연락처 *</Label>
                  <Input
                    id="shippingPhone"
                    name="shippingPhone"
                    value={formData.shippingPhone}
                    onChange={handleInputChange}
                    placeholder="010-0000-0000"
                    required
                    data-testid="input-shipping-phone"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingZipcode">우편번호</Label>
                  <Input
                    id="shippingZipcode"
                    name="shippingZipcode"
                    value={formData.shippingZipcode}
                    onChange={handleInputChange}
                    placeholder="12345"
                    data-testid="input-shipping-zipcode"
                  />
                </div>
                <div>
                  <Label htmlFor="shippingAddress">주소 *</Label>
                  <Input
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleInputChange}
                    placeholder="서울시 강남구 테헤란로 123"
                    required
                    data-testid="input-shipping-address"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="shippingAddressDetail">상세주소</Label>
                  <Input
                    id="shippingAddressDetail"
                    name="shippingAddressDetail"
                    value={formData.shippingAddressDetail}
                    onChange={handleInputChange}
                    placeholder="101동 1001호"
                    data-testid="input-shipping-address-detail"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="shippingMemo">배송 메모</Label>
                  <Textarea
                    id="shippingMemo"
                    name="shippingMemo"
                    value={formData.shippingMemo}
                    onChange={handleInputChange}
                    placeholder="배송 시 요청사항을 입력해주세요"
                    rows={3}
                    data-testid="input-shipping-memo"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                결제 방법
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod("coupon")}
                  className={cn(
                    "p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all",
                    paymentMethod === "coupon"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  data-testid="button-payment-coupon"
                >
                  <CreditCard className="w-8 h-8" />
                  <span className="font-medium">카드결제</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod("bank")}
                  className={cn(
                    "p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all",
                    paymentMethod === "bank"
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                  data-testid="button-payment-bank"
                >
                  <Building2 className="w-8 h-8" />
                  <span className="font-medium">계좌이체</span>
                </button>
              </div>

              {paymentMethod === "coupon" && (
                <CardPaymentForm 
                  onSubmit={(isValid, data) => {
                    setCardPaymentValid(isValid);
                    if (data) setCouponPaymentData(data);
                  }}
                  onChange={(data, isValid) => {
                    setCouponPaymentData(data);
                    setCardPaymentValid(isValid);
                  }}
                  totalAmount={product ? product.price * quantity : 0}
                />
              )}

              {paymentMethod === "bank" && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    계좌이체 안내
                  </h3>
                  <p className="text-amber-800 text-sm">
                    주문서 작성 완료 후, <strong>결제계좌 정보</strong>는 카카오톡 상담을 통해 안내받으실 수 있습니다.
                    <br />
                    주문 완료 페이지에서 카카오톡 링크를 클릭해주세요.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>총 결제금액</span>
                <span className="text-primary text-2xl">{calculateTotal()}원</span>
              </div>
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90"
              data-testid="button-submit-order"
            >
              {submitting ? "주문 처리 중..." : "주문하기"}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
