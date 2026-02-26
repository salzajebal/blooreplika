import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Calendar, Eye } from "lucide-react";

const MAGAZINE_CATEGORIES = [
  "매거진",
  "가이드 & 팁",
  "트렌드",
  "셀럽 스타일",
  "브랜드 스토리",
];

function ScrollReveal({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

export default function Magazine() {
  const params = useParams<{ id?: string }>();

  if (params.id) {
    return <MagazineDetail id={params.id} />;
  }
  return <MagazineList />;
}

function MagazineList() {
  const { data: articles = [] } = useQuery({
    queryKey: ['/api/magazines'],
    queryFn: async () => {
      const res = await fetch('/api/magazines');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const groupedByCategory: Record<string, any[]> = {};
  for (const cat of MAGAZINE_CATEGORIES) {
    const catArticles = articles.filter((a: any) => a.category === cat);
    if (catArticles.length > 0) {
      groupedByCategory[cat] = catArticles;
    }
  }

  const uncategorized = articles.filter(
    (a: any) => !MAGAZINE_CATEGORIES.includes(a.category)
  );
  if (uncategorized.length > 0) {
    groupedByCategory["기타"] = uncategorized;
  }

  const categoryKeys = Object.keys(groupedByCategory);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <main>
        <div className="max-w-[640px] mx-auto px-4 pt-8 pb-2">
          <h1 className="text-[20px] font-bold text-gray-900 tracking-tight">매거진</h1>
        </div>

        <div className="max-w-[640px] mx-auto px-4 pb-16">
          {categoryKeys.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-base mb-2">등록된 매거진이 없습니다.</p>
              <p className="text-xs text-gray-300">관리자가 매거진을 등록하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            <div className="space-y-10 mt-4">
              {categoryKeys.map((category) => (
                <section key={category}>
                  <ScrollReveal>
                    <h2 className="text-[15px] font-bold text-gray-800 mb-3 tracking-tight border-b border-gray-100 pb-2">
                      {category}
                    </h2>
                  </ScrollReveal>
                  <div className="space-y-3">
                    {groupedByCategory[category].map((article: any, index: number) => (
                      <ScrollReveal key={article.id} delay={index * 80}>
                        <MagazineCard article={article} />
                      </ScrollReveal>
                    ))}
                  </div>
                </section>
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

      <main className="max-w-[640px] mx-auto px-4 py-6">
        <Link href="/magazine" className="inline-flex items-center gap-1 text-[13px] text-gray-400 hover:text-gray-900 transition-colors mb-6" data-testid="btn-back-magazine">
          <ArrowLeft className="w-3.5 h-3.5" />
          매거진 목록
        </Link>

        {isLoading && (
          <div className="text-center py-20">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-gray-500 rounded-full animate-spin mx-auto" />
          </div>
        )}

        {error && (
          <div className="text-center py-20 text-gray-400">
            <p className="text-base mb-3">매거진을 찾을 수 없습니다.</p>
            <Link href="/magazine" className="text-sm text-gray-500 underline underline-offset-4 hover:text-gray-900">목록으로 돌아가기</Link>
          </div>
        )}

        {article && (
          <article data-testid={`magazine-detail-${id}`} className="animate-in fade-in duration-500">
            {article.imageUrl && (
              <div className="w-full rounded-lg overflow-hidden mb-5">
                <img src={article.imageUrl} alt={article.title} className="w-full h-auto object-cover" />
              </div>
            )}

            <div className="flex items-center gap-2.5 mb-3">
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                {article.category}
              </span>
              {article.createdAt && (
                <span className="flex items-center gap-1 text-[11px] text-gray-300">
                  <Calendar className="w-3 h-3" />
                  {new Date(article.createdAt).toLocaleDateString("ko-KR")}
                </span>
              )}
              {article.viewCount > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-gray-300">
                  <Eye className="w-3 h-3" />
                  {article.viewCount.toLocaleString()}
                </span>
              )}
            </div>

            <h1 className="text-[22px] md:text-[26px] font-bold text-gray-900 leading-tight mb-1.5 tracking-tight" data-testid="text-magazine-title">
              {article.title}
            </h1>

            {article.subtitle && (
              <p className="text-[14px] text-gray-400 mb-8 leading-relaxed" data-testid="text-magazine-subtitle">
                {article.subtitle}
              </p>
            )}

            {article.content && (
              <div className="text-[14px] text-gray-600 leading-[1.85] whitespace-pre-wrap" data-testid="text-magazine-content">
                {article.content}
              </div>
            )}

            <div className="mt-12 pt-6 border-t border-gray-100">
              <Link
                href="/magazine"
                className="inline-flex items-center gap-1.5 text-[13px] text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                목록으로
              </Link>
            </div>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}

function MagazineCard({ article }: { article: any }) {
  const href = article.linkUrl || `/magazine/${article.id}`;
  const isExternal = article.linkUrl && (article.linkUrl.startsWith("http") || article.linkUrl.startsWith("//"));

  const cardContent = (
    <div
      className="relative w-full overflow-hidden rounded-lg group cursor-pointer"
      data-testid={`magazine-card-${article.id}`}
    >
      {article.imageUrl ? (
        <img
          src={article.imageUrl}
          alt={article.title}
          className="w-full aspect-[4/5] object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-[4/5] bg-gradient-to-br from-gray-800 to-gray-600" />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h2 className="text-white font-bold text-[18px] md:text-[20px] leading-snug mb-0.5 tracking-tight">
          {article.title}
        </h2>
        {article.subtitle && (
          <p className="text-white/60 text-[12px] md:text-[13px] line-clamp-1">
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
