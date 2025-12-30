import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, Heart, ArrowRight, CreditCard, Building2 } from "lucide-react";
import { Link } from "wouter";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { CardPaymentForm } from "@/components/checkout/CardPaymentForm";
import { cn } from "@/lib/utils";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop";

type PaymentMethod = "card" | "bank" | null;
type CheckoutStep = "cart" | "payment" | "complete";

export default function Cart() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { toast } = useToast();
  const [step, setStep] = useState<CheckoutStep>("cart");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);

  const handleRemove = (id: string, name: string) => {
    removeItem(id);
    toast({
      title: "삭제 완료",
      description: `${name}이(가) 찜 목록에서 삭제되었습니다.`,
    });
  };

  const totalPrice = items.reduce((sum, item) => {
    return sum + (item.price || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      <main className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-cart-title">찜 목록</h1>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">찜한 상품이 없습니다</p>
              <p className="text-gray-400 text-sm mb-6">하트 아이콘을 눌러 마음에 드는 상품을 담아보세요</p>
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90">
                  쇼핑 계속하기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <p className="text-gray-600">
                  총 <span className="font-bold text-primary">{items.length}</span>개의 상품
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    clearWishlist();
                    toast({ title: "전체 삭제 완료", description: "찜 목록이 비워졌습니다." });
                  }}
                  data-testid="button-clear-cart"
                >
                  전체 삭제
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <Link href={`/product/${item.id}`}>
                      <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.imageUrl || DEFAULT_IMAGE} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.id}`}>
                        <h3 className="font-bold text-gray-900 hover:text-primary transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="mt-2">
                        <span className="text-lg font-bold text-primary">{item.price.toLocaleString()}</span>
                        <span className="text-sm text-gray-500">원</span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.id, item.name)}
                        className="text-gray-400 hover:text-red-500"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {step === "cart" && (
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600">총 상품 금액</span>
                    <span className="text-2xl font-bold text-primary">
                      {totalPrice.toLocaleString()}원
                    </span>
                  </div>
                  <Button 
                    className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                    onClick={() => setStep("payment")}
                    data-testid="button-checkout"
                  >
                    구매하기
                  </Button>
                </div>
              )}

              {step === "payment" && (
                <div className="mt-8 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStep("cart");
                        setPaymentMethod(null);
                      }}
                    >
                      ← 장바구니로 돌아가기
                    </Button>
                  </div>

                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-bold mb-4">결제 수단 선택</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        onClick={() => setPaymentMethod("card")}
                        className={cn(
                          "p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all",
                          paymentMethod === "card"
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        data-testid="button-payment-card"
                      >
                        <CreditCard className={cn(
                          "w-8 h-8",
                          paymentMethod === "card" ? "text-primary" : "text-gray-400"
                        )} />
                        <span className={cn(
                          "font-medium",
                          paymentMethod === "card" ? "text-primary" : "text-gray-600"
                        )}>
                          신용/체크카드
                        </span>
                      </button>
                      
                      <button
                        onClick={() => setPaymentMethod("bank")}
                        className={cn(
                          "p-4 border-2 rounded-lg flex flex-col items-center gap-2 transition-all",
                          paymentMethod === "bank"
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                        data-testid="button-payment-bank"
                      >
                        <Building2 className={cn(
                          "w-8 h-8",
                          paymentMethod === "bank" ? "text-primary" : "text-gray-400"
                        )} />
                        <span className={cn(
                          "font-medium",
                          paymentMethod === "bank" ? "text-primary" : "text-gray-600"
                        )}>
                          무통장입금
                        </span>
                      </button>
                    </div>
                  </div>

                  {paymentMethod === "card" && (
                    <div className="p-6 bg-white border rounded-lg">
                      <CardPaymentForm
                        totalAmount={totalPrice}
                        onSubmit={(isValid) => {
                          if (isValid) {
                            setStep("complete");
                            toast({
                              title: "결제 요청 완료",
                              description: "결제 승인 대기 중입니다.",
                            });
                          }
                        }}
                      />
                    </div>
                  )}

                  {paymentMethod === "bank" && (
                    <div className="p-6 bg-white border rounded-lg">
                      <h3 className="text-lg font-bold mb-4">무통장입금 안내</h3>
                      <div className="space-y-3 text-sm">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="font-medium">입금 계좌</p>
                          <p className="text-lg font-bold mt-1">국민은행 123-456-789012</p>
                          <p className="text-gray-500">예금주: 청담동에디션</p>
                        </div>
                        <div className="p-4 bg-yellow-50 rounded-lg text-yellow-800">
                          <p>• 입금 확인 후 상품이 발송됩니다</p>
                          <p>• 24시간 이내 미입금 시 주문이 취소됩니다</p>
                        </div>
                      </div>
                      <div className="mt-6 pt-4 border-t">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-gray-600">결제 금액</span>
                          <span className="text-2xl font-bold text-primary">
                            {totalPrice.toLocaleString()}원
                          </span>
                        </div>
                        <Button
                          className="w-full h-12 text-lg"
                          onClick={() => {
                            setStep("complete");
                            toast({
                              title: "주문 완료",
                              description: "입금 확인 후 처리됩니다.",
                            });
                          }}
                          data-testid="button-bank-submit"
                        >
                          주문하기
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {step === "complete" && (
                <div className="mt-8 p-8 bg-green-50 rounded-lg text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-green-800 mb-2">
                    {paymentMethod === "card" ? "결제 대기중" : "주문이 완료되었습니다"}
                  </h3>
                  <p className="text-green-600 mb-6">
                    {paymentMethod === "card" 
                      ? "결제 승인을 기다리고 있습니다. 마이페이지에서 확인하세요."
                      : "입금 확인 후 상품이 발송됩니다."
                    }
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Link href="/profile">
                      <Button variant="outline">주문 내역 보기</Button>
                    </Link>
                    <Link href="/">
                      <Button>쇼핑 계속하기</Button>
                    </Link>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
