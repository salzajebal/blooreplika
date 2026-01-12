import { useState, useEffect } from "react";
import { Users, ShoppingBag, Eye } from "lucide-react";

function getDailyRandomSeed() {
  const today = new Date();
  return today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function getDailyRandomNumber(min: number, max: number, offset: number = 0) {
  const seed = getDailyRandomSeed() + offset;
  return Math.floor(seededRandom(seed) * (max - min + 1)) + min;
}

export function VisitorStats() {
  const [realTimeVisitors, setRealTimeVisitors] = useState(0);
  const [todayVisitors, setTodayVisitors] = useState(0);
  const [todayPurchases, setTodayPurchases] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const baseTodayVisitors = getDailyRandomNumber(800, 1500, 1);
    const baseTodayPurchases = getDailyRandomNumber(8, 25, 2);
    
    setTodayVisitors(baseTodayVisitors);
    setTodayPurchases(baseTodayPurchases);
    
    const baseRealTime = getDailyRandomNumber(8, 20, 3);
    setRealTimeVisitors(baseRealTime);
    
    const interval = setInterval(() => {
      setRealTimeVisitors(prev => {
        const change = Math.floor(Math.random() * 5) - 2;
        const newValue = prev + change;
        return Math.max(5, Math.min(30, newValue));
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-1 text-xs">
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-green-500" />
        <span className="text-gray-600">실시간 방문자수</span>
        <span className="font-bold text-green-600 ml-auto">{realTimeVisitors}</span>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-gray-600">오늘 방문자수</span>
        <span className="font-bold text-blue-600 ml-auto">{todayVisitors.toLocaleString()}</span>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
        <ShoppingBag className="w-3.5 h-3.5 text-red-500" />
        <span className="text-gray-600">오늘 구매자수</span>
        <span className="font-bold text-red-600 ml-auto">{todayPurchases}</span>
      </div>
      
      <button 
        onClick={() => setIsVisible(false)}
        className="text-[10px] text-gray-400 hover:text-gray-600 text-center mt-1"
      >
        닫기
      </button>
    </div>
  );
}
