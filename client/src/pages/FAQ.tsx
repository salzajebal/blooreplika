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
    answer: "저희 청담동에디션은 하이엔드급 제품만을 취급합니다. 1:1 비교 게시판에서 정품과의 비교 사진을 확인하실 수 있습니다."
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
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <div className="bg-gray-100 py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-gray-800">FAQ</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-black">홈</Link>
              <span>&gt;</span>
              <span>고객센터</span>
              <span>&gt;</span>
              <span>FAQ</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex gap-8">
            <aside className="hidden md:block w-48 flex-shrink-0">
              <nav className="border border-gray-200">
                {sideMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className={`block px-4 py-3 text-sm border-b border-gray-200 last:border-b-0 ${
                      location === item.path 
                        ? 'bg-gray-900 text-white font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="flex-1">
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Total : <strong>{faqItems.length}</strong> items
                </p>
              </div>

              <div className="border border-gray-200">
                {faqItems.map((item) => (
                  <div key={item.id} className="border-b border-gray-200 last:border-b-0">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                      data-testid={`faq-item-${item.id}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                          {item.category}
                        </span>
                        <span className="font-medium text-gray-900">{item.question}</span>
                      </div>
                      {expandedId === item.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    {expandedId === item.id && (
                      <div className="px-4 py-4 bg-gray-50 border-t border-gray-200">
                        <p className="text-sm text-gray-700 leading-relaxed">{item.answer}</p>
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
