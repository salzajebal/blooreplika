import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Link, useLocation } from "wouter";

const sideMenuItems = [
  { name: "공지사항", path: "/notices" },
  { name: "FAQ", path: "/faq" },
  { name: "칼럼", path: "/comparison" },
  { name: "이벤트", path: "/events" },
  { name: "사용후기", path: "/reviews" },
];

const eventItems = [
  {
    id: 1,
    title: "2025년 새해 이벤트! 전상품 10% 할인",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_IlguY7zf_2a2ec227823a23036fee8e87148bb55d989a01cb.jpg",
    date: "2025.01.01 ~ 2025.01.31",
    status: "진행중"
  },
  {
    id: 2,
    title: "카카오톡 후기 이벤트 - 적립금 증정",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_uToNWSlO_363fd9122f4ea453ec31cd38d7314ad67bd6a59f.jpg",
    date: "상시 진행",
    status: "진행중"
  },
  {
    id: 3,
    title: "신규 회원가입 이벤트",
    imageUrl: "https://cdamdong.co.kr/data/file/kalreom/3034935948_RKLHxPJj_c5103cddd206b6bad4adb0f5dbfc64a30992f5ca.jpg",
    date: "상시 진행",
    status: "진행중"
  },
];

export default function Events() {
  const [location] = useLocation();

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <main>
        <div className="bg-gray-100 py-4">
          <div className="max-w-[1200px] mx-auto px-4">
            <h1 className="text-lg font-bold text-gray-800">이벤트</h1>
            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
              <Link href="/" className="hover:text-black">홈</Link>
              <span>&gt;</span>
              <span>고객센터</span>
              <span>&gt;</span>
              <span>이벤트</span>
            </div>
          </div>
        </div>

        <div className="max-w-[1200px] mx-auto px-4 py-8">
          <div className="flex gap-8">
            <aside className="hidden md:block w-48 flex-shrink-0">
              <nav className="border border-gray-200">
                {sideMenuItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.path}
                    className={`block px-4 py-3 text-sm border-b border-gray-200 last:border-b-0 ${
                      location === item.path 
                        ? 'bg-gray-900 text-white font-medium' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </aside>

            <div className="flex-1">
              <div className="mb-6">
                <p className="text-sm text-gray-600">
                  Total : <strong>{eventItems.length}</strong> items
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {eventItems.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 hover:border-gray-400 transition-colors"
                    data-testid={`event-item-${item.id}`}
                  >
                    <div className="aspect-[16/9] bg-gray-100 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.5'; }}
                      />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.status === "진행중" 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {item.status}
                        </span>
                      </div>
                      <h3 className="font-medium text-gray-900 mb-2 line-clamp-2">{item.title}</h3>
                      <p className="text-sm text-gray-500">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
