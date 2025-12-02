import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ChatMessage, ChatConversation } from "@shared/schema";

interface ChatWidgetProps {
  guestName?: string;
  guestEmail?: string;
}

export function ChatWidget({ guestName = "방문자", guestEmail }: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [subject, setSubject] = useState("");
  const [inputName, setInputName] = useState(guestName);
  const [inputEmail, setInputEmail] = useState(guestEmail || "");
  const [isStarting, setIsStarting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const isOpenRef = useRef(isOpen);
  const shouldReconnectRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const cleanupWebSocket = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
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
    setIsConnected(false);
  }, []);

  const connectWebSocket = useCallback((convId: string) => {
    cleanupWebSocket();
    conversationIdRef.current = convId;
    shouldReconnectRef.current = true;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);
    
    ws.onopen = () => {
      setIsConnected(true);
      if (conversationIdRef.current) {
        ws.send(JSON.stringify({ type: "join", conversationId: conversationIdRef.current }));
      }
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message") {
          setMessages(prev => {
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
      setIsConnected(false);
      if (shouldReconnectRef.current && conversationIdRef.current && isOpenRef.current) {
        reconnectTimeoutRef.current = setTimeout(() => {
          if (conversationIdRef.current) {
            connectWebSocket(conversationIdRef.current);
          }
        }, 3000);
      }
    };
    
    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };
    
    wsRef.current = ws;
  }, [cleanupWebSocket]);

  useEffect(() => {
    if (conversation && isOpen && !isStarting) {
      connectWebSocket(conversation.id);
    }
    
    return () => {
      cleanupWebSocket();
    };
  }, [conversation?.id, isOpen, isStarting, connectWebSocket, cleanupWebSocket]);

  const startConversation = async () => {
    if (!subject.trim()) {
      alert("문의 제목을 입력해주세요.");
      return;
    }
    if (!inputName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestName: inputName,
          guestEmail: inputEmail || null,
          subject: subject,
          status: "open",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setConversation(data.data);
        setIsStarting(false);
        await sendWelcomeMessage(data.data.id);
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
    }
  };

  const sendWelcomeMessage = async (conversationId: string) => {
    try {
      const welcomeMessage = {
        conversationId,
        senderType: "admin",
        senderName: "상담원",
        message: `안녕하세요, ${inputName}님! 한국공인금거래소 고객상담센터입니다. 무엇을 도와드릴까요?`,
        isRead: false,
      };
      
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(welcomeMessage),
      });
      
      if (res.ok) {
        const data = await res.json();
        setMessages([data.data]);
      }
    } catch (error) {
      console.error("Error sending welcome message:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !conversation) return;

    const messageText = newMessage.trim();
    setNewMessage("");

    if (wsRef.current?.readyState === WebSocket.OPEN && conversationIdRef.current) {
      wsRef.current.send(JSON.stringify({
        type: "message",
        senderType: "user",
        senderName: inputName,
        message: messageText,
      }));
    } else {
      try {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: conversation.id,
            senderType: "user",
            senderName: inputName,
            message: messageText,
            isRead: false,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setMessages(prev => [...prev, data.data]);
        }
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (isStarting) {
        startConversation();
      } else {
        sendMessage();
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-50 hover:scale-110"
        data-testid="button-open-chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-amber-500 to-amber-600 text-white px-4 py-3 rounded-full shadow-lg cursor-pointer hover:shadow-xl transition-all z-50 flex items-center gap-2"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="font-medium">채팅 상담</span>
        {messages.filter(m => m.senderType === "admin" && !m.isRead).length > 0 && (
          <span className="bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
            {messages.filter(m => m.senderType === "admin" && !m.isRead).length}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden z-50 border border-gray-200" data-testid="chat-widget">
      <div className="bg-gradient-to-r from-amber-500 to-amber-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6" />
          <div>
            <h3 className="font-bold">1:1 실시간 상담</h3>
            <p className="text-xs text-amber-100 flex items-center gap-1">
              한국공인금거래소
              {!isStarting && (
                <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-400" : "bg-gray-400"}`} />
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {isStarting ? (
        <div className="p-6">
          <p className="text-gray-600 mb-4 text-sm">
            안녕하세요! 한국공인금거래소 고객상담센터입니다.
            상담을 시작하려면 아래 정보를 입력해주세요.
          </p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이름 *</label>
              <input
                type="text"
                value={inputName}
                onChange={(e) => setInputName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="이름을 입력하세요"
                data-testid="input-chat-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">이메일 (선택)</label>
              <input
                type="email"
                value={inputEmail}
                onChange={(e) => setInputEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="답변 수신용 이메일"
                data-testid="input-chat-email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문의 제목 *</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="문의 내용을 간단히 적어주세요"
                data-testid="input-chat-subject"
              />
            </div>
            <Button
              onClick={startConversation}
              className="w-full bg-amber-500 hover:bg-amber-600"
              data-testid="button-start-chat"
            >
              상담 시작하기
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="h-80 overflow-y-auto p-4 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`mb-3 flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                    msg.senderType === "user"
                      ? "bg-amber-500 text-white rounded-br-sm"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.senderType === "user" ? "text-amber-100" : "text-gray-400"}`}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" }) : ""}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="메시지를 입력하세요..."
                data-testid="input-chat-message"
              />
              <Button
                onClick={sendMessage}
                className="bg-amber-500 hover:bg-amber-600 rounded-full px-4"
                data-testid="button-send-message"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
