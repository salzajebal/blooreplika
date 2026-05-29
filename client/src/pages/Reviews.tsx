import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Star, Camera, Pencil, X, Search, Image } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Link } from "wouter";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { DEFAULT_IMAGE } from "@/lib/imageProxy";

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

const REVIEWS_PER_PAGE = 24;

const SIDEBAR_NAV = [
  { label: "실시간 검수 사진 ✓", path: "/inspection" },
  { label: "남성", path: "/httpstheblooshop1496458051" },
  { label: "여성", path: "/497" },
  { label: "시계관", path: "/products/watches" },
  { label: "기획전", path: "/sale" },
  {
    label: "커뮤니티",
    isSection: true,
    children: [
      { label: "리뷰&후기", path: "/reviews" },
      { label: "공지사항", path: "/notices" },
      { label: "자주 묻는 질문", path: "/faq" },
      { label: "주문/결제", path: "/faq" },
      { label: "퀄리티/공장", path: "/support" },
      { label: "배송/검수", path: "/inspection" },
      { label: "교환/환불", path: "/support" },
      { label: "회원/제품 문의", path: "/support" },
    ],
  },
  { label: "오늘출발", path: "/sameday" },
  { label: "썸머", path: "/summer" },
];

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

function getReviewImageUrl(url: string | null | undefined): string {
  if (!url) return DEFAULT_IMAGE;
  if (url.startsWith("/api/") || url.startsWith("/uploads/") || url.startsWith("/objects/")) return url;
  if (url.includes("imweb.me") || url.includes("cdn.imweb")) {
    return `/api/bloostore-image-proxy?url=${encodeURIComponent(url)}`;
  }
  return url;
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

  const pageWindow = () => {
    const size = 10;
    const half = Math.floor(size / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + size - 1);
    if (end - start + 1 < size) start = Math.max(1, end - size + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex-1 flex w-full max-w-[1240px] mx-auto">

        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:block w-[200px] flex-shrink-0 border-r border-gray-100 bg-white">
          <nav className="py-6 sticky top-0">
            <ul>
              {SIDEBAR_NAV.map((item, i) => {
                if ("isSection" in item && item.isSection) {
                  return (
                    <li key={i} className="mb-1">
                      <div className="px-5 py-2 text-[13px] font-bold text-gray-900 tracking-tight">
                        {item.label}
                      </div>
                      <ul>
                        {item.children?.map((child, j) => (
                          <li key={j}>
                            <Link
                              href={child.path}
                              className={`block pl-8 pr-4 py-1.5 text-[13px] transition-colors ${
                                child.path === "/reviews"
                                  ? "text-gray-900 font-semibold"
                                  : "text-gray-500 hover:text-gray-900"
                              }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                }
                const navItem = item as { label: string; path: string };
                return (
                  <li key={i}>
                    <Link
                      href={navItem.path}
                      className="block px-5 py-2.5 text-[13px] text-gray-700 hover:text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      {navItem.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 pb-16">

          {/* ── BLOO STYLE Review Event Banner ── */}
          <div
            className="w-full relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #FF5C2B 0%, #E03A0A 100%)" }}
          >
            <div className="max-w-xl mx-auto px-6 py-10 text-center">
              <div className="inline-block border border-white/50 px-4 py-1 text-white text-[10px] font-bold tracking-[0.2em] mb-4 uppercase">
                BLOO STYLE
              </div>
              <p className="text-white text-[17px] font-light tracking-wide mb-0.5">Daily &amp; Weekly</p>
              <p className="text-white text-[30px] font-black tracking-wider mb-6 leading-none">REVIEW EVENT</p>

              <div className="inline-block bg-[#111] rounded-2xl px-10 py-5 mb-5">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="bg-[#4ADE80] text-black text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-black rounded-full inline-block" />
                    580
                  </span>
                </div>
                <p className="text-gray-400 text-[10px] tracking-[0.2em] uppercase mb-1">BLOO POINT</p>
                <p className="text-white text-[42px] font-black leading-none tracking-tight">300,000</p>
                <div className="flex items-center justify-center gap-1 mt-2">
                  <span className="text-red-400 text-[13px]">♥</span>
                  <span className="text-white text-[11px] font-medium">12587</span>
                </div>
              </div>

              <p className="text-white/85 text-[13px] mb-0.5">포토리뷰와 솔직한 내용을 담은 5명의 회원에게</p>
              <p className="text-white text-[15px] font-bold mb-4">쇼핑 지원금을 드립니다!</p>
              <p className="text-white/50 text-[10px]">*베스트 리뷰 선정으로 지급된 적립금 사용 기간은 1년입니다</p>
            </div>
          </div>

          {/* ── Controls Bar ── */}
          <div className="px-4 lg:px-6 pt-5 pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-[14px] font-bold text-gray-900">실제 구매후기</h1>
                <p className="text-[11px] text-gray-400 mt-0.5">총 {totalReviews.toLocaleString()}건의 후기</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setPhotoOnly(!photoOnly); setCurrentPage(1); }}
                  className={`flex items-center gap-1 px-3 py-1.5 text-[11px] border transition-colors ${
                    photoOnly ? "bg-black text-white border-black" : "border-gray-200 text-gray-600 hover:border-gray-400"
                  }`}
                  data-testid="btn-photo-filter"
                >
                  <Camera className="w-3 h-3" />
                  포토리뷰
                </button>
                <button
                  onClick={() => setShowWriteForm(!showWriteForm)}
                  className="flex items-center gap-1 px-3 py-1.5 text-[11px] border border-gray-200 text-gray-600 hover:border-gray-400 transition-colors"
                  data-testid="btn-write-review-page"
                >
                  <Pencil className="w-3 h-3" />
                  후기 작성
                </button>
              </div>
            </div>

            <div className="relative max-w-sm">
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                placeholder="상품명, 후기 내용 검색"
                className="w-full pr-9 pl-4 py-2 text-[12px] bg-gray-50 border border-gray-200 focus:outline-none focus:border-gray-400 placeholder-gray-300"
                data-testid="input-review-search"
              />
              <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Write Form */}
          {showWriteForm && (
            <div className="px-4 lg:px-6 py-4 border-b border-gray-100">
              <ReviewWriteForm
                onClose={() => setShowWriteForm(false)}
                onSuccess={() => {
                  setShowWriteForm(false);
                  queryClient.invalidateQueries({ queryKey: ["reviews"] });
                }}
              />
            </div>
          )}

          {/* ── Review Card Grid ── */}
          <div className="px-4 lg:px-6 pt-5">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-100 aspect-square" />
                    <div className="h-2.5 bg-gray-100 rounded w-3/4 mt-2 mb-1" />
                    <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              <div className="text-center py-20">
                <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
                <p className="text-[13px] text-gray-400">등록된 구매후기가 없습니다.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
                {reviews.map((review) => {
                  const thumbUrl = getReviewImageUrl(review.imageUrl);
                  const isNew = isNewReview(review.displayDate);
                  return (
                    <div key={review.id} className="group" data-testid={`review-card-${review.id}`}>

                      {/* ── card-thumbnail-wrap style ── */}
                      <div
                        className="relative aspect-square bg-gray-100 overflow-hidden"
                        style={{
                          backgroundImage: `url(${thumbUrl})`,
                          backgroundSize: "cover",
                          backgroundPosition: "50% 50%",
                        }}
                      >
                        {/* hidden img for error handling */}
                        <img
                          src={thumbUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover opacity-0 pointer-events-none"
                          onError={(e) => {
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) parent.style.backgroundImage = `url(${DEFAULT_IMAGE})`;
                          }}
                        />
                        {!review.imageUrl && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image className="w-8 h-8 text-gray-300" />
                          </div>
                        )}
                        {isNew && (
                          <span
                            className="absolute top-2 left-2 text-white text-[9px] font-black px-1.5 py-0.5 z-10"
                            style={{ backgroundColor: "#FF5C2B" }}
                          >
                            N
                          </span>
                        )}
                      </div>

                      {/* ── card-body: title ── */}
                      <div className="mt-2">
                        <p className="text-[12px] text-gray-800 leading-snug line-clamp-2">
                          {review.title || review.content}
                        </p>
                      </div>

                      {/* ── card-summary: author ── */}
                      <div className="mt-1.5 flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          <span className="text-[7px] text-gray-400">👤</span>
                        </div>
                        <span className="text-[11px] text-gray-600">{maskName(review.authorName)}</span>
                        <span className="text-[10px] text-gray-300 ml-auto">{timeAgo(review.displayDate)}</span>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5 mt-1">
                        {[...Array(5)].map((_, si) => (
                          <Star
                            key={si}
                            className={`w-2.5 h-2.5 ${si < (review.rating || 5) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`}
                          />
                        ))}
                      </div>

                      {/* ── item-summary: linked product ── */}
                      {review.productName && review.productId && (
                        <Link
                          href={`/product/${review.productId}`}
                          className="flex items-center gap-1.5 mt-2 group/prod"
                        >
                          {review.productImageUrl && (
                            <img
                              src={getReviewImageUrl(review.productImageUrl)}
                              alt=""
                              className="w-8 h-8 object-cover flex-shrink-0"
                              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                          )}
                          <span className="text-[11px] text-gray-500 line-clamp-1 group-hover/prod:underline">
                            {review.productName}
                          </span>
                        </Link>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-1 mt-10 mb-6 flex-wrap">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 text-[11px] text-gray-500 disabled:opacity-30 hover:border-gray-400 transition-colors"
                >
                  «
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 text-[11px] text-gray-500 disabled:opacity-30 hover:border-gray-400 transition-colors"
                >
                  ‹
                </button>
                {pageWindow().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center border text-[12px] transition-colors ${
                      currentPage === pageNum
                        ? "bg-black text-white border-black"
                        : "border-gray-200 text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 text-[11px] text-gray-500 disabled:opacity-30 hover:border-gray-400 transition-colors"
                >
                  ›
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="w-8 h-8 flex items-center justify-center border border-gray-200 text-[11px] text-gray-500 disabled:opacity-30 hover:border-gray-400 transition-colors"
                >
                  »
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════
// ReviewWriteForm — shared by Reviews page and ProductDetail page
// ══════════════════════════════════════════════════════════════════
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
