import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation } from "wouter";
import { getProxiedImageUrl } from "@/lib/imageProxy";
import { Search } from "lucide-react";
import { useState } from "react";

const choiceItems = [
  {
    id: 107,
    celebrity: "차정원",
    title: "구찌 소프트빗 맥시 숄더백 837466",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_a9Lwzf45_e9c1ee501528a0f16744a017fb1bc1ab3673f066.png"
  },
  {
    id: 106,
    celebrity: "손연재",
    title: "샤넬 벨크로 클래식 샌들 (upgrade ver.)",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_RUeiJkpr_b7f35f3de5427dbf4a6999dc4de0ea68051612db.jpg"
  },
  {
    id: 105,
    celebrity: "차정원",
    title: "생로랑 Y 카바스 레더 토트 숄더백",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_Drg1GXxQ_3e56b96ca177d5c114d53064e3266d9cfb7a7ca4.jpg"
  },
  {
    id: 104,
    celebrity: "민호",
    title: "프라다 바이커백 스몰 2VH171",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_esxWarvd_c772477a99f858228b16cd591fa0bace8282fb28.jpg"
  },
  {
    id: 103,
    celebrity: "이나연",
    title: "프라다 리에디션 1978 미디움 리나일론 및 사피아노 가죽 투핸들 백 1bb115",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_EtfkyJDq_0a797c946a083d3c77fd4d0f8ea7a5b8a602fcef.png"
  },
  {
    id: 102,
    celebrity: "카리나",
    title: "프라다 미디움 레더 핸드백 1BA444",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_dVtTGL6B_38e5ff3db70b382ada5ad74a39d0111b6c41e376.png"
  },
  {
    id: 101,
    celebrity: "차정원",
    title: "샤넬 cc로고 레인부츠",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_OR8wrMJG_069f56e2191b7582655d4d2acec6443353eb3231.jpg"
  },
  {
    id: 100,
    celebrity: "산다라박",
    title: "샤넬 클래식 캐비어 / 램스킨 미디움 25.5cm 은장 (하이엔드급)",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_iGLsBNPy_134612f3a6ad3bd30a3ba050c493e5c497e3bdeb.jpg"
  },
  {
    id: 99,
    celebrity: "정려원",
    title: "샤넬 발레리나 플랫슈즈 정가품 비교샷 OK 하이엔드급",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_jsiO6hax_39c3510024f84a91c776da4338f1cf2a30ef76fa.jpg"
  },
  {
    id: 97,
    celebrity: "차은우",
    title: "디올 맥시 오블리크 위켄더 40",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_QBvdgca4_4401559c13371cfb32860ed64b8eeb51b419c2c5.jpg"
  },
  {
    id: 96,
    celebrity: "아이린",
    title: "루이비통 크로와상 숄더백 M46828",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_A2Q3UsPc_56b578370009dfed5695e540f7715a15b85bb2fc.jpg"
  },
  {
    id: 95,
    celebrity: "차정원",
    title: "생로랑 LE37 미니 카프스킨 숄더 토트 버킷백",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_Ykl94FLA_665679de47e7023251910189a3a83fc321f2b371.jpg"
  },
  {
    id: 94,
    celebrity: "지수",
    title: "디올 워크앤디올 플랫폼 스니커즈",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_hZAKUTzH_0e49b47df5c2b9019b0f052821f3ede4ba4c6202.jpg"
  },
  {
    id: 93,
    celebrity: "기은세",
    title: "샤넬 퀄팅 단화",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_jLJxFwUW_d9819284118cd277bdbb066c97291546c5c43d6e.jpg"
  },
  {
    id: 92,
    celebrity: "정해인",
    title: "디올 다이아몬드 CD 백팩",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_t4BEZHUj_7e614f863c837a7b0f9dfc52b8ce03b6bae06c11.jpg"
  },
  {
    id: 91,
    celebrity: "김유정",
    title: "셀린느 크로스바디 오벌 펄스 퀴르 트리오페 미니백 101703 (Renewal ver.)",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_2MiY9tej_88cabd5a4cfe28c972417bb6da747e7de5d8db79.jpg"
  },
  {
    id: 90,
    celebrity: "제니",
    title: "샤넬 22 미니백 화이트",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_a9Lwzf45_e9c1ee501528a0f16744a017fb1bc1ab3673f066.png"
  },
  {
    id: 89,
    celebrity: "수지",
    title: "에르메스 피코탄 락 PM 18",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_RUeiJkpr_b7f35f3de5427dbf4a6999dc4de0ea68051612db.jpg"
  },
  {
    id: 88,
    celebrity: "김태희",
    title: "디올 레이디백 미디엄",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_Drg1GXxQ_3e56b96ca177d5c114d53064e3266d9cfb7a7ca4.jpg"
  },
  {
    id: 87,
    celebrity: "송혜교",
    title: "보테가 베네타 카세트백",
    imageUrl: "https://cdamdong.co.kr/data/file/cdamdong_choice/987963447_esxWarvd_c772477a99f858228b16cd591fa0bace8282fb28.jpg"
  },
];

const sideMenuItems = [
  { name: "공지사항", path: "/notices" },
  { name: "FAQ", path: "/faq" },
  { name: "칼럼", path: "/comparison" },
  { name: "이벤트", path: "/events" },
  { name: "사용후기", path: "/reviews" },
];

export default function Choice() {
  const [location] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchType, setSearchType] = useState("title");

  const filteredItems = choiceItems.filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return item.title.toLowerCase().includes(searchLower) || item.celebrity.toLowerCase().includes(searchLower);
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <div className="bg-gray-100 py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-gray-800">청담동 초이스</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-black">홈</Link>
              <span>&gt;</span>
              <span>쇼핑몰</span>
              <span>&gt;</span>
              <span>청담동 초이스</span>
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

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {filteredItems.map((item) => (
                  <Link
                    key={item.id}
                    href={`/choice/${item.id}`}
                    className="block bg-white border border-gray-200 hover:border-gray-400 transition-colors"
                    data-testid={`choice-item-${item.id}`}
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
                      <p className="text-xs text-red-500 font-medium mb-1">
                        ({item.celebrity} PICK!!)
                      </p>
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
