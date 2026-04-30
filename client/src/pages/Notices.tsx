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
        return { label: "중요", className: "bg-red-100 text-red-700" };
      case "event":
        return { label: "이벤트", className: "bg-green-100 text-green-700" };
      case "system":
        return { label: "시스템", className: "bg-blue-100 text-blue-700" };
      default:
        return { label: "일반", className: "bg-gray-100 text-gray-700" };
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link href="/" className="hover:text-black flex items-center gap-1">
            <Home className="w-4 h-4" />
            홈
          </Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">공지사항</span>
        </nav>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">공지사항</h1>
          <p className="text-gray-600">velour의 새로운 소식과 공지사항입니다</p>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-xl shadow-sm divide-y">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-1/4" />
              </div>
            ))}
          </div>
        ) : notices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center">
            <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-700 mb-2">등록된 공지사항이 없습니다</h3>
            <p className="text-gray-500">새로운 소식이 곧 올라올 예정입니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-100">
              {sortedNotices.map((notice) => {
                const category = getCategoryLabel(notice.category);
                const isExpanded = expandedId === notice.id;
                
                return (
                  <div
                    key={notice.id}
                    className={`${notice.isPinned ? "bg-yellow-50/50" : ""}`}
                    data-testid={`notice-${notice.id}`}
                  >
                    <button
                      onClick={() => toggleExpand(notice.id)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {notice.isPinned && (
                          <Pin className="w-4 h-4 text-red-500 flex-shrink-0" />
                        )}
                        <span
                          className={`text-xs px-2 py-1 rounded flex-shrink-0 ${category.className}`}
                        >
                          {category.label}
                        </span>
                        <span className="font-medium text-gray-900 truncate">
                          {notice.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0 ml-4">
                        <span className="text-sm text-gray-500 hidden sm:block">
                          {notice.displayDate
                            ? new Date(notice.displayDate).toLocaleDateString("ko-KR")
                            : "-"}
                        </span>
                        <span className="text-sm text-gray-400 hidden sm:block">
                          조회 {notice.viewCount || 0}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </button>
                    
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 bg-gray-50">
                        <div 
                          className="prose prose-sm max-w-none text-gray-700 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_p]:my-2"
                          dangerouslySetInnerHTML={{ __html: notice.content }}
                        />
                        <div className="mt-4 pt-4 border-t text-sm text-gray-500 sm:hidden">
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
