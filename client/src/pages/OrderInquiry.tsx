import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Search, Truck, CheckCircle, Clock, XCircle, AlertTriangle, History } from "lucide-react";
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

interface RecentOrder {
  orderNumber: string;
  createdAt: string;
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "주문접수", color: "text-yellow-700 bg-yellow-100", icon: <Clock className="w-4 h-4" /> },
  confirmed: { label: "주문확인", color: "text-blue-700 bg-blue-100", icon: <CheckCircle className="w-4 h-4" /> },
  shipped: { label: "배송중", color: "text-purple-700 bg-purple-100", icon: <Truck className="w-4 h-4" /> },
  delivered: { label: "배송완료", color: "text-green-700 bg-green-100", icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: "주문취소", color: "text-red-700 bg-red-100", icon: <XCircle className="w-4 h-4" /> },
};

const paymentLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "결제대기", color: "text-yellow-600" },
  paid: { label: "결제완료", color: "text-green-600" },
  refunded: { label: "환불완료", color: "text-red-500" },
};

export default function OrderInquiry() {
  const { toast } = useToast();
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [searched, setSearched] = useState(false);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const on = params.get("orderNumber");
    if (on) setOrderNumber(on);

    try {
      const saved = JSON.parse(localStorage.getItem("recentOrders") || "[]");
      setRecentOrders(saved);
    } catch {}
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await doSearch(orderNumber, phone);
  };

  const doSearch = async (num: string, ph: string) => {
    if (!num.trim()) {
      toast({ title: "입력 오류", description: "주문번호를 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!ph.trim()) {
      toast({ title: "입력 오류", description: "연락처를 입력해주세요.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const res = await fetch(`/api/orders/lookup?orderNumber=${encodeURIComponent(num.trim())}&phone=${encodeURIComponent(ph.replace(/-/g, ""))}`);
      const data = await res.json();
      if (data.success && data.data) {
        setOrder(data.data);
      } else {
        setOrder(null);
        toast({ title: "조회 결과 없음", description: "주문번호와 연락처가 일치하는 주문이 없습니다.", variant: "destructive" });
      }
    } catch {
      setOrder(null);
      toast({ title: "조회 오류", description: "주문 조회 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  };

  const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    return `${days}일 전`;
  };

  const getStatusInfo = (status: string | null) => statusLabels[status || "pending"] || statusLabels.pending;
  const getPaymentInfo = (status: string | null) => paymentLabels[status || "pending"] || paymentLabels.pending;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />

      <main className="flex-1 py-6">
        <div className="max-w-[640px] mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[#111111] mb-1">주문조회</h1>
            <p className="text-sm text-[#666666]">주문번호와 연락처를 입력하여 주문 상태를 확인하세요</p>
          </div>

          {/* 최근 주문번호 */}
          {recentOrders.length > 0 && (
            <div className="bg-white border border-[#e8e8e8] rounded-xl p-4 mb-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-4 h-4 text-[#FF6100]" />
                <span className="text-sm font-bold text-[#111111]">이 기기에서 주문한 내역</span>
              </div>
              <div className="space-y-2">
                {recentOrders.map((ro) => (
                  <button
                    key={ro.orderNumber}
                    onClick={() => {
                      setOrderNumber(ro.orderNumber);
                      window.scrollTo({ top: 300, behavior: "smooth" });
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-[#f8f8f8] hover:bg-[#fff5ee] border border-[#e8e8e8] hover:border-[#FF6100]/30 rounded-lg transition-colors text-left"
                    data-testid={`recent-order-${ro.orderNumber}`}
                  >
                    <div>
                      <p className="text-sm font-mono font-semibold text-[#111111]">{ro.orderNumber}</p>
                      <p className="text-xs text-[#999999] mt-0.5">{formatRelative(ro.createdAt)} 주문</p>
                    </div>
                    <span className="text-xs text-[#FF6100] font-medium">선택 →</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 mb-4 shadow-sm">
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="orderNumber" className="text-sm text-[#666666]">주문번호</Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="ORD-XXXXXXXX"
                  className="mt-1 bg-white border-[#e8e8e8] text-[#111111] placeholder:text-[#cccccc] focus:border-[#FF6100] focus-visible:ring-0"
                  data-testid="input-order-number"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm text-[#666666]">연락처</Label>
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="010-0000-0000"
                  className="mt-1 bg-white border-[#e8e8e8] text-[#111111] placeholder:text-[#cccccc] focus:border-[#FF6100] focus-visible:ring-0"
                  data-testid="input-phone"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-[#FF6100] hover:bg-[#e05500] text-white font-bold rounded-xl disabled:opacity-50"
                data-testid="button-search-order"
              >
                {loading ? "조회 중..." : <><Search className="w-4 h-4 mr-2" />주문 조회하기</>}
              </Button>
            </form>
          </div>

          {searched && order && (
            <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden shadow-sm">
              <div className="bg-[#f8f8f8] border-b border-[#e8e8e8] p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[#111111]">
                    <Package className="w-5 h-5 text-[#FF6100]" />
                    <span className="font-bold text-sm">주문번호: {order.orderNumber}</span>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusInfo(order.status).color}`}>
                    {getStatusInfo(order.status).icon}
                    {getStatusInfo(order.status).label}
                  </div>
                </div>
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <h3 className="font-bold text-[#111111] mb-3 flex items-center gap-2 text-sm">
                    <Package className="w-4 h-4 text-[#FF6100]" />주문 상품
                  </h3>
                  <div className="bg-[#f8f8f8] border border-[#e8e8e8] rounded-lg p-4">
                    <p className="font-medium text-[#111111] text-sm">{order.productName || "상품명 없음"}</p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-[#999999]">수량: {order.quantity || 1}개</span>
                      <span className="font-bold text-[#FF6100]">{Number(order.totalAmount).toLocaleString()}원</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-[#999999]">주문일시</span>
                    <p className="font-medium text-[#111111] mt-1">{formatDate(order.createdAt)}</p>
                  </div>
                  <div>
                    <span className="text-[#999999]">결제상태</span>
                    <p className={`font-medium mt-1 ${getPaymentInfo(order.paymentStatus).color}`}>
                      {getPaymentInfo(order.paymentStatus).label}
                    </p>
                  </div>
                  <div>
                    <span className="text-[#999999]">주문자</span>
                    <p className="font-medium text-[#111111] mt-1">{order.memberName}</p>
                  </div>
                  <div>
                    <span className="text-[#999999]">연락처</span>
                    <p className="font-medium text-[#111111] mt-1">{order.memberPhone}</p>
                  </div>
                </div>

                <div>
                  <span className="text-[#999999] text-sm">배송지</span>
                  <p className="font-medium text-[#111111] mt-1 text-sm">{order.shippingAddress}</p>
                </div>

                {order.trackingNumber && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-700 mb-2 flex items-center gap-2 text-sm">
                      <Truck className="w-4 h-4" />배송 정보
                    </h4>
                    <p className="text-blue-600 text-sm">
                      택배사: {order.shippingCompany || "미정"}<br />
                      운송장번호: {order.trackingNumber}
                    </p>
                  </div>
                )}

                {!order.trackingNumber && order.status === "pending" && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-[#FF6100] shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-[#FF6100] text-sm">결제 대기중</h4>
                        <p className="text-[#FF6100]/80 text-sm mt-1">
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
            <div className="bg-white border border-[#e8e8e8] rounded-xl p-8 text-center shadow-sm">
              <div className="w-14 h-14 bg-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-7 h-7 text-[#cccccc]" />
              </div>
              <h3 className="text-base font-bold text-[#111111] mb-2">주문을 찾을 수 없습니다</h3>
              <p className="text-[#666666] text-sm">
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
