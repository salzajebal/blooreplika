import React from "react";
import { Switch, Route, useLocation, useParams } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WishlistProvider } from "@/contexts/WishlistContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import { MarketingPixels } from "@/components/MarketingPixels";
import { BottomNav } from "@/components/layout/BottomNav";
import { ChatWidget } from "@/components/layout/ChatWidget";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProductList from "@/pages/ProductList";
import ProductDetail from "@/pages/ProductDetail";
import { lazy, Suspense } from "react";
const Admin = lazy(() => import("@/pages/Admin"));
import Signup from "@/pages/Signup";
import Login from "@/pages/Login";
import Support from "@/pages/Support";
import Reviews from "@/pages/Reviews";
import Notices from "@/pages/Notices";
import Guide from "@/pages/Guide";
import Cart from "@/pages/Cart";
import Profile from "@/pages/Profile";
import Order from "@/pages/Order";
import About from "@/pages/About";
import Comparison from "@/pages/Comparison";
import FAQ from "@/pages/FAQ";
import Events from "@/pages/Events";
import Blog from "@/pages/Blog";
import Choice from "@/pages/Choice";
import OrderInquiry from "@/pages/OrderInquiry";
import ContentPage from "@/pages/ContentPage";
import Magazine from "@/pages/Magazine";
import Labs from "@/pages/Labs";
import Inspection from "@/pages/Inspection";
import Ranking from "@/pages/Ranking";

function BestPage() { return <ContentPage sectionType="best" />; }
function LivePage() { return <ContentPage sectionType="live" />; }
function MonthlyBenefitPage() { return <ContentPage sectionType="monthly_benefit" />; }
function OrderCompleteFallback() {
  const [, setLocation] = useLocation();
  const { orderNumber: orderNumParam } = useParams();
  const orderNum = orderNumParam || "";
  const [status, setStatus] = React.useState<"loading"|"success"|"failed"|"unknown">("loading");
  React.useEffect(() => {
    if (!orderNum) { setStatus("unknown"); return; }
    fetch(`/api/orders/status/${encodeURIComponent(orderNum)}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data?.paymentStatus === "paid") setStatus("success");
        else if (d.success && d.data?.paymentStatus === "failed") setStatus("failed");
        else setStatus("unknown");
      })
      .catch(() => setStatus("unknown"));
  }, [orderNum]);
  if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black rounded-full" /></div>;
  const isOk = status === "success";
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-4">
        <div className={`w-16 h-16 ${isOk ? "bg-green-100" : "bg-red-100"} rounded-full flex items-center justify-center mx-auto`}>
          {isOk
            ? <svg className="w-10 h-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            : <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          }
        </div>
        <h1 className="text-2xl font-bold">{isOk ? "결제가 완료되었습니다" : "결제 상태를 확인해주세요"}</h1>
        <p className="text-gray-600">{isOk ? "주문이 정상적으로 처리되었습니다." : "주문 내역에서 결제 상태를 확인하실 수 있습니다."}</p>
        {orderNum && <p className="text-sm text-gray-500">주문번호: <strong>{orderNum}</strong></p>}
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <button onClick={() => setLocation("/")} className="px-6 py-3 border rounded-lg hover:bg-gray-50">홈으로</button>
          <button onClick={() => setLocation("/profile")} className="px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800">주문 내역 확인</button>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/comparison/:id" component={Comparison} />
      <Route path="/comparison" component={Comparison} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/brands" component={ProductList} />
      <Route path="/products/:category" component={ProductList} />
      <Route path="/products" component={ProductList} />
      <Route path="/admin">{() => <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin w-8 h-8 border-4 border-gray-300 border-t-black rounded-full" /></div>}><Admin /></Suspense>}</Route>
      <Route path="/signup" component={Signup} />
      <Route path="/login" component={Login} />
      <Route path="/support" component={Support} />
      <Route path="/reviews/:id" component={Reviews} />
      <Route path="/reviews" component={Reviews} />
      <Route path="/notices/:id" component={Notices} />
      <Route path="/notices" component={Notices} />
      <Route path="/faq" component={FAQ} />
      <Route path="/events" component={Events} />
      <Route path="/blog/:id" component={Blog} />
      <Route path="/blog" component={Blog} />
      <Route path="/choice/:id" component={Choice} />
      <Route path="/choice" component={Choice} />
      <Route path="/best" component={BestPage} />
      <Route path="/live" component={LivePage} />
      <Route path="/benefits" component={MonthlyBenefitPage} />
      <Route path="/guide" component={Guide} />
      <Route path="/cart" component={Cart} />
      <Route path="/profile" component={Profile} />
      <Route path="/wishlist" component={Cart} />
      <Route path="/order-complete/:orderNumber" component={OrderCompleteFallback} />
      <Route path="/order/:id" component={Order} />
      <Route path="/orders" component={OrderInquiry} />
      <Route path="/search" component={ProductList} />
      <Route path="/magazine/:id" component={Magazine} />
      <Route path="/magazine" component={Magazine} />
      <Route path="/labs" component={Labs} />
      <Route path="/inspection" component={Inspection} />
      <Route path="/ranking" component={Ranking} />
      <Route component={NotFound} />
    </Switch>
  );
}


function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <WishlistProvider>
          <TooltipProvider>
            <Toaster />
            <MarketingPixels />
            <Router />
            <BottomNav />
            <ChatWidget />
          </TooltipProvider>
        </WishlistProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
