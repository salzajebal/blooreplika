import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Star, MessageCircle, HelpCircle, X, Send, Minimize2, LogIn } from "lucide-react";
import { getProxiedImageUrl, DEFAULT_IMAGE } from "@/lib/imageProxy";
import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ChatConversation, ChatMessage } from "@shared/schema";

function filterValidImageUrls(urls: string[]): string[] {
  return urls.filter(url => {
    if (url.includes('/data/file/bestreview/') || url.includes('/data/file/kalreom/')) {
      return false;
    }
    return true;
  });
}

function FloatingButtons() {
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
      if (data.type === "message" && data.conversationId === conversationId) {
        setMessages(prev => [...prev, data.data]);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    setSocket(ws);
  }, []);

  const loadChatHistory = useCallback(async () => {
    if (!isLoggedIn || historyLoaded) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/chat/member/conversation", {
        headers: {
          Authorization: `Bearer ${memberToken}`,
        },
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
  }, [isLoggedIn, memberToken, memberName, historyLoaded, connectWebSocket]);

  useEffect(() => {
    if (isOpen && isLoggedIn && !historyLoaded) {
      loadChatHistory();
    }
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
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberToken}`,
        },
        body: JSON.stringify({ message: messageText }),
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  };

  const closeChat = () => {
    if (socket) {
      socket.close();
    }
    setIsOpen(false);
    setIsMinimized(false);
    setSocket(null);
    setIsConnected(false);
    setHistoryLoaded(false);
  };

  const goToLogin = () => {
    setIsOpen(false);
    navigate("/login");
  };
  
  return (
    <>
      <div className="fixed right-2 md:right-4 bottom-24 md:bottom-20 z-50 flex flex-col gap-2">
        <button 
          onClick={() => setIsOpen(true)}
          className="w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-300 rounded shadow-lg flex flex-col items-center justify-center text-gray-600 hover:bg-gray-50"
          data-testid="floating-support"
        >
          <MessageCircle className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-[7px] md:text-[8px] mt-0.5">상담</span>
        </button>
        <Link 
          href="/notices"
          className="w-10 h-10 md:w-12 md:h-12 bg-white border border-gray-300 rounded shadow-lg flex flex-col items-center justify-center text-gray-600 hover:bg-gray-50"
          data-testid="floating-qa"
        >
          <HelpCircle className="w-4 h-4 md:w-5 md:h-5" />
          <span className="text-[7px] md:text-[8px] mt-0.5">공지</span>
        </Link>
      </div>

      {isMinimized && (
        <div className="fixed bottom-4 right-4 z-50">
          <div
            onClick={() => setIsMinimized(false)}
            className="bg-black rounded-full px-4 py-3 shadow-lg cursor-pointer flex items-center gap-2 hover:bg-gray-800 transition-all"
          >
            <MessageCircle className="w-5 h-5 text-white" />
            <span className="text-white font-medium text-sm">1:1 상담중</span>
          </div>
        </div>
      )}

      {isOpen && !isMinimized && !isLoggedIn && (
        <div 
          className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[360px] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ height: "min(60vh, 400px)" }}
        >
          <div className="bg-black p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-white" />
              <div>
                <h3 className="font-bold text-white text-sm">1:1 실시간 상담</h3>
                <p className="text-xs text-gray-400">회원 전용 서비스</p>
              </div>
            </div>
            <button onClick={closeChat} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-gray-400" />
            </div>
            <h4 className="font-bold text-gray-900 text-lg mb-2">로그인이 필요합니다</h4>
            <p className="text-sm text-gray-500 mb-6">
              1:1 상담 서비스는 회원 전용입니다.
            </p>
            <Button onClick={goToLogin} className="bg-black hover:bg-gray-800 text-white font-medium px-6 py-3">
              로그인 하러 가기
            </Button>
          </div>
        </div>
      )}

      {isOpen && !isMinimized && isLoggedIn && (
        <div 
          className="fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:w-[360px] bg-white sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ height: "min(100vh, 500px)" }}
        >
          <div className="bg-black p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-white" />
              <div>
                <h3 className="font-bold text-white text-sm">1:1 실시간 상담</h3>
                <p className="text-xs text-gray-400">
                  {isConnected ? "상담원 연결됨" : loading ? "연결 중..." : "대기 중"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setIsMinimized(true)} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
                <Minimize2 className="w-4 h-4 text-white" />
              </button>
              <button onClick={closeChat} className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>

          <div className="bg-gray-100 px-4 py-2 border-b">
            <p className="text-xs text-gray-600 text-center">
              <span className="font-medium text-gray-900">{memberName}</span>님, 무엇을 도와드릴까요?
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            <div className="flex justify-start">
              <div className="max-w-[80%] bg-white rounded-lg px-4 py-2 border border-gray-200">
                <p className="text-sm text-gray-900">안녕하세요! 청담동에디션 상담원입니다. 무엇을 도와드릴까요?</p>
                <p className="text-xs text-gray-400 mt-1">자동응답</p>
              </div>
            </div>
            
            {loading && messages.length === 0 && (
              <div className="flex justify-center py-4">
                <div className="animate-spin w-5 h-5 border-2 border-black border-t-transparent rounded-full"></div>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.senderType === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-lg px-4 py-2 ${
                  msg.senderType === "user" 
                    ? "bg-black text-white" 
                    : "bg-white text-gray-900 border border-gray-200"
                }`}>
                  <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.senderType === "user" ? "text-gray-400" : "text-gray-400"}`}>
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
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                className="flex-1 text-sm"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || !isConnected}
                className="bg-black hover:bg-gray-800 text-white px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MainBannerSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const bannerImages = [
    "https://cdamdong.co.kr/data/banner/25",
    "https://cdamdong.co.kr/data/banner/23",
    "https://cdamdong.co.kr/data/banner/24",
    "https://cdamdong.co.kr/data/banner/17",
    "https://cdamdong.co.kr/data/banner/16",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [bannerImages.length]);

  return (
    <section className="relative w-full overflow-hidden">
      {bannerImages.map((url, index) => (
        <div
          key={`bg-${index}`}
          className="absolute inset-0 transition-opacity duration-700"
          style={{
            opacity: index === currentSlide ? 1 : 0,
            backgroundImage: `url(${getProxiedImageUrl(url, "large")})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(8px)',
            transform: 'scale(1.05)',
          }}
        />
      ))}
      <div 
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, rgba(26,26,46,0.6) 0%, rgba(22,33,62,0.5) 50%, rgba(15,52,96,0.6) 100%)' }}
      />
      
      <div 
        className="relative flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {bannerImages.map((url, index) => (
          <div 
            key={index}
            className="w-full flex-shrink-0 relative"
          >
            <img 
              src={getProxiedImageUrl(url, "large")}
              alt={`배너 ${index + 1}`}
              className="w-full h-auto max-h-[250px] md:max-h-[500px] object-contain"
            />
          </div>
        ))}
      </div>
      
      <button 
        onClick={() => setCurrentSlide((prev) => (prev === 0 ? bannerImages.length - 1 : prev - 1))}
        className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white z-10"
        aria-label="이전"
      >
        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      <button 
        onClick={() => setCurrentSlide((prev) => (prev + 1) % bannerImages.length)}
        className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 w-8 h-8 md:w-10 md:h-10 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white z-10"
        aria-label="다음"
      >
        <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
      </button>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {bannerImages.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2.5 h-2.5 rounded-full transition-colors ${
              index === currentSlide ? 'bg-white' : 'bg-white/40'
            }`}
            aria-label={`슬라이드 ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

function MiddleBanners() {
  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="flex flex-col gap-2">
        <Link href="/category/choice" className="block">
          <img 
            src={getProxiedImageUrl("https://cdamdong.co.kr/data/banner/28")}
            alt="청담동초이스 배너"
            className="w-full h-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </Link>
        <img 
          src={getProxiedImageUrl("https://cdamdong.co.kr/data/banner/14")}
          alt="중간 배너"
          className="w-full h-auto"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      </div>
    </section>
  );
}

function PurchaseReviewSection({ reviews }: { reviews: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const getReviewImage = (review: any): string | null => {
    const urls = review.imageUrls || (review.imageUrl ? [review.imageUrl] : []);
    const validUrls = filterValidImageUrls(urls);
    return validUrls.length > 0 ? validUrls[0] : null;
  };

  const scrollReviews = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 250;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const validReviews = reviews.filter(r => getReviewImage(r) !== null);

  if (validReviews.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6">
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500">- 고객님들의 소중한 리뷰 :)</p>
        <p className="text-xs text-gray-400">(실제 후기 20,000개 이상!)</p>
        <p className="text-xs text-gray-500 mt-1">- 간단한 텍스트 리뷰 작성하시고 포인트 적립 받아 가세요!!</p>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
          <span className="text-gray-400">|</span> 구매후기
        </h2>
        <div className="flex gap-1">
          <button 
            onClick={() => scrollReviews('left')}
            className="w-6 h-6 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
            aria-label="이전"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button 
            onClick={() => scrollReviews('right')}
            className="w-6 h-6 border border-gray-300 bg-white flex items-center justify-center hover:bg-gray-100"
            aria-label="다음"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {validReviews.slice(0, 20).map((review: any) => {
          const imageUrl = getReviewImage(review);
          return (
            <Link 
              key={review.id}
              href={`/reviews/${review.id}`}
              className="flex-shrink-0 w-[230px] bg-white border border-gray-200 hover:border-gray-400 transition-colors"
              data-testid={`purchase-review-${review.id}`}
            >
              <div className="aspect-square bg-gray-100">
                <img 
                  src={getProxiedImageUrl(imageUrl!)}
                  alt={review.title || '후기'}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                />
              </div>
              <div className="p-3 border-t border-gray-100">
                <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                  {review.content || review.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="text-center mt-3">
        <Link 
          href="/reviews" 
          className="inline-block border border-gray-300 bg-white px-6 py-2 text-xs text-gray-600 hover:bg-gray-50"
        >
          후기 더보기 +{reviews.length > 1000 ? '18988' : reviews.length}건
        </Link>
      </div>
    </section>
  );
}

function BestReviewSection({ reviews }: { reviews: any[] }) {
  const getReviewImage = (review: any): string | null => {
    const urls = review.imageUrls || (review.imageUrl ? [review.imageUrl] : []);
    return urls.length > 0 ? urls[0] : null;
  };

  const bestReviews = reviews.filter(r => getReviewImage(r) !== null).slice(0, 4);

  if (bestReviews.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
          <span className="text-gray-400">|</span> 베스트후기
        </h2>
      </div>

      <div className="flex gap-4">
        <div className="hidden md:block w-[200px] flex-shrink-0">
          <img 
            src={getProxiedImageUrl("https://cdamdong.co.kr/data/banner/26")}
            alt="베스트후기 배너"
            className="w-full h-auto"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          {bestReviews.map((review: any) => {
            const imageUrl = getReviewImage(review);
            return (
              <Link 
                key={review.id}
                href={`/reviews/${review.id}`}
                className="bg-white border border-gray-200 hover:border-gray-400 transition-colors"
                data-testid={`best-review-${review.id}`}
              >
                <div className="aspect-square bg-gray-100">
                  <img 
                    src={getProxiedImageUrl(imageUrl!)}
                    alt={review.title || '베스트 후기'}
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                  />
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600 line-clamp-2">{review.title}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="text-center mt-4">
        <Link 
          href="/reviews" 
          className="inline-block border border-gray-300 bg-white px-6 py-2 text-xs text-gray-600 hover:bg-gray-50"
        >
          베스트후기 더보기 +{bestReviews.length}건
        </Link>
      </div>
    </section>
  );
}

function NoticeSection({ notices }: { notices: any[] }) {
  if (notices.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
          <span className="text-gray-400">|</span> 공지사항
        </h2>
        <Link href="/notices" className="text-xs text-gray-500 hover:text-black">
          더보기 +
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {notices.slice(0, 8).map((notice: any) => (
          <Link 
            key={notice.id}
            href={`/notices/${notice.id}`}
            className="bg-white border border-gray-200 hover:border-gray-400 transition-colors"
            data-testid={`notice-card-${notice.id}`}
          >
            {notice.imageUrl && (
              <div className="aspect-video bg-gray-100">
                <img 
                  src={getProxiedImageUrl(notice.imageUrl)}
                  alt={notice.title}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            )}
            <div className="p-2">
              <p className="text-xs text-gray-700 line-clamp-2">{notice.title}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ProductSection({ products }: { products: any[] }) {
  if (products.length === 0) return null;

  return (
    <section className="max-w-[1200px] mx-auto px-4 py-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-700 flex items-center gap-1">
          <span className="text-gray-400">|</span> 신상품
        </h2>
        <Link href="/products" className="text-xs text-gray-500 hover:text-black">
          더보기 +
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.slice(0, 8).map((product: any) => (
          <Link 
            key={product.id}
            href={`/product/${product.id}`} 
            className="bg-white border border-gray-200 hover:border-gray-400 transition-colors" 
            data-testid={`product-card-${product.id}`}
          >
            <div className="aspect-square bg-gray-100 relative">
              <img 
                src={getProxiedImageUrl(product.imageUrl)} 
                alt={product.name} 
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_IMAGE; }}
              />
              {product.isSoldOut && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SOLD OUT</span>
                </div>
              )}
            </div>
            <div className="p-3 border-t border-gray-100">
              <h3 className="text-xs text-gray-800 line-clamp-2 mb-2">{product.name}</h3>
              <div className="flex items-center gap-2">
                {product.originalPrice && product.originalPrice > product.price && (
                  <span className="text-[10px] text-gray-400 line-through">
                    {Number(product.originalPrice).toLocaleString()}원
                  </span>
                )}
                <span className="text-sm font-bold text-gray-900">{Number(product.price).toLocaleString()}원</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const { data: productsData } = useQuery({
    queryKey: ['/api/products'],
    queryFn: async () => {
      const res = await fetch('/api/products?limit=8');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const { data: reviewsData } = useQuery({
    queryKey: ['/api/reviews'],
    queryFn: async () => {
      const res = await fetch('/api/reviews?limit=50');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const { data: noticesData } = useQuery({
    queryKey: ['/api/notices'],
    queryFn: async () => {
      const res = await fetch('/api/notices?limit=8');
      const data = await res.json();
      return data.success ? data.data : [];
    }
  });

  const products = productsData || [];
  const reviews = reviewsData || [];
  const notices = noticesData || [];

  return (
    <div className="min-h-screen bg-white">
      {/* 카카오톡 팝업 제거됨 - 상담 기능은 플로팅 버튼으로 이동 */}
      <Header />
      
      <main>
        <MainBannerSlider />
        <MiddleBanners />
        <PurchaseReviewSection reviews={reviews} />
        <BestReviewSection reviews={reviews} />
        <NoticeSection notices={notices} />
        <ProductSection products={products} />
      </main>
      
      <FloatingButtons />
      <Footer />
    </div>
  );
}
