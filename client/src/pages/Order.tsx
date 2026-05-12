import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useGlobalSale } from "@/hooks/use-global-sale";
import { CheckCircle, Package, MapPin, MessageCircle, CreditCard, Building2, Wallet, LogIn, Search, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import type { Product } from "@shared/schema";

declare global {
  interface Window {
    daum: {
      Postcode: new (config: {
        oncomplete: (data: {
          zonecode: string;
          roadAddress: string;
          jibunAddress: string;
          userSelectedType: string;
          bname: string;
          buildingName: string;
          apartment: string;
        }) => void;
        width?: string | number;
        height?: string | number;
      }) => { open: () => void };
    };
  }
}

type PaymentMethod = "card" | "bank" | null;


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
  const { calculateSalePrice, hasSale } = useGlobalSale();
  
  const isCartOrder = id === "cart";
  const [cartItems, setCartItems] = useState<Array<{id: string; name: string; price: number; imageUrl: string; selectedSize?: string; selectedColor?: string}>>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("bank");
  const [completedPaymentMethod, setCompletedPaymentMethod] = useState<PaymentMethod>(null);
  const [memberPointBalance, setMemberPointBalance] = useState(0);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [pointInputValue, setPointInputValue] = useState("");
  const [kakaoLink, setKakaoLink] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  
  const searchParams = new URLSearchParams(window.location.search);
  const quantityParam = parseInt(searchParams.get("quantity") || "1");
  const optionParam = searchParams.get("option") || "";
  const [quantity] = useState(quantityParam);

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

  const parseOptionParam = (param: string): { color: string; size: string } => {
    let color = "";
    let size = "";
    if (!param) return { color, size };
    const parts = param.split(" / ");
    for (const part of parts) {
      if (part.startsWith("컬러:")) color = part.replace("컬러:", "");
      else if (part.startsWith("사이즈:")) size = part.replace("사이즈:", "");
    }
    return { color, size };
  };

  const initialOption = parseOptionParam(optionParam);

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
    selectedSize: initialOption.size,
    selectedColor: initialOption.color,
  });

  const [depositAccount, setDepositAccount] = useState<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  } | null>(null);

  useEffect(() => {
    const memberToken = localStorage.getItem("memberToken");
    if (!memberToken) {
      setIsLoggedIn(false);
      return;
    }
    fetch("/api/members/me", {
      headers: { Authorization: `Bearer ${memberToken}` },
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setIsLoggedIn(true);
          const name = data.data.name || "";
          const email = data.data.email || "";
          const phone = data.data.phone || "";
          setFormData(prev => ({
            ...prev,
            memberName: name,
            memberEmail: email,
            memberPhone: phone,
            shippingName: name,
            shippingPhone: phone,
          }));
        } else {
          setIsLoggedIn(false);
        }
      })
      .catch(() => setIsLoggedIn(false));
  }, []);

  useEffect(() => {
    const fetchDepositAccount = async () => {
      try {
        const res = await fetch("/api/settings/deposit_account");
        const data = await res.json();
        if (data.success && data.data?.value) {
          try {
            const parsed = JSON.parse(data.data.value);
            if (parsed.bankName && parsed.accountNumber) {
              setDepositAccount(parsed);
            }
          } catch {}
        }
      } catch {}
    };
    fetchDepositAccount();
  }, []);

  useEffect(() => {
    const fetchMemberPoints = async () => {
      const memberToken = localStorage.getItem("memberToken");
      if (!memberToken) return;
      
      try {
        const res = await fetch("/api/members/me", {
          headers: {
            Authorization: `Bearer ${memberToken}`,
          },
        });
        const data = await res.json();
        if (data.success && data.data && typeof data.data.pointBalance === 'number') {
          setMemberPointBalance(data.data.pointBalance);
        }
      } catch {}
    };
    fetchMemberPoints();
    fetch("/api/settings/kakaoTalkLink")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.value) setKakaoLink(data.data.value);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isCartOrder) {
      const stored = sessionStorage.getItem("cartOrderItems");
      const storedMethod = sessionStorage.getItem("cartPaymentMethod");
      if (stored) {
        try {
          const items = JSON.parse(stored);
          setCartItems(items);
          if (storedMethod === "bank") {
            setPaymentMethod("bank");
          }
        } catch {}
      }
      setLoading(false);
      return;
    }

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

  const handleAddressSearch = () => {
    if (!window.daum?.Postcode) {
      toast({
        title: "오류",
        description: "주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data) => {
        let fullAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        let extraAddress = "";
        if (data.userSelectedType === "R") {
          if (data.bname) extraAddress += data.bname;
          if (data.buildingName) {
            extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
          }
          if (extraAddress) fullAddress += ` (${extraAddress})`;
        }
        setFormData(prev => ({
          ...prev,
          shippingZipcode: data.zonecode,
          shippingAddress: fullAddress,
        }));
        setTimeout(() => {
          document.getElementById("shippingAddressDetail")?.focus();
        }, 100);
      },
    }).open();
  };

  const getEffectivePrice = () => {
    if (!product) return 0;
    let price = Number(product.price);
    if (product.discountPercent && product.discountPercent > 0) {
      price = Math.round(price * (100 - product.discountPercent) / 100 / 1000) * 1000;
    } else if (hasSale) {
      price = calculateSalePrice(price);
    }
    return price;
  };

  const calculateSubtotal = () => {
    if (isCartOrder) {
      return cartItems.reduce((sum, item) => sum + item.price, 0);
    }
    if (!product) return 0;
    const effectivePrice = getEffectivePrice();
    return effectivePrice * quantity;
  };

  const calculateTotal = () => {
    if (isCartOrder && cartItems.length > 0) {
      const subtotal = calculateSubtotal();
      return Math.max(0, subtotal - pointsToUse).toLocaleString();
    }
    if (!product) return "0";
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - pointsToUse).toLocaleString();
  };

  const handlePointInput = (value: string) => {
    setPointInputValue(value);
    const numValue = parseInt(value.replace(/,/g, "")) || 0;
    const maxPoints = Math.min(memberPointBalance, calculateSubtotal());
    const validPoints = Math.max(0, Math.min(numValue, maxPoints));
    setPointsToUse(validPoints);
  };

  const handleUseAllPoints = () => {
    const maxPoints = Math.min(memberPointBalance, calculateSubtotal());
    setPointsToUse(maxPoints);
    setPointInputValue(maxPoints.toLocaleString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isCartOrder && !product) return;
    if (isCartOrder && cartItems.length === 0) return;
    
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

    if (!isCartOrder && product) {
      const opts = parseProductOptions(product.options);
      if (opts.colors.length > 0 && !formData.selectedColor) {
        toast({ title: "입력 오류", description: "컬러를 선택해주세요.", variant: "destructive" });
        return;
      }
      if (opts.sizes.length > 0 && !formData.selectedSize) {
        toast({ title: "입력 오류", description: "사이즈를 선택해주세요.", variant: "destructive" });
        return;
      }
    }

    const memberToken = localStorage.getItem("memberToken");
    
    setSubmitting(true);
    
    try {
      const orderBody = isCartOrder ? {
        memberName: formData.memberName,
        memberEmail: formData.memberEmail,
        memberPhone: formData.memberPhone,
        shippingName: formData.shippingName,
        shippingPhone: formData.shippingPhone,
        shippingZipcode: formData.shippingZipcode,
        shippingAddress: formData.shippingAddress,
        shippingAddressDetail: formData.shippingAddressDetail,
        shippingMemo: formData.shippingMemo,
        isCartOrder: true,
        cartItems: cartItems.map(item => ({
          productId: item.id,
          productName: item.name,
          productPrice: item.price,
          quantity: 1,
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null,
        })),
        totalAmount: calculateSubtotal() - pointsToUse,
        pointsUsed: pointsToUse,
        paymentMethod: paymentMethod || undefined,
      } : {
        memberName: formData.memberName,
        memberEmail: formData.memberEmail,
        memberPhone: formData.memberPhone,
        shippingName: formData.shippingName,
        shippingPhone: formData.shippingPhone,
        shippingZipcode: formData.shippingZipcode,
        shippingAddress: formData.shippingAddress,
        shippingAddressDetail: formData.shippingAddressDetail,
        shippingMemo: formData.shippingMemo,
        productId: product!.id,
        productName: product!.name,
        productPrice: getEffectivePrice(),
        quantity,
        selectedSize: formData.selectedSize || null,
        selectedColor: formData.selectedColor || null,
        totalAmount: calculateSubtotal() - pointsToUse,
        pointsUsed: pointsToUse,
        paymentMethod: paymentMethod || undefined,
      };

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (memberToken) headers["Authorization"] = `Bearer ${memberToken}`;

      const res = await fetch("/api/orders", {
        method: "POST",
        headers,
        body: JSON.stringify(orderBody),
      });

      const data = await res.json();
      
      if (data.success) {
        const createdOrderNumber = data.data.orderNumber;
        setOrderNumber(createdOrderNumber);
        setCompletedPaymentMethod(paymentMethod);
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
      <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-[#888888]">상품 정보를 불러오는 중...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isCartOrder && !product) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-4">상품을 찾을 수 없습니다</h1>
            <Button className="bg-[#c9a96e] hover:bg-[#b8945f] text-black font-semibold" onClick={() => setLocation("/products")}>상품 목록으로 돌아가기</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
        <Header />
        <main className="flex-1 py-8 sm:py-12">
          <div className="max-w-2xl mx-auto px-4">
            <div className="bg-[#161616] border border-[#2a2a2a] p-6 sm:p-10 text-center">
              <div className="w-20 h-20 bg-[#1a1500] border border-[#c9a96e]/40 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-[#c9a96e]" />
              </div>
              
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
                주문이 완료되었습니다
              </h1>
              
              <p className="text-[#888888] mb-6">
                주문번호: <span className="font-bold text-[#c9a96e]">{orderNumber}</span>
              </p>

              {completedPaymentMethod === "card" ? (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 sm:p-6 mb-6">
                  <h2 className="font-bold text-white mb-3 flex items-center justify-center gap-2">
                    <CreditCard className="w-5 h-5 text-[#c9a96e]" />
                    카드결제 안내
                  </h2>
                  <div className="bg-[#111111] border border-[#2a2a2a] p-4">
                    <div className="grid gap-2 text-left">
                      <div className="flex justify-between items-center py-1 border-b border-[#2a2a2a]">
                        <span className="text-[#888888] text-sm">결제수단</span>
                        <span className="font-bold text-white">신용카드</span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="text-[#888888] text-sm">결제금액</span>
                        <span className="font-bold text-[#c9a96e]">{calculateTotal()}원</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-[#888888] text-sm mt-3">
                    카드결제 안내는 <strong className="text-white">카카오톡 상담</strong>을 통해 받으실 수 있습니다.
                  </p>
                  {kakaoLink && (
                    <a
                      href={kakaoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full mt-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-bold py-3 px-6 transition-colors"
                      data-testid="link-kakao-card"
                    >
                      <KakaoIcon className="w-5 h-5" />
                      카카오톡으로 카드결제 안내받기
                    </a>
                  )}
                </div>
              ) : (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 sm:p-6 mb-6">
                  <h2 className="font-bold text-white mb-3 flex items-center justify-center gap-2">
                    <Building2 className="w-5 h-5 text-[#c9a96e]" />
                    결제계좌 안내
                  </h2>
                  
                  {depositAccount ? (
                    <div className="space-y-4">
                      <div className="bg-[#111111] border border-[#2a2a2a] p-4">
                        <div className="grid gap-2 text-left">
                          <div className="flex justify-between items-center py-1 border-b border-[#2a2a2a]">
                            <span className="text-[#888888] text-sm">은행</span>
                            <span className="font-bold text-white">{depositAccount.bankName}</span>
                          </div>
                          <div className="flex justify-between items-center py-1 border-b border-[#2a2a2a]">
                            <span className="text-[#888888] text-sm">계좌번호</span>
                            <span className="font-bold text-white font-mono">{depositAccount.accountNumber}</span>
                          </div>
                          <div className="flex justify-between items-center py-1">
                            <span className="text-[#888888] text-sm">예금주</span>
                            <span className="font-bold text-white">{depositAccount.accountHolder}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[#888888] text-sm">
                        위 계좌로 <strong className="text-[#c9a96e]">{calculateTotal()}원</strong>을 입금해 주세요.
                        <br />
                        입금 확인 후 상품이 발송됩니다.
                      </p>
                    </div>
                  ) : (
                    <p className="text-[#888888] text-sm">
                      결제계좌 정보를 불러오는 중입니다. 잠시 후 다시 확인해주세요.
                    </p>
                  )}
                </div>
              )}

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 mb-6 text-left">
                <h3 className="font-bold text-white mb-3">주문 상품 정보</h3>
                {isCartOrder ? (
                  <div className="space-y-3">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="w-16 h-16 bg-[#0f0f0f] border border-[#2a2a2a] overflow-hidden shrink-0">
                          <img src={getProxiedImageUrl(item.imageUrl) || DEFAULT_IMAGE} alt={item.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }} />
                        </div>
                        <div>
                          <p className="font-medium text-[#f0f0f0] text-sm">{item.name}</p>
                          <p className="text-[#c9a96e] font-bold text-sm">{item.price.toLocaleString()}원</p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t border-[#2a2a2a] pt-2 mt-2">
                      <p className="text-[#c9a96e] font-bold">{calculateTotal()}원</p>
                    </div>
                  </div>
                ) : product && (
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-[#0f0f0f] border border-[#2a2a2a] overflow-hidden shrink-0">
                      <img src={getProxiedImageUrl(product.imageUrl) || DEFAULT_IMAGE} alt={product.name}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }} />
                    </div>
                    <div>
                      <p className="font-medium text-[#f0f0f0]">{product.name}</p>
                      <p className="text-sm text-[#888888]">수량: {quantity}개</p>
                      <p className="text-[#c9a96e] font-bold mt-1">{calculateTotal()}원</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button variant="outline" onClick={() => setLocation("/")}
                  className="sm:w-auto border-[#333333] bg-transparent text-[#888888] hover:border-[#c9a96e] hover:text-white">
                  홈으로 돌아가기
                </Button>
                <Button onClick={() => isLoggedIn ? setLocation("/profile") : setLocation(`/orders?orderNumber=${encodeURIComponent(orderNumber)}`)}
                  className="sm:w-auto bg-[#c9a96e] hover:bg-[#b8945f] text-black font-semibold">
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
    <div className="min-h-screen flex flex-col bg-[#0f0f0f]">
      <Header />
        
        <main className="flex-1 py-6 sm:py-10">
          <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 text-center" style={{ letterSpacing: "0.04em" }}>
            주문서 작성
          </h1>

          {!isLoggedIn && (
            <div className="bg-[#1a1a1a] border border-[#333333] p-4 flex items-start gap-3 mb-5">
              <LogIn className="w-5 h-5 text-[#999999] mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#f0f0f0]">비회원으로 주문하시나요?</p>
                <p className="text-xs text-[#888888] mt-0.5">아래 주문자 정보를 직접 입력하시면 비회원 주문이 가능합니다. 회원 로그인 시 정보가 자동으로 입력되며 적립금도 받으실 수 있습니다.</p>
              </div>
              <button type="button" onClick={() => setLocation("/login")}
                className="text-xs text-[#c9a96e] underline underline-offset-2 whitespace-nowrap flex-shrink-0">
                로그인하기
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="bg-[#161616] border border-[#2a2a2a] p-4 sm:p-6">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2 tracking-wide">
                <Package className="w-4 h-4 text-[#c9a96e]" />
                주문 상품
              </h2>
              
              {isCartOrder ? (
                <div className="space-y-3">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center border-b border-[#2a2a2a] last:border-b-0 pb-3 last:pb-0">
                      <div className="w-20 h-20 bg-[#0f0f0f] border border-[#2a2a2a] overflow-hidden shrink-0">
                        <img src={getProxiedImageUrl(item.imageUrl) || DEFAULT_IMAGE} alt={item.name}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-[#f0f0f0]">{item.name}</h3>
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="text-xs text-[#888888] mt-1">
                            {item.selectedSize && `사이즈: ${item.selectedSize}`}
                            {item.selectedSize && item.selectedColor && " / "}
                            {item.selectedColor && `색상: ${item.selectedColor}`}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-[#888888]">수량: 1개</span>
                          <span className="font-bold text-[#c9a96e]">{item.price.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-[#2a2a2a] pt-3 flex justify-between items-center">
                    <span className="font-bold text-white">합계</span>
                    <span className="font-bold text-[#c9a96e] text-lg">{calculateTotal()}원</span>
                  </div>
                </div>
              ) : product && (
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 bg-[#0f0f0f] border border-[#2a2a2a] overflow-hidden shrink-0">
                    <img src={getProxiedImageUrl(product.imageUrl) || DEFAULT_IMAGE} alt={product.name}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-[#f0f0f0]">{product.name}</h3>
                    {product.sku && <p className="text-sm text-[#888888]">SKU: {product.sku}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-[#888888]">수량: {quantity}개</span>
                      <span className="font-bold text-[#c9a96e] text-lg">{calculateTotal()}원</span>
                    </div>
                  </div>
                </div>
              )}
              
              {!isCartOrder && product && (() => {
                const opts = parseProductOptions(product.options);
                const hasColors = opts.colors.length > 0;
                const hasSizes = opts.sizes.length > 0;
                const hasExtras = opts.extras.length > 0;
                if (!hasColors && !hasSizes && !hasExtras) return null;
                return (
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <h3 className="text-sm font-medium text-[#888888] mb-3">선택옵션</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {hasColors && (
                        <div>
                          <Label className="text-[#aaaaaa]">컬러</Label>
                          <select id="selectedColor" value={formData.selectedColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, selectedColor: e.target.value }))}
                            className="w-full h-10 px-3 border border-[#333333] text-sm bg-[#1a1a1a] text-[#f0f0f0] focus:outline-none focus:border-[#c9a96e] mt-1"
                            data-testid="select-order-color">
                            <option value="">컬러 선택</option>
                            {opts.colors.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      )}
                      {hasSizes && (
                        <div>
                          <Label className="text-[#aaaaaa]">사이즈</Label>
                          <select id="selectedSize" value={formData.selectedSize}
                            onChange={(e) => setFormData(prev => ({ ...prev, selectedSize: e.target.value }))}
                            className="w-full h-10 px-3 border border-[#333333] text-sm bg-[#1a1a1a] text-[#f0f0f0] focus:outline-none focus:border-[#c9a96e] mt-1"
                            data-testid="select-order-size">
                            <option value="">사이즈 선택</option>
                            {opts.sizes.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      )}
                      {opts.extras.map((extra) => (
                        <div key={extra.label}>
                          <Label className="text-[#aaaaaa]">{extra.label}</Label>
                          <select value="" onChange={() => {}}
                            className="w-full h-10 px-3 border border-[#333333] text-sm bg-[#1a1a1a] text-[#f0f0f0] focus:outline-none focus:border-[#c9a96e] mt-1"
                            data-testid={`select-order-extra-${extra.label}`}>
                            <option value="">{extra.label} 선택</option>
                            {extra.values.map((v) => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                    {(formData.selectedColor || formData.selectedSize) && (
                      <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-3 text-sm mt-3">
                        <span className="text-[#888888]">
                          {[formData.selectedColor && `컬러: ${formData.selectedColor}`, formData.selectedSize && `사이즈: ${formData.selectedSize}`].filter(Boolean).join(' / ')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div className="bg-[#161616] border border-[#2a2a2a] p-4 sm:p-6">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2 tracking-wide">
                <User className="w-4 h-4 text-[#c9a96e]" />
                주문자 정보
              </h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-[#aaaaaa]">이름 *</Label>
                  <Input id="memberName" name="memberName" value={formData.memberName} onChange={handleInputChange}
                    placeholder="홍길동" required data-testid="input-member-name"
                    className="bg-[#0f0f0f] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0" />
                </div>
                <div>
                  <Label className="text-[#aaaaaa]">연락처 *</Label>
                  <Input id="memberPhone" name="memberPhone" value={formData.memberPhone} onChange={handleInputChange}
                    placeholder="010-0000-0000" required data-testid="input-member-phone"
                    className="bg-[#0f0f0f] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[#aaaaaa]">이메일 *</Label>
                  <Input id="memberEmail" name="memberEmail" type="email" value={formData.memberEmail} onChange={handleInputChange}
                    placeholder="example@email.com" required data-testid="input-member-email"
                    className="bg-[#0f0f0f] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0" />
                </div>
              </div>
            </div>

            <div className="bg-[#161616] border border-[#2a2a2a] p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-white flex items-center gap-2 tracking-wide">
                  <MapPin className="w-4 h-4 text-[#c9a96e]" />
                  배송지 정보
                </h2>
                <label className="flex items-center gap-2 text-sm cursor-pointer text-[#888888]">
                  <input type="checkbox" checked={formData.sameAsOrderer}
                    onChange={(e) => handleSameAsOrderer(e.target.checked)}
                    className="w-4 h-4 accent-[#c9a96e] border-[#333333]" />
                  <span>주문자 정보와 동일</span>
                </label>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label className="text-[#aaaaaa]">받는 분 *</Label>
                  <Input id="shippingName" name="shippingName" value={formData.shippingName} onChange={handleInputChange}
                    placeholder="홍길동" required data-testid="input-shipping-name"
                    className="bg-[#0f0f0f] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0" />
                </div>
                <div>
                  <Label className="text-[#aaaaaa]">연락처 *</Label>
                  <Input id="shippingPhone" name="shippingPhone" value={formData.shippingPhone} onChange={handleInputChange}
                    placeholder="010-0000-0000" required data-testid="input-shipping-phone"
                    className="bg-[#0f0f0f] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[#aaaaaa]">우편번호 *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="shippingZipcode"
                      name="shippingZipcode"
                      value={formData.shippingZipcode}
                      readOnly
                      placeholder="우편번호"
                      className="flex-1 bg-[#111111] border-[#333333] text-[#f0f0f0] cursor-pointer"
                      onClick={handleAddressSearch}
                      data-testid="input-shipping-zipcode"
                    />
                    <Button type="button" variant="outline" onClick={handleAddressSearch}
                      className="shrink-0 gap-1.5 border-[#333333] bg-[#1a1a1a] text-[#888888] hover:border-[#c9a96e] hover:text-white"
                      data-testid="button-address-search">
                      <Search className="w-4 h-4" />
                      주소 검색
                    </Button>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="shippingAddress">주소 *</Label>
                  <Input
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    readOnly
                    placeholder="주소 검색 버튼을 눌러주세요"
                    className="bg-[#111111] border-[#333333] text-[#f0f0f0] cursor-pointer"
                    onClick={handleAddressSearch}
                    required
                    data-testid="input-shipping-address"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[#aaaaaa]">상세주소</Label>
                  <Input id="shippingAddressDetail" name="shippingAddressDetail" value={formData.shippingAddressDetail} onChange={handleInputChange}
                    placeholder="101동 1001호" data-testid="input-shipping-address-detail"
                    className="bg-[#0f0f0f] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0" />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-[#aaaaaa]">배송 메모</Label>
                  <Textarea id="shippingMemo" name="shippingMemo" value={formData.shippingMemo} onChange={handleInputChange}
                    placeholder="배송 시 요청사항을 입력해주세요" rows={3} data-testid="input-shipping-memo"
                    className="bg-[#0f0f0f] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0 resize-none" />
                </div>
              </div>
            </div>

            {memberPointBalance > 0 && (
              <div className="bg-[#161616] border border-[#2a2a2a] p-4 sm:p-6">
                <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2 tracking-wide">
                  <Wallet className="w-4 h-4 text-[#c9a96e]" />
                  포인트 사용
                </h2>
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[#888888]">보유 포인트</span>
                    <span className="font-bold text-[#c9a96e]">{memberPointBalance.toLocaleString()}P</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input type="text" placeholder="사용할 포인트" value={pointInputValue}
                      onChange={(e) => handlePointInput(e.target.value)}
                      className="h-11 bg-[#0f0f0f] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0"
                      data-testid="input-points" />
                  </div>
                  <Button type="button" variant="outline" onClick={handleUseAllPoints}
                    className="whitespace-nowrap border-[#333333] bg-transparent text-[#888888] hover:border-[#c9a96e] hover:text-white">
                    전액 사용
                  </Button>
                </div>
                {pointsToUse > 0 && (
                  <div className="mt-3 text-sm text-[#c9a96e] font-medium">
                    {pointsToUse.toLocaleString()}P 적용됨 (-{pointsToUse.toLocaleString()}원)
                  </div>
                )}
              </div>
            )}

            <div className="bg-[#161616] border border-[#2a2a2a] p-4 sm:p-6">
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2 tracking-wide">
                <CreditCard className="w-4 h-4 text-[#c9a96e]" />
                결제 방법
              </h2>
              <div className="mb-4">
                <div className="p-4 border-2 border-[#c9a96e] bg-[#1a1500] flex flex-col items-center gap-2 text-[#c9a96e]"
                  data-testid="button-payment-bank">
                  <Building2 className="w-8 h-8" />
                  <span className="font-medium">계좌이체</span>
                </div>
              </div>
              {paymentMethod === "bank" && (
                <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-4">
                  <p className="text-[#888888] text-sm flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-[#999999] shrink-0" />
                    주문 완료 후 결제계좌 정보가 안내됩니다. 해당 계좌로 입금해주세요.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-[#161616] border border-[#2a2a2a] p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[#888888]">
                  <span>상품금액</span>
                  <span>{calculateSubtotal().toLocaleString()}원</span>
                </div>
                {pointsToUse > 0 && (
                  <div className="flex justify-between items-center text-[#888888]">
                    <span>포인트 할인</span>
                    <span>-{pointsToUse.toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold pt-3 border-t border-[#2a2a2a]">
                  <span className="text-white">총 결제금액</span>
                  <span className="text-[#c9a96e] text-2xl">{calculateTotal()}원</span>
                </div>
              </div>
            </div>

            <Button type="submit" disabled={submitting || !paymentMethod}
              className="w-full h-14 text-lg font-semibold bg-[#c9a96e] hover:bg-[#b8945f] text-black tracking-wide"
              data-testid="button-submit-order">
              {submitting ? "주문 처리 중..." : "주문하기"}
            </Button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
