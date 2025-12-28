import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Star, ChevronRight, Home } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface Review {
  id: string;
  authorName: string;
  productName: string | null;
  rating: number;
  title: string;
  content: string;
  imageUrl: string | null;
  displayDate: string | null;
}

export default function Reviews() {
  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["reviews"],
    queryFn: async () => {
      const res = await fetch("/api/reviews");
      const data = await res.json();
      return data.success ? data.data : [];
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-black flex items-center gap-1">
            <Home className="w-4 h-4" />
            홈
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">고객후기</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">고객 후기</h1>
          <p className="text-gray-600">청담동에디션을 이용해주신 고객님들의 생생한 후기입니다</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                <div className="h-20 bg-gray-200 rounded mb-4" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center">
            <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">등록된 후기가 없습니다</h3>
            <p className="text-gray-500">첫 번째 후기를 남겨주세요!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow border border-gray-100"
                data-testid={`card-review-${review.id}`}
              >
                {review.imageUrl && (
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={review.imageUrl}
                      alt={review.title}
                      className="w-full h-48 object-cover"
                    />
                  </div>
                )}
                
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (review.rating || 5)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{review.title}</h3>
                
                {review.productName && (
                  <p className="text-sm text-gold-600 mb-2">구매상품: {review.productName}</p>
                )}
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-4">{review.content}</p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
                  <span className="font-medium">{review.authorName}</span>
                  <span>
                    {review.displayDate
                      ? new Date(review.displayDate).toLocaleDateString("ko-KR")
                      : "-"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
