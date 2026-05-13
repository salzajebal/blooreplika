import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { ChevronRight, Home, Truck, RefreshCw, CreditCard, Package, Clock } from "lucide-react";
import { useState, useEffect } from "react";

export default function Guide() {
  const [kakaoLink, setKakaoLink] = useState("");

  useEffect(() => {
    fetch("/api/settings/kakaoTalkLink")
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data?.value) setKakaoLink(data.data.value);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <Header />

      <main className="flex-1 max-w-[640px] mx-auto w-full px-4 py-6">
        <nav className="flex items-center gap-2 text-xs text-[#999999] mb-5">
          <Link href="/" className="hover:text-[#FF6100] flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />홈
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#111111]">이용안내</span>
        </nav>

        <div className="mb-5">
          <h1 className="text-xl font-bold text-[#111111] mb-1">이용안내</h1>
          <p className="text-sm text-[#666666]">velour 이용 방법을 안내해 드립니다</p>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-base font-bold text-[#111111]">주문 방법</h2>
            </div>
            <ol className="space-y-2.5 text-[#444444] text-sm">
              <li className="flex gap-2">
                <span className="font-bold text-blue-500 flex-shrink-0">1.</span>
                원하시는 상품을 선택하고 장바구니에 담아주세요
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500 flex-shrink-0">2.</span>
                장바구니에서 수량을 확인 후 주문하기를 클릭하세요
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500 flex-shrink-0">3.</span>
                배송정보와 결제정보를 입력해주세요
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-blue-500 flex-shrink-0">4.</span>
                주문 완료 후 카카오톡으로 확인 연락을 드립니다
              </li>
            </ol>
          </div>

          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center flex-shrink-0">
                <CreditCard className="w-5 h-5 text-green-500" />
              </div>
              <h2 className="text-base font-bold text-[#111111]">결제 안내</h2>
            </div>
            <ul className="space-y-2.5 text-[#444444] text-sm">
              <li className="flex gap-2">
                <span className="text-green-500 flex-shrink-0">•</span>
                카드결제: 주문 시 카드정보를 입력하시면 확인 후 결제가 진행됩니다
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 flex-shrink-0">•</span>
                무통장입금: 주문 후 안내되는 계좌로 입금해주세요
              </li>
              <li className="flex gap-2">
                <span className="text-green-500 flex-shrink-0">•</span>
                결제 확인 후 순차적으로 배송이 진행됩니다
              </li>
            </ul>
          </div>

          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-base font-bold text-[#111111]">배송 안내</h2>
            </div>
            <ul className="space-y-2.5 text-[#444444] text-sm">
              <li className="flex gap-2"><span className="text-purple-500 flex-shrink-0">•</span>결제 확인 후 1~3 영업일 내 발송됩니다</li>
              <li className="flex gap-2"><span className="text-purple-500 flex-shrink-0">•</span>배송 기간은 보통 2~3일 소요됩니다</li>
              <li className="flex gap-2"><span className="text-purple-500 flex-shrink-0">•</span>도서산간 지역은 추가 시간이 소요될 수 있습니다</li>
              <li className="flex gap-2"><span className="text-purple-500 flex-shrink-0">•</span>배송 추적은 문자로 안내드리는 운송장 번호로 확인하세요</li>
            </ul>
          </div>

          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-5 h-5 text-[#FF6100]" />
              </div>
              <h2 className="text-base font-bold text-[#111111]">교환/반품 안내</h2>
            </div>
            <ul className="space-y-2.5 text-[#444444] text-sm">
              <li className="flex gap-2"><span className="text-[#FF6100] flex-shrink-0">•</span>상품 수령 후 7일 이내 교환/반품 신청 가능</li>
              <li className="flex gap-2"><span className="text-[#FF6100] flex-shrink-0">•</span>단순 변심 시 왕복 배송비 고객 부담</li>
              <li className="flex gap-2"><span className="text-[#FF6100] flex-shrink-0">•</span>상품 불량 시 무료 교환/환불 가능</li>
              <li className="flex gap-2"><span className="text-[#FF6100] flex-shrink-0">•</span>착용 흔적이 있거나 택 제거 시 불가</li>
            </ul>
          </div>
        </div>

        <div className="bg-white border border-[#e8e8e8] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-50 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-yellow-500" />
            </div>
            <h2 className="text-base font-bold text-[#111111]">고객센터 운영시간</h2>
          </div>
          <div className="grid grid-cols-1 gap-5">
            <div>
              <h3 className="font-bold text-[#111111] mb-1 text-sm">카카오톡 상담</h3>
              <p className="text-sm text-[#444444]">24시간 문의 가능 (순차 답변)</p>
              <button
                onClick={() => kakaoLink && window.open(kakaoLink, "_blank")}
                className="mt-3 bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-4 py-2 rounded-lg transition-colors text-sm"
              >
                카카오톡 상담하기
              </button>
            </div>
            <div>
              <h3 className="font-bold text-[#111111] mb-2 text-sm">유의사항</h3>
              <ul className="text-[#444444] space-y-1 text-sm">
                <li>• 주문 전 상품 상세 페이지를 꼭 확인해주세요</li>
                <li>• 사이즈 문의는 카카오톡으로 연락주세요</li>
                <li>• 주문 취소는 배송 전까지만 가능합니다</li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
