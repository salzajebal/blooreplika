import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ChevronLeft } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ username: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("memberToken", data.token);
        localStorage.setItem("memberId", data.member.id);
        localStorage.setItem("memberName", data.member.name);
        localStorage.setItem("memberUsername", data.member.username);
        toast({ title: "로그인 성공", description: `${data.member.name}님, 환영합니다!` });
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect");
        setLocation(redirectPath ? decodeURIComponent(redirectPath) : "/");
      } else {
        toast({ title: "로그인 실패", description: data.error || "아이디 또는 비밀번호를 확인해주세요.", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "로그인 처리 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      {/* Simple top bar */}
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
            <span className="text-base font-black tracking-widest text-gray-900 uppercase">BLOO</span>
          </Link>
          <div className="w-7" />
        </div>
      </div>

      <main className="flex-1 max-w-[640px] w-full mx-auto bg-white">
        <div className="px-6 pt-10 pb-16">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-xl font-bold text-gray-900 mb-1">로그인</h1>
            <p className="text-sm text-gray-400">BLOO 회원이라면 로그인해 주세요</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                아이디
              </label>
              <input
                type="text"
                placeholder="아이디를 입력하세요"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                autoComplete="username"
                className="w-full h-12 px-4 border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-800 transition-colors"
                data-testid="input-username"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                비밀번호
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  autoComplete="current-password"
                  className="w-full h-12 px-4 pr-11 border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-300 focus:outline-none focus:border-gray-800 transition-colors"
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

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[#111111] hover:bg-[#333333] active:bg-black text-white text-sm font-bold tracking-wide disabled:opacity-60 disabled:cursor-not-allowed transition-colors mt-2"
              data-testid="button-login"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  로그인 중...
                </span>
              ) : "로그인"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-400">
            <Link href="/find-id" className="hover:text-gray-600 transition-colors">아이디 찾기</Link>
            <span className="text-gray-200">|</span>
            <Link href="/find-password" className="hover:text-gray-600 transition-colors">비밀번호 찾기</Link>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-gray-300">또는</span>
            </div>
          </div>

          {/* Sign up */}
          <div className="text-center">
            <p className="text-sm text-gray-400 mb-3">아직 회원이 아니신가요?</p>
            <Link href={`/signup${window.location.search}`}>
              <button
                className="w-full h-12 border border-gray-200 text-gray-700 text-sm font-medium hover:border-gray-400 hover:text-gray-900 transition-colors"
                data-testid="button-signup-link"
              >
                회원가입
              </button>
            </Link>
          </div>

          {/* Benefits notice */}
          <div className="mt-8 bg-gray-50 border border-gray-100 p-4">
            <p className="text-xs font-semibold text-gray-600 mb-2">회원 혜택</p>
            <ul className="space-y-1 text-xs text-gray-400">
              <li>• 회원 전용 특가 상품 이용 가능</li>
              <li>• 구매 금액의 3% 포인트 적립</li>
              <li>• 주문 내역 및 배송 조회 가능</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
