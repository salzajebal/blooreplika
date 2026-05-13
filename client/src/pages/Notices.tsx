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
        return { label: "중요", className: "bg-red-100 text-red-600 border border-red-200" };
      case "event":
        return { label: "이벤트", className: "bg-green-100 text-green-600 border border-green-200" };
      case "system":
        return { label: "시스템", className: "bg-blue-100 text-blue-600 border border-blue-200" };
      default:
        return { label: "일반", className: "bg-[#f5f5f5] text-[#666666] border border-[#e8e8e8]" };
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
      <Header />

      <main className="flex-1 max-w-[640px] mx-auto w-full px-4 py-6">
        <nav className="flex items-center gap-2 text-xs text-[#999999] mb-5">
          <Link href="/" className="hover:text-[#FF6100] transition-colors flex items-center gap-1">
            <Home className="w-3.5 h-3.5" />홈
          </Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-[#666666]">공지사항</span>
        </nav>

        <div className="mb-5">
          <h1 className="text-xl font-bold text-[#111111] mb-1">공지사항</h1>
          <p className="text-sm text-[#666666]">velour의 새로운 소식과 공지사항입니다</p>
        </div>

        {isLoading ? (
          <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-5 border-b border-[#e8e8e8] last:border-b-0 animate-pulse">
                <div className="h-4 bg-[#f5f5f5] rounded w-3/4 mb-2" />
                <div className="h-3 bg-[#f5f5f5] rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white border border-[#e8e8e8] rounded-xl p-14 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-[#cccccc]" />
            <h3 className="text-base font-medium text-[#999999] mb-1">등록된 공지사항이 없습니다</h3>
            <p className="text-sm text-[#cccccc]">새로운 소식이 곧 올라올 예정입니다</p>
          </div>
        ) : (
          <div className="bg-white border border-[#e8e8e8] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#e8e8e8]">
              {sortedNotices.map((notice) => {
                const category = getCategoryLabel(notice.category);
                const isExpanded = expandedId === notice.id;

                return (
                  <div
                    key={notice.id}
                    className={`${notice.isPinned ? "bg-orange-50/50" : ""}`}
                    data-testid={`notice-${notice.id}`}
                  >
                    <button
                      onClick={() => toggleExpand(notice.id)}
                      className="w-full px-5 py-4 flex items-center justify-between hover:bg-[#f8f8f8] transition-colors text-left"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        {notice.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-[#FF6100] flex-shrink-0" />
                        )}
                        <span className={`text-[10px] px-2 py-0.5 flex-shrink-0 rounded tracking-widest ${category.className}`}>
                          {category.label}
                        </span>
                        <span className="font-medium text-[#111111] truncate text-sm">{notice.title}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                        <span className="text-xs text-[#999999] hidden sm:block">
                          {notice.displayDate ? new Date(notice.displayDate).toLocaleDateString("ko-KR") : "-"}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-[#FF6100]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#999999]" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 bg-[#f8f8f8] border-t border-[#e8e8e8]">
                        <div
                          className="prose prose-sm max-w-none text-[#444444] [&_img]:max-w-full [&_img]:h-auto [&_p]:my-2 [&_h1]:text-[#111111] [&_h2]:text-[#111111] [&_h3]:text-[#111111] [&_strong]:text-[#111111] [&_a]:text-[#FF6100]"
                          dangerouslySetInnerHTML={{ __html: notice.content }}
                        />
                        <div className="mt-3 pt-3 border-t border-[#e8e8e8] text-xs text-[#999999] sm:hidden">
                          {notice.displayDate ? new Date(notice.displayDate).toLocaleDateString("ko-KR") : "-"} | 조회 {notice.viewCount || 0}
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
