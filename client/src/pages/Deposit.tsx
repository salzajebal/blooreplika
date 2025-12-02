import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { MessageCircle, CheckCircle, Clock, XCircle, ExternalLink } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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

  const { data: kakaoTalkLink } = useQuery<string>({
    queryKey: ["/api/settings/kakaoTalkLink"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/settings/kakaoTalkLink");
        if (!res.ok) return "";
        const result = await res.json();
        return result.data?.value || "";
      } catch {
        return "";
      }
    },
    enabled: !!memberToken,
  });

  const { data: myRequests = [], isLoading: isLoadingRequests } = useQuery<DepositRequest[]>({
    queryKey: ["/api/members/deposit-requests"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/members/deposit-requests", {
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
      const res = await fetch("/api/members/deposit-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${memberToken}`,
        },
        body: JSON.stringify({
          amount,
          bankName: "카카오톡문의",
          accountNumber: "카카오톡문의",
          depositorName: formData.depositorName,
        }),
      });

      if (res.ok) {
        toast({
          title: "신청 완료",
          description: "입금신청이 완료되었습니다. 입금 확인 후 포인트가 충전됩니다.",
        });
        setFormData({ amount: "", depositorName: "" });
        queryClient.invalidateQueries({ queryKey: ["/api/members/deposit-requests"] });
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
      
      <main className="flex-1 py-6 md:py-12 px-4">
        <div className="container-custom max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-center mb-6 md:mb-8 text-gray-900">입금신청</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
            <Card className="shadow-lg border-yellow-300">
              <CardHeader className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  고객센터 안내
                </CardTitle>
                <CardDescription className="text-gray-700">
                  상세안내는 카카오톡 고객센터로 연락바랍니다
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center space-y-6">
                  <div className="p-6 bg-yellow-50 rounded-xl border-2 border-yellow-200">
                    <p className="text-lg font-medium text-gray-800 mb-4">
                      입금 관련 상세 안내는<br />
                      <span className="text-xl font-bold text-yellow-700">카카오톡 고객센터</span>로<br />
                      연락 바랍니다.
                    </p>
                    
                    {kakaoTalkLink ? (
                      <a
                        href={kakaoTalkLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block transition-transform hover:scale-105"
                        data-testid="link-kakao-customer-service"
                      >
                        <div className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold py-4 px-8 rounded-xl shadow-lg flex items-center gap-3 transition-colors">
                          <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
                            <path d="M12 3C6.48 3 2 6.58 2 11c0 2.8 1.8 5.27 4.5 6.7-.15.54-.8 2.87-.83 3.1 0 0-.02.13.07.18.09.05.19.02.19.02.25-.04 2.9-1.9 4.1-2.67.65.1 1.31.17 2 .17 5.52 0 10-3.58 10-8S17.52 3 12 3z"/>
                          </svg>
                          <span className="text-lg">카카오톡 상담하기</span>
                          <ExternalLink className="w-5 h-5" />
                        </div>
                      </a>
                    ) : (
                      <div className="bg-gray-100 text-gray-500 py-4 px-8 rounded-xl">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">카카오톡 링크가 설정되지 않았습니다.</p>
                        <p className="text-xs mt-1">관리자에게 문의해주세요.</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-500">
                    <p>영업시간: 평일 09:00 ~ 18:00</p>
                    <p>점심시간: 12:00 ~ 13:00</p>
                  </div>
                </div>
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
                    disabled={loading}
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
