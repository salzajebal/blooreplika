import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Minimize2, LogIn, UserCheck, ChevronRight } from "lucide-react";
import { useLocation } from "wouter";
import type { ChatConversation, ChatMessage } from "@shared/schema";

type ChatMode = "member" | "guest";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [chatMode, setChatMode] = useState<ChatMode | null>(null);

  // 비회원 상태
  const [guestNameInput, setGuestNameInput] = useState("");
  const [guestNameError, setGuestNameError] = useState("");
  const [guestStarting, setGuestStarting] = useState(false);
  const [guestName, setGuestName] = useState<string>(() => sessionStorage.getItem("guestChatName") || "");
  const [guestConversationId, setGuestConversationId] = useState<string>(() => sessionStorage.getItem("guestChatConvId") || "");

  // 공통 채팅 상태
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, navigate] = useLocation();

  const memberToken = localStorage.getItem("memberToken");
  const memberName = localStorage.getItem("memberName");
  const memberId = localStorage.getItem("memberId");
  const isLoggedIn = !!memberToken && !!memberName && !!memberId;

  // 비회원 세션 복구: 기존 세션이 있으면 바로 guest 모드로
  useEffect(() => {
    if (guestConversationId && guestName && !isLoggedIn) {
      setChatMode("guest");
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── 회원 채팅 히스토리 로드 ──
  const loadChatHistory = useCallback(async () => {
    if (!isLoggedIn || historyLoaded) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chat/member/conversation", {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setConversation(data.data.conversation);
        setMessages(data.data.messages || []);
        setHistoryLoaded(true);
        connectWebSocket(data.data.conversation.id, memberName!);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, memberToken, memberName, historyLoaded]);

  // ── 비회원 채팅 히스토리 로드 ──
  const loadGuestChatHistory = useCallback(async (convId: string, name: string) => {
    if (historyLoaded) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/chat/conversations/${convId}`);
      const data = await res.json();
      if (data.success) {
        setConversation(data.data.conversation);
        setMessages(data.data.messages || []);
        setHistoryLoaded(true);
        connectWebSocket(convId, name);
      }
    } catch (error) {
      console.error("Error loading guest chat history:", error);
    } finally {
      setLoading(false);
    }
  }, [historyLoaded]);

  const connectWebSocket = useCallback((conversationId: string, userName: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({ type: "join", conversationId, senderType: "user", senderName: userName }));
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message" && data.conversationId === conversationId) {
        setMessages(prev => {
          // 낙관적 메시지(opt-)를 실제 서버 메시지로 교체 (user 메시지)
          // admin 메시지는 그냥 추가
          if (data.data.senderType === "user") {
            const optIdx = prev.findLastIndex((m: ChatMessage) => m.id.startsWith("opt-"));
            if (optIdx !== -1) {
              const next = [...prev];
              next[optIdx] = data.data;
              return next;
            }
          }
          // 이미 동일 ID가 있으면 중복 추가 방지
          if (prev.some((m: ChatMessage) => m.id === data.data.id)) return prev;
          return [...prev, data.data];
        });
      }
    };
    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(() => {
        if (conversationId) connectWebSocket(conversationId, userName);
      }, 3000);
    };
    ws.onerror = () => setIsConnected(false);
    setSocket(ws);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    // 로그인 상태에서 chatMode가 null이면 자동으로 member 모드로 진입
    if (isLoggedIn && !chatMode) {
      setChatMode("member");
      return;
    }
    if (chatMode === "member" && isLoggedIn && !historyLoaded) {
      loadChatHistory();
    } else if (chatMode === "guest" && guestConversationId && !historyLoaded) {
      loadGuestChatHistory(guestConversationId, guestName);
    }
  }, [isOpen, chatMode, isLoggedIn, historyLoaded, guestConversationId]);

  // ── 비회원 채팅 시작 ──
  const startGuestChat = async () => {
    const name = guestNameInput.trim();
    if (!name) { setGuestNameError("이름을 입력해주세요."); return; }
    if (name.length < 2) { setGuestNameError("이름은 2자 이상 입력해주세요."); return; }
    setGuestNameError("");
    setGuestStarting(true);
    try {
      const res = await fetch("/api/chat/guest/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guestName: name }),
      });
      const data = await res.json();
      if (data.success) {
        const { conversationId, guestName: savedName } = data.data;
        sessionStorage.setItem("guestChatConvId", conversationId);
        sessionStorage.setItem("guestChatName", savedName);
        setGuestConversationId(conversationId);
        setGuestName(savedName);
        setChatMode("guest");
        setConversation(data.data.conversation);
        setMessages([]);
        connectWebSocket(conversationId, savedName);
        setHistoryLoaded(true);
      } else {
        setGuestNameError(data.error || "상담을 시작할 수 없습니다.");
      }
    } catch {
      setGuestNameError("네트워크 오류가 발생했습니다.");
    } finally {
      setGuestStarting(false);
    }
  };

  // ── 메시지 전송 ──
  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;
    const messageText = newMessage.trim();
    const senderName = chatMode === "guest" ? guestName : memberName;
    setNewMessage("");

    // 낙관적 UI 업데이트 (즉시 화면에 표시, 중복 저장 방지)
    const optimisticMsg: ChatMessage = {
      id: `opt-${Date.now()}`,
      conversationId: conversation.id,
      senderType: "user",
      senderName,
      message: messageText,
      isRead: false,
      telegramMsgId: null,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMsg]);

    try {
      if (chatMode === "guest") {
        await fetch("/api/chat/guest/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ conversationId: conversation.id, guestName, message: messageText }),
        });
      } else {
        await fetch("/api/chat/member/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${memberToken}` },
          body: JSON.stringify({ message: messageText }),
        });
      }
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const closeChat = () => {
    if (socket) socket.close();
    setIsOpen(false);
    setIsMinimized(false);
    setSocket(null);
    setIsConnected(false);
    setHistoryLoaded(false);
    setMessages([]);
    setConversation(null);
    // 비회원 세션은 sessionStorage에 유지 (새로고침해도 이어서 상담 가능)
  };

  const resetGuestSession = () => {
    sessionStorage.removeItem("guestChatConvId");
    sessionStorage.removeItem("guestChatName");
    setGuestConversationId("");
    setGuestName("");
    setGuestNameInput("");
    setChatMode(null);
    setHistoryLoaded(false);
    setMessages([]);
    setConversation(null);
  };

  const goToLogin = () => { setIsOpen(false); navigate("/login"); };

  // 상담원 표시 이름
  const displayName = chatMode === "guest" ? guestName : memberName;

  // ─────────────────────────────────────────────────
  // 닫힌 상태: 플로팅 버튼
  // ─────────────────────────────────────────────────
  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-center gap-1.5">
        <button
          data-testid="button-open-chat"
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 sm:w-16 sm:h-16 bg-white hover:bg-[#fff5ee] border border-[#e8e8e8] hover:border-[#FF6100] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group touch-manipulation"
          aria-label="1:1 실시간 상담 열기"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-[#FF6100]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        </button>
        <div className="text-center">
          <p className="text-[11px] sm:text-xs font-bold text-[#FF6100] leading-tight whitespace-nowrap">1:1 실시간 상담</p>
          <p className="text-[10px] text-[#666666] leading-tight whitespace-nowrap">눌러서 상담 시작</p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // 최소화 상태
  // ─────────────────────────────────────────────────
  if (isMinimized) {
    return (
      <div className="fixed bottom-20 right-3 sm:bottom-6 sm:right-6 z-50">
        <div
          onClick={() => setIsMinimized(false)}
          className="bg-white border border-[#e8e8e8] rounded-2xl px-4 py-3 shadow-xl cursor-pointer flex items-center gap-2.5 hover:border-[#FF6100] transition-all touch-manipulation"
        >
          <svg className="w-5 h-5 text-[#FF6100]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span className="text-[#111111] font-medium text-sm">1:1 상담중</span>
          {messages.filter(m => m.senderType === "admin" && !m.isRead).length > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {messages.filter(m => m.senderType === "admin" && !m.isRead).length}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // 로그인 필요 / 방법 선택 화면
  // ─────────────────────────────────────────────────
  if (!isLoggedIn && !chatMode) {
    return (
      <div
        data-testid="chat-widget-login-required"
        className="fixed bottom-14 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] sm:max-w-[calc(100vw-48px)] bg-white sm:rounded-2xl shadow-2xl shadow-gray-200 overflow-hidden flex flex-col safe-area-bottom border border-[#e8e8e8]"
        style={{ height: "min(60vh, 480px)", maxHeight: "calc(100dvh - 56px)" }}
      >
        {/* 헤더 */}
        <div className="bg-white p-4 flex items-center justify-between flex-shrink-0 border-b border-[#e8e8e8]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#FF6100]/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#FF6100]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#111111] text-sm sm:text-base">1:1 실시간 상담</h3>
              <p className="text-xs text-[#666666]">velour 고객 서비스</p>
            </div>
          </div>
          <button data-testid="button-close-chat" onClick={closeChat}
            className="w-8 h-8 rounded-lg hover:bg-[#f5f5f5] flex items-center justify-center transition-colors touch-manipulation">
            <X className="w-4 h-4 text-[#666666]" />
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-[#f5f5f5] rounded-2xl flex items-center justify-center mb-1">
            <svg className="w-9 h-9 text-[#FF6100]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <div className="text-center mb-2">
            <h4 className="font-bold text-[#111111] text-lg mb-1">상담 방법을 선택해주세요</h4>
            <p className="text-sm text-[#666666]">회원 로그인 또는 비회원으로도 상담하실 수 있습니다</p>
          </div>

          {/* 회원 로그인 버튼 */}
          <button
            data-testid="button-go-to-login"
            onClick={goToLogin}
            className="w-full flex items-center justify-between bg-[#FF6100] hover:bg-[#e05500] text-white px-5 py-4 rounded-xl transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <LogIn className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold text-sm">회원 로그인 후 상담</p>
                <p className="text-xs text-white/70">상담 내역 저장 및 이어서 상담</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-white/70" />
          </button>

          {/* 비회원 상담 버튼 */}
          <button
            data-testid="button-guest-chat"
            onClick={() => setChatMode("guest")}
            className="w-full flex items-center justify-between bg-[#f5f5f5] border border-[#e8e8e8] hover:border-[#FF6100] text-[#111111] px-5 py-4 rounded-xl transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-[#FF6100]" />
              <div className="text-left">
                <p className="font-semibold text-sm">비회원 상담</p>
                <p className="text-xs text-[#666666]">이름만 입력하고 바로 상담 시작</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#666666]" />
          </button>

          <p className="text-xs text-[#666666] mt-1">
            아직 회원이 아니신가요?{" "}
            <button onClick={() => { setIsOpen(false); navigate("/signup"); }} className="text-[#FF6100] underline">
              회원가입
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // 비회원 이름 입력 화면
  // ─────────────────────────────────────────────────
  if (!isLoggedIn && chatMode === "guest" && !guestConversationId) {
    return (
      <div
        data-testid="chat-widget-guest-name"
        className="fixed bottom-14 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] sm:max-w-[calc(100vw-48px)] bg-white sm:rounded-2xl shadow-2xl shadow-gray-200 overflow-hidden flex flex-col safe-area-bottom border border-[#e8e8e8]"
        style={{ height: "min(55vh, 420px)", maxHeight: "calc(100dvh - 56px)" }}
      >
        <div className="bg-white p-4 flex items-center justify-between flex-shrink-0 border-b border-[#e8e8e8]">
          <div className="flex items-center gap-3">
            <button onClick={() => setChatMode(null)} className="w-7 h-7 rounded-lg hover:bg-[#f5f5f5] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#666666]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h3 className="font-bold text-[#111111] text-sm sm:text-base">비회원 상담</h3>
              <p className="text-xs text-[#666666]">이름을 입력해주세요</p>
            </div>
          </div>
          <button data-testid="button-close-chat" onClick={closeChat}
            className="w-8 h-8 rounded-lg hover:bg-[#f5f5f5] flex items-center justify-center transition-colors touch-manipulation">
            <X className="w-4 h-4 text-[#666666]" />
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center gap-5">
          <div className="w-16 h-16 bg-[#f5f5f5] rounded-2xl flex items-center justify-center">
            <UserCheck className="w-9 h-9 text-[#FF6100]" />
          </div>
          <div className="text-center">
            <h4 className="font-bold text-[#111111] text-lg mb-1">비회원 상담 시작</h4>
            <p className="text-sm text-[#666666]">상담에 사용할 이름을 입력해주세요</p>
          </div>

          <div className="w-full space-y-3">
            <Input
              data-testid="input-guest-name"
              placeholder="이름을 입력하세요 (예: 홍길동)"
              value={guestNameInput}
              onChange={(e) => { setGuestNameInput(e.target.value); setGuestNameError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") startGuestChat(); }}
              className="w-full rounded-xl border-[#e8e8e8] bg-[#f5f5f5] text-[#111111] placeholder:text-[#aaaaaa] focus:border-[#FF6100] focus-visible:ring-0 text-center text-base"
              autoFocus
              maxLength={20}
            />
            {guestNameError && (
              <p className="text-xs text-red-400 text-center">{guestNameError}</p>
            )}
            <Button
              data-testid="button-start-guest-chat"
              onClick={startGuestChat}
              disabled={guestStarting || !guestNameInput.trim()}
              className="w-full bg-[#FF6100] hover:bg-[#e05500] text-white rounded-xl h-12 font-semibold touch-manipulation disabled:opacity-50"
            >
              {guestStarting ? "상담 시작 중..." : "상담 시작하기"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────
  // 채팅 창 (회원 / 비회원 공통)
  // ─────────────────────────────────────────────────
  return (
    <div
      data-testid="chat-widget"
      className="fixed bottom-14 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] sm:max-w-[calc(100vw-48px)] bg-white sm:rounded-2xl shadow-2xl shadow-gray-200 overflow-hidden flex flex-col safe-area-bottom border border-[#e8e8e8]"
      style={{ height: "min(65vh, 540px)", maxHeight: "calc(100dvh - 56px)" }}
    >
      {/* 헤더 */}
      <div className="bg-white p-3 sm:p-4 flex items-center justify-between flex-shrink-0 border-b border-[#e8e8e8]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-9 h-9 bg-[#FF6100]/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-[#FF6100]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${isConnected ? "bg-green-400" : "bg-[#555555]"}`} />
          </div>
          <div>
            <h3 className="font-bold text-[#111111] text-sm sm:text-base">1:1 실시간 상담</h3>
            <p className="text-xs text-[#666666]">
              {isConnected ? "상담원 연결됨" : loading ? "연결 중..." : "대기 중"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button data-testid="button-minimize-chat" onClick={() => setIsMinimized(true)}
            className="w-8 h-8 rounded-lg hover:bg-[#f5f5f5] flex items-center justify-center transition-colors touch-manipulation">
            <Minimize2 className="w-4 h-4 text-[#666666]" />
          </button>
          <button data-testid="button-close-chat" onClick={closeChat}
            className="w-8 h-8 rounded-lg hover:bg-[#f5f5f5] flex items-center justify-center transition-colors touch-manipulation">
            <X className="w-4 h-4 text-[#666666]" />
          </button>
        </div>
      </div>

      {/* 사용자 안내 바 */}
      <div className="bg-[#f8f8f8] px-4 py-2 border-b border-[#e8e8e8] flex-shrink-0 flex items-center justify-between">
        <p className="text-xs text-[#666666]">
          <span className="font-semibold text-[#FF6100]">{displayName}</span>
          {chatMode === "guest" && <span className="ml-1 text-[10px] bg-orange-900/30 text-orange-400 px-1.5 py-0.5 rounded font-medium">비회원</span>}
          님, 무엇을 도와드릴까요?
        </p>
        {chatMode === "guest" && (
          <button onClick={resetGuestSession} className="text-[10px] text-[#666666] hover:text-[#666666] underline">
            상담 초기화
          </button>
        )}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#f8f8f8]">
        <div className="flex justify-start">
          <div className="max-w-[85%] bg-[#f5f5f5] rounded-2xl rounded-tl-sm px-4 py-2.5 border border-[#e8e8e8]">
            <p className="text-sm text-[#111111]">안녕하세요! velour 상담원입니다. 무엇을 도와드릴까요?</p>
            <p className="text-[10px] text-[#666666] mt-1">자동응답</p>
          </div>
        </div>

        {loading && messages.length === 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-5 h-5 border-2 border-[#FF6100] border-t-transparent rounded-full" />
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} data-testid={`user-chat-message-${msg.id}`}
            className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.senderType === "user"
                ? "bg-[#FF6100] text-white rounded-tr-sm"
                : "bg-[#f5f5f5] text-[#111111] border border-[#e8e8e8] rounded-tl-sm"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              <p className={`text-[10px] mt-1 ${msg.senderType === "user" ? "text-black/50" : "text-[#666666]"}`}>
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ko-KR") : ""}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="p-3 sm:p-4 border-t border-[#e8e8e8] bg-white flex-shrink-0">
        <div className="flex gap-2">
          <Input
            data-testid="input-user-message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            className="flex-1 text-sm rounded-xl border-[#e8e8e8] bg-[#f5f5f5] text-[#111111] placeholder:text-[#aaaaaa] focus:border-[#FF6100] focus-visible:ring-0"
          />
          <Button
            data-testid="button-send-user-message"
            onClick={sendMessage}
            disabled={!newMessage.trim() || !conversation}
            className="bg-[#FF6100] hover:bg-[#e05500] text-white rounded-xl touch-manipulation px-3 sm:px-4 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-[#aaaaaa] text-center mt-2">
          상담 운영시간: 평일 10:00 ~ 18:00
        </p>
      </div>
    </div>
  );
}
