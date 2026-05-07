import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Search, Truck, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OrderInfo {
  id: string;
  orderNumber: string;
  productName: string | null;
  quantity: number | null;
  totalAmount: number;
  status: string | null;
  paymentStatus: string | null;
  trackingNumber: string | null;
  shippingCompany: string | null;
  createdAt: string | null;
  memberName: string;
  memberPhone: string;
  shippingAddress: string;
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "주문접수", color: "text-yellow-600 bg-yellow-50", icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: "주문확인", color: "text-blue-600 bg-blue-50", icon: <CheckCircle className="w-4 h-4" /> },
  shipped: { label: "배송중", color: "text-purple-600 bg-purple-50", icon: <Truck className="w-4 h-4" /> },
  delivered: { label: "배송완료", color: "text-green-600 bg-green-50", icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: "주문취소", color: "text-red-600 bg-red-50", icon: <XCircle className="w-4 h-4" /> },
};

const paymentLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "결제대기", color: "text-yellow-600" },
  paid: { label: "결제완료", color: "text-green-600" },
  refunded: { label: "환불완료", color: "text-red-600" },
};

export default function OrderInquiry() {
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const on = params.get("orderNumber");
    if (on) setOrderNumber(on);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!orderNumber.trim()) {
      toast({
        title: "입력 오류",
        description: "주문번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    if (!phone.trim()) {
      toast({
        title: "입력 오류",
        description: "연락처를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const res = await fetch(`/api/orders/lookup?orderNumber=${encodeURIComponent(orderNumber.trim())}&phone=${encodeURIComponent(phone.replace(/-/g, ""))}`);
      const data = await res.json();
      
      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        setOrder(null);
        toast({
          title: "조회 결과 없음",
          description: "주문번호와 연락처가 일치하는 주문이 없습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setOrder(null);
      toast({
        title: "조회 오류",
        description: "주문 조회 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusInfo = (status: string | null) => {
    return statusLabels[status || "pending"] || statusLabels.pending;
  };

  const getPaymentInfo = (status: string | null) => {
    return paymentLabels[status || "pending"] || paymentLabels.pending;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">주문조회</h1>
            <p className="text-gray-600">주문번호와 연락처를 입력하여 주문 상태를 확인하세요</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="orderNumber">주문번호</Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="ORD-XXXXXXXX"
                  className="mt-1"
                  data-testid="input-order-number"
                />
              </div>
              <div>
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="mt-1"
                  data-testid="input-phone"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-bold"
                data-testid="button-search-order"
              >
                {loading ? (
                  "조회 중..."
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    주문 조회하기
                  </>
                )}
              </Button>
            </form>
          </div>

          {searched && order && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-gray-900 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5" />
                    <span className="font-bold">주문번호: {order.orderNumber}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1 ${getStatusInfo(order.status).color}`}>
                    {getStatusInfo(order.status).icon}
                    {getStatusInfo(order.status).label}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    주문 상품
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-medium text-gray-900">{order.productName || "상품명 없음"}</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-500">수량: {order.quantity || 1}개</span>
                      <span className="font-bold text-primary">{Number(order.totalAmount).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">주문일시</span>
                    <p className="font-medium text-gray-900 mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">결제상태</span>
                    <p className={`font-medium mt-1 ${getPaymentInfo(order.paymentStatus).color}`}>
                      {getPaymentInfo(order.paymentStatus).label}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">주문자</span>
                    <p className="font-medium text-gray-900 mt-1">{order.memberName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">연락처</span>
                    <p className="font-medium text-gray-900 mt-1">{order.memberPhone}</p>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 text-sm">배송지</span>
                  <p className="font-medium text-gray-900 mt-1">{order.shippingAddress}</p>
                </div>

                {order.trackingNumber && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4" />
                      배송 정보
                    </h4>
                    <p className="text-blue-800 text-sm">
                      택배사: {order.shippingCompany || "미정"}<br />
                      운송장번호: {order.trackingNumber}
                    </p>
                  </div>
                )}

                {!order.trackingNumber && order.status === "pending" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-amber-900">결제 대기중</h4>
                        <p className="text-amber-800 text-sm mt-1">
                          주문 완료 페이지에 안내된 계좌로 입금해주세요.
                          입금 확인 후 상품이 발송됩니다.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {searched && !order && !loading && (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">주문을 찾을 수 없습니다</h3>
              <p className="text-gray-600 text-sm">
                입력하신 정보와 일치하는 주문이 없습니다.<br />
                주문번호와 연락처를 다시 확인해주세요.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
