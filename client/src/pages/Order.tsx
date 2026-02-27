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
import { CheckCircle, Package, User, MapPin, MessageCircle, Building2, Wallet, LogIn, Search } from "lucide-react";
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

type PaymentMethod = "bank" | null;


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
    if (!memberToken) {
      setIsLoggedIn(false);
      return;
    }
    
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

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${memberToken}`,
        },
        body: JSON.stringify(orderBody),
      });

      const data = await res.json();
      
      if (res.status === 401) {
        setIsLoggedIn(false);
        toast({
          title: "로그인 필요",
          description: "로그인 세션이 만료되었습니다. 다시 로그인해주세요.",
          variant: "destructive",
        });
        return;
      }
      
      if (data.success) {
        const createdOrderNumber = data.data.orderNumber;

        setOrderNumber(createdOrderNumber);
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

  if (loading || isLoggedIn === null) {
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

  if (isLoggedIn === false) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="max-w-md w-full mx-auto px-4">
            <div className="bg-white rounded-xl shadow-lg p-8 sm:p-10 text-center" data-testid="login-required-notice">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogIn className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">로그인이 필요합니다</h2>
              <p className="text-gray-500 mb-6 text-sm leading-relaxed">
                주문하시려면 회원 로그인이 필요합니다.<br />
                아직 회원이 아니시라면 회원가입 후 이용해주세요.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  data-testid="button-go-login"
                  className="w-full bg-black text-white hover:bg-gray-800"
                  onClick={() => setLocation("/login")}
                >
                  로그인하기
                </Button>
                <Button
                  data-testid="button-go-signup"
                  variant="outline"
                  className="w-full"
                  onClick={() => setLocation("/signup")}
                >
                  회원가입
                </Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!isCartOrder && !product) {
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
                  <Building2 className="w-5 h-5" />
                  결제계좌 안내
                </h2>
                
                {depositAccount ? (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg p-4 border border-amber-300">
                      <div className="grid gap-2 text-left">
                        <div className="flex justify-between items-center py-1 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">은행</span>
                          <span className="font-bold text-gray-900">{depositAccount.bankName}</span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-gray-100">
                          <span className="text-gray-600 text-sm">계좌번호</span>
                          <span className="font-bold text-gray-900 font-mono">{depositAccount.accountNumber}</span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-gray-600 text-sm">예금주</span>
                          <span className="font-bold text-gray-900">{depositAccount.accountHolder}</span>
                        </div>
                      </div>
                    </div>
                    <p className="text-amber-800 text-sm">
                      위 계좌로 <strong>{calculateTotal()}원</strong>을 입금해 주세요.
                      <br />
                      입금 확인 후 상품이 발송됩니다.
                    </p>
                    <a
                      href={kakaoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-bold py-3 px-6 rounded-lg transition-colors"
                      data-testid="link-kakao-inquiry"
                    >
                      <KakaoIcon className="w-5 h-5" />
                      카카오톡 문의하기
                    </a>
                  </div>
                ) : (
                  <>
                    <p className="text-amber-800 mb-4">
                      결제계좌 정보는 <strong>카카오톡 상담</strong>을 통해 안내받으실 수 있습니다.
                      <br />
                      아래 버튼을 눌러 카카오톡으로 이동해주세요.
                    </p>
                    <a
                      href={kakaoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[#FEE500] hover:bg-[#FDD835] text-[#3C1E1E] font-bold py-4 px-8 rounded-lg text-lg transition-colors"
                      data-testid="link-kakao-payment"
                    >
                      <KakaoIcon className="w-6 h-6" />
                      카카오톡으로 결제계좌 안내받기
                    </a>
                  </>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-bold text-gray-900 mb-3">주문 상품 정보</h3>
                {isCartOrder ? (
                  <div className="space-y-3">
                    {cartItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 items-center">
                        <div className="w-16 h-16 bg-white rounded border overflow-hidden shrink-0">
                          <img
                            src={getProxiedImageUrl(item.imageUrl) || DEFAULT_IMAGE}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                            onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                          />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{item.name}</p>
                          <p className="text-primary font-bold text-sm">{item.price.toLocaleString()}원</p>
                        </div>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <p className="text-primary font-bold">{calculateTotal()}원</p>
                    </div>
                  </div>
                ) : product && (
                  <div className="flex gap-4">
                    <div className="w-20 h-20 bg-white rounded border overflow-hidden shrink-0">
                      <img
                        src={getProxiedImageUrl(product.imageUrl) || DEFAULT_IMAGE}
                        alt={product.name}
                        className="w-full h-full object-contain p-2"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = DEFAULT_IMAGE;
                        }}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">수량: {quantity}개</p>
                      <p className="text-primary font-bold mt-1">{calculateTotal()}원</p>
                    </div>
                  </div>
                )}
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
              
              {isCartOrder ? (
                <div className="space-y-3">
                  {cartItems.map((item, idx) => (
                    <div key={idx} className="flex gap-4 items-center border-b last:border-b-0 pb-3 last:pb-0">
                      <div className="w-20 h-20 bg-gray-50 rounded-lg border overflow-hidden shrink-0">
                        <img
                          src={getProxiedImageUrl(item.imageUrl) || DEFAULT_IMAGE}
                          alt={item.name}
                          className="w-full h-full object-contain p-2"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-900">{item.name}</h3>
                        {(item.selectedSize || item.selectedColor) && (
                          <p className="text-xs text-gray-500 mt-1">
                            {item.selectedSize && `사이즈: ${item.selectedSize}`}
                            {item.selectedSize && item.selectedColor && " / "}
                            {item.selectedColor && `색상: ${item.selectedColor}`}
                          </p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-sm text-gray-500">수량: 1개</span>
                          <span className="font-bold text-primary">{item.price.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="border-t pt-3 flex justify-between items-center">
                    <span className="font-bold text-gray-900">합계</span>
                    <span className="font-bold text-primary text-lg">{calculateTotal()}원</span>
                  </div>
                </div>
              ) : product && (
                <div className="flex gap-4 items-center">
                  <div className="w-24 h-24 bg-gray-50 rounded-lg border overflow-hidden shrink-0">
                    <img
                      src={getProxiedImageUrl(product.imageUrl) || DEFAULT_IMAGE}
                      alt={product.name}
                      className="w-full h-full object-contain p-2"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = DEFAULT_IMAGE;
                      }}
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
              )}
              
              {!isCartOrder && product && (() => {
                const opts = parseProductOptions(product.options);
                const hasColors = opts.colors.length > 0;
                const hasSizes = opts.sizes.length > 0;
                const hasExtras = opts.extras.length > 0;
                if (!hasColors && !hasSizes && !hasExtras) return null;
                return (
                  <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">선택옵션</h3>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {hasColors && (
                        <div>
                          <Label htmlFor="selectedColor">컬러</Label>
                          <select
                            id="selectedColor"
                            value={formData.selectedColor}
                            onChange={(e) => setFormData(prev => ({ ...prev, selectedColor: e.target.value }))}
                            className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-black mt-1"
                            data-testid="select-order-color"
                          >
                            <option value="">컬러 선택</option>
                            {opts.colors.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {hasSizes && (
                        <div>
                          <Label htmlFor="selectedSize">사이즈</Label>
                          <select
                            id="selectedSize"
                            value={formData.selectedSize}
                            onChange={(e) => setFormData(prev => ({ ...prev, selectedSize: e.target.value }))}
                            className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-black mt-1"
                            data-testid="select-order-size"
                          >
                            <option value="">사이즈 선택</option>
                            {opts.sizes.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      {opts.extras.map((extra) => (
                        <div key={extra.label}>
                          <Label>{extra.label}</Label>
                          <select
                            value=""
                            onChange={() => {}}
                            className="w-full h-10 px-3 border border-gray-300 rounded text-sm bg-white focus:outline-none focus:border-black mt-1"
                            data-testid={`select-order-extra-${extra.label}`}
                          >
                            <option value="">{extra.label} 선택</option>
                            {extra.values.map((v) => (
                              <option key={v} value={v}>{v}</option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    {(formData.selectedColor || formData.selectedSize) && (
                      <div className="bg-gray-50 rounded p-3 text-sm mt-3">
                        <span className="text-gray-600">
                          {[
                            formData.selectedColor && `컬러: ${formData.selectedColor}`,
                            formData.selectedSize && `사이즈: ${formData.selectedSize}`,
                          ].filter(Boolean).join(' / ')}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
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
                <div className="sm:col-span-2">
                  <Label>우편번호 *</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="shippingZipcode"
                      name="shippingZipcode"
                      value={formData.shippingZipcode}
                      readOnly
                      placeholder="우편번호"
                      className="flex-1 bg-gray-50 cursor-pointer"
                      onClick={handleAddressSearch}
                      data-testid="input-shipping-zipcode"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddressSearch}
                      className="shrink-0 gap-1.5"
                      data-testid="button-address-search"
                    >
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
                    className="bg-gray-50 cursor-pointer"
                    onClick={handleAddressSearch}
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

            {memberPointBalance > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  포인트 사용
                </h2>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-800">보유 포인트</span>
                    <span className="font-bold text-amber-900">{memberPointBalance.toLocaleString()}P</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="사용할 포인트"
                      value={pointInputValue}
                      onChange={(e) => handlePointInput(e.target.value)}
                      className="h-11"
                      data-testid="input-points"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleUseAllPoints}
                    className="whitespace-nowrap"
                  >
                    전액 사용
                  </Button>
                </div>

                {pointsToUse > 0 && (
                  <div className="mt-3 text-sm text-green-600 font-medium">
                    {pointsToUse.toLocaleString()}P 적용됨 (-{pointsToUse.toLocaleString()}원)
                  </div>
                )}
              </div>
            )}

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                결제 방법
              </h2>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  계좌이체 안내
                </h3>
                {depositAccount ? (
                  <div className="text-amber-800 text-sm space-y-2">
                    <p>주문서 작성 완료 후, 아래 계좌로 입금해주세요.</p>
                    <div className="bg-white/50 rounded-lg p-3 border border-amber-200">
                      <div className="grid grid-cols-[80px_1fr] gap-1">
                        <span className="text-amber-700">은행명:</span>
                        <span className="font-bold text-amber-900">{depositAccount.bankName}</span>
                        <span className="text-amber-700">계좌번호:</span>
                        <span className="font-bold text-amber-900">{depositAccount.accountNumber}</span>
                        <span className="text-amber-700">예금주:</span>
                        <span className="font-bold text-amber-900">{depositAccount.accountHolder}</span>
                      </div>
                    </div>
                    <p className="text-xs text-amber-600">※ 입금 시 주문자명으로 입금해주세요.</p>
                  </div>
                ) : (
                  <p className="text-amber-800 text-sm">
                    주문서 작성 완료 후, <strong>결제계좌 정보</strong>는 카카오톡 상담을 통해 안내받으실 수 있습니다.
                    <br />
                    주문 완료 페이지에서 카카오톡 링크를 클릭해주세요.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex justify-between items-center text-gray-600">
                  <span>상품금액</span>
                  <span>{calculateSubtotal().toLocaleString()}원</span>
                </div>
                {pointsToUse > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>포인트 할인</span>
                    <span>-{pointsToUse.toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-lg font-bold pt-2 border-t">
                  <span>총 결제금액</span>
                  <span className="text-primary text-2xl">{calculateTotal()}원</span>
                </div>
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
