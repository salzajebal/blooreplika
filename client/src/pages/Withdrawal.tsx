import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CheckCircle, Clock, XCircle, Wallet, Banknote, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface WithdrawalRequest {
  id: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  status: string;
  requestedAt: string;
  adminNote?: string;
}

const BANK_OPTIONS = [
  "KB국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "SC제일은행",
  "씨티은행",
  "농협은행",
  "기업은행",
  "수협은행",
  "케이뱅크",
  "카카오뱅크",
  "토스뱅크",
  "새마을금고",
  "신협",
  "우체국",
  "기타",
];

export default function Withdrawal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });

  const memberToken = localStorage.getItem("memberToken");
  const memberName = localStorage.getItem("memberName");
  const memberEmail = localStorage.getItem("memberEmail");
  const memberId = localStorage.getItem("memberId");

  useEffect(() => {
    if (!memberToken) {
      toast({
        title: "로그인 필요",
        description: "출금신청을 하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [memberToken, setLocation, toast]);

  const { data: myRequests = [], isLoading: isLoadingRequests } = useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/members/withdrawal-requests"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/members/withdrawal-requests", {
          headers: {
            "Authorization": `Bearer ${memberToken}`,
          },
        });
        if (!res.ok) return [];
        const result = await res.json();
        return result.data || [];
      } catch {
        return [];
      }
    },
    enabled: !!memberToken,
  });

  const { data: pointBalance = 0 } = useQuery<number>({
    queryKey: ["/api/members/me", "pointBalance"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/members/me", {
          headers: {
            "Authorization": `Bearer ${memberToken}`,
          },
        });
        if (!res.ok) return 0;
        const result = await res.json();
        return result.data?.pointBalance || 0;
      } catch {
        return 0;
      }
    },
    enabled: !!memberToken,
    refetchInterval: 5000,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!memberId || !memberName || !memberEmail) {
      toast({
        title: "오류",
        description: "로그인 정보를 찾을 수 없습니다. 다시 로그인해주세요.",
        variant: "destructive",
      });
      return;
    }

    const amount = parseInt(formData.amount);
    if (isNaN(amount) || amount < 10000) {
      toast({
        title: "금액 오류",
        description: "최소 10,000원 이상 출금 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    if (amount > pointBalance) {
      toast({
        title: "잔액 부족",
        description: "보유 포인트보다 많은 금액은 출금할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.bankName || !formData.accountNumber || !formData.accountHolder) {
      toast({
        title: "입력 오류",
        description: "은행명, 계좌번호, 예금주명을 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/members/withdrawal-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          amount,
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          accountHolder: formData.accountHolder,
        }),
      });

      if (res.ok) {
        toast({
          title: "신청 완료",
          description: "출금신청이 완료되었습니다. 관리자 승인 후 입금됩니다.",
        });
        setFormData({ amount: "", bankName: "", accountNumber: "", accountHolder: "" });
        queryClient.invalidateQueries({ queryKey: ["/api/members/withdrawal-requests"] });
        queryClient.invalidateQueries({ queryKey: ["/api/members/me"] });
      } else {
        const data = await res.json();
        throw new Error(data.error || "신청 실패");
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "출금신청 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
            승인
          </span>
        );
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
            <XCircle className="w-3 h-3" />
            거절
          </span>
        );
      default:
        return null;
    }
  };

  if (!memberToken) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gold-50 to-white">
      <Header />
      
      <main className="flex-1 py-6 md:py-12 px-4">
        <div className="container-custom max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-gray-900">출금신청</h1>

          <div className="mb-6 md:mb-8">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-2xl p-6 shadow-lg text-center">
              <div className="flex items-center justify-center gap-3 mb-2">
                <Wallet className="w-8 h-8 text-white" />
                <span className="text-white text-lg font-medium">내 보유 포인트</span>
              </div>
              <div className="text-4xl md:text-5xl font-bold text-white" data-testid="withdrawal-page-point-balance">
                {pointBalance.toLocaleString()}P
              </div>
              <p className="text-amber-100 text-sm mt-2">출금 가능한 포인트입니다</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <Card className="shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  출금 안내
                </CardTitle>
                <CardDescription className="text-blue-100">
                  출금 신청 전 확인사항
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      출금 유의사항
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-2 list-disc list-inside">
                      <li>최소 출금 금액은 <span className="font-bold">10,000원</span>입니다.</li>
                      <li>출금 신청 후 영업일 기준 <span className="font-bold">1~3일</span> 소요됩니다.</li>
                      <li>본인 명의 계좌만 등록 가능합니다.</li>
                      <li>계좌정보가 정확한지 확인해주세요.</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">출금 처리 안내</h4>
                    <p className="text-sm text-amber-700">
                      출금 신청 후 관리자 승인이 완료되면 등록하신 계좌로 입금됩니다.
                      승인 여부는 아래 '출금신청 내역'에서 확인하실 수 있습니다.
                    </p>
                  </div>

                  <div className="text-sm text-gray-500 text-center">
                    <p>영업시간: 평일 09:00 ~ 18:00</p>
                    <p>주말/공휴일은 출금 처리가 되지 않습니다.</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-lg border-gold-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  출금신청서 작성
                </CardTitle>
                <CardDescription>
                  출금받으실 계좌 정보를 입력해주세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-700 font-medium">출금 금액</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="최소 10,000원"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      min="10000"
                      max={pointBalance}
                      step="1000"
                      className="h-11"
                      data-testid="input-withdrawal-amount"
                    />
                    {formData.amount && (
                      <p className="text-sm text-amber-600">
                        {parseInt(formData.amount).toLocaleString()}원
                        {parseInt(formData.amount) > pointBalance && (
                          <span className="text-red-500 ml-2">(잔액 초과)</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bankName" className="text-gray-700 font-medium">은행명</Label>
                    <select
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      required
                      className="w-full h-11 px-3 rounded-md border border-input bg-background ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      data-testid="select-bank-name"
                    >
                      <option value="">은행을 선택하세요</option>
                      {BANK_OPTIONS.map((bank) => (
                        <option key={bank} value={bank}>{bank}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountNumber" className="text-gray-700 font-medium">계좌번호</Label>
                    <Input
                      id="accountNumber"
                      type="text"
                      placeholder="'-' 없이 숫자만 입력"
                      value={formData.accountNumber}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/[^0-9]/g, '') })}
                      required
                      className="h-11"
                      data-testid="input-account-number"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="accountHolder" className="text-gray-700 font-medium">예금주명</Label>
                    <Input
                      id="accountHolder"
                      type="text"
                      placeholder="예금주 성함"
                      value={formData.accountHolder}
                      onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                      required
                      className="h-11"
                      data-testid="input-account-holder"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      출금 전 확인사항
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>본인 명의 계좌만 등록 가능합니다.</li>
                      <li>계좌번호와 예금주명이 정확한지 확인해주세요.</li>
                      <li>잘못된 정보 입력 시 입금이 지연될 수 있습니다.</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold"
                    disabled={loading || pointBalance < 10000}
                    data-testid="button-submit-withdrawal"
                  >
                    {loading ? "신청 중..." : pointBalance < 10000 ? "잔액 부족" : "출금신청 하기"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 shadow-lg">
            <CardHeader>
              <CardTitle>나의 출금신청 내역</CardTitle>
            </CardHeader>
            <CardContent>
              {myRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  출금신청 내역이 없습니다.
                </div>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((request) => (
                    <div 
                      key={request.id} 
                      className={`p-4 border rounded-lg ${
                        request.status === "pending"
                          ? "border-yellow-200 bg-yellow-50"
                          : request.status === "approved"
                          ? "border-green-200 bg-green-50"
                          : "border-red-200 bg-red-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-lg font-bold text-gray-900">
                            {request.amount.toLocaleString()}원
                          </div>
                          <div className="text-sm text-gray-600">
                            {request.bankName} {request.accountNumber}
                          </div>
                          <div className="text-sm text-gray-500">
                            예금주: {request.accountHolder}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(request.requestedAt).toLocaleString("ko-KR")}
                          </div>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(request.status)}
                          {request.adminNote && (
                            <p className="text-xs text-gray-500 mt-2 max-w-[200px]">
                              {request.adminNote}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
