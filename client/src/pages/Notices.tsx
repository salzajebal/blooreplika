import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, ChevronRight, Home, ChevronDown, ChevronUp, Pin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  viewCount: number;
  displayDate: string | null;
}

export default function Notices() {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: notices = [], isLoading } = useQuery<Notice[]>({
    queryKey: ["notices"],
    queryFn: async () => {
      const res = await fetch("/api/notices");
      const data = await res.json();
      return data.success ? data.data : [];
    },
  });

  const sortedNotices = [...notices].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    const dateA = a.displayDate ? new Date(a.displayDate).getTime() : 0;
    const dateB = b.displayDate ? new Date(b.displayDate).getTime() : 0;
    return dateB - dateA;
  });

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "important":
        return { label: "중요", className: "bg-red-900/40 text-red-400 border border-red-800/50" };
      case "event":
        return { label: "이벤트", className: "bg-green-900/40 text-green-400 border border-green-800/50" };
      case "system":
        return { label: "시스템", className: "bg-blue-900/40 text-blue-400 border border-blue-800/50" };
      default:
        return { label: "일반", className: "bg-[#222222] text-[#888888] border border-[#333333]" };
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-[#555555] mb-6">
          <Link href="/" className="hover:text-[#c9a96e] transition-colors flex items-center gap-1">
            <Home className="w-4 h-4" />
            홈
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-[#888888]">공지사항</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white tracking-widest uppercase mb-2">공지사항</h1>
          <p className="text-[#555555]">velour의 새로운 소식과 공지사항입니다</p>
        </div>

        {isLoading ? (
          <div className="border border-[#2a2a2a] divide-y divide-[#222222]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-[#222222] rounded w-3/4 mb-2" />
                <div className="h-4 bg-[#1a1a1a] rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-[#1a1a1a] border border-[#2a2a2a] p-16 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-[#333333]" />
            <h3 className="text-xl font-medium text-[#888888] mb-2">등록된 공지사항이 없습니다</h3>
            <p className="text-[#555555]">새로운 소식이 곧 올라올 예정입니다</p>
          </div>
        ) : (
          <div className="border border-[#2a2a2a] overflow-hidden">
            <div className="divide-y divide-[#222222]">
              {sortedNotices.map((notice) => {
                const category = getCategoryLabel(notice.category);
                const isExpanded = expandedId === notice.id;
                
                return (
                  <div
                    key={notice.id}
                    className={`${notice.isPinned ? "bg-[#1a1500]/30" : ""}`}
                    data-testid={`notice-${notice.id}`}
                  >
                    <button
                      onClick={() => toggleExpand(notice.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#1a1a1a] transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {notice.isPinned && (
                          <Pin className="w-4 h-4 text-[#c9a96e] flex-shrink-0" />
                        )}
                        <span className={`text-[10px] px-2 py-1 flex-shrink-0 tracking-widest ${category.className}`}>
                          {category.label}
                        </span>
                        <span className="font-medium text-[#f0f0f0] truncate">
                          {notice.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        <span className="text-sm text-[#555555] hidden sm:block">
                          {notice.displayDate
                            ? new Date(notice.displayDate).toLocaleDateString("ko-KR")
                            : "-"}
                        </span>
                        <span className="text-sm text-[#444444] hidden sm:block">
                          조회 {notice.viewCount || 0}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-[#c9a96e]" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-[#555555]" />
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 bg-[#111111] border-t border-[#222222]">
                        <div 
                          className="prose prose-sm max-w-none text-[#aaaaaa] [&_img]:max-w-full [&_img]:h-auto [&_p]:my-2 [&_h1]:text-white [&_h2]:text-white [&_h3]:text-white [&_strong]:text-[#f0f0f0] [&_a]:text-[#c9a96e]"
                          dangerouslySetInnerHTML={{ __html: notice.content }}
                        />
                        <div className="mt-4 pt-4 border-t border-[#222222] text-sm text-[#555555] sm:hidden">
                          <p>
                            {notice.displayDate
                              ? new Date(notice.displayDate).toLocaleDateString("ko-KR")
                              : "-"}{" "}
                            | 조회 {notice.viewCount || 0}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
