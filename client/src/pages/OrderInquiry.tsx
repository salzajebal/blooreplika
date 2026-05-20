import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Search, Truck, CheckCircle, Clock, XCircle, AlertTriangle, History, Phone } from "lucide-react";
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

function OrderCard({ order }: { order: OrderInfo }) {
  const getStatusInfo = (s: string | null) => statusLabels[s || "pending"] || statusLabels.pending;
  const getPaymentInfo = (s: string | null) => paymentLabels[s || "pending"] || paymentLabels.pending;
  const formatDate = (d: string | null) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden shadow-sm">
      <div className="bg-[#f8f8f8] border-b border-[#e8e8e8] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#111111]">
            <Package className="w-5 h-5 text-[#FF6100]" />
            <span className="font-bold text-sm">{order.orderNumber}</span>
          </div>
          <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusInfo(order.status).color}`}>
            {getStatusInfo(order.status).icon}
            {getStatusInfo(order.status).label}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="bg-[#f8f8f8] border border-[#e8e8e8] rounded-lg p-3">
          <p className="font-medium text-[#111111] text-sm">{order.productName || "상품명 없음"}</p>
          <div className="flex justify-between items-center mt-1.5 text-sm">
            <span className="text-[#999999]">수량 {order.quantity || 1}개</span>
            <span className="font-bold text-[#FF6100]">{Number(order.totalAmount).toLocaleString()}원</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-[#999999] text-xs">주문일시</span>
            <p className="font-medium text-[#111111] mt-0.5 text-xs">{formatDate(order.createdAt)}</p>
          </div>
          <div>
            <span className="text-[#999999] text-xs">결제상태</span>
            <p className={`font-medium mt-0.5 text-xs ${getPaymentInfo(order.paymentStatus).color}`}>
              {getPaymentInfo(order.paymentStatus).label}
            </p>
          </div>
        </div>

        {order.trackingNumber && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-bold text-blue-700 mb-1 flex items-center gap-1.5 text-sm">
              <Truck className="w-4 h-4" />배송 정보
            </h4>
            <p className="text-blue-600 text-xs">
              택배사: {order.shippingCompany || "미정"} · 운송장: {order.trackingNumber}
            </p>
          </div>
        )}

        {!order.trackingNumber && order.status === "pending" && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FF6100] shrink-0 mt-0.5" />
              <p className="text-[#FF6100]/80 text-xs">
                주문 완료 페이지에 안내된 계좌로 입금해주세요. 입금 확인 후 발송됩니다.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrderInquiry() {
  const { toast } = useToast();
  const [tab, setTab] = useState<"number" | "phone">("number");

  // 주문번호 + 연락처 탭
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderInfo | null>(null);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);

  // 연락처만 탭
  const [phoneOnly, setPhoneOnly] = useState("");
  const [phoneOrders, setPhoneOrders] = useState<OrderInfo[]>([]);
  const [phoneSearched, setPhoneSearched] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);

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

  const handleNumberSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber.trim()) {
      toast({ title: "입력 오류", description: "주문번호를 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!phone.trim()) {
      toast({ title: "입력 오류", description: "연락처를 입력해주세요.", variant: "destructive" });
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
        toast({ title: "조회 결과 없음", description: "주문번호와 연락처가 일치하는 주문이 없습니다.", variant: "destructive" });
      }
    } catch {
      setOrder(null);
      toast({ title: "오류", description: "주문 조회 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneOnly.trim()) {
      toast({ title: "입력 오류", description: "연락처를 입력해주세요.", variant: "destructive" });
      return;
    }
    setPhoneLoading(true);
    setPhoneSearched(true);
    try {
      const res = await fetch(`/api/orders/lookup-by-phone?phone=${encodeURIComponent(phoneOnly.replace(/-/g, ""))}`);
      const data = await res.json();
      if (data.success && data.data?.length) {
        setPhoneOrders(data.data);
      } else {
        setPhoneOrders([]);
        toast({ title: "조회 결과 없음", description: "해당 연락처로 주문된 내역이 없습니다.", variant: "destructive" });
      }
    } catch {
      setPhoneOrders([]);
      toast({ title: "오류", description: "주문 조회 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setPhoneLoading(false);
    }
  };

  const formatRelative = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    return `${days}일 전`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5]">
      <Header />

      <main className="flex-1 py-6">
        <div className="max-w-[640px] mx-auto px-4">
          <div className="text-center mb-6">
            <h1 className="text-xl font-bold text-[#111111] mb-1">주문조회</h1>
            <p className="text-sm text-[#666666]">주문번호가 없어도 연락처만으로 조회할 수 있습니다</p>
          </div>

          {/* 탭 */}
          <div className="flex bg-white border border-[#e8e8e8] rounded-xl p-1 mb-4 shadow-sm">
            <button
              onClick={() => setTab("number")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === "number" ? "bg-[#FF6100] text-white" : "text-[#666666]"
              }`}
              data-testid="tab-number"
            >
              <Search className="w-4 h-4" />주문번호로 조회
            </button>
            <button
              onClick={() => setTab("phone")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                tab === "phone" ? "bg-[#FF6100] text-white" : "text-[#666666]"
              }`}
              data-testid="tab-phone"
            >
              <Phone className="w-4 h-4" />연락처만으로 조회
            </button>
          </div>

          {/* 주문번호 + 연락처 탭 */}
          {tab === "number" && (
            <>
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
                        onClick={() => setOrderNumber(ro.orderNumber)}
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
                <form onSubmit={handleNumberSearch} className="space-y-4">
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
                  <Button type="submit" disabled={loading}
                    className="w-full h-12 bg-[#FF6100] hover:bg-[#e05500] text-white font-bold rounded-xl disabled:opacity-50"
                    data-testid="button-search-order">
                    {loading ? "조회 중..." : <><Search className="w-4 h-4 mr-2" />주문 조회하기</>}
                  </Button>
                </form>
              </div>

              {searched && order && <OrderCard order={order} />}
              {searched && !order && !loading && (
                <div className="bg-white border border-[#e8e8e8] rounded-xl p-8 text-center shadow-sm">
                  <Search className="w-7 h-7 text-[#cccccc] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#111111] mb-1">주문을 찾을 수 없습니다</h3>
                  <p className="text-[#666666] text-sm mb-4">주문번호와 연락처를 다시 확인해주세요.</p>
                  <button onClick={() => setTab("phone")}
                    className="text-sm text-[#FF6100] underline font-medium">
                    주문번호가 기억나지 않으신가요? → 연락처만으로 조회하기
                  </button>
                </div>
              )}
            </>
          )}

          {/* 연락처만 탭 */}
          {tab === "phone" && (
            <>
              <div className="bg-[#fff8f5] border border-[#FF6100]/20 rounded-xl p-4 mb-4">
                <p className="text-sm text-[#FF6100] font-medium mb-1">📱 연락처만으로 조회</p>
                <p className="text-xs text-[#666666]">주문 시 입력했던 연락처를 입력하면 해당 번호로 주문한 모든 내역을 확인할 수 있습니다.</p>
              </div>

              <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 mb-4 shadow-sm">
                <form onSubmit={handlePhoneSearch} className="space-y-4">
                  <div>
                    <Label htmlFor="phoneOnly" className="text-sm text-[#666666]">주문 시 입력한 연락처</Label>
                    <Input
                      id="phoneOnly"
                      value={phoneOnly}
                      onChange={(e) => setPhoneOnly(e.target.value)}
                      placeholder="010-0000-0000"
                      className="mt-1 bg-white border-[#e8e8e8] text-[#111111] placeholder:text-[#cccccc] focus:border-[#FF6100] focus-visible:ring-0"
                      data-testid="input-phone-only"
                    />
                  </div>
                  <Button type="submit" disabled={phoneLoading}
                    className="w-full h-12 bg-[#FF6100] hover:bg-[#e05500] text-white font-bold rounded-xl disabled:opacity-50"
                    data-testid="button-search-by-phone">
                    {phoneLoading ? "조회 중..." : <><Phone className="w-4 h-4 mr-2" />연락처로 조회하기</>}
                  </Button>
                </form>
              </div>

              {phoneSearched && phoneOrders.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-[#666666] font-medium px-1">총 {phoneOrders.length}건의 주문 내역</p>
                  {phoneOrders.map((o) => <OrderCard key={o.orderNumber} order={o} />)}
                </div>
              )}
              {phoneSearched && !phoneOrders.length && !phoneLoading && (
                <div className="bg-white border border-[#e8e8e8] rounded-xl p-8 text-center shadow-sm">
                  <Phone className="w-7 h-7 text-[#cccccc] mx-auto mb-3" />
                  <h3 className="text-base font-bold text-[#111111] mb-1">주문을 찾을 수 없습니다</h3>
                  <p className="text-[#666666] text-sm">입력하신 연락처로 주문된 내역이 없습니다.</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
