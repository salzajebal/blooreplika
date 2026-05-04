import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Minimize2, LogIn } from "lucide-react";
import { useLocation } from "wouter";
import type { ChatConversation, ChatMessage } from "@shared/schema";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

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
        if (conversation) connectWebSocket(conversationId, userName);
      }, 3000);
    };
    ws.onerror = () => setIsConnected(false);
    setSocket(ws);
  }, [conversation]);

  useEffect(() => {
    if (isOpen && isLoggedIn && !historyLoaded) loadChatHistory();
  }, [isOpen, isLoggedIn, historyLoaded, loadChatHistory]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation || !socket) return;
    const messageText = newMessage.trim();
    setNewMessage("");
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "message",
        conversationId: conversation.id,
        senderType: "user",
        senderName: memberName,
        message: messageText,
      }));
    }
    try {
      await fetch("/api/chat/member/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({ message: messageText }),
      });
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
  };

  const goToLogin = () => { setIsOpen(false); navigate("/login"); };

  // ── 닫힌 상태: 1:1 상담 플로팅 버튼 ──
  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-center gap-1.5 safe-area-bottom">
        <button
          data-testid="button-open-chat"
          onClick={() => setIsOpen(true)}
          className="relative w-14 h-14 sm:w-16 sm:h-16 bg-gray-900 hover:bg-gray-800 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center justify-center group touch-manipulation"
          aria-label="1:1 실시간 상담 열기"
        >
          {/* 채팅 아이콘 */}
          <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
          {/* 온라인 표시 점 */}
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white shadow-sm" />
        </button>
        <div className="text-center">
          <p className="text-[11px] sm:text-xs font-bold text-gray-800 leading-tight whitespace-nowrap">1:1 실시간 상담</p>
          <p className="text-[10px] text-gray-500 leading-tight whitespace-nowrap">눌러서 상담 시작</p>
        </div>
      </div>
    );
  }

  // ── 최소화 상태 ──
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-3 sm:bottom-6 sm:right-6 z-50 safe-area-bottom">
        <div
          onClick={() => setIsMinimized(false)}
          className="bg-gray-900 rounded-2xl px-4 py-3 shadow-xl cursor-pointer flex items-center gap-2.5 hover:bg-gray-800 transition-all touch-manipulation"
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

  // ── 로그인 필요 ──
  if (!isLoggedIn) {
    return (
      <div
        data-testid="chat-widget-login-required"
        className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[360px] sm:max-w-[calc(100vw-48px)] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col safe-area-bottom"
        style={{ height: "min(60vh, 420px)", maxHeight: "100dvh" }}
      >
        <div className="bg-gray-900 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">1:1 실시간 상담</h3>
              <p className="text-xs text-white/60">velour 고객 전용 서비스</p>
            </div>
          </div>
          <button
            data-testid="button-close-chat"
            onClick={closeChat}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors touch-manipulation"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-5">
            <LogIn className="w-10 h-10 text-gray-600" />
          </div>
          <h4 className="font-bold text-gray-900 text-xl mb-2">로그인이 필요합니다</h4>
          <p className="text-sm text-gray-500 mb-6 leading-relaxed">
            1:1 실시간 상담은 회원 전용 서비스입니다.<br />
            로그인 후 상담 내역도 확인하실 수 있어요.
          </p>
          <Button
            data-testid="button-go-to-login"
            onClick={goToLogin}
            className="bg-gray-900 hover:bg-gray-800 text-white font-medium px-8 py-3 rounded-xl touch-manipulation"
          >
            로그인 하러 가기
          </Button>
          <p className="text-xs text-gray-400 mt-4">
            아직 회원이 아니신가요?{" "}
            <button onClick={() => { setIsOpen(false); navigate("/signup"); }} className="text-gray-700 underline">
              회원가입
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── 상담 창 ──
  return (
    <div
      data-testid="chat-widget"
      className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[360px] sm:max-w-[calc(100vw-48px)] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col safe-area-bottom"
      style={{ height: "min(100vh, 520px)", maxHeight: "100dvh" }}
    >
      {/* 헤더 */}
      <div className="bg-gray-900 p-3 sm:p-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
            </svg>
            <span className={`absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-gray-900 ${isConnected ? "bg-green-400" : "bg-gray-400"}`} />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm sm:text-base">1:1 실시간 상담</h3>
            <p className="text-xs text-white/60">
              {isConnected ? "상담원 연결됨" : loading ? "연결 중..." : "대기 중"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            data-testid="button-minimize-chat"
            onClick={() => setIsMinimized(true)}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors touch-manipulation"
          >
            <Minimize2 className="w-4 h-4 text-white" />
          </button>
          <button
            data-testid="button-close-chat"
            onClick={closeChat}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition-colors touch-manipulation"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* 회원 안내 바 */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-100 flex-shrink-0">
        <p className="text-xs text-gray-500 text-center">
          <span className="font-semibold text-gray-900">{memberName}</span>님, 무엇을 도와드릴까요?
        </p>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-gray-50">
        <div className="flex justify-start">
          <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-900">안녕하세요! velour 상담원입니다. 무엇을 도와드릴까요?</p>
            <p className="text-[10px] text-gray-400 mt-1">자동응답</p>
          </div>
        </div>

        {loading && messages.length === 0 && (
          <div className="flex justify-center py-4">
            <div className="animate-spin w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full" />
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            data-testid={`user-chat-message-${msg.id}`}
            className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-sm ${
              msg.senderType === "user"
                ? "bg-gray-900 text-white rounded-tr-sm"
                : "bg-white text-gray-900 border border-gray-100 rounded-tl-sm"
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              <p className={`text-[10px] mt-1 ${msg.senderType === "user" ? "text-white/50" : "text-gray-400"}`}>
                {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ko-KR") : ""}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <div className="p-3 sm:p-4 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex gap-2">
          <Input
            data-testid="input-user-message"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
            className="flex-1 text-sm rounded-xl border-gray-200 focus-visible:ring-gray-900"
          />
          <Button
            data-testid="button-send-user-message"
            onClick={sendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className="bg-gray-900 hover:bg-gray-800 text-white rounded-xl touch-manipulation px-3 sm:px-4"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-[10px] text-gray-400 text-center mt-2">
          상담 운영시간: 평일 10:00 ~ 18:00
        </p>
      </div>
    </div>
  );
}
