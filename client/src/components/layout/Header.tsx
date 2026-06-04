import { Search, Menu, X, ShoppingBag, User, ChevronRight, MessageCircle, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useWishlist } from "@/contexts/WishlistContext";
import { useState, useEffect, useRef } from "react";
import { SignupModal } from "./SignupModal";

const MOBILE_SUB_NAV = [
  { label: "신규혜택", path: "/sale", color: "text-[#FF6100] font-bold" },
  { label: "실시간 검수", path: "/inspection", color: "text-[#00a050] font-medium", dot: true },
  { label: "리뷰", path: "/reviews", color: "" },
  { label: "썸머", path: "/blog", color: "" },
  { label: "오늘출발", path: "/products/sameday", color: "" },
  { label: "크롬하츠", path: "/products/clothing?brand=Chrome+Hearts", color: "" },
];

const DESKTOP_SUB_NAV = [
  { label: "실시간 검수", path: "/inspection", highlight: true },
  { label: "리뷰", path: "/reviews" },
  { label: "셀럽", path: "/celeb" },
  { label: "남성", path: "/httpstheblooshop1496458051" },
  { label: "여성", path: "/497" },
  { label: "공지사항", path: "/faq" },
];

const SIDE_MENU_EXTRA = [
  { label: "주문조회", path: "/orders" },
  { label: "공지사항", path: "/faq" },
  { label: "자주묻는질문", path: "/faq" },
  { label: "1:1 문의", path: "/support" },
  { label: "이용안내", path: "/guide" },
];

export function Header() {
  const [location, setLocation] = useLocation();
  const { count } = useWishlist();
  const [memberName, setMemberName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [communityOpen, setCommunityOpen] = useState(false);
  const [menOpen, setMenOpen] = useState(false);
  const [womenOpen, setWomenOpen] = useState(false);
  const [menAccOpen, setMenAccOpen] = useState(false);
  const [announcementText, setAnnouncementText] = useState("5월 전 제품 15%할인, 금액대별 사은품까지!");

  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "", rememberMe: false });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const emailRef = useRef<HTMLInputElement>(null);

  const [signupModalOpen, setSignupModalOpen] = useState(false);

  const [guestOrderModalOpen, setGuestOrderModalOpen] = useState(false);
  const [guestOrderForm, setGuestOrderForm] = useState({ orderNo: "", contact: "" });
  const [guestOrderError, setGuestOrderError] = useState("");

  useEffect(() => {
    const check = () => setMemberName(localStorage.getItem("memberName"));
    check();
    window.addEventListener("storage", check);
    const iv = setInterval(check, 1000);
    return () => { window.removeEventListener("storage", check); clearInterval(iv); };
  }, []);

  useEffect(() => {
    fetch("/api/site-settings/announcement").then(r => r.json()).then(d => {
      if (d.success && d.data?.text) setAnnouncementText(d.data.text);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (loginModalOpen) {
      setTimeout(() => emailRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [loginModalOpen]);

  const openLoginModal = () => {
    setLoginForm({ email: "", password: "", rememberMe: false });
    setLoginError("");
    setLoginModalOpen(true);
    setMenuOpen(false);
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
    setLoginError("");
  };

  useEffect(() => {
    const onOpenLogin = () => openLoginModal();
    const onOpenSignup = () => { closeLoginModal(); setSignupModalOpen(true); };
    window.addEventListener("open-login-modal", onOpenLogin);
    window.addEventListener("open-signup-modal", onOpenSignup);
    return () => {
      window.removeEventListener("open-login-modal", onOpenLogin);
      window.removeEventListener("open-signup-modal", onOpenSignup);
    };
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setLoginError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/members/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginForm.email, password: loginForm.password }),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("memberToken", data.token);
        localStorage.setItem("memberId", data.member.id);
        localStorage.setItem("memberName", data.member.name);
        localStorage.setItem("memberUsername", data.member.username);
        if (loginForm.rememberMe) {
          localStorage.setItem("rememberLogin", "true");
        }
        setMemberName(data.member.name);
        closeLoginModal();
        const params = new URLSearchParams(window.location.search);
        const redirectPath = params.get("redirect");
        if (redirectPath) setLocation(decodeURIComponent(redirectPath));
      } else {
        setLoginError(data.error || "아이디 또는 비밀번호를 확인해주세요.");
      }
    } catch {
      setLoginError("로그인 처리 중 오류가 발생했습니다.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setLocation(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setMenuOpen(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("memberToken");
    localStorage.removeItem("memberName");
    localStorage.removeItem("memberEmail");
    localStorage.removeItem("memberId");
    setMemberName(null);
    setMenuOpen(false);
    setLocation("/");
  };

  return (
    <>
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100 }}>
        {/* ── Announcement bar (both mobile & desktop) ── */}
        <Link href="/faq" className="block bg-[#060133] text-white text-center py-2 text-[13px] md:text-[15px] tracking-wide font-medium hover:bg-[#0a0155] transition-colors cursor-pointer">
          {announcementText.split("15%").map((part, i, arr) =>
            i < arr.length - 1 ? (
              <span key={i}>{part}<span className="text-orange-400 font-bold">15%</span></span>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </Link>

        {/* ══════════════════════════════════════════
            MOBILE HEADER (hidden on md+)
        ══════════════════════════════════════════ */}
        <div className="md:hidden bg-white">
          {/* Mobile Row 2: BLOO logo centered */}
          <div className="flex items-center justify-center h-[48px] border-b border-gray-100">
            <Link href="/" data-testid="header-logo-mobile">
              <span
                className="text-[30px] font-black tracking-widest text-[#060133] uppercase"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                BLOO
              </span>
            </Link>
          </div>

          {/* Mobile Row 3: Sub-nav links */}
          <div className="flex items-center overflow-x-auto scrollbar-hide h-[36px] border-b border-gray-100 px-3 gap-0">
            {MOBILE_SUB_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.path}
                className={`flex-shrink-0 flex items-center gap-1 px-2.5 h-full text-[13px] whitespace-nowrap transition-colors ${item.color || "text-gray-700"}`}
                data-testid={`mobile-subnav-${item.label}`}
              >
                {item.label}
                {item.dot && (
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Row 4: Search bar + hamburger */}
          <div className="flex items-center gap-2 px-3 h-[46px] border-b border-gray-200">
            <form onSubmit={handleSearch} className="flex-1 flex items-center border border-gray-300 rounded-sm overflow-hidden h-[34px]">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품, 브랜드, 카테고리 등"
                className="flex-1 px-3 text-[13px] outline-none text-gray-700 placeholder-gray-400 h-full"
                data-testid="header-search-input-mobile"
              />
              <button type="submit" className="w-9 h-full flex items-center justify-center bg-white flex-shrink-0 border-l border-gray-200">
                <Search className="w-4 h-4 text-gray-500" />
              </button>
            </form>
            <button
              onClick={() => setMenuOpen(true)}
              className="p-1.5 text-gray-700 flex-shrink-0"
              data-testid="header-menu-button-mobile"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════
            DESKTOP HEADER (hidden on mobile)
        ══════════════════════════════════════════ */}
        <div className="hidden md:block bg-white border-b border-gray-200">
          <div className="max-w-[1280px] mx-auto px-5 flex items-center gap-4 h-[60px]">
            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="p-1 text-gray-700 hover:text-black transition-colors"
              data-testid="header-menu-button"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0" data-testid="header-logo">
              <span className="text-[28px] font-black tracking-widest text-[#060133] uppercase" style={{ fontFamily: "'Playfair Display', serif" }}>
                BLOO
              </span>
            </Link>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-[420px] flex items-center border border-gray-300 rounded-sm overflow-hidden h-[38px]">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제품,브랜드,카테고리 등"
                className="flex-1 px-3 text-sm outline-none text-gray-700 placeholder-gray-400 h-full"
                data-testid="header-search-input"
              />
              <button type="submit" className="w-10 h-full flex items-center justify-center bg-white hover:bg-gray-50 flex-shrink-0 border-l border-gray-300">
                <Search className="w-4 h-4 text-gray-500" />
              </button>
            </form>

            {/* Right icons */}
            <div className="ml-auto flex items-center gap-1">
              {memberName ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-1 px-3 py-1.5 text-[15px] text-gray-700 hover:text-black font-medium transition-colors"
                  data-testid="header-login-link"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{memberName.slice(0, 5)}</span>
                </Link>
              ) : (
                <button
                  onClick={openLoginModal}
                  className="flex items-center gap-1 px-3 py-1.5 text-[15px] text-gray-700 hover:text-black font-medium transition-colors"
                  data-testid="header-login-link"
                >
                  <LogIn className="w-4 h-4" />
                  <span>로그인</span>
                </button>
              )}
              <Link href="/profile" className="flex items-center gap-1 px-3 py-1.5 text-[15px] text-gray-700 hover:text-black font-medium transition-colors" data-testid="header-my-link">
                <User className="w-4 h-4" />
                <span>my</span>
              </Link>
              <Link href="/cart" className="flex items-center gap-1 px-3 py-1.5 text-[15px] text-gray-700 hover:text-black font-medium transition-colors relative" data-testid="header-cart-link">
                <ShoppingBag className="w-4 h-4" />
                <span>cart</span>
                {count > 0 && (
                  <span className="absolute -top-0.5 right-0 w-4 h-4 bg-[#060133] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                    {count}
                  </span>
                )}
              </Link>
              <button
                onClick={() => { (window as any).ChannelIO?.('showMessenger'); }}
                className="flex items-center gap-1 px-3 py-1.5 text-[15px] text-gray-700 hover:text-black font-medium transition-colors"
                data-testid="header-support-link"
              >
                <MessageCircle className="w-4 h-4" />
                <span>1:1상담</span>
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Sub-nav */}
        <div className="hidden md:block bg-white border-b border-gray-200">
          <div className="max-w-[1280px] mx-auto px-5 flex items-center gap-0 overflow-x-auto scrollbar-hide h-[40px]">
            {DESKTOP_SUB_NAV.map((item) => (
              <Link
                key={item.label}
                href={item.path}
                className={`flex-shrink-0 flex items-center gap-1 px-3 h-full text-[15px] font-medium transition-colors whitespace-nowrap ${
                  item.highlight
                    ? "text-[#00a050] hover:text-[#008040]"
                    : "text-gray-700 hover:text-black"
                } ${location === item.path || location.startsWith(item.path + "?") ? "border-b-2 border-[#060133]" : ""}`}
                data-testid={`subnav-${item.label}`}
              >
                {item.label}
                {item.highlight && (
                  <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                )}
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Spacer — taller on mobile due to 4-row header */}
      <div className="flex-shrink-0 md:hidden" style={{ height: "166px" }} />
      <div className="flex-shrink-0 hidden md:block" style={{ height: "132px" }} />

      {/* ── BLOO Side drawer ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[200]" data-testid="side-menu-overlay">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div
            className="absolute left-0 top-0 bottom-0 flex flex-col shadow-2xl"
            style={{ width: 240, background: "#1c1c1c" }}
          >
            <div className="relative flex items-center justify-center pt-8 pb-6 border-b border-white/10">
              <span className="text-[28px] font-black text-white tracking-widest" style={{ fontFamily: "'Playfair Display', serif" }}>
                BLOO
              </span>
              <button onClick={() => setMenuOpen(false)} className="absolute right-4 top-3 p-1 text-white/60 hover:text-white transition-colors" data-testid="side-menu-close">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-0">
              <Link href="/inspection" onClick={() => setMenuOpen(false)} className="w-full text-left px-5 py-3.5 text-[14px] text-white/90 hover:text-white transition-colors border-b border-white/10">
                실시간 검수 사진 <span className="text-green-400 font-bold">✓</span>
              </Link>
              <div className="w-full border-b border-white/10">
                <button onClick={() => setMenOpen(o => !o)} className="w-full px-5 py-3.5 text-[14px] text-white/90 hover:text-white transition-colors flex items-center justify-between" data-testid="side-menu-men">
                  남성
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${menOpen ? 'rotate-90' : ''}`} />
                </button>
                {menOpen && (
                  <div className="flex flex-col" style={{ background: "#141414" }}>
                    <Link href="/httpstheblooshop1496458051" onClick={() => setMenuOpen(false)} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5">남성 의류</Link>
                    <Link href="/220" onClick={() => setMenuOpen(false)} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5">남성 신발</Link>
                    <Link href="/1212" onClick={() => setMenuOpen(false)} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5">남성 가방</Link>
                    <div className="w-full border-t border-white/5">
                      <button onClick={() => setMenAccOpen(o => !o)} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white flex items-center justify-between">
                        남성 패션 잡화
                        <ChevronRight className={`w-3 h-3 transition-transform ${menAccOpen ? 'rotate-90' : ''}`} />
                      </button>
                      {menAccOpen && (
                        <div className="flex flex-col" style={{ background: "#0f0f0f" }}>
                          <Link href="/26?subname=%EC%A7%80%EA%B0%91" onClick={() => setMenuOpen(false)} className="w-full px-9 py-2 text-[12px] text-white/60 hover:text-white border-t border-white/5">지갑</Link>
                          <Link href="/26?subname=%EB%AA%A8%EC%9E%90" onClick={() => setMenuOpen(false)} className="w-full px-9 py-2 text-[12px] text-white/60 hover:text-white border-t border-white/5">모자</Link>
                          <Link href="/26?subname=%EB%B2%A8%ED%8A%B8" onClick={() => setMenuOpen(false)} className="w-full px-9 py-2 text-[12px] text-white/60 hover:text-white border-t border-white/5">벨트</Link>
                          <Link href="/26?subname=%EB%A8%B8%ED%94%8C%EB%9F%AC" onClick={() => setMenuOpen(false)} className="w-full px-9 py-2 text-[12px] text-white/60 hover:text-white border-t border-white/5">머플러</Link>
                          <Link href="/26?subname=%ED%8C%94%EC%B0%8C" onClick={() => setMenuOpen(false)} className="w-full px-9 py-2 text-[12px] text-white/60 hover:text-white border-t border-white/5">팔찌</Link>
                          <Link href="/26?subname=%EB%AA%A9%EA%B1%B8%EC%9D%B4" onClick={() => setMenuOpen(false)} className="w-full px-9 py-2 text-[12px] text-white/60 hover:text-white border-t border-white/5">목걸이</Link>
                          <Link href="/26?subname=%EB%B0%98%EC%A7%80" onClick={() => setMenuOpen(false)} className="w-full px-9 py-2 text-[12px] text-white/60 hover:text-white border-t border-white/5">반지</Link>
                          <Link href="/26?subname=%ED%82%A4%EB%A7%81" onClick={() => setMenuOpen(false)} className="w-full px-9 py-2 text-[12px] text-white/60 hover:text-white border-t border-white/5">키링</Link>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="w-full border-b border-white/10">
                <button onClick={() => setWomenOpen(o => !o)} className="w-full px-5 py-3.5 text-[14px] text-white/90 hover:text-white transition-colors flex items-center justify-between" data-testid="side-menu-women">
                  여성
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${womenOpen ? 'rotate-90' : ''}`} />
                </button>
                {womenOpen && (
                  <div className="flex flex-col" style={{ background: "#141414" }}>
                    <Link href="/497" onClick={() => setMenuOpen(false)} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5">여성 의류</Link>
                    <Link href="/656" onClick={() => setMenuOpen(false)} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5">여성 신발</Link>
                    <Link href="/1447" onClick={() => setMenuOpen(false)} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5">여성 가방</Link>
                    <Link href="/716" onClick={() => setMenuOpen(false)} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5">여성 패션 잡화</Link>
                  </div>
                )}
              </div>

              <Link href="/412" onClick={() => setMenuOpen(false)} className="w-full text-left px-5 py-3.5 text-[14px] text-white/90 hover:text-white transition-colors border-b border-white/10">시계관</Link>
              <Link href="/events" onClick={() => setMenuOpen(false)} className="w-full text-left px-5 py-3.5 text-[14px] text-white/90 hover:text-white transition-colors border-b border-white/10">기획전</Link>

              <div className="w-full border-b border-white/10">
                <button onClick={() => setCommunityOpen(o => !o)} className="w-full px-5 py-3.5 text-[14px] text-white/90 hover:text-white transition-colors flex items-center justify-between" data-testid="side-menu-community">
                  커뮤니티
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${communityOpen ? 'rotate-90' : ''}`} />
                </button>
                {communityOpen && (
                  <div className="flex flex-col" style={{ background: "#141414" }}>
                    <Link href="/reviews" onClick={() => { setMenuOpen(false); setCommunityOpen(false); }} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5" data-testid="side-menu-reviews">리뷰&후기</Link>
                    <Link href="/notices" onClick={() => { setMenuOpen(false); setCommunityOpen(false); }} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5" data-testid="side-menu-notices">공지사항</Link>
                    <Link href="/faq" onClick={() => { setMenuOpen(false); setCommunityOpen(false); }} className="w-full px-7 py-2.5 text-[13px] text-white/70 hover:text-white border-t border-white/5" data-testid="side-menu-faq">자주묻는질문</Link>
                  </div>
                )}
              </div>
              <Link href="/products/sameday" onClick={() => setMenuOpen(false)} className="w-full text-left px-5 py-3.5 text-[14px] text-white/90 hover:text-white transition-colors border-b border-white/10">오늘출발</Link>
              <Link href="/blog" onClick={() => setMenuOpen(false)} className="w-full text-left px-5 py-3.5 text-[14px] text-white/90 hover:text-white transition-colors border-b border-white/10">썸머</Link>
            </div>

            {/* Login/Logout at bottom of drawer */}
            <div className="border-t border-white/10 px-5 py-4 space-y-2">
              {memberName ? (
                <>
                  <p className="text-[13px] text-white/60 mb-2">{memberName}님</p>
                  <Link href="/profile" onClick={() => setMenuOpen(false)} className="block w-full text-center py-2.5 text-[13px] text-white bg-white/10 rounded hover:bg-white/20 transition-colors">마이페이지</Link>
                  <button onClick={handleLogout} className="w-full text-center py-2.5 text-[13px] text-white/70 hover:text-white transition-colors">로그아웃</button>
                </>
              ) : (
                <>
                  <button onClick={openLoginModal} className="w-full text-center py-2.5 text-[13px] text-white bg-white/10 rounded hover:bg-white/20 transition-colors">로그인</button>
                  <button onClick={() => { setMenuOpen(false); setSignupModalOpen(true); }} className="w-full text-center py-2.5 text-[13px] text-white/60 hover:text-white transition-colors">회원가입</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Login Modal ── */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeLoginModal(); }}
          data-testid="login-modal-overlay"
        >
          <div className="bg-white rounded-sm shadow-2xl w-full mx-4" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="relative flex items-center justify-center px-6 pt-8 pb-5">
              <h2 className="text-[22px] font-bold text-gray-900 tracking-wide">로그인</h2>
              <button onClick={closeLoginModal} className="absolute right-4 top-4 p-1 text-gray-400 hover:text-gray-700 transition-colors" data-testid="login-modal-close">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleLoginSubmit} className="px-8 pb-8 space-y-3">
              <input
                ref={emailRef}
                type="text"
                placeholder="아이디"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                className="w-full h-11 px-4 border border-gray-300 text-[14px] text-gray-800 placeholder-gray-400 outline-none focus:border-gray-500 transition-colors rounded-none"
                data-testid="login-email-input"
                autoComplete="username"
              />
              <input
                type="password"
                placeholder="비밀번호"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                className="w-full h-11 px-4 border border-gray-300 text-[14px] text-gray-800 placeholder-gray-400 outline-none focus:border-gray-500 transition-colors rounded-none"
                data-testid="login-password-input"
                autoComplete="current-password"
              />
              {loginError && (
                <p className="text-[13px] text-red-500" data-testid="login-error">{loginError}</p>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={loginForm.rememberMe}
                  onChange={(e) => setLoginForm({ ...loginForm, rememberMe: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-[13px] text-gray-600">로그인 상태 유지</span>
              </label>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full h-11 bg-[#060133] text-white text-[14px] font-semibold hover:bg-[#0a0155] transition-colors disabled:opacity-50 rounded-none"
                data-testid="login-submit-button"
              >
                {loginLoading ? "로그인 중..." : "로그인"}
              </button>
              <div className="flex items-center justify-center gap-4 pt-1">
                <button
                  type="button"
                  onClick={() => { closeLoginModal(); setSignupModalOpen(true); }}
                  className="text-[13px] text-gray-500 hover:text-gray-800 transition-colors"
                  data-testid="goto-signup"
                >
                  회원가입
                </button>
                <span className="text-gray-300">|</span>
                <Link href="/orders" onClick={closeLoginModal} className="text-[13px] text-gray-500 hover:text-gray-800 transition-colors">비회원 주문조회</Link>
              </div>
            </form>
          </div>
        </div>
      )}

      <SignupModal
        isOpen={signupModalOpen}
        onClose={() => setSignupModalOpen(false)}
        onLoginSuccess={(name) => {
          setMemberName(name);
          setSignupModalOpen(false);
        }}
      />
    </>
  );
}
