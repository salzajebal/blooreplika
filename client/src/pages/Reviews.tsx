import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, ChevronRight, ChevronLeft, Camera, Image, Pencil, X } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { useState, useRef } from "react";
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
  return now.getTime() - date.getTime() < 7 * 24 * 60 * 60 * 1000;
}

export default function Reviews() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [photoOnly, setPhotoOnly] = useState(false);
  const [showWriteForm, setShowWriteForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: reviewsData, isLoading } = useQuery<{ reviews: Review[]; total: number }>({
    queryKey: ["reviews", currentPage, searchQuery, photoOnly],
    queryFn: async () => {
      const offset = (currentPage - 1) * REVIEWS_PER_PAGE;
      let url = `/api/reviews?limit=${REVIEWS_PER_PAGE}&offset=${offset}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      if (photoOnly) url += `&photoOnly=true`;
      const res = await fetch(url);
      const data = await res.json();
      return { reviews: data.success ? data.data : [], total: data.total || 0 };
    },
  });

  const reviews = reviewsData?.reviews || [];
  const totalReviews = reviewsData?.total || 0;
  const totalPages = Math.ceil(totalReviews / REVIEWS_PER_PAGE);

  const handleSearch = () => { setSearchQuery(searchInput); setCurrentPage(1); };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toProxyUrl = (url: string): string => {
    if (!url) return url;
    if (url.includes("cdn.imweb.me") || (url.includes("bloostore.co.kr") && !url.startsWith("/"))) {
      return `/api/bloostore-image-proxy?url=${encodeURIComponent(url)}`;
    }
    return url;
  };

  const getThumbImage = (review: Review): string | null => {
    if (review.imageUrls && review.imageUrls.length > 0) return toProxyUrl(review.imageUrls[0]);
    if (review.imageUrl) return toProxyUrl(review.imageUrl);
    if (review.productImageUrl) return review.productImageUrl;
    return null;
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return (
      <div className="flex items-center justify-center gap-1 mt-6 flex-wrap">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded disabled:opacity-30 hover:border-gray-400"
          data-testid="button-prev-page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        {pages.map((page, idx) =>
          page === "..." ? (
            <span key={`e-${idx}`} className="px-2 text-gray-300">...</span>
          ) : (
            <button
              key={page}
              onClick={() => handlePageChange(page as number)}
              className={`w-8 h-8 text-sm rounded transition-colors ${
                currentPage === page ? "bg-black text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
              data-testid={`button-page-${page}`}
            >
              {page}
            </button>
          )
        )}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded disabled:opacity-30 hover:border-gray-400"
          data-testid="button-next-page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <Header />
      <main className="flex-1 max-w-[640px] w-full mx-auto pb-24 md:pb-8 bg-white">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-base font-bold text-gray-900">실제 구매후기</h1>
              <p className="text-xs text-gray-400 mt-0.5">총 {totalReviews.toLocaleString()}건의 후기</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setPhotoOnly(!photoOnly); setCurrentPage(1); }}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs border rounded-full transition-colors ${
                  photoOnly ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
                data-testid="btn-photo-filter"
              >
                <Camera className="w-3 h-3" />
                포토리뷰
              </button>
              <button
                onClick={() => setShowWriteForm(!showWriteForm)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-full hover:border-gray-400 transition-colors"
                data-testid="btn-write-review-page"
              >
                <Pencil className="w-3 h-3" />
                후기 작성
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              placeholder="상품명, 후기 내용 검색"
              className="w-full pr-10 pl-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 placeholder-gray-300"
              data-testid="input-review-search"
            />
            <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Write form */}
        {showWriteForm && (
          <div className="px-4 py-4 border-b border-gray-100">
            <ReviewWriteForm
              onClose={() => setShowWriteForm(false)}
              onSuccess={() => {
                setShowWriteForm(false);
                queryClient.invalidateQueries({ queryKey: ["reviews"] });
              }}
            />
          </div>
        )}

        {/* Review list */}
        <div className="px-4 bg-white">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0" />
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-3 bg-gray-100 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                    <div className="h-3 bg-gray-100 rounded w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16">
              <Star className="w-12 h-12 mx-auto mb-3 text-gray-200" />
              <p className="text-sm text-gray-400">등록된 구매후기가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {reviews.map((review) => {
                const thumbUrl = getThumbImage(review);
                const reviewIsNew = isNewReview(review.displayDate);
                return (
                  <div key={review.id} className="flex gap-3 py-4" data-testid={`review-item-${review.id}`}>
                    {/* Thumbnail */}
                    <div className="w-16 h-16 flex-shrink-0 overflow-hidden bg-gray-50 rounded-lg border border-gray-100">
                      {thumbUrl ? (
                        <img
                          src={
                            thumbUrl.startsWith("/uploads/") || thumbUrl.startsWith("/api/")
                              ? thumbUrl
                              : getProxiedImageUrl(thumbUrl, "thumb")
                          }
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Image className="w-6 h-6 text-gray-200" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {review.productName && (
                        <p className="text-xs text-[#FF6100] font-medium mb-0.5 line-clamp-1">
                          {review.productName}
                        </p>
                      )}
                      {review.title && (
                        <p className="text-sm font-semibold text-gray-800 mb-0.5">
                          {review.title}
                          {reviewIsNew && (
                            <span className="inline-block ml-1 text-[10px] bg-green-500 text-white px-1 py-0.5 rounded font-bold align-middle">N</span>
                          )}
                        </p>
                      )}
                      <p className="text-sm text-gray-600 leading-relaxed mb-1.5 whitespace-pre-line line-clamp-3">
                        {review.content}
                        {!review.title && reviewIsNew && (
                          <span className="inline-block ml-1 text-[10px] bg-green-500 text-white px-1 py-0.5 rounded font-bold align-middle">N</span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="font-medium">{maskName(review.authorName)}</span>
                        <span>{timeAgo(review.displayDate)}</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < (review.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
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
          <div className="pb-6" />
        </div>
      </main>
      <div className="max-w-[640px] w-full mx-auto">

      </div>
    </div>
  );
}

export function ReviewWriteForm({
  onClose,
  onSuccess,
  productId,
  productName,
}: {
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
    setPreviews(newImages.map((f) => URL.createObjectURL(f)));
  };

  const removeImage = (idx: number) => {
    const newImages = images.filter((_, i) => i !== idx);
    setImages(newImages);
    setPreviews(newImages.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async () => {
    if (!authorName.trim()) { toast({ title: "작성자 이름을 입력해주세요.", variant: "destructive" }); return; }
    if (!content.trim()) { toast({ title: "후기 내용을 입력해주세요.", variant: "destructive" }); return; }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("authorName", authorName);
      formData.append("content", content);
      formData.append("rating", String(rating));
      if (productId) formData.append("productId", productId);
      if (productName) formData.append("productName", productName);
      images.forEach((f) => formData.append("images", f));
      const res = await fetch("/api/reviews", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) { toast({ title: "후기가 등록되었습니다." }); onSuccess(); }
      else toast({ title: data.error || "등록 실패", variant: "destructive" });
    } catch {
      toast({ title: "후기 등록 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-900">구매후기 작성</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
          <X className="w-4 h-4" />
        </button>
      </div>

      {productName && (
        <p className="text-xs text-gray-500 mb-3 bg-white px-3 py-2 rounded-lg border border-gray-100">
          상품: {productName}
        </p>
      )}

      <div className="flex items-center gap-1 mb-3">
        <span className="text-xs text-gray-500 mr-2">평점</span>
        {[1, 2, 3, 4, 5].map((i) => (
          <button key={i} onClick={() => setRating(i)} data-testid={`btn-star-${i}`}>
            <Star className={`w-5 h-5 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
          </button>
        ))}
      </div>

      <input
        value={authorName}
        onChange={(e) => setAuthorName(e.target.value)}
        placeholder="작성자명"
        className="w-full mb-2 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 placeholder-gray-300"
        data-testid="input-review-author"
      />
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="구매 후기를 작성해주세요"
        rows={3}
        className="w-full mb-2 px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:border-gray-400 placeholder-gray-300 resize-none"
        data-testid="input-review-content"
      />

      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 text-xs text-gray-500 rounded-lg hover:border-gray-400 transition-colors"
          data-testid="btn-attach-photo"
        >
          <Camera className="w-3.5 h-3.5" />
          사진 첨부 ({images.length}/5)
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
        {previews.map((src, i) => (
          <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              onClick={() => removeImage(i)}
              className="absolute top-0 right-0 w-4 h-4 bg-black/60 text-white flex items-center justify-center text-[10px]"
            >×</button>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onClose}
          className="px-4 py-2 text-xs text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="px-4 py-2 text-xs bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
          data-testid="btn-submit-review"
        >
          {submitting ? "등록 중..." : "후기 등록"}
        </button>
      </div>
    </div>
  );
}
