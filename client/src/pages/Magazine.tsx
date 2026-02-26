import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, ArrowLeft, Calendar } from "lucide-react";

const MAGAZINE_CATEGORIES = [
  "전체",
  "매거진",
  "가이드 & 팁",
  "트렌드",
  "셀럽 스타일",
  "브랜드 스토리",
];

export default function Magazine() {
  const params = useParams<{ id?: string }>();

  if (params.id) {
    return <MagazineDetail id={params.id} />;
  }
  return <MagazineList />;
}

function MagazineList() {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [showDropdown, setShowDropdown] = useState(false);

  const { data: articles = [] } = useQuery({
    queryKey: ['/api/magazines', selectedCategory],
    queryFn: async () => {
      const query = selectedCategory !== "전체" ? `?category=${encodeURIComponent(selectedCategory)}` : "";
      const res = await fetch(`/api/magazines${query}`);
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <div className="max-w-[1200px] mx-auto px-4 pt-6 pb-2">
          <div className="relative inline-block">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-1 text-base md:text-lg font-bold text-gray-900"
              data-testid="magazine-category-dropdown"
            >
              {selectedCategory === "전체" ? "매거진" : selectedCategory}
              <ChevronDown className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>
            {showDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-30 min-w-[160px]">
                {MAGAZINE_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => { setSelectedCategory(cat); setShowDropdown(false); }}
                    className={`block w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                      selectedCategory === cat ? "text-black font-semibold bg-gray-50" : "text-gray-600"
                    }`}
                    data-testid={`magazine-cat-${cat}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 pb-10">
          {articles.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg mb-2">등록된 매거진이 없습니다.</p>
              <p className="text-sm">관리자가 매거진을 등록하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="space-y-4 md:space-y-5 mt-4">
              {articles.map((article: any, index: number) => (
                <MagazineCard key={article.id} article={article} featured={index === 0} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

function MagazineDetail({ id }: { id: string }) {
  const { data: article, isLoading, error } = useQuery({
    queryKey: ['/api/magazines', id],
    queryFn: async () => {
      const res = await fetch(`/api/magazines/${id}`);
      const data = await res.json();
      if (!data.success) throw new Error("Not found");
      return data.data;
    }
  });

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main className="max-w-[800px] mx-auto px-4 py-6">
        <Link href="/magazine" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6" data-testid="btn-back-magazine">
          <ArrowLeft className="w-4 h-4" />
          매거진 목록
        </Link>

        {isLoading && (
          <div className="text-center py-20 text-gray-400">로딩 중...</div>
        )}

        {error && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg mb-2">매거진을 찾을 수 없습니다.</p>
            <Link href="/magazine" className="text-sm text-blue-500 hover:underline">목록으로 돌아가기</Link>
          </div>
        )}

        {article && (
          <article data-testid={`magazine-detail-${id}`}>
            {article.imageUrl && (
              <div className="w-full aspect-[16/9] rounded-lg overflow-hidden mb-6">
                <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
                {article.category}
              </span>
              {article.createdAt && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Calendar className="w-3 h-3" />
                  {new Date(article.createdAt).toLocaleDateString("ko-KR")}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight mb-2" data-testid="text-magazine-title">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-base md:text-lg text-gray-500 mb-8" data-testid="text-magazine-subtitle">
                {article.subtitle}
              </p>
            )}

            {article.content && (
              <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap" data-testid="text-magazine-content">
                {article.content}
              </div>
            )}
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}

function MagazineCard({ article, featured }: { article: any; featured?: boolean }) {
  const href = article.linkUrl || `/magazine/${article.id}`;
  const isExternal = article.linkUrl && (article.linkUrl.startsWith("http") || article.linkUrl.startsWith("//"));

  const cardContent = (
    <div
      className={`relative w-full overflow-hidden rounded-lg group cursor-pointer ${
        featured ? "aspect-[16/10] md:aspect-[16/9]" : "aspect-[16/10] md:aspect-[2/1]"
      }`}
      data-testid={`magazine-card-${article.id}`}
    >
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading={featured ? "eager" : "lazy"}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-600" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

      <div className="absolute top-4 left-4">
        <span className="text-[11px] md:text-xs text-white/80 font-medium tracking-wide">
          {article.category}
        </span>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
        <h2 className={`text-white font-bold leading-snug mb-1 ${
          featured ? "text-xl md:text-3xl" : "text-lg md:text-2xl"
        }`}>
          {article.title}
        </h2>
        {article.subtitle && (
          <p className={`text-white/70 line-clamp-2 ${
            featured ? "text-sm md:text-base" : "text-xs md:text-sm"
          }`}>
            {article.subtitle}
          </p>
        )}
      </div>
    </div>
  );

  if (isExternal) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block">
        {cardContent}
      </a>
    );
  }

  return (
    <Link href={href} className="block">
      {cardContent}
    </Link>
  );
}
