import { useState, useRef } from "react";
import { X, Camera, Eye, EyeOff, Search, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

const inp = "w-full h-11 px-4 border border-gray-200 text-[14px] text-gray-800 placeholder-gray-300 outline-none focus:border-gray-400 transition-colors";

export function SignupModal({ isOpen, onClose, onSwitchToLogin }: SignupModalProps) {
  const [step, setStep] = useState<"terms" | "form">("terms");
  const { toast } = useToast();

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAge, setAgreeAge] = useState(false);

  const [loading, setLoading] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [showPwConfirm, setShowPwConfirm] = useState(false);
  const [form, setForm] = useState({
    email: "", password: "", passwordConfirm: "",
    name: "", phone: "", address: "", addressDetail: "", zipcode: "",
  });

  const photoRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const setF = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }));

  const handleAgreeAll = (checked: boolean) => {
    setAgreeAll(checked);
    setAgreeTerms(checked);
    setAgreePrivacy(checked);
    setAgreeAge(checked);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setProfilePhotoUrl(URL.createObjectURL(file));
  };

  const handleAddressSearch = () => {
    if (!(window as any).daum?.Postcode) return;
    new (window as any).daum.Postcode({
      oncomplete: (data: any) => {
        const addr = data.userSelectedType === "R" ? data.roadAddress : data.jibunAddress;
        setForm(p => ({ ...p, zipcode: data.zonecode, address: addr }));
      },
    }).open();
  };

  const handleSubmit = async () => {
    if (!form.email || !form.name || !form.phone) {
      toast({ title: "필수 항목을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (form.password.length < 8) {
      toast({ title: "비밀번호는 8자 이상이어야 합니다.", variant: "destructive" });
      return;
    }
    if (form.password !== form.passwordConfirm) {
      toast({ title: "비밀번호가 일치하지 않습니다.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const username = form.email.split("@")[0] + "_" + Date.now().toString().slice(-5);
      const res = await fetch("/api/members/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username,
          email: form.email,
          password: form.password,
          phone: form.phone,
          address: form.zipcode
            ? `(${form.zipcode}) ${form.address} ${form.addressDetail}`.trim()
            : `${form.address} ${form.addressDetail}`.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "회원가입 완료", description: "로그인해주세요." });
        handleClose();
        if (onSwitchToLogin) onSwitchToLogin();
      } else {
        toast({ title: "회원가입 실패", description: data.error || "오류가 발생했습니다.", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep("terms");
    setAgreeAll(false); setAgreeTerms(false); setAgreePrivacy(false); setAgreeAge(false);
    setForm({ email: "", password: "", passwordConfirm: "", name: "", phone: "", address: "", addressDetail: "", zipcode: "" });
    setProfilePhotoUrl(null);
    setShowPw(false); setShowPwConfirm(false);
    onClose();
  };

  const handleTermsNext = () => {
    if (!agreeTerms || !agreePrivacy || !agreeAge) {
      toast({ title: "필수 약관에 모두 동의해주세요.", variant: "destructive" });
      return;
    }
    setStep("form");
  };

  return (
    <div
      className="fixed inset-0 z-[350] flex items-center justify-center"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
      data-testid="signup-modal-overlay"
    >
      <div
        className="bg-white w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        style={{ maxWidth: 400 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex items-center justify-center px-6 pt-7 pb-5 border-b border-gray-100">
          <h2 className="text-[20px] font-bold text-gray-900 tracking-wide">
            {step === "terms" ? "약관동의" : "회원가입 정보 입력"}
          </h2>
          <button
            onClick={handleClose}
            className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-700 transition-colors"
            data-testid="signup-modal-close"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Step 1: 약관동의 ── */}
        {step === "terms" && (
          <div className="px-6 py-5">
            {/* 전체 동의 */}
            <label className="flex items-start gap-3 cursor-pointer py-3 border-b border-gray-100">
              <input
                type="checkbox"
                checked={agreeAll}
                onChange={(e) => handleAgreeAll(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-gray-700 flex-shrink-0"
              />
              <span className="text-[13px] text-gray-700 leading-relaxed">
                이용약관, 개인정보 수집 및 이용에 모두 동의합니다.
              </span>
            </label>

            {/* 이용약관 */}
            <div className="py-3 border-b border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => { setAgreeTerms(e.target.checked); if (!e.target.checked) setAgreeAll(false); }}
                  className="w-4 h-4 accent-gray-700"
                />
                <span className="text-[13px] text-gray-700">
                  이용약관 동의 <span className="text-[#e53e3e]">(필수)</span>
                </span>
              </label>
              <div className="h-[90px] overflow-y-auto border border-gray-200 p-3 text-[11px] text-gray-500 bg-gray-50 leading-relaxed">
                <strong>제1조 목적</strong><br />
                본 이용약관은 "BLOO"(이하 "사이트")의 서비스 이용조건과 운영에 관한 제반 사항을 규정함을 목적으로 합니다.<br /><br />
                <strong>제2조 약관의 효력 및 변경</strong><br />
                본 약관의 내용은 서비스 화면에 게시하거나 기타의 방법으로 공지함으로써 효력을 발생합니다.<br /><br />
                <strong>제3조 이용계약의 성립</strong><br />
                이용계약은 회원가입 신청자가 본 약관에 동의함으로써 성립합니다.
              </div>
            </div>

            {/* 개인정보 수집 */}
            <div className="py-3 border-b border-gray-100">
              <label className="flex items-center gap-3 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={agreePrivacy}
                  onChange={(e) => { setAgreePrivacy(e.target.checked); if (!e.target.checked) setAgreeAll(false); }}
                  className="w-4 h-4 accent-gray-700"
                />
                <span className="text-[13px] text-gray-700">
                  개인정보 수집 및 이용 동의 <span className="text-[#e53e3e]">(필수)</span>
                </span>
              </label>
              <div className="h-[90px] overflow-y-auto border border-gray-200 p-3 text-[11px] text-gray-500 bg-gray-50 leading-relaxed">
                <strong>1. 개인정보 수집목적 및 이용목적</strong><br />
                (1) 홈페이지 회원 가입 및 관리<br />
                회원 가입 의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원 자격 유지·관리에 따라 사용됩니다.<br /><br />
                <strong>2. 수집하는 개인정보 항목</strong><br />
                이메일, 이름, 연락처, 주소 등 서비스 제공을 위한 최소한의 항목을 수집합니다.
              </div>
            </div>

            {/* 만 14세 */}
            <label className="flex items-center gap-3 cursor-pointer py-3">
              <input
                type="checkbox"
                checked={agreeAge}
                onChange={(e) => { setAgreeAge(e.target.checked); if (!e.target.checked) setAgreeAll(false); }}
                className="w-4 h-4 accent-gray-700"
              />
              <span className="text-[13px] text-gray-700">
                만 14세 이상입니다. <span className="text-[#e53e3e]">(필수)</span>
              </span>
            </label>

            {/* 버튼 */}
            <div className="flex gap-3 mt-3">
              <button
                onClick={handleClose}
                className="flex-1 h-12 border border-gray-300 text-[14px] text-gray-600 hover:border-gray-500 transition-colors"
                data-testid="terms-cancel-btn"
              >
                취소
              </button>
              <button
                onClick={handleTermsNext}
                className="flex-1 h-12 bg-[#e53e3e] hover:bg-[#c53030] text-white text-[14px] font-bold transition-colors"
                data-testid="terms-agree-btn"
              >
                가입하기
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3: 회원가입 폼 ── */}
        {step === "form" && (
          <div className="px-6 pb-8">
            {/* 프로필 사진 */}
            <div className="flex justify-center py-5">
              <div className="relative">
                <div
                  className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200 flex items-center justify-center overflow-hidden cursor-pointer"
                  onClick={() => photoRef.current?.click()}
                >
                  {profilePhotoUrl ? (
                    <img src={profilePhotoUrl} alt="프로필" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoRef.current?.click()}
                  className="absolute bottom-0 right-0 w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center"
                  aria-label="사진 업로드"
                >
                  <Camera className="w-3 h-3 text-white" />
                </button>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {/* 이메일 */}
              <input
                type="email"
                placeholder="이메일"
                value={form.email}
                onChange={(e) => setF("email", e.target.value)}
                className={inp}
                data-testid="signup-email-input"
              />

              {/* 비밀번호 */}
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="비밀번호"
                  value={form.password}
                  onChange={(e) => setF("password", e.target.value)}
                  className={`${inp} pr-10`}
                  data-testid="signup-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                  tabIndex={-1}
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* 비밀번호 확인 */}
              <div className="relative">
                <input
                  type={showPwConfirm ? "text" : "password"}
                  placeholder="비밀번호 확인"
                  value={form.passwordConfirm}
                  onChange={(e) => setF("passwordConfirm", e.target.value)}
                  className={`${inp} pr-10`}
                  data-testid="signup-password-confirm-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPwConfirm(!showPwConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                  tabIndex={-1}
                >
                  {showPwConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-400 !mt-1">
                8자리 이상의 대소문자, 숫자, 특수문자를 사용해 주세요.
              </p>

              {/* 이름 */}
              <div>
                <p className="text-[13px] text-gray-600 mb-1.5">
                  이름 <span className="text-[#e53e3e]">*</span>
                </p>
                <input
                  type="text"
                  placeholder="이름을(름) 입력하세요"
                  value={form.name}
                  onChange={(e) => setF("name", e.target.value)}
                  className={inp}
                  data-testid="signup-name-input"
                />
              </div>

              {/* 연락처 */}
              <div>
                <p className="text-[13px] text-gray-600 mb-1.5">
                  연락처 <span className="text-[#e53e3e]">*</span>
                </p>
                <input
                  type="tel"
                  placeholder="연락처"
                  value={form.phone}
                  onChange={(e) => setF("phone", e.target.value)}
                  className={inp}
                  data-testid="signup-phone-input"
                />
              </div>

              {/* 주소 */}
              <div>
                <p className="text-[13px] text-gray-600 mb-1.5">
                  주소 <span className="text-[#e53e3e]">*</span>
                </p>
                <div className="flex gap-2 mb-1.5">
                  <input
                    type="text"
                    placeholder="주소"
                    value={form.address}
                    readOnly
                    onClick={handleAddressSearch}
                    className={`${inp} flex-1 cursor-pointer`}
                    data-testid="signup-address-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddressSearch}
                    className="flex-shrink-0 h-11 px-3 border border-gray-200 text-[13px] text-gray-600 hover:border-gray-400 flex items-center gap-1"
                    data-testid="signup-address-search-btn"
                  >
                    <Search className="w-3.5 h-3.5" />
                    검색
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="상세주소"
                  value={form.addressDetail}
                  onChange={(e) => setF("addressDetail", e.target.value)}
                  className={inp}
                  data-testid="signup-address-detail-input"
                />
              </div>
            </div>

            {/* 가입하기 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full h-12 bg-[#e53e3e] hover:bg-[#c53030] text-white text-[15px] font-bold tracking-wide disabled:opacity-60 transition-colors mt-6"
              data-testid="signup-submit-btn"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  처리 중...
                </span>
              ) : "가입하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
