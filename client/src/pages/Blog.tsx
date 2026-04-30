import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation, useRoute } from "wouter";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

const blogItems = [
  {
    id: 18,
    title: "가품 판별 = 자석? 이제는 옛말! 최근 스트랩 소재 변화",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_x97E0jVW_a24814d62687f497657edabbcdfa830faa1c888b.jpg",
    content: "최근 스트랩 소재의 변화로 인해 기존 자석 판별법이 더 이상 유효하지 않게 되었습니다. 새로운 기술과 소재가 도입되면서 정품과 동일한 소재를 사용하는 제품들이 늘어나고 있습니다. 이 글에서는 최신 스트랩 소재 트렌드와 변화에 대해 알아봅니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_x97E0jVW_a24814d62687f497657edabbcdfa830faa1c888b.jpg"],
    date: "2025-01-01"
  },
  {
    id: 15,
    title: "명품 브랜드의 현실, 알고 계셨나요?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/2890195381_2PnVOehW_70677acf57c9efcbb606cfaf7ba3397647ae8668.png",
    content: "명품 브랜드의 실제 생산 비용과 판매 가격 사이의 마진에 대해 알아봅니다. 많은 분들이 모르시는 명품 산업의 현실을 공개합니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/2890195381_2PnVOehW_70677acf57c9efcbb606cfaf7ba3397647ae8668.png"],
    date: "2024-12-28"
  },
  {
    id: 19,
    title: "velour의 몽클제품은 NFC 접속이 가능합니다.",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_bI0zaHUn_1ac74358b7e627f9209f8cef76a5ac0b5c57e7c2.jpg",
    content: "velour의 몽클레르 제품은 정품과 동일한 NFC 칩이 내장되어 있어 스마트폰으로 정품 인증이 가능합니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_bI0zaHUn_1ac74358b7e627f9209f8cef76a5ac0b5c57e7c2.jpg"],
    date: "2024-12-25"
  },
  {
    id: 17,
    title: "변색 제거 하는 방법!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_qzy7VSx9_85110665688b4634ef08483e21326904891437bd.jpg",
    content: "실버 악세사리의 변색을 간단하게 제거하는 방법을 알려드립니다. 집에서 쉽게 할 수 있는 방법들을 소개합니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_qzy7VSx9_85110665688b4634ef08483e21326904891437bd.jpg"],
    date: "2024-12-20"
  },
  {
    id: 16,
    title: "변색? 실버925 완벽 복원 전후 공개!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_hTl2W85S_2c33a5d0b2badbfef9840736b73b53d15e5d53f9.gif",
    content: "실버925 제품의 변색 전후 비교 사진을 공개합니다. 완벽한 복원 과정을 보여드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_hTl2W85S_2c33a5d0b2badbfef9840736b73b53d15e5d53f9.gif"],
    date: "2024-12-18"
  },
  {
    id: 14,
    title: "불쾌한 구스다운 패딩 냄새 원인과 제거 방법!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3546916931_FOzG7L1I_5dde47493af995dcc949cf95dd5be1664a26dd94.jpg",
    content: "구스다운 패딩에서 나는 불쾌한 냄새의 원인과 제거 방법을 알려드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3546916931_FOzG7L1I_5dde47493af995dcc949cf95dd5be1664a26dd94.jpg"],
    date: "2024-12-15"
  },
  {
    id: 13,
    title: "저스트 앵끌루 못팔찌 사용방법!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_VteUnzgG_f02f88746ade9c3f9526e652fac849c01e49848d.jpg",
    content: "까르띠에 저스트 앵끌루 못팔찌의 올바른 착용 방법과 사용법을 안내합니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_VteUnzgG_f02f88746ade9c3f9526e652fac849c01e49848d.jpg"],
    date: "2024-12-10"
  },
  {
    id: 12,
    title: "국내배송 특성상 안전하게 배송되는 이유!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_SHpBwygs_856c955a32382233cb0e6aa98dcfbca968853fad.jpg",
    content: "국내 배송 시 제품 보호 방법과 안전한 포장에 대해 설명드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_SHpBwygs_856c955a32382233cb0e6aa98dcfbca968853fad.jpg"],
    date: "2024-12-05"
  },
  {
    id: 11,
    title: "14k 금, 18k 금도 변색 된다는 사실 알고 계시나요?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_Rpr7wf8S_f4fbc60464e297e9117bd1a8c9de455fe76ffa7e.jpg",
    content: "14K, 18K 금도 변색될 수 있다는 사실을 알고 계셨나요? 금 제품 관리법을 알려드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_Rpr7wf8S_f4fbc60464e297e9117bd1a8c9de455fe76ffa7e.jpg"],
    date: "2024-12-01"
  },
  {
    id: 10,
    title: "명품도 피해 갈 수 없다? 정품 가죽 냄새의 근본 원인과 제거 팁",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_vQW34OrL_6e1756c6fe511df25798bfbb4eba90750468a4c3.jpg",
    content: "정품 가죽에서 나는 특유의 냄새 원인과 제거 방법을 알려드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_vQW34OrL_6e1756c6fe511df25798bfbb4eba90750468a4c3.jpg"],
    date: "2024-11-28"
  },
  {
    id: 9,
    title: "오리지널 동일 가죽에도 급이 있다는 사실 알고 계셨나요?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_nuegD5Xb_a0845e62da6a6d4799143f3010d1e2bdbf48e61a.jpg",
    content: "같은 오리지널 가죽이라도 등급이 다르다는 사실을 알려드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_nuegD5Xb_a0845e62da6a6d4799143f3010d1e2bdbf48e61a.jpg"],
    date: "2024-11-25"
  },
  {
    id: 8,
    title: "velour 제품 VS 타 업체 제품 비교",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_ZwPhnTa7_d966b33597402ced36c7642969b0fc9f8b5f33e5.jpg",
    content: "velour 제품과 타 업체 제품의 품질 차이를 비교해 보았습니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_ZwPhnTa7_d966b33597402ced36c7642969b0fc9f8b5f33e5.jpg"],
    date: "2024-11-20"
  },
  {
    id: 7,
    title: "왜 velour 악세사리는 타 업체보다 비싸요? (중금속 관련 이슈)",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/37289044_Vk3bXtEy_a28c6d4f03c78df05f5e174a499d58a6fc9fbc44.jpg",
    content: "velour 악세사리가 다른 업체보다 비싼 이유를 설명드립니다. 중금속 이슈와 품질 차이에 대해 알아봅니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/37289044_Vk3bXtEy_a28c6d4f03c78df05f5e174a499d58a6fc9fbc44.jpg"],
    date: "2024-11-15"
  },
  {
    id: 6,
    title: "왜? velour이 명품 레플리카 사이트 1등인가요?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_dtncAE9w_df3490c95c91627c0234e9d8e9880a6d86bcf01d.jpg",
    content: "velour이 명품 레플리카 업계에서 1등인 이유를 설명드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_dtncAE9w_df3490c95c91627c0234e9d8e9880a6d86bcf01d.jpg"],
    date: "2024-11-10"
  },
  {
    id: 5,
    title: "(TIP) 가품이라면 너무 뻔한 실수! 내부 택에 '메이드 인 차이나'라니?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_P0JmtIXl_6f91af4b1b076cb7106d648543a09aa6853fcd5b.jpg",
    content: "저품질 가품의 흔한 실수 중 하나인 내부 택 문제에 대해 알려드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_P0JmtIXl_6f91af4b1b076cb7106d648543a09aa6853fcd5b.jpg"],
    date: "2024-11-05"
  },
  {
    id: 4,
    title: "velour 패딩의 품질 보증에 대해서",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_bI0zaHUn_1ac74358b7e627f9209f8cef76a5ac0b5c57e7c2.jpg",
    content: "velour 패딩 제품의 품질 보증 정책에 대해 안내드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_bI0zaHUn_1ac74358b7e627f9209f8cef76a5ac0b5c57e7c2.jpg"],
    date: "2024-11-01"
  },
  {
    id: 3,
    title: "velour만의 특별한 포장 서비스",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_x97E0jVW_a24814d62687f497657edabbcdfa830faa1c888b.jpg",
    content: "velour만의 특별한 포장 서비스를 소개합니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_x97E0jVW_a24814d62687f497657edabbcdfa830faa1c888b.jpg"],
    date: "2024-10-28"
  },
  {
    id: 2,
    title: "시계 스트랩 조절 방법 안내",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_qzy7VSx9_85110665688b4634ef08483e21326904891437bd.jpg",
    content: "시계 스트랩 길이 조절 방법을 안내드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_qzy7VSx9_85110665688b4634ef08483e21326904891437bd.jpg"],
    date: "2024-10-25"
  },
  {
    id: 1,
    title: "velour 신규 회원 가입 혜택 안내",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_SHpBwygs_856c955a32382233cb0e6aa98dcfbca968853fad.jpg",
    content: "velour 신규 회원 가입 시 받을 수 있는 혜택을 안내드립니다.",
    images: ["https://cdamdong.co.kr/data/file/sj_note/3034935948_SHpBwygs_856c955a32382233cb0e6aa98dcfbca968853fad.jpg"],
    date: "2024-10-20"
  },
];

const sideMenuItems = [
  { name: "공지사항", path: "/notices" },
  { name: "FAQ", path: "/faq" },
  { name: "칼럼", path: "/comparison" },
  { name: "이벤트", path: "/events" },
  { name: "사용후기", path: "/reviews" },
];

export default function Blog() {
  const [location] = useLocation();
  const [match, params] = useRoute("/blog/:id");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("title");

  const itemId = match ? parseInt(params.id) : null;
  const currentItem = itemId ? blogItems.find(item => item.id === itemId) : null;

  const filteredItems = blogItems.filter(item => {
    if (!searchTerm) return true;
    return item.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const currentIndex = currentItem ? blogItems.findIndex(item => item.id === currentItem.id) : -1;
  const prevItem = currentIndex > 0 ? blogItems[currentIndex - 1] : null;
  const nextItem = currentIndex < blogItems.length - 1 ? blogItems[currentIndex + 1] : null;

  if (currentItem) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        
        <main>
          <div className="bg-gray-100 py-4">
            <div className="max-w-[1200px] mx-auto px-4">
              <h1 className="text-lg font-bold text-gray-800">블로그</h1>
              <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                <Link href="/" className="hover:text-black">홈</Link>
                <span>&gt;</span>
                <Link href="/blog" className="hover:text-black">블로그</Link>
                <span>&gt;</span>
                <span className="truncate max-w-[200px]">{currentItem.title}</span>
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
                      className="block px-4 py-3 text-sm border-b border-gray-200 last:border-b-0 text-gray-700 hover:bg-gray-50"
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </aside>

              <div className="flex-1">
                <div className="border-b border-gray-200 pb-4 mb-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{currentItem.title}</h2>
                  <p className="text-sm text-gray-500">{currentItem.date}</p>
                </div>

                <div className="space-y-4 mb-8">
                  {currentItem.images.map((img, index) => (
                    <div key={index} className="bg-gray-50 rounded overflow-hidden">
                      <img
                        src={getProxiedImageUrl(img)}
                        alt={`${currentItem.title} - ${index + 1}`}
                        className="w-full h-auto"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                      />
                    </div>
                  ))}
                </div>

                <div className="prose prose-sm max-w-none mb-8">
                  <p className="text-gray-700 leading-relaxed">{currentItem.content}</p>
                </div>

                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  {prevItem ? (
                    <Link href={`/blog/${prevItem.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black">
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">이전글</span>
                    </Link>
                  ) : <div />}
                  
                  <Link href="/blog" className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-700">
                    목록
                  </Link>
                  
                  {nextItem ? (
                    <Link href={`/blog/${nextItem.id}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black">
                      <span className="hidden sm:inline">다음글</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ) : <div />}
                </div>
              </div>
            </div>
          </div>
        </main>
        
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <div className="bg-gray-100 py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-gray-800">블로그</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-black">홈</Link>
              <span>&gt;</span>
              <span>쇼핑몰</span>
              <span>&gt;</span>
              <span>블로그</span>
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
              <div className="flex items-center justify-between mb-6">
                <p className="text-sm text-gray-600">
                  Total : <strong>{filteredItems.length}</strong> items
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                {filteredItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/blog/${item.id}`}
                    className="block bg-white border border-gray-200 hover:border-gray-400 transition-colors"
                    data-testid={`blog-item-${item.id}`}
                  >
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      <img
                        src={getProxiedImageUrl(item.imageUrl)}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-xs text-gray-800 line-clamp-2 leading-relaxed">
                        {item.title}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="flex justify-center">
                <div className="flex items-center gap-2 border border-gray-300 rounded overflow-hidden">
                  <select 
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="px-3 py-2 text-sm bg-white border-r border-gray-300 outline-none"
                  >
                    <option value="title">제목</option>
                    <option value="content">내용</option>
                    <option value="title_content">제목+내용</option>
                  </select>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="검색어 필수"
                    className="px-3 py-2 text-sm outline-none w-40"
                  />
                  <button className="px-4 py-2 bg-gray-800 text-white text-sm hover:bg-gray-700">
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
