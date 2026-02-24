import React from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const labsItems = [
  {
    id: 1,
    title: "라이크잇 정품 인증 시스템",
    description: "AI 기반 정품 인증 기술로 모든 상품의 정품 여부를 검증합니다. 전문 감정사와 첨단 기술의 이중 검증 시스템을 통해 고객님께 100% 정품만을 제공합니다.",
    icon: "shield",
  },
  {
    id: 2,
    title: "프리미엄 패키징",
    description: "고급 포장재를 사용한 럭셔리 언박싱 경험을 제공합니다. 모든 상품은 브랜드 정품 포장과 동일한 수준의 패키징으로 발송됩니다.",
    icon: "package",
  },
  {
    id: 3,
    title: "VIP 멤버십 프로그램",
    description: "구매 실적에 따른 등급별 특별 혜택을 제공합니다. VVIP 고객님께는 3% 추가 할인, 전용 상담 서비스, 우선 입고 알림 등의 프리미엄 서비스가 제공됩니다.",
    icon: "crown",
  },
  {
    id: 4,
    title: "실시간 가격 비교",
    description: "해외 직구, 면세점, 국내 매장 가격을 실시간으로 비교하여 가장 합리적인 가격에 명품을 구매하실 수 있도록 도와드립니다.",
    icon: "chart",
  },
  {
    id: 5,
    title: "전문 스타일링 상담",
    description: "카카오톡을 통해 전문 스타일리스트의 1:1 맞춤 상담을 받으실 수 있습니다. 체형, 스타일, 용도에 맞는 최적의 상품을 추천해드립니다.",
    icon: "sparkle",
  },
  {
    id: 6,
    title: "안심 배송 시스템",
    description: "모든 상품은 보험이 적용된 특송으로 배송되며, 실시간 배송 추적이 가능합니다. 배송 중 파손 시 전액 보상해드립니다.",
    icon: "truck",
  },
];

const iconMap: Record<string, React.ReactNode> = {
  shield: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  package: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  crown: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3l3.5 7L12 6l3.5 4L19 3m-14 8v8h14v-8" /></svg>,
  chart: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  sparkle: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>,
  truck: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" /></svg>,
};

export default function Labs() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white py-16 md:py-24">
          <div className="max-w-[1200px] mx-auto px-4 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-[0.3em] mb-4">LIKE IT INNOVATION</p>
            <h1 className="text-3xl md:text-5xl font-bold tracking-wider mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>LIKE IT LABS</h1>
            <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto">고객님께 최상의 럭셔리 경험을 제공하기 위한 라이크잇의 기술과 서비스를 소개합니다.</p>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-12 md:py-20">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {labsItems.map((item) => (
              <div key={item.id} className="border border-gray-100 rounded-xl p-6 md:p-8 hover:shadow-lg transition-shadow group" data-testid={`labs-item-${item.id}`}>
                <div className="w-14 h-14 bg-gray-900 text-white rounded-xl flex items-center justify-center mb-5 group-hover:bg-black transition-colors">
                  {iconMap[item.icon]}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 md:mt-24 bg-gray-50 rounded-2xl p-8 md:p-12 text-center">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>라이크잇과 함께하세요</h2>
            <p className="text-gray-500 mb-6 max-w-lg mx-auto">최상의 럭셔리 경험을 위해 끊임없이 혁신하는 라이크잇의 여정에 함께해주세요.</p>
            <a href="/signup" className="inline-block bg-black text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors" data-testid="link-labs-signup">
              회원가입하기
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}