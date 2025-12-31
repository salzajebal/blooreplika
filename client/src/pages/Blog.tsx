import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation } from "wouter";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { Search } from "lucide-react";
import { useState } from "react";

const blogItems = [
  {
    id: 18,
    title: "가품 판별 = 자석? 이제는 옛말! 최근 스트랩 소재 변화",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_x97E0jVW_a24814d62687f497657edabbcdfa830faa1c888b.jpg"
  },
  {
    id: 15,
    title: "명품 브랜드의 현실, 알고 계셨나요?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/2890195381_2PnVOehW_70677acf57c9efcbb606cfaf7ba3397647ae8668.png"
  },
  {
    id: 19,
    title: "청담동에디션의 몽클제품은 NFC 접속이 가능합니다.",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_bI0zaHUn_1ac74358b7e627f9209f8cef76a5ac0b5c57e7c2.jpg"
  },
  {
    id: 17,
    title: "변색 제거 하는 방법!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_qzy7VSx9_85110665688b4634ef08483e21326904891437bd.jpg"
  },
  {
    id: 16,
    title: "변색? 실버925 완벽 복원 전후 공개!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_hTl2W85S_2c33a5d0b2badbfef9840736b73b53d15e5d53f9.gif"
  },
  {
    id: 14,
    title: "불쾌한 구스다운 패딩 냄새 원인과 제거 방법!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3546916931_FOzG7L1I_5dde47493af995dcc949cf95dd5be1664a26dd94.jpg"
  },
  {
    id: 13,
    title: "저스트 앵끌루 못팔찌 사용방법!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_VteUnzgG_f02f88746ade9c3f9526e652fac849c01e49848d.jpg"
  },
  {
    id: 12,
    title: "해외배송 특성상 박스가 찌그러질수 밖에 없는 이유!",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_SHpBwygs_856c955a32382233cb0e6aa98dcfbca968853fad.jpg"
  },
  {
    id: 11,
    title: "14k 금, 18k 금도 변색 된다는 사실 알고 계시나요?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_Rpr7wf8S_f4fbc60464e297e9117bd1a8c9de455fe76ffa7e.jpg"
  },
  {
    id: 10,
    title: "명품도 피해 갈 수 없다? 정품 가죽 냄새의 근본 원인과 제거 팁",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_vQW34OrL_6e1756c6fe511df25798bfbb4eba90750468a4c3.jpg"
  },
  {
    id: 9,
    title: "오리지널 동일 가죽에도 급이 있다는 사실 알고 계셨나요?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_nuegD5Xb_a0845e62da6a6d4799143f3010d1e2bdbf48e61a.jpg"
  },
  {
    id: 8,
    title: "청담동 제품 VS 타 업체 제품 비교",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_ZwPhnTa7_d966b33597402ced36c7642969b0fc9f8b5f33e5.jpg"
  },
  {
    id: 7,
    title: "왜 청담동 악세사리는 타 업체보다 비싸요? (짝통 중금속 관련 이슈)",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/37289044_Vk3bXtEy_a28c6d4f03c78df05f5e174a499d58a6fc9fbc44.jpg"
  },
  {
    id: 6,
    title: "왜? 청담동에디션이 명품 레플리카 사이트 1등인가요?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_dtncAE9w_df3490c95c91627c0234e9d8e9880a6d86bcf01d.jpg"
  },
  {
    id: 5,
    title: "(TIP) 가품이라면 너무 뻔한 실수! 내부 택에 '메이드 인 차이나'라니?",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_P0JmtIXl_6f91af4b1b076cb7106d648543a09aa6853fcd5b.jpg"
  },
  {
    id: 4,
    title: "청담동에디션 패딩의 품질 보증에 대해서",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_bI0zaHUn_1ac74358b7e627f9209f8cef76a5ac0b5c57e7c2.jpg"
  },
  {
    id: 3,
    title: "청담동에디션만의 특별한 포장 서비스",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_x97E0jVW_a24814d62687f497657edabbcdfa830faa1c888b.jpg"
  },
  {
    id: 2,
    title: "시계 스트랩 조절 방법 안내",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_qzy7VSx9_85110665688b4634ef08483e21326904891437bd.jpg"
  },
  {
    id: 1,
    title: "청담동에디션 신규 회원 가입 혜택 안내",
    imageUrl: "https://cdamdong.co.kr/data/file/sj_note/3034935948_SHpBwygs_856c955a32382233cb0e6aa98dcfbca968853fad.jpg"
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
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("title");

  const filteredItems = blogItems.filter(item => {
    if (!searchTerm) return true;
    return item.title.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
