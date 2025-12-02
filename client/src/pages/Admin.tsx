import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect, useRef, useCallback } from "react";
import { 
  Plus, Pencil, Trash2, Check, X, RefreshCw, Database, 
  LogOut, Users, Package, BarChart3, Eye, EyeOff,
  Lock, User, Mail, Phone, CheckCircle, XCircle,
  MessageCircle, Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Product, Category, Member, ChatConversation, ChatMessage } from "@shared/schema";

const CATEGORY_OPTIONS = [
  { id: "gold_bar", name: "골드바" },
  { id: "silver_bar", name: "실버바" },
  { id: "baby_ring", name: "돌선물" },
  { id: "jewelry", name: "순금기념품" },
  { id: "pure_jewelry", name: "순금주얼리" },
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
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  
  const [activeTab, setActiveTab] = useState<"dashboard" | "products" | "members" | "chat">("dashboard");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [adminReply, setAdminReply] = useState("");
  const [isWsConnected, setIsWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const wsConversationIdRef = useRef<string | null>(null);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [productFilter, setProductFilter] = useState("all");
  
  const [formData, setFormData] = useState({
    name: "",
    weight: "",
    purity: "",
    price: "",
    category: "gold_bar",
    isBest: false,
    isNew: false,
    description: "",
    imageUrl: "",
  });

  const [memberFormData, setMemberFormData] = useState({
    email: "",
    password: "",
    name: "",
    phone: "",
    isActive: true,
    isAdmin: false,
  });
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [showAddMemberForm, setShowAddMemberForm] = useState(false);

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
      if (data.success && data.authenticated) {
        setAuthToken(token);
        setIsAuthenticated(true);
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

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
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

  const fetchConversations = async () => {
    try {
      const res = await fetchWithAuth("/api/chat/conversations");
      const data = await res.json();
      if (data.success) {
        setConversations(data.data);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const cleanupWebSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      if (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING) {
        wsRef.current.close();
      }
      wsRef.current = null;
    }
    setIsWsConnected(false);
  }, []);

  const connectWebSocket = useCallback((conversationId: string) => {
    if (wsConversationIdRef.current === conversationId && wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }
    
    cleanupWebSocket();
    wsConversationIdRef.current = conversationId;
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    
    ws.onopen = () => {
      setIsWsConnected(true);
      if (wsConversationIdRef.current) {
        ws.send(JSON.stringify({ type: "join", conversationId: wsConversationIdRef.current }));
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message") {
          setChatMessages(prev => {
            const exists = prev.some(m => m.id === data.data.id);
            if (exists) return prev;
            return [...prev, data.data];
          });
        }
      } catch (error) {
        console.error("WebSocket message parse error:", error);
      }
    };
    
    ws.onclose = () => {
      setIsWsConnected(false);
    };
    
    wsRef.current = ws;
  }, [cleanupWebSocket]);

  const selectConversation = async (conv: ChatConversation) => {
    setSelectedConversation(conv);
    try {
      const res = await fetch(`/api/chat/conversations/${conv.id}`);
      const data = await res.json();
      if (data.success) {
        setChatMessages(data.data.messages);
        connectWebSocket(conv.id);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendAdminReply = async () => {
    if (!adminReply.trim() || !selectedConversation) return;
    
    const messageText = adminReply.trim();
    setAdminReply("");
    
    if (wsRef.current?.readyState === WebSocket.OPEN && wsConversationIdRef.current) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        senderType: "admin",
        senderName: "관리자",
        message: messageText,
      }));
    } else {
      try {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: selectedConversation.id,
            senderType: "admin",
            senderName: "관리자",
            message: messageText,
            isRead: false,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setChatMessages(prev => [...prev, data.data]);
        }
      } catch (error) {
        console.error("Error sending admin reply:", error);
        toast({ title: "오류", description: "메시지 전송에 실패했습니다.", variant: "destructive" });
      }
    }
  };

  useEffect(() => {
    return () => {
      cleanupWebSocket();
    };
  }, [cleanupWebSocket]);

  const updateConversationStatus = async (convId: string, status: string) => {
    try {
      const res = await fetchWithAuth(`/api/chat/conversations/${convId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        fetchConversations();
        if (selectedConversation?.id === convId) {
          setSelectedConversation(data.data);
        }
        toast({ title: "성공", description: "상태가 변경되었습니다." });
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({ title: "오류", description: "상태 변경에 실패했습니다.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
      fetchProducts();
      fetchMembers();
      fetchConversations();
    }
  }, [isAuthenticated]);

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
        setFormData({ name: "", weight: "", purity: "", price: "", category: "gold_bar", isBest: false, isNew: false, description: "", imageUrl: "" });
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
        fetchProducts();
      }
    } catch (error) {
      toast({ title: "오류", description: "상품 수정에 실패했습니다.", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말로 이 상품을 삭제하시겠습니까?")) return;
    
    try {
      const res = await fetchWithAuth(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "성공", description: "상품이 삭제되었습니다." });
        fetchProducts();
        fetchStats();
      }
    } catch (error) {
      toast({ title: "오류", description: "상품 삭제에 실패했습니다.", variant: "destructive" });
    }
  };

  const startEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      weight: product.weight,
      purity: product.purity,
      price: product.price,
      category: product.category,
      isBest: product.isBest || false,
      isNew: product.isNew || false,
      description: product.description || "",
      imageUrl: product.imageUrl || "",
    });
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
        setMemberFormData({ email: "", password: "", name: "", phone: "", isActive: true, isAdmin: false });
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
      email: member.email,
      password: "",
      name: member.name,
      phone: member.phone || "",
      isActive: member.isActive ?? true,
      isAdmin: member.isAdmin ?? false,
    });
  };

  const filteredProducts = productFilter === "all" 
    ? products 
    : products.filter(p => p.category === productFilter);

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
            <p className="text-gray-500 mt-2">한국공인금거래소 관리 시스템</p>
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

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <div className="bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-gray-900">금</span>
            </div>
            <div>
              <h1 className="font-bold">한국공인금거래소</h1>
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
        <div className="flex gap-2 mb-6">
          <Button
            data-testid="tab-dashboard"
            variant={activeTab === "dashboard" ? "default" : "outline"}
            onClick={() => setActiveTab("dashboard")}
            className={activeTab === "dashboard" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            대시보드
          </Button>
          <Button
            data-testid="tab-products"
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => setActiveTab("products")}
            className={activeTab === "products" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
          >
            <Package className="w-4 h-4 mr-2" />
            상품 관리
          </Button>
          <Button
            data-testid="tab-members"
            variant={activeTab === "members" ? "default" : "outline"}
            onClick={() => setActiveTab("members")}
            className={activeTab === "members" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
          >
            <Users className="w-4 h-4 mr-2" />
            회원 관리
          </Button>
          <Button
            data-testid="tab-chat"
            variant={activeTab === "chat" ? "default" : "outline"}
            onClick={() => setActiveTab("chat")}
            className={activeTab === "chat" ? "bg-yellow-500 hover:bg-yellow-600" : ""}
          >
            <MessageCircle className="w-4 h-4 mr-2" />
            채팅 상담
            {conversations.filter(c => c.status === "open").length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {conversations.filter(c => c.status === "open").length}
              </span>
            )}
          </Button>
        </div>

        {activeTab === "dashboard" && (
          <div className="space-y-6">
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
              </div>
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">상품 관리</h2>
                <p className="text-gray-500 text-sm">총 {products.length}개의 상품</p>
              </div>
              <div className="flex gap-3">
                <select
                  data-testid="select-product-filter"
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">전체 카테고리</option>
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <Button variant="outline" onClick={fetchProducts}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  새로고침
                </Button>
                <Button 
                  data-testid="button-add-product"
                  onClick={() => setShowAddForm(true)} 
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  상품 추가
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
                    data-testid="input-product-weight"
                    placeholder="무게 (예: 100g)"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-purity"
                    placeholder="순도 (예: 999.9‰)"
                    value={formData.purity}
                    onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                  />
                  <Input
                    data-testid="input-product-price"
                    placeholder="가격 (예: 15,100,000)"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                  <select
                    data-testid="select-product-category"
                    className="border border-gray-200 rounded-md px-3 py-2"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                  <Input
                    data-testid="input-product-image"
                    placeholder="이미지 URL (선택)"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  />
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
                      <th className="px-4 py-3 text-left font-medium">무게</th>
                      <th className="px-4 py-3 text-left font-medium">순도</th>
                      <th className="px-4 py-3 text-left font-medium">가격</th>
                      <th className="px-4 py-3 text-left font-medium">카테고리</th>
                      <th className="px-4 py-3 text-center font-medium">상태</th>
                      <th className="px-4 py-3 text-right font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        {editingId === product.id ? (
                          <>
                            <td className="px-4 py-3">
                              <Input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={formData.weight}
                                onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                                className="h-8 w-24"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={formData.purity}
                                onChange={(e) => setFormData({ ...formData, purity: e.target.value })}
                                className="h-8 w-24"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                className="h-8 w-32"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <select
                                className="border border-gray-200 rounded-md px-2 py-1 text-sm"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                              >
                                {CATEGORY_OPTIONS.map((cat) => (
                                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center gap-1 mr-2">
                                <input
                                  type="checkbox"
                                  checked={formData.isBest}
                                  onChange={(e) => setFormData({ ...formData, isBest: e.target.checked })}
                                />
                                <span className="text-xs">Best</span>
                              </label>
                              <label className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={formData.isNew}
                                  onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                                />
                                <span className="text-xs">New</span>
                              </label>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button size="icon" variant="ghost" onClick={() => handleUpdate(product.id)} className="h-8 w-8 text-green-600">
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingId(null)} className="h-8 w-8 text-gray-500">
                                <X className="w-4 h-4" />
                              </Button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                            <td className="px-4 py-3 text-gray-600">{product.weight}</td>
                            <td className="px-4 py-3 text-gray-600">{product.purity}</td>
                            <td className="px-4 py-3 text-yellow-600 font-bold">{product.price}원</td>
                            <td className="px-4 py-3">
                              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs">
                                {CATEGORY_OPTIONS.find(c => c.id === product.category)?.name || product.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {product.isBest && <span className="bg-gray-900 text-white px-2 py-0.5 rounded text-[10px] mr-1">Best</span>}
                              {product.isNew && <span className="bg-red-600 text-white px-2 py-0.5 rounded text-[10px]">New</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
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

            {members.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">등록된 회원이 없습니다.</p>
                <Button onClick={() => setShowAddMemberForm(true)} variant="outline">회원 추가하기</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">이름</th>
                      <th className="px-4 py-3 text-left font-medium">이메일</th>
                      <th className="px-4 py-3 text-left font-medium">전화번호</th>
                      <th className="px-4 py-3 text-center font-medium">상태</th>
                      <th className="px-4 py-3 text-center font-medium">권한</th>
                      <th className="px-4 py-3 text-left font-medium">가입일</th>
                      <th className="px-4 py-3 text-right font-medium">관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.map((member) => (
                      <tr key={member.id} className="hover:bg-gray-50">
                        {editingMemberId === member.id ? (
                          <>
                            <td className="px-4 py-3">
                              <Input
                                value={memberFormData.name}
                                onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={memberFormData.email}
                                onChange={(e) => setMemberFormData({ ...memberFormData, email: e.target.value })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <Input
                                value={memberFormData.phone}
                                onChange={(e) => setMemberFormData({ ...memberFormData, phone: e.target.value })}
                                className="h-8"
                              />
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={memberFormData.isActive}
                                  onChange={(e) => setMemberFormData({ ...memberFormData, isActive: e.target.checked })}
                                />
                                <span className="text-xs">활성</span>
                              </label>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <label className="inline-flex items-center gap-1">
                                <input
                                  type="checkbox"
                                  checked={memberFormData.isAdmin}
                                  onChange={(e) => setMemberFormData({ ...memberFormData, isAdmin: e.target.checked })}
                                />
                                <span className="text-xs">관리자</span>
                              </label>
                            </td>
                            <td className="px-4 py-3 text-gray-500">-</td>
                            <td className="px-4 py-3 text-right">
                              <Button size="icon" variant="ghost" onClick={() => handleUpdateMember(member.id)} className="h-8 w-8 text-green-600">
                                <Check className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingMemberId(null)} className="h-8 w-8 text-gray-500">
                                <X className="w-4 h-4" />
                              </Button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 font-medium text-gray-900">{member.name}</td>
                            <td className="px-4 py-3 text-gray-600">{member.email}</td>
                            <td className="px-4 py-3 text-gray-600">{member.phone || "-"}</td>
                            <td className="px-4 py-3 text-center">
                              {member.isActive ? (
                                <span className="inline-flex items-center gap-1 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-xs">활성</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-gray-400">
                                  <XCircle className="w-4 h-4" />
                                  <span className="text-xs">비활성</span>
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {member.isAdmin ? (
                                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded text-xs">관리자</span>
                              ) : (
                                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs">일반</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-gray-500 text-sm">
                              {member.createdAt ? new Date(member.createdAt).toLocaleDateString('ko-KR') : "-"}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Button 
                                data-testid={`button-edit-member-${member.id}`}
                                size="icon" 
                                variant="ghost" 
                                onClick={() => startEditMember(member)} 
                                className="h-8 w-8"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button 
                                data-testid={`button-delete-member-${member.id}`}
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleDeleteMember(member.id)} 
                                className="h-8 w-8 text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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

        {activeTab === "chat" && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
              <div className="border-r border-gray-200 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <h3 className="font-bold text-gray-900">상담 목록</h3>
                  <p className="text-xs text-gray-500">총 {conversations.length}건의 상담</p>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {conversations.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      <MessageCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                      <p>상담 내역이 없습니다</p>
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        onClick={() => selectConversation(conv)}
                        className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                          selectedConversation?.id === conv.id ? "bg-yellow-50 border-l-4 border-l-yellow-500" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-gray-900">{conv.guestName || "익명"}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            conv.status === "open" ? "bg-green-100 text-green-700" :
                            conv.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {conv.status === "open" ? "진행중" : conv.status === "pending" ? "대기" : "종료"}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{conv.subject}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {conv.createdAt ? new Date(conv.createdAt).toLocaleDateString("ko-KR") : ""}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="col-span-2 flex flex-col">
                {selectedConversation ? (
                  <>
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-gray-900">{selectedConversation.subject}</h3>
                        <p className="text-sm text-gray-500">
                          {selectedConversation.guestName} {selectedConversation.guestEmail && `(${selectedConversation.guestEmail})`}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={selectedConversation.status === "open" ? "default" : "outline"}
                          onClick={() => updateConversationStatus(selectedConversation.id, "open")}
                          className={selectedConversation.status === "open" ? "bg-green-500 hover:bg-green-600" : ""}
                        >
                          진행중
                        </Button>
                        <Button
                          size="sm"
                          variant={selectedConversation.status === "closed" ? "default" : "outline"}
                          onClick={() => updateConversationStatus(selectedConversation.id, "closed")}
                          className={selectedConversation.status === "closed" ? "bg-gray-500 hover:bg-gray-600" : ""}
                        >
                          종료
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                      {chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`mb-3 flex ${msg.senderType === "admin" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              msg.senderType === "admin"
                                ? "bg-yellow-500 text-white rounded-br-sm"
                                : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                            <p className={`text-xs mt-1 ${msg.senderType === "admin" ? "text-yellow-100" : "text-gray-400"}`}>
                              {msg.senderName} · {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : ""}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 border-t border-gray-200 bg-white">
                      <div className="flex gap-2">
                        <Input
                          value={adminReply}
                          onChange={(e) => setAdminReply(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && sendAdminReply()}
                          placeholder="답변을 입력하세요..."
                          className="flex-1"
                          data-testid="input-admin-reply"
                        />
                        <Button 
                          onClick={sendAdminReply}
                          className="bg-yellow-500 hover:bg-yellow-600"
                          data-testid="button-send-admin-reply"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p>상담을 선택해주세요</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
