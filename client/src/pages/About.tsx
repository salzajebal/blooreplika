import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { getProxiedImageUrl } from "@/lib/imageProxy";

export default function About() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <div className="bg-gray-100 py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-gray-800">소개글</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-black">홈</Link>
              <span>&gt;</span>
              <span>소개글</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="mb-8">
            <img 
              src={getProxiedImageUrl("https://cdamdong.co.kr/data/content/about_h")}
              alt="소개글 헤더"
              className="w-full h-auto"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">LIKE IT 소개</h2>
            
            <div className="space-y-4 mb-12">
              <img 
                src={getProxiedImageUrl("https://cdamdong.co.kr/data/editor/2404/fb8a1977ad0d286829ea739fa652286f_1714477655_3407.jpg")}
                alt="LIKE IT"
                className="w-full max-w-3xl mx-auto h-auto"
              />
              <img 
                src={getProxiedImageUrl("https://cdamdong.co.kr/data/editor/2404/fb8a1977ad0d286829ea739fa652286f_1714477654_896.jpg")}
                alt="LIKE IT"
                className="w-full max-w-3xl mx-auto h-auto"
              />
              <img 
                src={getProxiedImageUrl("https://cdamdong.co.kr/data/editor/2405/bc4384ae45a1f8f36665ebebb16c8aa6_1714551887_383.gif")}
                alt="LIKE IT"
                className="w-full max-w-3xl mx-auto h-auto"
              />
            </div>
          </div>

          <div className="max-w-3xl mx-auto text-left">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
              라이크잇 – 10년 이상의 신뢰와 품질
            </h1>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">비공개 운영부터 공개 활동까지</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-black font-bold">●</span>
                  <span><strong>2010년~2021년까지</strong> 비공개 카페로 운영 (비공식적 활동 시작: 2007년 10월)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black font-bold">●</span>
                  <span><strong>2022년 3월부터 공식적으로 공개 활동 시작</strong></span>
                </li>
              </ul>
            </div>

            <hr className="my-8 border-gray-300" />

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">라이크잇의 차별점</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">1. 메이저 공장과 다수 거래</h4>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span>일반 업체에서 거래하기 어려운 <strong>메이저 공장과 직접 협업</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span><strong>오리지널 제품과 1:1 비교 후, 동일한 원단으로 제작</strong></span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-2">2. 중국 현지 사무실 운영</h4>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span>직접 중국 공장을 소싱</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span><strong>3차 검수 진행 및 1:1 검수 사진 제공</strong></span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-2">3. 허위 광고 없는 투명한 운영</h4>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span>많은 업체들이 <strong>"최고퀄, SA급, 커스텀 미러급, 국내 최저가, 가장 빠른 배송"</strong> 등의 허위 광고 진행</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span>라이크잇은 <strong>과장 없는 정직한 정보만 제공</strong></span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-2">4. 고품질 제품만 취급</h4>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span><strong>좋은 가죽 제품과 저가 제품은 명확히 구분</strong></span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span><strong>비정상적으로 저렴한 제품은 품질이 보장되지 않으며</strong>, 말도 안 되는 고가 제품 역시 불필요</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span><strong>동대문에서 판매되는 저가 제품은 취급하지 않음</strong></span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-gray-900 mb-2">5. 해외 배송 특성상, 여유롭게 주문 필수</h4>
                  <ul className="space-y-1 text-gray-700 ml-4">
                    <li className="flex items-start gap-2">
                      <span className="text-black font-bold">●</span>
                      <span>배송은 <strong>중국 현지 상황 및 세관 사정에 따라 지연될 수 있음</strong></span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <hr className="my-8 border-gray-300" />

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">레플리카 구매 시 고려할 점</h3>
              
              <p className="text-lg font-medium text-gray-900 mb-6 text-center italic">
                "싸고 좋은 제품은 없다. 하지만 터무니없이 비싼 제품을 살 필요도 없다."
              </p>

              <div className="mb-6">
                <h4 className="font-bold text-gray-900 mb-2">진정한 상인의 차이</h4>
                <ul className="space-y-1 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">●</span>
                    <span><strong>가격으로 주목받는 건 '삼류 상인'</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">●</span>
                    <span><strong>가치로 주목받는 건 '이류 상인'</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">●</span>
                    <span><strong>가슴으로 주목받는 건 '일류 상인'</strong></span>
                  </li>
                </ul>
                <p className="text-sm text-gray-500 mt-2 ml-4">(출처: 열혈장사꾼)</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 mb-2">레플리카의 핵심은 '티가 나지 않는 것'</h4>
                <ul className="space-y-1 text-gray-700 ml-4">
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">●</span>
                    <span><strong>라이크잇은 "직접 착용할 수 있는 제품"만을 제공</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-black font-bold">●</span>
                    <span>레플리카를 구매하는 목적을 잊지 말 것</span>
                  </li>
                </ul>
              </div>
            </div>

            <hr className="my-8 border-gray-300" />

            <div className="mb-8">
              <h3 className="text-xl font-bold text-gray-800 mb-4">지속적인 연구와 발전</h3>
              <ul className="space-y-1 text-gray-700 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-black font-bold">●</span>
                  <span><strong>가죽 자격증 2개 취득</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-black font-bold">●</span>
                  <span>현재도 <strong>끊임없이 공부하고 발전 중</strong></span>
                </li>
              </ul>
            </div>

            <div className="text-center mt-12 mb-8">
              <p className="text-lg font-medium text-gray-900 mb-2">
                거품 없는 가격으로 합리적인 소비를 지원합니다.
              </p>
              <p className="text-lg font-medium text-gray-900">
                신뢰할 수 있는 레플리카 브랜드를 찾고 있다면, 구글에 라이크잇을 검색해보세요.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
