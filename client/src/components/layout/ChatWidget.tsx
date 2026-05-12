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
        setMessages(prev => [...prev, data.data]);
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
    if (!newMessage.trim() || !conversation || !socket) return;
    const messageText = newMessage.trim();
    setNewMessage("");

    if (socket.readyState === WebSocket.OPEN) {
      const senderName = chatMode === "guest" ? guestName : memberName;
      socket.send(JSON.stringify({
        type: "message",
        conversationId: conversation.id,
        senderType: "user",
        senderName,
        message: messageText,
      }));
    }

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
          className="relative w-14 h-14 sm:w-16 sm:h-16 bg-[#1a1a1a] hover:bg-[#222222] border border-[#333333] hover:border-[#c9a96e] rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group touch-manipulation"
          aria-label="1:1 실시간 상담 열기"
        >
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        </button>
        <div className="text-center">
          <p className="text-[11px] sm:text-xs font-bold text-[#c9a96e] leading-tight whitespace-nowrap">1:1 실시간 상담</p>
          <p className="text-[10px] text-[#999999] leading-tight whitespace-nowrap">눌러서 상담 시작</p>
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
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-4 py-3 shadow-xl cursor-pointer flex items-center gap-2.5 hover:border-[#c9a96e] transition-all touch-manipulation"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
          </svg>
          <span className="text-white font-medium text-sm">1:1 상담중</span>
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
        className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] sm:max-w-[calc(100vw-48px)] bg-[#111111] sm:rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col safe-area-bottom border border-[#2a2a2a]"
        style={{ height: "min(65vh, 480px)", maxHeight: "100dvh" }}
      >
        {/* 헤더 */}
        <div className="bg-[#0a0a0a] p-4 flex items-center justify-between flex-shrink-0 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c9a96e]/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-[#c9a96e]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-[#f0f0f0] text-sm sm:text-base">1:1 실시간 상담</h3>
              <p className="text-xs text-[#999999]">velour 고객 서비스</p>
            </div>
          </div>
          <button data-testid="button-close-chat" onClick={closeChat}
            className="w-8 h-8 rounded-lg hover:bg-[#1a1a1a] flex items-center justify-center transition-colors touch-manipulation">
            <X className="w-4 h-4 text-[#888888]" />
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center mb-1">
            <svg className="w-9 h-9 text-[#c9a96e]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <div className="text-center mb-2">
            <h4 className="font-bold text-[#f0f0f0] text-lg mb-1">상담 방법을 선택해주세요</h4>
            <p className="text-sm text-[#888888]">회원 로그인 또는 비회원으로도 상담하실 수 있습니다</p>
          </div>

          {/* 회원 로그인 버튼 */}
          <button
            data-testid="button-go-to-login"
            onClick={goToLogin}
            className="w-full flex items-center justify-between bg-[#c9a96e] hover:bg-[#b8955a] text-black px-5 py-4 rounded-xl transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <LogIn className="w-5 h-5" />
              <div className="text-left">
                <p className="font-semibold text-sm">회원 로그인 후 상담</p>
                <p className="text-xs text-black/60">상담 내역 저장 및 이어서 상담</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-black/60" />
          </button>

          {/* 비회원 상담 버튼 */}
          <button
            data-testid="button-guest-chat"
            onClick={() => setChatMode("guest")}
            className="w-full flex items-center justify-between bg-[#1a1a1a] border border-[#333333] hover:border-[#c9a96e] text-[#f0f0f0] px-5 py-4 rounded-xl transition-colors touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <UserCheck className="w-5 h-5 text-[#c9a96e]" />
              <div className="text-left">
                <p className="font-semibold text-sm">비회원 상담</p>
                <p className="text-xs text-[#888888]">이름만 입력하고 바로 상담 시작</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#999999]" />
          </button>

          <p className="text-xs text-[#999999] mt-1">
            아직 회원이 아니신가요?{" "}
            <button onClick={() => { setIsOpen(false); navigate("/signup"); }} className="text-[#c9a96e] underline">
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
        className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] sm:max-w-[calc(100vw-48px)] bg-[#111111] sm:rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col safe-area-bottom border border-[#2a2a2a]"
        style={{ height: "min(55vh, 420px)", maxHeight: "100dvh" }}
      >
        <div className="bg-[#0a0a0a] p-4 flex items-center justify-between flex-shrink-0 border-b border-[#2a2a2a]">
          <div className="flex items-center gap-3">
            <button onClick={() => setChatMode(null)} className="w-7 h-7 rounded-lg hover:bg-[#1a1a1a] flex items-center justify-center">
              <svg className="w-4 h-4 text-[#888888]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h3 className="font-bold text-[#f0f0f0] text-sm sm:text-base">비회원 상담</h3>
              <p className="text-xs text-[#999999]">이름을 입력해주세요</p>
            </div>
          </div>
          <button data-testid="button-close-chat" onClick={closeChat}
            className="w-8 h-8 rounded-lg hover:bg-[#1a1a1a] flex items-center justify-center transition-colors touch-manipulation">
            <X className="w-4 h-4 text-[#888888]" />
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center gap-5">
          <div className="w-16 h-16 bg-[#1a1a1a] rounded-2xl flex items-center justify-center">
            <UserCheck className="w-9 h-9 text-[#c9a96e]" />
          </div>
          <div className="text-center">
            <h4 className="font-bold text-[#f0f0f0] text-lg mb-1">비회원 상담 시작</h4>
            <p className="text-sm text-[#888888]">상담에 사용할 이름을 입력해주세요</p>
          </div>

          <div className="w-full space-y-3">
            <Input
              data-testid="input-guest-name"
              placeholder="이름을 입력하세요 (예: 홍길동)"
              value={guestNameInput}
              onChange={(e) => { setGuestNameInput(e.target.value); setGuestNameError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") startGuestChat(); }}
              className="w-full rounded-xl border-[#333333] bg-[#0f0f0f] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0 text-center text-base"
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
              className="w-full bg-[#c9a96e] hover:bg-[#b8955a] text-black rounded-xl h-12 font-semibold touch-manipulation disabled:opacity-50"
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
      className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[380px] sm:max-w-[calc(100vw-48px)] bg-[#111111] sm:rounded-2xl shadow-2xl shadow-black/60 overflow-hidden flex flex-col safe-area-bottom border border-[#2a2a2a]"
      style={{ height: "min(100vh, 540px)", maxHeight: "100dvh" }}
    >
      {/* 헤더 */}
      <div className="bg-[#0a0a0a] p-3 sm:p-4 flex items-center justify-between flex-shrink-0 border-b border-[#2a2a2a]">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-9 h-9 bg-[#c9a96e]/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-[#c9a96e]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0a0a0a] ${isConnected ? "bg-green-400" : "bg-[#555555]"}`} />
          </div>
          <div>
            <h3 className="font-bold text-[#f0f0f0] text-sm sm:text-base">1:1 실시간 상담</h3>
            <p className="text-xs text-[#999999]">
              {isConnected ? "상담원 연결됨" : loading ? "연결 중..." : "대기 중"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button data-testid="button-minimize-chat" onClick={() => setIsMinimized(true)}
            className="w-8 h-8 rounded-lg hover:bg-[#1a1a1a] flex items-center justify-center transition-colors touch-manipulation">
            <Minimize2 className="w-4 h-4 text-[#888888]" />
          </button>
          <button data-testid="button-close-chat" onClick={closeChat}
            className="w-8 h-8 rounded-lg hover:bg-[#1a1a1a] flex items-center justify-center transition-colors touch-manipulation">
            <X className="w-4 h-4 text-[#888888]" />
          </button>
        </div>
      </div>

      {/* 사용자 안내 바 */}
      <div className="bg-[#0d0d0d] px-4 py-2 border-b border-[#1e1e1e] flex-shrink-0 flex items-center justify-between">
        <p className="text-xs text-[#888888]">
          <span className="font-semibold text-[#c9a96e]">{displayName}</span>
          {chatMode === "guest" && <span className="ml-1 text-[10px] bg-orange-900/30 text-orange-400 px-1.5 py-0.5 rounded font-medium">비회원</span>}
          님, 무엇을 도와드릴까요?
        </p>
        {chatMode === "guest" && (
          <button onClick={resetGuestSession} className="text-[10px] text-[#999999] hover:text-[#888888] underline">
            상담 초기화
          </button>
        )}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[#0d0d0d]">
        <div className="flex justify-start">
          <div className="max-w-[85%] bg-[#1a1a1a] rounded-2xl rounded-tl-sm px-4 py-2.5 border border-[#2a2a2a]">
            <p className="text-sm text-[#f0f0f0]">안녕하세요! velour 상담원입니다. 무엇을 도와드릴까요?</p>
            <p className="text-[10px] text-[#999999] mt-1">자동응답</p>
          </div>
        </div>

        {loading && messages.length === 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-5 h-5 border-2 border-[#c9a96e] border-t-transparent rounded-full" />
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} data-testid={`user-chat-message-${msg.id}`}
            className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
              msg.senderType === "user"
                ? "bg-[#c9a96e] text-black rounded-tr-sm"
                : "bg-[#1a1a1a] text-[#f0f0f0] border border-[#2a2a2a] rounded-tl-sm"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              <p className={`text-[10px] mt-1 ${msg.senderType === "user" ? "text-black/50" : "text-[#999999]"}`}>
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ko-KR") : ""}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="p-3 sm:p-4 border-t border-[#2a2a2a] bg-[#0a0a0a] flex-shrink-0">
        <div className="flex gap-2">
          <Input
            data-testid="input-user-message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            className="flex-1 text-sm rounded-xl border-[#333333] bg-[#1a1a1a] text-[#f0f0f0] placeholder:text-[#444444] focus:border-[#c9a96e] focus-visible:ring-0"
          />
          <Button
            data-testid="button-send-user-message"
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="bg-[#c9a96e] hover:bg-[#b8955a] text-black rounded-xl touch-manipulation px-3 sm:px-4 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-[#444444] text-center mt-2">
          상담 운영시간: 평일 10:00 ~ 18:00
        </p>
      </div>
    </div>
  );
}
