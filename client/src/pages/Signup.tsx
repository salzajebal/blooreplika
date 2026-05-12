import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { User, Mail, Lock, Phone, Check, MapPin, Building2, CreditCard, Search } from "lucide-react";
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
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    phone: "",
    zipcode: "",
    address: "",
    addressDetail: "",
    bank: "",
    accountNumber: "",
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const handleAddressSearch = () => {
    if (!window.daum?.Postcode) {
      toast({
        title: "오류",
        description: "주소 검색 서비스를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }
    new window.daum.Postcode({
      oncomplete: (data: any) => {
        let fullAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        let extraAddress = "";
        if (data.userSelectedType === "R") {
          if (data.bname) extraAddress += data.bname;
          if (data.buildingName) {
            extraAddress += extraAddress ? `, ${data.buildingName}` : data.buildingName;
          }
          if (extraAddress) fullAddress += ` (${extraAddress})`;
        }
        setFormData(prev => ({
          ...prev,
          zipcode: data.zonecode,
          address: fullAddress,
        }));
        setTimeout(() => {
          document.getElementById("signup-address-detail")?.focus();
        }, 100);
      },
    }).open();
  };

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
          username: formData.username,
          email: formData.email || null,
          password: formData.password,
          phone: formData.phone,
          address: formData.zipcode ? `(${formData.zipcode}) ${formData.address} ${formData.addressDetail}`.trim() : formData.address,
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
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        setLocation(redirect ? `/login?redirect=${redirect}` : "/login");
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

  const inputCls = "pl-10 h-12 rounded-none bg-[#1a1a1a] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0";
  const labelCls = "block text-sm font-medium text-[#aaaaaa] mb-2";
  const iconCls = "absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#555555]";

  return (
    <div className="min-h-screen bg-[#0f0f0f] font-sans">
      <Header />
      
      <main className="container-custom py-10 sm:py-16 pb-24 md:pb-16">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">회원가입</h1>
            <p className="text-[#888888]">velour 회원이 되어 다양한 혜택을 누리세요</p>
          </div>

          <div className="bg-[#161616] p-8 border border-[#2a2a2a]">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className={labelCls}>이름 <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User className={iconCls} />
                  <Input type="text" placeholder="이름을 입력해주세요" className={inputCls}
                    value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-name" required />
                </div>
              </div>

              <div>
                <label className={labelCls}>아이디 <span className="text-red-400">*</span></label>
                <div className="relative">
                  <User className={iconCls} />
                  <Input type="text" placeholder="아이디를 입력해주세요 (영문, 숫자 4-20자)" className={inputCls}
                    value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    data-testid="input-username" required minLength={4} maxLength={20} />
                </div>
              </div>

              <div>
                <label className={labelCls}>이메일</label>
                <div className="relative">
                  <Mail className={iconCls} />
                  <Input type="email" placeholder="이메일을 입력해주세요 (선택)" className={inputCls}
                    value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="input-email" />
                </div>
              </div>

              <div>
                <label className={labelCls}>휴대폰 번호 <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Phone className={iconCls} />
                  <Input type="tel" placeholder="휴대폰 번호를 입력해주세요 (예: 010-1234-5678)" className={inputCls}
                    value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    data-testid="input-phone" required />
                </div>
              </div>

              <div>
                <label className={labelCls}>주소 <span className="text-red-400">*</span></label>
                <div className="flex gap-2 mb-2">
                  <div className="relative flex-1">
                    <MapPin className={iconCls} />
                    <Input type="text" placeholder="우편번호"
                      className="pl-10 h-12 rounded-none bg-[#111111] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] cursor-pointer"
                      value={formData.zipcode} readOnly onClick={handleAddressSearch} data-testid="input-zipcode" />
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddressSearch}
                    className="h-12 rounded-none shrink-0 gap-1.5 border-[#333333] bg-[#1a1a1a] text-[#888888] hover:border-[#c9a96e] hover:text-white"
                    data-testid="button-address-search">
                    <Search className="w-4 h-4" />
                    주소 검색
                  </Button>
                </div>
                <Input type="text" placeholder="주소 검색 버튼을 눌러주세요"
                  className="h-12 rounded-none bg-[#111111] border-[#333333] text-[#f0f0f0] placeholder:text-[#444444] cursor-pointer mb-2"
                  value={formData.address} readOnly onClick={handleAddressSearch} data-testid="input-address" required />
                <Input id="signup-address-detail" type="text" placeholder="상세주소를 입력해주세요 (동/호수)"
                  className={inputCls} value={formData.addressDetail}
                  onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                  data-testid="input-address-detail" />
              </div>

              <div className="border-t border-[#2a2a2a] pt-5">
                <p className="text-sm text-[#888888] mb-4">환급 계좌 정보 (선택사항)</p>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>은행 선택</label>
                    <div className="relative">
                      <Building2 className={iconCls} />
                      <select className="w-full pl-10 h-12 border border-[#333333] bg-[#1a1a1a] text-[#f0f0f0] focus:outline-none focus:border-[#c9a96e]"
                        value={formData.bank} onChange={(e) => setFormData({ ...formData, bank: e.target.value })}
                        data-testid="select-bank">
                        <option value="">은행을 선택해주세요</option>
                        {BANKS.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>계좌번호</label>
                    <div className="relative">
                      <CreditCard className={iconCls} />
                      <Input type="text" placeholder="계좌번호를 입력해주세요 (- 없이)" className={inputCls}
                        value={formData.accountNumber}
                        onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                        data-testid="input-account-number" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-5">
                <div>
                  <label className={labelCls}>비밀번호 <span className="text-red-400">*</span></label>
                  <div className="relative">
                    <Lock className={iconCls} />
                    <Input type="password" placeholder="비밀번호를 입력해주세요" className={inputCls}
                      value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      data-testid="input-password" required />
                  </div>
                  <p className="text-xs text-[#555555] mt-1">영문, 숫자 8자리 이상</p>
                </div>
              </div>

              <div>
                <label className={labelCls}>비밀번호 확인 <span className="text-red-400">*</span></label>
                <div className="relative">
                  <Lock className={iconCls} />
                  <Input type="password" placeholder="비밀번호를 다시 입력해주세요" className={inputCls}
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    data-testid="input-password-confirm" required />
                </div>
              </div>

              <div className="border-t border-[#2a2a2a] pt-5 space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 accent-[#c9a96e] border-[#333333]"
                    checked={formData.agreeTerms} onChange={(e) => setFormData({ ...formData, agreeTerms: e.target.checked })} required />
                  <span className="text-sm text-[#aaaaaa]">
                    <span className="text-red-400">[필수]</span> 이용약관에 동의합니다
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 accent-[#c9a96e] border-[#333333]"
                    checked={formData.agreePrivacy} onChange={(e) => setFormData({ ...formData, agreePrivacy: e.target.checked })} required />
                  <span className="text-sm text-[#aaaaaa]">
                    <span className="text-red-400">[필수]</span> 개인정보 수집 및 이용에 동의합니다
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 accent-[#c9a96e] border-[#333333]"
                    checked={formData.agreeMarketing} onChange={(e) => setFormData({ ...formData, agreeMarketing: e.target.checked })} />
                  <span className="text-sm text-[#aaaaaa]">
                    <span className="text-[#555555]">[선택]</span> 마케팅 정보 수신에 동의합니다
                  </span>
                </label>
              </div>

              <div className="bg-[#1a1500] border border-[#c9a96e]/30 p-4 text-sm text-[#c9a96e]">
                <p className="font-medium mb-1">안내사항</p>
                <p className="text-[#c9a96e]/70">회원가입 후 개인정보 수정은 관리자에게 문의해주세요.</p>
              </div>

              <Button type="submit"
                className="w-full h-14 bg-[#c9a96e] hover:bg-[#b8945f] text-black rounded-none text-base font-bold"
                data-testid="button-submit-signup" disabled={loading}>
                {loading ? "처리 중..." : "회원가입"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-[#888888]">
              이미 회원이신가요?{" "}
              <Link href="/login" className="text-[#c9a96e] hover:text-white font-medium">
                로그인
              </Link>
            </div>
          </div>

          <div className="mt-8 bg-[#161616] p-6 border border-[#2a2a2a]">
            <h3 className="font-bold text-white mb-4">회원 혜택 안내</h3>
            <ul className="space-y-3 text-sm text-[#888888]">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#c9a96e] flex-shrink-0 mt-0.5" />
                <span>회원 전용 특별 할인가 적용</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#c9a96e] flex-shrink-0 mt-0.5" />
                <span>적립금 및 포인트 혜택</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-[#c9a96e] flex-shrink-0 mt-0.5" />
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
