import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Trash2, ShoppingBag, Heart, ArrowRight } from "lucide-react";
import { Link } from "wouter";
import { useWishlist } from "@/contexts/WishlistContext";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop";

export default function Cart() {
  const { items, removeItem, clearWishlist } = useWishlist();
  const { toast } = useToast();

  const handleRemove = (id: number, name: string) => {
    removeItem(id);
    toast({
      title: "삭제 완료",
      description: `${name}이(가) 찜 목록에서 삭제되었습니다.`,
    });
  };

  const totalPrice = items.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/,/g, ""), 10) || 0;
    return sum + price;
  }, 0);

  return (
    <div className="min-h-screen bg-white font-sans">
      <Header />

      <main className="container-custom py-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <Heart className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900" data-testid="text-cart-title">찜 목록</h1>
          </div>

          {items.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-lg">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg mb-2">찜한 상품이 없습니다</p>
              <p className="text-gray-400 text-sm mb-6">하트 아이콘을 눌러 마음에 드는 상품을 담아보세요</p>
              <Link href="/">
                <Button className="bg-primary hover:bg-primary/90">
                  쇼핑 계속하기
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6 pb-4 border-b">
                <p className="text-gray-600">
                  총 <span className="font-bold text-primary">{items.length}</span>개의 상품
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    clearWishlist();
                    toast({ title: "전체 삭제 완료", description: "찜 목록이 비워졌습니다." });
                  }}
                  data-testid="button-clear-cart"
                >
                  전체 삭제
                </Button>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex gap-4 p-4 bg-white border rounded-lg hover:shadow-md transition-shadow"
                    data-testid={`cart-item-${item.id}`}
                  >
                    <Link href={`/product/${item.id}`}>
                      <div className="w-24 h-24 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                        <img 
                          src={item.imageUrl || DEFAULT_IMAGE} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </Link>
                    
                    <div className="flex-1 min-w-0">
                      <Link href={`/product/${item.id}`}>
                        <h3 className="font-bold text-gray-900 hover:text-primary transition-colors line-clamp-2">
                          {item.name}
                        </h3>
                      </Link>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.purity} / {item.weight}
                      </div>
                      <div className="mt-2">
                        <span className="text-lg font-bold text-primary">{item.price}</span>
                        <span className="text-sm text-gray-500">원</span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.id, item.name)}
                        className="text-gray-400 hover:text-red-500"
                        data-testid={`button-remove-${item.id}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-gray-600">총 상품 금액</span>
                  <span className="text-2xl font-bold text-primary">
                    {totalPrice.toLocaleString()}원
                  </span>
                </div>
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
                  data-testid="button-checkout"
                >
                  구매하기
                </Button>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
