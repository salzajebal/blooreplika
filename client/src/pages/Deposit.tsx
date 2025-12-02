import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Banknote, Copy, CheckCircle, Clock, XCircle, Info } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface DepositAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  isActive: boolean;
}

interface DepositRequest {
  id: string;
  amount: number;
  depositorName: string;
  status: string;
  requestedAt: string;
  adminNote?: string;
}

export default function Deposit() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    amount: "",
    depositorName: "",
  });

  const memberToken = localStorage.getItem("memberToken");
  const memberName = localStorage.getItem("memberName");
  const memberEmail = localStorage.getItem("memberEmail");
  const memberId = localStorage.getItem("memberId");

  useEffect(() => {
    if (!memberToken) {
      toast({
        title: "로그인 필요",
        description: "입금신청을 하려면 먼저 로그인해주세요.",
        variant: "destructive",
      });
      setLocation("/login");
    }
  }, [memberToken, setLocation, toast]);

  const { data: depositAccount } = useQuery<DepositAccount>({
    queryKey: ["/api/settings/deposit-account"],
    enabled: !!memberToken,
  });

  const { data: myRequests = [] } = useQuery<DepositRequest[]>({
    queryKey: ["/api/deposit-requests/my"],
    queryFn: async () => {
      const res = await fetch("/api/deposit-requests/my", {
        headers: {
          "Authorization": `Bearer ${memberToken}`,
        },
      });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
    enabled: !!memberToken,
  });

  const handleCopyAccount = () => {
    if (depositAccount) {
      navigator.clipboard.writeText(depositAccount.accountNumber);
      setCopied(true);
      toast({
        title: "복사 완료",
        description: "계좌번호가 클립보드에 복사되었습니다.",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

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
        description: "최소 10,000원 이상 입금 가능합니다.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/deposit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          memberId,
          memberName,
          memberEmail,
          amount,
          bankName: depositAccount?.bankName || "",
          accountNumber: depositAccount?.accountNumber || "",
          depositorName: formData.depositorName,
          status: "pending",
        }),
      });

      if (res.ok) {
        toast({
          title: "신청 완료",
          description: "입금신청이 완료되었습니다. 입금 확인 후 포인트가 충전됩니다.",
        });
        setFormData({ amount: "", depositorName: "" });
        queryClient.invalidateQueries({ queryKey: ["/api/deposit-requests/my"] });
      } else {
        const data = await res.json();
        throw new Error(data.error || "신청 실패");
      }
    } catch (error: any) {
      toast({
        title: "오류",
        description: error.message || "입금신청 처리 중 오류가 발생했습니다.",
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
      
      <main className="flex-1 py-12 px-4">
        <div className="container-custom max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-8 text-gray-900">입금신청</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="shadow-lg border-amber-200">
              <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="w-5 h-5" />
                  입금 계좌 안내
                </CardTitle>
                <CardDescription className="text-amber-100">
                  아래 계좌로 입금 후 신청해주세요
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                {depositAccount ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-sm text-gray-600 mb-1">은행</div>
                      <div className="text-xl font-bold text-gray-900">{depositAccount.bankName}</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-sm text-gray-600 mb-1">계좌번호</div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-gray-900">{depositAccount.accountNumber}</span>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={handleCopyAccount}
                          className="flex-shrink-0"
                        >
                          {copied ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="text-sm text-gray-600 mb-1">예금주</div>
                      <div className="text-xl font-bold text-gray-900">{depositAccount.accountHolder}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Info className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>입금 계좌 정보가 설정되지 않았습니다.</p>
                    <p className="text-sm mt-2">관리자에게 문의해주세요.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-lg border-gold-200">
              <CardHeader>
                <CardTitle>입금신청서 작성</CardTitle>
                <CardDescription>
                  입금 완료 후 아래 양식을 작성해주세요
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-gray-700 font-medium">입금 금액</Label>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="최소 10,000원"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      min="10000"
                      step="1000"
                      className="h-11"
                      data-testid="input-deposit-amount"
                    />
                    {formData.amount && (
                      <p className="text-sm text-amber-600">
                        {parseInt(formData.amount).toLocaleString()}원
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depositorName" className="text-gray-700 font-medium">입금자명</Label>
                    <Input
                      id="depositorName"
                      type="text"
                      placeholder="실제 입금하신 분의 성함"
                      value={formData.depositorName}
                      onChange={(e) => setFormData({ ...formData, depositorName: e.target.value })}
                      required
                      className="h-11"
                      data-testid="input-depositor-name"
                    />
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600">
                    <p className="font-medium mb-2">입금 전 확인사항</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>입금자명과 신청서의 이름이 일치해야 합니다.</li>
                      <li>입금 확인까지 영업일 기준 1-2일 소요됩니다.</li>
                      <li>주말/공휴일 입금은 다음 영업일에 처리됩니다.</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-12 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold"
                    disabled={loading || !depositAccount}
                    data-testid="button-submit-deposit"
                  >
                    {loading ? "신청 중..." : "입금신청 하기"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-8 shadow-lg">
            <CardHeader>
              <CardTitle>나의 입금신청 내역</CardTitle>
            </CardHeader>
            <CardContent>
              {myRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  입금신청 내역이 없습니다.
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
                            입금자: {request.depositorName}
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
