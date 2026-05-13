import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const sideMenuItems = [
  { name: "공지사항", path: "/notices" },
  { name: "FAQ", path: "/faq" },
  { name: "칼럼", path: "/comparison" },
  { name: "이벤트", path: "/events" },
  { name: "사용후기", path: "/reviews" },
];

const faqItems = [
  {
    id: 1,
    category: "주문/결제",
    question: "결제는 어떻게 하나요?",
    answer: "카카오톡으로 문의 주시면 안내해드립니다. 무통장입금, 카드결제 등 다양한 결제 방법을 지원합니다."
  },
  {
    id: 2,
    category: "배송",
    question: "배송은 얼마나 걸리나요?",
    answer: "국내 배송의 경우 입금 확인 후 2-3일 내 발송됩니다. 해외 직배송 상품의 경우 7-14일 정도 소요될 수 있습니다."
  },
  {
    id: 3,
    category: "교환/반품",
    question: "교환 및 반품이 가능한가요?",
    answer: "제품 수령 후 7일 이내 미사용 상태에서 교환/반품이 가능합니다. 단, 고객 변심에 의한 경우 왕복 배송비가 부과됩니다."
  },
  {
    id: 4,
    category: "상품",
    question: "상품의 퀄리티는 어떤가요?",
    answer: "저희 velour는 하이엔드급 제품만을 취급합니다. 1:1 비교 게시판에서 정품과의 비교 사진을 확인하실 수 있습니다."
  },
  {
    id: 5,
    category: "회원",
    question: "회원가입 혜택이 있나요?",
    answer: "신규 회원가입 시 적립금을 지급해드리며, 구매 금액에 따른 등급별 추가 혜택이 있습니다."
  },
];

export default function FAQ() {
  const [location] = useLocation();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const toggleExpand = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      <main>
        <div className="bg-white border-b border-[#e8e8e8] py-4">
          <div className="max-w-[640px] mx-auto px-4">
            <h1 className="text-base font-bold text-[#111111] tracking-widest uppercase">FAQ</h1>
            <div className="flex items-center gap-2 text-xs text-[#999999] mt-1">
              <Link href="/" className="hover:text-[#FF6100] transition-colors">홈</Link>
              <span>&gt;</span>
              <span>고객센터</span>
              <span>&gt;</span>
              <span className="text-[#666666]">FAQ</span>
            </div>
          </div>
        </div>

        <div className="max-w-[640px] mx-auto px-4 py-6">
          <div className="flex gap-5">
            {/* 사이드 메뉴 */}
            <aside className="hidden md:block w-40 flex-shrink-0">
              <nav className="border border-[#e8e8e8] rounded-xl overflow-hidden bg-white">
                {sideMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className={`block px-4 py-3 text-sm border-b border-[#e8e8e8] last:border-b-0 transition-colors ${
                      location === item.path
                        ? 'bg-[#FF6100] text-white font-semibold'
                        : 'text-[#666666] hover:text-[#111111] hover:bg-[#f8f8f8]'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </aside>

            {/* FAQ 목록 */}
            <div className="flex-1 min-w-0">
              <div className="mb-4">
                <p className="text-sm text-[#999999]">
                  Total : <strong className="text-[#FF6100]">{faqItems.length}</strong> items
                </p>
              </div>

              <div className="border border-[#e8e8e8] rounded-xl overflow-hidden bg-white">
                {faqItems.map((item) => (
                  <div key={item.id} className="border-b border-[#e8e8e8] last:border-b-0">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="w-full px-4 py-4 flex items-center justify-between hover:bg-[#f8f8f8] transition-colors text-left"
                      data-testid={`faq-item-${item.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] px-2 py-0.5 bg-[#f5f5f5] text-[#666666] border border-[#e8e8e8] rounded tracking-widest uppercase flex-shrink-0">
                          {item.category}
                        </span>
                        <span className="font-medium text-[#111111] text-sm">{item.question}</span>
                      </div>
                      {expandedId === item.id ? (
                        <ChevronUp className="w-4 h-4 text-[#FF6100] flex-shrink-0 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#999999] flex-shrink-0 ml-2" />
                      )}
                    </button>
                    {expandedId === item.id && (
                      <div className="px-4 py-4 bg-[#f8f8f8] border-t border-[#e8e8e8]">
                        <p className="text-sm text-[#444444] leading-relaxed">{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
