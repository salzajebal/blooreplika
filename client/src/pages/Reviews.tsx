import { useQuery } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import { Star, ChevronRight, Home, ChevronLeft, Eye, Calendar, ImageOff, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface Review {
  id: string;
  authorName: string;
  productName: string | null;
  rating: number;
  title: string;
  content: string;
  imageUrl: string | null;
  imageUrls: string[] | null;
  displayDate: string | null;
  viewCount?: number;
}

// Helper function to proxy external images
function getProxiedImageUrl(url: string): string {
  if (!url) return "";
  // If it's an external image from cdamdong.co.kr, use the proxy
  if (url.includes("cdamdong.co.kr")) {
    return `/api/image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
}

// Filter out obviously invalid image URLs
function filterValidImageUrls(urls: string[]): string[] {
  return urls.filter(url => {
    // Skip obviously invalid URLs
    if (!url || url.length < 10) {
      return false;
    }
    return true;
  });
}

// Lazy loading image component with loading state
function LazyImage({ src, alt, className, onLoadSuccess, onError: onErrorProp }: { 
  src: string; 
  alt: string; 
  className?: string;
  onLoadSuccess?: () => void;
  onError?: () => void;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
    onLoadSuccess?.();
  }, [onLoadSuccess]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
    onErrorProp?.();
  }, [onErrorProp]);

  if (hasError) {
    return (
      <div className={`${className} bg-gray-200 flex flex-col items-center justify-center text-gray-400`}>
        <ImageOff className="w-8 h-8 mb-1" />
        <span className="text-xs">이미지 없음</span>
      </div>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className={`${className} bg-gray-100 flex items-center justify-center absolute inset-0`}>
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  );
}

function ReviewImageGallery({ images, title }: { images: string[]; title: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  // Filter out problematic URLs and proxy remaining images
  const validImages = filterValidImageUrls(images || []);
  
  // If no images, show placeholder
  if (validImages.length === 0) {
    return (
      <div className="mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 h-48 sm:h-56 flex items-center justify-center">
        <div className="text-center text-gray-400">
          <ImageOff className="w-12 h-12 mx-auto mb-2" />
          <span className="text-sm">이미지 없음</span>
        </div>
      </div>
    );
  }
  
  const proxiedImages = validImages.map(getProxiedImageUrl);

  const handlePrev = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? proxiedImages.length - 1 : prev - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === proxiedImages.length - 1 ? 0 : prev + 1));
  };

  const handleImageClick = (e: React.MouseEvent) => {
    // Only open modal if clicking on the image, not on buttons
    const target = e.target as HTMLElement;
    if (target.tagName === 'BUTTON' || target.closest('button')) {
      return;
    }
    setIsOpen(true);
  };

  return (
    <>
      <div 
        className="relative mb-4 rounded-lg overflow-hidden cursor-pointer group"
        onClick={handleImageClick}
      >
        <LazyImage
          src={proxiedImages[currentIndex]}
          alt={`${title} - ${currentIndex + 1}`}
          className="w-full h-48 sm:h-56 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {proxiedImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 active:bg-black/90 rounded-full flex items-center justify-center text-white transition-colors z-20 shadow-lg"
              aria-label="이전 이미지"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 hover:bg-black/80 active:bg-black/90 rounded-full flex items-center justify-center text-white transition-colors z-20 shadow-lg"
              aria-label="다음 이미지"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1 rounded-full z-10">
              {currentIndex + 1} / {proxiedImages.length}
            </div>
          </>
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <div className="relative">
            <LazyImage
              src={proxiedImages[currentIndex]}
              alt={`${title} - ${currentIndex + 1}`}
              className="w-full max-h-[80vh] object-contain"
            />
            
            {proxiedImages.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors z-10"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center text-white transition-colors z-10"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full z-10">
                  {currentIndex + 1} / {proxiedImages.length}
                </div>
              </>
            )}
          </div>
          
          {proxiedImages.length > 1 && (
            <div className="flex gap-2 p-4 overflow-x-auto bg-black">
              {proxiedImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`flex-shrink-0 w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                    idx === currentIndex ? "border-white" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <LazyImage
                    src={img}
                    alt={`썸네일 ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

const REVIEWS_PER_PAGE = 12;

export default function Reviews() {
  const [match, params] = useRoute("/reviews/:id");
  const reviewId = match ? params.id : null;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  
  const { data: reviewsData, isLoading } = useQuery<{ reviews: Review[]; total: number }>({
    queryKey: ["reviews", currentPage],
    queryFn: async () => {
      const offset = (currentPage - 1) * REVIEWS_PER_PAGE;
      const res = await fetch(`/api/reviews?limit=${REVIEWS_PER_PAGE}&offset=${offset}`);
      const data = await res.json();
      return {
        reviews: data.success ? data.data : [],
        total: data.total || 0
      };
    },
  });

  const { data: singleReview } = useQuery<Review | null>({
    queryKey: ["review", reviewId],
    queryFn: async () => {
      if (!reviewId) return null;
      const res = await fetch(`/api/reviews/${reviewId}`);
      const data = await res.json();
      return data.success ? data.data : null;
    },
    enabled: !!reviewId,
  });

  useEffect(() => {
    if (singleReview) {
      setSelectedReview(singleReview);
    }
  }, [singleReview]);

  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.total || 0;
  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);

  const getDisplayImages = (review: Review): string[] => {
    let images: string[] = [];
    if (review.imageUrls && review.imageUrls.length > 0) {
      images = review.imageUrls;
    } else if (review.imageUrl) {
      images = [review.imageUrl];
    }
    return filterValidImageUrls(images);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-8 flex-wrap">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          data-testid="button-prev-page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        {pages.map((page, idx) => (
          page === '...' ? (
            <span key={`ellipsis-${idx}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page as number)}
              className={`min-w-[40px] px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-black text-white'
                  : 'border border-gray-300 hover:bg-gray-100'
              }`}
              data-testid={`button-page-${page}`}
            >
              {page}
            </button>
          )
        ))}
        
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded-lg border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          data-testid="button-next-page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

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
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">고객 후기</h1>
          <p className="text-gray-600 text-sm md:text-base">청담동에디션을 이용해주신 고객님들의 생생한 후기입니다</p>
          <p className="text-gray-400 text-sm mt-1">
            총 {totalReviews.toLocaleString()}개의 후기 
            {totalPages > 1 && <span className="ml-2">({currentPage} / {totalPages} 페이지)</span>}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-lg mb-4" />
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
            {reviews.map((review) => {
              const images = getDisplayImages(review);
              
              return (
                <div
                  key={review.id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow border border-gray-100"
                  data-testid={`card-review-${review.id}`}
                >
                  <ReviewImageGallery images={images} title={review.title} />
                  
                  <div className="p-4 sm:p-6">
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
                      {images.length > 0 && (
                        <span className="ml-2 text-xs text-gray-400">
                          사진 {images.length}장
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 text-sm sm:text-base">{review.title}</h3>
                    
                    {review.productName && (
                      <p className="text-sm text-primary mb-2 line-clamp-1">구매상품: {review.productName}</p>
                    )}
                    
                    <p className="text-gray-600 text-sm mb-4 line-clamp-4 whitespace-pre-line">{review.content}</p>
                    
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 pt-4 border-t">
                      <span className="font-medium">{review.authorName}</span>
                      <div className="flex items-center gap-3">
                        {review.viewCount && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {review.viewCount.toLocaleString()}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {review.displayDate
                            ? new Date(review.displayDate).toLocaleDateString("ko-KR")
                            : "-"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {renderPagination()}

        {selectedReview && (
          <Dialog open={!!selectedReview} onOpenChange={(open) => !open && setSelectedReview(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="p-2">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < (selectedReview.rating || 5)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">{selectedReview.title}</h2>
                {selectedReview.productName && (
                  <p className="text-sm text-primary mb-4">구매상품: {selectedReview.productName}</p>
                )}
                <ReviewImageGallery 
                  images={getDisplayImages(selectedReview)} 
                  title={selectedReview.title || '후기'} 
                />
                <p className="text-gray-700 whitespace-pre-line leading-relaxed mt-4">{selectedReview.content}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mt-6 pt-4 border-t">
                  <span className="font-medium">{selectedReview.authorName}</span>
                  <div className="flex items-center gap-3">
                    {selectedReview.viewCount && (
                      <span className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {selectedReview.viewCount.toLocaleString()}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {selectedReview.displayDate
                        ? new Date(selectedReview.displayDate).toLocaleDateString("ko-KR")
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>

      <Footer />
    </div>
  );
}
