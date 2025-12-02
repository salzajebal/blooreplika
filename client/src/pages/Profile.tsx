import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { User, Heart, ShoppingBag, Settings, LogOut, ChevronRight, Package } from "lucide-react";
import { Link } from "wouter";
import { useWishlist } from "@/contexts/WishlistContext";

export default function Profile() {
  const { count } = useWishlist();
  const isLoggedIn = localStorage.getItem("kaggold_member") !== null;
  const memberData = isLoggedIn ? JSON.parse(localStorage.getItem("kaggold_member") || "{}") : null;

  const handleLogout = () => {
    localStorage.removeItem("kaggold_member");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <Header />

      <main className="container-custom py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-10 h-10" />
                </div>
                <div>
                  {isLoggedIn ? (
                    <>
                      <h1 className="text-2xl font-bold" data-testid="text-profile-name">
                        {memberData?.name || "회원"}님
                      </h1>
                      <p className="text-white/80 text-sm mt-1">{memberData?.email}</p>
                    </>
                  ) : (
                    <>
                      <h1 className="text-2xl font-bold">로그인이 필요합니다</h1>
                      <p className="text-white/80 text-sm mt-1">로그인하시면 더 많은 혜택을 받으실 수 있습니다</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {!isLoggedIn ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 mb-6">
                  로그인하여 주문 내역, 찜 목록 등 다양한 서비스를 이용해보세요.
                </p>
                <div className="flex gap-4 justify-center">
                  <Link href="/login">
                    <Button className="bg-primary hover:bg-primary/90">
                      로그인
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline">
                      회원가입
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Link href="/cart">
                    <div className="text-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                      <Heart className="w-8 h-8 text-primary mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900">{count}</div>
                      <div className="text-xs text-gray-500">찜 목록</div>
                    </div>
                  </Link>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <Package className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">주문 내역</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <ShoppingBag className="w-8 h-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold text-gray-900">0</div>
                    <div className="text-xs text-gray-500">포인트</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Link href="/cart">
                    <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors" data-testid="link-wishlist">
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-gray-400" />
                        <span className="text-gray-700">찜 목록</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                  
                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Package className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">주문/배송 조회</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <Settings className="w-5 h-5 text-gray-400" />
                      <span className="text-gray-700">개인정보 수정</span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-between p-4 hover:bg-red-50 rounded-lg cursor-pointer transition-colors text-left"
                    data-testid="button-logout"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 text-red-400" />
                      <span className="text-red-500">로그아웃</span>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 p-6 bg-white rounded-xl shadow-sm">
            <h2 className="font-bold text-gray-900 mb-4">고객 지원</h2>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>고객센터</span>
                <span className="font-bold text-primary">1588-0000</span>
              </div>
              <div className="flex justify-between">
                <span>운영시간</span>
                <span>평일 09:00 - 18:00</span>
              </div>
              <div className="flex justify-between">
                <span>이메일</span>
                <span>support@kaggold.com</span>
              </div>
            </div>
            <Link href="/support">
              <Button variant="outline" className="w-full mt-4">
                1:1 문의하기
              </Button>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
