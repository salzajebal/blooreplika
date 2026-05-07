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
  MessageCircle, Send, Circle, Volume2, Wallet, Download, Loader2, Search, Shield, Image, Globe, Gift,
  ChevronUp, ChevronDown, Type, Minus, MousePointer, Palette, GripVertical
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, Member, Review, Notice, ChatConversation, ChatMessage, Order, CouponPayment } from "@shared/schema";
import { ShoppingCart } from "lucide-react";
import { useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  rectSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  { id: "men", name: "남성" },
  { id: "women", name: "여성" },
  { id: "clothing", name: "의류" },
  { id: "bags", name: "가방" },
  { id: "wallets", name: "지갑" },
  { id: "shoes", name: "신발" },
  { id: "watches", name: "시계" },
  { id: "golf", name: "골프" },
  { id: "jewelry", name: "쥬얼리/잡화" },
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
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "brands" | "members" | "orders" | "couponPayments" | "reviews" | "notices" | "chat" | "settings" | "staff" | "contentSections" | "magazines" | "labs" | "quickMenu" | "telegram">("dashboard");
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

  // 전체 삭제 확인 다이얼로그
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [deleteAllConfirmText, setDeleteAllConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // 일괄 선택
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(new Set());
  const [bulkActionType, setBulkActionType] = useState<"category" | "section">("category");
  const [bulkCategoryValue, setBulkCategoryValue] = useState<string>("");
  const [bulkSectionId, setBulkSectionId] = useState<string>("");
  const [adminSections, setAdminSections] = useState<{ id: string; title: string; sectionType: string }[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

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
    gender: "" as string,
    description: "",
    imageUrl: "",
    imageUrls: [] as string[],
    optionSizes: "",
    optionColors: "",
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
  const [bloostoreReviewCrawl, setBloostoreReviewCrawl] = useState<{
    status: 'idle' | 'running' | 'done' | 'error';
    total: number; current: number; message: string; inserted: number; skipped: number;
  }>({ status: 'idle', total: 0, current: 0, message: '', inserted: 0, skipped: 0 });
  const [bloostoreReviewMaxPages, setBloostoreReviewMaxPages] = useState(5);
  const [bloostoreReviewClearExisting, setBloostoreReviewClearExisting] = useState(false);

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

  const [catalogStats, setCatalogStats] = useState<{
    totalProducts: number;
    feedUrl: string;
    categories: { id: string; name: string; count: number; feedUrl: string }[];
  } | null>(null);
  const [catalogCopied, setCatalogCopied] = useState<string | null>(null);

  const [tgSettings, setTgSettings] = useState({
    token: "", chatId: "", enabled: false,
    notifyOrder: true, notifyMember: true, notifyChat: true,
  });
  const [tgStep, setTgStep] = useState<1|2|3>(1);
  const [tgBotInfo, setTgBotInfo] = useState<{ username: string; firstName: string } | null>(null);
  const [tgChats, setTgChats] = useState<{ id: string; title: string; type: string }[]>([]);
  const [tgLoading, setTgLoading] = useState(false);
  const [tgSaving, setTgSaving] = useState(false);
  const [tgMsg, setTgMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [detailBannerSettings, setDetailBannerSettings] = useState({ banner1: "", banner2: "" });
  
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
    subcatLog: string[];
    grandTotal: number;
  }>({ status: 'idle', total: 0, current: 0, message: '', category: '', subcatLog: [], grandTotal: 0 });
  const bagstyleIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const subcatLogRef = useRef<HTMLDivElement | null>(null);
  const [canResume, setCanResume] = useState(false);
  const [resumeCompletedCount, setResumeCompletedCount] = useState(0);

  const BAGSTYLE_CRAWL_TREE = [
    { parentCaId: "b010", name: "남성의류", gender: "남성", subcategories: [
      { caId: "b01010", name: "자켓/점퍼" }, { caId: "b01020", name: "패딩/털" },
      { caId: "b01030", name: "가죽옷" }, { caId: "b01040", name: "코트/정장" },
      { caId: "b01050", name: "후드티/집업" }, { caId: "b01060", name: "셔츠/남방" },
      { caId: "b01070", name: "베스트/조끼" }, { caId: "b01080", name: "니트/스웨터" },
      { caId: "b01090", name: "가디건" }, { caId: "b010a0", name: "반팔티/폴로티" },
      { caId: "b010b0", name: "긴팔티/맨투맨" }, { caId: "b010c0", name: "운동복/추리닝" },
      { caId: "b010d0", name: "팬츠/청바지" }, { caId: "b010e0", name: "반바지" },
      { caId: "b010f0", name: "세트" },
    ]},
    { parentCaId: "b020", name: "남성가방", gender: "남성", subcategories: [
      { caId: "b02010", name: "토트백" }, { caId: "b02020", name: "크로스백" },
      { caId: "b02030", name: "숄더백" }, { caId: "b02040", name: "백팩" },
      { caId: "b02050", name: "서류가방/메신져백" }, { caId: "b02060", name: "파우치/클러치" },
      { caId: "b02070", name: "여행가방" }, { caId: "b02080", name: "캐리어" },
      { caId: "b02090", name: "벨트백/새들/슬링" }, { caId: "b020a0", name: "기타" },
    ]},
    { parentCaId: "b040", name: "남성지갑", gender: "남성", subcategories: [
      { caId: "b04010", name: "장지갑/소지갑" }, { caId: "b04020", name: "카드지갑" },
      { caId: "b04030", name: "동전지갑" },
    ]},
    { parentCaId: "b0b0", name: "남성신발", gender: "남성", subcategories: [
      { caId: "b0b010", name: "스니커즈" }, { caId: "b0b020", name: "운동화" },
      { caId: "b0b030", name: "정장구두" }, { caId: "b0b040", name: "샌들/슬리퍼" },
      { caId: "b0b050", name: "부츠/워커" }, { caId: "b0b060", name: "로퍼/슬립온" },
    ]},
    { parentCaId: "b0a0", name: "남성선글라스", gender: "남성", subcategories: [
      { caId: "b0a010", name: "선글라스" }, { caId: "b0a020", name: "안경태" },
    ]},
    { parentCaId: "b070", name: "남성벨트", gender: "남성", subcategories: [
      { caId: "b07010", name: "가죽벨트" }, { caId: "b07020", name: "메쉬벨트" },
    ]},
    { parentCaId: "b080", name: "남성쥬얼리/잡화", gender: "남성", subcategories: [
      { caId: "b08010", name: "목걸이" }, { caId: "b08020", name: "팔찌" },
      { caId: "b08030", name: "반지" }, { caId: "b08040", name: "백참/브로치" },
      { caId: "b08050", name: "만년필/볼펜" }, { caId: "b08060", name: "장갑" },
      { caId: "b08080", name: "라이터/듀퐁" }, { caId: "b08090", name: "스카프/머플러" },
      { caId: "b080a0", name: "넥타이" }, { caId: "b080b0", name: "모자" },
      { caId: "b080c0", name: "우산" }, { caId: "b080d0", name: "커프스" },
      { caId: "b080e0", name: "키홀더" }, { caId: "b080f0", name: "기타" },
    ]},
    { parentCaId: "c010", name: "여성의류", gender: "여성", subcategories: [
      { caId: "c01010", name: "자켓/점퍼" }, { caId: "c01020", name: "패딩/털" },
      { caId: "c01030", name: "코트" }, { caId: "c01040", name: "후드티" },
      { caId: "c01050", name: "셔츠/남방" }, { caId: "c01060", name: "조끼" },
      { caId: "c01070", name: "가죽옷" }, { caId: "c01080", name: "니트/스웨터" },
      { caId: "c01090", name: "가디건" }, { caId: "c010a0", name: "반팔티/폴로" },
      { caId: "c010b0", name: "긴팔티/맨투맨" }, { caId: "c010c0", name: "운동복/추리닝" },
      { caId: "c010d0", name: "팬츠/청바지" }, { caId: "c010e0", name: "반바지/스커트" },
      { caId: "c010f0", name: "원피스" }, { caId: "c010g0", name: "수영복" },
    ]},
    { parentCaId: "c020", name: "여성가방", gender: "여성", subcategories: [
      { caId: "c02010", name: "숄더백" }, { caId: "c02020", name: "토트백" },
      { caId: "c02030", name: "클러치백" }, { caId: "c02040", name: "백팩" },
      { caId: "c02050", name: "파우치" }, { caId: "c02060", name: "크로스" },
      { caId: "c02070", name: "메신져백" }, { caId: "c02080", name: "여행가방" },
      { caId: "c02090", name: "케리어" }, { caId: "c020a0", name: "벨트백/새들/슬링" },
      { caId: "c020b0", name: "미니백" }, { caId: "c020c0", name: "기타" },
    ]},
    { parentCaId: "c030", name: "여성지갑", gender: "여성", subcategories: [
      { caId: "c03010", name: "장지갑/소지갑" }, { caId: "c03020", name: "카드지갑" },
      { caId: "c03030", name: "동전지갑" },
    ]},
    { parentCaId: "c050", name: "여성신발", gender: "여성", subcategories: [
      { caId: "c05010", name: "스니커즈" }, { caId: "c05020", name: "운동화" },
      { caId: "c05030", name: "샌들/슬리퍼" }, { caId: "c05040", name: "펌프스/힐" },
      { caId: "c05050", name: "부츠/워커" }, { caId: "c05060", name: "단화/플랫" },
      { caId: "c05070", name: "로퍼/슬립온" },
    ]},
    { parentCaId: "c070", name: "여성선글라스", gender: "여성", subcategories: [
      { caId: "c07010", name: "선글라스" }, { caId: "c07020", name: "안경태" },
    ]},
    { parentCaId: "c060", name: "여성벨트", gender: "여성", subcategories: [
      { caId: "c06010", name: "가죽벨트" }, { caId: "c06020", name: "메쉬벨트" },
    ]},
    { parentCaId: "f0a0", name: "여성쥬얼리-목걸이", gender: "여성", subcategories: [
      { caId: "f0a0", name: "목걸이" },
    ]},
    { parentCaId: "f0d0", name: "여성쥬얼리-귀걸이", gender: "여성", subcategories: [
      { caId: "f0d0", name: "귀걸이" },
    ]},
    { parentCaId: "f0b0", name: "여성쥬얼리-팔찌", gender: "여성", subcategories: [
      { caId: "f0b0", name: "팔찌" },
    ]},
    { parentCaId: "f0c0", name: "여성쥬얼리-반지", gender: "여성", subcategories: [
      { caId: "f0c0", name: "반지" },
    ]},
    { parentCaId: "f090", name: "여성잡화-백참/브로치", gender: "여성", subcategories: [
      { caId: "f090", name: "백참/브로치" },
    ]},
    { parentCaId: "f030", name: "여성잡화-스카프/머플러", gender: "여성", subcategories: [
      { caId: "f030", name: "스카프/머플러" },
    ]},
    { parentCaId: "f070", name: "여성잡화-모자", gender: "여성", subcategories: [
      { caId: "f070", name: "모자" },
    ]},
    { parentCaId: "f0e0", name: "여성잡화-키홀더", gender: "여성", subcategories: [
      { caId: "f0e0", name: "키홀더" },
    ]},
    { parentCaId: "f050", name: "여성잡화-만년필/볼펜", gender: "여성", subcategories: [
      { caId: "f050", name: "만년필/볼펜" },
    ]},
    { parentCaId: "f080", name: "여성잡화-장갑", gender: "여성", subcategories: [
      { caId: "f080", name: "장갑" },
    ]},
    { parentCaId: "f0f0", name: "여성잡화-우산", gender: "여성", subcategories: [
      { caId: "f0f0", name: "우산" },
    ]},
    { parentCaId: "f0h0", name: "여성잡화-기타", gender: "여성", subcategories: [
      { caId: "f0h0", name: "기타" },
    ]},
    { parentCaId: "7010", name: "골프 남성의류", gender: "골프", subcategories: [
      { caId: "701010", name: "자켓/점퍼" }, { caId: "701020", name: "반팔티" },
      { caId: "701030", name: "긴팔티" }, { caId: "701040", name: "긴바지" },
      { caId: "701050", name: "비옷" }, { caId: "701060", name: "조끼" },
      { caId: "701070", name: "반바지" }, { caId: "701080", name: "패딩/아우터" },
      { caId: "701090", name: "니트/스웨터" }, { caId: "7010a0", name: "셋트" },
    ]},
    { parentCaId: "7020", name: "골프 여성의류", gender: "골프", subcategories: [
      { caId: "702010", name: "자켓/점퍼" }, { caId: "702020", name: "반팔티" },
      { caId: "702030", name: "긴팔티" }, { caId: "702040", name: "긴바지" },
      { caId: "702050", name: "반바지" }, { caId: "702060", name: "조끼" },
      { caId: "702070", name: "비옷" }, { caId: "702080", name: "패딩아우터" },
      { caId: "702090", name: "원피스" }, { caId: "7020a0", name: "스커트" },
      { caId: "7020b0", name: "니트/스웨터" }, { caId: "7020c0", name: "셋트" },
    ]},
    { parentCaId: "7040", name: "골프 가방", gender: "골프", subcategories: [
      { caId: "704010", name: "캐디백" }, { caId: "704020", name: "보스턴백" },
      { caId: "704030", name: "토트백" }, { caId: "704040", name: "클러치백" },
      { caId: "704050", name: "기타" },
    ]},
    { parentCaId: "7030", name: "골프 신발", gender: "골프", subcategories: [
      { caId: "703010", name: "골프화" }, { caId: "703020", name: "스니커즈" },
    ]},
  ];
  const [selectedBagstyleSubcats, setSelectedBagstyleSubcats] = useState<string[]>([]);
  const [expandedBagstyleCats, setExpandedBagstyleCats] = useState<string[]>([]);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<{deleted: number; ids: string[]} | null>(null);

  // 문제 소분류 목록 (실제 초과분만 - 삭제 후 재크롤 필요)
  const PROBLEM_SUBCATS = [
    { caId: 'b01040', name: '남성의류 - 코트/정장', issue: '초과 +545' },
    { caId: 'b01050', name: '남성의류 - 후드티/집업', issue: '초과 +2,696' },
    { caId: 'b01070', name: '남성의류 - 베스트/조끼', issue: '초과 +493' },
    { caId: 'b010a0', name: '남성의류 - 반팔티/폴로티', issue: '초과 +1,359' },
    { caId: 'b010d0', name: '남성의류 - 팬츠/청바지', issue: '초과 +9' },
    { caId: 'b010e0', name: '남성의류 - 반바지', issue: '초과 +12' },
    { caId: 'b04020', name: '남성지갑 - 카드지갑', issue: '초과 +90' },
    { caId: 'b0b010', name: '남성신발 - 스니커즈', issue: '초과 +36' },
    { caId: 'b0b040', name: '남성신발 - 샌들/슬리퍼', issue: '초과 +7' },
    { caId: 'b0b060', name: '남성신발 - 로퍼/슬립온', issue: '초과 +21' },
  ];
  const [selectedCleanupSubcats, setSelectedCleanupSubcats] = useState<string[]>(
    PROBLEM_SUBCATS.map(s => s.caId)
  );

  const handleSubcatCleanup = async () => {
    if (selectedCleanupSubcats.length === 0) return;
    const confirm = window.confirm(
      `선택한 ${selectedCleanupSubcats.length}개 소분류의 상품을 모두 삭제합니다.\n다른 소분류는 절대 건드리지 않습니다.\n계속하시겠습니까?`
    );
    if (!confirm) return;
    setCleanupLoading(true);
    setCleanupResult(null);
    try {
      const res = await fetchWithAuth('/api/admin/products/delete-by-subcategory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subcategoryIds: selectedCleanupSubcats }),
      });
      const data = await res.json();
      if (data.success) {
        setCleanupResult({ deleted: data.deleted, ids: selectedCleanupSubcats });
        toast({ title: '소분류 정리 완료', description: `${data.deleted.toLocaleString()}개 상품 삭제됨. 이제 해당 소분류만 재크롤 해주세요.` });
      } else {
        toast({ title: '삭제 실패', description: data.error, variant: 'destructive' });
      }
    } catch (e: any) {
      toast({ title: '오류', description: e.message, variant: 'destructive' });
    } finally {
      setCleanupLoading(false);
    }
  };

  const [bloostoreProgress, setBloostoreProgress] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    message: string;
    brand: string;
  }>({ status: 'idle', total: 0, current: 0, message: '', brand: '' });
  const bloostoreIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [watchDetailProgress, setWatchDetailProgress] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    updated: number;
    skipped: number;
    message: string;
  }>({ status: 'idle', total: 0, current: 0, updated: 0, skipped: 0, message: '' });
  const watchDetailIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [watchDetailOnlyMissing, setWatchDetailOnlyMissing] = useState(true);

  const [puluaProgress, setPuluaProgress] = useState<{
    status: 'idle' | 'running' | 'completed' | 'error';
    total: number;
    current: number;
    inserted: number;
    skipped: number;
    message: string;
  }>({ status: 'idle', total: 0, current: 0, inserted: 0, skipped: 0, message: '' });
  const puluaIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [watchDeleteConfirm, setWatchDeleteConfirm] = useState(false);
  const [watchDeleting, setWatchDeleting] = useState(false);

  const BLOOSTORE_BRANDS = [
    { id: "rolex", name: "롤렉스" },
    { id: "cartier", name: "까르띠에" },
    { id: "iwc", name: "IWC" },
    { id: "patek", name: "파텍필립" },
    { id: "ap", name: "오데마피게" },
    { id: "breitling", name: "브라이틀링" },
    { id: "omega", name: "오메가" },
    { id: "chanel", name: "샤넬" },
  ];
  const [selectedBloostoreBrands, setSelectedBloostoreBrands] = useState<string[]>([]);

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
    if (deleteAllConfirmText !== "전체삭제") return;
    setIsDeleting(true);
    try {
      const res = await fetchWithAuth("/api/admin/products/all", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "삭제 완료", description: data.message });
        setShowDeleteAllConfirm(false);
        setDeleteAllConfirmText("");
        fetchProductCount();
        fetchProducts();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "상품을 삭제할 수 없습니다.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const fetchBagstyleProgress = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bagstyle/progress", { method: "GET" });
      const data = await res.json();
      if (data.success) {
        setBagstyleProgress(prev => ({
          status: data.status,
          total: data.total,
          current: data.current,
          message: data.message,
          category: data.category || '',
          subcatLog: data.subcatLog || prev.subcatLog,
          grandTotal: data.grandTotal || 0,
        }));
        if (subcatLogRef.current) {
          subcatLogRef.current.scrollTop = subcatLogRef.current.scrollHeight;
        }
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

  const resetBagstyleCrawl = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bagstyle/reset", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setBagstyleProgress({ status: 'idle', total: 0, current: 0, message: '', category: '', subcatLog: [], grandTotal: 0 });
        if (bagstyleIntervalRef.current) { clearInterval(bagstyleIntervalRef.current); bagstyleIntervalRef.current = null; }
        setCanResume(false);
        setResumeCompletedCount(0);
        toast({ title: "초기화 완료", description: "크롤링 상태가 초기화되었습니다. 다시 시작할 수 있습니다." });
      }
    } catch {
      toast({ title: "오류", description: "초기화에 실패했습니다.", variant: "destructive" });
    }
  };

  const stopBagstyleCrawl = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bagstyle/stop", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "중단 요청", description: "현재 소분류 완료 후 중단됩니다." });
      }
    } catch {
      toast({ title: "오류", description: "중단 요청에 실패했습니다.", variant: "destructive" });
    }
  };

  // ── 카테고리 재분류 ─────────────────────────────────────────────────────
  const [reclassifyAnalysis, setReclassifyAnalysis] = useState<{
    totalProducts: number;
    byCategory: { cat_name: string; category_id: string; cnt: number }[];
    wrongCategoryCount: number;
    noBrandCount: number;
    hasUrlAndWrong: number;
    estimatedRuleFixed: number;
  } | null>(null);
  const [reclassifyAnalyzing, setReclassifyAnalyzing] = useState(false);
  const [reclassifyRulesRunning, setReclassifyRulesRunning] = useState(false);
  const [reclassifyRulesResult, setReclassifyRulesResult] = useState<{ changed: number; skipped: number; total: number } | null>(null);
  const [rematchBrandsRunning, setRematchBrandsRunning] = useState(false);
  const [rematchBrandsResult, setRematchBrandsResult] = useState<{ matched: number; unmatched: number; total: number } | null>(null);
  const [reclassifyUrlProgress, setReclassifyUrlProgress] = useState<{
    status: 'idle' | 'running' | 'done' | 'error';
    total: number; current: number; changed: number; skipped: number; failed: number; message: string;
  }>({ status: 'idle', total: 0, current: 0, changed: 0, skipped: 0, failed: 0, message: '' });
  const reclassifyUrlIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [genderReclassifyRunning, setGenderReclassifyRunning] = useState(false);
  const [genderReclassifyResult, setGenderReclassifyResult] = useState<{ changed: number; skipped: number; total: number } | null>(null);

  const runReclassifyAnalyze = async () => {
    setReclassifyAnalyzing(true);
    setReclassifyRulesResult(null);
    setRematchBrandsResult(null);
    try {
      const res = await fetchWithAuth("/api/admin/products/reclassify-analyze", { method: "POST" });
      const data = await res.json();
      if (data.success) setReclassifyAnalysis(data.data);
      else toast({ title: "분석 실패", description: data.error, variant: "destructive" });
    } catch { toast({ title: "오류", description: "서버 연결 오류", variant: "destructive" }); }
    finally { setReclassifyAnalyzing(false); }
  };

  const runReclassifyRules = async () => {
    if (!window.confirm("상품명 키워드로 잘못 분류된 상품을 자동 재분류합니다.\n계속하시겠습니까?")) return;
    setReclassifyRulesRunning(true);
    try {
      const res = await fetchWithAuth("/api/admin/products/reclassify-rules", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setReclassifyRulesResult(data.data);
        setReclassifyAnalysis(null);
        toast({ title: "완료", description: `${data.data.changed}개 재분류, ${data.data.skipped}개 건너뜀` });
      } else toast({ title: "실패", description: data.error, variant: "destructive" });
    } catch { toast({ title: "오류", description: "서버 연결 오류", variant: "destructive" }); }
    finally { setReclassifyRulesRunning(false); }
  };

  const startReclassifyUrl = async () => {
    if (!window.confirm("source_url을 재방문해 카테고리를 정밀 재분류합니다.\n상품 수에 따라 시간이 걸릴 수 있습니다. 계속하시겠습니까?")) return;
    const startRes = await fetchWithAuth("/api/admin/products/reclassify-url/start", { method: "POST" });
    const startData = await startRes.json();
    if (!startData.success) { toast({ title: "실패", description: startData.error, variant: "destructive" }); return; }
    if (reclassifyUrlIntervalRef.current) clearInterval(reclassifyUrlIntervalRef.current);
    reclassifyUrlIntervalRef.current = setInterval(async () => {
      try {
        const r = await fetchWithAuth("/api/admin/products/reclassify-url/progress");
        const d = await r.json();
        if (d.success) {
          setReclassifyUrlProgress(d.data);
          if (d.data.status === 'done' || d.data.status === 'error') {
            clearInterval(reclassifyUrlIntervalRef.current!);
            reclassifyUrlIntervalRef.current = null;
            if (d.data.status === 'done') toast({ title: "URL 재분류 완료", description: `변경: ${d.data.changed}개` });
          }
        }
      } catch {}
    }, 1500);
  };

  const resetReclassifyUrl = async () => {
    if (reclassifyUrlIntervalRef.current) { clearInterval(reclassifyUrlIntervalRef.current); reclassifyUrlIntervalRef.current = null; }
    await fetchWithAuth("/api/admin/products/reclassify-url/reset", { method: "POST" });
    setReclassifyUrlProgress({ status: 'idle', total: 0, current: 0, changed: 0, skipped: 0, failed: 0, message: '' });
  };

  const runGenderReclassify = async () => {
    if (!window.confirm("성별 카테고리(남성/여성) ca_id 기준으로 상품의 categoryId와 gender를 재분류합니다.\n기존 상품은 삭제되지 않습니다. 계속하시겠습니까?")) return;
    setGenderReclassifyRunning(true);
    setGenderReclassifyResult(null);
    try {
      const res = await fetchWithAuth("/api/admin/reclassify-by-gender-caid", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setGenderReclassifyResult(data.data);
        toast({ title: "성별 재분류 완료", description: `${data.data.changed}개 재분류, ${data.data.skipped}개 건너뜀` });
      } else toast({ title: "실패", description: data.error, variant: "destructive" });
    } catch { toast({ title: "오류", description: "서버 연결 오류", variant: "destructive" }); }
    finally { setGenderReclassifyRunning(false); }
  };

  const runRematchBrands = async () => {
    if (!window.confirm("브랜드가 없는 상품에 이름 키워드로 브랜드를 자동 매칭합니다.\n계속하시겠습니까?")) return;
    setRematchBrandsRunning(true);
    try {
      const res = await fetchWithAuth("/api/admin/products/rematch-brands", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setRematchBrandsResult(data.data);
        setReclassifyAnalysis(null);
        toast({ title: "완료", description: `${data.data.matched}개 브랜드 매칭 완료` });
      } else toast({ title: "실패", description: data.error, variant: "destructive" });
    } catch { toast({ title: "오류", description: "서버 연결 오류", variant: "destructive" }); }
    finally { setRematchBrandsRunning(false); }
  };

  // ── 중복 상품 정리 ──────────────────────────────────────────────────────
  const [dedupAnalysis, setDedupAnalysis] = useState<{
    totalProducts: number;
    byCategory: { category_name: string; cnt: number }[];
    urlDuplicates: { groupCount: number; wouldDelete: number; samples: { url: string; count: number }[] };
    nameDuplicates: { wouldDelete: number };
    totalWouldDelete: number;
  } | null>(null);
  const [dedupAnalyzing, setDedupAnalyzing] = useState(false);
  const [dedupExecuting, setDedupExecuting] = useState(false);
  const [dedupResult, setDedupResult] = useState<{
    urlDuplicatesDeleted: number;
    nameDuplicatesDeleted: number;
    totalDeleted: number;
    remainingProducts: number;
  } | null>(null);

  const runDedupAnalyze = async () => {
    setDedupAnalyzing(true);
    setDedupResult(null);
    try {
      const res = await fetchWithAuth("/api/admin/products/dedup-analyze", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDedupAnalysis(data.data);
      } else {
        toast({ title: "분석 실패", description: data.error || "오류 발생", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "서버 연결 오류", variant: "destructive" });
    } finally {
      setDedupAnalyzing(false);
    }
  };

  const runDedupExecute = async () => {
    if (!dedupAnalysis) return;
    if (!window.confirm(`중복 상품 ${dedupAnalysis.totalWouldDelete}개를 삭제합니다.\n\n가장 오래된 상품(최초 등록본)을 남기고 나머지를 삭제합니다.\n이 작업은 되돌릴 수 없습니다. 계속하시겠습니까?`)) return;
    setDedupExecuting(true);
    try {
      const res = await fetchWithAuth("/api/admin/products/dedup-execute", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setDedupResult(data.data);
        setDedupAnalysis(null);
        toast({ title: "완료", description: `총 ${data.data.totalDeleted}개 중복 상품 삭제. 남은 상품: ${data.data.remainingProducts}개` });
      } else {
        toast({ title: "삭제 실패", description: data.error || "오류 발생", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "서버 연결 오류", variant: "destructive" });
    } finally {
      setDedupExecuting(false);
    }
  };

  const startBagstyleCrawl = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bagstyle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedSubcats: selectedBagstyleSubcats.length > 0 ? selectedBagstyleSubcats : undefined,
          resume: false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const categoryText = selectedBagstyleSubcats.length > 0
          ? `${selectedBagstyleSubcats.length}개 소분류`
          : "전체 카테고리";
        toast({ title: "bagstyle 크롤링 시작", description: `${categoryText} 크롤링이 시작되었습니다.` });
        setCanResume(false);
        setBagstyleProgress({ status: 'running', total: 0, current: 0, message: '시작 중...', category: '', subcatLog: [], grandTotal: 0 });
        if (bagstyleIntervalRef.current) clearInterval(bagstyleIntervalRef.current);
        bagstyleIntervalRef.current = setInterval(fetchBagstyleProgress, 500);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "크롤링을 시작할 수 없습니다.", variant: "destructive" });
    }
  };

  const resumeBagstyleCrawl = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bagstyle/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedSubcats: selectedBagstyleSubcats.length > 0 ? selectedBagstyleSubcats : undefined,
          resume: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "이어서 크롤링 시작", description: data.message });
        setCanResume(false);
        setBagstyleProgress(prev => ({ ...prev, status: 'running', message: '이어서 시작 중...' }));
        if (bagstyleIntervalRef.current) clearInterval(bagstyleIntervalRef.current);
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

  const allSubcatIds = BAGSTYLE_CRAWL_TREE.flatMap(c => c.subcategories.map(s => s.caId));

  const toggleBagstyleSubcat = (caId: string) => {
    setSelectedBagstyleSubcats(prev =>
      prev.includes(caId) ? prev.filter(id => id !== caId) : [...prev, caId]
    );
  };

  const toggleBagstyleCatAll = (parentCaId: string) => {
    const cat = BAGSTYLE_CRAWL_TREE.find(c => c.parentCaId === parentCaId);
    if (!cat) return;
    const catSubcatIds = cat.subcategories.map(s => s.caId);
    const allSelected = catSubcatIds.every(id => selectedBagstyleSubcats.includes(id));
    if (allSelected) {
      setSelectedBagstyleSubcats(prev => prev.filter(id => !catSubcatIds.includes(id)));
    } else {
      setSelectedBagstyleSubcats(prev => [...new Set([...prev, ...catSubcatIds])]);
    }
  };

  const toggleBagstyleCatExpand = (parentCaId: string) => {
    setExpandedBagstyleCats(prev =>
      prev.includes(parentCaId) ? prev.filter(id => id !== parentCaId) : [...prev, parentCaId]
    );
  };

  const selectAllBagstyleCategories = () => {
    setSelectedBagstyleSubcats(allSubcatIds);
  };

  const deselectAllBagstyleCategories = () => {
    setSelectedBagstyleSubcats([]);
  };

  const fetchBloostoreProgress = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bloostore/progress", { method: "GET" });
      const data = await res.json();
      if (data.success) {
        setBloostoreProgress({
          status: data.status,
          total: data.total,
          current: data.current,
          message: data.message,
          brand: data.brand || '',
        });
        if (data.status === 'completed' || data.status === 'error') {
          if (bloostoreIntervalRef.current) {
            clearInterval(bloostoreIntervalRef.current);
            bloostoreIntervalRef.current = null;
          }
          fetchProductCount();
          fetchProducts();
        }
      }
    } catch {}
  };

  const startBloostoreCrawl = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bloostore/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedBrands: selectedBloostoreBrands.length > 0 ? selectedBloostoreBrands : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const brandText = selectedBloostoreBrands.length > 0
          ? `${selectedBloostoreBrands.length}개 브랜드`
          : "전체 브랜드";
        toast({ title: "블루스토어 시계 크롤링 시작", description: `${brandText} 크롤링이 시작되었습니다.` });
        setBloostoreProgress({ status: 'running', total: 0, current: 0, message: '시작 중...', brand: '' });
        bloostoreIntervalRef.current = setInterval(fetchBloostoreProgress, 500);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "시계 크롤링을 시작할 수 없습니다.", variant: "destructive" });
    }
  };

  const fetchWatchDetailProgress = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/watch-details/progress");
      const data = await res.json();
      if (data.success) {
        setWatchDetailProgress({
          status: data.status,
          total: data.total || 0,
          current: data.current || 0,
          updated: data.updated || 0,
          skipped: data.skipped || 0,
          message: data.message || '',
        });
        if (data.status !== 'running') {
          if (watchDetailIntervalRef.current) {
            clearInterval(watchDetailIntervalRef.current);
            watchDetailIntervalRef.current = null;
          }
        }
      }
    } catch {}
  };

  const startWatchDetailCrawl = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/watch-details/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ onlyMissing: watchDetailOnlyMissing }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "시계 상세이미지 크롤링 시작", description: "블루스토어 시계 상세이미지를 업데이트합니다." });
        setWatchDetailProgress({ status: 'running', total: 0, current: 0, updated: 0, skipped: 0, message: '시작 중...' });
        watchDetailIntervalRef.current = setInterval(fetchWatchDetailProgress, 1000);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "크롤링을 시작할 수 없습니다.", variant: "destructive" });
    }
  };

  const fetchPuluaProgress = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/pulua/progress");
      const data = await res.json();
      if (data.success) {
        setPuluaProgress({ status: data.status, total: data.total || 0, current: data.current || 0, inserted: data.inserted || 0, skipped: data.skipped || 0, message: data.message || '' });
        if (data.status !== 'running') {
          if (puluaIntervalRef.current) { clearInterval(puluaIntervalRef.current); puluaIntervalRef.current = null; }
          if (data.status === 'completed') { fetchProductCount(); fetchProducts(); }
        }
      }
    } catch {}
  };

  const startPuluaCrawl = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/pulua/start", { method: "POST", headers: { "Content-Type": "application/json" } });
      const data = await res.json();
      if (data.success) {
        toast({ title: "풀루아 크롤링 시작", description: "pulua.co.kr 시계 상품을 수집합니다." });
        setPuluaProgress({ status: 'running', total: 0, current: 0, inserted: 0, skipped: 0, message: '시작 중...' });
        puluaIntervalRef.current = setInterval(fetchPuluaProgress, 800);
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "크롤링을 시작할 수 없습니다.", variant: "destructive" });
    }
  };

  const stopPuluaCrawl = async () => {
    try {
      await fetchWithAuth("/api/admin/crawl/pulua/stop", { method: "POST" });
      toast({ title: "중단 요청", description: "현재 상품 처리 후 중단됩니다." });
    } catch {}
  };

  const deleteAllWatches = async () => {
    setWatchDeleting(true);
    try {
      const res = await fetchWithAuth("/api/admin/products/category/watches", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "삭제 완료", description: data.message });
        fetchProductCount();
        fetchProducts();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "삭제 중 오류가 발생했습니다.", variant: "destructive" });
    } finally {
      setWatchDeleting(false);
      setWatchDeleteConfirm(false);
    }
  };

  const toggleBloostoreBrand = (brandId: string) => {
    setSelectedBloostoreBrands(prev =>
      prev.includes(brandId)
        ? prev.filter(id => id !== brandId)
        : [...prev, brandId]
    );
  };

  const selectAllBloostoreBrands = () => {
    setSelectedBloostoreBrands(BLOOSTORE_BRANDS.map(b => b.id));
  };

  const deselectAllBloostoreBrands = () => {
    setSelectedBloostoreBrands([]);
  };

  useEffect(() => {
    const token = localStorage.getItem("adminToken");
    if (token) {
      verifyToken(token);
    } else {
      setCheckingAuth(false);
    }
  }, []);

  // 페이지 로드 시 크롤링 진행 중이면 자동 재연결 + 이어서 하기 가능 여부 체크
  useEffect(() => {
    const checkBagstyleStatus = async () => {
      try {
        const token = localStorage.getItem("adminToken");
        if (!token) return;
        const res = await fetch("/api/admin/crawl/bagstyle/progress", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!data.success) return;

        if (data.status === 'running') {
          // 크롤이 서버에서 아직 돌고 있음 → 자동 재연결
          setBagstyleProgress({
            status: data.status,
            total: data.total || 0,
            current: data.current || 0,
            message: data.message || '',
            category: data.category || '',
            subcatLog: data.subcatLog || [],
            grandTotal: data.grandTotal || 0,
          });
          if (!bagstyleIntervalRef.current) {
            bagstyleIntervalRef.current = setInterval(fetchBagstyleProgress, 500);
          }
        } else {
          // 크롤이 실행 중이 아닐 때 이어서 하기 가능 여부 확인
          const resumeRes = await fetch("/api/admin/crawl/bagstyle/can-resume", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const resumeData = await resumeRes.json();
          if (resumeData.success && resumeData.canResume) {
            setCanResume(true);
            setResumeCompletedCount(resumeData.completedCount);
          }
        }
      } catch {}
    };
    checkBagstyleStatus();
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

  const fetchAdminSections = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/content-sections");
      const data = await res.json();
      if (data.success) {
        setAdminSections(data.data.filter((s: any) => s.sectionType !== "monthly_benefit"));
      }
    } catch {}
  };

  const handleBulkApply = async () => {
    if (selectedProductIds.size === 0) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedProductIds);
      if (bulkActionType === "category") {
        if (!bulkCategoryValue) { toast({ title: "카테고리를 선택해주세요.", variant: "destructive" }); return; }
        const res = await fetchWithAuth("/api/admin/products/bulk-update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: ids, updates: { categoryId: bulkCategoryValue } }),
        });
        const data = await res.json();
        if (data.success) {
          toast({ title: `${data.updated}개 상품 카테고리 변경 완료` });
          setSelectedProductIds(new Set());
          fetchProducts(productPage, productSearch, productFilter);
        }
      } else if (bulkActionType === "section") {
        if (!bulkSectionId) { toast({ title: "섹션을 선택해주세요.", variant: "destructive" }); return; }
        const res = await fetchWithAuth("/api/admin/products/bulk-add-to-section", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productIds: ids, sectionId: bulkSectionId }),
        });
        const data = await res.json();
        if (data.success) {
          toast({ title: `${data.addedCount}개 상품 섹션 추가 완료` });
          setSelectedProductIds(new Set());
        }
      }
    } catch {
      toast({ title: "오류 발생", variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProductIds.size === 0) return;
    if (!confirm(`선택한 ${selectedProductIds.size}개 상품을 삭제하시겠습니까?`)) return;
    setBulkLoading(true);
    try {
      const ids = Array.from(selectedProductIds);
      const res = await fetchWithAuth("/api/admin/products/bulk-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productIds: ids }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: `${data.deleted}개 상품 삭제 완료` });
        setSelectedProductIds(new Set());
        fetchProducts(1, productSearch, productFilter);
      }
    } catch {
      toast({ title: "삭제 오류", variant: "destructive" });
    } finally {
      setBulkLoading(false);
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

  const startBloostoreReviewCrawl = async () => {
    try {
      const res = await fetchWithAuth("/api/admin/crawl/bloostore-reviews/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ maxPages: bloostoreReviewMaxPages, clearExisting: bloostoreReviewClearExisting }),
      });
      const data = await res.json();
      if (!data.success) {
        toast({ title: "오류", description: data.error, variant: "destructive" });
        return;
      }
      setBloostoreReviewCrawl(prev => ({ ...prev, status: 'running', message: '크롤링 시작 중...' }));
      const poll = setInterval(async () => {
        try {
          const prog = await fetchWithAuth("/api/admin/crawl/bloostore-reviews/progress");
          const pdata = await prog.json();
          if (pdata.success) {
            setBloostoreReviewCrawl({
              status: pdata.status,
              total: pdata.total,
              current: pdata.current,
              message: pdata.message,
              inserted: pdata.inserted,
              skipped: pdata.skipped,
            });
            if (pdata.status === 'done' || pdata.status === 'error') {
              clearInterval(poll);
              if (pdata.status === 'done') {
                toast({ title: "크롤링 완료", description: `${pdata.inserted}개 후기가 저장되었습니다.` });
                fetchReviews();
              }
            }
          }
        } catch {}
      }, 2000);
    } catch (err) {
      toast({ title: "오류 발생", variant: "destructive" });
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
      fetchAdminSections();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // 탭 전환 시 선택 초기화
    setSelectedProductIds(new Set());
  }, [activeTab]);

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
      fetchCatalogStats();
      fetch("/api/product-detail-banners")
        .then(r => r.json())
        .then(d => { if (d.success) setDetailBannerSettings(d.data); })
        .catch(() => {});
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && activeTab === "telegram") {
      fetchWithAuth("/api/admin/telegram/settings")
        .then(r => r.json())
        .then(d => {
          if (d.success) {
            setTgSettings(d.data);
            if (d.data.token && d.data.chatId) setTgStep(3);
            else if (d.data.token) setTgStep(2);
            else setTgStep(1);
          }
        }).catch(() => {});
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

  const fetchCatalogStats = async () => {
    try {
      const res = await fetchWithAuth("/api/catalog/stats");
      const data = await res.json();
      if (data.success) setCatalogStats(data.data);
    } catch (error) {
      console.error("Error fetching catalog stats:", error);
    }
  };

  const copyCatalogUrl = (url: string, key: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCatalogCopied(key);
      setTimeout(() => setCatalogCopied(null), 2000);
    });
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
      const sizes = formData.optionSizes ? formData.optionSizes.split(",").map(s => s.trim()).filter(Boolean) : [];
      const colors = formData.optionColors ? formData.optionColors.split(",").map(s => s.trim()).filter(Boolean) : [];
      const { optionSizes: _os, optionColors: _oc, ...productData } = formData;
      const submitData = { ...productData, options: (sizes.length > 0 || colors.length > 0) ? JSON.stringify({ sizes, colors, extras: [] }) : undefined };
      const res = await fetchWithAuth("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상품이 추가되었습니다." });
        setShowAddForm(false);
        setFormData({ name: "", sku: "", categoryId: "new-arrivals", brandId: "", price: "", originalPrice: "", stock: "", isBest: false, isNew: false, gender: "", description: "", imageUrl: "", imageUrls: [], optionSizes: "", optionColors: "" });
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
      const sizes = formData.optionSizes ? formData.optionSizes.split(",").map(s => s.trim()).filter(Boolean) : [];
      const colors = formData.optionColors ? formData.optionColors.split(",").map(s => s.trim()).filter(Boolean) : [];
      const { optionSizes: _os, optionColors: _oc, ...productData } = formData;
      const submitData = { ...productData, options: (sizes.length > 0 || colors.length > 0) ? JSON.stringify({ sizes, colors, extras: [] }) : "" };
      const res = await fetchWithAuth(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
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
    let optSizes = "";
    let optColors = "";
    if (product.options) {
      try {
        const parsed = JSON.parse(product.options);
        if (parsed && typeof parsed === 'object') {
          optSizes = Array.isArray(parsed.sizes) ? parsed.sizes.join(", ") : "";
          optColors = Array.isArray(parsed.colors) ? parsed.colors.join(", ") : "";
        }
      } catch {}
    }
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
      gender: (product as any).gender || "",
      description: product.description || "",
      imageUrl: product.imageUrl || "",
      imageUrls: existingUrls.length > 0 ? existingUrls : (product.imageUrl ? [product.imageUrl] : []),
      optionSizes: optSizes,
      optionColors: optColors,
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
              <h1 className="font-bold">velour</h1>
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
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0" style={{ WebkitOverflowScrolling: "touch", scrollbarWidth: "thin" }}>
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
                data-testid="tab-contentSections"
                variant={activeTab === "contentSections" ? "default" : "outline"}
                onClick={() => setActiveTab("contentSections")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "contentSections" ? "bg-pink-500 hover:bg-pink-600" : ""}`}
              >
                <Globe className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">콘텐츠 관리</span>
              </Button>
              <Button
                data-testid="tab-magazines"
                variant={activeTab === "magazines" ? "default" : "outline"}
                onClick={() => setActiveTab("magazines")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "magazines" ? "bg-purple-500 hover:bg-purple-600" : ""}`}
              >
                <FileText className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">매거진 관리</span>
              </Button>
              <Button
                data-testid="tab-labs"
                variant={activeTab === "labs" ? "default" : "outline"}
                onClick={() => setActiveTab("labs")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "labs" ? "bg-cyan-500 hover:bg-cyan-600" : ""}`}
              >
                <Globe className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">LABS 관리</span>
              </Button>
              <Button
                data-testid="tab-quickMenu"
                variant={activeTab === "quickMenu" ? "default" : "outline"}
                onClick={() => setActiveTab("quickMenu")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "quickMenu" ? "bg-teal-500 hover:bg-teal-600" : ""}`}
              >
                <Circle className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">퀵메뉴 관리</span>
              </Button>
              <Button
                data-testid="tab-telegram"
                variant={activeTab === "telegram" ? "default" : "outline"}
                onClick={() => setActiveTab("telegram")}
                className={`flex-shrink-0 text-xs md:text-sm ${activeTab === "telegram" ? "bg-sky-500 hover:bg-sky-600" : ""}`}
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 md:mr-2 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
                <span className="hidden md:inline">텔레그램 봇</span>
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

        {activeTab === "products" && (<>
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
                <div className="flex gap-4 mb-4 items-center">
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
                  <select
                    data-testid="select-product-gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    <option value="">성별 선택</option>
                    <option value="남성">남성</option>
                    <option value="여성">여성</option>
                    <option value="공용">공용</option>
                  </select>
                </div>
                <Textarea
                  data-testid="textarea-product-description"
                  placeholder="상품 설명 (선택)"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mb-4"
                />
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">사이즈 옵션 (쉼표로 구분)</label>
                    <Input
                      placeholder="예: S, M, L, XL 또는 250, 255, 260"
                      value={formData.optionSizes}
                      onChange={(e) => setFormData({ ...formData, optionSizes: e.target.value })}
                      data-testid="input-option-sizes"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">색상 옵션 (쉼표로 구분)</label>
                    <Input
                      placeholder="예: 블랙, 화이트, 네이비"
                      value={formData.optionColors}
                      onChange={(e) => setFormData({ ...formData, optionColors: e.target.value })}
                      data-testid="input-option-colors"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button data-testid="button-save-product" onClick={handleCreate} className="bg-yellow-500 hover:bg-yellow-600">저장</Button>
                  <Button variant="outline" onClick={() => setShowAddForm(false)}>취소</Button>
                </div>
              </div>
            )}

            {/* 일괄 작업 바 */}
            {selectedProductIds.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 flex flex-wrap items-center gap-3">
                <span className="text-blue-700 font-semibold text-sm">{selectedProductIds.size}개 선택됨</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <select
                    value={bulkActionType}
                    onChange={(e) => setBulkActionType(e.target.value as "category" | "section")}
                    className="border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                  >
                    <option value="category">카테고리 변경</option>
                    <option value="section">섹션에 추가</option>
                  </select>
                  {bulkActionType === "category" && (
                    <select
                      value={bulkCategoryValue}
                      onChange={(e) => setBulkCategoryValue(e.target.value)}
                      className="border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                    >
                      <option value="">카테고리 선택...</option>
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  )}
                  {bulkActionType === "section" && (
                    <select
                      value={bulkSectionId}
                      onChange={(e) => setBulkSectionId(e.target.value)}
                      className="border border-blue-300 rounded px-2 py-1 text-sm bg-white"
                    >
                      <option value="">섹션 선택...</option>
                      {adminSections.map((s) => (
                        <option key={s.id} value={s.id}>{s.title}</option>
                      ))}
                    </select>
                  )}
                  <Button
                    size="sm"
                    onClick={handleBulkApply}
                    disabled={bulkLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white h-7 text-xs"
                  >
                    {bulkLoading ? "처리 중..." : "적용"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleBulkDelete}
                    disabled={bulkLoading}
                    className="border-red-300 text-red-600 hover:bg-red-50 h-7 text-xs"
                  >
                    삭제
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSelectedProductIds(new Set())}
                    className="text-gray-500 h-7 text-xs"
                  >
                    선택 해제
                  </Button>
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
                      <th className="px-3 py-3 w-8">
                        <input
                          type="checkbox"
                          data-testid="checkbox-select-all-products"
                          checked={filteredProducts.length > 0 && filteredProducts.every(p => selectedProductIds.has(p.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedProductIds(prev => {
                                const next = new Set(prev);
                                filteredProducts.forEach(p => next.add(p.id));
                                return next;
                              });
                            } else {
                              setSelectedProductIds(prev => {
                                const next = new Set(prev);
                                filteredProducts.forEach(p => next.delete(p.id));
                                return next;
                              });
                            }
                          }}
                          className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                        />
                      </th>
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
                      <tr
                        key={product.id}
                        className={`hover:bg-gray-50 ${selectedProductIds.has(product.id) ? "bg-blue-50" : ""}`}
                      >
                        <td className="px-3 py-3">
                          <input
                            type="checkbox"
                            data-testid={`checkbox-product-${product.id}`}
                            checked={selectedProductIds.has(product.id)}
                            onChange={(e) => {
                              setSelectedProductIds(prev => {
                                const next = new Set(prev);
                                if (e.target.checked) next.add(product.id);
                                else next.delete(product.id);
                                return next;
                              });
                            }}
                            className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                          />
                        </td>
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
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                        <select
                          data-testid="select-edit-product-gender"
                          className="w-full border border-gray-200 rounded-md px-3 py-2"
                          value={formData.gender}
                          onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        >
                          <option value="">성별 선택</option>
                          <option value="남성">남성</option>
                          <option value="여성">여성</option>
                          <option value="공용">공용</option>
                        </select>
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

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">사이즈 옵션 (쉼표로 구분)</label>
                        <Input
                          placeholder="예: S, M, L, XL 또는 250, 255, 260"
                          value={formData.optionSizes}
                          onChange={(e) => setFormData({ ...formData, optionSizes: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">색상 옵션 (쉼표로 구분)</label>
                        <Input
                          placeholder="예: 블랙, 화이트, 네이비"
                          value={formData.optionColors}
                          onChange={(e) => setFormData({ ...formData, optionColors: e.target.value })}
                        />
                      </div>
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

          {/* 카테고리 재분류 패널 */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 mt-6">
            <div className="p-5 border-b border-blue-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">카테고리 재분류 &amp; 브랜드 재매칭</h3>
                <p className="text-xs text-gray-500">잘못 분류된 상품을 올바른 카테고리로 이동하고 브랜드를 자동 매칭합니다</p>
              </div>
            </div>
            <div className="p-5 space-y-4">

              {/* 성별 기반 카테고리 재분류 (ca_id 접두어 기준) */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium text-purple-800">성별 카테고리 재분류 (핵심)</p>
                <p className="text-xs text-purple-600">bagstyle 남성(b0xx)/여성(c0xx) ca_id 기준으로 categoryId와 gender를 정확하게 설정합니다. 기존 상품은 삭제되지 않습니다.</p>
                <Button
                  data-testid="button-gender-reclassify"
                  onClick={runGenderReclassify}
                  disabled={genderReclassifyRunning}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {genderReclassifyRunning
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />재분류 중...</>
                    : <><RefreshCw className="w-4 h-4 mr-2" />성별 기반 카테고리 재분류 실행</>
                  }
                </Button>
                {genderReclassifyResult && (
                  <p className="text-xs text-green-700 font-medium">✓ 완료: {genderReclassifyResult.changed.toLocaleString()}개 재분류, {genderReclassifyResult.skipped.toLocaleString()}개 건너뜀 (총 {genderReclassifyResult.total.toLocaleString()}개)</p>
                )}
              </div>

              {/* 분석 결과 */}
              {reclassifyAnalysis && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                  <p className="font-medium text-blue-800">분석 결과</p>

                  {/* 카테고리별 분포 */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">현재 카테고리별 상품수</p>
                    <div className="flex flex-wrap gap-1.5">
                      {reclassifyAnalysis.byCategory.map((c, i) => (
                        <span key={i} className={`text-xs rounded px-2 py-0.5 border ${
                          c.category_id === 'men' || c.category_id === 'women'
                            ? 'bg-red-50 border-red-300 text-red-700 font-medium'
                            : 'bg-white border-blue-200'
                        }`}>
                          {c.cat_name || c.category_id || '미분류'}: {c.cnt.toLocaleString()}
                          {(c.category_id === 'men' || c.category_id === 'women') && ' ⚠️'}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* 주요 지표 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="bg-white rounded p-2 text-center border border-red-200">
                      <div className="font-bold text-red-600">{reclassifyAnalysis.wrongCategoryCount.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">잘못된 카테고리 (남/여)</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center border border-blue-200">
                      <div className="font-bold text-blue-600">{reclassifyAnalysis.estimatedRuleFixed.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">규칙으로 즉시 수정 가능</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center border border-blue-200">
                      <div className="font-bold text-blue-600">{reclassifyAnalysis.hasUrlAndWrong.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">URL 재방문 대상</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center border border-orange-200">
                      <div className="font-bold text-orange-600">{reclassifyAnalysis.noBrandCount.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">브랜드 없는 상품</div>
                    </div>
                  </div>

                  {/* 액션 버튼들 */}
                  <div className="space-y-2">
                    {reclassifyAnalysis.wrongCategoryCount > 0 && (
                      <>
                        <p className="text-xs font-medium text-gray-700">① 규칙 기반 재분류 (빠름 — 이름 키워드로 즉시 수정)</p>
                        <Button
                          data-testid="button-reclassify-rules"
                          onClick={runReclassifyRules}
                          disabled={reclassifyRulesRunning}
                          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                        >
                          {reclassifyRulesRunning
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />재분류 중...</>
                            : <><RefreshCw className="w-4 h-4 mr-2" />규칙 기반 재분류 실행 ({reclassifyAnalysis.estimatedRuleFixed.toLocaleString()}개 예상)</>
                          }
                        </Button>
                        {reclassifyAnalysis.hasUrlAndWrong > 0 && (
                          <>
                            <p className="text-xs font-medium text-gray-700 mt-2">② URL 정밀 재분류 (느림 — 각 상품 페이지 재방문)</p>
                            <Button
                              data-testid="button-reclassify-url"
                              onClick={startReclassifyUrl}
                              disabled={reclassifyUrlProgress.status === 'running'}
                              variant="outline"
                              className="w-full border-blue-400 text-blue-700 hover:bg-blue-50"
                            >
                              {reclassifyUrlProgress.status === 'running'
                                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />진행 중...</>
                                : <><RefreshCw className="w-4 h-4 mr-2" />URL 정밀 재분류 시작 ({reclassifyAnalysis.hasUrlAndWrong.toLocaleString()}개)</>
                              }
                            </Button>
                          </>
                        )}
                      </>
                    )}
                    {reclassifyAnalysis.noBrandCount > 0 && (
                      <>
                        <p className="text-xs font-medium text-gray-700 mt-2">③ 브랜드 자동 매칭 (이름에서 브랜드 추출)</p>
                        <Button
                          data-testid="button-rematch-brands"
                          onClick={runRematchBrands}
                          disabled={rematchBrandsRunning}
                          variant="outline"
                          className="w-full border-orange-400 text-orange-700 hover:bg-orange-50"
                        >
                          {rematchBrandsRunning
                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />매칭 중...</>
                            : <><RefreshCw className="w-4 h-4 mr-2" />브랜드 재매칭 ({reclassifyAnalysis.noBrandCount.toLocaleString()}개)</>
                          }
                        </Button>
                      </>
                    )}
                    {reclassifyAnalysis.wrongCategoryCount === 0 && reclassifyAnalysis.noBrandCount === 0 && (
                      <p className="text-green-700 text-sm font-medium">✓ 모든 상품이 올바르게 분류되어 있습니다.</p>
                    )}
                  </div>
                </div>
              )}

              {/* URL 재분류 진행 상태 */}
              {reclassifyUrlProgress.status !== 'idle' && (
                <div className={`p-4 rounded-lg border ${
                  reclassifyUrlProgress.status === 'running' ? 'bg-blue-50 border-blue-200' :
                  reclassifyUrlProgress.status === 'done' ? 'bg-green-50 border-green-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {reclassifyUrlProgress.status === 'running' && <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />}
                    {reclassifyUrlProgress.status === 'done' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {reclassifyUrlProgress.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                    <span className="text-sm font-medium">{reclassifyUrlProgress.message}</span>
                  </div>
                  {reclassifyUrlProgress.total > 0 && (
                    <>
                      <div className="w-full bg-blue-100 rounded-full h-2 mb-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.round((reclassifyUrlProgress.current / reclassifyUrlProgress.total) * 100))}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1 text-xs text-center">
                        <div><span className="font-bold">{reclassifyUrlProgress.current}</span><div className="text-gray-500">처리</div></div>
                        <div><span className="font-bold text-green-600">{reclassifyUrlProgress.changed}</span><div className="text-gray-500">변경</div></div>
                        <div><span className="font-bold text-gray-500">{reclassifyUrlProgress.skipped}</span><div className="text-gray-500">건너뜀</div></div>
                        <div><span className="font-bold text-red-500">{reclassifyUrlProgress.failed}</span><div className="text-gray-500">실패</div></div>
                      </div>
                    </>
                  )}
                  {reclassifyUrlProgress.status !== 'running' && (
                    <Button size="sm" variant="outline" onClick={resetReclassifyUrl} className="mt-2 text-xs">초기화</Button>
                  )}
                </div>
              )}

              {/* 완료 결과들 */}
              {reclassifyRulesResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="font-medium text-green-800 text-sm">✓ 규칙 기반 재분류 완료</p>
                  <p className="text-xs text-gray-600">변경: {reclassifyRulesResult.changed.toLocaleString()}개 / 건너뜀(키워드 없음): {reclassifyRulesResult.skipped.toLocaleString()}개</p>
                </div>
              )}
              {rematchBrandsResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="font-medium text-green-800 text-sm">✓ 브랜드 재매칭 완료</p>
                  <p className="text-xs text-gray-600">매칭 성공: {rematchBrandsResult.matched.toLocaleString()}개 / 매칭 불가: {rematchBrandsResult.unmatched.toLocaleString()}개</p>
                </div>
              )}

              <Button
                data-testid="button-reclassify-analyze"
                onClick={runReclassifyAnalyze}
                disabled={reclassifyAnalyzing || reclassifyRulesRunning || rematchBrandsRunning}
                variant="outline"
                className="border-blue-300 text-blue-600 hover:bg-blue-50"
              >
                {reclassifyAnalyzing
                  ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />분석 중...</>
                  : <><RefreshCw className="w-4 h-4 mr-2" />현황 분석 시작</>
                }
              </Button>
            </div>
          </div>

          {/* 중복 상품 정리 패널 */}
          <div className="bg-white rounded-xl shadow-sm border border-red-100 mt-6">
            <div className="p-5 border-b border-red-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">중복 상품 정리</h3>
                <p className="text-xs text-gray-500">동일한 URL 또는 동일한 이름+브랜드+카테고리 상품을 찾아 제거합니다 (최초 등록본 유지)</p>
              </div>
            </div>
            <div className="p-5 space-y-4">
              {/* 결과 표시 */}
              {dedupResult && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-2">
                  <p className="font-medium text-green-800">✓ 중복 정리 완료</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div className="bg-white rounded p-2 text-center border border-green-200">
                      <div className="font-bold text-green-700">{dedupResult.urlDuplicatesDeleted.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">URL 중복 삭제</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center border border-green-200">
                      <div className="font-bold text-green-700">{dedupResult.nameDuplicatesDeleted.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">이름 중복 삭제</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center border border-green-200">
                      <div className="font-bold text-blue-700">{dedupResult.remainingProducts.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">남은 상품</div>
                    </div>
                  </div>
                </div>
              )}

              {/* 분석 결과 */}
              {dedupAnalysis && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-3">
                  <p className="font-medium text-orange-800">분석 결과</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <div className="bg-white rounded p-2 text-center border border-orange-200">
                      <div className="font-bold text-gray-800">{dedupAnalysis.totalProducts.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">총 상품수</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center border border-orange-200">
                      <div className="font-bold text-red-600">{dedupAnalysis.urlDuplicates.wouldDelete.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">URL 중복 삭제 예정</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center border border-orange-200">
                      <div className="font-bold text-red-600">{dedupAnalysis.nameDuplicates.wouldDelete.toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">이름 중복 삭제 예정</div>
                    </div>
                    <div className="bg-white rounded p-2 text-center border border-orange-200">
                      <div className="font-bold text-blue-700">{(dedupAnalysis.totalProducts - dedupAnalysis.totalWouldDelete).toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">정리 후 남는 상품</div>
                    </div>
                  </div>

                  {/* 카테고리별 분포 */}
                  {dedupAnalysis.byCategory.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-2">카테고리별 상품수</p>
                      <div className="flex flex-wrap gap-1.5">
                        {dedupAnalysis.byCategory.map((c, i) => (
                          <span key={i} className="text-xs bg-white border border-orange-200 rounded px-2 py-0.5">
                            {c.category_name || '미분류'}: {c.cnt.toLocaleString()}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* URL 중복 샘플 */}
                  {dedupAnalysis.urlDuplicates.samples.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">중복 URL 샘플 (상위 {dedupAnalysis.urlDuplicates.samples.length}개)</p>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {dedupAnalysis.urlDuplicates.samples.map((s, i) => (
                          <div key={i} className="text-xs bg-white border border-orange-200 rounded px-2 py-1 flex justify-between">
                            <span className="text-gray-600 truncate flex-1">{s.url}</span>
                            <span className="text-red-500 font-medium ml-2 shrink-0">{s.count}개 중복</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {dedupAnalysis.totalWouldDelete === 0 ? (
                    <p className="text-green-700 text-sm font-medium">✓ 중복 상품 없음 — 정리가 필요하지 않습니다.</p>
                  ) : (
                    <Button
                      data-testid="button-dedup-execute"
                      onClick={runDedupExecute}
                      disabled={dedupExecuting}
                      className="w-full bg-red-500 hover:bg-red-600 text-white"
                    >
                      {dedupExecuting ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />삭제 중... (롤백 가능)</>
                      ) : (
                        <><Trash2 className="w-4 h-4 mr-2" />중복 {dedupAnalysis.totalWouldDelete.toLocaleString()}개 삭제 실행</>
                      )}
                    </Button>
                  )}
                </div>
              )}

              <Button
                data-testid="button-dedup-analyze"
                onClick={runDedupAnalyze}
                disabled={dedupAnalyzing || dedupExecuting}
                variant="outline"
                className="border-red-300 text-red-600 hover:bg-red-50"
              >
                {dedupAnalyzing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />분석 중...</>
                ) : (
                  <><RefreshCw className="w-4 h-4 mr-2" />중복 분석 시작 (미리보기)</>
                )}
              </Button>
            </div>
          </div>
        </>)}

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
                          <p><strong>상품:</strong> {order.productId ? (
                            <a
                              href={`/product/${order.productId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline underline-offset-2 font-medium"
                              data-testid={`link-order-product-${order.id}`}
                            >
                              {order.productName}
                            </a>
                          ) : order.productName}</p>
                          <p>
                            <strong>수량:</strong> {order.quantity}개 | <strong>총액:</strong> {Number(order.totalAmount).toLocaleString()}원
                            {(order as any).paymentMethod && (
                              <> | <strong>결제:</strong> {(order as any).paymentMethod === "card" ? "카드결제" : (order as any).paymentMethod === "bank" ? "계좌이체" : (order as any).paymentMethod}</>
                            )}
                          </p>
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
          <div className="space-y-6">
          {/* 블루스토어 후기 크롤링 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">블루스토어 후기 크롤링</h3>
                <p className="text-sm text-gray-500">bloostore.co.kr 사진후기 게시판에서 제목·이름·사진을 자동 수집합니다</p>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3 mb-4 text-xs text-blue-700 flex items-start gap-2">
              <span>📋</span>
              <span>수집 URL: <code className="bg-blue-100 px-1 rounded">bloostore.co.kr/330/?only_photo=Y</code> (사진 후기만 필터)</span>
            </div>

            <div className="flex flex-wrap gap-4 items-end mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">수집 페이지 수</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={bloostoreReviewMaxPages}
                  onChange={(e) => setBloostoreReviewMaxPages(Number(e.target.value))}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  data-testid="input-review-crawl-pages"
                />
                <p className="text-xs text-gray-400 mt-1">페이지당 약 12~20개</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={bloostoreReviewClearExisting}
                  onChange={(e) => setBloostoreReviewClearExisting(e.target.checked)}
                  className="w-4 h-4 rounded"
                  data-testid="checkbox-review-clear"
                />
                <span className="text-sm text-gray-600">기존 크롤링 후기 삭제 후 시작</span>
              </label>
              <Button
                onClick={startBloostoreReviewCrawl}
                disabled={bloostoreReviewCrawl.status === 'running'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="button-start-review-crawl"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${bloostoreReviewCrawl.status === 'running' ? 'animate-spin' : ''}`} />
                {bloostoreReviewCrawl.status === 'running' ? '크롤링 중...' : '후기 크롤링 시작'}
              </Button>
            </div>

            {bloostoreReviewCrawl.status !== 'idle' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{bloostoreReviewCrawl.message}</span>
                  {bloostoreReviewCrawl.total > 0 && (
                    <span className="font-medium text-gray-800">{bloostoreReviewCrawl.current}/{bloostoreReviewCrawl.total}</span>
                  )}
                </div>
                {bloostoreReviewCrawl.total > 0 && (
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ${
                        bloostoreReviewCrawl.status === 'error' ? 'bg-red-500' :
                        bloostoreReviewCrawl.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${Math.round((bloostoreReviewCrawl.current / bloostoreReviewCrawl.total) * 100)}%` }}
                    />
                  </div>
                )}
                <div className="flex gap-4 text-sm">
                  <span className="text-green-600 font-medium">✓ 저장됨: {bloostoreReviewCrawl.inserted}개</span>
                  {bloostoreReviewCrawl.skipped > 0 && (
                    <span className="text-gray-500">건너뜀: {bloostoreReviewCrawl.skipped}개</span>
                  )}
                  {bloostoreReviewCrawl.status === 'done' && (
                    <span className="text-green-700 font-bold">🎉 완료!</span>
                  )}
                  {bloostoreReviewCrawl.status === 'error' && (
                    <span className="text-red-600 font-bold">⚠ 오류 발생</span>
                  )}
                </div>
              </div>
            )}
          </div>

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
                    <th className="px-4 py-3 text-left font-medium">내용</th>
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
                              placeholder="제목"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <textarea
                              value={reviewFormData.content}
                              onChange={(e) => setReviewFormData({ ...reviewFormData, content: e.target.value })}
                              className="w-full px-2 py-1 text-sm border rounded min-h-[60px] resize-y focus:outline-none focus:border-primary"
                              placeholder="내용"
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
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                            <p className="line-clamp-3 whitespace-pre-line">{review.content}</p>
                          </td>
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
                      {chatConversations.map((conv) => {
                        const isGuest = !conv.memberId && !!conv.guestName;
                        const displayName = conv.guestName
                          ? conv.guestName
                          : conv.subject
                            ? conv.subject.replace("님의 1:1 상담", "").trim()
                            : "회원";
                        return (
                        <div
                          key={conv.id}
                          data-testid={`chat-conversation-${conv.id}`}
                          onClick={() => selectConversation(conv)}
                          className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConversation?.id === conv.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-900 truncate">
                                  {displayName}
                                </span>
                                {isGuest && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-100 text-orange-600 font-medium flex-shrink-0">
                                    비회원
                                  </span>
                                )}
                                <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
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
                        );
                      })}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col">
                  {selectedConversation ? (
                    <>
                      <div className="p-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-gray-900">
                              {selectedConversation.guestName
                                ? selectedConversation.guestName
                                : selectedConversation.subject
                                  ? selectedConversation.subject.replace("님의 1:1 상담", "").trim()
                                  : "회원"}
                            </h4>
                            {!selectedConversation.memberId && selectedConversation.guestName && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">비회원</span>
                            )}
                            {selectedConversation.memberId && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 font-medium">회원</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-0.5">{selectedConversation.subject}</p>
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
            
            <HomeSectionTitlesEditor />
            <BenefitHeroSetting authToken={authToken} />

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
                        placeholder="예: velour"
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
                  <Image className="w-5 h-5 text-purple-600" />
                  상품 상세 페이지 배너 관리
                </h3>
                <p className="text-sm text-gray-500 mt-1">상품 상세 페이지에 표시되는 프리미엄 배너 2개를 관리합니다.</p>
              </div>
              <div className="p-6 space-y-6">
                {[1, 2].map((num) => {
                  const bannerKey = num === 1 ? "banner1" : "banner2";
                  const currentUrl = (detailBannerSettings as any)[bannerKey] || "";
                  return (
                    <div key={num} className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-bold text-gray-900 mb-2">배너 {num}</h4>
                      <p className="text-xs text-gray-500 mb-3">권장 사이즈: 1200 x 200px (가로형, 6:1 비율) · JPG/PNG/WebP · 최대 10MB</p>
                      {currentUrl && (
                        <div className="mb-3 border rounded overflow-hidden">
                          <img src={currentUrl} alt={`배너 ${num} 미리보기`} className="w-full h-auto" />
                        </div>
                      )}
                      <div className="flex gap-2">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            data-testid={`input-upload-detail-banner-${num}`}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 10 * 1024 * 1024) {
                                toast({ title: "오류", description: "파일 크기는 10MB 이하여야 합니다.", variant: "destructive" });
                                return;
                              }
                              const fd = new FormData();
                              fd.append("image", file);
                              try {
                                const uploadRes = await fetch("/api/admin/upload/banner-image", { method: "POST", headers: { Authorization: `Bearer ${authToken}` }, body: fd });
                                const uploadData = await uploadRes.json();
                                if (uploadData.success) {
                                  const newUrl = uploadData.data.imageUrl;
                                  const updateBody: any = {};
                                  updateBody[bannerKey] = newUrl;
                                  const saveRes = await fetchWithAuth("/api/admin/product-detail-banners", {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(updateBody),
                                  });
                                  const saveData = await saveRes.json();
                                  if (saveData.success) {
                                    setDetailBannerSettings((prev: any) => ({ ...prev, [bannerKey]: newUrl }));
                                    toast({ title: "성공", description: `배너 ${num}이(가) 업로드되었습니다.` });
                                  }
                                } else {
                                  toast({ title: "오류", description: uploadData.error || "업로드 실패", variant: "destructive" });
                                }
                              } catch (err) {
                                toast({ title: "오류", description: "배너 업로드에 실패했습니다.", variant: "destructive" });
                              }
                              e.target.value = "";
                            }}
                          />
                          <span className="inline-flex items-center gap-1 px-4 py-2 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors">
                            <Image className="w-4 h-4" />
                            이미지 업로드
                          </span>
                        </label>
                        {currentUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-500 border-red-200 hover:bg-red-50"
                            data-testid={`button-delete-detail-banner-${num}`}
                            onClick={async () => {
                              try {
                                const updateBody: any = {};
                                updateBody[bannerKey] = "";
                                const res = await fetchWithAuth("/api/admin/product-detail-banners", {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify(updateBody),
                                });
                                const data = await res.json();
                                if (data.success) {
                                  setDetailBannerSettings((prev: any) => ({ ...prev, [bannerKey]: "" }));
                                  toast({ title: "성공", description: `배너 ${num}이(가) 삭제되었습니다.` });
                                }
                              } catch (err) {
                                toast({ title: "오류", description: "배너 삭제에 실패했습니다.", variant: "destructive" });
                              }
                            }}
                          >
                            삭제
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
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

            {/* 카탈로그 XML 피드 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  카탈로그 XML 피드
                </h3>
                <p className="text-sm text-gray-500 mt-1">페이스북/카카오 쇼핑 광고용 상품 피드 URL입니다. 카테고리별로 별도 URL을 제공합니다.</p>
              </div>
              <div className="p-6 space-y-4">
                {catalogStats ? (
                  <>
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">전체 피드 <span className="text-gray-400 font-normal">({catalogStats.totalProducts.toLocaleString()}개 상품)</span></p>
                      <div className="flex items-center gap-2 bg-gray-50 rounded-lg p-3 border border-gray-200">
                        <code className="text-xs text-gray-700 flex-1 truncate">{catalogStats.feedUrl}</code>
                        <button
                          onClick={() => copyCatalogUrl(catalogStats.feedUrl, "all")}
                          className="flex-shrink-0 text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors flex items-center gap-1"
                        >
                          {catalogCopied === "all" ? <><Check className="w-3 h-3 text-green-600" /> 복사됨</> : <><Link2 className="w-3 h-3" /> 복사</>}
                        </button>
                        <a href={catalogStats.feedUrl} target="_blank" rel="noopener noreferrer" className="flex-shrink-0 text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                          열기
                        </a>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">카테고리별 피드</p>
                      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {catalogStats.categories.filter(c => c.count > 0).map(cat => (
                          <div key={cat.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 border border-gray-200">
                            <span className="text-xs font-medium text-gray-700 w-24 flex-shrink-0">{cat.name}</span>
                            <span className="text-xs text-gray-400 w-16 flex-shrink-0">{cat.count.toLocaleString()}개</span>
                            <code className="text-xs text-gray-500 flex-1 truncate">{cat.feedUrl}</code>
                            <button
                              onClick={() => copyCatalogUrl(cat.feedUrl, cat.id)}
                              className="flex-shrink-0 text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors flex items-center gap-1"
                            >
                              {catalogCopied === cat.id ? <><Check className="w-3 h-3 text-green-600" /> 복사됨</> : <><Link2 className="w-3 h-3" /> 복사</>}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="border-t pt-3">
                      <ul className="text-xs text-gray-500 space-y-1">
                        <li>• 페이스북 비즈니스 관리자 → 카탈로그 → 데이터 소스에서 위 URL을 등록하세요.</li>
                        <li>• 피드는 1시간마다 캐시됩니다 (Cache-Control: max-age=3600).</li>
                        <li>• 카테고리별 URL은 해당 카테고리 상품만 포함합니다.</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-6 text-gray-400">
                    <button onClick={fetchCatalogStats} className="text-sm text-blue-600 hover:underline">카탈로그 정보 불러오기</button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-purple-600" />
                  상품 성별 일괄 업데이트
                </h3>
                <p className="text-sm text-gray-500 mt-1">상품명에서 성별(남성/여성/공용)을 자동 감지하여 업데이트합니다.</p>
              </div>
              <div className="p-6">
                <Button
                  data-testid="button-update-genders"
                  onClick={async () => {
                    if (!confirm("모든 상품의 성별 정보를 상품명 기반으로 업데이트합니다. 진행하시겠습니까?")) return;
                    try {
                      const res = await fetchWithAuth("/api/admin/update-product-genders", { method: "POST" });
                      const data = await res.json();
                      if (data.success) {
                        alert(data.message);
                      } else {
                        alert("오류: " + (data.error || "업데이트 실패"));
                      }
                    } catch (e) {
                      alert("요청 중 오류가 발생했습니다.");
                    }
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  성별 정보 자동 업데이트 실행
                </Button>
                <p className="text-xs text-gray-500 mt-2">상품명에 '남성', '여성', 'Mens', 'Womens' 등의 키워드를 감지합니다.</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-blue-600" />
                  상품 옵션(사이즈/색상) 자동 감지
                </h3>
                <p className="text-sm text-gray-500 mt-1">상품명에서 사이즈와 색상을 자동으로 감지하여 옵션을 설정합니다.</p>
              </div>
              <div className="p-6">
                <Button
                  data-testid="button-update-options"
                  onClick={async () => {
                    if (!confirm("옵션이 비어있는 상품들의 사이즈/색상을 상품명에서 자동 감지합니다. 진행하시겠습니까?")) return;
                    try {
                      const res = await fetchWithAuth("/api/admin/update-product-options", { method: "POST" });
                      const data = await res.json();
                      if (data.success) {
                        alert(data.message);
                        fetchProducts();
                      } else {
                        alert("오류: " + (data.error || "업데이트 실패"));
                      }
                    } catch (e) {
                      alert("요청 중 오류가 발생했습니다.");
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  사이즈/색상 자동 감지 실행
                </Button>
                <p className="text-xs text-gray-500 mt-2">이미 옵션이 설정된 상품은 건너뜁니다. S, M, L, XL, 250~310 등의 사이즈와 블랙, 화이트 등의 색상을 감지합니다.</p>
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
              <div className="p-6 space-y-4">
                {/* 현재 상품 수 */}
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
                </div>

                {/* 전체 상품 삭제 위험 영역 */}
                <div className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                  <div className="flex items-start gap-3 mb-3">
                    <Trash2 className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-bold text-red-700">전체 상품 삭제</h4>
                      <p className="text-sm text-red-600 mt-0.5">
                        DB의 모든 상품을 즉시 삭제합니다. 이 작업은 <strong>되돌릴 수 없습니다.</strong>
                      </p>
                    </div>
                  </div>
                  {!showDeleteAllConfirm ? (
                    <Button
                      data-testid="button-clear-products"
                      onClick={() => { setShowDeleteAllConfirm(true); setDeleteAllConfirmText(""); }}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      전체 상품 삭제
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-red-700">
                        확인을 위해 아래 입력창에 <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-red-800">전체삭제</span> 를 입력하세요
                      </p>
                      <input
                        type="text"
                        value={deleteAllConfirmText}
                        onChange={e => setDeleteAllConfirmText(e.target.value)}
                        placeholder="전체삭제"
                        className="w-full border border-red-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                        data-testid="input-delete-all-confirm"
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter' && deleteAllConfirmText === "전체삭제") clearAllProducts(); }}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={clearAllProducts}
                          variant="destructive"
                          size="sm"
                          disabled={deleteAllConfirmText !== "전체삭제" || isDeleting}
                          data-testid="button-confirm-delete-all"
                        >
                          {isDeleting ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />삭제 중...</>
                          ) : (
                            <><Trash2 className="w-4 h-4 mr-2" />확인 — 전체 삭제</>
                          )}
                        </Button>
                        <Button
                          onClick={() => { setShowDeleteAllConfirm(false); setDeleteAllConfirmText(""); }}
                          variant="outline"
                          size="sm"
                          disabled={isDeleting}
                        >
                          취소
                        </Button>
                      </div>
                    </div>
                  )}
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

            {/* ===== NEW CRAWL UI ===== */}

            {/* bagstyle.site 크롤러 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Download className="w-5 h-5 text-teal-600" />
                  bagstyle.site 상품 크롤링
                </h3>
                <p className="text-sm text-gray-500 mt-1">bagstyle.site의 남성·여성·골프 18개 카테고리, 99개 소분류 전체 상품을 상세이미지 포함 수집합니다.</p>
              </div>

              <div className="p-6 space-y-6">

                {/* 소분류 정리 (초과/오류 소분류 삭제) */}
                <div className="border border-red-200 rounded-lg overflow-hidden">
                  <div className="bg-red-50 px-4 py-3 flex items-center gap-2">
                    <span className="text-red-600 font-bold text-sm">⚠ 소분류 정리</span>
                    <span className="text-xs text-red-500">초과·오류 소분류 상품 삭제 후 재크롤 필요</span>
                  </div>
                  <div className="p-4 space-y-2">
                    <p className="text-xs text-gray-500 mb-3">선택한 소분류만 삭제됩니다. 다른 소분류는 절대 건드리지 않습니다.</p>
                    <div className="space-y-1 max-h-64 overflow-y-auto">
                      {PROBLEM_SUBCATS.map(s => (
                        <label key={s.caId} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 rounded px-2 py-1">
                          <input
                            type="checkbox"
                            checked={selectedCleanupSubcats.includes(s.caId)}
                            onChange={e => setSelectedCleanupSubcats(prev =>
                              e.target.checked ? [...prev, s.caId] : prev.filter(id => id !== s.caId)
                            )}
                            className="accent-red-500"
                          />
                          <span className="flex-1">{s.name}</span>
                          <span className="text-xs text-red-500 font-medium">{s.issue}</span>
                        </label>
                      ))}
                    </div>
                    <div className="flex items-center gap-3 pt-2 border-t border-red-100 mt-2">
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleSubcatCleanup}
                        disabled={cleanupLoading || selectedCleanupSubcats.length === 0}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        {cleanupLoading ? '삭제 중...' : `선택 ${selectedCleanupSubcats.length}개 소분류 삭제`}
                      </Button>
                      {cleanupResult && (
                        <span className="text-sm text-green-700 font-medium">
                          ✅ {cleanupResult.deleted.toLocaleString()}개 삭제 완료 → 이제 해당 소분류 재크롤 하세요
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 안내 */}
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                  <p className="text-sm text-teal-800">
                    <strong>남성 7개 + 여성 7개 + 골프 4개 = 총 18개 카테고리</strong>, 소분류 99개 전체를 페이지 제한 없이 수집합니다.<br/>
                    카테고리 선택 시 해당 카테고리만 크롤링합니다. 선택하지 않으면 전체 크롤링을 실행합니다.
                  </p>
                </div>

                {/* 소분류 선택 트리 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">소분류 선택 <span className="text-xs font-normal text-gray-500">(선택 안 하면 전체 크롤링)</span></h4>
                    <div className="flex gap-2">
                      <Button data-testid="button-select-all-bagstyle" size="sm" variant="outline" onClick={selectAllBagstyleCategories}>전체 선택</Button>
                      <Button data-testid="button-deselect-all-bagstyle" size="sm" variant="outline" onClick={deselectAllBagstyleCategories}>전체 해제</Button>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1" style={{ overscrollBehavior: "contain" }}>
                    {(() => {
                      const genderGroups = [
                        { label: '남성', color: 'blue', cats: BAGSTYLE_CRAWL_TREE.filter(c => c.gender === '남성') },
                        { label: '여성', color: 'pink', cats: BAGSTYLE_CRAWL_TREE.filter(c => c.gender === '여성') },
                        { label: '골프', color: 'green', cats: BAGSTYLE_CRAWL_TREE.filter(c => c.gender === '골프') },
                      ];
                      return genderGroups.map(group => (
                        <div key={group.label}>
                          <div className={`text-xs font-bold px-2 py-1 rounded mb-1 ${
                            group.color === 'blue' ? 'text-blue-700 bg-blue-50' :
                            group.color === 'pink' ? 'text-pink-700 bg-pink-50' :
                            'text-green-700 bg-green-50'
                          }`}>{group.label}</div>
                          {group.cats.map(cat => {
                            const catSubcatIds = cat.subcategories.map(s => s.caId);
                            const selectedCount = catSubcatIds.filter(id => selectedBagstyleSubcats.includes(id)).length;
                            const allSelected = selectedCount === catSubcatIds.length;
                            const someSelected = selectedCount > 0 && !allSelected;
                            const isExpanded = expandedBagstyleCats.includes(cat.parentCaId);
                            const headerBg = group.color === 'blue'
                              ? (allSelected ? 'border-blue-400 bg-blue-100' : someSelected ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white')
                              : group.color === 'pink'
                              ? (allSelected ? 'border-pink-400 bg-pink-100' : someSelected ? 'border-pink-300 bg-pink-50' : 'border-gray-200 bg-white')
                              : (allSelected ? 'border-green-400 bg-green-100' : someSelected ? 'border-green-300 bg-green-50' : 'border-gray-200 bg-white');
                            return (
                              <div key={cat.parentCaId} className={`rounded-lg border overflow-hidden ${headerBg}`}>
                                <div className="flex items-center gap-2 px-3 py-2">
                                  <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={el => { if (el) el.indeterminate = someSelected; }}
                                    onChange={() => toggleBagstyleCatAll(cat.parentCaId)}
                                    className="rounded flex-shrink-0"
                                    data-testid={`checkbox-bagstyle-cat-${cat.parentCaId}`}
                                  />
                                  <button
                                    className="flex-1 flex items-center justify-between text-left"
                                    onClick={() => toggleBagstyleCatExpand(cat.parentCaId)}
                                    data-testid={`expand-bagstyle-cat-${cat.parentCaId}`}
                                  >
                                    <span className="text-xs font-semibold text-gray-800">{cat.name}</span>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      {selectedCount > 0 && (
                                        <span className={`text-xs font-medium ${
                                          group.color === 'blue' ? 'text-blue-600' :
                                          group.color === 'pink' ? 'text-pink-600' : 'text-green-600'
                                        }`}>{selectedCount}/{catSubcatIds.length}</span>
                                      )}
                                      {!selectedCount && <span className="text-xs text-gray-400">{catSubcatIds.length}개</span>}
                                      <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                  </button>
                                </div>
                                {isExpanded && (
                                  <div className="px-3 pb-2 pt-1 border-t border-gray-100 bg-gray-50">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                                      {cat.subcategories.map(sub => {
                                        const isSubSelected = selectedBagstyleSubcats.includes(sub.caId);
                                        return (
                                          <label
                                            key={sub.caId}
                                            data-testid={`checkbox-bagstyle-sub-${sub.caId}`}
                                            className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
                                              isSubSelected
                                                ? group.color === 'blue' ? 'bg-blue-100 text-blue-800 font-medium'
                                                  : group.color === 'pink' ? 'bg-pink-100 text-pink-800 font-medium'
                                                  : 'bg-green-100 text-green-800 font-medium'
                                                : 'bg-white text-gray-700 hover:bg-gray-100'
                                            } border ${isSubSelected ? (group.color === 'blue' ? 'border-blue-300' : group.color === 'pink' ? 'border-pink-300' : 'border-green-300') : 'border-gray-200'}`}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={isSubSelected}
                                              onChange={() => toggleBagstyleSubcat(sub.caId)}
                                              className="w-3 h-3 flex-shrink-0"
                                            />
                                            <span className="truncate">{sub.name}</span>
                                          </label>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>
                  {selectedBagstyleSubcats.length > 0 && (
                    <p className="text-xs text-teal-600 mt-2 font-medium">소분류 {selectedBagstyleSubcats.length}개 선택됨</p>
                  )}
                </div>

                {/* 실시간 현황 패널 */}
                {bagstyleProgress.status !== 'idle' && (
                  <div className={`rounded-xl border-2 p-5 space-y-4 ${
                    bagstyleProgress.status === 'running' ? 'border-teal-300 bg-teal-50' :
                    bagstyleProgress.status === 'completed' ? 'border-green-300 bg-green-50' :
                    'border-red-300 bg-red-50'
                  }`}>
                    {/* 상태 헤더 */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {bagstyleProgress.status === 'running' && <Loader2 className="w-5 h-5 text-teal-600 animate-spin" />}
                        {bagstyleProgress.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {bagstyleProgress.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                        <span className={`font-bold text-sm ${
                          bagstyleProgress.status === 'running' ? 'text-teal-700' :
                          bagstyleProgress.status === 'completed' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {bagstyleProgress.status === 'running' ? '크롤링 진행 중' :
                           bagstyleProgress.status === 'completed' ? '크롤링 완료' : '오류 발생'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-gray-800">{bagstyleProgress.grandTotal.toLocaleString()}개</div>
                        <div className="text-xs text-gray-500">저장 완료</div>
                      </div>
                    </div>

                    {/* 현재 작업 */}
                    {bagstyleProgress.message && (
                      <div className="bg-white rounded-lg px-3 py-2 border">
                        <p className="text-xs text-gray-600 font-mono">{bagstyleProgress.message}</p>
                      </div>
                    )}

                    {/* 소분류 진행 바 */}
                    {bagstyleProgress.status === 'running' && bagstyleProgress.total > 0 && (
                      <div>
                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                          <span>소분류 진행</span>
                          <span>{bagstyleProgress.current.toLocaleString()} / {bagstyleProgress.total.toLocaleString()} ({Math.round(bagstyleProgress.current / bagstyleProgress.total * 100)}%)</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, Math.round(bagstyleProgress.current / bagstyleProgress.total * 100))}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 소분류 로그 (터미널) */}
                    {bagstyleProgress.subcatLog.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-gray-500 font-medium">소분류별 수집 로그</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{bagstyleProgress.subcatLog.length}개</span>
                        </div>
                        <div
                          ref={subcatLogRef}
                          data-testid="crawl-subcat-log"
                          className="bg-gray-900 text-green-400 text-xs font-mono p-3 rounded-lg max-h-48 overflow-y-auto space-y-0.5"
                        >
                          {bagstyleProgress.subcatLog.map((line, i) => (
                            <div key={i} className={line.includes('✓') ? 'text-green-400' : line.includes('✗') ? 'text-red-400' : line.includes('0개') ? 'text-yellow-400' : 'text-gray-300'}>
                              {line}
                            </div>
                          ))}
                          {bagstyleProgress.status === 'running' && (
                            <div className="text-teal-400 animate-pulse">▌</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 이어서 하기 안내 배너 */}
                {canResume && bagstyleProgress.status !== 'running' && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-800">이전 크롤링을 이어서 할 수 있습니다</p>
                      <p className="text-xs text-amber-600">완료된 소분류 {resumeCompletedCount}개 — 나머지부터 재개합니다</p>
                    </div>
                    <Button
                      data-testid="button-resume-bagstyle-crawl"
                      onClick={resumeBagstyleCrawl}
                      className="bg-amber-500 hover:bg-amber-600 text-white shrink-0"
                      size="sm"
                    >
                      이어서 하기
                    </Button>
                  </div>
                )}

                {/* 컨트롤 버튼 */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    data-testid="button-start-bagstyle-crawl"
                    onClick={startBagstyleCrawl}
                    disabled={bagstyleProgress.status === 'running'}
                    className="bg-teal-600 hover:bg-teal-700 text-white flex-1"
                  >
                    {bagstyleProgress.status === 'running' ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />크롤링 중...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" />{selectedBagstyleSubcats.length > 0 ? `선택 소분류 크롤링 (${selectedBagstyleSubcats.length}개)` : '전체 크롤링 시작'}</>
                    )}
                  </Button>
                  {bagstyleProgress.status === 'running' && (
                    <Button
                      data-testid="button-stop-bagstyle-crawl"
                      onClick={stopBagstyleCrawl}
                      variant="outline"
                      className="border-orange-300 text-orange-600 hover:bg-orange-50"
                    >
                      <XCircle className="w-4 h-4 mr-2" />중단
                    </Button>
                  )}
                  {(bagstyleProgress.status === 'completed' || bagstyleProgress.status === 'error' || (bagstyleProgress.status === 'idle' && canResume)) && (
                    <Button
                      data-testid="button-reset-bagstyle-crawl"
                      onClick={resetBagstyleCrawl}
                      variant="outline"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />초기화
                    </Button>
                  )}
                </div>

                {/* 크롤링 안내 */}
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• 크롤링은 소분류 단위로 진행되며 전체 완료까지 수 시간이 소요될 수 있습니다.</p>
                  <p>• 중단 버튼 클릭 시 현재 소분류 완료 후 멈춥니다.</p>
                  <p>• 완료 후 초기화 버튼을 눌러야 다시 시작할 수 있습니다.</p>
                </div>
              </div>
            </div>

            {/* bloostore.co.kr 시계 크롤러 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Download className="w-5 h-5 text-blue-600" />
                  bloostore.co.kr 시계 크롤링
                </h3>
                <p className="text-sm text-gray-500 mt-1">bloostore.co.kr에서 8개 럭셔리 시계 브랜드 상품을 크롤링합니다. (롤렉스, 까르띠에, IWC, 파텍필립, 오데마피게, 브라이틀링, 오메가, 샤넬)</p>
              </div>
              <div className="p-6 space-y-6">
                {/* 브랜드 선택 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-800">브랜드 선택 (선택 안 하면 전체 크롤링)</h4>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={selectAllBloostoreBrands}>전체 선택</Button>
                      <Button size="sm" variant="outline" onClick={deselectAllBloostoreBrands}>전체 해제</Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {BLOOSTORE_BRANDS.map(brand => {
                      const isSelected = selectedBloostoreBrands.includes(brand.id);
                      return (
                        <label
                          key={brand.id}
                          data-testid={`checkbox-bloostore-brand-${brand.id}`}
                          className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'border-blue-500 bg-blue-100' : 'border-blue-200 bg-blue-50'} hover:opacity-80`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBloostoreBrand(brand.id)}
                            className="rounded"
                          />
                          <span className="text-sm font-medium text-gray-800">{brand.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* 실시간 현황 */}
                {bloostoreProgress.status !== 'idle' && (
                  <div className={`rounded-xl border-2 p-5 space-y-3 ${
                    bloostoreProgress.status === 'running' ? 'border-blue-300 bg-blue-50' :
                    bloostoreProgress.status === 'completed' ? 'border-green-300 bg-green-50' :
                    'border-red-300 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {bloostoreProgress.status === 'running' && <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />}
                        {bloostoreProgress.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                        {bloostoreProgress.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                        <span className={`font-bold text-sm ${
                          bloostoreProgress.status === 'running' ? 'text-blue-700' :
                          bloostoreProgress.status === 'completed' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {bloostoreProgress.status === 'running' ? '크롤링 진행 중' :
                           bloostoreProgress.status === 'completed' ? '완료' : '오류'}
                        </span>
                      </div>
                      {bloostoreProgress.current > 0 && (
                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">{bloostoreProgress.current.toLocaleString()}개</div>
                          <div className="text-xs text-gray-500">수집됨</div>
                        </div>
                      )}
                    </div>
                    {bloostoreProgress.message && (
                      <div className="bg-white rounded-lg px-3 py-2 border">
                        <p className="text-xs text-gray-600 font-mono">{bloostoreProgress.message}</p>
                      </div>
                    )}
                    {bloostoreProgress.brand && (
                      <p className="text-xs text-blue-600">현재 브랜드: <strong>{bloostoreProgress.brand}</strong></p>
                    )}
                  </div>
                )}

                {/* 컨트롤 버튼 */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    data-testid="button-start-bloostore-crawl"
                    onClick={startBloostoreCrawl}
                    disabled={bloostoreProgress.status === 'running'}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
                  >
                    {bloostoreProgress.status === 'running' ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />크롤링 중...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" />{selectedBloostoreBrands.length > 0 ? `선택 브랜드 크롤링 (${selectedBloostoreBrands.length}개)` : '전체 브랜드 크롤링'}</>
                    )}
                  </Button>
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• 블루스토어 시계 카테고리에서 상품명/이미지/가격을 수집합니다.</p>
                  <p>• 성별은 '없음'으로 저장되며 카테고리는 '시계'로 고정됩니다.</p>
                </div>
              </div>
            </div>

            {/* 시계 상세이미지 크롤러 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 text-indigo-600" />
                  시계 상세이미지 업데이트
                </h3>
                <p className="text-sm text-gray-500 mt-1">블루스토어에서 시계 상품의 상세이미지를 다시 크롤링하여 업데이트합니다.</p>
              </div>
              <div className="p-6 space-y-4">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={watchDetailOnlyMissing}
                    onChange={e => setWatchDetailOnlyMissing(e.target.checked)}
                    className="w-4 h-4 accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">이미지 없는 상품만 업데이트 (빠름)</span>
                </label>

                {watchDetailProgress.status !== 'idle' && (
                  <div className={`rounded-lg p-4 border space-y-2 ${
                    watchDetailProgress.status === 'running' ? 'border-indigo-300 bg-indigo-50' :
                    watchDetailProgress.status === 'completed' ? 'border-green-300 bg-green-50' :
                    'border-red-300 bg-red-50'
                  }`}>
                    <div className="flex items-center gap-2">
                      {watchDetailProgress.status === 'running' && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />}
                      {watchDetailProgress.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                      {watchDetailProgress.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                      <span className={`text-sm font-medium ${
                        watchDetailProgress.status === 'running' ? 'text-indigo-700' :
                        watchDetailProgress.status === 'completed' ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {watchDetailProgress.status === 'running' ? '진행 중' :
                         watchDetailProgress.status === 'completed' ? '완료' : '오류'}
                      </span>
                    </div>
                    {watchDetailProgress.message && (
                      <p className="text-xs text-gray-600 font-mono">{watchDetailProgress.message}</p>
                    )}
                    {watchDetailProgress.total > 0 && (
                      <div className="flex gap-4 text-xs text-gray-600">
                        <span>전체 <strong>{watchDetailProgress.total}</strong>개</span>
                        <span>업데이트 <strong className="text-green-700">{watchDetailProgress.updated}</strong>개</span>
                        <span>건너뜀 <strong>{watchDetailProgress.skipped}</strong>개</span>
                        <span>진행 <strong>{watchDetailProgress.current}</strong>/{watchDetailProgress.total}</span>
                      </div>
                    )}
                    {watchDetailProgress.total > 0 && watchDetailProgress.status === 'running' && (
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all"
                          style={{ width: `${Math.round((watchDetailProgress.current / watchDetailProgress.total) * 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={startWatchDetailCrawl}
                    disabled={watchDetailProgress.status === 'running'}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1"
                  >
                    {watchDetailProgress.status === 'running' ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />크롤링 중...</>
                    ) : (
                      <><RefreshCw className="w-4 h-4 mr-2" />상세이미지 업데이트 시작</>
                    )}
                  </Button>
                  {watchDetailProgress.status !== 'idle' && watchDetailProgress.status !== 'running' && (
                    <Button
                      variant="outline"
                      onClick={() => setWatchDetailProgress({ status: 'idle', total: 0, current: 0, updated: 0, skipped: 0, message: '' })}
                    >
                      초기화
                    </Button>
                  )}
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• 블루스토어에서 시계 상품의 상세이미지 URL을 재수집합니다.</p>
                  <p>• "이미지 없는 상품만" 체크 시 imageUrls가 비어있는 상품만 대상으로 합니다.</p>
                </div>
              </div>
            </div>

            {/* pulua.co.kr 시계 크롤러 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Download className="w-5 h-5 text-emerald-600" />
                  pulua.co.kr 시계 크롤링
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  pulua.co.kr 시계 카테고리 (~940개)에서 상품명·가격·상세이미지를 한 번에 수집합니다.
                </p>
              </div>
              <div className="p-6 space-y-4">
                {puluaProgress.status !== 'idle' && (
                  <div className={`rounded-xl border-2 p-4 space-y-3 ${
                    puluaProgress.status === 'running' ? 'border-emerald-300 bg-emerald-50' :
                    puluaProgress.status === 'completed' ? 'border-green-300 bg-green-50' :
                    'border-red-300 bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {puluaProgress.status === 'running' && <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />}
                        {puluaProgress.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-600" />}
                        {puluaProgress.status === 'error' && <XCircle className="w-4 h-4 text-red-600" />}
                        <span className={`font-bold text-sm ${
                          puluaProgress.status === 'running' ? 'text-emerald-700' :
                          puluaProgress.status === 'completed' ? 'text-green-700' : 'text-red-700'
                        }`}>
                          {puluaProgress.status === 'running' ? '크롤링 진행 중' :
                           puluaProgress.status === 'completed' ? '완료' : '중단/오류'}
                        </span>
                      </div>
                      {puluaProgress.total > 0 && (
                        <div className="text-right text-xs text-gray-500">
                          <span className="font-bold text-gray-800">{puluaProgress.current}</span>/{puluaProgress.total}
                        </div>
                      )}
                    </div>
                    {puluaProgress.message && (
                      <div className="bg-white rounded-lg px-3 py-2 border">
                        <p className="text-xs text-gray-600 font-mono truncate">{puluaProgress.message}</p>
                      </div>
                    )}
                    {puluaProgress.total > 0 && (
                      <>
                        <div className="flex gap-4 text-xs text-gray-600">
                          <span>저장 <strong className="text-emerald-700">{puluaProgress.inserted}</strong>개</span>
                          <span>건너뜀 <strong>{puluaProgress.skipped}</strong>개</span>
                          <span>전체 <strong>{puluaProgress.total}</strong>개</span>
                        </div>
                        {puluaProgress.status === 'running' && (
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div
                              className="bg-emerald-500 h-1.5 rounded-full transition-all"
                              style={{ width: `${puluaProgress.total > 0 ? Math.round((puluaProgress.current / puluaProgress.total) * 100) : 0}%` }}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {/* 시계 상품 전체 삭제 */}
                <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-3">
                  <p className="text-sm font-semibold text-red-700">⚠ 시계 상품 전체 삭제</p>
                  <p className="text-xs text-red-600">기존 시계 상품을 모두 삭제하고 풀루아 상품으로 새로 채울 때 사용합니다. 이 작업은 되돌릴 수 없습니다.</p>
                  {!watchDeleteConfirm ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setWatchDeleteConfirm(true)}
                      className="border-red-400 text-red-600 hover:bg-red-100"
                      disabled={puluaProgress.status === 'running'}
                    >
                      시계 상품 전체 삭제
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={deleteAllWatches}
                        disabled={watchDeleting}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        {watchDeleting ? <><Loader2 className="w-3 h-3 mr-1 animate-spin" />삭제 중...</> : "정말 삭제"}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setWatchDeleteConfirm(false)}>취소</Button>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={startPuluaCrawl}
                    disabled={puluaProgress.status === 'running'}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1"
                    data-testid="button-start-pulua-crawl"
                  >
                    {puluaProgress.status === 'running' ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />크롤링 중...</>
                    ) : (
                      <><Download className="w-4 h-4 mr-2" />풀루아 크롤링 시작</>
                    )}
                  </Button>
                  {puluaProgress.status === 'running' && (
                    <Button variant="outline" onClick={stopPuluaCrawl} className="border-red-300 text-red-600 hover:bg-red-50">
                      중단
                    </Button>
                  )}
                  {puluaProgress.status !== 'idle' && puluaProgress.status !== 'running' && (
                    <Button variant="outline" onClick={() => setPuluaProgress({ status: 'idle', total: 0, current: 0, inserted: 0, skipped: 0, message: '' })}>
                      초기화
                    </Button>
                  )}
                </div>
                <div className="text-xs text-gray-400 space-y-1">
                  <p>• pulua.co.kr/category/시계/28/ 전체 페이지를 순서대로 수집합니다.</p>
                  <p>• 상품별 상세 페이지에서 이미지 8~10장을 한 번에 가져옵니다.</p>
                  <p>• 이미 DB에 있는 상품(이름·URL 기준)은 자동으로 건너뜁니다.</p>
                  <p>• 카테고리는 '시계'로 고정, 브랜드는 상품명에서 자동 매칭합니다.</p>
                </div>
              </div>
            </div>

          </div>
        )}

        {activeTab === "contentSections" && adminRole === "super_admin" && (
          <ContentSectionsTab authToken={authToken} />
        )}

        {activeTab === "magazines" && adminRole === "super_admin" && (
          <MagazinesTab authToken={authToken} />
        )}

        {activeTab === "labs" && adminRole === "super_admin" && (
          <LabsTab authToken={authToken} />
        )}

        {activeTab === "quickMenu" && adminRole === "super_admin" && (
          <QuickMenuTab authToken={authToken} />
        )}

        {activeTab === "telegram" && adminRole === "super_admin" && (
          <div className="space-y-6 max-w-2xl">
            {/* 헤더 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.447 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.12l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.461c.537-.194 1.006.131.833.941z"/></svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold">텔레그램 봇 연결</h2>
                  <p className="text-sm text-gray-500">주문·회원가입·채팅 알림을 텔레그램으로 즉시 받습니다.</p>
                </div>
              </div>

              {/* 스텝 인디케이터 */}
              <div className="flex items-center gap-2 mt-4">
                {[1,2,3].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${tgStep >= s ? "bg-sky-500 text-white" : "bg-gray-200 text-gray-500"}`}>{s}</div>
                    {s < 3 && <div className={`h-1 w-10 rounded ${tgStep > s ? "bg-sky-500" : "bg-gray-200"}`} />}
                  </div>
                ))}
                <span className="ml-2 text-sm text-gray-500">{tgStep === 1 ? "봇 토큰 입력" : tgStep === 2 ? "채팅 ID 선택" : "알림 설정"}</span>
              </div>
            </div>

            {/* Step 1 — 토큰 입력 */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${tgStep >= 1 ? "bg-sky-500 text-white" : "bg-gray-200"}`}>1</div>
                <h3 className="font-bold">봇 토큰 입력</h3>
              </div>
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sm text-sky-800 space-y-1">
                <p className="font-semibold">📱 BotFather에서 토큰 발급받기</p>
                <p>① 텔레그램 앱에서 <b>@BotFather</b> 검색 → 대화 시작</p>
                <p>② <code className="bg-sky-100 px-1 rounded">/newbot</code> 입력 → 봇 이름·username 설정</p>
                <p>③ 발급된 <b>토큰</b>을 아래에 붙여넣기</p>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                  value={tgSettings.token}
                  onChange={e => setTgSettings(p => ({ ...p, token: e.target.value }))}
                  className="font-mono text-sm"
                  data-testid="input-tg-token"
                />
                <Button
                  onClick={async () => {
                    if (!tgSettings.token.trim()) return;
                    setTgLoading(true); setTgMsg(null);
                    const r = await fetchWithAuth("/api/admin/telegram/validate", { method: "POST", body: JSON.stringify({ token: tgSettings.token.trim() }) });
                    const d = await r.json();
                    setTgLoading(false);
                    if (d.success) { setTgBotInfo(d.data); setTgStep(2); setTgMsg({ type: "ok", text: `✅ @${d.data.username} 연결 성공!` }); }
                    else setTgMsg({ type: "err", text: d.error });
                  }}
                  disabled={tgLoading || !tgSettings.token.trim()}
                  className="bg-sky-500 hover:bg-sky-600 text-white shrink-0"
                  data-testid="button-tg-validate"
                >
                  {tgLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "자동 확인"}
                </Button>
              </div>
              {tgBotInfo && <p className="text-sm text-green-600 font-semibold">✅ 봇: {tgBotInfo.firstName} (@{tgBotInfo.username})</p>}
              {tgMsg && <p className={`text-sm font-medium ${tgMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{tgMsg.text}</p>}
            </div>

            {/* Step 2 — 채팅 ID */}
            {tgStep >= 2 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-sky-500 text-white">2</div>
                  <h3 className="font-bold">알림 받을 채팅 선택</h3>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800 space-y-1">
                  <p className="font-semibold">📋 채팅 ID 자동 감지 방법</p>
                  <p>① 봇을 알림 받을 <b>채널/그룹에 초대</b>하거나, 봇과 <b>개인 채팅</b> 시작</p>
                  <p>② 해당 채팅에서 <b>아무 메시지나 1개</b> 보내기</p>
                  <p>③ 아래 [채팅 자동 감지] 버튼 클릭</p>
                </div>
                <Button
                  onClick={async () => {
                    setTgLoading(true); setTgMsg(null);
                    const r = await fetchWithAuth("/api/admin/telegram/get-chats", { method: "POST", body: JSON.stringify({ token: tgSettings.token }) });
                    const d = await r.json();
                    setTgLoading(false);
                    if (d.success) {
                      setTgChats(d.data);
                      if (d.data.length === 0) setTgMsg({ type: "err", text: "감지된 채팅이 없습니다. 봇에게 먼저 메시지를 보내주세요." });
                      else setTgMsg({ type: "ok", text: `${d.data.length}개 채팅 감지됨. 아래에서 선택하세요.` });
                    } else setTgMsg({ type: "err", text: d.error });
                  }}
                  disabled={tgLoading}
                  className="bg-amber-500 hover:bg-amber-600 text-white"
                  data-testid="button-tg-get-chats"
                >
                  {tgLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                  채팅 자동 감지
                </Button>

                {tgChats.length > 0 && (
                  <div className="space-y-2">
                    {tgChats.map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => { setTgSettings(p => ({ ...p, chatId: chat.id })); setTgStep(3); setTgMsg(null); }}
                        className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${tgSettings.chatId === chat.id ? "border-sky-500 bg-sky-50" : "border-gray-200 hover:border-sky-300"}`}
                        data-testid={`button-tg-chat-${chat.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{chat.title}</span>
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{chat.type}</span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">ID: {chat.id}</span>
                        {tgSettings.chatId === chat.id && <span className="ml-2 text-sky-500 text-xs font-bold">✓ 선택됨</span>}
                      </button>
                    ))}
                  </div>
                )}

                {/* 직접 입력 */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">또는 채팅 ID 직접 입력</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="-1001234567890"
                      value={tgSettings.chatId}
                      onChange={e => setTgSettings(p => ({ ...p, chatId: e.target.value }))}
                      className="font-mono text-sm"
                      data-testid="input-tg-chatid"
                    />
                    {tgSettings.chatId && <Button onClick={() => setTgStep(3)} className="bg-sky-500 hover:bg-sky-600 text-white shrink-0">다음 →</Button>}
                  </div>
                </div>
                {tgMsg && <p className={`text-sm font-medium ${tgMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{tgMsg.text}</p>}
              </div>
            )}

            {/* Step 3 — 알림 설정 + 저장 */}
            {tgStep >= 3 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-sky-500 text-white">3</div>
                  <h3 className="font-bold">알림 설정</h3>
                </div>

                {/* 활성화 토글 */}
                <div className="flex items-center justify-between p-4 bg-sky-50 border border-sky-200 rounded-lg">
                  <div>
                    <p className="font-bold text-sky-900">텔레그램 알림 활성화</p>
                    <p className="text-xs text-sky-700">비활성화 시 아무 알림도 발송되지 않습니다.</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={tgSettings.enabled} onChange={e => setTgSettings(p => ({ ...p, enabled: e.target.checked }))} className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                  </label>
                </div>

                {/* 알림 항목 토글 */}
                <div className="space-y-3">
                  {([
                    { key: "notifyOrder" as const, icon: "🛍️", label: "새 주문 알림", desc: "고객이 주문할 때마다 알림" },
                    { key: "notifyMember" as const, icon: "🎉", label: "신규 회원가입 알림", desc: "새 회원이 가입할 때마다 알림" },
                    { key: "notifyChat" as const, icon: "💬", label: "1:1 채팅 메시지 알림", desc: "고객이 채팅 메시지를 보낼 때 알림" },
                  ]).map(({ key, icon, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{icon}</span>
                        <div>
                          <p className="font-medium text-sm">{label}</p>
                          <p className="text-xs text-gray-400">{desc}</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" checked={tgSettings[key]} onChange={e => setTgSettings(p => ({ ...p, [key]: e.target.checked }))} className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
                      </label>
                    </div>
                  ))}
                </div>

                {/* 테스트 + 저장 */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      setTgLoading(true); setTgMsg(null);
                      const r = await fetchWithAuth("/api/admin/telegram/test", { method: "POST", body: JSON.stringify({ token: tgSettings.token, chatId: tgSettings.chatId }) });
                      const d = await r.json();
                      setTgLoading(false);
                      setTgMsg(d.success ? { type: "ok", text: "✅ 테스트 메시지 전송 완료!" } : { type: "err", text: d.error });
                    }}
                    disabled={tgLoading}
                    data-testid="button-tg-test"
                  >
                    {tgLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    테스트 메시지 전송
                  </Button>
                  <Button
                    onClick={async () => {
                      setTgSaving(true); setTgMsg(null);
                      const r = await fetchWithAuth("/api/admin/telegram/settings", { method: "POST", body: JSON.stringify(tgSettings) });
                      const d = await r.json();
                      setTgSaving(false);
                      setTgMsg(d.success ? { type: "ok", text: "✅ 저장 완료! 이제 텔레그램으로 알림이 발송됩니다." } : { type: "err", text: d.error });
                    }}
                    disabled={tgSaving}
                    className="bg-sky-500 hover:bg-sky-600 text-white"
                    data-testid="button-tg-save"
                  >
                    {tgSaving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                    설정 저장
                  </Button>
                </div>
                {tgMsg && <p className={`text-sm font-medium ${tgMsg.type === "ok" ? "text-green-600" : "text-red-600"}`}>{tgMsg.text}</p>}
              </div>
            )}
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

function BenefitHeroSetting({ authToken }: { authToken: string }) {
  const { toast } = useToast();
  const [heroUrl, setHeroUrl] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings/benefit_hero")
      .then(r => r.json())
      .then(d => { if (d.success && d.data?.value) setHeroUrl(d.data.value); })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings/benefit_hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ value: heroUrl || " ", description: "이달의 혜택 히어로 배너 이미지" }),
      });
      if (res.ok) {
        toast({ title: "저장 완료", description: "혜택 히어로 배너가 저장되었습니다." });
      } else {
        toast({ title: "오류", description: "저장 실패", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "저장 실패", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Gift className="w-5 h-5 text-purple-600" />
          이달의 혜택 히어로 배너
        </h3>
        <p className="text-sm text-gray-500 mt-1">/benefits 페이지 상단에 표시될 대형 배너 이미지를 설정합니다.</p>
      </div>
      <div className="p-6">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">배너 이미지</label>
            <div className="flex gap-2">
              <Input
                data-testid="input-benefit-hero-url"
                value={heroUrl}
                onChange={e => setHeroUrl(e.target.value)}
                placeholder="https://... 또는 이미지 업로드"
                className="flex-1"
              />
              <label className="cursor-pointer flex-shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const fd = new FormData();
                    fd.append("image", file);
                    try {
                      const res = await fetch("/api/admin/upload/banner-image", {
                        method: "POST",
                        headers: { Authorization: `Bearer ${authToken}` },
                        body: fd,
                      });
                      const data = await res.json();
                      if (data.success && data.data?.imageUrl) {
                        setHeroUrl(data.data.imageUrl);
                      }
                    } catch {}
                    e.target.value = "";
                  }}
                />
                <div className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50 h-full">
                  <Upload className="w-3.5 h-3.5" />
                  업로드
                </div>
              </label>
              <Button
                data-testid="btn-save-benefit-hero"
                onClick={save}
                disabled={saving}
                className="bg-purple-500 hover:bg-purple-600"
              >
                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "저장"}
              </Button>
            </div>
          </div>
          {heroUrl && (
            <div className="mt-3">
              <p className="text-xs text-gray-500 mb-2">미리보기:</p>
              <div className="max-w-md rounded-lg overflow-hidden border border-gray-200">
                <img src={heroUrl} alt="혜택 히어로 배너" className="w-full object-cover" />
              </div>
            </div>
          )}
          <p className="text-xs text-gray-400">이미지를 비워두면 기본 그라데이션 배경이 표시됩니다.</p>
        </div>
      </div>
    </div>
  );
}

function HomeSectionTitlesEditor() {
  const sections = [
    { key: "home_topBrand", defaultTitle: "Top Brand", defaultSubtitle: "인기 탑 브랜드", label: "Top Brand 섹션" },
    { key: "home_forYou", defaultTitle: "For You", defaultSubtitle: "고객님을 위해 준비해 봤어요.", label: "For You 섹션" },
  ];
  const [values, setValues] = useState<Record<string, { title: string; subtitle: string }>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    sections.forEach(async (s) => {
      try {
        const res = await fetch(`/api/settings/${s.key}`);
        const data = await res.json();
        if (data.success && data.data?.value) {
          try {
            const parsed = JSON.parse(data.data.value);
            setValues(prev => ({ ...prev, [s.key]: parsed }));
          } catch {}
        }
        if (!values[s.key]) {
          setValues(prev => ({ ...prev, [s.key]: { title: s.defaultTitle, subtitle: s.defaultSubtitle } }));
        }
      } catch {}
    });
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      const token = localStorage.getItem("adminToken");
      await fetch(`/api/admin/settings/${key}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ value: JSON.stringify(values[key]) }),
      });
    } catch {}
    setSaving(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          홈 섹션 타이틀 설정
        </h3>
        <p className="text-sm text-gray-500 mt-1">메인 페이지의 각 섹션 제목과 부제를 변경합니다.</p>
      </div>
      <div className="p-6 space-y-6">
        {sections.map((s) => (
          <div key={s.key} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-3">{s.label}</h4>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">제목</label>
                <Input
                  value={values[s.key]?.title || s.defaultTitle}
                  onChange={(e) => setValues(prev => ({ ...prev, [s.key]: { ...prev[s.key], title: e.target.value } }))}
                  placeholder={s.defaultTitle}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">부제</label>
                <Input
                  value={values[s.key]?.subtitle || s.defaultSubtitle}
                  onChange={(e) => setValues(prev => ({ ...prev, [s.key]: { ...prev[s.key], subtitle: e.target.value } }))}
                  placeholder={s.defaultSubtitle}
                />
              </div>
            </div>
            <Button size="sm" onClick={() => handleSave(s.key)} disabled={saving === s.key} className="bg-blue-600 hover:bg-blue-700">
              {saving === s.key ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : null}
              저장
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}


const SECTION_TYPES = [
  { value: "homepage_product", label: "홈 상품 섹션" },
  { value: "celeb_style", label: "셀럽 스타일" },
  { value: "exhibition", label: "기획전" },
  { value: "best", label: "베스트" },
  { value: "live", label: "라이브" },
  { value: "monthly_benefit", label: "이달의 혜택" },
] as const;

const getSectionLabel = (val: string) => SECTION_TYPES.find(s => s.value === val)?.label || val;

interface ContentBlock {
  id: string;
  type: "banner" | "text" | "buttons" | "coupon" | "divider";
  imageUrl?: string;
  linkUrl?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  bgColor?: string;
  buttons?: { label: string; linkUrl: string; style: "filled" | "outline" }[];
  coupons?: { label: string; value: string }[];
}

const BLOCK_TYPES = [
  { value: "banner", label: "배너", icon: Image },
  { value: "text", label: "텍스트", icon: Type },
  { value: "buttons", label: "버튼", icon: MousePointer },
  { value: "coupon", label: "쿠폰", icon: Gift },
  { value: "divider", label: "구분선", icon: Minus },
] as const;

function generateBlockId() {
  return "blk_" + Math.random().toString(36).substring(2, 10);
}

function ContentBlockEditor({ blocks, onChange, authToken }: { blocks: ContentBlock[]; onChange: (blocks: ContentBlock[]) => void; authToken: string }) {
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [uploadingBlockId, setUploadingBlockId] = useState<string | null>(null);

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = { id: generateBlockId(), type };
    if (type === "banner") { newBlock.imageUrl = ""; newBlock.linkUrl = ""; }
    if (type === "text") { newBlock.heading = ""; newBlock.subheading = ""; newBlock.body = ""; newBlock.bgColor = "#ffffff"; }
    if (type === "buttons") { newBlock.buttons = [{ label: "", linkUrl: "", style: "filled" }]; }
    if (type === "coupon") { newBlock.coupons = [{ label: "", value: "" }]; }
    onChange([...blocks, newBlock]);
    setShowBlockMenu(false);
  };

  const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
    onChange(blocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const removeBlock = (id: string) => {
    onChange(blocks.filter(b => b.id !== id));
  };

  const moveBlock = (id: string, direction: "up" | "down") => {
    const idx = blocks.findIndex(b => b.id === id);
    if (idx < 0) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[idx], newBlocks[newIdx]] = [newBlocks[newIdx], newBlocks[idx]];
    onChange(newBlocks);
  };

  const uploadBannerImage = async (blockId: string, file: File) => {
    setUploadingBlockId(blockId);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/upload/banner-image", {
        method: "POST",
        headers: { Authorization: `Bearer ${authToken}` },
        body: fd,
      });
      const data = await res.json();
      if (data.success && data.data?.imageUrl) {
        updateBlock(blockId, { imageUrl: data.data.imageUrl });
      }
    } catch {} finally {
      setUploadingBlockId(null);
    }
  };

  const getBlockTypeLabel = (type: string) => BLOCK_TYPES.find(bt => bt.value === type)?.label || type;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold">콘텐츠 블록 ({blocks.length}개)</label>
        <div className="relative">
          <Button
            data-testid="btn-add-block"
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setShowBlockMenu(!showBlockMenu)}
            className="text-xs"
          >
            <Plus className="w-3 h-3 mr-1" />
            블록 추가
          </Button>
          {showBlockMenu && (
            <div className="absolute right-0 top-full mt-1 bg-white border rounded-lg shadow-lg z-20 w-40">
              {BLOCK_TYPES.map(bt => (
                <button
                  key={bt.value}
                  type="button"
                  data-testid={`btn-add-block-${bt.value}`}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm border-b last:border-b-0"
                  onClick={() => addBlock(bt.value as ContentBlock["type"])}
                >
                  <bt.icon className="w-4 h-4 text-gray-500" />
                  {bt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-6 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">
          블록을 추가하여 콘텐츠를 구성하세요
        </div>
      )}

      {blocks.map((block, idx) => (
        <div key={block.id} data-testid={`content-block-${block.id}`} className="border rounded-lg bg-white overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b">
            <span className="text-xs font-semibold text-pink-600 bg-pink-50 px-2 py-0.5 rounded">{getBlockTypeLabel(block.type)}</span>
            <span className="text-xs text-gray-400">#{idx + 1}</span>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                data-testid={`btn-move-up-${block.id}`}
                disabled={idx === 0}
                onClick={() => moveBlock(block.id, "up")}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid={`btn-move-down-${block.id}`}
                disabled={idx === blocks.length - 1}
                onClick={() => moveBlock(block.id, "down")}
                className="p-1 hover:bg-gray-200 rounded disabled:opacity-30"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                data-testid={`btn-delete-block-${block.id}`}
                onClick={() => removeBlock(block.id)}
                className="p-1 hover:bg-red-100 text-red-500 rounded ml-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-2">
            {block.type === "banner" && (
              <>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">이미지 URL</label>
                    <Input
                      data-testid={`block-banner-url-${block.id}`}
                      value={block.imageUrl || ""}
                      onChange={e => updateBlock(block.id, { imageUrl: e.target.value })}
                      placeholder="https://... 또는 이미지 업로드"
                      className="text-sm"
                    />
                  </div>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) uploadBannerImage(block.id, file);
                      }}
                    />
                    <div className={`px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50 ${uploadingBlockId === block.id ? "opacity-50" : ""}`}>
                      {uploadingBlockId === block.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      업로드
                    </div>
                  </label>
                </div>
                {block.imageUrl && (
                  <div className="mt-1 rounded overflow-hidden border bg-gray-50 max-h-32">
                    <img src={block.imageUrl} alt="배너 미리보기" className="w-full h-32 object-cover" />
                  </div>
                )}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">링크 URL (선택)</label>
                  <Input
                    data-testid={`block-banner-link-${block.id}`}
                    value={block.linkUrl || ""}
                    onChange={e => updateBlock(block.id, { linkUrl: e.target.value })}
                    placeholder="https://..."
                    className="text-sm"
                  />
                </div>
              </>
            )}

            {block.type === "text" && (
              <>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">제목</label>
                  <Input
                    data-testid={`block-text-heading-${block.id}`}
                    value={block.heading || ""}
                    onChange={e => updateBlock(block.id, { heading: e.target.value })}
                    placeholder="제목 입력"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">부제목</label>
                  <Input
                    data-testid={`block-text-subheading-${block.id}`}
                    value={block.subheading || ""}
                    onChange={e => updateBlock(block.id, { subheading: e.target.value })}
                    placeholder="부제목 입력"
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">본문</label>
                  <Textarea
                    data-testid={`block-text-body-${block.id}`}
                    value={block.body || ""}
                    onChange={e => updateBlock(block.id, { body: e.target.value })}
                    placeholder="본문 입력"
                    rows={3}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">배경색</label>
                  <div className="flex items-center gap-2">
                    <input
                      data-testid={`block-text-bgColor-${block.id}`}
                      type="color"
                      value={block.bgColor || "#ffffff"}
                      onChange={e => updateBlock(block.id, { bgColor: e.target.value })}
                      className="w-8 h-8 rounded border cursor-pointer"
                    />
                    <Input
                      value={block.bgColor || "#ffffff"}
                      onChange={e => updateBlock(block.id, { bgColor: e.target.value })}
                      placeholder="#ffffff"
                      className="text-sm w-32"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg border mt-2" style={{ backgroundColor: block.bgColor || "#ffffff" }}>
                  <p className="text-xs text-gray-400 mb-1">미리보기:</p>
                  {block.heading && <p className="font-bold text-sm">{block.heading}</p>}
                  {block.subheading && <p className="text-xs text-gray-600">{block.subheading}</p>}
                  {block.body && <p className="text-xs text-gray-500 mt-1">{block.body}</p>}
                </div>
              </>
            )}

            {block.type === "buttons" && (
              <>
                {(block.buttons || []).map((btn, btnIdx) => (
                  <div key={btnIdx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <Input
                        data-testid={`block-btn-label-${block.id}-${btnIdx}`}
                        value={btn.label}
                        onChange={e => {
                          const newBtns = [...(block.buttons || [])];
                          newBtns[btnIdx] = { ...newBtns[btnIdx], label: e.target.value };
                          updateBlock(block.id, { buttons: newBtns });
                        }}
                        placeholder="버튼 텍스트"
                        className="text-xs"
                      />
                      <Input
                        data-testid={`block-btn-link-${block.id}-${btnIdx}`}
                        value={btn.linkUrl}
                        onChange={e => {
                          const newBtns = [...(block.buttons || [])];
                          newBtns[btnIdx] = { ...newBtns[btnIdx], linkUrl: e.target.value };
                          updateBlock(block.id, { buttons: newBtns });
                        }}
                        placeholder="링크 URL"
                        className="text-xs"
                      />
                      <select
                        data-testid={`block-btn-style-${block.id}-${btnIdx}`}
                        value={btn.style}
                        onChange={e => {
                          const newBtns = [...(block.buttons || [])];
                          newBtns[btnIdx] = { ...newBtns[btnIdx], style: e.target.value as "filled" | "outline" };
                          updateBlock(block.id, { buttons: newBtns });
                        }}
                        className="border rounded px-2 py-1 text-xs"
                      >
                        <option value="filled">채움</option>
                        <option value="outline">외곽선</option>
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newBtns = (block.buttons || []).filter((_, i) => i !== btnIdx);
                        updateBlock(block.id, { buttons: newBtns });
                      }}
                      className="p-1 hover:bg-red-100 text-red-500 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  data-testid={`btn-add-button-${block.id}`}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    const newBtns = [...(block.buttons || []), { label: "", linkUrl: "", style: "filled" as const }];
                    updateBlock(block.id, { buttons: newBtns });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> 버튼 추가
                </Button>
                {(block.buttons || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded bg-gray-50">
                    <p className="text-xs text-gray-400 w-full mb-1">미리보기:</p>
                    {(block.buttons || []).map((btn, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                          btn.style === "filled"
                            ? "bg-pink-500 text-white"
                            : "border border-pink-500 text-pink-500"
                        }`}
                      >
                        {btn.label || "버튼"}
                      </span>
                    ))}
                  </div>
                )}
              </>
            )}

            {block.type === "coupon" && (
              <>
                {(block.coupons || []).map((coupon, cpIdx) => (
                  <div key={cpIdx} className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        data-testid={`block-coupon-label-${block.id}-${cpIdx}`}
                        value={coupon.label}
                        onChange={e => {
                          const newCoupons = [...(block.coupons || [])];
                          newCoupons[cpIdx] = { ...newCoupons[cpIdx], label: e.target.value };
                          updateBlock(block.id, { coupons: newCoupons });
                        }}
                        placeholder="쿠폰 라벨 (예: 신규가입)"
                        className="text-xs"
                      />
                      <Input
                        data-testid={`block-coupon-value-${block.id}-${cpIdx}`}
                        value={coupon.value}
                        onChange={e => {
                          const newCoupons = [...(block.coupons || [])];
                          newCoupons[cpIdx] = { ...newCoupons[cpIdx], value: e.target.value };
                          updateBlock(block.id, { coupons: newCoupons });
                        }}
                        placeholder="값 (예: 10,000 P 또는 -15%)"
                        className="text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newCoupons = (block.coupons || []).filter((_, i) => i !== cpIdx);
                        updateBlock(block.id, { coupons: newCoupons });
                      }}
                      className="p-1 hover:bg-red-100 text-red-500 rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <Button
                  type="button"
                  data-testid={`btn-add-coupon-${block.id}`}
                  size="sm"
                  variant="outline"
                  className="text-xs"
                  onClick={() => {
                    const newCoupons = [...(block.coupons || []), { label: "", value: "" }];
                    updateBlock(block.id, { coupons: newCoupons });
                  }}
                >
                  <Plus className="w-3 h-3 mr-1" /> 쿠폰 추가
                </Button>
                {(block.coupons || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded bg-gray-50">
                    <p className="text-xs text-gray-400 w-full mb-1">미리보기:</p>
                    {(block.coupons || []).map((cp, i) => (
                      <div key={i} className="flex flex-col items-center border border-pink-300 rounded-lg px-4 py-2 bg-white">
                        <span className="text-[10px] text-gray-500">{cp.label || "라벨"}</span>
                        <span className="text-sm font-bold text-pink-600">{cp.value || "값"}</span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {block.type === "divider" && (
              <div className="py-2">
                <hr className="border-gray-300" />
                <p className="text-xs text-gray-400 text-center mt-1">구분선</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function SortableContentCard({
  item,
  getSectionLabel,
  getBlockCount,
  onEdit,
  onDelete,
}: {
  item: any;
  getSectionLabel: (t: string) => string;
  getBlockCount: (item: any) => number;
  onEdit: (item: any) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} data-testid={`content-item-${item.id}`} className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {item.imageUrl && (
        <div className="h-40 bg-gray-100">
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-2 mb-2">
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 mt-0.5 flex-shrink-0 touch-none"
            title="드래그하여 순서 변경"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <div className="flex flex-wrap items-center gap-2 flex-1">
            <span className="text-xs px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">{getSectionLabel(item.sectionType)}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {item.isActive ? "활성" : "비활성"}
            </span>
            {item.sectionType === "monthly_benefit" && getBlockCount(item) > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">블록 {getBlockCount(item)}개</span>
            )}
          </div>
        </div>
        <h4 className="font-semibold text-sm truncate ml-6" data-testid={`content-title-${item.id}`}>{item.title}</h4>
        {item.celebrity && <p className="text-xs text-gray-500 mt-1 ml-6">셀럽: {item.celebrity}</p>}
        {item.sectionType === "homepage_product" && (
          <div className="text-xs text-gray-500 mt-1 ml-6 space-y-0.5">
            {item.categorySlug && <p>카테고리: {item.categorySlug}</p>}
            {item.brandName && <p>브랜드: {item.brandName}</p>}
            <p>최대 상품: {item.maxProducts || 6}개</p>
          </div>
        )}
        {item.description && <p className="text-xs text-gray-400 mt-1 ml-6 line-clamp-2">{item.description}</p>}
        <div className="flex gap-2 mt-3 ml-6">
          <Button data-testid={`btn-edit-content-${item.id}`} size="sm" variant="outline" onClick={() => onEdit(item)}>
            <Pencil className="w-3 h-3 mr-1" /> 수정
          </Button>
          <Button data-testid={`btn-delete-content-${item.id}`} size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => onDelete(item.id)}>
            <Trash2 className="w-3 h-3 mr-1" /> 삭제
          </Button>
        </div>
      </div>
    </div>
  );
}

function ContentSectionsTab({ authToken }: { authToken: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    sectionType: "homepage_product" as string,
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    celebrity: "",
    categorySlug: "",
    brandName: "",
    maxProducts: 6,
    sortOrder: 0,
    isActive: true,
  });
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => { if (d.success) setCategories(d.data || []); }).catch(() => {});
    fetch("/api/brands").then(r => r.json()).then(d => { if (d.success) setBrands(d.data || []); }).catch(() => {});
  }, []);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
        Authorization: `Bearer ${authToken}`,
      },
    });
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const query = filterType !== "all" ? `?sectionType=${filterType}` : "";
      const res = await fetchWithAuth(`/api/admin/content-sections${query}`);
      const data = await res.json();
      if (Array.isArray(data)) setItems(data);
      else if (data.data) setItems(data.data);
      else setItems([]);
    } catch {
      toast({ title: "오류", description: "콘텐츠 목록을 불러올 수 없습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filterType]);

  const resetForm = () => {
    setForm({ sectionType: "homepage_product", title: "", description: "", imageUrl: "", linkUrl: "", celebrity: "", categorySlug: "", brandName: "", maxProducts: 6, sortOrder: 0, isActive: true });
    setEditingId(null);
    setProductIds([]);
    setSelectedProducts([]);
    setProductSearch("");
    setProductResults([]);
    setContentBlocks([]);
  };

  const searchProducts = async (query: string) => {
    if (query.length < 2) { setProductResults([]); return; }
    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=10`);
      const data = await res.json();
      const list = data.success ? (data.data?.products || data.data || []) : [];
      setProductResults(list.filter((p: any) => !productIds.includes(p.id)));
    } catch { setProductResults([]); }
  };

  const addProduct = (product: any) => {
    if (!productIds.includes(product.id)) {
      setProductIds([...productIds, product.id]);
      setSelectedProducts([...selectedProducts, product]);
    }
    setProductSearch("");
    setProductResults([]);
  };

  const removeProduct = (pid: string) => {
    setProductIds(productIds.filter(id => id !== pid));
    setSelectedProducts(selectedProducts.filter(p => p.id !== pid));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: "오류", description: "제목을 입력해주세요.", variant: "destructive" });
      return;
    }
    try {
      const body = { ...form, productIds } as any;
      if (form.sectionType !== "celeb_style") delete body.celebrity;
      if (form.sectionType !== "homepage_product") {
        delete body.categorySlug;
        delete body.brandName;
        delete body.maxProducts;
      }
      if (form.sectionType === "monthly_benefit" && contentBlocks.length > 0) {
        body.contentBlocks = JSON.stringify(contentBlocks);
      } else if (form.sectionType === "monthly_benefit") {
        body.contentBlocks = null;
      }

      if (editingId) {
        const res = await fetchWithAuth(`/api/admin/content-sections/${editingId}`, {
          method: "PUT",
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast({ title: "수정 완료", description: "콘텐츠가 수정되었습니다." });
          resetForm();
          setShowForm(false);
          fetchItems();
        } else {
          const err = await res.json();
          toast({ title: "오류", description: err.message || "수정 실패", variant: "destructive" });
        }
      } else {
        const res = await fetchWithAuth("/api/admin/content-sections", {
          method: "POST",
          body: JSON.stringify(body),
        });
        if (res.ok) {
          toast({ title: "등록 완료", description: "콘텐츠가 등록되었습니다." });
          resetForm();
          setShowForm(false);
          fetchItems();
        } else {
          const err = await res.json();
          toast({ title: "오류", description: err.message || "등록 실패", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "오류", description: "요청 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const handleEdit = async (item: any) => {
    setForm({
      sectionType: item.sectionType || "homepage_product",
      title: item.title || "",
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      linkUrl: item.linkUrl || "",
      celebrity: item.celebrity || "",
      categorySlug: item.categorySlug || "",
      brandName: item.brandName || "",
      maxProducts: item.maxProducts || 6,
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive !== false,
    });
    setEditingId(item.id);
    if (item.contentBlocks) {
      try {
        const parsed = typeof item.contentBlocks === "string" ? JSON.parse(item.contentBlocks) : item.contentBlocks;
        setContentBlocks(Array.isArray(parsed) ? parsed : []);
      } catch { setContentBlocks([]); }
    } else {
      setContentBlocks([]);
    }
    const ids = item.productIds || [];
    setProductIds(ids);
    if (ids.length > 0) {
      try {
        const prods: any[] = [];
        for (const pid of ids) {
          const res = await fetch(`/api/products/${pid}`);
          const data = await res.json();
          if (data.success && data.data) prods.push(data.data);
        }
        setSelectedProducts(prods);
      } catch { setSelectedProducts([]); }
    } else {
      setSelectedProducts([]);
    }
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 콘텐츠를 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/admin/content-sections/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "삭제 완료", description: "콘텐츠가 삭제되었습니다." });
        fetchItems();
      } else {
        toast({ title: "오류", description: "삭제 실패", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "삭제 요청 중 오류가 발생했습니다.", variant: "destructive" });
    }
  };

  const getBlockCount = (item: any) => {
    if (!item.contentBlocks) return 0;
    try {
      const parsed = typeof item.contentBlocks === "string" ? JSON.parse(item.contentBlocks) : item.contentBlocks;
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch { return 0; }
  };

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex(i => i.id === active.id);
    const newIndex = items.findIndex(i => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    const orders = reordered.map((item, idx) => ({ id: item.id, sortOrder: idx }));
    try {
      await fetchWithAuth("/api/admin/content-sections/reorder", {
        method: "POST",
        body: JSON.stringify({ orders }),
      });
      toast({ title: "순서가 저장되었습니다." });
    } catch {
      toast({ title: "오류", description: "순서 저장 실패", variant: "destructive" });
      fetchItems();
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-pink-600" />
              콘텐츠 관리
            </h3>
            <p className="text-sm text-gray-500 mt-1">홈페이지 콘텐츠 섹션을 관리합니다</p>
          </div>
          <Button
            data-testid="btn-add-content"
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-pink-500 hover:bg-pink-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            콘텐츠 추가
          </Button>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2">
          <Button
            data-testid="filter-all"
            variant={filterType === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterType("all")}
          >
            전체
          </Button>
          {SECTION_TYPES.map(st => (
            <Button
              key={st.value}
              data-testid={`filter-${st.value}`}
              variant={filterType === st.value ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(st.value)}
            >
              {st.label}
            </Button>
          ))}
        </div>

        {showForm && (
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h4 className="font-semibold mb-4">{editingId ? "콘텐츠 수정" : "새 콘텐츠 추가"}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">섹션 타입</label>
                <select
                  data-testid="input-sectionType"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.sectionType}
                  onChange={e => setForm({ ...form, sectionType: e.target.value })}
                >
                  {SECTION_TYPES.map(st => (
                    <option key={st.value} value={st.value}>{st.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">제목</label>
                <Input
                  data-testid="input-title"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="제목 입력"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">설명</label>
                <Textarea
                  data-testid="input-description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="설명 입력"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이미지</label>
                <div className="flex gap-2 items-end">
                  <Input
                    data-testid="input-imageUrl"
                    value={form.imageUrl}
                    onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                    placeholder="https://... 또는 이미지 업로드"
                    className="flex-1"
                  />
                  <label className="cursor-pointer flex-shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("image", file);
                        try {
                          const res = await fetch("/api/admin/upload/banner-image", {
                            method: "POST",
                            headers: { Authorization: `Bearer ${authToken}` },
                            body: fd,
                          });
                          const data = await res.json();
                          if (data.success && data.data?.imageUrl) {
                            setForm((prev: any) => ({ ...prev, imageUrl: data.data.imageUrl }));
                          }
                        } catch {}
                        e.target.value = "";
                      }}
                    />
                    <div className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50">
                      <Upload className="w-3.5 h-3.5" />
                      업로드
                    </div>
                  </label>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 rounded overflow-hidden border bg-gray-50 max-h-32">
                    <img src={form.imageUrl} alt="미리보기" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">링크 URL</label>
                <Input
                  data-testid="input-linkUrl"
                  value={form.linkUrl}
                  onChange={e => setForm({ ...form, linkUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {form.sectionType === "celeb_style" && (
                <div>
                  <label className="block text-sm font-medium mb-1">셀럽 이름</label>
                  <Input
                    data-testid="input-celebrity"
                    value={form.celebrity}
                    onChange={e => setForm({ ...form, celebrity: e.target.value })}
                    placeholder="셀럽 이름 입력"
                  />
                </div>
              )}
              {form.sectionType === "homepage_product" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">카테고리 (선택)</label>
                    <select
                      data-testid="input-categorySlug"
                      className="w-full border rounded-lg px-3 py-2 text-sm"
                      value={form.categorySlug}
                      onChange={e => setForm({ ...form, categorySlug: e.target.value })}
                    >
                      <option value="">전체 (카테고리 필터 없음)</option>
                      {categories.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1">브랜드 (선택)</label>
                    <div className="relative">
                      <Input
                        data-testid="input-brandName"
                        placeholder="브랜드 검색..."
                        value={showBrandDropdown ? brandSearch : (form.brandName || "")}
                        onFocus={() => { setShowBrandDropdown(true); setBrandSearch(form.brandName || ""); }}
                        onChange={e => { setBrandSearch(e.target.value); setShowBrandDropdown(true); }}
                        onBlur={() => setTimeout(() => setShowBrandDropdown(false), 200)}
                        className="w-full pr-8"
                        autoComplete="off"
                      />
                      {form.brandName && (
                        <button
                          type="button"
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                          onMouseDown={e => { e.preventDefault(); setForm({ ...form, brandName: "" }); setBrandSearch(""); }}
                        >✕</button>
                      )}
                    </div>
                    {showBrandDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
                        <div
                          className="px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 cursor-pointer"
                          onMouseDown={e => { e.preventDefault(); setForm({ ...form, brandName: "" }); setBrandSearch(""); setShowBrandDropdown(false); }}
                        >전체 (브랜드 필터 없음)</div>
                        {brands
                          .filter((b: any) => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase()))
                          .map((b: any) => (
                            <div
                              key={b.id}
                              className={`px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 ${form.brandName === b.name ? "bg-blue-100 font-semibold text-blue-700" : "text-gray-800"}`}
                              onMouseDown={e => { e.preventDefault(); setForm({ ...form, brandName: b.name }); setBrandSearch(""); setShowBrandDropdown(false); }}
                            >
                              {b.name}
                            </div>
                          ))
                        }
                        {brands.filter((b: any) => !brandSearch || b.name.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-400">검색 결과 없음</div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">최대 상품 수</label>
                    <Input
                      data-testid="input-maxProducts"
                      type="number"
                      value={form.maxProducts}
                      onChange={e => setForm({ ...form, maxProducts: parseInt(e.target.value) || 6 })}
                      min={1}
                      max={20}
                    />
                  </div>
                </>
              )}
              {form.sectionType === "monthly_benefit" && (
                <div className="md:col-span-2">
                  <ContentBlockEditor
                    blocks={contentBlocks}
                    onChange={setContentBlocks}
                    authToken={authToken}
                  />
                </div>
              )}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">연결 상품</label>
                <div className="relative">
                  <Input
                    data-testid="input-product-search"
                    value={productSearch}
                    onChange={e => { setProductSearch(e.target.value); searchProducts(e.target.value); }}
                    placeholder="상품명으로 검색..."
                  />
                  {productResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {productResults.map((p: any) => (
                        <button
                          key={p.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm border-b last:border-b-0"
                          onClick={() => addProduct(p)}
                        >
                          {p.imageUrl && <img src={p.imageUrl} className="w-8 h-8 object-cover rounded" />}
                          <span className="truncate">{p.name}</span>
                          <span className="text-gray-400 ml-auto text-xs">{p.price?.toLocaleString()}원</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {selectedProducts.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedProducts.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-xs">
                        <span className="truncate max-w-[150px]">{p.name}</span>
                        <button type="button" onClick={() => removeProduct(p.id)} className="text-red-400 hover:text-red-600 ml-1">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-xs text-gray-400 mt-1">상품을 검색하여 이 콘텐츠에 연결할 수 있습니다. ({selectedProducts.length}개 선택됨)</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">정렬 순서</label>
                <Input
                  data-testid="input-sortOrder"
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input
                  data-testid="input-isActive"
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm">활성화</label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button data-testid="btn-submit-content" onClick={handleSubmit} className="bg-pink-500 hover:bg-pink-600">
                <Check className="w-4 h-4 mr-2" />
                {editingId ? "수정" : "등록"}
              </Button>
              <Button data-testid="btn-cancel-content" variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                <X className="w-4 h-4 mr-2" />
                취소
              </Button>
            </div>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">등록된 콘텐츠가 없습니다.</div>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                <GripVertical className="w-3 h-3" /> 왼쪽 핸들을 드래그해서 순서를 변경할 수 있습니다
              </p>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {items.map(item => (
                      <SortableContentCard
                        key={item.id}
                        item={item}
                        getSectionLabel={getSectionLabel}
                        getBlockCount={getBlockCount}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const MAGAZINE_CATEGORIES = ["매거진", "가이드 & 팁", "트렌드", "셀럽 스타일", "브랜드 스토리"];

function MagazinesTab({ authToken }: { authToken: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCat, setFilterCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    category: "매거진",
    content: "",
    imageUrl: "",
    linkUrl: "",
    sortOrder: 0,
    isActive: true,
  });

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers, Authorization: `Bearer ${authToken}` },
    });
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const query = filterCat !== "all" ? `?category=${encodeURIComponent(filterCat)}` : "";
      const res = await fetchWithAuth(`/api/admin/magazines${query}`);
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast({ title: "오류", description: "매거진 목록을 불러올 수 없습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filterCat]);

  const resetForm = () => {
    setForm({ title: "", subtitle: "", category: "매거진", content: "", imageUrl: "", linkUrl: "", sortOrder: 0, isActive: true });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast({ title: "오류", description: "제목을 입력해주세요.", variant: "destructive" });
      return;
    }
    try {
      if (editingId) {
        const res = await fetchWithAuth(`/api/admin/magazines/${editingId}`, { method: "PUT", body: JSON.stringify(form) });
        if (res.ok) {
          toast({ title: "수정 완료" });
          resetForm(); setShowForm(false); fetchItems();
        } else {
          toast({ title: "오류", description: "수정 실패", variant: "destructive" });
        }
      } else {
        const res = await fetchWithAuth("/api/admin/magazines", { method: "POST", body: JSON.stringify(form) });
        if (res.ok) {
          toast({ title: "등록 완료" });
          resetForm(); setShowForm(false); fetchItems();
        } else {
          toast({ title: "오류", description: "등록 실패", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "오류", description: "요청 중 오류", variant: "destructive" });
    }
  };

  const handleEdit = (item: any) => {
    setForm({
      title: item.title || "",
      subtitle: item.subtitle || "",
      category: item.category || "매거진",
      content: item.content || "",
      imageUrl: item.imageUrl || "",
      linkUrl: item.linkUrl || "",
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive !== false,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 매거진을 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/admin/magazines/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "삭제 완료" });
        fetchItems();
      } else {
        toast({ title: "오류", description: "삭제 실패", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "삭제 요청 중 오류", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-purple-600" />
              매거진 관리
            </h3>
            <p className="text-sm text-gray-500 mt-1">매거진 페이지의 콘텐츠를 관리합니다</p>
          </div>
          <Button
            data-testid="btn-add-magazine"
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-purple-500 hover:bg-purple-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            매거진 추가
          </Button>
        </div>

        <div className="p-4 border-b border-gray-100 flex flex-wrap gap-2">
          <Button variant={filterCat === "all" ? "default" : "outline"} size="sm" onClick={() => setFilterCat("all")}>전체</Button>
          {MAGAZINE_CATEGORIES.map(cat => (
            <Button key={cat} variant={filterCat === cat ? "default" : "outline"} size="sm" onClick={() => setFilterCat(cat)}>{cat}</Button>
          ))}
        </div>

        {showForm && (
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h4 className="font-semibold mb-4">{editingId ? "매거진 수정" : "새 매거진 추가"}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">제목 *</label>
                <Input data-testid="input-mag-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="제목 입력" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">카테고리</label>
                <select
                  data-testid="input-mag-category"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                >
                  {MAGAZINE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">부제목</label>
                <Input data-testid="input-mag-subtitle" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="부제목 입력" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">이미지</label>
                <div className="flex gap-2 items-end">
                  <Input data-testid="input-mag-imageUrl" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://... 또는 이미지 업로드" className="flex-1" />
                  <label className="cursor-pointer flex-shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("image", file);
                        try {
                          const res = await fetch("/api/admin/upload/banner-image", {
                            method: "POST",
                            headers: { Authorization: `Bearer ${authToken}` },
                            body: fd,
                          });
                          const data = await res.json();
                          if (data.success && data.data?.imageUrl) {
                            setForm(prev => ({ ...prev, imageUrl: data.data.imageUrl }));
                          }
                        } catch {}
                        e.target.value = "";
                      }}
                    />
                    <div className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50">
                      <Upload className="w-3.5 h-3.5" />
                      업로드
                    </div>
                  </label>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 rounded overflow-hidden border bg-gray-50 max-h-32">
                    <img src={form.imageUrl} alt="미리보기" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">링크 URL (선택)</label>
                <Input data-testid="input-mag-linkUrl" value={form.linkUrl} onChange={e => setForm({ ...form, linkUrl: e.target.value })} placeholder="https://... (외부 링크 또는 비워두기)" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">본문 내용</label>
                <Textarea data-testid="input-mag-content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="매거진 본문 내용" rows={4} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">정렬 순서</label>
                <Input data-testid="input-mag-sortOrder" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input data-testid="input-mag-isActive" type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                <label className="text-sm">활성화</label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button data-testid="btn-submit-magazine" onClick={handleSubmit} className="bg-purple-500 hover:bg-purple-600">
                <Check className="w-4 h-4 mr-2" /> {editingId ? "수정" : "등록"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                <X className="w-4 h-4 mr-2" /> 취소
              </Button>
            </div>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">등록된 매거진이 없습니다.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((item: any) => (
                <div key={item.id} data-testid={`magazine-item-${item.id}`} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                  {item.imageUrl && (
                    <div className="h-40 bg-gray-100 relative">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-2 left-3 text-white">
                        <p className="text-xs opacity-80">{item.category}</p>
                        <p className="font-semibold text-sm truncate">{item.title}</p>
                      </div>
                    </div>
                  )}
                  <div className="p-4">
                    {!item.imageUrl && (
                      <>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">{item.category}</span>
                        <h4 className="font-semibold text-sm truncate mt-2">{item.title}</h4>
                      </>
                    )}
                    {item.subtitle && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.subtitle}</p>}
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.isActive ? "활성" : "비활성"}
                      </span>
                      <span className="text-xs text-gray-400">순서: {item.sortOrder}</span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                        <Pencil className="w-3 h-3 mr-1" /> 수정
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> 삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const LABS_BLOCK_TYPES = [
  { value: "hero", label: "히어로 (전체 화면 이미지)" },
  { value: "text", label: "텍스트 섹션" },
  { value: "image", label: "이미지 (오버레이 텍스트)" },
  { value: "image_text", label: "텍스트 + 이미지 조합" },
];

function LabsTab({ authToken }: { authToken: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    blockType: "hero",
    title: "",
    subtitle: "",
    content: "",
    imageUrl: "",
    overlayTitle: "",
    overlaySubtitle: "",
    textAlign: "center",
    bgColor: "#000000",
    textColor: "#ffffff",
    sortOrder: 0,
    isActive: true,
  });

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json", ...options.headers, Authorization: `Bearer ${authToken}` },
    });
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/admin/labs-blocks");
      const data = await res.json();
      setItems(Array.isArray(data) ? data : data.data || []);
    } catch {
      toast({ title: "오류", description: "Labs 블록 목록을 불러올 수 없습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const resetForm = () => {
    setForm({
      blockType: "hero", title: "", subtitle: "", content: "", imageUrl: "",
      overlayTitle: "", overlaySubtitle: "", textAlign: "center",
      bgColor: "#000000", textColor: "#ffffff", sortOrder: 0, isActive: true,
    });
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        const res = await fetchWithAuth(`/api/admin/labs-blocks/${editingId}`, { method: "PUT", body: JSON.stringify(form) });
        if (res.ok) {
          toast({ title: "수정 완료" });
          resetForm(); setShowForm(false); fetchItems();
        } else {
          toast({ title: "오류", description: "수정 실패", variant: "destructive" });
        }
      } else {
        const res = await fetchWithAuth("/api/admin/labs-blocks", { method: "POST", body: JSON.stringify(form) });
        if (res.ok) {
          toast({ title: "등록 완료" });
          resetForm(); setShowForm(false); fetchItems();
        } else {
          toast({ title: "오류", description: "등록 실패", variant: "destructive" });
        }
      }
    } catch {
      toast({ title: "오류", description: "요청 중 오류", variant: "destructive" });
    }
  };

  const handleEdit = (item: any) => {
    setForm({
      blockType: item.blockType || "hero",
      title: item.title || "",
      subtitle: item.subtitle || "",
      content: item.content || "",
      imageUrl: item.imageUrl || "",
      overlayTitle: item.overlayTitle || "",
      overlaySubtitle: item.overlaySubtitle || "",
      textAlign: item.textAlign || "center",
      bgColor: item.bgColor || "#000000",
      textColor: item.textColor || "#ffffff",
      sortOrder: item.sortOrder || 0,
      isActive: item.isActive !== false,
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 블록을 삭제하시겠습니까?")) return;
    try {
      const res = await fetchWithAuth(`/api/admin/labs-blocks/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast({ title: "삭제 완료" });
        fetchItems();
      } else {
        toast({ title: "오류", description: "삭제 실패", variant: "destructive" });
      }
    } catch {
      toast({ title: "오류", description: "삭제 요청 중 오류", variant: "destructive" });
    }
  };

  const blockTypeLabel = (type: string) => LABS_BLOCK_TYPES.find(t => t.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-600" />
              velour LABS 관리
            </h3>
            <p className="text-sm text-gray-500 mt-1">Labs 페이지의 콘텐츠 블록을 관리합니다. 블록 유형: 히어로, 텍스트, 이미지, 텍스트+이미지</p>
          </div>
          <Button
            data-testid="btn-add-labs-block"
            onClick={() => { resetForm(); setShowForm(!showForm); }}
            className="bg-cyan-500 hover:bg-cyan-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            블록 추가
          </Button>
        </div>

        {showForm && (
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h4 className="font-semibold mb-4">{editingId ? "블록 수정" : "새 블록 추가"}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">블록 유형 *</label>
                <select
                  data-testid="input-labs-blockType"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.blockType}
                  onChange={e => setForm({ ...form, blockType: e.target.value })}
                >
                  {LABS_BLOCK_TYPES.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">정렬 순서</label>
                <Input data-testid="input-labs-sortOrder" type="number" value={form.sortOrder} onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })} />
              </div>

              {(form.blockType === "text" || form.blockType === "image_text") && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">제목</label>
                    <Input data-testid="input-labs-title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="제목 (강조: **텍스트**)" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">부제목</label>
                    <Input data-testid="input-labs-subtitle" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} placeholder="부제목 (선택)" />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1">본문 내용</label>
                    <Textarea data-testid="input-labs-content" value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} placeholder="본문" rows={4} />
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">이미지</label>
                <div className="flex gap-2 items-end">
                  <Input data-testid="input-labs-imageUrl" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://... 또는 이미지 업로드" className="flex-1" />
                  <label className="cursor-pointer flex-shrink-0">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const fd = new FormData();
                        fd.append("image", file);
                        try {
                          const res = await fetch("/api/admin/upload/banner-image", {
                            method: "POST",
                            headers: { Authorization: `Bearer ${authToken}` },
                            body: fd,
                          });
                          const data = await res.json();
                          if (data.success && data.data?.imageUrl) {
                            setForm(prev => ({ ...prev, imageUrl: data.data.imageUrl }));
                          }
                        } catch {}
                        e.target.value = "";
                      }}
                    />
                    <div className="px-3 py-2 border rounded-lg text-sm flex items-center gap-1 hover:bg-gray-50">
                      <Upload className="w-3.5 h-3.5" />
                      업로드
                    </div>
                  </label>
                </div>
                {form.imageUrl && (
                  <div className="mt-2 rounded overflow-hidden border bg-gray-50 max-h-32">
                    <img src={form.imageUrl} alt="미리보기" className="w-full h-32 object-cover" />
                  </div>
                )}
              </div>

              {(form.blockType === "hero" || form.blockType === "image") && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">오버레이 제목</label>
                    <Input data-testid="input-labs-overlayTitle" value={form.overlayTitle} onChange={e => setForm({ ...form, overlayTitle: e.target.value })} placeholder="이미지 위 표시 제목" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">오버레이 부제목</label>
                    <Input data-testid="input-labs-overlaySubtitle" value={form.overlaySubtitle} onChange={e => setForm({ ...form, overlaySubtitle: e.target.value })} placeholder="이미지 위 표시 부제목" />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">텍스트 정렬</label>
                <select
                  data-testid="input-labs-textAlign"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={form.textAlign}
                  onChange={e => setForm({ ...form, textAlign: e.target.value })}
                >
                  <option value="left">왼쪽</option>
                  <option value="center">가운데</option>
                  <option value="right">오른쪽</option>
                </select>
              </div>

              <div className="flex gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">배경색</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                    <Input value={form.bgColor} onChange={e => setForm({ ...form, bgColor: e.target.value })} className="w-24 text-xs" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">텍스트색</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer" />
                    <Input value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })} className="w-24 text-xs" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input data-testid="input-labs-isActive" type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" />
                <label className="text-sm">활성화</label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button data-testid="btn-submit-labs-block" onClick={handleSubmit} className="bg-cyan-500 hover:bg-cyan-600">
                <Check className="w-4 h-4 mr-2" /> {editingId ? "수정" : "등록"}
              </Button>
              <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>
                <X className="w-4 h-4 mr-2" /> 취소
              </Button>
            </div>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-500">로딩 중...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>등록된 블록이 없습니다.</p>
              <p className="text-xs mt-1">블록을 추가하면 Labs 페이지에 순서대로 표시됩니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item: any) => (
                <div key={item.id} data-testid={`labs-block-item-${item.id}`} className="border rounded-lg p-4 bg-white flex gap-4 items-start">
                  {item.imageUrl && (
                    <div className="w-24 h-16 rounded overflow-hidden flex-shrink-0 bg-gray-100">
                      <img src={item.imageUrl} alt={item.title || ""} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">{blockTypeLabel(item.blockType)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {item.isActive ? "활성" : "비활성"}
                      </span>
                      <span className="text-xs text-gray-400">순서: {item.sortOrder}</span>
                    </div>
                    {(item.title || item.overlayTitle) && (
                      <h4 className="font-semibold text-sm truncate">{item.title || item.overlayTitle}</h4>
                    )}
                    {(item.subtitle || item.overlaySubtitle || item.content) && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{item.subtitle || item.overlaySubtitle || item.content}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(item)}>
                        <Pencil className="w-3 h-3 mr-1" /> 수정
                      </Button>
                      <Button size="sm" variant="outline" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3 h-3 mr-1" /> 삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickMenuTab({ authToken }: { authToken: string }) {
  const { toast } = useToast();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formName, setFormName] = useState("");
  const [formLinkUrl, setFormLinkUrl] = useState("");
  const [formSortOrder, setFormSortOrder] = useState("0");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImageFile, setFormImageFile] = useState<File | null>(null);
  const [formImagePreview, setFormImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchItems = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/quick-menu", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) setItems(data.data);
    } catch (error) {
      toast({ title: "오류", description: "퀵메뉴 목록을 불러올 수 없습니다.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const resetForm = () => {
    setFormName("");
    setFormLinkUrl("");
    setFormSortOrder("0");
    setFormIsActive(true);
    setFormImageFile(null);
    setFormImagePreview("");
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormName(item.name);
    setFormLinkUrl(item.linkUrl);
    setFormSortOrder(String(item.sortOrder || 0));
    setFormIsActive(item.isActive);
    setFormImageFile(null);
    setFormImagePreview(item.imageUrl);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setFormImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!formName || !formLinkUrl) {
      toast({ title: "오류", description: "이름과 링크 URL은 필수입니다.", variant: "destructive" });
      return;
    }
    if (!editingItem && !formImageFile && !formImagePreview) {
      toast({ title: "오류", description: "아이콘 이미지를 선택해주세요.", variant: "destructive" });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", formName);
      formData.append("linkUrl", formLinkUrl);
      formData.append("sortOrder", formSortOrder);
      formData.append("isActive", String(formIsActive));
      if (formImageFile) {
        formData.append("image", formImageFile);
      }

      const url = editingItem
        ? `/api/admin/quick-menu/${editingItem.id}`
        : "/api/admin/quick-menu";
      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: editingItem ? "수정되었습니다." : "추가되었습니다." });
        resetForm();
        fetchItems();
      } else {
        toast({ title: "오류", description: data.error, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "오류", description: "저장에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 퀵메뉴 항목을 삭제하시겠습니까?")) return;
    try {
      const res = await fetch(`/api/admin/quick-menu/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "삭제되었습니다." });
        fetchItems();
      }
    } catch (error) {
      toast({ title: "오류", description: "삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleToggleActive = async (item: any) => {
    try {
      const formData = new FormData();
      formData.append("isActive", String(!item.isActive));
      const res = await fetch(`/api/admin/quick-menu/${item.id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${authToken}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: item.isActive ? "비활성화되었습니다." : "활성화되었습니다." });
        fetchItems();
      }
    } catch (error) {
      toast({ title: "오류", description: "상태 변경에 실패했습니다.", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">퀵메뉴 관리</h2>
            <p className="text-sm text-gray-500 mt-1">메인페이지 원형 아이콘 바로가기 메뉴를 관리합니다. (권장 이미지: 200x200px, 원형으로 잘려서 표시됩니다)</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={fetchItems} data-testid="btn-qm-refresh">
              <RefreshCw className="w-4 h-4 mr-1" /> 새로고침
            </Button>
            <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }} data-testid="btn-qm-add">
              <Plus className="w-4 h-4 mr-1" /> 추가
            </Button>
          </div>
        </div>

        {showForm && (
          <div className="p-6 border-b border-gray-100 bg-gray-50">
            <h3 className="font-semibold mb-4">{editingItem ? "퀵메뉴 수정" : "퀵메뉴 추가"}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">이름 *</label>
                <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="예: VIP 명품관" data-testid="input-qm-name" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">링크 URL *</label>
                <Input value={formLinkUrl} onChange={(e) => setFormLinkUrl(e.target.value)} placeholder="예: /products/best 또는 https://..." data-testid="input-qm-link" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">정렬 순서</label>
                <Input type="number" value={formSortOrder} onChange={(e) => setFormSortOrder(e.target.value)} data-testid="input-qm-sort" />
              </div>
              <div className="flex items-center gap-2 mt-6">
                <input type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} id="qm-active" data-testid="input-qm-active" />
                <label htmlFor="qm-active" className="text-sm">활성화</label>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">아이콘 이미지 *</label>
                <div className="flex items-center gap-4">
                  {formImagePreview && (
                    <div className="w-16 h-16 rounded-full overflow-hidden border border-gray-200 bg-white flex-shrink-0">
                      <img src={formImagePreview} alt="미리보기" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageChange} className="hidden" data-testid="input-qm-image" />
                    <Button type="button" size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="btn-qm-upload">
                      <Upload className="w-4 h-4 mr-1" /> 이미지 선택
                    </Button>
                    <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF, WebP (최대 5MB)</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={handleSubmit} data-testid="btn-qm-submit">
                <Check className="w-4 h-4 mr-1" /> {editingItem ? "수정" : "추가"}
              </Button>
              <Button size="sm" variant="outline" onClick={resetForm} data-testid="btn-qm-cancel">
                <X className="w-4 h-4 mr-1" /> 취소
              </Button>
            </div>
          </div>
        )}

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-gray-400">로딩 중...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <Circle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p>등록된 퀵메뉴가 없습니다.</p>
              <p className="text-xs mt-1">상단의 "추가" 버튼으로 퀵메뉴를 등록하세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {items.map((item) => (
                <div key={item.id} className={`border rounded-lg p-4 text-center ${!item.isActive ? "opacity-50 bg-gray-50" : "bg-white"}`} data-testid={`qm-item-${item.id}`}>
                  <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border border-gray-200 bg-gray-50">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  </div>
                  <p className="text-sm font-medium truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 truncate">{item.linkUrl}</p>
                  <p className="text-xs text-gray-400">순서: {item.sortOrder}</p>
                  <div className="flex gap-1 mt-2 justify-center">
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleToggleActive(item)} data-testid={`btn-qm-toggle-${item.id}`}>
                      {item.isActive ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleEdit(item)} data-testid={`btn-qm-edit-${item.id}`}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs px-2 text-red-500 hover:text-red-700" onClick={() => handleDelete(item.id)} data-testid={`btn-qm-delete-${item.id}`}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
