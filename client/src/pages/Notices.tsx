import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Bell, Pin } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { cn } from "@/lib/utils";

interface Notice {
  id: string;
  title: string;
  content: string;
  category: string;
  isPinned: boolean;
  viewCount: number;
  displayDate: string | null;
}

const CommunitySidebar = ({ active }: { active: "notices" | "faq" | "reviews" }) => (
  <aside
    className="hidden lg:block flex-shrink-0 border-r border-gray-100 py-6"
    style={{ width: "210px", position: "sticky", top: "101px", maxHeight: "calc(100vh - 101px)", overflowY: "auto", alignSelf: "flex-start" }}
  >
    <Link href="/inspection" className="flex items-center gap-1.5 text-[13px] font-medium text-gray-700 mb-5 pl-5 hover:text-green-600 transition-colors">
      실시간 검수 사진 <span className="text-green-500 font-bold text-base">✓</span>
    </Link>

    {[
      { label: "남성", path: "/products/men" },
      { label: "여성", path: "/products/women" },
      { label: "시계관", path: "/products/watches" },
      { label: "기획전", path: "/events" },
    ].map(item => (
      <div key={item.label} className="mb-0.5">
        <Link href={item.path} className="block text-[14px] py-1.5 pl-5 border-l-2 border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors">
          {item.label}
        </Link>
      </div>
    ))}

    {/* 커뮤니티 — active */}
    <div className="mb-0.5">
      <span className="block text-[14px] py-1.5 pl-5 border-l-2 border-gray-800 font-bold text-gray-900">
        커뮤니티
      </span>
      <div className="pl-7 mt-0.5 mb-1">
        <Link href="/reviews" className={cn("block text-[13px] py-0.5 transition-colors", active === "reviews" ? "font-bold text-gray-900" : "text-gray-500 hover:text-gray-800")}>리뷰&후기</Link>
        <Link href="/notices" className={cn("block text-[13px] py-0.5 transition-colors", active === "notices" ? "font-bold text-gray-900" : "text-gray-500 hover:text-gray-800")}>공지사항</Link>
        <Link href="/faq" className={cn("block text-[13px] py-0.5 transition-colors", active === "faq" ? "font-bold text-gray-900" : "text-gray-500 hover:text-gray-800")}>자주 묻는 질문</Link>
        <span className="block text-[13px] py-0.5 text-gray-500 mt-0.5">APP</span>
      </div>
    </div>

    <div className="mb-0.5">
      <Link href="/products/sameday" className="block text-[14px] py-1.5 pl-5 border-l-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors">오늘출발</Link>
    </div>
    <div className="mb-0.5">
      <Link href="/blog" className="block text-[14px] py-1.5 pl-5 border-l-2 border-transparent text-gray-600 hover:text-gray-900 transition-colors">썸머</Link>
    </div>
  </aside>
);

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
      case "important": return { label: "중요", className: "bg-red-100 text-red-600 border border-red-200" };
      case "event": return { label: "이벤트", className: "bg-green-100 text-green-600 border border-green-200" };
      case "system": return { label: "시스템", className: "bg-blue-100 text-blue-600 border border-blue-200" };
      default: return { label: "일반", className: "bg-gray-100 text-gray-500 border border-gray-200" };
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <div className="flex flex-1" style={{ paddingTop: "101px" }}>
        <CommunitySidebar active="notices" />

        {/* MAIN CONTENT */}
        <div className="flex-1 min-w-0 pb-20 lg:pb-8 px-4 lg:px-8 pt-6">

          {/* Section header */}
          <div className="flex items-center justify-between mb-4" style={{ maxWidth: 640 }}>
            <h2 className="text-[15px] font-bold text-gray-800">
              공지사항 <span className="text-gray-500 font-normal">{sortedNotices.length}</span>
            </h2>
          </div>

          {isLoading ? (
            <div className="border border-gray-200" style={{ maxWidth: 640 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-5 border-b border-gray-100 last:border-b-0 animate-pulse">
                  <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                </div>
              ))}
            </div>
          ) : notices.length === 0 ? (
            <div className="border border-gray-200 p-14 text-center" style={{ maxWidth: 640 }}>
              <Bell className="w-12 h-12 mx-auto mb-4 text-gray-200" />
              <h3 className="text-base font-medium text-gray-400 mb-1">등록된 공지사항이 없습니다</h3>
              <p className="text-sm text-gray-300">새로운 소식이 곧 올라올 예정입니다</p>
            </div>
          ) : (
            <div className="border border-gray-200" style={{ maxWidth: 640 }}>
              {/* Table header */}
              <div className="grid text-center text-[12px] text-gray-500 bg-gray-50 border-b border-gray-200 py-2.5 px-3"
                style={{ gridTemplateColumns: "1fr 90px 70px" }}>
                <div className="text-left">제목</div>
                <div>글쓴이</div>
                <div>조회수</div>
              </div>

              {sortedNotices.map((notice) => {
                const category = getCategoryLabel(notice.category);
                const isExpanded = expandedId === notice.id;

                return (
                  <div key={notice.id} className={cn("border-b border-gray-100 last:border-b-0", notice.isPinned ? "bg-orange-50/30" : "")} data-testid={`notice-${notice.id}`}>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : notice.id)}
                      className="w-full grid py-3.5 px-3 hover:bg-gray-50 transition-colors text-left"
                      style={{ gridTemplateColumns: "1fr 90px 70px" }}
                    >
                      <div className="flex items-center gap-2 pr-2">
                        {notice.isPinned && <Pin className="w-3 h-3 text-orange-400 flex-shrink-0" />}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 ${category.className}`}>{category.label}</span>
                        <span className="text-[13px] text-gray-800 truncate">{notice.title}</span>
                      </div>
                      <div className="text-[12px] text-gray-500 text-center self-center">BLOO</div>
                      <div className="text-[12px] text-gray-500 text-center self-center">{notice.viewCount || 0}</div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 py-4 bg-gray-50 border-t border-gray-100">
                        <div
                          className="prose prose-sm max-w-none text-gray-700 text-[13px] leading-relaxed [&_img]:max-w-full [&_p]:my-2"
                          dangerouslySetInnerHTML={{ __html: notice.content }}
                        />
                        <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
                          {notice.displayDate ? new Date(notice.displayDate).toLocaleDateString("ko-KR") : "-"}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>


    </div>
  );
}
