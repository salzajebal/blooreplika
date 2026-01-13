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

function getTimeBasedProgress() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  return totalMinutes / (24 * 60);
}

function getTodayVisitors() {
  const progress = getTimeBasedProgress();
  const minVisitors = 1200;
  const maxVisitors = 9000;
  const baseValue = minVisitors + Math.floor((maxVisitors - minVisitors) * progress);
  const randomVariation = Math.floor(Math.random() * 50) - 25;
  return Math.max(minVisitors, Math.min(maxVisitors, baseValue + randomVariation));
}

function getTodayPurchases() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const totalMinutes = hours * 60 + minutes;
  const progress = totalMinutes / (24 * 60);
  const maxPurchases = 70;
  const baseValue = Math.floor(maxPurchases * progress);
  const randomVariation = Math.floor(Math.random() * 3);
  return Math.max(0, Math.min(maxPurchases, baseValue + randomVariation));
}

function getRealTimeVisitors() {
  const min = 78;
  const max = 120;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function VisitorStats() {
  const [realTimeVisitors, setRealTimeVisitors] = useState(getRealTimeVisitors());
  const [todayVisitors, setTodayVisitors] = useState(getTodayVisitors());
  const [todayPurchases, setTodayPurchases] = useState(getTodayPurchases());
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const realTimeInterval = setInterval(() => {
      setRealTimeVisitors(getRealTimeVisitors());
    }, 3000);

    const statsInterval = setInterval(() => {
      setTodayVisitors(getTodayVisitors());
      setTodayPurchases(getTodayPurchases());
    }, 30000);

    return () => {
      clearInterval(realTimeInterval);
      clearInterval(statsInterval);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-1 text-xs">
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
        <Eye className="w-3.5 h-3.5 text-green-500" />
        <span className="text-gray-600">실시간 방문자수</span>
        <span className="font-bold text-green-600 ml-auto">{realTimeVisitors}</span>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
        <Users className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-gray-600">오늘 방문자수</span>
        <span className="font-bold text-blue-600 ml-auto">{todayVisitors.toLocaleString()}</span>
      </div>
      
      <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg px-3 py-2 flex items-center gap-2">
        <ShoppingBag className="w-3.5 h-3.5 text-red-500" />
        <span className="text-gray-600">오늘 구매자수</span>
        <span className="font-bold text-red-600 ml-auto">{todayPurchases}</span>
      </div>
      
      <button 
        onClick={() => setIsVisible(false)}
        className="bg-gray-800 text-white text-[10px] px-3 py-1.5 rounded-lg hover:bg-black transition-colors font-medium mt-1"
      >
        닫기
      </button>
    </div>
  );
}
