import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WishlistProvider } from "@/contexts/WishlistContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import ProductList from "@/pages/ProductList";
import ProductDetail from "@/pages/ProductDetail";
import Admin from "@/pages/Admin";
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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/comparison/:id" component={Comparison} />
      <Route path="/comparison" component={Comparison} />
      <Route path="/product/:id" component={ProductDetail} />
      <Route path="/products/:category" component={ProductList} />
      <Route path="/products" component={ProductList} />
      <Route path="/admin" component={Admin} />
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
      <Route path="/guide" component={Guide} />
      <Route path="/cart" component={Cart} />
      <Route path="/profile" component={Profile} />
      <Route path="/wishlist" component={Cart} />
      <Route path="/order/:id" component={Order} />
      <Route path="/orders" component={OrderInquiry} />
      <Route path="/search" component={ProductList} />
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
            <Router />
          </TooltipProvider>
        </WishlistProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
