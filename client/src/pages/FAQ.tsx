import { Header } from "@/components/layout/Header";
import { Link, useSearch } from "wouter";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

const FAQ_CATEGORIES = [
  { id: "order", label: "주문/결제" },
  { id: "quality", label: "퀄리티/공장" },
  { id: "shipping", label: "배송/검수" },
  { id: "exchange", label: "교환/환불" },
  { id: "member", label: "회원/제품 문의" },
];

const FAQ_DATA: Record<string, { id: number; question: string; author: string; views: number; likes: number; answer: string }[]> = {
  order: [
    { id: 1, question: "비회원 주문 조회 어떻게 하나요?", author: "BLOO", views: 1110, likes: 35, answer: "비회원 주문 조회는 주문하실 때 입력하신 이메일 주소와 주문번호로 주문조회 페이지에서 확인하실 수 있습니다." },
    { id: 2, question: "비회원 주문 가능한가요?", author: "BLOO", views: 2318, likes: 283, answer: "네, 비회원으로도 주문이 가능합니다. 다만 회원가입 시 다양한 혜택을 받으실 수 있습니다." },
    { id: 3, question: "주문 후 언제까지 입금해야 하나요?", author: "BLOO", views: 1065, likes: 27, answer: "무통장 입금의 경우 주문 후 3일(72시간) 이내에 입금해 주셔야 합니다. 기한 내 입금이 없을 경우 주문이 자동 취소됩니다." },
    { id: 4, question: "무통장 입금했는데 결제가 안된다.", author: "BLOO", views: 905, likes: 15, answer: "입금 후 최대 1-2시간 이내에 자동으로 처리됩니다. 그 이후에도 처리가 되지 않으면 1:1 문의로 입금자명과 입금금액, 주문번호를 남겨주세요." },
    { id: 5, question: "결제 취소 후 다른 카드로 주문 하고 싶어요.", author: "BLOO", views: 1364, likes: 19, answer: "기존 주문을 취소하신 후 새로운 결제 수단으로 다시 주문해 주시면 됩니다. 취소 처리 시간은 영업일 기준 1-3일이 소요될 수 있습니다." },
    { id: 6, question: "카드결제 무이자 할부 된나요?", author: "BLOO", views: 3455, likes: 515, answer: "네, 일부 카드사의 경우 무이자 할부가 가능합니다. 결제 시 카드 종류와 할부 조건을 확인해 주세요." },
  ],
  quality: [
    { id: 101, question: "제품 퀄리티가 어떻게 되나요?", author: "BLOO", views: 4521, likes: 892, answer: "저희 제품은 최상급 소재와 장인 기술로 제작된 하이엔드 제품입니다. 정품과 동일한 소재와 제조 공정을 사용합니다." },
    { id: 102, question: "공장은 어디서 생산하나요?", author: "BLOO", views: 2103, likes: 445, answer: "저희 제품은 전문 생산 공장에서 제작되며, 엄격한 품질 관리를 거쳐 출고됩니다." },
    { id: 103, question: "제품 불량이 있을 경우 어떻게 하나요?", author: "BLOO", views: 876, likes: 23, answer: "제품 불량의 경우 수령 후 7일 이내에 사진과 함께 1:1 문의를 남겨주시면 교환 또는 환불 처리해 드립니다." },
    { id: 104, question: "정품과 차이점이 있나요?", author: "BLOO", views: 5321, likes: 1203, answer: "실물 검수 결과 외관상 차이를 발견하기 어렵습니다. 1:1 비교 게시판에서 직접 비교해 보실 수 있습니다." },
  ],
  shipping: [
    { id: 201, question: "배송은 얼마나 걸리나요?", author: "BLOO", views: 5234, likes: 1021, answer: "결제 확인 후 1-3 영업일 이내 발송되며, 해외 배송은 통상 기본적으로 14일 소요됩니다." },
    { id: 202, question: "실시간 검수란 무엇인가요?", author: "BLOO", views: 3210, likes: 678, answer: "배송 전 전문 검수팀이 제품을 꼼꼼히 검사하는 서비스입니다. 검수 완료 사진을 카카오톡으로 발송해 드립니다." },
    { id: 204, question: "배송 조회는 어떻게 하나요?", author: "BLOO", views: 2341, likes: 156, answer: "1:1문의 또는 홈페이지에서 조회하실 수 있습니다." },
  ],
  exchange: [
    { id: 301, question: "교환/반품이 가능한가요?", author: "BLOO", views: 3421, likes: 234, answer: "제품 수령 후 7일 이내 미사용 상태에서 교환/반품이 가능합니다. 단, 고객 변심의 경우 왕복 배송비가 발생합니다." },
    { id: 302, question: "환불은 얼마나 걸리나요?", author: "BLOO", views: 1876, likes: 78, answer: "환불 처리는 제품 회수 후 영업일 기준 3-5일 이내에 처리됩니다." },
    { id: 303, question: "제품을 사용했는데 환불이 가능한가요?", author: "BLOO", views: 2134, likes: 45, answer: "사용한 제품은 원칙적으로 환불이 불가능합니다. 다만 제품 불량의 경우에는 예외적으로 처리될 수 있습니다." },
    { id: 304, question: "교환 시 배송비는 누가 부담하나요?", author: "BLOO", views: 1432, likes: 56, answer: "제품 불량의 경우 당사가 부담하며, 고객 변심의 경우 왕복 배송비를 고객이 부담합니다." },
  ],
  member: [
    { id: 401, question: "회원가입 혜택이 있나요?", author: "BLOO", views: 4532, likes: 1234, answer: "신규 회원가입 시 적립금과 할인 쿠폰을 드립니다. 구매 금액에 따른 등급별 추가 혜택도 있습니다." },
    { id: 402, question: "비밀번호를 잊어버렸어요.", author: "BLOO", views: 1234, likes: 45, answer: "로그인 페이지의 '비밀번호 찾기'를 통해 가입하신 이메일로 재설정 링크를 받으실 수 있습니다." },
    { id: 403, question: "제품 문의는 어떻게 하나요?", author: "BLOO", views: 3210, likes: 567, answer: "1:1 문의 또는 카카오톡 채널을 통해 문의해 주시면 신속하게 답변드립니다." },
    { id: 404, question: "회원 탈퇴는 어떻게 하나요?", author: "BLOO", views: 876, likes: 12, answer: "마이페이지 > 계정 설정에서 탈퇴 신청이 가능합니다. 탈퇴 시 보유 적립금과 쿠폰은 소멸됩니다." },
  ],
};

export default function FAQ() {
  const searchStr = useSearch();
  const catParam = new URLSearchParams(searchStr).get("cat") || "order";
  const [selectedCat, setSelectedCat] = useState(catParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const currentCategory = FAQ_CATEGORIES.find(c => c.id === selectedCat) || FAQ_CATEGORIES[0];
  const allFaqs = FAQ_DATA[selectedCat] || [];

  const filteredFaqs = useMemo(() => {
    if (!searchQuery.trim()) return allFaqs;
    const q = searchQuery.toLowerCase();
    return allFaqs.filter(f => f.question.toLowerCase().includes(q) || f.answer.toLowerCase().includes(q));
  }, [allFaqs, searchQuery]);

  const handleCatSelect = (catId: string) => {
    setSelectedCat(catId);
    setSearchQuery("");
    setExpandedId(null);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex flex-1" style={{ paddingTop: "101px" }}>

        {/* ── LEFT SIDEBAR ── */}
        <aside
          className="hidden lg:block flex-shrink-0 border-r border-gray-100 py-6"
          style={{ width: "210px", position: "sticky", top: "101px", maxHeight: "calc(100vh - 101px)", overflowY: "auto", alignSelf: "flex-start" }}
        >
          <Link href="/inspection" className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 mb-5 pl-5 hover:text-green-600 transition-colors">
            실시간 검수 사진 <span className="text-green-500 font-bold text-base">✓</span>
          </Link>

          {/* Top-level categories */}
          {[
            { label: "남성", path: "/products/men" },
            { label: "여성", path: "/products/women" },
            { label: "시계관", path: "/412" },
            { label: "기획전", path: "/events" },
          ].map(item => (
            <div key={item.label} className="mb-0.5">
              <Link href={item.path} className="block text-[14px] py-1.5 pl-5 border-l-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors">
                {item.label}
              </Link>
            </div>
          ))}

          {/* 커뮤니티 — active */}
          <div className="mb-0.5">
            <span className="block text-[14px] py-1.5 pl-5 border-l-2 border-gray-800 font-bold text-gray-900">
              커뮤니티
            </span>
            <div className="pl-7 mt-0.5 mb-1">
              <Link href="/reviews" className="block text-[13px] py-0.5 text-gray-500 hover:text-gray-800 transition-colors">리뷰&후기</Link>
              <Link href="/notices" className="block text-[13px] py-0.5 text-gray-500 hover:text-gray-800 transition-colors">공지사항</Link>

              {/* 자주 묻는 질문 — active */}
              <div className="mt-0.5">
                <Link href="/faq" className="block text-[13px] py-0.5 font-bold text-gray-900">자주 묻는 질문</Link>
                <div className="pl-3 mt-0.5 space-y-0">
                  {FAQ_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => handleCatSelect(cat.id)}
                      className={cn(
                        "block text-[12px] py-0.5 text-left w-full transition-colors",
                        selectedCat === cat.id ? "font-semibold text-gray-900" : "text-gray-400 hover:text-gray-700"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <span className="block text-[13px] py-0.5 text-gray-500 mt-0.5">APP</span>
            </div>
          </div>

          {/* 오늘출발 / 썸머 */}
          <div className="mb-0.5">
          </div>
          <div className="mb-0.5">
            <Link href="/blog" className="block text-[14px] py-1.5 pl-5 border-l-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors">썸머</Link>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <div className="flex-1 min-w-0 pb-20 lg:pb-8 px-4 lg:px-8 pt-6">

          {/* Category grid — 2 columns */}
          <div className="border border-gray-300 mb-6" style={{ maxWidth: 640 }}>
            <div className="grid grid-cols-2">
              {FAQ_CATEGORIES.map((cat, idx) => {
                const isActive = selectedCat === cat.id;
                const isLastRow = idx >= FAQ_CATEGORIES.length - (FAQ_CATEGORIES.length % 2 === 0 ? 2 : 1);
                const isRightCol = idx % 2 === 1;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCatSelect(cat.id)}
                    className={cn(
                      "py-5 text-center text-[16px] font-medium transition-colors",
                      "border-b border-gray-300",
                      !isRightCol ? "border-r border-gray-300" : "",
                      isLastRow ? "border-b-0" : "",
                      isActive ? "text-gray-900 font-bold bg-gray-50" : "text-gray-400 hover:text-gray-700 bg-white"
                    )}
                    data-testid={`faq-cat-${cat.id}`}
                  >
                    {cat.label}
                  </button>
                );
              })}
              {/* Empty cell if odd count */}
              {FAQ_CATEGORIES.length % 2 !== 0 && (
                <div className="bg-white" />
              )}
            </div>
          </div>

          {/* Section header + search */}
          <div className="flex items-center justify-between mb-3" style={{ maxWidth: 640 }}>
            <h2 className="text-[15px] font-bold text-gray-800">
              {currentCategory.label}{" "}
              <span className="text-gray-500 font-normal">{filteredFaqs.length}</span>
            </h2>
            <div className="flex items-center border border-gray-300 rounded px-3 py-1.5 w-44">
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search"
                className="text-[13px] flex-1 outline-none text-gray-700 placeholder-gray-400 bg-transparent"
                data-testid="faq-search-input"
              />
              <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            </div>
          </div>

          {/* FAQ Table */}
          <div className="border border-gray-200" style={{ maxWidth: 640 }}>
            {/* Header row */}
            <div className="grid text-center text-[12px] text-gray-500 bg-gray-50 border-b border-gray-200 py-2.5 px-3"
              style={{ gridTemplateColumns: "1fr 80px 70px 70px" }}>
              <div className="text-left">제목</div>
              <div>글쓴이</div>
              <div>조회수</div>
              <div>좋아요</div>
            </div>

            {filteredFaqs.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                {searchQuery ? "검색 결과가 없습니다." : "등록된 FAQ가 없습니다."}
              </div>
            ) : (
              filteredFaqs.map(faq => (
                <div key={faq.id} className="border-b border-gray-100 last:border-b-0">
                  <button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    className="w-full grid py-3.5 px-3 hover:bg-gray-50 transition-colors text-left"
                    style={{ gridTemplateColumns: "1fr 80px 70px 70px" }}
                    data-testid={`faq-item-${faq.id}`}
                  >
                    <div className="text-[13px] text-gray-800 text-left pr-2">Q. {faq.question}</div>
                    <div className="text-[12px] text-gray-500 text-center self-center">{faq.author}</div>
                    <div className="text-[12px] text-gray-500 text-center self-center">{faq.views.toLocaleString()}</div>
                    <div className="text-[12px] text-gray-500 text-center self-center">{faq.likes.toLocaleString()}</div>
                  </button>
                  {expandedId === faq.id && (
                    <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                      <p className="text-[13px] text-gray-700 leading-relaxed">A. {faq.answer}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>


    </div>
  );
}
