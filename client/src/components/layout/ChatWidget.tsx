import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import type { ChatConversation, ChatMessage } from "@shared/schema";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [step, setStep] = useState<"init" | "chat">("init");
  const [guestName, setGuestName] = useState("");
  const [subject, setSubject] = useState("");
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const memberName = localStorage.getItem("memberName");
  const memberId = localStorage.getItem("memberId");
  const isLoggedIn = !!memberName && !!memberId;

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const connectWebSocket = useCallback((conversationId: string, userName: string) => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);

    ws.onopen = () => {
      setIsConnected(true);
      ws.send(JSON.stringify({
        type: "join",
        conversationId,
        senderType: "user",
        senderName: userName,
      }));
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      switch (data.type) {
        case "history":
          if (data.conversationId === conversationId) {
            setMessages(data.data);
          }
          break;
        case "message":
          if (data.conversationId === conversationId) {
            setMessages(prev => [...prev, data.data]);
          }
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(() => {
        if (conversation) {
          connectWebSocket(conversationId, userName);
        }
      }, 3000);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    setSocket(ws);
  }, [conversation]);

  const startChat = async () => {
    const userName = isLoggedIn ? memberName! : guestName.trim();
    if (!userName || !subject.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: isLoggedIn ? memberId : null,
          guestName: !isLoggedIn ? userName : null,
          subject: subject.trim(),
          status: "open",
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setConversation(data.data);
        setStep("chat");
        connectWebSocket(data.data.id, userName);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim() || !conversation || !socket) return;

    const userName = isLoggedIn ? memberName! : guestName;
    
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: "message",
        conversationId: conversation.id,
        senderType: "user",
        senderName: userName,
        message: newMessage.trim(),
      }));
      setNewMessage("");
    }
  };

  const closeChat = () => {
    if (socket) {
      socket.close();
    }
    setIsOpen(false);
    setStep("init");
    setConversation(null);
    setMessages([]);
    setGuestName("");
    setSubject("");
    setSocket(null);
    setIsConnected(false);
  };

  if (!isOpen) {
    return (
      <button
        data-testid="button-open-chat"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group"
      >
        <MessageCircle className="w-6 h-6 text-black group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></span>
      </button>
    );
  }

  if (isMinimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <div
          onClick={() => setIsMinimized(false)}
          className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full px-4 py-3 shadow-lg cursor-pointer flex items-center gap-2 hover:shadow-xl transition-all"
        >
          <MessageCircle className="w-5 h-5 text-black" />
          <span className="text-black font-medium text-sm">1:1 상담중</span>
          {messages.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
              {messages.filter(m => m.senderType === "admin" && !m.isRead).length || ""}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div 
      data-testid="chat-widget"
      className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-48px)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      style={{ height: "min(500px, calc(100vh - 100px))" }}
    >
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-black" />
          </div>
          <div>
            <h3 className="font-bold text-black">1:1 실시간 상담</h3>
            <p className="text-xs text-black/70">
              {isConnected ? "상담원 연결됨" : "연결 중..."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {step === "chat" && (
            <button
              data-testid="button-minimize-chat"
              onClick={() => setIsMinimized(true)}
              className="w-8 h-8 rounded-lg hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <Minimize2 className="w-4 h-4 text-black" />
            </button>
          )}
          <button
            data-testid="button-close-chat"
            onClick={closeChat}
            className="w-8 h-8 rounded-lg hover:bg-black/10 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-black" />
          </button>
        </div>
      </div>

      {step === "init" ? (
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex-1 flex flex-col justify-center space-y-4">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="w-8 h-8 text-yellow-600" />
              </div>
              <h4 className="font-bold text-gray-900 text-lg">한국골드금거래소</h4>
              <p className="text-sm text-gray-500 mt-1">실시간 1:1 상담을 시작합니다</p>
            </div>

            {!isLoggedIn && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
                <Input
                  data-testid="input-guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="이름을 입력해주세요"
                  className="w-full"
                />
              </div>
            )}

            {isLoggedIn && (
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-sm text-gray-600">로그인됨</p>
                <p className="font-medium text-gray-900">{memberName}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">문의 내용</label>
              <Input
                data-testid="input-chat-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="문의하실 내용을 간단히 입력해주세요"
                className="w-full"
              />
            </div>
          </div>

          <Button
            data-testid="button-start-chat"
            onClick={startChat}
            disabled={loading || (!isLoggedIn && !guestName.trim()) || !subject.trim()}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-medium py-3"
          >
            {loading ? "연결 중..." : "상담 시작하기"}
          </Button>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-white rounded-lg px-4 py-2 border border-gray-200">
                <p className="text-sm text-gray-900">안녕하세요! 한국골드금거래소 상담원입니다. 무엇을 도와드릴까요?</p>
                <p className="text-xs text-gray-400 mt-1">자동응답</p>
              </div>
            </div>
            
            {messages.map((msg) => (
              <div
                key={msg.id}
                data-testid={`user-chat-message-${msg.id}`}
                className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.senderType === "user" 
                    ? "bg-yellow-500 text-black" 
                    : "bg-white text-gray-900 border border-gray-200"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-xs mt-1 ${
                    msg.senderType === "user" ? "text-yellow-900" : "text-gray-400"
                  }`}>
                    {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("ko-KR") : ""}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <Input
                data-testid="input-user-message"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1"
              />
              <Button
                data-testid="button-send-user-message"
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="bg-yellow-500 hover:bg-yellow-600 text-black"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
