import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Star, ChevronRight, ChevronLeft, Home, Search, Camera, Image, Pencil, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";

interface Review {
  id: string;
  authorName: string;
  productId: string | null;
  productName: string | null;
  rating: number;
  title: string;
  content: string;
  imageUrl: string | null;
  imageUrls: string[] | null;
  displayDate: string | null;
  productImageUrl?: string | null;
}

const REVIEWS_PER_PAGE = 20;

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "방금전";
  if (diffMin < 60) return `${diffMin}분전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay}일전`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}개월전`;
  return `${Math.floor(diffMonth / 12)}년전`;
}

function maskName(name: string): string {
  if (!name) return "익명";
  if (name.length <= 2) return name[0] + "*";
  return name[0] + "*".repeat(name.length - 2) + name[name.length - 1];
}

function isNewReview(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return (now.getTime() - date.getTime()) < 7 * 24 * 60 * 60 * 1000;
}

export default function Reviews() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [photoOnly, setPhotoOnly] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: reviewsData, isLoading } = useQuery<{ reviews: Review[]; total: number }>({
    queryKey: ["reviews", currentPage, searchQuery, photoOnly],
    queryFn: async () => {
      const offset = (currentPage - 1) * REVIEWS_PER_PAGE;
      let url = `/api/reviews?limit=${REVIEWS_PER_PAGE}&offset=${offset}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (photoOnly) url += `&photoOnly=true`;
      const res = await fetch(url);
      const data = await res.json();
      return {
        reviews: data.success ? data.data : [],
        total: data.total || 0
      };
    },
  });

  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.total || 0;
  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getThumbImage = (review: Review): string | null => {
    if (review.imageUrls && review.imageUrls.length > 0) return review.imageUrls[0];
    if (review.imageUrl) return review.imageUrl;
    if (review.productImageUrl) return review.productImageUrl;
    return null;
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
      <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
        <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-sm" data-testid="button-prev-page">
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page, idx) =>
          page === '...' ? (
            <span key={`e-${idx}`} className="px-2 text-gray-400">...</span>
          ) : (
            <button key={page} onClick={() => handlePageChange(page as number)}
              className={`min-w-[36px] px-2.5 py-1.5 rounded text-sm font-medium ${currentPage === page ? 'bg-black text-white' : 'border border-gray-300 hover:bg-gray-100'}`}
              data-testid={`button-page-${page}`}>
              {page}
            </button>
          )
        )}
        <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 text-sm" data-testid="button-next-page">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1">
        <div className="max-w-[900px] mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold text-gray-900">실제 구매후기</h1>
              <span className="text-sm text-gray-500">{totalReviews.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPhotoOnly(!photoOnly); setCurrentPage(1); }}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs border transition-colors ${photoOnly ? 'bg-black text-white border-black' : 'border-gray-300 text-gray-600 hover:border-gray-500'}`}
                data-testid="btn-photo-filter"
              >
                <Camera className="w-3 h-3" />
                포토 구매평
              </button>
              <Button size="sm" onClick={() => setShowWriteForm(!showWriteForm)} className="bg-green-500 hover:bg-green-600 text-xs h-8" data-testid="btn-write-review-page">
                <Pencil className="w-3 h-3 mr-1" />
                후기 작성
              </Button>
            </div>
          </div>

          <div className="relative mb-4">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="상품명, 후기 내용 검색"
              className="pr-10 h-10 text-sm"
              data-testid="input-review-search"
            />
            <button onClick={handleSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <Search className="w-5 h-5" />
            </button>
          </div>

          {showWriteForm && (
            <ReviewWriteForm
              onClose={() => setShowWriteForm(false)}
              onSuccess={() => {
                setShowWriteForm(false);
                queryClient.invalidateQueries({ queryKey: ["reviews"] });
              }}
            />
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">등록된 구매후기가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviews.map((review) => {
                const thumbUrl = getThumbImage(review);
                const isPhoto = (review.imageUrls && review.imageUrls.length > 0) || !!review.imageUrl;
                const isNew = isNewReview(review.displayDate);

                return (
                  <div key={review.id} className="flex gap-3 py-3" data-testid={`review-item-${review.id}`}>
                    <div className="w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded overflow-hidden bg-gray-100">
                      {thumbUrl ? (
                        <img
                          src={thumbUrl.startsWith("/api/") ? thumbUrl : getProxiedImageUrl(thumbUrl, "thumbnail")}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <Image className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      {review.productName && (
                        <p className="text-xs text-gray-500 mb-0.5 line-clamp-1">
                          {review.productName}
                        </p>
                      )}
                      {review.title && (
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">
                          {review.title}
                          {isNew && (
                            <span className="inline-block ml-1 text-[10px] bg-green-500 text-white px-1 py-0.5 rounded font-bold align-middle">N</span>
                          )}
                        </p>
                      )}
                      <p className="text-sm text-gray-800 leading-relaxed mb-1 whitespace-pre-line">
                        {review.content}
                        {!review.title && isNew && (
                          <span className="inline-block ml-1 text-[10px] bg-green-500 text-white px-1 py-0.5 rounded font-bold align-middle">N</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{maskName(review.authorName)}</span>
                        <span>{timeAgo(review.displayDate)}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < (review.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {renderPagination()}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ReviewWriteForm({ onClose, onSuccess, productId, productName }: {
  onClose: () => void;
  onSuccess: () => void;
  productId?: string;
  productName?: string;
}) {
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [authorName, setAuthorName] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      toast({ title: "최대 5장까지 첨부 가능합니다.", variant: "destructive" });
      return;
    }
    const newImages = [...images, ...files].slice(0, 5);
    setImages(newImages);

    const newPreviews = newImages.map(f => URL.createObjectURL(f));
    setPreviews(newPreviews);
  };

  const removeImage = (idx: number) => {
    const newImages = images.filter((_, i) => i !== idx);
    setImages(newImages);
    setPreviews(newImages.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!authorName.trim()) {
      toast({ title: "작성자 이름을 입력해주세요.", variant: "destructive" });
      return;
    }
    if (!content.trim()) {
      toast({ title: "후기 내용을 입력해주세요.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("authorName", authorName);
      formData.append("content", content);
      formData.append("rating", String(rating));
      if (productId) formData.append("productId", productId);
      if (productName) formData.append("productName", productName);
      images.forEach(f => formData.append("images", f));

      const res = await fetch("/api/reviews", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        toast({ title: "후기가 등록되었습니다." });
        onSuccess();
      } else {
        toast({ title: data.error || "등록 실패", variant: "destructive" });
      }
    } catch {
      toast({ title: "후기 등록 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 mb-4 bg-gray-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold">구매후기 작성</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-4 h-4" />
        </button>
      </div>

      {productName && (
        <p className="text-xs text-gray-500 mb-3 bg-white px-3 py-2 rounded border">상품: {productName}</p>
      )}

      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-gray-500 mr-2">평점</span>
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} onClick={() => setRating(i)} data-testid={`btn-star-${i}`}>
            <Star className={`w-5 h-5 ${i <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
          </button>
        ))}
      </div>

      <Input
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="작성자명"
        className="mb-2 h-9 text-sm"
        data-testid="input-review-author"
      />

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="구매 후기를 작성해주세요"
        rows={3}
        className="mb-2 text-sm"
        data-testid="input-review-content"
      />

      <div className="flex items-center gap-2 mb-3">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded text-xs text-gray-600 hover:bg-gray-100"
          data-testid="btn-attach-photo"
        >
          <Camera className="w-3.5 h-3.5" />
          사진 첨부 ({images.length}/5)
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        {previews.length > 0 && (
          <div className="flex gap-1.5">
            {previews.map((src, i) => (
              <div key={i} className="relative w-12 h-12 rounded overflow-hidden border">
                <img src={src} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(i)}
                  className="absolute top-0 right-0 w-4 h-4 bg-black/60 text-white flex items-center justify-center text-[10px]"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onClose} className="text-xs h-8">취소</Button>
        <Button size="sm" onClick={handleSubmit} disabled={submitting} className="bg-black hover:bg-gray-800 text-xs h-8" data-testid="btn-submit-review">
          {submitting ? "등록 중..." : "후기 등록"}
        </Button>
      </div>
    </div>
  );
}

export { ReviewWriteForm };
