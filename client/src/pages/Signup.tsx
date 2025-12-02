import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User, Mail, Lock, Phone, Check, MapPin, Building2, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const BANKS = [
  "국민은행",
  "신한은행",
  "우리은행",
  "하나은행",
  "농협은행",
  "기업은행",
  "SC제일은행",
  "케이뱅크",
  "카카오뱅크",
  "토스뱅크",
  "새마을금고",
  "우체국",
  "수협은행",
  "대구은행",
  "부산은행",
  "경남은행",
  "광주은행",
  "전북은행",
  "제주은행",
];

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    address: "",
    bank: "",
    accountNumber: "",
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.passwordConfirm) {
      toast({
        title: "비밀번호 불일치",
        description: "비밀번호와 비밀번호 확인이 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 8) {
      toast({
        title: "비밀번호 오류",
        description: "비밀번호는 8자 이상이어야 합니다.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.agreeTerms || !formData.agreePrivacy) {
      toast({
        title: "약관 동의 필요",
        description: "필수 약관에 동의해주세요.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/members/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          phone: formData.phone,
          address: formData.address,
          bank: formData.bank || null,
          accountNumber: formData.accountNumber || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast({
          title: "회원가입 완료",
          description: "회원가입이 완료되었습니다. 로그인해주세요.",
        });
        setLocation("/login");
      } else {
        toast({
          title: "회원가입 실패",
          description: data.error || "회원가입 처리 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "회원가입 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />
      
      <main className="container-custom py-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">회원가입</h1>
            <p className="text-gray-500">한국골드금거래소 회원이 되어 다양한 혜택을 누리세요</p>
          </div>

          <div className="bg-white p-8 shadow-sm border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이름 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="이름을 입력해주세요"
                    className="pl-10 h-12 rounded-none"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">이메일 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="이메일 주소를 입력해주세요"
                    className="pl-10 h-12 rounded-none"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="input-email"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">휴대폰 번호 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="tel"
                    placeholder="휴대폰 번호를 입력해주세요 (예: 010-1234-5678)"
                    className="pl-10 h-12 rounded-none"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-phone"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">주소 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="주소를 입력해주세요"
                    className="pl-10 h-12 rounded-none"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    data-testid="input-address"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <p className="text-sm text-gray-500 mb-4">환급 계좌 정보 (선택사항)</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">은행 선택</label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        className="w-full pl-10 h-12 border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        value={formData.bank}
                        onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                        data-testid="select-bank"
                      >
                        <option value="">은행을 선택해주세요</option>
                        {BANKS.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">계좌번호</label>
                    <div className="relative">
                      <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="계좌번호를 입력해주세요 (- 없이)"
                        className="pl-10 h-12 rounded-none"
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        data-testid="input-account-number"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="password"
                      placeholder="비밀번호를 입력해주세요"
                      className="pl-10 h-12 rounded-none"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      data-testid="input-password"
                      required
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">영문, 숫자, 특수문자 조합 8자리 이상</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호 확인 <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="비밀번호를 다시 입력해주세요"
                    className="pl-10 h-12 rounded-none"
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    data-testid="input-password-confirm"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-gray-100 pt-5 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-primary border-gray-300 rounded"
                    checked={formData.agreeTerms}
                    onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })}
                    required
                  />
                  <span className="text-sm text-gray-700">
                    <span className="text-red-500">[필수]</span> 이용약관에 동의합니다
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-primary border-gray-300 rounded"
                    checked={formData.agreePrivacy}
                    onChange={(e) => setFormData({ ...formData, agreePrivacy: e.target.checked })}
                    required
                  />
                  <span className="text-sm text-gray-700">
                    <span className="text-red-500">[필수]</span> 개인정보 수집 및 이용에 동의합니다
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-primary border-gray-300 rounded"
                    checked={formData.agreeMarketing}
                    onChange={(e) => setFormData({ ...formData, agreeMarketing: e.target.checked })}
                  />
                  <span className="text-sm text-gray-700">
                    <span className="text-gray-400">[선택]</span> 마케팅 정보 수신에 동의합니다
                  </span>
                </label>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <p className="font-medium mb-1">안내사항</p>
                <p>회원가입 후 개인정보 수정은 관리자에게 문의해주세요.</p>
              </div>

              <Button 
                type="submit"
                className="w-full h-14 bg-primary hover:bg-primary/90 text-white rounded-none text-base font-bold"
                data-testid="button-submit-signup"
                disabled={loading}
              >
                {loading ? "처리 중..." : "회원가입"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
              이미 회원이신가요?{" "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                로그인
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-white p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">회원 혜택 안내</h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>실시간 금시세 알림 서비스</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>회원 전용 특별 할인가 적용</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>적립금 및 포인트 혜택</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                <span>1:1 전담 상담원 배정</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
