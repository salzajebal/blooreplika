import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Heart, LogOut, ChevronRight, Package, Wallet, Clock, CheckCircle, XCircle, AlertTriangle, Plus, Mail, Phone, MapPin, Building2, CreditCard, Info } from "lucide-react";
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

export default function Profile() {
  const { count } = useWishlist();
  const queryClient = useQueryClient();
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [depositorName, setDepositorName] = useState("");
  
  const isLoggedIn = localStorage.getItem("kaggold_member") !== null;
  const memberData = isLoggedIn ? JSON.parse(localStorage.getItem("kaggold_member") || "{}") : null;

  const { data: memberInfo, refetch: refetchMember } = useQuery<MemberInfo>({
    queryKey: ["member-info"],
    queryFn: async () => {
      const res = await fetch("/api/members/me", {
        headers: {
          Authorization: `Bearer ${memberData?.token}`,
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
          Authorization: `Bearer ${memberData?.token}`,
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
          Authorization: `Bearer ${memberData?.token}`,
        },
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      return data.data;
    },
    enabled: isLoggedIn,
  });

  const depositMutation = useMutation({
    mutationFn: async (request: { amount: number; bankName: string; depositorName: string }) => {
      const res = await fetch("/api/members/deposit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberData?.token}`,
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

  const handleLogout = () => {
    localStorage.removeItem("kaggold_member");
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

      <main className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          {memberInfo?.isFrozen && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-700">계정이 동결되었습니다</h3>
                <p className="text-sm text-red-600 mt-1">
                  현재 계정이 동결 상태입니다. 일부 서비스 이용이 제한됩니다.
                  문의사항은 고객센터로 연락해주세요.
                </p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  {isLoggedIn ? (
                    <>
                      <h1 className="text-2xl font-bold" data-testid="text-profile-name">
                        {memberInfo?.name || memberData?.name || "회원"}님
                      </h1>
                      <p className="text-white/80 text-sm mt-1">{memberInfo?.email || memberData?.email}</p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold">로그인이 필요합니다</h1>
                      <p className="text-white/80 text-sm mt-1">로그인하시면 더 많은 혜택을 받으실 수 있습니다</p>
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
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Link href="/cart">
                    <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500">찜 목록</div>
                    </div>
                  </Link>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">주문 내역</div>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                    <Wallet className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-amber-700" data-testid="text-point-balance">
                      {(memberInfo?.pointBalance || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-amber-600 font-medium">포인트</div>
                  </div>
                </div>

                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="w-full grid grid-cols-4">
                    <TabsTrigger value="info">내 정보</TabsTrigger>
                    <TabsTrigger value="menu">메뉴</TabsTrigger>
                    <TabsTrigger value="deposit">입금신청</TabsTrigger>
                    <TabsTrigger value="points">포인트</TabsTrigger>
                  </TabsList>

                  <TabsContent value="info" className="mt-4">
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-blue-700">
                            개인정보 수정은 관리자에게 문의해주세요.
                          </p>
                        </div>
                      </div>

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
                        <div className="text-sm text-amber-700 space-y-1">
                          <p>- 예금주: (주)한국골드금거래소</p>
                          <p>- 국민은행: 123-456-789012</p>
                          <p>- 입금자명은 반드시 신청서와 동일하게 입금해주세요.</p>
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
                <span>고객센터</span>
                <span className="font-bold text-primary">1588-0000</span>
              </div>
              <div className="flex justify-between">
                <span>운영시간</span>
                <span>평일 09:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>이메일</span>
                <span>support@kaggold.com</span>
              </div>
            </div>
            <Link href="/support">
              <Button variant="outline" className="w-full mt-4">
                1:1 문의하기
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
