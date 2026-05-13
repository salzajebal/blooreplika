import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { getProxiedImageUrl } from "@/lib/imageProxy";

export default function About() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <Header />

      <main>
        <div className="bg-white border-b border-[#e8e8e8] py-4">
          <div className="max-w-[640px] mx-auto px-4">
            <h1 className="text-base font-bold text-[#111111]">소개글</h1>
            <div className="flex items-center gap-2 text-xs text-[#999999] mt-1">
              <Link href="/" className="hover:text-[#FF6100]">홈</Link>
              <span>&gt;</span>
              <span>소개글</span>
            </div>
          </div>
        </div>

        <div className="max-w-[640px] mx-auto px-4 py-6">
          <div className="mb-6">
            <img
              src={getProxiedImageUrl("https://cdamdong.co.kr/data/content/about_h")}
              alt="소개글 헤더"
              className="w-full h-auto rounded-xl"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-[#111111] mb-6">velour 소개</h2>

            <div className="space-y-3 mb-8">
              <img
                src={getProxiedImageUrl("https://cdamdong.co.kr/data/editor/2404/fb8a1977ad0d286829ea739fa652286f_1714477655_3407.jpg")}
                alt="velour"
                className="w-full h-auto rounded-xl"
              />
              <img
                src={getProxiedImageUrl("https://cdamdong.co.kr/data/editor/2404/fb8a1977ad0d286829ea739fa652286f_1714477654_896.jpg")}
                alt="velour"
                className="w-full h-auto rounded-xl"
              />
              <img
                src={getProxiedImageUrl("https://cdamdong.co.kr/data/editor/2405/bc4384ae45a1f8f36665ebebb16c8aa6_1714551887_383.gif")}
                alt="velour"
                className="w-full h-auto rounded-xl"
              />
            </div>
          </div>

          <div className="bg-white border border-[#e8e8e8] rounded-xl p-5 mb-4">
            <h1 className="text-lg font-bold text-[#111111] mb-5 text-center">
              velour – 10년 이상의 신뢰와 품질
            </h1>

            <div className="mb-6">
              <h3 className="text-base font-bold text-[#111111] mb-3">비공개 운영부터 공개 활동까지</h3>
              <ul className="space-y-2 text-[#444444] text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-[#FF6100] font-bold flex-shrink-0">●</span>
                  <span><strong className="text-[#111111]">2010년~2021년까지</strong> 비공개 카페로 운영 (비공식적 활동 시작: 2007년 10월)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#FF6100] font-bold flex-shrink-0">●</span>
                  <span><strong className="text-[#111111]">2022년 3월부터 공식적으로 공개 활동 시작</strong></span>
                </li>
              </ul>
            </div>

            <hr className="my-5 border-[#e8e8e8]" />

            <div className="mb-6">
              <h3 className="text-base font-bold text-[#111111] mb-4">velour의 차별점</h3>

              <div className="space-y-4 text-sm">
                {[
                  {
                    title: "1. 메이저 공장과 다수 거래",
                    items: [
                      "일반 업체에서 거래하기 어려운 <strong>메이저 공장과 직접 협업</strong>",
                      "<strong>오리지널 제품과 1:1 비교 후, 동일한 원단으로 제작</strong>",
                    ]
                  },
                  {
                    title: "2. 중국 현지 사무실 운영",
                    items: [
                      "직접 중국 공장을 소싱",
                      "<strong>3차 검수 진행 및 1:1 검수 사진 제공</strong>",
                    ]
                  },
                  {
                    title: "3. 허위 광고 없는 투명한 운영",
                    items: [
                      "많은 업체들이 <strong>\"최고퀄, SA급, 커스텀 미러급, 국내 최저가, 가장 빠른 배송\"</strong> 등의 허위 광고 진행",
                      "velour은 <strong>과장 없는 정직한 정보만 제공</strong>",
                    ]
                  },
                  {
                    title: "4. 고품질 제품만 취급",
                    items: [
                      "<strong>좋은 가죽 제품과 저가 제품은 명확히 구분</strong>",
                      "<strong>비정상적으로 저렴한 제품은 품질이 보장되지 않으며</strong>, 말도 안 되는 고가 제품 역시 불필요",
                      "<strong>동대문에서 판매되는 저가 제품은 취급하지 않음</strong>",
                    ]
                  },
                  {
                    title: "5. 해외 배송 특성상, 여유롭게 주문 필수",
                    items: [
                      "배송은 <strong>중국 현지 상황 및 세관 사정에 따라 지연될 수 있음</strong>",
                    ]
                  },
                ].map(({ title, items }) => (
                  <div key={title}>
                    <h4 className="font-bold text-[#111111] mb-2">{title}</h4>
                    <ul className="space-y-1 ml-3">
                      {items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-[#444444]">
                          <span className="text-[#FF6100] font-bold flex-shrink-0">●</span>
                          <span dangerouslySetInnerHTML={{ __html: item.replace(/<strong>/g, '<strong class="text-[#111111]">') }} />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            <hr className="my-5 border-[#e8e8e8]" />

            <div className="mb-6">
              <h3 className="text-base font-bold text-[#111111] mb-4">레플리카 구매 시 고려할 점</h3>

              <p className="text-sm font-medium text-[#FF6100] mb-4 text-center italic">
                "싸고 좋은 제품은 없다. 하지만 터무니없이 비싼 제품을 살 필요도 없다."
              </p>

              <div className="mb-4 text-sm">
                <h4 className="font-bold text-[#111111] mb-2">진정한 상인의 차이</h4>
                <ul className="space-y-1 ml-3">
                  {[
                    "<strong>가격으로 주목받는 건 '삼류 상인'</strong>",
                    "<strong>가치로 주목받는 건 '이류 상인'</strong>",
                    "<strong>가슴으로 주목받는 건 '일류 상인'</strong>",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-[#444444]">
                      <span className="text-[#FF6100] font-bold flex-shrink-0">●</span>
                      <span dangerouslySetInnerHTML={{ __html: item.replace(/<strong>/g, '<strong class="text-[#111111]">') }} />
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-[#999999] mt-1.5 ml-5">(출처: 열혈장사꾼)</p>
              </div>

              <div className="text-sm">
                <h4 className="font-bold text-[#111111] mb-2">레플리카의 핵심은 '티가 나지 않는 것'</h4>
                <ul className="space-y-1 ml-3">
                  <li className="flex items-start gap-2 text-[#444444]">
                    <span className="text-[#FF6100] font-bold flex-shrink-0">●</span>
                    <span><strong className="text-[#111111]">velour은 "직접 착용할 수 있는 제품"만을 제공</strong></span>
                  </li>
                  <li className="flex items-start gap-2 text-[#444444]">
                    <span className="text-[#FF6100] font-bold flex-shrink-0">●</span>
                    <span>레플리카를 구매하는 목적을 잊지 말 것</span>
                  </li>
                </ul>
              </div>
            </div>

            <hr className="my-5 border-[#e8e8e8]" />

            <div className="mb-5 text-sm">
              <h3 className="text-base font-bold text-[#111111] mb-3">지속적인 연구와 발전</h3>
              <ul className="space-y-1 ml-3">
                <li className="flex items-start gap-2 text-[#444444]">
                  <span className="text-[#FF6100] font-bold flex-shrink-0">●</span>
                  <span><strong className="text-[#111111]">가죽 자격증 2개 취득</strong></span>
                </li>
                <li className="flex items-start gap-2 text-[#444444]">
                  <span className="text-[#FF6100] font-bold flex-shrink-0">●</span>
                  <span>현재도 <strong className="text-[#111111]">끊임없이 공부하고 발전 중</strong></span>
                </li>
              </ul>
            </div>

            <div className="text-center mt-8 mb-2">
              <p className="text-sm font-medium text-[#111111] mb-1">
                거품 없는 가격으로 합리적인 소비를 지원합니다.
              </p>
              <p className="text-sm font-medium text-[#111111]">
                신뢰할 수 있는 레플리카 브랜드를 찾고 있다면, 구글에 velour을 검색해보세요.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
