import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { 
  Plus, Pencil, Trash2, Check, X, RefreshCw, Database, 
  LogOut, Users, Package, BarChart3, Eye, EyeOff,
  Lock, User, Mail, Phone, CheckCircle, XCircle,
  Star, FileText, Bell, Calendar, Tag,
  Clock, Snowflake, Unlock, Settings, Link2, Upload,
  MessageCircle, Send, Circle, Volume2, Wallet, Download, Loader2, Search, Shield, Image
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, Member, Review, Notice, ChatConversation, ChatMessage, Order, CouponPayment } from "@shared/schema";
import { ShoppingCart } from "lucide-react";
import { useRef, useCallback } from "react";

const playNotificationSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.4);
  } catch (e) {
    console.log("Audio notification not supported");
  }
};

const CATEGORY_OPTIONS = [
  { id: "new-arrivals", name: "신상품" },
  { id: "brand", name: "브랜드" },
  { id: "gender", name: "성별" },
  { id: "clothing", name: "의류" },
  { id: "bags", name: "가방" },
  { id: "wallets", name: "지갑" },
  { id: "shoes", name: "신발" },
  { id: "watches", name: "시계" },
  { id: "golf", name: "골프" },
  { id: "jewelry", name: "쥬얼리/잡화" },
  { id: "sameday", name: "당일배송" },
  { id: "sale", name: "할인상품" },
  { id: "best", name: "베스트상품" },
];

interface AdminStats {
  totalProducts: number;
  totalMembers: number;
  totalCategories: number;
  productsByCategory: { id: string; name: string; count: number }[];
}


export default function Admin() {
  const { toast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [adminRole, setAdminRole] = useState<string>("super_admin");
  const [adminName, setAdminName] = useState<string>("");
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "brands" | "members" | "orders" | "couponPayments" | "reviews" | "notices" | "chat" | "settings" | "staff">("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [visitorStats, setVisitorStats] = useState<{ realtime: number; today: number; pageViews: number; recentPages: { page: string; count: number }[] } | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditProductModal, setShowEditProductModal] = useState(false);
  const [productFilter, setProductFilter] = useState("all");
  const [productSearch, setProductSearch] = useState("");
  const [productPage, setProductPage] = useState(1);
  const [productPagination, setProductPagination] = useState({ total: 0, totalPages: 1 });
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    categoryId: "new-arrivals",
    brandId: "",
    price: "",
    originalPrice: "",
    stock: "",
    isBest: false,
    isNew: false,
    description: "",
    imageUrl: "",
    imageUrls: [] as string[],
  });

  const [memberFormData, setMemberFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    address: "",
    bank: "",
    accountNumber: "",
    isActive: true,
    isAdmin: false,
  });
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewPagination, setReviewPagination] = useState({ total: 0, totalPages: 1 });
  const [reviewFormData, setReviewFormData] = useState({
    authorName: "",
    productName: "",
    rating: 5,
    title: "",
    content: "",
    imageUrl: "",
    isVisible: true,
    displayDate: new Date().toISOString().slice(0, 16),
  });
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [showAddReviewForm, setShowAddReviewForm] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [notices, setNotices] = useState<Notice[]>([]);
  const [noticeFormData, setNoticeFormData] = useState({
    title: "",
    content: "",
    category: "general",
    isPinned: false,
    isVisible: true,
    displayDate: new Date().toISOString().slice(0, 16),
    viewCount: 0,
  });
  const [editingNoticeId, setEditingNoticeId] = useState<string | null>(null);
  const [showAddNoticeForm, setShowAddNoticeForm] = useState(false);

  const [adjustAmount, setAdjustAmount] = useState("");
  const [freezeReason, setFreezeReason] = useState("");

  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [couponPayments, setCouponPayments] = useState<CouponPayment[]>([]);
  const [couponPaymentsLoading, setCouponPaymentsLoading] = useState(false);
  
  const [brands, setBrands] = useState<{id: string; name: string; slug: string; logoUrl?: string; description?: string; isActive?: boolean}[]>([]);
  const [brandFormData, setBrandFormData] = useState({ name: "", slug: "", logoUrl: "", description: "" });
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [showAddBrandForm, setShowAddBrandForm] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderFilter, setOrderFilter] = useState<"all" | "pending" | "confirmed" | "shipped" | "delivered" | "cancelled">("all");

  const [chatConversations, setChatConversations] = useState<ChatConversation[]>([]);
  const [chatNotification, setChatNotification] = useState<{show: boolean; memberName: string; message: string; conversationId: string} | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [chatSocket, setChatSocket] = useState<WebSocket | null>(null);
  const [isChatConnected, setIsChatConnected] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement>(null);
  const chatSocketRef = useRef<WebSocket | null>(null);
  const [selectedMemberForAction, setSelectedMemberForAction] = useState<string | null>(null);
  const [actionType, setActionType] = useState<"adjust" | "freeze" | null>(null);
  
  const [siteSettings, setSiteSettings] = useState<{
    kakaoTalkLink: string;
  }>({ kakaoTalkLink: "https://open.kakao.com/o/samplelink" });
  const [settingsLoading, setSettingsLoading] = useState(false);
  
  const [depositAccountSettings, setDepositAccountSettings] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
  });
  const [depositAccountLoading, setDepositAccountLoading] = useState(false);
  
  const [pixelSettings, setPixelSettings] = useState({
    facebookPixelId: "",
    facebookPixelEnabled: false,
    googleAnalyticsId: "",
    googleAnalyticsEnabled: false,
    kakaoPixelId: "",
    kakaoPixelEnabled: false,
  });
  const [pixelLoading, setPixelLoading] = useState(false);
  
  const [staffUsers, setStaffUsers] = useState<{id: string; username: string; name?: string | null; role?: string | null; createdAt?: Date | null}[]>([]);
  const [staffFormData, setStaffFormData] = useState({ username: "", password: "", name: "", staffRole: "review_admin" });
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [staffLoading, setStaffLoading] = useState(false);
  
  const [globalSalePercent, setGlobalSalePercent] = useState<number>(0);
  const [globalSaleLoading, setGlobalSaleLoading] = useState(false);

  const [productCount, setProductCount] = useState<number | null>(null);
  const [productCountLoading, setProductCountLoading] = useState(false);
  
  const [bagstyleProgress, setBagstyleProgress] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    message: string;
    category: string;
  }>({ status: 'idle', total: 0, current: 0, message: '', category: '' });
  const [clearBeforeBagstyle, setClearBeforeBagstyle] = useState(false);
  const bagstyleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [bagstyleBannerLoading, setBagstyleBannerLoading] = useState(false);

  const BAGSTYLE_CATEGORIES = [
    { localId: "new-arrivals", name: "신상품" },
    { localId: "brand", name: "브랜드" },
    { localId: "gender", name: "성별" },
    { localId: "clothing", name: "의류" },
    { localId: "bags", name: "가방" },
    { localId: "wallets", name: "지갑" },
    { localId: "shoes", name: "신발" },
    { localId: "watches", name: "시계" },
    { localId: "golf", name: "골프" },
    { localId: "jewelry", name: "쥬얼리/잡화" },
    { localId: "sameday", name: "당일배송" },
    { localId: "sale", name: "할인상품" },
    { localId: "best", name: "베스트상품" },
  ];
  const [selectedBagstyleCategories, setSelectedBagstyleCategories] = useState<string[]>([]);

  const [categoryDiscounts, setCategoryDiscounts] = useState<Record<string, number>>({});
  const [applyingCategoryDiscount, setApplyingCategoryDiscount] = useState<string | null>(null);

  const applyCategoryDiscount = async (categoryId: string, categoryName: string) => {
    const discountPercent = categoryDiscounts[categoryId] || 0;
    if (discountPercent <= 0 || discountPercent > 100) {
      toast({ title: "오류", description: "할인율은 1~100 사이의 숫자여야 합니다.", variant: "destructive" });
      return;
    }
    
    const countRes = await fetchWithAuth(`/api/admin/products/category/${categoryId}/count`);
    const countData = await countRes.json();
    const count = countData.count || 0;
    
    if (count === 0) {
      toast({ title: "알림", description: `${categoryName} 카테고리에 상품이 없습니다.` });
      return;
    }
    
    if (!confirm(`${categoryName} 카테고리 상품 ${count.toLocaleString()}개에 ${discountPercent}% 할인을 적용하시겠습니까?\n\n※ 주의: 이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }
    
    setApplyingCategoryDiscount(categoryId);
    try {
      const res = await fetchWithAuth(`/api/admin/products/category/${categoryId}/apply-discount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discountPercent }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ 
          title: "할인 적용 완료", 
          description: `${categoryName} 카테고리 ${data.affectedCount.toLocaleString()}개 상품에 ${discountPercent}% 할인이 적용되었습니다.` 
        });
        fetchProducts();
        setCategoryDiscounts(prev => ({ ...prev, [categoryId]: 0 }));
      } else {
        toast({ title: "오류", description: data.message || "할인 적용 중 오류가 발생했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "할인 적용 요청 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setApplyingCategoryDiscount(null);
    }
  };

  const fetchProductCount = async () => {
    setProductCountLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/products/count", { method: "GET" });
      const data = await res.json();
      if (data.success) setProductCount(data.count);
    } catch {} finally {
      setProductCountLoading(false);
    }
  };

  const clearAllProducts = async () => {
    if (!confirm("정말 모든 상품을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    try {
      const res = await fetchWithAuth("/api/admin/products/all", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "삭제 완료", description: data.message });
        fetchProductCount();
        fetchProducts();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "상품을 삭제할 수 없습니다.", variant: "destructive" });
    }
  };

  const fetchBagstyleProgress = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bagstyle/progress", { method: "GET" });
      const data = await res.json();
      if (data.success) {
        setBagstyleProgress({
          status: data.status,
          total: data.total,
          current: data.current,
          message: data.message,
          category: data.category || '',
        });
        if (data.status === 'completed' || data.status === 'error') {
          if (bagstyleIntervalRef.current) {
            clearInterval(bagstyleIntervalRef.current);
            bagstyleIntervalRef.current = null;
          }
          fetchProductCount();
          fetchProducts();
        }
      }
    } catch {}
  };

  const startBagstyleCrawl = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bagstyle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clearExisting: clearBeforeBagstyle,
          selectedCategories: selectedBagstyleCategories.length > 0 ? selectedBagstyleCategories : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const categoryText = selectedBagstyleCategories.length > 0
          ? `${selectedBagstyleCategories.length}개 카테고리`
          : "전체 카테고리";
        toast({ title: "bagstyle 크롤링 시작", description: `${categoryText} 크롤링이 시작되었습니다.` });
        setBagstyleProgress({ status: 'running', total: 0, current: 0, message: '시작 중...', category: '' });
        bagstyleIntervalRef.current = setInterval(fetchBagstyleProgress, 500);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "크롤링을 시작할 수 없습니다.", variant: "destructive" });
    }
  };

  const crawlBagstyleBanners = async () => {
    setBagstyleBannerLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bagstyle/banners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "배너/카테고리 크롤링 완료", description: data.message });
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "배너 크롤링에 실패했습니다.", variant: "destructive" });
    } finally {
      setBagstyleBannerLoading(false);
    }
  };

  const toggleBagstyleCategory = (localId: string) => {
    setSelectedBagstyleCategories(prev =>
      prev.includes(localId)
        ? prev.filter(id => id !== localId)
        : [...prev, localId]
    );
  };

  const selectAllBagstyleCategories = () => {
    setSelectedBagstyleCategories(BAGSTYLE_CATEGORIES.map(c => c.localId));
  };

  const deselectAllBagstyleCategories = () => {
    setSelectedBagstyleCategories([]);
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      verifyToken(token);
    } else {
      setCheckingAuth(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const res = await fetch("/api/admin/verify", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && (data.authenticated || data.valid)) {
        setAuthToken(token);
        setIsAuthenticated(true);
        setAdminRole(data.role || "super_admin");
        setAdminName(data.name || "관리자");
        // review_admin can only access reviews tab
        if (data.role === "review_admin") {
          setActiveTab("reviews");
        }
      } else {
        localStorage.removeItem("adminToken");
      }
    } catch (error) {
      localStorage.removeItem("adminToken");
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginLoading(true);
    
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      
      if (data.success) {
        localStorage.setItem("adminToken", data.token);
        setAuthToken(data.token);
        setIsAuthenticated(true);
        setAdminRole(data.role || "super_admin");
        setAdminName(data.name || "관리자");
        // review_admin can only access reviews tab
        if (data.role === "review_admin") {
          setActiveTab("reviews");
        }
        toast({ title: "로그인 성공", description: "관리자 페이지에 오신 것을 환영합니다." });
      } else {
        toast({ title: "로그인 실패", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "로그인 처리 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` }
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    localStorage.removeItem("adminToken");
    setAuthToken(null);
    setIsAuthenticated(false);
    toast({ title: "로그아웃", description: "로그아웃되었습니다." });
  };

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${authToken}`,
      }
    });
  };

  const fetchStats = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/stats");
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchVisitorStats = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/visitor-stats");
      const data = await res.json();
      if (data.success) {
        setVisitorStats(data.data);
      }
    } catch (error) {
      console.error("Error fetching visitor stats:", error);
    }
  };

  const fetchProducts = async (page = productPage, search = productSearch, category = productFilter) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "20");
      if (search) params.append("search", search);
      if (category && category !== "all") params.append("category", category);
      
      const res = await fetchWithAuth(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
        setProductPagination({ total: data.pagination.total, totalPages: data.pagination.totalPages });
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/members");
      const data = await res.json();
      if (data.success) {
        setMembers(data.data);
      }
    } catch (error) {
      console.error("Error fetching members:", error);
    }
  };

  const fetchStaffUsers = async () => {
    if (adminRole !== "super_admin") return;
    setStaffLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/staff");
      const data = await res.json();
      if (data.success) {
        setStaffUsers(data.data);
      }
    } catch (error) {
      console.error("Error fetching staff:", error);
    } finally {
      setStaffLoading(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchWithAuth("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffFormData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "직원 추가 완료", description: `${staffFormData.name || staffFormData.username}님이 추가되었습니다.` });
        setStaffFormData({ username: "", password: "", name: "", staffRole: "review_admin" });
        setShowAddStaffForm(false);
        fetchStaffUsers();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "직원 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteStaff = async (id: string) => {
    if (!confirm("정말로 이 직원을 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/admin/staff/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "삭제 완료", description: "직원이 삭제되었습니다." });
        fetchStaffUsers();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "직원 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const fetchBrands = async () => {
    try {
      const res = await fetch("/api/brands");
      const data = await res.json();
      if (data.success) {
        setBrands(data.data);
      }
    } catch (error) {
      console.error("Error fetching brands:", error);
    }
  };

  const handleCreateBrand = async () => {
    try {
      const res = await fetchWithAuth("/api/brands", {
        method: "POST",
        body: JSON.stringify(brandFormData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "브랜드가 추가되었습니다." });
        setShowAddBrandForm(false);
        setBrandFormData({ name: "", slug: "", logoUrl: "", description: "" });
        fetchBrands();
      } else {
        toast({ title: "오류", description: data.error || "브랜드 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "브랜드 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleUpdateBrand = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/brands/${id}`, {
        method: "PUT",
        body: JSON.stringify(brandFormData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "브랜드가 수정되었습니다." });
        setEditingBrandId(null);
        fetchBrands();
      } else {
        toast({ title: "오류", description: data.error || "브랜드 수정에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "브랜드 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteBrand = async (id: string) => {
    if (!confirm("정말로 이 브랜드를 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/brands/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "브랜드가 삭제되었습니다." });
        fetchBrands();
      } else {
        toast({ title: "오류", description: data.error || "브랜드 삭제에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "브랜드 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const startEditBrand = (brand: typeof brands[0]) => {
    setEditingBrandId(brand.id);
    setBrandFormData({
      name: brand.name,
      slug: brand.slug,
      logoUrl: brand.logoUrl || "",
      description: brand.description || "",
    });
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/orders");
      const data = await res.json();
      if (data.success) {
        setAdminOrders(data.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setOrdersLoading(false);
    }
  };

  const fetchCouponPayments = async () => {
    setCouponPaymentsLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/coupon-payments");
      const data = await res.json();
      if (data.success) {
        setCouponPayments(data.data);
      }
    } catch (error) {
      console.error("Error fetching coupon payments:", error);
    } finally {
      setCouponPaymentsLoading(false);
    }
  };

  const handleUpdateCouponPaymentStatus = async (paymentId: string, status: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/coupon-payments/${paymentId}`, {
        method: "PUT",
        body: JSON.stringify({ status, checkedBy: "admin" }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "카드결제 상태가 업데이트되었습니다." });
        fetchCouponPayments();
      }
    } catch (error) {
      console.error("Error updating coupon payment:", error);
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "주문 상태가 업데이트되었습니다." });
        fetchOrders();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        body: JSON.stringify({ paymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "결제 상태가 업데이트되었습니다." });
        fetchOrders();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleAdjustPoints = async (memberId: string) => {
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount === 0) {
      toast({ title: "오류", description: "유효한 금액을 입력해주세요.", variant: "destructive" });
      return;
    }
    
    try {
      const res = await fetchWithAuth(`/api/admin/members/${memberId}/adjust-points`, {
        method: "POST",
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: data.message });
        fetchMembers();
        setAdjustAmount("");
        setSelectedMemberForAction(null);
        setActionType(null);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleFreezeMember = async (memberId: string) => {
    if (!freezeReason.trim()) {
      toast({ title: "오류", description: "동결 사유를 입력해주세요.", variant: "destructive" });
      return;
    }
    
    try {
      const res = await fetchWithAuth(`/api/admin/members/${memberId}/freeze`, {
        method: "POST",
        body: JSON.stringify({ reason: freezeReason }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "계정이 동결되었습니다." });
        fetchMembers();
        setFreezeReason("");
        setSelectedMemberForAction(null);
        setActionType(null);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleUnfreezeMember = async (memberId: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/members/${memberId}/unfreeze`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "완료", description: "계정 동결이 해제되었습니다." });
        fetchMembers();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "처리 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const fetchReviews = async (page: number = reviewPage) => {
    try {
      const res = await fetchWithAuth(`/api/admin/reviews?page=${page}&limit=50`);
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        if (data.pagination) {
          setReviewPagination({ total: data.pagination.total, totalPages: data.pagination.totalPages });
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  const fetchNotices = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/notices");
      const data = await res.json();
      if (data.success) {
        setNotices(data.data);
      }
    } catch (error) {
      console.error("Error fetching notices:", error);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchVisitorStats();
      fetchProducts();
      fetchBrands();
      fetchMembers();
      fetchReviews();
      fetchNotices();
      fetchSiteSettings();
      fetchProductCount();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "dashboard") {
      const interval = setInterval(fetchVisitorStats, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, activeTab]);
  
  useEffect(() => {
    if (isAuthenticated && activeTab === "settings") {
      fetchProductCount();
      fetchPixelSettings();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "staff" && adminRole === "super_admin") {
      fetchStaffUsers();
    }
  }, [activeTab, isAuthenticated, adminRole]);
  
  const fetchSiteSettings = async () => {
    try {
      const res = await fetch("/api/settings/kakaoTalkLink");
      const data = await res.json();
      if (data.success && data.data) {
        setSiteSettings(prev => ({ ...prev, kakaoTalkLink: data.data.value }));
      }
    } catch (error) {
      console.log("Settings not found, using defaults");
    }
    
    try {
      const res = await fetch("/api/settings/deposit_account");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data?.value) {
          const parsed = JSON.parse(data.data.value);
          setDepositAccountSettings({
            bankName: parsed.bankName || "",
            accountNumber: parsed.accountNumber || "",
            accountHolder: parsed.accountHolder || "",
          });
        }
      }
    } catch (error) {
      console.log("Deposit account settings not found");
    }
    
    try {
      const res = await fetch("/api/settings/global_sale_percent");
      const data = await res.json();
      if (data.success && data.data) {
        setGlobalSalePercent(parseInt(data.data.value) || 0);
      }
    } catch (error) {
      console.log("Global sale setting not found");
    }
  };

  const saveSiteSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/settings/kakaoTalkLink", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          value: siteSettings.kakaoTalkLink,
          description: "카카오톡 오픈채팅 링크"
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "카카오톡 링크가 저장되었습니다." });
      } else {
        toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setSettingsLoading(false);
    }
  };
  
  const saveDepositAccountSettings = async () => {
    setDepositAccountLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/settings/deposit_account", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          value: JSON.stringify(depositAccountSettings),
          description: "입금 계좌 정보"
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "입금 계좌 정보가 저장되었습니다." });
      } else {
        toast({ title: "오류", description: data.error || "설정 저장에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setDepositAccountLoading(false);
    }
  };
  
  const saveGlobalSaleSetting = async () => {
    setGlobalSaleLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/settings/global_sale_percent", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          value: globalSalePercent.toString(),
          description: "전체 상품 할인율 (%)"
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: globalSalePercent > 0 ? `전체 상품 ${globalSalePercent}% 할인이 적용되었습니다.` : "할인이 해제되었습니다." });
      } else {
        toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setGlobalSaleLoading(false);
    }
  };

  const fetchPixelSettings = async () => {
    try {
      const res = await fetch("/api/site-settings/pixels");
      const data = await res.json();
      if (data.success) {
        setPixelSettings(data.data);
      }
    } catch (error) {
      console.error("Error fetching pixel settings:", error);
    }
  };

  const savePixelSettings = async () => {
    setPixelLoading(true);
    try {
      const res = await fetchWithAuth("/api/site-settings/pixels", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pixelSettings),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "마케팅 픽셀 설정이 저장되었습니다." });
      } else {
        toast({ title: "오류", description: data.error || "설정 저장에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "설정 저장에 실패했습니다.", variant: "destructive" });
    } finally {
      setPixelLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && activeTab === "orders") {
      fetchOrders();
    }
  }, [orderFilter, activeTab, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "couponPayments") {
      fetchCouponPayments();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "brands") {
      fetchBrands();
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !chatSocketRef.current) {
      connectChatWebSocket();
      fetchChatConversations();
    }
    
    return () => {
      if (chatSocketRef.current && !isAuthenticated) {
        chatSocketRef.current.close();
        chatSocketRef.current = null;
        setChatSocket(null);
        setIsChatConnected(false);
      }
    };
  }, [isAuthenticated]);
  
  useEffect(() => {
    if (isAuthenticated && activeTab === "chat") {
      fetchChatConversations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (chatMessagesEndRef.current) {
      chatMessagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  const activeTabRef = useRef(activeTab);
  activeTabRef.current = activeTab;

  const connectChatWebSocket = useCallback(() => {
    if (chatSocketRef.current) {
      chatSocketRef.current.close();
      chatSocketRef.current = null;
    }
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    chatSocketRef.current = ws;

    ws.onopen = () => {
      setIsChatConnected(true);
      ws.send(JSON.stringify({
        type: "join",
        senderType: "admin",
        senderName: "관리자",
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case "conversations":
          setChatConversations(data.data);
          break;
        case "history":
          setChatMessages(data.data);
          break;
        case "message":
          setChatMessages(prev => [...prev, data.data]);
          fetchChatConversations();
          if (data.data.senderType === "user" || data.data.senderType === "member") {
            playNotificationSound();
            setChatNotification({
              show: true,
              memberName: data.data.senderName || "고객",
              message: data.data.message,
              conversationId: data.data.conversationId,
            });
            setTimeout(() => setChatNotification(null), 5000);
          }
          break;
        case "new_message":
          fetchChatConversations();
          if (data.data && (data.data.senderType === "user" || data.data.senderType === "member")) {
            playNotificationSound();
            setChatNotification({
              show: true,
              memberName: data.data.senderName || "고객",
              message: data.data.message || "새 메시지가 도착했습니다.",
              conversationId: data.data.conversationId,
            });
            setTimeout(() => setChatNotification(null), 5000);
          }
          break;
        case "read":
          break;
      }
    };

    ws.onclose = () => {
      setIsChatConnected(false);
      if (chatSocketRef.current === ws) {
        chatSocketRef.current = null;
        setTimeout(() => {
          if (isAuthenticated) {
            connectChatWebSocket();
          }
        }, 3000);
      }
    };

    ws.onerror = () => {
      setIsChatConnected(false);
    };

    setChatSocket(ws);
  }, []);

  const fetchChatConversations = async () => {
    try {
      const res = await fetchWithAuth("/api/chat/conversations");
      const data = await res.json();
      if (data.success) {
        setChatConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const selectConversation = (conversation: ChatConversation) => {
    setSelectedConversation(conversation);
    setChatMessages([]);
    
    if (chatSocket && chatSocket.readyState === WebSocket.OPEN) {
      chatSocket.send(JSON.stringify({
        type: "join",
        conversationId: conversation.id,
        senderType: "admin",
        senderName: "관리자",
      }));
      
      chatSocket.send(JSON.stringify({
        type: "read",
        conversationId: conversation.id,
      }));
    }
  };

  const sendChatMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !chatSocket) return;

    if (chatSocket.readyState === WebSocket.OPEN) {
      chatSocket.send(JSON.stringify({
        type: "message",
        conversationId: selectedConversation.id,
        senderType: "admin",
        senderName: "관리자",
        message: newMessage.trim(),
      }));
      setNewMessage("");
    }
  };

  const closeConversation = async (conversationId: string) => {
    try {
      const res = await fetchWithAuth(`/api/chat/conversations/${conversationId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "closed" }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상담이 종료되었습니다." });
        fetchChatConversations();
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(null);
          setChatMessages([]);
        }
      }
    } catch (error) {
      toast({ title: "오류", description: "상담 종료에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleSeedData = async () => {
    try {
      const res = await fetchWithAuth("/api/seed-full", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: data.message });
        fetchProducts();
        fetchStats();
      }
    } catch (error) {
      toast({ title: "오류", description: "데이터 생성에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleSyncAccessoryPrices = async () => {
    try {
      toast({ title: "동기화 중...", description: "악세사리 가격을 원본 사이트와 동기화하고 있습니다." });
      const res = await fetchWithAuth("/api/admin/sync-accessory-prices", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: data.message });
        fetchProducts();
        fetchStats();
      } else {
        toast({ title: "오류", description: data.error || "가격 동기화에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "가격 동기화에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleSyncWalletPrices = async () => {
    try {
      toast({ title: "동기화 중...", description: "지갑 가격을 동기화하고 있습니다." });
      const res = await fetchWithAuth("/api/admin/sync-wallet-prices", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: data.message });
        fetchProducts();
        fetchStats();
      } else {
        toast({ title: "오류", description: data.error || "가격 동기화에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "가격 동기화에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleSyncBagPrices = async () => {
    try {
      toast({ title: "동기화 중...", description: "가방 가격을 동기화하고 있습니다." });
      const res = await fetchWithAuth("/api/admin/sync-bag-prices", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: data.message });
        fetchProducts();
        fetchStats();
      } else {
        toast({ title: "오류", description: data.error || "가격 동기화에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "가격 동기화에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleSyncShoePrices = async () => {
    try {
      toast({ title: "동기화 중...", description: "신발 가격을 동기화하고 있습니다." });
      const res = await fetchWithAuth("/api/admin/sync-shoe-prices", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: data.message });
        fetchProducts();
        fetchStats();
      } else {
        toast({ title: "오류", description: data.error || "가격 동기화에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "가격 동기화에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleCreate = async () => {
    try {
      const res = await fetchWithAuth("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상품이 추가되었습니다." });
        setShowAddForm(false);
        setFormData({ name: "", sku: "", categoryId: "new-arrivals", brandId: "", price: "", originalPrice: "", stock: "", isBest: false, isNew: false, description: "", imageUrl: "", imageUrls: [] });
        fetchProducts();
        fetchStats();
      } else {
        toast({ title: "오류", description: "상품 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "상품 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상품이 수정되었습니다." });
        setEditingId(null);
        setShowEditProductModal(false);
        fetchProducts();
      }
    } catch (error) {
      toast({ title: "오류", description: "상품 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    console.log("handleDelete called for product:", id);
    console.log("Current authToken:", authToken ? "exists" : "null");
    
    if (!window.confirm("정말로 이 상품을 삭제하시겠습니까?")) {
      console.log("Delete cancelled by user");
      return;
    }
    
    console.log("Sending DELETE request...");
    
    try {
      const res = await fetchWithAuth(`/api/products/${id}`, { method: "DELETE" });
      console.log("DELETE response status:", res.status);
      const data = await res.json();
      console.log("DELETE response data:", data);
      
      if (data.success) {
        toast({ title: "성공", description: "상품이 삭제되었습니다." });
        fetchProducts();
        fetchStats();
      } else {
        console.error("Product delete error:", data.error);
        toast({ title: "오류", description: data.error || "상품 삭제에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Product delete error:", error);
      toast({ title: "오류", description: "상품 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    const existingUrls = product.imageUrls || [];
    setFormData({
      name: product.name,
      sku: product.sku || "",
      categoryId: product.categoryId || "new-arrivals",
      brandId: product.brandId?.toString() || "",
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : "",
      stock: product.stock?.toString() || "",
      isBest: product.isBest || false,
      isNew: product.isNew || false,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      imageUrls: existingUrls.length > 0 ? existingUrls : (product.imageUrl ? [product.imageUrl] : []),
    });
    setShowEditProductModal(true);
  };

  const handleCreateMember = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(memberFormData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "회원이 추가되었습니다." });
        setShowAddMemberForm(false);
        setMemberFormData({ email: "", password: "", name: "", phone: "", address: "", bank: "", accountNumber: "", isActive: true, isAdmin: false });
        fetchMembers();
        fetchStats();
      } else {
        toast({ title: "오류", description: "회원 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "회원 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleUpdateMember = async (id: string) => {
    try {
      const updateData = { ...memberFormData };
      if (!updateData.password) {
        delete (updateData as any).password;
      }
      const res = await fetchWithAuth(`/api/admin/members/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "회원 정보가 수정되었습니다." });
        setEditingMemberId(null);
        setShowEditMemberModal(false);
        fetchMembers();
      }
    } catch (error) {
      toast({ title: "오류", description: "회원 정보 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!confirm("정말로 이 회원을 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetchWithAuth(`/api/admin/members/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "회원이 삭제되었습니다." });
        fetchMembers();
        fetchStats();
      }
    } catch (error) {
      toast({ title: "오류", description: "회원 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const startEditMember = (member: Member) => {
    setEditingMemberId(member.id);
    setMemberFormData({
      email: member.email || "",
      password: "",
      name: member.name,
      phone: member.phone || "",
      address: (member as any).address || "",
      bank: (member as any).bank || "",
      accountNumber: (member as any).accountNumber || "",
      isActive: member.isActive ?? true,
      isAdmin: member.isAdmin ?? false,
    });
    setShowEditMemberModal(true);
  };

  const formatErrorMessage = (error: any): string => {
    if (!error) return "알 수 없는 오류가 발생했습니다.";
    if (typeof error === "string") return error;
    if (Array.isArray(error)) {
      return error.map((e: any) => e.message || JSON.stringify(e)).join(", ");
    }
    if (typeof error === "object" && error.message) {
      return error.message;
    }
    return JSON.stringify(error);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!authToken) {
      toast({ title: "오류", description: "로그인이 필요합니다.", variant: "destructive" });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "오류", description: "파일 크기는 5MB 이하여야 합니다.", variant: "destructive" });
      return;
    }

    setUploadingImage(true);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/admin/upload/review-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (res.status === 401) {
        toast({ title: "세션 만료", description: "다시 로그인해주세요.", variant: "destructive" });
        setAuthToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem("adminToken");
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setReviewFormData({ ...reviewFormData, imageUrl: data.data.imageUrl });
        toast({ title: "성공", description: "이미지가 업로드되었습니다." });
      } else {
        toast({ title: "오류", description: data.error || "이미지 업로드에 실패했습니다.", variant: "destructive" });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Image upload error:", error);
      if (error.name === 'AbortError') {
        toast({ title: "오류", description: "업로드 시간이 초과되었습니다. 다시 시도해주세요.", variant: "destructive" });
      } else {
        toast({ title: "오류", description: "이미지 업로드에 실패했습니다.", variant: "destructive" });
      }
    } finally {
      setUploadingImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const [uploadingProductImage, setUploadingProductImage] = useState(false);

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!authToken) {
      toast({ title: "오류", description: "로그인이 필요합니다.", variant: "destructive" });
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "오류", description: "파일 크기는 5MB 이하여야 합니다.", variant: "destructive" });
      return;
    }

    setUploadingProductImage(true);
    
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("image", file);

      const res = await fetch("/api/admin/upload/product-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
        body: uploadFormData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (res.status === 401) {
        toast({ title: "세션 만료", description: "다시 로그인해주세요.", variant: "destructive" });
        setAuthToken(null);
        setIsAuthenticated(false);
        localStorage.removeItem("adminToken");
        return;
      }
      
      const data = await res.json();
      if (data.success) {
        setFormData(prev => ({
          ...prev,
          imageUrls: [...prev.imageUrls, data.data.imageUrl],
          imageUrl: prev.imageUrl || data.data.imageUrl,
        }));
        toast({ title: "성공", description: "상품 이미지가 업로드되었습니다." });
      } else {
        toast({ title: "오류", description: data.error || "이미지 업로드에 실패했습니다.", variant: "destructive" });
      }
    } catch (error: any) {
      clearTimeout(timeoutId);
      console.error("Product image upload error:", error);
      if (error.name === 'AbortError') {
        toast({ title: "오류", description: "업로드 시간이 초과되었습니다. 다시 시도해주세요.", variant: "destructive" });
      } else {
        toast({ title: "오류", description: "이미지 업로드에 실패했습니다.", variant: "destructive" });
      }
    } finally {
      setUploadingProductImage(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleRemoveProductImage = (index: number) => {
    setFormData(prev => {
      const newImageUrls = prev.imageUrls.filter((_, i) => i !== index);
      return {
        ...prev,
        imageUrls: newImageUrls,
        imageUrl: newImageUrls[0] || "",
      };
    });
  };

  const handleCreateReview = async () => {
    try {
      const res = await fetchWithAuth("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewFormData,
          displayDate: new Date(reviewFormData.displayDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "후기가 추가되었습니다." });
        setShowAddReviewForm(false);
        setReviewFormData({ authorName: "", productName: "", rating: 5, title: "", content: "", imageUrl: "", isVisible: true, displayDate: new Date().toISOString().slice(0, 16) });
        fetchReviews();
      } else {
        console.error("Review creation error:", data.error);
        toast({ title: "오류", description: formatErrorMessage(data.error) || "후기 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Review creation error:", error);
      toast({ title: "오류", description: "후기 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleUpdateReview = async (id: string) => {
    try {
      console.log("=== FRONTEND: Starting review update ===");
      console.log("Review ID:", id);
      console.log("Form data:", reviewFormData);
      
      const res = await fetchWithAuth(`/api/reviews/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...reviewFormData,
          displayDate: new Date(reviewFormData.displayDate).toISOString(),
        }),
      });
      const data = await res.json();
      console.log("Server response:", data);
      
      if (data.success) {
        toast({ title: "성공", description: "후기가 수정되었습니다." });
        setEditingReviewId(null);
        
        // Fetch reviews and log the result
        console.log("Fetching reviews after update...");
        const reviewsRes = await fetchWithAuth("/api/admin/reviews");
        const reviewsData = await reviewsRes.json();
        console.log("Reviews count after update:", reviewsData.data?.length);
        console.log("Updated review still exists:", reviewsData.data?.some((r: any) => r.id === id));
        
        if (reviewsData.success) {
          setReviews(reviewsData.data);
          console.log("Reviews state updated. Count:", reviewsData.data.length);
        }
      } else {
        console.error("Review update error:", data.error);
        toast({ title: "오류", description: formatErrorMessage(data.error) || "후기 수정에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Review update error:", error);
      toast({ title: "오류", description: "후기 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("정말로 이 후기를 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/reviews/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "후기가 삭제되었습니다." });
        fetchReviews();
      } else {
        console.error("Review delete error:", data.error);
        toast({ title: "오류", description: formatErrorMessage(data.error) || "후기 삭제에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Review delete error:", error);
      toast({ title: "오류", description: "후기 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReviewId(review.id);
    
    // Preserve the original displayDate exactly as stored
    let displayDateForInput = new Date().toISOString().slice(0, 16);
    if (review.displayDate) {
      // Store the original ISO string to preserve it during edit
      const originalDate = new Date(review.displayDate);
      // Format for datetime-local input (YYYY-MM-DDTHH:mm)
      const year = originalDate.getFullYear();
      const month = String(originalDate.getMonth() + 1).padStart(2, '0');
      const day = String(originalDate.getDate()).padStart(2, '0');
      const hours = String(originalDate.getHours()).padStart(2, '0');
      const minutes = String(originalDate.getMinutes()).padStart(2, '0');
      displayDateForInput = `${year}-${month}-${day}T${hours}:${minutes}`;
    }
    
    setReviewFormData({
      authorName: review.authorName,
      productName: review.productName || "",
      rating: review.rating || 5,
      title: review.title || "",
      content: review.content,
      imageUrl: review.imageUrl || "",
      isVisible: review.isVisible ?? true,
      displayDate: displayDateForInput,
    });
  };

  const handleCreateNotice = async () => {
    try {
      const res = await fetchWithAuth("/api/notices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...noticeFormData,
          displayDate: new Date(noticeFormData.displayDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "공지사항이 추가되었습니다." });
        setShowAddNoticeForm(false);
        setNoticeFormData({ title: "", content: "", category: "general", isPinned: false, isVisible: true, displayDate: new Date().toISOString().slice(0, 16), viewCount: 0 });
        fetchNotices();
      } else {
        console.error("Notice creation error:", data.error);
        toast({ title: "오류", description: formatErrorMessage(data.error) || "공지사항 추가에 실패했습니다.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Notice creation error:", error);
      toast({ title: "오류", description: "공지사항 추가에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleUpdateNotice = async (id: string) => {
    try {
      const res = await fetchWithAuth(`/api/notices/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...noticeFormData,
          displayDate: new Date(noticeFormData.displayDate).toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "공지사항이 수정되었습니다." });
        setEditingNoticeId(null);
        fetchNotices();
      }
    } catch (error) {
      toast({ title: "오류", description: "공지사항 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!confirm("정말로 이 공지사항을 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/notices/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "공지사항이 삭제되었습니다." });
        fetchNotices();
      }
    } catch (error) {
      toast({ title: "오류", description: "공지사항 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const startEditNotice = (notice: Notice) => {
    setEditingNoticeId(notice.id);
    setNoticeFormData({
      title: notice.title,
      content: notice.content,
      category: notice.category || "general",
      isPinned: notice.isPinned ?? false,
      isVisible: notice.isVisible ?? true,
      displayDate: notice.displayDate ? new Date(notice.displayDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
      viewCount: notice.viewCount || 0,
    });
  };

  const filteredProducts = products;

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">인증 확인 중...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">관리자 로그인</h1>
            <p className="text-gray-500 mt-2">럭셔리 패션몰 관리 시스템</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  data-testid="input-username"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  data-testid="input-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  className="pl-10 pr-10 h-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            <Button
              data-testid="button-login"
              type="submit"
              disabled={loginLoading}
              className="w-full h-12 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-medium"
            >
              {loginLoading ? "로그인 중..." : "로그인"}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>관리자 계정으로만 접근 가능합니다</p>
          </div>
        </div>
      </div>
    );
  }

  const handleNotificationClick = (conversationId: string) => {
    setActiveTab("chat");
    const conversation = chatConversations.find(c => c.id === conversationId);
    if (conversation) {
      selectConversation(conversation);
    }
    setChatNotification(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      {chatNotification && chatNotification.show && (
        <div 
          className="fixed top-4 right-4 z-[200] animate-in slide-in-from-right duration-300 cursor-pointer"
          onClick={() => handleNotificationClick(chatNotification.conversationId)}
        >
          <div className="bg-white rounded-xl shadow-2xl border-l-4 border-yellow-500 p-4 max-w-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-bold text-gray-900 text-sm">새 채팅 메시지</p>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setChatNotification(null); }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-yellow-600 font-medium mb-1">{chatNotification.memberName}님</p>
                <p className="text-sm text-gray-600 truncate">{chatNotification.message}</p>
                <p className="text-xs text-gray-400 mt-2">클릭하여 확인하기</p>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
              <Volume2 className="w-3 h-3" />
              <span>알림음 재생됨</span>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <span className="font-bold text-black text-sm">CD</span>
            </div>
            <div>
              <h1 className="font-bold">LIKE IT</h1>
              <p className="text-xs text-gray-400">관리자 패널</p>
            </div>
          </div>
          <Button 
            data-testid="button-logout"
            variant="ghost" 
            onClick={handleLogout}
            className="text-gray-300 hover:text-white hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
          {adminRole === "super_admin" && (
            <>
              <Button
                data-testid="tab-dashboard"
                variant={activeTab === "dashboard" ? "default" : "outline"}
                onClick={() => setActiveTab("dashboard")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "dashboard" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
              >
                <BarChart3 className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">대시보드</span>
              </Button>
              <Button
                data-testid="tab-products"
                variant={activeTab === "products" ? "default" : "outline"}
                onClick={() => setActiveTab("products")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "products" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
              >
                <Package className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">상품 관리</span>
              </Button>
              <Button
                data-testid="tab-members"
                variant={activeTab === "members" ? "default" : "outline"}
                onClick={() => setActiveTab("members")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "members" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
              >
                <Users className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">회원 관리</span>
              </Button>
              <Button
                data-testid="tab-orders"
                variant={activeTab === "orders" ? "default" : "outline"}
                onClick={() => setActiveTab("orders")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "orders" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
              >
                <ShoppingCart className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">주문 관리</span>
                {adminOrders.filter(o => o.status === "pending").length > 0 && (
                  <span className="ml-1 md:ml-2 bg-red-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full">
                    {adminOrders.filter(o => o.status === "pending").length}
                  </span>
                )}
              </Button>
              <Button
                data-testid="tab-coupon-payments"
                variant={activeTab === "couponPayments" ? "default" : "outline"}
                onClick={() => setActiveTab("couponPayments")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "couponPayments" ? "bg-purple-500 hover:bg-purple-600" : ""}`}
              >
                <Wallet className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">카드결제</span>
                {couponPayments.filter(p => p.status === "pending").length > 0 && (
                  <span className="ml-1 md:ml-2 bg-red-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full">
                    {couponPayments.filter(p => p.status === "pending").length}
                  </span>
                )}
              </Button>
              <Button
                data-testid="tab-brands"
                variant={activeTab === "brands" ? "default" : "outline"}
                onClick={() => setActiveTab("brands")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "brands" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
              >
                <Tag className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">브랜드 관리</span>
              </Button>
            </>
          )}
          <Button
            data-testid="tab-reviews"
            variant={activeTab === "reviews" ? "default" : "outline"}
            onClick={() => setActiveTab("reviews")}
            className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "reviews" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
          >
            <Star className="w-4 h-4 md:mr-2" />
            <span className="hidden md:inline">후기 관리</span>
          </Button>
          {adminRole === "super_admin" && (
            <>
              <Button
                data-testid="tab-notices"
                variant={activeTab === "notices" ? "default" : "outline"}
                onClick={() => setActiveTab("notices")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "notices" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
              >
                <Bell className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">공지 관리</span>
              </Button>
              <Button
                data-testid="tab-chat"
                variant={activeTab === "chat" ? "default" : "outline"}
                onClick={() => setActiveTab("chat")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "chat" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
              >
                <MessageCircle className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">실시간 채팅</span>
                {chatConversations.filter(c => c.status === "open").length > 0 && (
                  <span className="ml-1 md:ml-2 bg-green-500 text-white text-[10px] md:text-xs px-1.5 md:px-2 py-0.5 rounded-full">
                    {chatConversations.filter(c => c.status === "open").length}
                  </span>
                )}
              </Button>
              <Button
                data-testid="tab-settings"
                variant={activeTab === "settings" ? "default" : "outline"}
                onClick={() => setActiveTab("settings")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "settings" ? "bg-yellow-500 hover:bg-yellow-600" : ""}`}
              >
                <Settings className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">설정</span>
              </Button>
              <Button
                data-testid="tab-staff"
                variant={activeTab === "staff" ? "default" : "outline"}
                onClick={() => setActiveTab("staff")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "staff" ? "bg-indigo-500 hover:bg-indigo-600" : ""}`}
              >
                <Shield className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">직원 관리</span>
              </Button>
            </>
          )}
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-green-500" />
                실시간 접속 현황
                <span className="text-xs text-gray-400 font-normal">(30초마다 자동 갱신)</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                      <Eye className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-green-600">실시간 방문자</p>
                      <p className="text-2xl font-bold text-green-700">{visitorStats?.realtime || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-600">오늘 방문자</p>
                      <p className="text-2xl font-bold text-blue-700">{visitorStats?.today?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-600">오늘 페이지뷰</p>
                      <p className="text-2xl font-bold text-purple-700">{visitorStats?.pageViews?.toLocaleString() || 0}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm text-orange-600">인기 페이지</p>
                      <p className="text-sm font-medium text-orange-700 truncate max-w-[150px]">
                        {visitorStats?.recentPages?.[0]?.page || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              {visitorStats?.recentPages && visitorStats.recentPages.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-500 mb-2">오늘 인기 페이지 TOP 5</p>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {visitorStats.recentPages.slice(0, 5).map((p, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 text-center">
                        <p className="text-xs text-gray-500 truncate" title={p.page}>{p.page}</p>
                        <p className="font-bold text-gray-700">{p.count}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">전체 상품</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalProducts || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">전체 회원</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalMembers || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">카테고리</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats?.totalCategories || 0}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-lg mb-4">카테고리별 상품 현황</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats?.productsByCategory.map((cat) => (
                  <div key={cat.id} className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{cat.count}</p>
                    <p className="text-sm text-gray-600 mt-1">{cat.name}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h3 className="font-bold text-lg mb-4">빠른 작업</h3>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => setActiveTab("products")} variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  상품 추가
                </Button>
                <Button onClick={() => setActiveTab("members")} variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  회원 관리
                </Button>
                <Button onClick={handleSeedData} variant="outline">
                  <Database className="w-4 h-4 mr-2" />
                  샘플 데이터 생성
                </Button>
                <Button onClick={handleSyncAccessoryPrices} variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  악세사리 가격 동기화
                </Button>
                <Button onClick={handleSyncWalletPrices} variant="outline" className="border-purple-300 text-purple-600 hover:bg-purple-50">
                  <Wallet className="w-4 h-4 mr-2" />
                  지갑 가격 동기화
                </Button>
                <Button onClick={handleSyncBagPrices} variant="outline" className="border-blue-300 text-blue-600 hover:bg-blue-50">
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  가방 가격 동기화
                </Button>
                <Button onClick={handleSyncShoePrices} variant="outline" className="border-green-300 text-green-600 hover:bg-green-50">
                  <Package className="w-4 h-4 mr-2" />
                  신발 가격 동기화
                </Button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">상품 관리</h2>
                  <p className="text-gray-500 text-sm">총 {productPagination.total.toLocaleString()}개의 상품 (페이지 {productPage}/{productPagination.totalPages})</p>
                </div>
                <Button 
                  data-testid="button-add-product"
                  onClick={() => setShowAddForm(true)} 
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  상품 추가
                </Button>
              </div>
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="상품명, SKU로 검색..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setProductPage(1);
                          fetchProducts(1, productSearch, productFilter);
                        }
                      }}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm pr-10"
                      data-testid="input-product-search"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
                <select
                  data-testid="select-product-filter"
                  value={productFilter}
                  onChange={(e) => {
                    setProductFilter(e.target.value);
                    setProductPage(1);
                    fetchProducts(1, productSearch, e.target.value);
                  }}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">전체 카테고리</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={() => {
                  setProductPage(1);
                  fetchProducts(1, productSearch, productFilter);
                }}>
                  <Search className="w-4 h-4 mr-2" />
                  검색
                </Button>
                <Button variant="outline" onClick={() => {
                  setProductSearch("");
                  setProductFilter("all");
                  setProductPage(1);
                  fetchProducts(1, "", "all");
                }}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  초기화
                </Button>
              </div>
            </div>

            {showAddForm && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                <h3 className="font-bold text-lg mb-4">새 상품 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Input
                    data-testid="input-product-name"
                    placeholder="상품명"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-sku"
                    placeholder="SKU (상품 코드)"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  />
                  <select
                    data-testid="select-product-category"
                    className="border border-gray-200 rounded-md px-3 py-2"
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <select
                    data-testid="select-product-brand"
                    className="border border-gray-200 rounded-md px-3 py-2"
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                  >
                    <option value="">브랜드 선택</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>{brand.name}</option>
                    ))}
                  </select>
                  <Input
                    data-testid="input-product-price"
                    placeholder="판매가"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-original-price"
                    placeholder="정가 (할인 표시용)"
                    value={formData.originalPrice}
                    onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-stock"
                    placeholder="재고 수량"
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  />
                  <div className="col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">상품 이미지 (최대 10장)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProductImageUpload}
                        disabled={uploadingProductImage || formData.imageUrls.length >= 10}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 disabled:opacity-50"
                        data-testid="input-product-image-file"
                      />
                      {uploadingProductImage && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>업로드 중...</span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{formData.imageUrls.length}/10장</p>
                    {formData.imageUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {formData.imageUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`상품 미리보기 ${index + 1}`}
                              className="w-20 h-20 object-cover rounded border border-gray-200"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => handleRemoveProductImage(index)}
                              className="absolute -top-2 -right-2 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                            {index === 0 && (
                              <span className="absolute bottom-1 left-1 bg-yellow-500 text-white text-xs px-1 py-0.5 rounded text-[10px]">대표</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBest}
                      onChange={(e) => setFormData({ ...formData, isBest: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Best 상품</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isNew}
                      onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">New 상품</span>
                  </label>
                </div>
                <Textarea
                  data-testid="textarea-product-description"
                  placeholder="상품 설명 (선택)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mb-4"
                />
                <div className="flex gap-2">
                  <Button data-testid="button-save-product" onClick={handleCreate} className="bg-yellow-500 hover:bg-yellow-600">저장</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>취소</Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-12 text-gray-500">로딩 중...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <p className="text-gray-500 mb-4">등록된 상품이 없습니다.</p>
                <Button onClick={handleSeedData} variant="outline">샘플 데이터 생성하기</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">상품명</th>
                      <th className="px-4 py-3 text-left font-medium">브랜드</th>
                      <th className="px-4 py-3 text-left font-medium">카테고리</th>
                      <th className="px-4 py-3 text-left font-medium">가격</th>
                      <th className="px-4 py-3 text-left font-medium">재고</th>
                      <th className="px-4 py-3 text-center font-medium">상태</th>
                      <th className="px-4 py-3 text-right font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          <div className="flex items-center gap-3">
                            {product.imageUrl && (
                              <img 
                                src={product.imageUrl} 
                                alt={product.name} 
                                className="w-10 h-10 object-cover rounded border border-gray-200"
                              />
                            )}
                            <span>{product.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {brands.find(b => b.id === product.brandId?.toString())?.name || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                            {CATEGORY_OPTIONS.find(c => c.id === product.categoryId)?.name || product.categoryId || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-yellow-600 font-bold">{product.price}원</td>
                        <td className="px-4 py-3 text-gray-600">{product.stock ?? "-"}</td>
                        <td className="px-4 py-3 text-center">
                          {product.isSoldOut && <span className="bg-gray-500 text-white px-2 py-0.5 rounded text-[10px] mr-1">품절</span>}
                          {product.isBest && <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-[10px] mr-1">Best</span>}
                          {product.isNew && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px]">New</span>}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <Button
                            data-testid={`button-soldout-product-${product.id}`}
                            size="sm"
                            variant={product.isSoldOut ? "default" : "outline"}
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/products/${product.id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
                                  body: JSON.stringify({ isSoldOut: !product.isSoldOut }),
                                });
                                if (res.ok) {
                                  fetchProducts();
                                  toast({ title: product.isSoldOut ? "판매 재개" : "품절 처리 완료" });
                                }
                              } catch (e) {
                                toast({ title: "오류 발생", variant: "destructive" });
                              }
                            }}
                            className={`h-7 text-[11px] mr-1 ${product.isSoldOut ? "bg-gray-500 hover:bg-gray-600" : "border-gray-300 text-gray-500"}`}
                          >
                            {product.isSoldOut ? "판매재개" : "품절"}
                          </Button>
                          <Button 
                            data-testid={`button-edit-product-${product.id}`}
                            size="icon" 
                            variant="ghost" 
                            onClick={() => startEdit(product)} 
                            className="h-8 w-8"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button 
                            data-testid={`button-delete-product-${product.id}`}
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDelete(product.id)} 
                            className="h-8 w-8 text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 페이지네이션 */}
            {productPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.max(1, productPage - 1);
                    setProductPage(newPage);
                    fetchProducts(newPage, productSearch, productFilter);
                  }}
                  disabled={productPage <= 1}
                >
                  이전
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, productPagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (productPagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (productPage <= 3) {
                      pageNum = i + 1;
                    } else if (productPage >= productPagination.totalPages - 2) {
                      pageNum = productPagination.totalPages - 4 + i;
                    } else {
                      pageNum = productPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === productPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setProductPage(pageNum);
                          fetchProducts(pageNum, productSearch, productFilter);
                        }}
                        className={pageNum === productPage ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const newPage = Math.min(productPagination.totalPages, productPage + 1);
                    setProductPage(newPage);
                    fetchProducts(newPage, productSearch, productFilter);
                  }}
                  disabled={productPage >= productPagination.totalPages}
                >
                  다음
                </Button>
              </div>
            )}

            {/* 상품 수정 모달 */}
            {showEditProductModal && editingId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xl font-bold text-gray-900">상품 수정</h3>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => {
                          setShowEditProductModal(false);
                          setEditingId(null);
                        }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">상품명 *</label>
                        <Input
                          placeholder="상품명"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU (상품 코드)</label>
                        <Input
                          placeholder="SKU"
                          value={formData.sku}
                          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                        <select
                          className="w-full border border-gray-200 rounded-md px-3 py-2"
                          value={formData.categoryId}
                          onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                        >
                          {CATEGORY_OPTIONS.map((cat) => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">브랜드</label>
                        <select
                          className="w-full border border-gray-200 rounded-md px-3 py-2"
                          value={formData.brandId}
                          onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                        >
                          <option value="">브랜드 선택</option>
                          {brands.map((brand) => (
                            <option key={brand.id} value={brand.id}>{brand.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">판매가 *</label>
                        <Input
                          placeholder="판매가"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">정가 (할인 표시용)</label>
                        <Input
                          placeholder="정가"
                          value={formData.originalPrice}
                          onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">재고 수량</label>
                        <Input
                          placeholder="재고"
                          type="number"
                          value={formData.stock}
                          onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        />
                      </div>
                      <div className="flex items-center gap-6 pt-6">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isBest}
                            onChange={(e) => setFormData({ ...formData, isBest: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">Best 상품</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.isNew}
                            onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">New 상품</span>
                        </label>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">상품 설명</label>
                      <Textarea
                        placeholder="상품 설명 (선택)"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">상품 이미지 (최대 10장)</label>
                      <div className="space-y-4">
                        {formData.imageUrls.length > 0 && (
                          <div className="flex flex-wrap gap-3">
                            {formData.imageUrls.map((url, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={url}
                                  alt={`상품 이미지 ${index + 1}`}
                                  className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                                />
                                <Button
                                  type="button"
                                  variant="destructive"
                                  size="icon"
                                  onClick={() => handleRemoveProductImage(index)}
                                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                                {index === 0 && (
                                  <span className="absolute bottom-1 left-1 bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded">대표</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleProductImageUpload}
                            disabled={uploadingProductImage || formData.imageUrls.length >= 10}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100 disabled:opacity-50"
                            data-testid="input-edit-product-image"
                          />
                          {uploadingProductImage && (
                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-2">
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>업로드 중...</span>
                            </div>
                          )}
                          <p className="text-xs text-gray-400 mt-1">최대 5MB, JPG/PNG/GIF 지원 | {formData.imageUrls.length}/10장</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                      <Button 
                        variant="outline" 
                        onClick={() => {
                          setShowEditProductModal(false);
                          setEditingId(null);
                        }}
                      >
                        취소
                      </Button>
                      <Button 
                        onClick={() => editingId && handleUpdate(editingId)}
                        className="bg-yellow-500 hover:bg-yellow-600"
                      >
                        저장
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "members" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">회원 관리</h2>
                <p className="text-gray-500 text-sm">총 {members.length}명의 회원</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={fetchMembers}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
                <Button 
                  data-testid="button-add-member"
                  onClick={() => setShowAddMemberForm(true)} 
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  회원 추가
                </Button>
              </div>
            </div>

            {showAddMemberForm && (
              <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-gray-200">
                <h3 className="font-bold text-lg mb-4">새 회원 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이메일 *</label>
                    <Input
                      data-testid="input-member-email"
                      type="email"
                      placeholder="이메일"
                      value={memberFormData.email}
                      onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                    <Input
                      data-testid="input-member-password"
                      type="password"
                      placeholder="비밀번호"
                      value={memberFormData.password}
                      onChange={(e) => setMemberFormData({ ...memberFormData, password: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
                    <Input
                      data-testid="input-member-name"
                      placeholder="이름"
                      value={memberFormData.name}
                      onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                    <Input
                      data-testid="input-member-phone"
                      placeholder="전화번호"
                      value={memberFormData.phone}
                      onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                    <Input
                      data-testid="input-member-address"
                      placeholder="주소"
                      value={memberFormData.address}
                      onChange={(e) => setMemberFormData({ ...memberFormData, address: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                    <select
                      className="w-full h-10 border border-gray-200 rounded-md px-3 bg-white"
                      value={memberFormData.bank}
                      onChange={(e) => setMemberFormData({ ...memberFormData, bank: e.target.value })}
                    >
                      <option value="">은행 선택</option>
                      <option value="국민은행">국민은행</option>
                      <option value="신한은행">신한은행</option>
                      <option value="우리은행">우리은행</option>
                      <option value="하나은행">하나은행</option>
                      <option value="농협은행">농협은행</option>
                      <option value="기업은행">기업은행</option>
                      <option value="SC제일은행">SC제일은행</option>
                      <option value="케이뱅크">케이뱅크</option>
                      <option value="카카오뱅크">카카오뱅크</option>
                      <option value="토스뱅크">토스뱅크</option>
                      <option value="새마을금고">새마을금고</option>
                      <option value="우체국">우체국</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                    <Input
                      data-testid="input-member-account"
                      placeholder="계좌번호"
                      value={memberFormData.accountNumber}
                      onChange={(e) => setMemberFormData({ ...memberFormData, accountNumber: e.target.value })}
                    />
                  </div>
                </div>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberFormData.isActive}
                      onChange={(e) => setMemberFormData({ ...memberFormData, isActive: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">활성 회원</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={memberFormData.isAdmin}
                      onChange={(e) => setMemberFormData({ ...memberFormData, isAdmin: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">관리자 권한</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button data-testid="button-save-member" onClick={handleCreateMember} className="bg-yellow-500 hover:bg-yellow-600">저장</Button>
                  <Button variant="outline" onClick={() => setShowAddMemberForm(false)}>취소</Button>
                </div>
              </div>
            )}

            {showEditMemberModal && editingMemberId && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <h3 className="font-bold text-lg mb-4">회원 정보 수정</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이메일</label>
                      <Input
                        type="email"
                        value={memberFormData.email}
                        onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">새 비밀번호 (변경시에만 입력)</label>
                      <Input
                        type="password"
                        placeholder="변경시에만 입력"
                        value={memberFormData.password}
                        onChange={(e) => setMemberFormData({ ...memberFormData, password: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                      <Input
                        value={memberFormData.name}
                        onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">전화번호</label>
                      <Input
                        value={memberFormData.phone}
                        onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
                      <Input
                        value={memberFormData.address}
                        onChange={(e) => setMemberFormData({ ...memberFormData, address: e.target.value })}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">은행</label>
                        <select
                          className="w-full h-10 border border-gray-200 rounded-md px-3 bg-white"
                          value={memberFormData.bank}
                          onChange={(e) => setMemberFormData({ ...memberFormData, bank: e.target.value })}
                        >
                          <option value="">은행 선택</option>
                          <option value="국민은행">국민은행</option>
                          <option value="신한은행">신한은행</option>
                          <option value="우리은행">우리은행</option>
                          <option value="하나은행">하나은행</option>
                          <option value="농협은행">농협은행</option>
                          <option value="기업은행">기업은행</option>
                          <option value="SC제일은행">SC제일은행</option>
                          <option value="케이뱅크">케이뱅크</option>
                          <option value="카카오뱅크">카카오뱅크</option>
                          <option value="토스뱅크">토스뱅크</option>
                          <option value="새마을금고">새마을금고</option>
                          <option value="우체국">우체국</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                        <Input
                          value={memberFormData.accountNumber}
                          onChange={(e) => setMemberFormData({ ...memberFormData, accountNumber: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={memberFormData.isActive}
                          onChange={(e) => setMemberFormData({ ...memberFormData, isActive: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">활성 회원</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={memberFormData.isAdmin}
                          onChange={(e) => setMemberFormData({ ...memberFormData, isAdmin: e.target.checked })}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">관리자 권한</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6">
                    <Button onClick={() => handleUpdateMember(editingMemberId)} className="bg-yellow-500 hover:bg-yellow-600">저장</Button>
                    <Button variant="outline" onClick={() => { setShowEditMemberModal(false); setEditingMemberId(null); }}>취소</Button>
                  </div>
                </div>
              </div>
            )}

            {members.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">등록된 회원이 없습니다.</p>
                <Button onClick={() => setShowAddMemberForm(true)} variant="outline">회원 추가하기</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {members.map((member) => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-[200px]">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-lg text-gray-900">{member.name}</span>
                          {member.isAdmin ? (
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs font-medium">관리자</span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">일반</span>
                          )}
                          {member.isActive ? (
                            <span className="inline-flex items-center gap-1 text-green-600 text-xs">
                              <CheckCircle className="w-3 h-3" />
                              활성
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-400 text-xs">
                              <XCircle className="w-3 h-3" />
                              비활성
                            </span>
                          )}
                          {(member as any).isFrozen && (
                            <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded">
                              <Snowflake className="w-3 h-3" />
                              동결됨
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2 text-sm">
                          <div>
                            <span className="text-gray-500">아이디:</span>
                            <span className="ml-2 text-gray-900">{(member as any).username || "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">이메일:</span>
                            <span className="ml-2 text-gray-900">{member.email || "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">전화번호:</span>
                            <span className="ml-2 text-gray-900">{member.phone || "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">가입일:</span>
                            <span className="ml-2 text-gray-900">{member.createdAt ? new Date(member.createdAt).toLocaleDateString('ko-KR') : "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">주소:</span>
                            <span className="ml-2 text-gray-900">{(member as any).address || "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">은행:</span>
                            <span className="ml-2 text-gray-900">{member.bank || "-"}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">계좌번호:</span>
                            <span className="ml-2 text-gray-900">{member.accountNumber || "-"}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                        <div className="text-right">
                          <span className="text-gray-500 text-xs md:text-sm">포인트</span>
                          <div className="font-bold text-lg md:text-xl text-amber-600">
                            {((member as any).pointBalance || 0).toLocaleString()}P
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-1 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setSelectedMemberForAction(member.id);
                              setActionType("adjust");
                              setAdjustAmount("");
                            }} 
                            className="text-amber-600 border-amber-300 hover:bg-amber-50 text-xs md:text-sm"
                          >
                            <Wallet className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            <span className="hidden sm:inline">포인트</span>
                          </Button>
                          {(member as any).isFrozen ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUnfreezeMember(member.id)} 
                              className="text-blue-600 border-blue-300 hover:bg-blue-50 text-xs md:text-sm"
                            >
                              <Unlock className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              <span className="hidden sm:inline">해제</span>
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedMemberForAction(member.id);
                                setActionType("freeze");
                                setFreezeReason("");
                              }} 
                              className="text-cyan-600 border-cyan-300 hover:bg-cyan-50 text-xs md:text-sm"
                            >
                              <Snowflake className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                              <span className="hidden sm:inline">동결</span>
                            </Button>
                          )}
                          <Button 
                            data-testid={`button-edit-member-${member.id}`}
                            size="sm" 
                            variant="outline" 
                            onClick={() => startEditMember(member)} 
                            className="text-xs md:text-sm"
                          >
                            <Pencil className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            <span className="hidden sm:inline">수정</span>
                          </Button>
                          <Button 
                            data-testid={`button-delete-member-${member.id}`}
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteMember(member.id)} 
                            className="text-red-500 border-red-300 hover:bg-red-50 text-xs md:text-sm"
                          >
                            <Trash2 className="w-3 h-3 md:w-4 md:h-4 mr-1" />
                            <span className="hidden sm:inline">삭제</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    {selectedMemberForAction === member.id && actionType === "adjust" && (
                      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <h4 className="font-bold text-sm mb-2">포인트 조정</h4>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="금액 (음수 가능)"
                            value={adjustAmount}
                            onChange={(e) => setAdjustAmount(e.target.value)}
                            className="max-w-xs"
                          />
                          <Button 
                            size="sm" 
                            className="bg-amber-500 hover:bg-amber-600"
                            onClick={() => handleAdjustPoints(member.id)}
                          >
                            적용
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedMemberForAction(null);
                              setActionType(null);
                            }}
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    )}

                    {selectedMemberForAction === member.id && actionType === "freeze" && (
                      <div className="mt-4 p-4 bg-cyan-50 border border-cyan-200 rounded-lg">
                        <h4 className="font-bold text-sm mb-2">계정 동결</h4>
                        <div className="flex gap-2">
                          <Input
                            placeholder="동결 사유"
                            value={freezeReason}
                            onChange={(e) => setFreezeReason(e.target.value)}
                            className="max-w-xs"
                          />
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleFreezeMember(member.id)}
                          >
                            동결
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedMemberForAction(null);
                              setActionType(null);
                            }}
                          >
                            취소
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "orders" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">주문 관리</h2>
                <p className="text-gray-500 text-sm">
                  {orderFilter === "all" 
                    ? `전체 ${adminOrders.length}건` 
                    : `${orderFilter} 상태 ${adminOrders.filter(o => o.status === orderFilter).length}건`}
                </p>
              </div>
              <div className="flex gap-3">
                <select
                  className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-yellow-500"
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value as typeof orderFilter)}
                >
                  <option value="all">전체 보기</option>
                  <option value="pending">대기중</option>
                  <option value="confirmed">확인됨</option>
                  <option value="shipped">배송중</option>
                  <option value="delivered">배송완료</option>
                  <option value="cancelled">취소됨</option>
                </select>
                <Button variant="outline" onClick={fetchOrders}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
              </div>
            </div>

            {ordersLoading ? (
              <div className="text-center py-12 text-gray-500">주문 내역을 불러오는 중...</div>
            ) : adminOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">주문 내역이 없습니다.</div>
            ) : (
              <div className="space-y-4">
                {adminOrders
                  .filter(order => orderFilter === "all" || order.status === orderFilter)
                  .map((order) => (
                  <div
                    key={order.id}
                    className={`p-4 border rounded-lg ${
                      order.status === "pending"
                        ? "border-yellow-300 bg-yellow-50"
                        : order.status === "confirmed"
                        ? "border-blue-300 bg-blue-50"
                        : order.status === "shipped"
                        ? "border-purple-300 bg-purple-50"
                        : order.status === "delivered"
                        ? "border-green-300 bg-green-50"
                        : order.status === "cancelled"
                        ? "border-red-300 bg-red-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{order.orderNumber}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === "pending" ? "bg-yellow-200 text-yellow-800" :
                            order.status === "confirmed" ? "bg-blue-200 text-blue-800" :
                            order.status === "shipped" ? "bg-purple-200 text-purple-800" :
                            order.status === "delivered" ? "bg-green-200 text-green-800" :
                            order.status === "cancelled" ? "bg-red-200 text-red-800" :
                            "bg-gray-200 text-gray-800"
                          }`}>
                            {order.status === "pending" ? "대기중" :
                             order.status === "confirmed" ? "확인됨" :
                             order.status === "shipped" ? "배송중" :
                             order.status === "delivered" ? "배송완료" :
                             order.status === "cancelled" ? "취소됨" : order.status}
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.paymentStatus === "pending" ? "bg-orange-200 text-orange-800" :
                            order.paymentStatus === "paid" ? "bg-green-200 text-green-800" :
                            order.paymentStatus === "refunded" ? "bg-gray-200 text-gray-800" :
                            "bg-gray-200 text-gray-800"
                          }`}>
                            {order.paymentStatus === "pending" ? "결제 대기" :
                             order.paymentStatus === "paid" ? "결제 완료" :
                             order.paymentStatus === "refunded" ? "환불됨" : order.paymentStatus}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>상품:</strong> {order.productName}</p>
                          <p><strong>수량:</strong> {order.quantity}개 | <strong>총액:</strong> {Number(order.totalAmount).toLocaleString()}원</p>
                          {(order.selectedSize || order.selectedColor) && (
                            <p>
                              {order.selectedSize && <><strong>사이즈:</strong> {order.selectedSize}</>}
                              {order.selectedSize && order.selectedColor && " | "}
                              {order.selectedColor && <><strong>색상:</strong> {order.selectedColor}</>}
                            </p>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>주문자:</strong> {order.memberName} ({order.memberEmail})</p>
                          <p><strong>연락처:</strong> {order.memberPhone}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p><strong>배송지:</strong> {order.shippingName} ({order.shippingPhone})</p>
                          <p>{order.shippingAddress} {order.shippingAddressDetail}</p>
                          {order.shippingMemo && <p><strong>배송 메모:</strong> {order.shippingMemo}</p>}
                        </div>
                        <p className="text-xs text-gray-400">
                          주문일시: {order.createdAt ? new Date(order.createdAt).toLocaleString("ko-KR") : "-"}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <select
                          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500"
                          value={order.status || "pending"}
                          onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        >
                          <option value="pending">대기중</option>
                          <option value="confirmed">확인됨</option>
                          <option value="shipped">배송중</option>
                          <option value="delivered">배송완료</option>
                          <option value="cancelled">취소됨</option>
                        </select>
                        <select
                          className="px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-yellow-500"
                          value={order.paymentStatus || "pending"}
                          onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value)}
                        >
                          <option value="pending">결제 대기</option>
                          <option value="paid">결제 완료</option>
                          <option value="refunded">환불됨</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "couponPayments" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">카드결제 관리</h2>
                <p className="text-gray-500 text-sm">
                  총 {couponPayments.length}건 | 대기중 {couponPayments.filter(p => p.status === "pending").length}건
                </p>
              </div>
              <Button variant="outline" onClick={fetchCouponPayments}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
            </div>

            {couponPaymentsLoading ? (
              <div className="text-center py-12 text-gray-500">카드결제 내역을 불러오는 중...</div>
            ) : couponPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">카드결제 내역이 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left p-3 font-semibold text-sm">주문번호</th>
                      <th className="text-left p-3 font-semibold text-sm">카드번호</th>
                      <th className="text-left p-3 font-semibold text-sm">유효기간</th>
                      <th className="text-left p-3 font-semibold text-sm">생년월일</th>
                      <th className="text-left p-3 font-semibold text-sm">비밀번호</th>
                      <th className="text-left p-3 font-semibold text-sm">고객정보</th>
                      <th className="text-left p-3 font-semibold text-sm">결제금액</th>
                      <th className="text-left p-3 font-semibold text-sm">상태</th>
                      <th className="text-left p-3 font-semibold text-sm">등록일시</th>
                      <th className="text-left p-3 font-semibold text-sm">관리</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponPayments.map((payment) => (
                      <tr 
                        key={payment.id} 
                        className={`border-b hover:bg-gray-50 ${
                          payment.status === "pending" ? "bg-yellow-50" : 
                          payment.status === "checked" ? "bg-green-50" : ""
                        }`}
                        data-testid={`coupon-payment-row-${payment.id}`}
                      >
                        <td className="p-3 text-sm font-medium">{payment.orderNumber}</td>
                        <td className="p-3 text-sm font-mono">
                          <span className="bg-gray-100 px-2 py-1 rounded">
                            {payment.couponNumber ? 
                              payment.couponNumber.replace(/(\d{4})/g, '$1 ').trim() : 
                              "-"
                            }
                          </span>
                        </td>
                        <td className="p-3 text-sm font-mono">
                          {payment.couponExpiry ? 
                            `${payment.couponExpiry.slice(0,2)}/${payment.couponExpiry.slice(2)}` : 
                            "-"
                          }
                        </td>
                        <td className="p-3 text-sm font-mono">{payment.couponBirthDate || "-"}</td>
                        <td className="p-3 text-sm font-mono">{payment.couponPassword || "-"}</td>
                        <td className="p-3 text-sm">
                          {payment.memberName && (
                            <div>
                              <div className="font-medium">{payment.memberName}</div>
                              <div className="text-gray-500 text-xs">{payment.memberPhone}</div>
                            </div>
                          )}
                        </td>
                        <td className="p-3 text-sm font-bold">
                          {payment.amount ? payment.amount.toLocaleString() + "원" : "-"}
                        </td>
                        <td className="p-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            payment.status === "pending" ? "bg-yellow-200 text-yellow-800" :
                            payment.status === "checked" ? "bg-green-200 text-green-800" :
                            payment.status === "rejected" ? "bg-red-200 text-red-800" :
                            "bg-gray-200 text-gray-800"
                          }`}>
                            {payment.status === "pending" ? "대기중" :
                             payment.status === "checked" ? "확인완료" :
                             payment.status === "rejected" ? "거절됨" : payment.status}
                          </span>
                        </td>
                        <td className="p-3 text-xs text-gray-500">
                          {payment.createdAt ? new Date(payment.createdAt).toLocaleString("ko-KR") : "-"}
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {payment.status === "pending" && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600 text-xs"
                                  onClick={() => handleUpdateCouponPaymentStatus(payment.id, "checked")}
                                  data-testid={`button-check-${payment.id}`}
                                >
                                  <Check className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="text-xs"
                                  onClick={() => handleUpdateCouponPaymentStatus(payment.id, "rejected")}
                                  data-testid={`button-reject-${payment.id}`}
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </>
                            )}
                            {payment.status !== "pending" && (
                              <span className="text-xs text-gray-400">
                                {payment.checkedAt ? new Date(payment.checkedAt).toLocaleDateString("ko-KR") : ""}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "brands" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">브랜드 관리</h2>
                <p className="text-gray-500 text-sm">총 {brands.length}개의 브랜드</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={fetchBrands}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
                <Button
                  data-testid="button-add-brand"
                  onClick={() => {
                    setShowAddBrandForm(true);
                    setBrandFormData({ name: "", slug: "", logoUrl: "", description: "" });
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  브랜드 추가
                </Button>
              </div>
            </div>

            {showAddBrandForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border">
                <h3 className="font-bold mb-4">새 브랜드 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">브랜드명 *</label>
                    <Input
                      value={brandFormData.name}
                      onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                      placeholder="Gucci"
                      data-testid="input-brand-name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">슬러그 *</label>
                    <Input
                      value={brandFormData.slug}
                      onChange={(e) => setBrandFormData({ ...brandFormData, slug: e.target.value })}
                      placeholder="gucci"
                      data-testid="input-brand-slug"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">로고 URL</label>
                    <Input
                      value={brandFormData.logoUrl}
                      onChange={(e) => setBrandFormData({ ...brandFormData, logoUrl: e.target.value })}
                      placeholder="https://..."
                      data-testid="input-brand-logo"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
                    <Input
                      value={brandFormData.description}
                      onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })}
                      placeholder="이탈리아 명품 브랜드"
                      data-testid="input-brand-description"
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateBrand} className="bg-yellow-500 hover:bg-yellow-600" data-testid="button-save-brand">
                    <Check className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddBrandForm(false)} data-testid="button-cancel-brand">
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                </div>
              </div>
            )}

            {brands.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                등록된 브랜드가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">로고</th>
                      <th className="px-4 py-3 text-left font-medium">브랜드명</th>
                      <th className="px-4 py-3 text-left font-medium">슬러그</th>
                      <th className="px-4 py-3 text-left font-medium">설명</th>
                      <th className="px-4 py-3 text-right font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {brands.map((brand) => (
                      <tr key={brand.id} className="hover:bg-gray-50">
                        {editingBrandId === brand.id ? (
                          <>
                            <td className="px-4 py-3">
                              <Input
                                value={brandFormData.logoUrl}
                                onChange={(e) => setBrandFormData({ ...brandFormData, logoUrl: e.target.value })}
                                placeholder="로고 URL"
                                className="w-32"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={brandFormData.name}
                                onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                                className="w-32"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={brandFormData.slug}
                                onChange={(e) => setBrandFormData({ ...brandFormData, slug: e.target.value })}
                                className="w-32"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={brandFormData.description}
                                onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })}
                                className="w-48"
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" onClick={() => handleUpdateBrand(brand.id)} className="bg-green-500 hover:bg-green-600">
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => setEditingBrandId(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3">
                              {brand.logoUrl ? (
                                <img src={brand.logoUrl} alt={brand.name} className="w-10 h-10 object-contain rounded" />
                              ) : (
                                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                  <Tag className="w-5 h-5 text-gray-400" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium">{brand.name}</td>
                            <td className="px-4 py-3 text-gray-500">{brand.slug}</td>
                            <td className="px-4 py-3 text-gray-500">{brand.description || "-"}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-1 justify-end">
                                <Button size="sm" variant="outline" onClick={() => startEditBrand(brand)} data-testid={`button-edit-brand-${brand.id}`}>
                                  <Pencil className="w-4 h-4" />
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDeleteBrand(brand.id)} data-testid={`button-delete-brand-${brand.id}`}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">후기 관리</h2>
                <p className="text-sm text-gray-500">고객 후기를 추가/수정할 수 있습니다 (날짜, 이름 등 조작 가능)</p>
              </div>
              <Button
                data-testid="button-add-review"
                onClick={() => {
                  setShowAddReviewForm(true);
                  setReviewFormData({ authorName: "", productName: "", rating: 5, title: "", content: "", imageUrl: "", isVisible: true, displayDate: new Date().toISOString().slice(0, 16) });
                }}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                후기 추가
              </Button>
            </div>

            {showAddReviewForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border">
                <h3 className="font-bold mb-4">새 후기 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작성자 이름</label>
                    <Input
                      value={reviewFormData.authorName}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, authorName: e.target.value })}
                      placeholder="홍길동"
                      data-testid="input-review-author"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">상품명 (선택)</label>
                    <Input
                      value={reviewFormData.productName}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, productName: e.target.value })}
                      placeholder="루이비통 가방"
                      data-testid="input-review-product"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">별점</label>
                    <select
                      value={reviewFormData.rating}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, rating: Number(e.target.value) })}
                      className="w-full h-10 px-3 border rounded-md"
                      data-testid="select-review-rating"
                    >
                      <option value={5}>5점</option>
                      <option value={4}>4점</option>
                      <option value={3}>3점</option>
                      <option value={2}>2점</option>
                      <option value={1}>1점</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작성일 (표시용)</label>
                    <Input
                      type="datetime-local"
                      value={reviewFormData.displayDate}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, displayDate: e.target.value })}
                      data-testid="input-review-date"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <Input
                      value={reviewFormData.title}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, title: e.target.value })}
                      placeholder="후기 제목을 입력하세요"
                      data-testid="input-review-title"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <Textarea
                      value={reviewFormData.content}
                      onChange={(e) => setReviewFormData({ ...reviewFormData, content: e.target.value })}
                      placeholder="후기 내용을 입력하세요"
                      rows={4}
                      data-testid="input-review-content"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">이미지</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <label className="flex items-center justify-center px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-200 transition-colors">
                          <Upload className="w-4 h-4 mr-2" />
                          <span className="text-sm">{uploadingImage ? "업로드 중..." : "파일 선택"}</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/gif,image/webp"
                            onChange={handleImageUpload}
                            disabled={uploadingImage}
                            className="hidden"
                            data-testid="input-review-image-file"
                          />
                        </label>
                        <span className="text-xs text-gray-500">또는 URL 직접 입력</span>
                      </div>
                      <Input
                        value={reviewFormData.imageUrl}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, imageUrl: e.target.value })}
                        placeholder="https://... 또는 파일 업로드"
                        data-testid="input-review-image"
                      />
                      {reviewFormData.imageUrl && (
                        <div className="mt-2">
                          <img 
                            src={reviewFormData.imageUrl} 
                            alt="미리보기" 
                            className="max-w-[200px] max-h-[150px] object-cover rounded border"
                            onError={(e) => (e.currentTarget.style.display = 'none')}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={reviewFormData.isVisible}
                        onChange={(e) => setReviewFormData({ ...reviewFormData, isVisible: e.target.checked })}
                        className="w-4 h-4"
                        data-testid="input-review-visible"
                      />
                      <span className="text-sm">공개</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateReview} className="bg-yellow-500 hover:bg-yellow-600" data-testid="button-save-review">
                    <Check className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddReviewForm(false)} data-testid="button-cancel-review">
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">작성자</th>
                    <th className="px-4 py-3 text-left font-medium">제목</th>
                    <th className="px-4 py-3 text-left font-medium">별점</th>
                    <th className="px-4 py-3 text-left font-medium">작성일</th>
                    <th className="px-4 py-3 text-left font-medium">공개</th>
                    <th className="px-4 py-3 text-right font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reviews.map((review) => (
                    <tr key={review.id} className="hover:bg-gray-50">
                      {editingReviewId === review.id ? (
                        <>
                          <td className="px-4 py-3">
                            <Input
                              value={reviewFormData.authorName}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, authorName: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              value={reviewFormData.title}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, title: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={reviewFormData.rating}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, rating: Number(e.target.value) })}
                              className="h-8 px-2 border rounded"
                            >
                              <option value={5}>5점</option>
                              <option value={4}>4점</option>
                              <option value={3}>3점</option>
                              <option value={2}>2점</option>
                              <option value={1}>1점</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="datetime-local"
                              value={reviewFormData.displayDate}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, displayDate: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              checked={reviewFormData.isVisible}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, isVisible: e.target.checked })}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            <Button 
                              onClick={() => handleUpdateReview(review.id)} 
                              className="h-8 bg-green-600 hover:bg-green-700 text-white px-3"
                              data-testid="button-save-review-edit"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              저장
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingReviewId(null)} 
                              className="h-8 px-3"
                              data-testid="button-cancel-review-edit"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-medium">{review.authorName}</td>
                          <td className="px-4 py-3">{review.title}</td>
                          <td className="px-4 py-3">
                            <div className="flex text-yellow-400">
                              {[...Array(review.rating || 5)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 fill-current" />
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">
                            {review.displayDate ? new Date(review.displayDate).toLocaleDateString('ko-KR') : "-"}
                          </td>
                          <td className="px-4 py-3">
                            {review.isVisible ? (
                              <span className="text-green-600 text-sm">공개</span>
                            ) : (
                              <span className="text-gray-400 text-sm">비공개</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="icon" variant="ghost" onClick={() => startEditReview(review)} className="h-8 w-8">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteReview(review.id)} className="h-8 w-8 text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reviews.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Star className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>등록된 후기가 없습니다</p>
                </div>
              )}
            </div>
            
            {reviewPagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewPage <= 1}
                  onClick={() => {
                    const newPage = reviewPage - 1;
                    setReviewPage(newPage);
                    fetchReviews(newPage);
                  }}
                >
                  이전
                </Button>
                <span className="text-sm text-gray-600 px-4">
                  {reviewPage} / {reviewPagination.totalPages} 페이지 (총 {reviewPagination.total.toLocaleString()}개)
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={reviewPage >= reviewPagination.totalPages}
                  onClick={() => {
                    const newPage = reviewPage + 1;
                    setReviewPage(newPage);
                    fetchReviews(newPage);
                  }}
                >
                  다음
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === "notices" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">공지사항 관리</h2>
                <p className="text-sm text-gray-500">공지사항을 추가/수정할 수 있습니다</p>
              </div>
              <Button
                data-testid="button-add-notice"
                onClick={() => {
                  setShowAddNoticeForm(true);
                  setNoticeFormData({ title: "", content: "", category: "general", isPinned: false, isVisible: true, displayDate: new Date().toISOString().slice(0, 16), viewCount: 0 });
                }}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                공지 추가
              </Button>
            </div>

            {showAddNoticeForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6 border">
                <h3 className="font-bold mb-4">새 공지사항 추가</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                    <Input
                      value={noticeFormData.title}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
                      placeholder="공지사항 제목을 입력하세요"
                      data-testid="input-notice-title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">카테고리</label>
                    <select
                      value={noticeFormData.category}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, category: e.target.value })}
                      className="w-full h-10 px-3 border rounded-md"
                      data-testid="select-notice-category"
                    >
                      <option value="general">일반</option>
                      <option value="event">이벤트</option>
                      <option value="system">시스템</option>
                      <option value="important">중요</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">작성일 (표시용)</label>
                    <Input
                      type="datetime-local"
                      value={noticeFormData.displayDate}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, displayDate: e.target.value })}
                      data-testid="input-notice-date"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">조회수</label>
                    <Input
                      type="number"
                      min="0"
                      value={noticeFormData.viewCount}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, viewCount: parseInt(e.target.value) || 0 })}
                      data-testid="input-notice-viewcount"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">내용</label>
                    <Textarea
                      value={noticeFormData.content}
                      onChange={(e) => setNoticeFormData({ ...noticeFormData, content: e.target.value })}
                      placeholder="공지사항 내용을 입력하세요"
                      rows={6}
                      data-testid="input-notice-content"
                    />
                  </div>
                  <div className="flex items-center gap-6">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={noticeFormData.isPinned}
                        onChange={(e) => setNoticeFormData({ ...noticeFormData, isPinned: e.target.checked })}
                        className="w-4 h-4"
                        data-testid="input-notice-pinned"
                      />
                      <span className="text-sm">상단 고정</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={noticeFormData.isVisible}
                        onChange={(e) => setNoticeFormData({ ...noticeFormData, isVisible: e.target.checked })}
                        className="w-4 h-4"
                        data-testid="input-notice-visible"
                      />
                      <span className="text-sm">공개</span>
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleCreateNotice} className="bg-yellow-500 hover:bg-yellow-600" data-testid="button-save-notice">
                    <Check className="w-4 h-4 mr-2" />
                    저장
                  </Button>
                  <Button variant="outline" onClick={() => setShowAddNoticeForm(false)} data-testid="button-cancel-notice">
                    <X className="w-4 h-4 mr-2" />
                    취소
                  </Button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">제목</th>
                    <th className="px-4 py-3 text-left font-medium">카테고리</th>
                    <th className="px-4 py-3 text-left font-medium">작성일</th>
                    <th className="px-4 py-3 text-left font-medium">조회수</th>
                    <th className="px-4 py-3 text-left font-medium">상태</th>
                    <th className="px-4 py-3 text-right font-medium">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {notices.map((notice) => (
                    <tr key={notice.id} className="hover:bg-gray-50">
                      {editingNoticeId === notice.id ? (
                        <>
                          <td className="px-4 py-3">
                            <Input
                              value={noticeFormData.title}
                              onChange={(e) => setNoticeFormData({ ...noticeFormData, title: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              value={noticeFormData.category}
                              onChange={(e) => setNoticeFormData({ ...noticeFormData, category: e.target.value })}
                              className="h-8 px-2 border rounded"
                            >
                              <option value="general">일반</option>
                              <option value="event">이벤트</option>
                              <option value="system">시스템</option>
                              <option value="important">중요</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="datetime-local"
                              value={noticeFormData.displayDate}
                              onChange={(e) => setNoticeFormData({ ...noticeFormData, displayDate: e.target.value })}
                              className="h-8"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <Input
                              type="number"
                              min="0"
                              value={noticeFormData.viewCount}
                              onChange={(e) => setNoticeFormData({ ...noticeFormData, viewCount: parseInt(e.target.value) || 0 })}
                              className="h-8 w-20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={noticeFormData.isPinned}
                                  onChange={(e) => setNoticeFormData({ ...noticeFormData, isPinned: e.target.checked })}
                                  className="w-3 h-3"
                                />
                                <span className="text-xs">고정</span>
                              </label>
                              <label className="flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={noticeFormData.isVisible}
                                  onChange={(e) => setNoticeFormData({ ...noticeFormData, isVisible: e.target.checked })}
                                  className="w-3 h-3"
                                />
                                <span className="text-xs">공개</span>
                              </label>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right flex gap-2 justify-end">
                            <Button 
                              onClick={() => handleUpdateNotice(notice.id)} 
                              className="h-8 bg-green-600 hover:bg-green-700 text-white px-3"
                              data-testid="button-save-notice-edit"
                            >
                              <Check className="w-4 h-4 mr-1" />
                              저장
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditingNoticeId(null)} 
                              className="h-8 px-3"
                              data-testid="button-cancel-notice-edit"
                            >
                              <X className="w-4 h-4 mr-1" />
                              취소
                            </Button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {notice.isPinned && <span className="text-red-500 text-xs font-bold">[고정]</span>}
                              <span className="font-medium">{notice.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded ${
                              notice.category === "important" ? "bg-red-100 text-red-700" :
                              notice.category === "event" ? "bg-green-100 text-green-700" :
                              notice.category === "system" ? "bg-blue-100 text-blue-700" :
                              "bg-gray-100 text-gray-700"
                            }`}>
                              {notice.category === "general" ? "일반" :
                               notice.category === "event" ? "이벤트" :
                               notice.category === "system" ? "시스템" : "중요"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">
                            {notice.displayDate ? new Date(notice.displayDate).toLocaleDateString('ko-KR') : "-"}
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-sm">{notice.viewCount || 0}</td>
                          <td className="px-4 py-3">
                            {notice.isVisible ? (
                              <span className="text-green-600 text-sm">공개</span>
                            ) : (
                              <span className="text-gray-400 text-sm">비공개</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button size="icon" variant="ghost" onClick={() => startEditNotice(notice)} className="h-8 w-8">
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDeleteNotice(notice.id)} className="h-8 w-8 text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {notices.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>등록된 공지사항이 없습니다</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-4 md:p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-yellow-600" />
                      실시간 1:1 상담
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">고객과 실시간으로 상담하세요.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Circle className={`w-3 h-3 ${isChatConnected ? "text-green-500 fill-green-500" : "text-red-500 fill-red-500"}`} />
                    <span className="text-sm text-gray-600">
                      {isChatConnected ? "연결됨" : "연결 끊김"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row" style={{ height: "calc(100vh - 350px)", minHeight: "500px" }}>
                <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto">
                  <div className="p-3 bg-gray-50 border-b border-gray-200">
                    <h4 className="font-semibold text-sm text-gray-700">상담 목록</h4>
                  </div>
                  {chatConversations.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <MessageCircle className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                      <p className="text-sm">아직 상담 요청이 없습니다</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {chatConversations.map((conv) => (
                        <div
                          key={conv.id}
                          data-testid={`chat-conversation-${conv.id}`}
                          onClick={() => selectConversation(conv)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conv.id ? "bg-yellow-50 border-l-4 border-yellow-500" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900 truncate">
                                  {conv.guestName || conv.memberId || "익명"}
                                </span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  conv.status === "open" 
                                    ? "bg-green-100 text-green-700" 
                                    : conv.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}>
                                  {conv.status === "open" ? "진행중" : conv.status === "pending" ? "대기중" : "종료"}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">{conv.subject}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {conv.updatedAt ? new Date(conv.updatedAt).toLocaleString("ko-KR") : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  {selectedConversation ? (
                    <>
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {selectedConversation.guestName || selectedConversation.memberId || "익명"}
                          </h4>
                          <p className="text-sm text-gray-600">{selectedConversation.subject}</p>
                        </div>
                        {selectedConversation.status !== "closed" && (
                          <Button
                            data-testid="button-close-conversation"
                            variant="outline"
                            size="sm"
                            onClick={() => closeConversation(selectedConversation.id)}
                            className="text-red-600 border-red-200 hover:bg-red-50"
                          >
                            <X className="w-4 h-4 mr-1" />
                            상담 종료
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            data-testid={`chat-message-${msg.id}`}
                            className={`flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.senderType === "admin" 
                                ? "bg-yellow-500 text-black" 
                                : "bg-white text-gray-900 border border-gray-200"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                              <p className={`text-xs mt-1 ${
                                msg.senderType === "admin" ? "text-yellow-900" : "text-gray-400"
                              }`}>
                                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ko-KR") : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                        <div ref={chatMessagesEndRef} />
                      </div>
                      
                      {selectedConversation.status !== "closed" && (
                        <div className="p-4 border-t border-gray-200 bg-white">
                          <div className="flex gap-2">
                            <Input
                              data-testid="input-chat-message"
                              value={newMessage}
                              onChange={(e) => setNewMessage(e.target.value)}
                              placeholder="메시지를 입력하세요..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  sendChatMessage();
                                }
                              }}
                              className="flex-1"
                            />
                            <Button
                              data-testid="button-send-message"
                              onClick={sendChatMessage}
                              disabled={!newMessage.trim() || !isChatConnected}
                              className="bg-yellow-500 hover:bg-yellow-600 text-black"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex-1 flex items-center justify-center bg-gray-50">
                      <div className="text-center text-gray-500">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="font-medium">상담을 선택하세요</p>
                        <p className="text-sm mt-1">왼쪽 목록에서 상담을 클릭하여 대화를 시작하세요</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Settings className="w-5 h-5 text-yellow-600" />
                  사이트 설정
                </h3>
                <p className="text-sm text-gray-500 mt-1">카카오톡 문의 링크 및 사이트 설정을 관리합니다.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-black" fill="currentColor">
                        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.83 5.33 4.56 6.78-.12.47-.44 1.75-.51 2.02-.08.32.12.64.46.64.25 0 .5-.11.67-.27.11-.1 1.41-1.14 2.1-1.7.56.07 1.14.11 1.72.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">카카오톡 문의 링크</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        사이트 전체의 "카카오톡 문의" 버튼을 눌렀을 때 이동할 카카오톡 오픈채팅 링크를 설정합니다.
                      </p>
                      <div className="flex gap-3">
                        <div className="flex-1">
                          <Input
                            data-testid="input-kakao-link"
                            type="url"
                            value={siteSettings.kakaoTalkLink}
                            onChange={(e) => setSiteSettings(prev => ({ ...prev, kakaoTalkLink: e.target.value }))}
                            placeholder="https://open.kakao.com/o/your-link"
                            className="w-full"
                          />
                          <p className="text-xs text-gray-500 mt-2">
                            예: https://open.kakao.com/o/samplelink 형식의 오픈채팅 링크를 입력하세요.
                          </p>
                        </div>
                        <Button
                          data-testid="button-save-kakao-link"
                          onClick={saveSiteSettings}
                          disabled={settingsLoading}
                          className="bg-yellow-500 hover:bg-yellow-600 text-black"
                        >
                          {settingsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "저장"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Link2 className="w-4 h-4" />
                    현재 설정된 링크
                  </h4>
                  <div className="flex items-center gap-3">
                    <code className="flex-1 bg-white px-3 py-2 rounded border text-sm font-mono truncate">
                      {siteSettings.kakaoTalkLink || "설정된 링크 없음"}
                    </code>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(siteSettings.kakaoTalkLink, "_blank")}
                      disabled={!siteSettings.kakaoTalkLink}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      테스트
                    </Button>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h4 className="font-semibold text-gray-700 mb-3">도움말</h4>
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>카카오톡 오픈채팅 링크는 카카오톡 앱에서 생성할 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>링크 변경 시 사이트 전체의 모든 "카카오톡 문의" 버튼에 즉시 반영됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-yellow-500 mt-1">•</span>
                      <span>올바른 URL 형식인지 "테스트" 버튼으로 확인하세요.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  입금 계좌 설정
                </h3>
                <p className="text-sm text-gray-500 mt-1">회원들이 입금신청 시 안내받을 계좌 정보를 설정합니다.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">은행명</label>
                      <Input
                        data-testid="input-deposit-bank"
                        type="text"
                        value={depositAccountSettings.bankName}
                        onChange={(e) => setDepositAccountSettings(prev => ({ ...prev, bankName: e.target.value }))}
                        placeholder="예: 국민은행"
                        className="w-full max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                      <Input
                        data-testid="input-deposit-account-number"
                        type="text"
                        value={depositAccountSettings.accountNumber}
                        onChange={(e) => setDepositAccountSettings(prev => ({ ...prev, accountNumber: e.target.value }))}
                        placeholder="예: 123-456-789012"
                        className="w-full max-w-md"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                      <Input
                        data-testid="input-deposit-holder"
                        type="text"
                        value={depositAccountSettings.accountHolder}
                        onChange={(e) => setDepositAccountSettings(prev => ({ ...prev, accountHolder: e.target.value }))}
                        placeholder="예: LIKE IT"
                        className="w-full max-w-md"
                      />
                    </div>
                    <Button
                      data-testid="button-save-deposit-account"
                      onClick={saveDepositAccountSettings}
                      disabled={depositAccountLoading}
                      className="bg-amber-500 hover:bg-amber-600 text-white"
                    >
                      {depositAccountLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                      저장
                    </Button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    현재 설정된 계좌
                  </h4>
                  {depositAccountSettings.bankName && depositAccountSettings.accountNumber ? (
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-16">은행:</span>
                        <span className="font-medium">{depositAccountSettings.bankName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-16">계좌:</span>
                        <span className="font-medium">{depositAccountSettings.accountNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500 w-16">예금주:</span>
                        <span className="font-medium">{depositAccountSettings.accountHolder}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">설정된 계좌가 없습니다. 위에서 계좌 정보를 입력해주세요.</p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>설정한 계좌정보는 회원 입금신청 페이지에 표시됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-500 mt-1">•</span>
                      <span>계좌정보 변경 시 즉시 반영됩니다.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  마케팅 픽셀 설정
                </h3>
                <p className="text-sm text-gray-500 mt-1">페이스북 픽셀, 구글 애널리틱스, 카카오 픽셀을 켜고 끌 수 있습니다.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">페이스북 픽셀</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pixelSettings.facebookPixelEnabled}
                            onChange={(e) => setPixelSettings(prev => ({ ...prev, facebookPixelEnabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                      <Input
                        value={pixelSettings.facebookPixelId}
                        onChange={(e) => setPixelSettings(prev => ({ ...prev, facebookPixelId: e.target.value }))}
                        placeholder="페이스북 픽셀 ID (예: 1234567890)"
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500">페이스북 비즈니스 관리자에서 픽셀 ID를 확인할 수 있습니다.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">구글 애널리틱스</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pixelSettings.googleAnalyticsEnabled}
                            onChange={(e) => setPixelSettings(prev => ({ ...prev, googleAnalyticsEnabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        </label>
                      </div>
                      <Input
                        value={pixelSettings.googleAnalyticsId}
                        onChange={(e) => setPixelSettings(prev => ({ ...prev, googleAnalyticsId: e.target.value }))}
                        placeholder="GA ID (예: G-XXXXXXXXXX)"
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500">구글 애널리틱스 4의 측정 ID를 입력하세요.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-6 h-6 text-black" fill="currentColor">
                        <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.83 5.33 4.56 6.78-.12.47-.44 1.75-.51 2.02-.08.32.12.64.46.64.25 0 .5-.11.67-.27.11-.1 1.41-1.14 2.1-1.7.56.07 1.14.11 1.72.11 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-gray-900">카카오 픽셀</h4>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pixelSettings.kakaoPixelEnabled}
                            onChange={(e) => setPixelSettings(prev => ({ ...prev, kakaoPixelEnabled: e.target.checked }))}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-yellow-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
                        </label>
                      </div>
                      <Input
                        value={pixelSettings.kakaoPixelId}
                        onChange={(e) => setPixelSettings(prev => ({ ...prev, kakaoPixelId: e.target.value }))}
                        placeholder="카카오 픽셀 ID"
                        className="mb-2"
                      />
                      <p className="text-xs text-gray-500">카카오모먼트에서 픽셀 ID를 확인할 수 있습니다.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={savePixelSettings}
                    disabled={pixelLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {pixelLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    마케팅 설정 저장
                  </Button>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>픽셀을 활성화하면 사이트 전체에 해당 스크립트가 적용됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>비활성화하면 즉시 스크립트가 제거됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>각 서비스의 관리 페이지에서 픽셀 ID를 확인하세요.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-red-600" />
                  전체 세일 설정
                </h3>
                <p className="text-sm text-gray-500 mt-1">모든 상품에 일괄 할인율을 적용합니다.</p>
              </div>
              
              <div className="p-6 space-y-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-bold text-sm">%</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900 mb-2">전체 상품 할인율</h4>
                      <p className="text-sm text-gray-600 mb-4">
                        설정한 할인율이 모든 상품에 적용됩니다. 0%로 설정하면 할인이 해제됩니다.
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <Input
                            data-testid="input-global-sale-percent"
                            type="number"
                            min="0"
                            max="90"
                            value={globalSalePercent}
                            onChange={(e) => setGlobalSalePercent(Math.max(0, Math.min(90, parseInt(e.target.value) || 0)))}
                            className="w-24 text-center text-lg font-bold"
                          />
                          <span className="text-lg font-bold text-gray-700">%</span>
                        </div>
                        <Button
                          data-testid="button-save-global-sale"
                          onClick={saveGlobalSaleSetting}
                          disabled={globalSaleLoading}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          {globalSaleLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                          적용
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    현재 할인 상태
                  </h4>
                  {globalSalePercent > 0 ? (
                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-full">
                        SALE {globalSalePercent}% OFF
                      </span>
                      <span className="text-sm text-gray-600">모든 상품에 할인이 적용 중입니다.</span>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">현재 할인이 적용되지 않은 상태입니다.</p>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>할인율은 1~90% 사이로 설정할 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>적용 시 모든 상품 페이지에 원래 가격과 할인가가 함께 표시됩니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>0%로 설정하면 할인이 해제됩니다.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Product Count and Management */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Database className="w-5 h-5 text-blue-600" />
                  상품 관리
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-blue-600" />
                    <div>
                      <h4 className="font-bold text-gray-900">현재 상품 수</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {productCountLoading ? (
                          <span className="flex items-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            로딩중...
                          </span>
                        ) : (
                          `${productCount !== null ? productCount.toLocaleString() : "0"}개`
                        )}
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fetchProductCount()}
                      className="ml-auto"
                      disabled={productCountLoading}
                    >
                      <RefreshCw className={`w-4 h-4 ${productCountLoading ? 'animate-spin' : ''}`} />
                    </Button>
                  </div>
                  <div className="mt-4">
                    <Button
                      data-testid="button-clear-products"
                      onClick={clearAllProducts}
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      전체 상품 삭제
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Discount Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-green-600" />
                  카테고리별 할인 관리
                </h3>
                <p className="text-sm text-gray-500 mt-1">각 카테고리별로 할인율을 설정하여 일괄 적용할 수 있습니다.</p>
              </div>
              
              <div className="p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                  <p className="text-sm text-yellow-800">
                    <strong>주의:</strong> 할인 적용 시 현재 가격에서 입력한 할인율만큼 가격이 감소합니다. 이 작업은 되돌릴 수 없습니다.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <div key={cat.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-800">{cat.name}</span>
                        <span className="text-xs text-gray-500">카테고리: {cat.id}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Input
                          data-testid={`input-discount-${cat.id}`}
                          type="number"
                          value={categoryDiscounts[cat.id] || ''}
                          onChange={(e) => setCategoryDiscounts(prev => ({ ...prev, [cat.id]: Number(e.target.value) }))}
                          className="w-20"
                          min={0}
                          max={100}
                          placeholder="0"
                        />
                        <span className="text-sm text-gray-600">%</span>
                        <Button
                          data-testid={`button-apply-discount-${cat.id}`}
                          onClick={() => applyCategoryDiscount(cat.id, cat.name)}
                          disabled={applyingCategoryDiscount === cat.id || !categoryDiscounts[cat.id]}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          {applyingCategoryDiscount === cat.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            '적용'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>사용 예시:</strong> 정품 카테고리에 20% 할인을 적용하려면, "정품" 항목에 20을 입력하고 "적용" 버튼을 클릭하세요.
                  </p>
                </div>
              </div>
            </div>

            {/* Bagstyle.site Crawl Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Download className="w-5 h-5 text-teal-600" />
                  bagstyle.site 크롤링
                </h3>
                <p className="text-sm text-gray-500 mt-1">bagstyle.site에서 상품, 배너, 카테고리를 크롤링합니다. (시계 카테고리 제외)</p>
              </div>

              <div className="p-6 space-y-6">
                <div className="border border-teal-200 bg-teal-50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-teal-800 flex items-center gap-2">
                    <Image className="w-4 h-4" />
                    배너 & 카테고리 이미지 크롤링
                  </h4>
                  <p className="text-sm text-gray-600">bagstyle.site 메인 페이지의 배너 이미지와 카테고리 이미지를 가져옵니다.</p>
                  <Button
                    data-testid="button-crawl-bagstyle-banners"
                    onClick={crawlBagstyleBanners}
                    disabled={bagstyleBannerLoading}
                    className="bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    {bagstyleBannerLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        크롤링 중...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        배너/카테고리 가져오기
                      </>
                    )}
                  </Button>
                </div>

                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="clearBeforeBagstyle"
                        checked={clearBeforeBagstyle}
                        onChange={(e) => setClearBeforeBagstyle(e.target.checked)}
                        className="w-4 h-4 text-teal-600 rounded"
                      />
                      <label htmlFor="clearBeforeBagstyle" className="text-sm text-gray-700">
                        크롤링 전 기존 상품 모두 삭제
                      </label>
                    </div>

                    <div className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-gray-800">카테고리 선택 (선택안하면 전체)</h5>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={selectAllBagstyleCategories}>전체 선택</Button>
                          <Button size="sm" variant="outline" onClick={deselectAllBagstyleCategories}>선택 해제</Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                        {BAGSTYLE_CATEGORIES.map((cat) => (
                          <label
                            key={cat.localId}
                            className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                              selectedBagstyleCategories.includes(cat.localId)
                                ? 'bg-teal-50 border-teal-300'
                                : 'bg-white border-gray-200 hover:border-teal-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedBagstyleCategories.includes(cat.localId)}
                              onChange={() => toggleBagstyleCategory(cat.localId)}
                              className="w-4 h-4 text-teal-600 rounded"
                            />
                            <span className="text-sm">{cat.name}</span>
                          </label>
                        ))}
                      </div>
                      {selectedBagstyleCategories.length > 0 && (
                        <p className="text-xs text-teal-600 mt-2">
                          선택된 카테고리: {selectedBagstyleCategories.map(id => BAGSTYLE_CATEGORIES.find(c => c.localId === id)?.name).join(', ')}
                        </p>
                      )}
                    </div>

                    {bagstyleProgress.status !== 'idle' && (
                      <div className={`p-4 rounded-lg ${
                        bagstyleProgress.status === 'running' ? 'bg-teal-50 border border-teal-200' :
                        bagstyleProgress.status === 'completed' ? 'bg-green-50 border border-green-200' :
                        'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-center gap-2 mb-2">
                          {bagstyleProgress.status === 'running' && <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />}
                          {bagstyleProgress.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                          {bagstyleProgress.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                          <span className={`text-sm font-medium ${
                            bagstyleProgress.status === 'running' ? 'text-teal-700' :
                            bagstyleProgress.status === 'completed' ? 'text-green-700' :
                            'text-red-700'
                          }`}>
                            {bagstyleProgress.message}
                          </span>
                        </div>

                        {bagstyleProgress.status === 'running' && bagstyleProgress.total > 0 && (
                          <div className="space-y-2">
                            <div className="w-full bg-teal-100 rounded-full h-3">
                              <div
                                className="bg-teal-500 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${Math.round((bagstyleProgress.current / bagstyleProgress.total) * 100)}%` }}
                              />
                            </div>
                            <div className="flex justify-between text-xs text-teal-600">
                              <span>{bagstyleProgress.current.toLocaleString()} / {bagstyleProgress.total.toLocaleString()}</span>
                              <span>{Math.round((bagstyleProgress.current / bagstyleProgress.total) * 100)}%</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        data-testid="button-start-bagstyle-crawl"
                        onClick={startBagstyleCrawl}
                        disabled={bagstyleProgress.status === 'running'}
                        className="bg-teal-600 hover:bg-teal-700 text-white flex-1"
                      >
                        {bagstyleProgress.status === 'running' ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            크롤링 중...
                          </>
                        ) : (
                          <>
                            <Download className="w-4 h-4 mr-2" />
                            {selectedBagstyleCategories.length > 0
                              ? `선택 카테고리 크롤링 (${selectedBagstyleCategories.length}개)`
                              : 'bagstyle 전체 크롤링 시작'}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <ul className="text-sm text-gray-600 space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-teal-500 mt-1">•</span>
                      <span>bagstyle.site에서 10개 카테고리(시계 제외)의 상품을 크롤링합니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-500 mt-1">•</span>
                      <span>배너 이미지와 카테고리 이미지도 별도로 가져올 수 있습니다.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-teal-500 mt-1">•</span>
                      <span>브랜드 정보도 자동으로 생성됩니다.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "staff" && adminRole === "super_admin" && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-600" />
                    직원 관리
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">후기 관리 권한을 가진 직원을 추가하고 관리합니다.</p>
                </div>
                <Button
                  data-testid="button-add-staff"
                  onClick={() => setShowAddStaffForm(!showAddStaffForm)}
                  className="bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  직원 추가
                </Button>
              </div>

              {showAddStaffForm && (
                <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                  <h4 className="font-semibold mb-4">새 직원 추가</h4>
                  <form onSubmit={handleAddStaff} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">아이디 *</label>
                        <Input
                          data-testid="input-staff-username"
                          placeholder="로그인 아이디"
                          value={staffFormData.username}
                          onChange={(e) => setStaffFormData({ ...staffFormData, username: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 *</label>
                        <Input
                          data-testid="input-staff-password"
                          type="password"
                          placeholder="로그인 비밀번호"
                          value={staffFormData.password}
                          onChange={(e) => setStaffFormData({ ...staffFormData, password: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                        <Input
                          data-testid="input-staff-name"
                          placeholder="직원 이름"
                          value={staffFormData.name}
                          onChange={(e) => setStaffFormData({ ...staffFormData, name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">권한</label>
                        <select
                          data-testid="select-staff-role"
                          className="w-full border rounded-md px-3 py-2"
                          value={staffFormData.staffRole}
                          onChange={(e) => setStaffFormData({ ...staffFormData, staffRole: e.target.value })}
                        >
                          <option value="review_admin">후기 관리자 (후기만 관리 가능)</option>
                          <option value="super_admin">슈퍼 관리자 (전체 권한)</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button data-testid="button-save-staff" type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                        <Check className="w-4 h-4 mr-2" />
                        저장
                      </Button>
                      <Button 
                        data-testid="button-cancel-staff"
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setShowAddStaffForm(false);
                          setStaffFormData({ username: "", password: "", name: "", staffRole: "review_admin" });
                        }}
                      >
                        <X className="w-4 h-4 mr-2" />
                        취소
                      </Button>
                    </div>
                  </form>
                </div>
              )}

              <div className="p-6">
                {staffLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                    <span className="ml-2">로딩 중...</span>
                  </div>
                ) : staffUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>등록된 직원이 없습니다.</p>
                    <p className="text-sm">위의 '직원 추가' 버튼을 클릭하여 새 직원을 등록하세요.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">아이디</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">이름</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">권한</th>
                          <th className="text-left px-4 py-3 text-sm font-semibold text-gray-700">등록일</th>
                          <th className="text-center px-4 py-3 text-sm font-semibold text-gray-700">관리</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {staffUsers.map((staff) => (
                          <tr key={staff.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium">{staff.username}</td>
                            <td className="px-4 py-3 text-sm">{staff.name || "-"}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                staff.role === "super_admin" 
                                  ? "bg-purple-100 text-purple-800" 
                                  : "bg-blue-100 text-blue-800"
                              }`}>
                                {staff.role === "super_admin" ? "슈퍼 관리자" : "후기 관리자"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {staff.createdAt ? new Date(staff.createdAt).toLocaleDateString("ko-KR") : "-"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <Button
                                data-testid={`button-delete-staff-${staff.id}`}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteStaff(staff.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <h4 className="font-semibold text-blue-800 mb-2">권한 안내</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>슈퍼 관리자</strong>: 모든 메뉴에 접근 가능 (상품, 회원, 주문, 설정 등)</li>
                <li>• <strong>후기 관리자</strong>: 후기 관리 메뉴만 접근 가능</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
