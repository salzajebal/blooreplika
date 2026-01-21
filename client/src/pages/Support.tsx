import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { ChevronDown, ChevronUp, MessageCircle, HelpCircle, FileText, Bell } from "lucide-react";
import { Link } from "wouter";

const FAQ_CATEGORIES = [
  { id: "order", name: "주문/배송" },
  { id: "exchange", name: "교환/반품" },
  { id: "product", name: "상품문의" },
  { id: "size", name: "사이즈" },
  { id: "payment", name: "결제/환불" },
  { id: "member", name: "회원/적립" },
];

const DEFAULT_FAQS = [
  { id: "1", category: "order", question: "온라인으로 주문이 가능한가요?", answer: "네, 온라인으로 24시간 주문 가능합니다. 회원가입 후 편리하게 쇼핑하실 수 있습니다." },
  { id: "2", category: "order", question: "배송은 얼마나 걸리나요?", answer: "결제 확인 후 1-3 영업일 내에 발송되며, 배송은 보통 2-3일 소요됩니다. 도서산간 지역은 추가 시간이 소요될 수 있습니다." },
  { id: "3", category: "order", question: "배송 지역은 어디까지 가능한가요?", answer: "전국 어디든 국내배송이 가능합니다. 도서산간 지역도 배송 가능하며, 추가 배송비가 발생할 수 있습니다." },
  { id: "4", category: "exchange", question: "교환/반품이 가능한가요?", answer: "상품 수령 후 7일 이내에 교환/반품 신청이 가능합니다. 단, 착용 흔적이 있거나 택이 제거된 경우 교환/반품이 불가합니다." },
  { id: "5", category: "exchange", question: "교환 시 배송비는 누가 부담하나요?", answer: "단순 변심으로 인한 교환 시 왕복 배송비는 고객님 부담입니다. 상품 불량의 경우 무료로 교환해 드립니다." },
  { id: "6", category: "product", question: "상품의 품질이 보장되나요?", answer: "모든 상품은 엄격한 품질 검수 과정을 거쳐 발송됩니다. 불량 상품의 경우 무료 교환/환불이 가능합니다." },
  { id: "7", category: "product", question: "상품 색상이 사진과 다를 수 있나요?", answer: "모니터 환경에 따라 실제 상품과 색상 차이가 있을 수 있습니다. 자연광에서 촬영된 이미지가 가장 실제 색상과 유사합니다." },
  { id: "8", category: "size", question: "사이즈 선택은 어떻게 하나요?", answer: "각 상품 페이지에 상세 사이즈표가 제공됩니다. 평소 착용하시는 사이즈를 참고하여 선택해 주세요." },
  { id: "9", category: "size", question: "사이즈가 맞지 않으면 교환 가능한가요?", answer: "네, 상품 수령 후 7일 이내에 미착용 상태로 교환 신청 가능합니다." },
  { id: "10", category: "payment", question: "어떤 결제 수단을 이용할 수 있나요?", answer: "신용카드, 체크카드, 무통장입금, 카카오페이, 네이버페이 등 다양한 결제 수단을 지원합니다." },
  { id: "11", category: "payment", question: "환불은 얼마나 걸리나요?", answer: "반품 상품 확인 후 3-5 영업일 내에 환불 처리됩니다. 카드 결제의 경우 카드사 정책에 따라 추가 시간이 소요될 수 있습니다." },
  { id: "12", category: "member", question: "회원가입 혜택이 있나요?", answer: "회원가입 시 적립금 지급, 등급별 할인, 특별 프로모션 혜택을 받으실 수 있습니다." },
];

export default function Support() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<typeof DEFAULT_FAQS>(DEFAULT_FAQS);
  const faqSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const res = await fetch("/api/faqs");
        const data = await res.json();
        if (data.success && data.data.length > 0) {
          setFaqs(data.data);
        }
      } catch (error) {
        console.error("Error fetching FAQs:", error);
      }
    };
    fetchFaqs();
  }, []);

  const filteredFaqs = activeCategory === "all" 
    ? faqs 
    : faqs.filter(faq => faq.category === activeCategory);

  const handleKakaoClick = () => {
    window.open("https://pf.kakao.com/_xixcxgj", "_blank");
  };

  const scrollToFaq = () => {
    faqSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />
      
      <main className="container-custom py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-4" data-testid="text-support-title">고객센터</h1>
          <p className="text-gray-500">청담동에디션에 대해 궁금한 점을 확인하세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <button 
            onClick={scrollToFaq}
            className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer block w-full"
            data-testid="button-faq-link"
          >
            <HelpCircle className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">자주묻는질문</h3>
            <p className="text-sm text-gray-500">FAQ에서 빠르게 답변을 찾아보세요</p>
          </button>
          <button 
            onClick={handleKakaoClick}
            className="bg-yellow-50 border border-yellow-300 p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer block w-full"
            data-testid="button-kakao-support"
          >
            <MessageCircle className="w-10 h-10 text-yellow-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">카카오톡 문의</h3>
            <p className="text-sm text-gray-500">카카오톡으로 상담하세요</p>
          </button>
          <Link 
            href="/notices"
            className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer block"
            data-testid="button-notices-link"
          >
            <FileText className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">공지사항</h3>
            <p className="text-sm text-gray-500">최신 소식과 이벤트를 확인하세요</p>
          </Link>
          <Link 
            href="/guide"
            className="bg-gray-50 border border-gray-200 p-6 rounded-lg text-center hover:shadow-lg transition-shadow cursor-pointer block"
            data-testid="button-guide-link"
          >
            <Bell className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h3 className="font-bold text-gray-900 mb-2">이용안내</h3>
            <p className="text-sm text-gray-500">쇼핑 및 이용 방법을 안내합니다</p>
          </Link>
        </div>

        <div ref={faqSectionRef} className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">자주 묻는 질문 (FAQ)</h2>
          
          <div className="flex flex-wrap gap-2 mb-8">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              onClick={() => setActiveCategory("all")}
              className={activeCategory === "all" ? "bg-black hover:bg-gray-800" : ""}
            >
              전체
            </Button>
            {FAQ_CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                variant={activeCategory === cat.id ? "default" : "outline"}
                onClick={() => setActiveCategory(cat.id)}
                className={activeCategory === cat.id ? "bg-black hover:bg-gray-800" : ""}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq) => (
              <div 
                key={faq.id} 
                className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                data-testid={`faq-item-${faq.id}`}
              >
                <button
                  onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-black font-bold">Q</span>
                    <span className="font-medium text-gray-900">{faq.question}</span>
                  </div>
                  {expandedFaq === faq.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>
                {expandedFaq === faq.id && (
                  <div className="px-4 pb-4 border-t border-gray-100">
                    <div className="flex gap-3 pt-4">
                      <span className="text-gray-500 font-bold">A</span>
                      <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {filteredFaqs.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              해당 카테고리에 등록된 FAQ가 없습니다.
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
