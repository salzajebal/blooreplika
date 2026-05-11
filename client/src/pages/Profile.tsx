import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, LogOut, ChevronRight, Package, Wallet, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Mail, Phone, MapPin, Building2, CreditCard, Info, Pencil, Save, X } from "lucide-react";
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

  const { data: memberInfo, refetch: refetchMember } = useQuery<MemberInfo>({
    queryKey: ["member-info"],
    queryFn: async () => {
      const res = await fetch("/api/members/me", {
        headers: {
          Authorization: `Bearer ${memberToken}`,
        },
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
        headers: {
          Authorization: `Bearer ${memberToken}`,
        },
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
        headers: {
          Authorization: `Bearer ${memberToken}`,
        },
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
        headers: {
          Authorization: `Bearer ${memberToken}`,
        },
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberToken}`,
        },
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
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const profileUpdateMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; phone: string; address: string; bank: string; accountNumber: string }) => {
      const res = await fetch("/api/members/me", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.error);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["member-info"] });
      setIsEditing(false);
      toast({
        title: "수정 완료",
        description: "개인정보가 성공적으로 수정되었습니다.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "수정 실패",
        description: error.message,
        variant: "destructive",
      });
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

  const handleSaveProfile = () => {
    profileUpdateMutation.mutate(editForm);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberName");
    localStorage.removeItem("memberEmail");
    localStorage.removeItem("memberId");
    window.location.reload();
  };

  const handleDepositSubmit = () => {
    if (memberInfo?.isFrozen) {
      alert("계정이 동결되어 입금신청을 할 수 없습니다.");
      return;
    }
    
    if (!depositAmount || !bankName || !depositorName) {
      alert("모든 필드를 입력해주세요.");
      return;
    }
    
    const amount = parseInt(depositAmount.replace(/,/g, ""));
    if (isNaN(amount) || amount <= 0) {
      alert("유효한 금액을 입력해주세요.");
      return;
    }
    
    depositMutation.mutate({ amount, bankName, depositorName });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatSimpleDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
            <Clock className="w-3 h-3" />
            대기중
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle className="w-3 h-3" />
            승인됨
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            거부됨
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />

      <main className="container-custom py-6 md:py-12 px-4 pb-24 md:pb-12">
        <div className="max-w-2xl mx-auto">
          {memberInfo?.isFrozen && (
            <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-red-700 text-sm md:text-base">계정이 동결되었습니다</h3>
                <p className="text-xs md:text-sm text-red-600 mt-1">
                  현재 계정이 동결 상태입니다. 일부 서비스 이용이 제한됩니다.
                  문의사항은 고객센터로 연락해주세요.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-4 md:p-8 text-white">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-14 h-14 md:w-20 md:h-20 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-7 h-7 md:w-10 md:h-10" />
                </div>
                <div className="min-w-0 flex-1">
                  {isLoggedIn ? (
                    <>
                      <h1 className="text-lg md:text-2xl font-bold truncate" data-testid="text-profile-name">
                        {memberInfo?.name || localStorage.getItem("memberName") || "회원"}님
                      </h1>
                      <p className="text-white/80 text-xs md:text-sm mt-1 truncate">{memberInfo?.email || localStorage.getItem("memberEmail")}</p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-lg md:text-2xl font-bold">로그인이 필요합니다</h1>
                      <p className="text-white/80 text-xs md:text-sm mt-1">로그인하시면 더 많은 혜택을 받으실 수 있습니다</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-6">
                  로그인하여 주문 내역, 찜 목록 등 다양한 서비스를 이용해보세요.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/login">
                    <Button className="bg-primary hover:bg-primary/90">
                      로그인
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline">
                      회원가입
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 md:p-6">
                <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-6">
                  <Link href="/cart">
                    <div className="text-center p-2 md:p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <Heart className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-1 md:mb-2" />
                      <div className="text-lg md:text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-[10px] md:text-xs text-gray-500">찜 목록</div>
                    </div>
                  </Link>
                  <div className="text-center p-2 md:p-4 bg-gray-50 rounded-lg">
                    <Package className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-1 md:mb-2" />
                    <div className="text-lg md:text-2xl font-bold text-gray-900" data-testid="text-order-count">{memberOrders?.length || 0}</div>
                    <div className="text-[10px] md:text-xs text-gray-500">주문 내역</div>
                  </div>
                  <div className="text-center p-2 md:p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                    <Wallet className="w-6 h-6 md:w-8 md:h-8 text-amber-600 mx-auto mb-1 md:mb-2" />
                    <div className="text-lg md:text-2xl font-bold text-amber-700" data-testid="text-point-balance">
                      {(memberInfo?.pointBalance || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] md:text-xs text-amber-600 font-medium">포인트</div>
                  </div>
                </div>

                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="w-full grid grid-cols-5 h-auto">
                    <TabsTrigger value="info" className="text-xs md:text-sm py-2 px-1 md:px-3">내 정보</TabsTrigger>
                    <TabsTrigger value="orders" className="text-xs md:text-sm py-2 px-1 md:px-3">주문내역</TabsTrigger>
                    <TabsTrigger value="menu" className="text-xs md:text-sm py-2 px-1 md:px-3">메뉴</TabsTrigger>
                    <TabsTrigger value="deposit" className="text-xs md:text-sm py-2 px-1 md:px-3">입금신청</TabsTrigger>
                    <TabsTrigger value="points" className="text-xs md:text-sm py-2 px-1 md:px-3">포인트</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="mt-4">
                    <div className="space-y-4">
                      {!isEditing && (
                        <div className="flex justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleStartEditing}
                            className="gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            정보 수정
                          </Button>
                        </div>
                      )}

                      {isEditing ? (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900">정보 수정</h3>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={handleCancelEdit}
                                className="gap-1"
                              >
                                <X className="w-4 h-4" />
                                취소
                              </Button>
                              <Button
                                size="sm"
                                onClick={handleSaveProfile}
                                disabled={profileUpdateMutation.isPending}
                                className="gap-1 bg-primary"
                              >
                                <Save className="w-4 h-4" />
                                저장
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <Label className="text-xs text-gray-500">이름</Label>
                              <Input
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                placeholder="이름"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">이메일</Label>
                              <Input
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                placeholder="이메일"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">휴대폰</Label>
                              <Input
                                value={editForm.phone}
                                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                placeholder="휴대폰 번호"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">주소</Label>
                              <Input
                                value={editForm.address}
                                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                                placeholder="주소"
                              />
                            </div>
                            <h4 className="font-bold text-gray-900 mt-4">환급 계좌 정보</h4>
                            <div>
                              <Label className="text-xs text-gray-500">은행</Label>
                              <select
                                className="w-full h-10 px-3 border border-gray-200 rounded-md bg-white"
                                value={editForm.bank}
                                onChange={(e) => setEditForm({ ...editForm, bank: e.target.value })}
                              >
                                <option value="">은행 선택</option>
                                {BANKS.map((bank) => (
                                  <option key={bank} value={bank}>{bank}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs text-gray-500">계좌번호</Label>
                              <Input
                                value={editForm.accountNumber}
                                onChange={(e) => setEditForm({ ...editForm, accountNumber: e.target.value })}
                                placeholder="계좌번호"
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                          <h3 className="font-bold text-gray-900 mb-4">기본 정보</h3>
                          
                          <div className="flex items-center gap-3 py-2 border-b border-gray-200">
                            <User className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">이름</p>
                              <p className="text-gray-900 font-medium">{memberInfo?.name || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 py-2 border-b border-gray-200">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">이메일</p>
                              <p className="text-gray-900 font-medium">{memberInfo?.email || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 py-2 border-b border-gray-200">
                            <Phone className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">휴대폰</p>
                              <p className="text-gray-900 font-medium">{memberInfo?.phone || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 py-2 border-b border-gray-200">
                            <MapPin className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">주소</p>
                              <p className="text-gray-900 font-medium">{memberInfo?.address || "-"}</p>
                            </div>
                          </div>

                          <h3 className="font-bold text-gray-900 mt-6 mb-4">환급 계좌 정보</h3>

                          <div className="flex items-center gap-3 py-2 border-b border-gray-200">
                            <Building2 className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">은행</p>
                              <p className="text-gray-900 font-medium">{memberInfo?.bank || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 py-2 border-b border-gray-200">
                            <CreditCard className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">계좌번호</p>
                              <p className="text-gray-900 font-medium">{memberInfo?.accountNumber || "-"}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 py-2">
                            <Clock className="w-5 h-5 text-gray-400" />
                            <div className="flex-1">
                              <p className="text-xs text-gray-500">가입일</p>
                              <p className="text-gray-900 font-medium">
                                {memberInfo?.createdAt ? formatSimpleDate(memberInfo.createdAt) : "-"}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="orders" className="mt-4">
                    <div className="space-y-4">
                      <h3 className="font-bold text-gray-900">주문 내역</h3>
                      {memberOrders && memberOrders.length > 0 ? (
                        <div className="space-y-3">
                          {memberOrders.map((order) => (
                            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4" data-testid={`order-item-${order.id}`}>
                              <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                                <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded text-gray-600">주문번호: {order.orderNumber}</span>
                                <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleDateString("ko-KR")}</span>
                              </div>
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <h4 className="font-medium text-gray-900">{order.productName}</h4>
                                  <p className="text-sm text-gray-500">수량: {order.quantity}개</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-primary">{Number(order.totalAmount || 0).toLocaleString()}원</p>
                                </div>
                              </div>
                              <div className="flex gap-2 mt-3">
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  order.status === "delivered" ? "bg-green-100 text-green-700" :
                                  order.status === "shipped" ? "bg-blue-100 text-blue-700" :
                                  order.status === "confirmed" ? "bg-yellow-100 text-yellow-700" :
                                  order.status === "cancelled" ? "bg-red-100 text-red-700" :
                                  "bg-gray-100 text-gray-700"
                                }`}>
                                  {order.status === "pending" && "대기중"}
                                  {order.status === "confirmed" && "확인됨"}
                                  {order.status === "shipped" && "배송중"}
                                  {order.status === "delivered" && "배송완료"}
                                  {order.status === "cancelled" && "취소됨"}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  order.paymentStatus === "paid" ? "bg-green-100 text-green-700" :
                                  order.paymentStatus === "refunded" ? "bg-red-100 text-red-700" :
                                  "bg-amber-100 text-amber-700"
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
                        <div className="text-center py-8 text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>주문 내역이 없습니다.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="menu" className="mt-4">
                    <div className="space-y-2">
                      <Link href="/cart">
                        <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" data-testid="link-wishlist">
                          <div className="flex items-center gap-3">
                            <Heart className="w-5 h-5 text-gray-400" />
                            <span className="text-gray-700">찜 목록</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </Link>
                      
                      <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                        <div className="flex items-center gap-3">
                          <Package className="w-5 h-5 text-gray-400" />
                          <span className="text-gray-700">주문/배송 조회</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-lg cursor-pointer transition-colors text-left"
                        data-testid="button-logout"
                      >
                        <div className="flex items-center gap-3">
                          <LogOut className="w-5 h-5 text-red-400" />
                          <span className="text-red-500">로그아웃</span>
                        </div>
                      </button>
                    </div>
                  </TabsContent>

                  <TabsContent value="deposit" className="mt-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h3 className="font-bold text-amber-800 mb-2">입금 안내</h3>
                        <div className="text-sm text-amber-700">
                          <p>입금 관련 상세 안내는 카카오톡 고객센터로 연락 바랍니다.</p>
                        </div>
                      </div>

                      <Dialog open={showDepositForm} onOpenChange={setShowDepositForm}>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full bg-primary hover:bg-primary/90"
                            disabled={memberInfo?.isFrozen}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            입금 신청하기
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>입금 신청</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div>
                              <Label htmlFor="amount">입금 금액 (원)</Label>
                              <Input
                                id="amount"
                                type="text"
                                placeholder="예: 100,000"
                                value={depositAmount}
                                onChange={(e) => setDepositAmount(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="bankName">입금 은행</Label>
                              <Input
                                id="bankName"
                                placeholder="예: 국민은행"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                              />
                            </div>
                            <div>
                              <Label htmlFor="depositorName">입금자명</Label>
                              <Input
                                id="depositorName"
                                placeholder="입금시 표시되는 이름"
                                value={depositorName}
                                onChange={(e) => setDepositorName(e.target.value)}
                              />
                            </div>
                            <Button
                              className="w-full"
                              onClick={handleDepositSubmit}
                              disabled={depositMutation.isPending}
                            >
                              {depositMutation.isPending ? "처리중..." : "신청하기"}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <div className="space-y-3">
                        <h3 className="font-bold text-gray-900">입금 신청 내역</h3>
                        {!depositRequests?.length ? (
                          <p className="text-sm text-gray-500 text-center py-8">
                            입금 신청 내역이 없습니다.
                          </p>
                        ) : (
                          depositRequests.map((request) => (
                            <div
                              key={request.id}
                              className="p-4 border rounded-lg bg-white"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <div className="font-bold text-lg">
                                  {request.amount.toLocaleString()}원
                                </div>
                                {getStatusBadge(request.status)}
                              </div>
                              <div className="text-sm text-gray-500 space-y-1">
                                <p>입금자: {request.depositorName} ({request.bankName})</p>
                                <p>신청일: {formatDate(request.requestedAt)}</p>
                                {request.processedAt && (
                                  <p>처리일: {formatDate(request.processedAt)}</p>
                                )}
                                {request.adminNote && (
                                  <p className="text-amber-600">메모: {request.adminNote}</p>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="points" className="mt-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">포인트 사용 내역</h3>
                        <span className="text-sm text-gray-500">
                          현재 잔액: <span className="font-bold text-primary">{(memberInfo?.pointBalance || 0).toLocaleString()}P</span>
                        </span>
                      </div>
                      
                      {!pointTransactions?.length ? (
                        <p className="text-sm text-gray-500 text-center py-8">
                          포인트 내역이 없습니다.
                        </p>
                      ) : (
                        pointTransactions.map((transaction) => (
                          <div
                            key={transaction.id}
                            className="p-4 border rounded-lg bg-white flex justify-between items-center"
                          >
                            <div>
                              <p className="font-medium text-gray-900">{transaction.description}</p>
                              <p className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-bold ${transaction.amount >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {transaction.amount >= 0 ? "+" : ""}{transaction.amount.toLocaleString()}P
                              </p>
                              <p className="text-xs text-gray-500">
                                잔액: {transaction.balanceAfter.toLocaleString()}P
                              </p>
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

          <div className="mt-6 p-6 bg-white rounded-xl shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">고객 지원</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>운영시간</span>
                <span>평일 09:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>이메일</span>
                <span>support@cheongdam-edition.com</span>
              </div>
            </div>
            <Link href="/support">
              <Button variant="outline" className="w-full mt-4">
                고객센터 바로가기
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
