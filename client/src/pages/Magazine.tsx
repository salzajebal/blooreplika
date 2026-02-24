import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";

const magazineArticles = [
  {
    id: 1,
    title: "2026 S/S 트렌드 컬러 가이드",
    subtitle: "올 봄 가장 주목해야 할 컬러와 스타일링 팁",
    category: "트렌드",
    date: "2026.02.20",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop",
  },
  {
    id: 2,
    title: "에르메스 버킨백의 모든 것",
    subtitle: "역사부터 관리법까지 완벽 가이드",
    category: "명품 가이드",
    date: "2026.02.15",
    imageUrl: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600&h=400&fit=crop",
  },
  {
    id: 3,
    title: "셀러브리티 공항 패션 분석",
    subtitle: "스타들의 럭셔리 공항룩 해부",
    category: "셀럽 스타일",
    date: "2026.02.10",
    imageUrl: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&h=400&fit=crop",
  },
  {
    id: 4,
    title: "명품 시계 입문 가이드",
    subtitle: "처음 구매하는 분을 위한 브랜드별 추천",
    category: "명품 가이드",
    date: "2026.02.05",
    imageUrl: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600&h=400&fit=crop",
  },
  {
    id: 5,
    title: "봄 맞이 가방 클리닝 TIP",
    subtitle: "소재별 명품 가방 관리 방법",
    category: "케어 가이드",
    date: "2026.01.28",
    imageUrl: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&h=400&fit=crop",
  },
  {
    id: 6,
    title: "샤넬 vs 디올: 클래식 플랩백 비교",
    subtitle: "두 아이코닉 브랜드의 대표 가방 완벽 비교",
    category: "비교 분석",
    date: "2026.01.20",
    imageUrl: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=600&h=400&fit=crop",
  },
];

export default function Magazine() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <div className="bg-black text-white py-12 md:py-20">
          <div className="max-w-[1200px] mx-auto px-4 text-center">
            <h1 className="text-3xl md:text-5xl font-bold tracking-wider mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>MAGAZINE</h1>
            <p className="text-gray-400 text-sm md:text-base">라이크잇이 전하는 럭셔리 라이프스타일</p>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-10 md:py-16">
          {magazineArticles.length > 0 && (
            <div className="mb-12">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="aspect-[4/3] rounded-lg overflow-hidden">
                  <img src={magazineArticles[0].imageUrl} alt={magazineArticles[0].title} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="flex flex-col justify-center">
                  <span className="text-xs text-gray-400 uppercase tracking-wider mb-2">{magazineArticles[0].category}</span>
                  <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">{magazineArticles[0].title}</h2>
                  <p className="text-gray-500 mb-4">{magazineArticles[0].subtitle}</p>
                  <span className="text-xs text-gray-400">{magazineArticles[0].date}</span>
                </div>
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {magazineArticles.slice(1).map((article) => (
              <article key={article.id} className="group cursor-pointer" data-testid={`magazine-article-${article.id}`}>
                <div className="aspect-[4/3] rounded-lg overflow-hidden mb-4">
                  <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                </div>
                <span className="text-[11px] text-gray-400 uppercase tracking-wider">{article.category}</span>
                <h3 className="text-base md:text-lg font-bold text-gray-900 mt-1 mb-1 group-hover:text-gray-600 transition-colors">{article.title}</h3>
                <p className="text-sm text-gray-500 line-clamp-2">{article.subtitle}</p>
                <span className="text-xs text-gray-400 mt-2 block">{article.date}</span>
              </article>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}