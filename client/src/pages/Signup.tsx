import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ChevronLeft, Check, Search } from "lucide-react";

const BANKS = [
  "국민은행", "신한은행", "우리은행", "하나은행", "농협은행", "기업은행",
  "SC제일은행", "케이뱅크", "카카오뱅크", "토스뱅크", "새마을금고",
  "우체국", "수협은행", "대구은행", "부산은행", "경남은행", "광주은행",
  "전북은행", "제주은행",
];

const inputCls =
  "w-full h-12 px-4 border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-400 transition-colors";
const labelCls = "block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide";

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
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
    agreeAll: false,
    agreeTerms: false,
    agreePrivacy: false,
    agreeMarketing: false,
  });

  const set = (key: string, value: any) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const handleAgreeAll = (checked: boolean) =>
    setFormData((prev) => ({
      ...prev,
      agreeAll: checked,
      agreeTerms: checked,
      agreePrivacy: checked,
      agreeMarketing: checked,
    }));

  const handleAddressSearch = () => {
    if (!(window as any).daum?.Postcode) {
      toast({ title: "오류", description: "주소 검색 서비스를 불러올 수 없습니다.", variant: "destructive" });
      return;
    }
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        let fullAddress = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        let extra = "";
        if (data.userSelectedType === "R") {
          if (data.bname) extra += data.bname;
          if (data.buildingName) extra += extra ? `, ${data.buildingName}` : data.buildingName;
          if (extra) fullAddress += ` (${extra})`;
        }
        setFormData((prev) => ({ ...prev, zipcode: data.zonecode, address: fullAddress }));
        setTimeout(() => document.getElementById("signup-address-detail")?.focus(), 100);
      },
    }).open();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.passwordConfirm) {
      toast({ title: "비밀번호 불일치", description: "비밀번호와 확인이 일치하지 않습니다.", variant: "destructive" });
      return;
    }
    if (formData.password.length < 8) {
      toast({ title: "비밀번호 오류", description: "비밀번호는 8자 이상이어야 합니다.", variant: "destructive" });
      return;
    }
    if (!formData.agreeTerms || !formData.agreePrivacy) {
      toast({ title: "약관 동의 필요", description: "필수 약관에 동의해주세요.", variant: "destructive" });
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
          address: formData.zipcode
            ? `(${formData.zipcode}) ${formData.address} ${formData.addressDetail}`.trim()
            : formData.address,
          bank: formData.bank || null,
          accountNumber: formData.accountNumber || null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "회원가입 완료", description: "로그인해주세요." });
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get("redirect");
        setLocation(redirect ? `/login?redirect=${redirect}` : "/login");
      } else {
        toast({ title: "회원가입 실패", description: data.error || "오류가 발생했습니다.", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "회원가입 처리 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Top bar */}
      <div className="max-w-[640px] w-full mx-auto bg-white border-b border-gray-100">
        <div className="flex items-center px-4 py-3">
          <button
            onClick={() => window.history.back()}
            className="p-1 -ml-1 text-gray-500 hover:text-gray-800 transition-colors"
            aria-label="뒤로가기"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Link href="/" className="mx-auto">
            <span className="text-base font-black tracking-widest text-gray-900 uppercase">VELOUR</span>
          </Link>
          <div className="w-7" />
        </div>
      </div>

      <main className="flex-1 max-w-[640px] w-full mx-auto bg-white pb-24">
        <div className="px-6 pt-8 pb-10">
          {/* Title */}
          <div className="mb-7">
            <h1 className="text-xl font-bold text-gray-900 mb-1">회원가입</h1>
            <p className="text-sm text-gray-400">velour 회원이 되어 다양한 혜택을 누리세요</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이름 */}
            <div>
              <label className={labelCls}>이름 <span className="text-[#FF6100]">*</span></label>
              <input
                type="text"
                placeholder="이름을 입력해주세요"
                className={inputCls}
                value={formData.name}
                onChange={(e) => set("name", e.target.value)}
                required
                data-testid="input-name"
              />
            </div>

            {/* 아이디 */}
            <div>
              <label className={labelCls}>아이디 <span className="text-[#FF6100]">*</span></label>
              <input
                type="text"
                placeholder="영문, 숫자 4~20자"
                className={inputCls}
                value={formData.username}
                onChange={(e) => set("username", e.target.value)}
                required
                minLength={4}
                maxLength={20}
                data-testid="input-username"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label className={labelCls}>이메일 <span className="text-gray-300 font-normal normal-case">(선택)</span></label>
              <input
                type="email"
                placeholder="이메일을 입력해주세요"
                className={inputCls}
                value={formData.email}
                onChange={(e) => set("email", e.target.value)}
                data-testid="input-email"
              />
            </div>

            {/* 휴대폰 */}
            <div>
              <label className={labelCls}>휴대폰 번호 <span className="text-[#FF6100]">*</span></label>
              <input
                type="tel"
                placeholder="010-0000-0000"
                className={inputCls}
                value={formData.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                data-testid="input-phone"
              />
            </div>

            {/* 주소 */}
            <div>
              <label className={labelCls}>주소 <span className="text-[#FF6100]">*</span></label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="우편번호"
                  className={`${inputCls} flex-1 cursor-pointer`}
                  value={formData.zipcode}
                  readOnly
                  onClick={handleAddressSearch}
                  data-testid="input-zipcode"
                />
                <button
                  type="button"
                  onClick={handleAddressSearch}
                  className="flex-shrink-0 h-12 px-4 border border-gray-200 text-sm text-gray-600 font-medium hover:border-gray-400 hover:text-gray-900 transition-colors flex items-center gap-1.5"
                  data-testid="button-address-search"
                >
                  <Search className="w-3.5 h-3.5" />
                  주소 검색
                </button>
              </div>
              <input
                type="text"
                placeholder="주소 검색 버튼을 눌러주세요"
                className={`${inputCls} cursor-pointer mb-2`}
                value={formData.address}
                readOnly
                onClick={handleAddressSearch}
                required
                data-testid="input-address"
              />
              <input
                id="signup-address-detail"
                type="text"
                placeholder="상세주소 (동/호수)"
                className={inputCls}
                value={formData.addressDetail}
                onChange={(e) => set("addressDetail", e.target.value)}
                data-testid="input-address-detail"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label className={labelCls}>비밀번호 <span className="text-[#FF6100]">*</span></label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="영문, 숫자 8자 이상"
                  className={`${inputCls} pr-11`}
                  value={formData.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  data-testid="input-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label className={labelCls}>비밀번호 확인 <span className="text-[#FF6100]">*</span></label>
              <div className="relative">
                <input
                  type={showPasswordConfirm ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력해주세요"
                  className={`${inputCls} pr-11 ${
                    formData.passwordConfirm && formData.password !== formData.passwordConfirm
                      ? "border-red-300 focus:border-red-400"
                      : formData.passwordConfirm && formData.password === formData.passwordConfirm
                      ? "border-green-300 focus:border-green-400"
                      : ""
                  }`}
                  value={formData.passwordConfirm}
                  onChange={(e) => set("passwordConfirm", e.target.value)}
                  required
                  data-testid="input-password-confirm"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 transition-colors"
                  tabIndex={-1}
                >
                  {showPasswordConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {formData.passwordConfirm && formData.password !== formData.passwordConfirm && (
                <p className="text-xs text-red-400 mt-1">비밀번호가 일치하지 않습니다.</p>
              )}
              {formData.passwordConfirm && formData.password === formData.passwordConfirm && (
                <p className="text-xs text-green-500 mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> 비밀번호가 일치합니다.
                </p>
              )}
            </div>

            {/* 환급 계좌 (선택) */}
            <div className="border-t border-gray-100 pt-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">환급 계좌 <span className="font-normal normal-case">(선택)</span></p>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>은행</label>
                  <select
                    className="w-full h-12 px-4 border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-gray-400 transition-colors appearance-none"
                    value={formData.bank}
                    onChange={(e) => set("bank", e.target.value)}
                    data-testid="select-bank"
                  >
                    <option value="">은행을 선택해주세요</option>
                    {BANKS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>계좌번호</label>
                  <input
                    type="text"
                    placeholder="계좌번호 (- 없이)"
                    className={inputCls}
                    value={formData.accountNumber}
                    onChange={(e) => set("accountNumber", e.target.value)}
                    data-testid="input-account-number"
                  />
                </div>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="border-t border-gray-100 pt-5 space-y-3">
              {/* 전체 동의 */}
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 border border-gray-100">
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    formData.agreeAll ? "bg-[#FF6100] border-[#FF6100]" : "border-gray-300 bg-white"
                  }`}
                >
                  {formData.agreeAll && <Check className="w-3 h-3 text-white" />}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={formData.agreeAll}
                  onChange={(e) => handleAgreeAll(e.target.checked)}
                />
                <span className="text-sm font-semibold text-gray-800">전체 동의</span>
              </label>

              {/* 이용약관 */}
              <label className="flex items-center gap-3 cursor-pointer px-1">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    formData.agreeTerms ? "bg-[#FF6100] border-[#FF6100]" : "border-gray-300 bg-white"
                  }`}
                >
                  {formData.agreeTerms && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={formData.agreeTerms}
                  onChange={(e) => { set("agreeTerms", e.target.checked); if (!e.target.checked) set("agreeAll", false); }} required />
                <span className="text-sm text-gray-600">
                  <span className="text-[#FF6100] font-medium">[필수]</span> 이용약관 동의
                </span>
              </label>

              {/* 개인정보 */}
              <label className="flex items-center gap-3 cursor-pointer px-1">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    formData.agreePrivacy ? "bg-[#FF6100] border-[#FF6100]" : "border-gray-300 bg-white"
                  }`}
                >
                  {formData.agreePrivacy && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={formData.agreePrivacy}
                  onChange={(e) => { set("agreePrivacy", e.target.checked); if (!e.target.checked) set("agreeAll", false); }} required />
                <span className="text-sm text-gray-600">
                  <span className="text-[#FF6100] font-medium">[필수]</span> 개인정보 수집 및 이용 동의
                </span>
              </label>

              {/* 마케팅 */}
              <label className="flex items-center gap-3 cursor-pointer px-1">
                <div
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    formData.agreeMarketing ? "bg-[#FF6100] border-[#FF6100]" : "border-gray-300 bg-white"
                  }`}
                >
                  {formData.agreeMarketing && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <input type="checkbox" className="sr-only" checked={formData.agreeMarketing}
                  onChange={(e) => { set("agreeMarketing", e.target.checked); }} />
                <span className="text-sm text-gray-600">
                  <span className="text-gray-400 font-medium">[선택]</span> 마케팅 정보 수신 동의
                </span>
              </label>
            </div>

            {/* 가입 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#FF6100] hover:bg-orange-600 active:bg-orange-700 text-white text-sm font-bold tracking-wide disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
              data-testid="button-submit-signup"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  처리 중...
                </span>
              ) : "회원가입"}
            </button>
          </form>

          {/* 로그인 링크 */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-300">또는</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-400 mb-3">이미 회원이신가요?</p>
            <Link href="/login">
              <button
                className="w-full h-12 border border-gray-200 text-gray-700 text-sm font-medium hover:border-gray-400 hover:text-gray-900 transition-colors"
                data-testid="button-login-link"
              >
                로그인
              </button>
            </Link>
          </div>

          {/* 혜택 안내 */}
          <div className="mt-8 bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">회원 혜택</p>
            <ul className="space-y-1 text-xs text-gray-400">
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#FF6100]" />회원 전용 특가 상품 이용 가능</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#FF6100]" />구매 금액 포인트 적립</li>
              <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-[#FF6100]" />1:1 전담 상담원 배정</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
