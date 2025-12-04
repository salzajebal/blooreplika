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
  status: string;
  requestedAt: string;
  adminNote?: string;
}

export default function Withdrawal() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");

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

    const amountValue = parseInt(amount);
    if (isNaN(amountValue) || amountValue < 10000) {
      toast({
        title: "금액 오류",
        description: "최소 10,000원 이상 출금 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    if (amountValue > pointBalance) {
      toast({
        title: "잔액 부족",
        description: "보유 포인트보다 많은 금액은 출금할 수 없습니다.",
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
          amount: amountValue,
        }),
      });

      if (res.ok) {
        toast({
          title: "신청 완료",
          description: "출금신청이 완료되었습니다. 관리자 승인 후 처리됩니다.",
        });
        setAmount("");
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
                      <li>출금 신청 후 관리자 승인이 필요합니다.</li>
                      <li>승인 후 처리됩니다.</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-2">출금 처리 안내</h4>
                    <p className="text-sm text-amber-700">
                      출금 신청 후 관리자 승인이 완료되면 처리됩니다.
                      승인 여부는 아래 '출금신청 내역'에서 확인하실 수 있습니다.
                    </p>
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
                  출금할 금액을 입력해주세요
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
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      required
                      min="10000"
                      max={pointBalance}
                      step="1000"
                      className="h-11 text-lg"
                      data-testid="input-withdrawal-amount"
                    />
                    {amount && (
                      <p className="text-sm text-amber-600">
                        {parseInt(amount).toLocaleString()}원
                        {parseInt(amount) > pointBalance && (
                          <span className="text-red-500 ml-2">(잔액 초과)</span>
                        )}
                      </p>
                    )}
                  </div>

                  <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-700">
                    <p className="font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-500" />
                      출금 안내
                    </p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>출금 신청 후 관리자 승인 후 처리됩니다.</li>
                      <li>승인 여부는 아래 내역에서 확인하실 수 있습니다.</li>
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
