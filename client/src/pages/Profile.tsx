import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, LogOut, ChevronRight, Package, Wallet, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Mail, Phone, MapPin, Building2, CreditCard, Pencil, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { useWishlist } from "@/contexts/WishlistContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface MemberInfo {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  bank: string | null;
  accountNumber: string | null;
  pointBalance: number;
  isFrozen: boolean;
  createdAt: string;
}

interface DepositRequest {
  id: string;
  amount: number;
  bankName: string;
  depositorName: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  requestedAt: string;
  processedAt?: string;
}

interface PointTransaction {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  totalAmount: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded";
  createdAt: string;
}

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행",
  "SC제일은행", "케이뱅크", "카카오뱅크", "토스뱅크", "새마을금고",
  "우체국", "수협은행", "대구은행", "부산은행", "경남은행", "광주은행",
  "전북은행", "제주은행",
];

export default function Profile() {
  const { count } = useWishlist();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [depositorName, setDepositorName] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    bank: "",
    accountNumber: "",
  });

  const memberToken = localStorage.getItem("memberToken");
  const isLoggedIn = memberToken !== null;

  const { data: memberInfo } = useQuery<MemberInfo>({
    queryKey: ["member-info"],
    queryFn: async () => {
      const res = await fetch("/api/members/me", {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: isLoggedIn,
  });

  const { data: depositRequests } = useQuery<DepositRequest[]>({
    queryKey: ["deposit-requests"],
    queryFn: async () => {
      const res = await fetch("/api/members/deposit-requests", {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: isLoggedIn,
  });

  const { data: pointTransactions } = useQuery<PointTransaction[]>({
    queryKey: ["point-transactions"],
    queryFn: async () => {
      const res = await fetch("/api/members/point-transactions", {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: isLoggedIn,
  });

  const memberId = localStorage.getItem("memberId");

  const { data: memberOrders } = useQuery<Order[]>({
    queryKey: ["member-orders", memberId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (memberId) params.append("memberId", memberId);
      const res = await fetch(`/api/members/orders?${params.toString()}`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: isLoggedIn && !!memberId,
  });

  const depositMutation = useMutation({
    mutationFn: async (request: { amount: number; bankName: string; depositorName: string }) => {
      const res = await fetch("/api/members/deposit-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify(request),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deposit-requests"] });
      setShowDepositForm(false);
      setDepositAmount("");
      setBankName("");
      setDepositorName("");
      alert("입금신청이 접수되었습니다. 관리자 승인 후 포인트가 충전됩니다.");
    },
    onError: (error: Error) => { alert(error.message); },
  });

  const profileUpdateMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; address: string; bank: string; accountNumber: string }) => {
      const res = await fetch("/api/members/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-info"] });
      setIsEditing(false);
      toast({ title: "수정 완료", description: "개인정보가 성공적으로 수정되었습니다." });
    },
    onError: (error: Error) => {
      toast({ title: "수정 실패", description: error.message, variant: "destructive" });
    },
  });

  const handleStartEditing = () => {
    if (memberInfo) {
      setEditForm({
        name: memberInfo.name || "",
        email: memberInfo.email || "",
        phone: memberInfo.phone || "",
        address: memberInfo.address || "",
        bank: memberInfo.bank || "",
        accountNumber: memberInfo.accountNumber || "",
      });
      setIsEditing(true);
    }
  };

  const handleSaveProfile = () => { profileUpdateMutation.mutate(editForm); };
  const handleCancelEdit = () => { setIsEditing(false); };

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberName");
    localStorage.removeItem("memberEmail");
    localStorage.removeItem("memberId");
    window.location.reload();
  };

  const handleDepositSubmit = () => {
    if (memberInfo?.isFrozen) { alert("계정이 동결되어 입금신청을 할 수 없습니다."); return; }
    if (!depositAmount || !bankName || !depositorName) { alert("모든 필드를 입력해주세요."); return; }
    const amount = parseInt(depositAmount.replace(/,/g, ""));
    if (isNaN(amount) || amount <= 0) { alert("유효한 금액을 입력해주세요."); return; }
    depositMutation.mutate({ amount, bankName, depositorName });
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });

  const formatSimpleDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700"><Clock className="w-3 h-3" />대기중</span>;
      case "approved":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700"><CheckCircle className="w-3 h-3" />승인됨</span>;
      case "rejected":
        return <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700"><XCircle className="w-3 h-3" />거부됨</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] font-sans">
      <Header />

      <main className="max-w-[640px] mx-auto py-4 px-4 pb-24">
        {memberInfo?.isFrozen && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 flex items-start gap-3 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-red-600 text-sm">계정이 동결되었습니다</h3>
              <p className="text-xs text-red-500 mt-1">현재 계정이 동결 상태입니다. 일부 서비스 이용이 제한됩니다. 문의사항은 고객센터로 연락해주세요.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e8e8e8]">
          {/* 프로필 헤더 */}
          <div className="bg-[#111111] p-5">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/10 border border-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                {isLoggedIn ? (
                  <>
                    <p className="text-white/50 text-[10px] tracking-[0.2em] uppercase mb-0.5">Member</p>
                    <h1 className="text-lg font-bold truncate text-white" data-testid="text-profile-name">
                      {memberInfo?.name || localStorage.getItem("memberName") || "회원"}님
                    </h1>
                    <p className="text-white/60 text-xs mt-0.5 truncate">{memberInfo?.email || localStorage.getItem("memberEmail")}</p>
                  </>
                ) : (
                  <>
                    <p className="text-white/50 text-[10px] tracking-[0.2em] uppercase mb-0.5">BLOO</p>
                    <h1 className="text-lg font-bold text-white">로그인이 필요합니다</h1>
                    <p className="text-white/60 text-xs mt-0.5">로그인하시면 더 많은 혜택을 받으실 수 있습니다</p>
                  </>
                )}
              </div>
            </div>
          </div>

          {!isLoggedIn ? (
            <div className="p-8 text-center border-b border-[#e8e8e8]">
              <p className="text-[#666666] text-sm mb-6 leading-relaxed">
                로그인하여 주문 내역, 찜 목록 등<br />다양한 서비스를 이용해보세요.
              </p>
              <div className="flex gap-3 justify-center">
                <Link href="/login">
                  <button className="px-8 py-2.5 bg-[#111111] hover:bg-[#333333] text-white text-sm font-semibold tracking-wide transition-colors rounded-lg">
                    로그인
                  </button>
                </Link>
                <Link href="/signup">
                  <button className="px-8 py-2.5 border border-[#e8e8e8] text-[#666666] hover:border-[#111111] hover:text-[#111111] text-sm transition-colors rounded-lg">
                    회원가입
                  </button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="p-4">
              {/* 요약 카드 */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <Link href="/cart">
                  <div className="text-center p-3 bg-[#f8f8f8] border border-[#e8e8e8] hover:border-[#111111] transition-colors cursor-pointer rounded-lg">
                    <Heart className="w-6 h-6 text-[#111111] mx-auto mb-1" />
                    <div className="text-lg font-bold text-[#111111]">{count}</div>
                    <div className="text-[10px] text-[#999999]">찜 목록</div>
                  </div>
                </Link>
                <div className="text-center p-3 bg-[#f8f8f8] border border-[#e8e8e8] rounded-lg">
                  <Package className="w-6 h-6 text-[#111111] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[#111111]" data-testid="text-order-count">{memberOrders?.length || 0}</div>
                  <div className="text-[10px] text-[#999999]">주문 내역</div>
                </div>
                <div className="text-center p-3 bg-[#f8f8f8] border border-[#e8e8e8] rounded-lg">
                  <Wallet className="w-6 h-6 text-[#111111] mx-auto mb-1" />
                  <div className="text-lg font-bold text-[#111111]" data-testid="text-point-balance">
                    {(memberInfo?.pointBalance || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-[#999999]">포인트</div>
                </div>
              </div>

              <Tabs defaultValue="info" className="w-full">
                <TabsList className="w-full grid grid-cols-5 h-auto bg-[#f5f5f5] rounded-lg">
                  <TabsTrigger value="info" className="text-xs py-2 px-1 rounded-md data-[state=active]:bg-[#111111] data-[state=active]:text-white">내 정보</TabsTrigger>
                  <TabsTrigger value="orders" className="text-xs py-2 px-1 rounded-md data-[state=active]:bg-[#111111] data-[state=active]:text-white">주문내역</TabsTrigger>
                  <TabsTrigger value="menu" className="text-xs py-2 px-1 rounded-md data-[state=active]:bg-[#111111] data-[state=active]:text-white">메뉴</TabsTrigger>
                  <TabsTrigger value="deposit" className="text-xs py-2 px-1 rounded-md data-[state=active]:bg-[#111111] data-[state=active]:text-white">입금신청</TabsTrigger>
                  <TabsTrigger value="points" className="text-xs py-2 px-1 rounded-md data-[state=active]:bg-[#111111] data-[state=active]:text-white">포인트</TabsTrigger>
                </TabsList>

                {/* 내 정보 탭 */}
                <TabsContent value="info" className="mt-4">
                  <div className="space-y-4">
                    {!isEditing && (
                      <div className="flex justify-end">
                        <Button variant="outline" size="sm" onClick={handleStartEditing}
                          className="gap-2 border-[#e8e8e8] text-[#666666] hover:border-[#111111] hover:text-[#111111]">
                          <Pencil className="w-4 h-4" />정보 수정
                        </Button>
                      </div>
                    )}

                    {isEditing ? (
                      <div className="bg-[#f8f8f8] border border-[#e8e8e8] rounded-xl p-4 space-y-4">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-[#111111]">정보 수정</h3>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={handleCancelEdit}
                              className="gap-1 border-[#e8e8e8] text-[#666666] hover:text-[#111111]">
                              <X className="w-4 h-4" />취소
                            </Button>
                            <Button size="sm" onClick={handleSaveProfile} disabled={profileUpdateMutation.isPending}
                              className="gap-1 bg-[#111111] hover:bg-[#333333] text-white">
                              <Save className="w-4 h-4" />저장
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-3">
                          {[
                            { label: "이름", key: "name", placeholder: "이름" },
                            { label: "이메일", key: "email", placeholder: "이메일", type: "email" },
                            { label: "휴대폰", key: "phone", placeholder: "휴대폰 번호" },
                            { label: "주소", key: "address", placeholder: "주소" },
                          ].map(({ label, key, placeholder, type }) => (
                            <div key={key}>
                              <Label className="text-xs text-[#666666]">{label}</Label>
                              <Input type={type || "text"} value={(editForm as any)[key]}
                                onChange={(e) => setEditForm({ ...editForm, [key]: e.target.value })}
                                placeholder={placeholder}
                                className="bg-white border-[#e8e8e8] text-[#111111] placeholder:text-[#cccccc] focus:border-[#111111] focus-visible:ring-0 mt-1" />
                            </div>
                          ))}
                          <h4 className="font-bold text-[#111111] mt-2 text-sm">환급 계좌 정보</h4>
                          <div>
                            <Label className="text-xs text-[#666666]">은행</Label>
                            <select className="w-full h-10 px-3 mt-1 border border-[#e8e8e8] bg-white text-[#111111] rounded-md focus:outline-none focus:border-[#111111] text-sm"
                              value={editForm.bank} onChange={(e) => setEditForm({ ...editForm, bank: e.target.value })}>
                              <option value="">은행 선택</option>
                              {BANKS.map((bank) => (<option key={bank} value={bank}>{bank}</option>))}
                            </select>
                          </div>
                          <div>
                            <Label className="text-xs text-[#666666]">계좌번호</Label>
                            <Input value={editForm.accountNumber}
                              onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                              placeholder="계좌번호"
                              className="bg-white border-[#e8e8e8] text-[#111111] placeholder:text-[#cccccc] focus:border-[#111111] focus-visible:ring-0 mt-1" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-[#f8f8f8] border border-[#e8e8e8] rounded-xl p-4 space-y-1">
                        <h3 className="font-bold text-[#111111] mb-3 text-sm">기본 정보</h3>
                        {[
                          { Icon: User, label: "이름", value: memberInfo?.name },
                          { Icon: Mail, label: "이메일", value: memberInfo?.email },
                          { Icon: Phone, label: "휴대폰", value: memberInfo?.phone },
                          { Icon: MapPin, label: "주소", value: memberInfo?.address },
                        ].map(({ Icon, label, value }) => (
                          <div key={label} className="flex items-center gap-3 py-2.5 border-b border-[#e8e8e8] last:border-b-0">
                            <Icon className="w-4 h-4 text-[#999999]" />
                            <div className="flex-1">
                              <p className="text-xs text-[#999999]">{label}</p>
                              <p className="text-[#111111] font-medium text-sm">{value || "-"}</p>
                            </div>
                          </div>
                        ))}
                        <h3 className="font-bold text-[#111111] mt-4 mb-2 text-sm pt-2">환급 계좌 정보</h3>
                        {[
                          { Icon: Building2, label: "은행", value: memberInfo?.bank },
                          { Icon: CreditCard, label: "계좌번호", value: memberInfo?.accountNumber },
                        ].map(({ Icon, label, value }) => (
                          <div key={label} className="flex items-center gap-3 py-2.5 border-b border-[#e8e8e8] last:border-b-0">
                            <Icon className="w-4 h-4 text-[#999999]" />
                            <div className="flex-1">
                              <p className="text-xs text-[#999999]">{label}</p>
                              <p className="text-[#111111] font-medium text-sm">{value || "-"}</p>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-3 py-2.5">
                          <Clock className="w-4 h-4 text-[#999999]" />
                          <div className="flex-1">
                            <p className="text-xs text-[#999999]">가입일</p>
                            <p className="text-[#111111] font-medium text-sm">
                              {memberInfo?.createdAt ? formatSimpleDate(memberInfo.createdAt) : "-"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* 주문내역 탭 */}
                <TabsContent value="orders" className="mt-4">
                  <div className="space-y-3">
                    <h3 className="font-bold text-[#111111] text-sm">주문 내역</h3>
                    {memberOrders && memberOrders.length > 0 ? (
                      <div className="space-y-2">
                        {memberOrders.map((order) => (
                          <div key={order.id} className="bg-[#f8f8f8] border border-[#e8e8e8] rounded-xl p-4" data-testid={`order-item-${order.id}`}>
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#e8e8e8]">
                              <span className="text-xs font-mono bg-white border border-[#e8e8e8] px-2 py-0.5 rounded text-[#666666]">
                                {order.orderNumber}
                              </span>
                              <span className="text-xs text-[#999999]">{new Date(order.createdAt).toLocaleDateString("ko-KR")}</span>
                            </div>
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <h4 className="font-medium text-[#111111] text-sm">{order.productName}</h4>
                                <p className="text-xs text-[#999999]">수량: {order.quantity}개</p>
                              </div>
                              <p className="font-bold text-[#111111]">{Number(order.totalAmount || 0).toLocaleString()}원</p>
                            </div>
                            <div className="flex gap-2 mt-2">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                order.status === "delivered" ? "bg-green-100 text-green-700" :
                                order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                                order.status === "confirmed" ? "bg-yellow-100 text-yellow-700" :
                                order.status === "cancelled" ? "bg-red-100 text-red-700" :
                                "bg-gray-100 text-gray-600"
                              }`}>
                                {order.status === "pending" && "대기중"}
                                {order.status === "confirmed" && "확인됨"}
                                {order.status === "shipped" && "배송중"}
                                {order.status === "delivered" && "배송완료"}
                                {order.status === "cancelled" && "취소됨"}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                order.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                                order.paymentStatus === "refunded" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700"
                              }`}>
                                {order.paymentStatus === "pending" && "결제 대기"}
                                {order.paymentStatus === "paid" && "결제 완료"}
                                {order.paymentStatus === "refunded" && "환불됨"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10 text-[#999999]">
                        <Package className="w-10 h-10 mx-auto mb-3 text-[#cccccc]" />
                        <p className="text-sm">주문 내역이 없습니다.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* 메뉴 탭 */}
                <TabsContent value="menu" className="mt-4">
                  <div className="space-y-1 bg-[#f8f8f8] border border-[#e8e8e8] rounded-xl overflow-hidden">
                    <Link href="/cart">
                      <div className="flex items-center justify-between p-4 hover:bg-white cursor-pointer transition-colors" data-testid="link-wishlist">
                        <div className="flex items-center gap-3">
                          <Heart className="w-5 h-5 text-[#999999]" />
                          <span className="text-[#111111] text-sm">찜 목록</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-[#cccccc]" />
                      </div>
                    </Link>
                    <div className="flex items-center justify-between p-4 hover:bg-white cursor-pointer transition-colors border-t border-[#e8e8e8]">
                      <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-[#999999]" />
                        <span className="text-[#111111] text-sm">주문/배송 조회</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#cccccc]" />
                    </div>
                    <button onClick={handleLogout}
                      className="w-full flex items-center justify-between p-4 hover:bg-red-50 cursor-pointer transition-colors border-t border-[#e8e8e8] text-left"
                      data-testid="button-logout">
                      <div className="flex items-center gap-3">
                        <LogOut className="w-5 h-5 text-red-500" />
                        <span className="text-red-500 text-sm">로그아웃</span>
                      </div>
                    </button>
                  </div>
                </TabsContent>

                {/* 입금신청 탭 */}
                <TabsContent value="deposit" className="mt-4">
                  <div className="space-y-4">
                    <div className="p-4 bg-[#f8f8f8] border border-[#e8e8e8] rounded-xl">
                      <h3 className="font-bold text-[#111111] mb-1 text-sm">입금 안내</h3>
                      <p className="text-sm text-[#666666]">입금 관련 상세 안내는 카카오톡 고객센터로 연락 바랍니다.</p>
                    </div>

                    <Dialog open={showDepositForm} onOpenChange={setShowDepositForm}>
                      <DialogTrigger asChild>
                        <Button className="w-full bg-[#111111] hover:bg-[#333333] text-white font-semibold rounded-xl"
                          disabled={memberInfo?.isFrozen}>
                          <Plus className="w-4 h-4 mr-2" />입금 신청하기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-white border-[#e8e8e8] text-[#111111]">
                        <DialogHeader>
                          <DialogTitle className="text-[#111111]">입금 신청</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          {[
                            { id: "amount", label: "입금 금액 (원)", placeholder: "예: 100,000", value: depositAmount, onChange: setDepositAmount },
                            { id: "bankName", label: "입금 은행", placeholder: "예: 국민은행", value: bankName, onChange: setBankName },
                            { id: "depositorName", label: "입금자명", placeholder: "입금시 표시되는 이름", value: depositorName, onChange: setDepositorName },
                          ].map(({ id, label, placeholder, value, onChange }) => (
                            <div key={id}>
                              <Label htmlFor={id} className="text-[#666666] text-sm">{label}</Label>
                              <Input id={id} type="text" placeholder={placeholder} value={value}
                                onChange={(e) => onChange(e.target.value)}
                                className="bg-white border-[#e8e8e8] text-[#111111] placeholder:text-[#cccccc] focus:border-[#111111] focus-visible:ring-0 mt-1" />
                            </div>
                          ))}
                          <Button className="w-full bg-[#111111] hover:bg-[#333333] text-white font-semibold rounded-xl"
                            onClick={handleDepositSubmit} disabled={depositMutation.isPending}>
                            {depositMutation.isPending ? "처리중..." : "신청하기"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="space-y-2">
                      <h3 className="font-bold text-[#111111] text-sm">입금 신청 내역</h3>
                      {!depositRequests?.length ? (
                        <p className="text-sm text-[#999999] text-center py-8">입금 신청 내역이 없습니다.</p>
                      ) : (
                        depositRequests.map((request) => (
                          <div key={request.id} className="p-4 border border-[#e8e8e8] bg-[#f8f8f8] rounded-xl">
                            <div className="flex justify-between items-start mb-2">
                              <div className="font-bold text-lg text-[#111111]">{request.amount.toLocaleString()}원</div>
                              {getStatusBadge(request.status)}
                            </div>
                            <div className="text-sm text-[#666666] space-y-0.5">
                              <p>입금자: {request.depositorName} ({request.bankName})</p>
                              <p>신청일: {formatDate(request.requestedAt)}</p>
                              {request.processedAt && <p>처리일: {formatDate(request.processedAt)}</p>}
                              {request.adminNote && <p className="text-[#111111] font-medium">메모: {request.adminNote}</p>}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </TabsContent>

                {/* 포인트 탭 */}
                <TabsContent value="points" className="mt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-[#111111] text-sm">포인트 사용 내역</h3>
                      <span className="text-sm text-[#666666]">
                        잔액: <span className="font-bold text-[#111111]">{(memberInfo?.pointBalance || 0).toLocaleString()}P</span>
                      </span>
                    </div>
                    {!pointTransactions?.length ? (
                      <p className="text-sm text-[#999999] text-center py-8">포인트 내역이 없습니다.</p>
                    ) : (
                      pointTransactions.map((transaction) => (
                        <div key={transaction.id} className="p-4 border border-[#e8e8e8] bg-[#f8f8f8] rounded-xl flex justify-between items-center">
                          <div>
                            <p className="font-medium text-[#111111] text-sm">{transaction.description}</p>
                            <p className="text-xs text-[#999999]">{formatDate(transaction.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold text-sm ${transaction.amount >= 0 ? "text-green-600" : "text-red-500"}`}>
                              {transaction.amount >= 0 ? "+" : ""}{transaction.amount.toLocaleString()}P
                            </p>
                            <p className="text-xs text-[#999999]">잔액: {transaction.balanceAfter.toLocaleString()}P</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>

        {/* 고객 지원 */}
        <div className="mt-4 p-5 bg-white border border-[#e8e8e8] rounded-xl shadow-sm">
          <h2 className="font-bold text-[#111111] mb-3 text-sm">고객 지원</h2>
          <div className="text-sm text-[#666666] flex justify-between mb-3">
            <span>운영시간</span>
            <span>평일 09:00 - 18:00</span>
          </div>
          <Link href="/support">
            <Button variant="outline" className="w-full border-[#e8e8e8] text-[#666666] hover:border-[#111111] hover:text-[#111111] rounded-xl">
              고객센터 바로가기
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
