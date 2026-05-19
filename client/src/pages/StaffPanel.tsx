import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Star, Plus, Pencil, Trash2, Check, X, Upload, LogOut, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const STORAGE_KEY = "staff_token";
const STORAGE_NAME_KEY = "staff_name";

type Review = {
  id: string;
  authorName: string;
  productName?: string | null;
  rating: number;
  title?: string | null;
  content?: string | null;
  imageUrl?: string | null;
  isVisible: boolean;
  displayDate?: string | null;
};

type FormData = {
  authorName: string;
  productName: string;
  rating: number;
  title: string;
  content: string;
  imageUrl: string;
  isVisible: boolean;
  displayDate: string;
};

const defaultForm = (): FormData => ({
  authorName: "",
  productName: "",
  rating: 5,
  title: "",
  content: "",
  imageUrl: "",
  isVisible: true,
  displayDate: new Date().toISOString().slice(0, 16),
});

export default function StaffPanel() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // Auth
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(STORAGE_KEY));
  const [staffName, setStaffName] = useState<string>(() => localStorage.getItem(STORAGE_NAME_KEY) || "직원");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Reviews
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  // Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(defaultForm());
  const [uploadingImage, setUploadingImage] = useState(false);

  const fetchWithAuth = useCallback(
    (url: string, options: RequestInit = {}) => {
      return fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          ...(options.headers || {}),
        },
      });
    },
    [token]
  );

  const fetchReviews = useCallback(
    async (p = page) => {
      if (!token) return;
      setLoading(true);
      try {
        const res = await fetchWithAuth(`/api/admin/reviews?page=${p}&limit=50`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.data);
          const total = data.total ?? data.data.length;
          setPagination({ total, totalPages: Math.max(1, Math.ceil(total / 50)) });
        }
      } catch {
        toast({ title: "오류", description: "후기를 불러오지 못했습니다.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    },
    [token, page, fetchWithAuth, toast]
  );

  useEffect(() => {
    if (token) fetchReviews(1);
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  // Verify token on mount
  useEffect(() => {
    if (!token) return;
    fetch("/api/admin/verify", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        if (!d.valid) {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(STORAGE_NAME_KEY);
          setToken(null);
        } else {
          setStaffName(d.name || "직원");
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (data.success) {
        // Only allow review_admin or super_admin
        if (data.role !== "review_admin" && data.role !== "super_admin") {
          setLoginError("접근 권한이 없습니다.");
          return;
        }
        localStorage.setItem(STORAGE_KEY, data.token);
        localStorage.setItem(STORAGE_NAME_KEY, data.name || "직원");
        setToken(data.token);
        setStaffName(data.name || "직원");
      } else {
        setLoginError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch {
      setLoginError("서버에 연결할 수 없습니다.");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_NAME_KEY);
    setToken(null);
    setReviews([]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "오류", description: "파일 크기는 5MB 이하여야 합니다.", variant: "destructive" });
      return;
    }
    setUploadingImage(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/upload/review-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.url) {
        setFormData((prev) => ({ ...prev, imageUrl: data.url }));
        toast({ title: "완료", description: "이미지가 업로드되었습니다." });
      } else {
        toast({ title: "오류", description: "이미지 업로드에 실패했습니다.", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "이미지 업로드 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetchWithAuth("/api/reviews", {
        method: "POST",
        body: JSON.stringify({ ...formData, displayDate: new Date(formData.displayDate).toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "후기가 추가되었습니다." });
        setShowAddForm(false);
        setFormData(defaultForm());
        fetchReviews(page);
      } else {
        toast({ title: "오류", description: data.error || "후기 추가 실패", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "후기 추가 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/reviews/${id}`, {
        method: "PUT",
        body: JSON.stringify({ ...formData, displayDate: new Date(formData.displayDate).toISOString() }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "후기가 수정되었습니다." });
        setEditingId(null);
        fetchReviews(page);
      } else {
        toast({ title: "오류", description: data.error || "후기 수정 실패", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "후기 수정 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 후기를 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "후기가 삭제되었습니다." });
        fetchReviews(page);
      } else {
        toast({ title: "오류", description: data.error || "후기 삭제 실패", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "후기 삭제 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const startEdit = (review: Review) => {
    setEditingId(review.id);
    setFormData({
      authorName: review.authorName || "",
      productName: review.productName || "",
      rating: review.rating || 5,
      title: review.title || "",
      content: review.content || "",
      imageUrl: review.imageUrl || "",
      isVisible: review.isVisible ?? true,
      displayDate: review.displayDate
        ? new Date(review.displayDate).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    });
  };

  // ─── Login Screen ────────────────────────────────────────────────────────────
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white tracking-tight">직원 로그인</h1>
            <p className="text-gray-400 text-sm mt-1">후기 관리 전용 패널</p>
          </div>
          <form onSubmit={handleLogin} className="bg-gray-900 rounded-2xl p-6 space-y-4 border border-gray-800">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">아이디</label>
              <input
                data-testid="input-staff-login-id"
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="아이디 입력"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">비밀번호</label>
              <input
                data-testid="input-staff-login-pw"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="비밀번호 입력"
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
              />
            </div>
            {loginError && (
              <p className="text-red-400 text-sm">{loginError}</p>
            )}
            <button
              data-testid="button-staff-login"
              type="submit"
              disabled={loginLoading}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-50 text-sm"
            >
              {loginLoading ? "로그인 중..." : "로그인"}
            </button>
          </form>
          <p
            className="text-center text-gray-600 text-xs mt-4 cursor-pointer hover:text-gray-400"
            onClick={() => setLocation("/")}
          >
            홈으로 돌아가기
          </p>
        </div>
      </div>
    );
  }

  // ─── Staff Panel ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <span className="font-semibold text-sm">후기 관리</span>
            <span className="text-gray-500 text-xs hidden sm:inline">|</span>
            <span className="text-gray-400 text-xs hidden sm:inline">{staffName}</span>
          </div>
          <button
            data-testid="button-staff-logout"
            onClick={handleLogout}
            className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            로그아웃
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">후기 목록</h2>
            <p className="text-gray-400 text-sm">총 {pagination.total.toLocaleString()}개</p>
          </div>
          <div className="flex gap-2">
            <button
              data-testid="button-refresh-reviews"
              onClick={() => fetchReviews(page)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs text-gray-300 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              새로고침
            </button>
            <button
              data-testid="button-add-review"
              onClick={() => {
                setShowAddForm(true);
                setFormData(defaultForm());
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 rounded-lg text-xs text-black font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              후기 추가
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <ReviewForm
            formData={formData}
            setFormData={setFormData}
            uploadingImage={uploadingImage}
            onImageUpload={handleImageUpload}
            onSave={handleCreate}
            onCancel={() => setShowAddForm(false)}
            title="새 후기 추가"
          />
        )}

        {/* Table */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin w-6 h-6 border-2 border-gray-700 border-t-yellow-400 rounded-full" />
            </div>
          ) : reviews.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Star className="w-10 h-10 mx-auto mb-3 text-gray-700" />
              <p className="text-sm">등록된 후기가 없습니다</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-xs">
                    <th className="px-4 py-3 text-left font-medium">작성자</th>
                    <th className="px-4 py-3 text-left font-medium">제목 / 내용</th>
                    <th className="px-4 py-3 text-left font-medium w-20">별점</th>
                    <th className="px-4 py-3 text-left font-medium w-28">작성일</th>
                    <th className="px-4 py-3 text-left font-medium w-16">공개</th>
                    <th className="px-4 py-3 text-right font-medium w-24">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {reviews.map((review) =>
                    editingId === review.id ? (
                      <tr key={review.id} className="bg-gray-800/60">
                        <td className="px-4 py-3" colSpan={6}>
                          <ReviewForm
                            formData={formData}
                            setFormData={setFormData}
                            uploadingImage={uploadingImage}
                            onImageUpload={handleImageUpload}
                            onSave={() => handleUpdate(review.id)}
                            onCancel={() => setEditingId(null)}
                            title="후기 수정"
                            compact
                          />
                        </td>
                      </tr>
                    ) : (
                      <tr key={review.id} className="hover:bg-gray-800/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-white">{review.authorName}</td>
                        <td className="px-4 py-3 max-w-xs">
                          {review.title && (
                            <p className="font-medium text-white text-xs mb-0.5">{review.title}</p>
                          )}
                          <p className="text-gray-400 text-xs line-clamp-2">{review.content}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-0.5">
                            {[...Array(review.rating || 5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {review.displayDate
                            ? new Date(review.displayDate).toLocaleDateString("ko-KR")
                            : "-"}
                        </td>
                        <td className="px-4 py-3">
                          {review.isVisible ? (
                            <span className="text-green-400 text-xs">공개</span>
                          ) : (
                            <span className="text-gray-600 text-xs">비공개</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            data-testid={`button-edit-review-${review.id}`}
                            onClick={() => startEdit(review)}
                            className="p-1.5 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors mr-1"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            data-testid={`button-delete-review-${review.id}`}
                            onClick={() => handleDelete(review.id)}
                            className="p-1.5 hover:bg-red-900/40 rounded text-gray-400 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                const p = page - 1;
                setPage(p);
                fetchReviews(p);
              }}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400">
              {page} / {pagination.totalPages} 페이지
            </span>
            <button
              onClick={() => {
                const p = page + 1;
                setPage(p);
                fetchReviews(p);
              }}
              disabled={page >= pagination.totalPages}
              className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Shared Form Component ────────────────────────────────────────────────────
function ReviewForm({
  formData,
  setFormData,
  uploadingImage,
  onImageUpload,
  onSave,
  onCancel,
  title,
  compact = false,
}: {
  formData: FormData;
  setFormData: (f: FormData) => void;
  uploadingImage: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSave: () => void;
  onCancel: () => void;
  title: string;
  compact?: boolean;
}) {
  const set = (key: keyof FormData, val: string | number | boolean) =>
    setFormData({ ...formData, [key]: val });

  return (
    <div className={`bg-gray-800 rounded-xl p-5 border border-gray-700 ${compact ? "" : ""}`}>
      <h3 className="font-semibold text-white mb-4">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">작성자 이름</label>
          <input
            data-testid="input-review-author"
            value={formData.authorName}
            onChange={(e) => set("authorName", e.target.value)}
            placeholder="홍길동"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">상품명 (선택)</label>
          <input
            data-testid="input-review-product"
            value={formData.productName}
            onChange={(e) => set("productName", e.target.value)}
            placeholder="루이비통 가방"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">별점</label>
          <select
            data-testid="select-review-rating"
            value={formData.rating}
            onChange={(e) => set("rating", Number(e.target.value))}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500 text-sm"
          >
            <option value={5}>5점 ★★★★★</option>
            <option value={4}>4점 ★★★★</option>
            <option value={3}>3점 ★★★</option>
            <option value={2}>2점 ★★</option>
            <option value={1}>1점 ★</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">작성일 (표시용)</label>
          <input
            data-testid="input-review-date"
            type="datetime-local"
            value={formData.displayDate}
            onChange={(e) => set("displayDate", e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">제목</label>
          <input
            data-testid="input-review-title"
            value={formData.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="후기 제목"
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">내용</label>
          <textarea
            data-testid="input-review-content"
            value={formData.content}
            onChange={(e) => set("content", e.target.value)}
            placeholder="후기 내용을 입력하세요"
            rows={4}
            className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm resize-y"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-400 mb-1">이미지</label>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg cursor-pointer transition-colors text-xs text-gray-300">
                <Upload className="w-3.5 h-3.5" />
                {uploadingImage ? "업로드 중..." : "파일 선택"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={onImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-500">또는 URL 직접 입력</span>
            </div>
            <input
              data-testid="input-review-image"
              value={formData.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
              placeholder="https://..."
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 text-sm"
            />
            {formData.imageUrl && (
              <img
                src={formData.imageUrl}
                alt="미리보기"
                className="max-w-[160px] max-h-[120px] object-cover rounded border border-gray-600"
                onError={(e) => (e.currentTarget.style.display = "none")}
              />
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            data-testid="input-review-visible"
            type="checkbox"
            checked={formData.isVisible}
            onChange={(e) => set("isVisible", e.target.checked)}
            className="w-4 h-4 accent-yellow-400"
            id="review-visible"
          />
          <label htmlFor="review-visible" className="text-sm text-gray-300 cursor-pointer">
            공개
          </label>
        </div>
      </div>
      <div className="flex gap-2 mt-4">
        <button
          data-testid="button-save-review"
          onClick={onSave}
          className="flex items-center gap-1.5 px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black text-sm font-semibold rounded-lg transition-colors"
        >
          <Check className="w-4 h-4" />
          저장
        </button>
        <button
          data-testid="button-cancel-review"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm rounded-lg transition-colors"
        >
          <X className="w-4 h-4" />
          취소
        </button>
      </div>
    </div>
  );
}
